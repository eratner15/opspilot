import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/lib/db';
import { parseFormBody, validateTwilioSignature, buildTwiML } from '@/server/services/twilio/validate';
import { sendDispatchSms, matchTechnician } from '@/server/services/dispatch';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const params = parseFormBody(body);

  const fromPhone = params['From'] ?? '';
  const toPhone = params['To'] ?? '';
  const messageBody = (params['Body'] ?? '').trim().toUpperCase();

  let env: CloudflareEnv;
  try {
    ({ env } = await getCloudflareContext());
  } catch {
    // Dev fallback — return empty TwiML
    return buildTwiML('');
  }

  // Verify Twilio signature
  const authToken = env.TWILIO_AUTH_TOKEN;
  if (authToken) {
    const signature = req.headers.get('X-Twilio-Signature') ?? '';
    const url = new URL(req.url).toString();
    const valid = await validateTwilioSignature(authToken, url, params, signature);
    if (!valid) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const db = createDb(env.DB);

  // Find org by Twilio number
  const org = await db.organization.findFirst({
    where: { twilioPhone: toPhone },
  });
  if (!org) return buildTwiML('');

  // Look up technician by phone
  const tech = await db.technician.findFirst({
    where: { organizationId: org.id, phone: fromPhone },
  });

  if (!tech) {
    // Not a known tech — ignore silently
    return buildTwiML('');
  }

  // Find the most recent job dispatched to this tech with status SCHEDULED
  const latestJob = await db.job.findFirst({
    where: {
      organizationId: org.id,
      technicianId: tech.id,
      status: 'SCHEDULED',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!latestJob) {
    return buildTwiML('');
  }

  const now = new Date().toISOString();

  if (messageBody === 'YES' || messageBody === 'Y') {
    // Tech confirmed — keep as SCHEDULED
    await db.job.update({
      where: { id: latestJob.id },
      data: { updatedAt: now },
    });

    // Acknowledge to tech
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
      await sendDispatchSms(
        env.TWILIO_ACCOUNT_SID,
        env.TWILIO_AUTH_TOKEN,
        env.TWILIO_PHONE_NUMBER,
        fromPhone,
        `Got it! Job ${latestJob.jobNumber} confirmed. Customer: ${latestJob.title}. Drive safe!`
      ).catch(() => { /* non-critical */ });
    }

  } else if (messageBody === 'NO' || messageBody === 'N') {
    // Tech declined — unassign, flag for reassignment
    await db.job.update({
      where: { id: latestJob.id },
      data: {
        technicianId: null,
        status: 'NEW',
        notes: (latestJob.notes ? latestJob.notes + '\n' : '') +
          `[AUTO] Tech ${tech.firstName} ${tech.lastName} declined at ${now}`,
        updatedAt: now,
      },
    });

    // Try to find next available tech
    const nextTechId = await matchTechnician(db, org.id, latestJob.category);
    if (
      nextTechId &&
      nextTechId !== tech.id &&
      env.TWILIO_ACCOUNT_SID &&
      env.TWILIO_AUTH_TOKEN &&
      env.TWILIO_PHONE_NUMBER
    ) {
      const nextTech = await db.technician.findUnique({ where: { id: nextTechId } });
      if (nextTech) {
        await db.job.update({
          where: { id: latestJob.id },
          data: {
            technicianId: nextTechId,
            status: 'SCHEDULED',
            updatedAt: new Date().toISOString(),
          },
        });

        const techMsg =
          `New job assigned: ${latestJob.title}\n` +
          `Priority: ${latestJob.priority}\n` +
          `Reply YES to confirm or NO to decline.\n` +
          `Job ID: ${latestJob.id.slice(-6)}`;

        await sendDispatchSms(
          env.TWILIO_ACCOUNT_SID,
          env.TWILIO_AUTH_TOKEN,
          env.TWILIO_PHONE_NUMBER,
          nextTech.phone,
          techMsg
        ).catch(() => { /* non-critical */ });
      }
    }

    // Acknowledge declining tech
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
      await sendDispatchSms(
        env.TWILIO_ACCOUNT_SID,
        env.TWILIO_AUTH_TOKEN,
        env.TWILIO_PHONE_NUMBER,
        fromPhone,
        `Understood. Job ${latestJob.jobNumber} has been reassigned. Thank you!`
      ).catch(() => { /* non-critical */ });
    }
  }
  // Unknown reply — ignore silently

  // Return empty TwiML (no verbal response needed for SMS)
  return buildTwiML('');
}
