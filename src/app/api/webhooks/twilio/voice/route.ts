import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/lib/db';
import { parseFormBody, validateTwilioSignature, buildTwiML } from '@/server/services/twilio/validate';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const params = parseFormBody(body);

  const callSid = params['CallSid'] ?? '';
  const fromPhone = params['From'] ?? '';
  const toPhone = params['To'] ?? '';

  // Get Cloudflare env
  let env: CloudflareEnv;
  try {
    ({ env } = await getCloudflareContext());
  } catch {
    // Dev fallback — skip validation, return simple TwiML
    return buildTwiML(
      `<Say voice="Polly.Joanna">Thank you for calling. Please describe your service request after the tone.</Say>` +
      `<Gather input="speech" timeout="10" speechTimeout="auto" action="/api/webhooks/twilio/voice/gather" method="POST">` +
      `<Say voice="Polly.Joanna">How can we help you today?</Say>` +
      `</Gather>` +
      `<Say voice="Polly.Joanna">We're sorry, we did not receive your response. We will call you back shortly. Goodbye.</Say>`
    );
  }

  // Verify Twilio signature (skip in dev if no auth token)
  const authToken = env.TWILIO_AUTH_TOKEN;
  if (authToken) {
    const signature = req.headers.get('X-Twilio-Signature') ?? '';
    const url = new URL(req.url).toString();
    const valid = await validateTwilioSignature(authToken, url, params, signature);
    if (!valid) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  const db = createDb(env.DB);

  // Look up org by Twilio phone number
  const org = await db.organization.findFirst({
    where: { twilioPhone: toPhone },
  });

  if (!org) {
    // No org configured for this number — hang up gracefully
    return buildTwiML(
      `<Say>This number is not in service. Goodbye.</Say><Hangup/>`
    );
  }

  // Look up customer by phone
  const customer = await db.customer.findFirst({
    where: {
      organizationId: org.id,
      phone: fromPhone,
    },
  });

  // Create Call record
  const callId = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.call.create({
    data: {
      id: callId,
      organizationId: org.id,
      customerId: customer?.id ?? null,
      fromPhone, // stored; NOT logged to console
      toPhone,
      twilioCallSid: callSid,
      status: 'INCOMING',
      createdAt: now,
      updatedAt: now,
    },
  });

  // Return TwiML: greet and gather speech
  const orgName = org.name;
  const gatherUrl = `/api/webhooks/twilio/voice/gather?callId=${callId}&orgId=${org.id}`;

  return buildTwiML(
    `<Gather input="speech" timeout="10" speechTimeout="auto" action="${gatherUrl}" method="POST">` +
    `<Say voice="Polly.Joanna">Thank you for calling ${orgName}. How can I help you today?</Say>` +
    `</Gather>` +
    `<Say voice="Polly.Joanna">We're sorry, we didn't catch that. Please call back or we will call you back shortly. Goodbye.</Say>`
  );
}
