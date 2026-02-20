import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/lib/db';
import { parseFormBody, validateTwilioSignature, buildTwiML } from '@/server/services/twilio/validate';
import { callClaudeJSON } from '@/server/services/ai/claude';
import { buildClassifierPrompt, CLASSIFIER_SYSTEM_PROMPT, type ClassifierResult } from '@/server/services/ai/prompts/classifier';
import { mockClassifierResult } from '@/server/services/ai/mock';
import { dispatchJob } from '@/server/services/dispatch';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const callId = url.searchParams.get('callId') ?? '';
  const orgId = url.searchParams.get('orgId') ?? '';

  const body = await req.text();
  const params = parseFormBody(body);
  const transcript = params['SpeechResult'] ?? '';

  if (!callId || !orgId) {
    return buildTwiML(`<Say>Thank you. We will call you back shortly. Goodbye.</Say><Hangup/>`);
  }

  let env: CloudflareEnv;
  try {
    ({ env } = await getCloudflareContext());
  } catch {
    return buildTwiML(
      `<Say voice="Polly.Joanna">Thank you for that information. One of our technicians will call you back shortly. Goodbye.</Say><Hangup/>`
    );
  }

  // Verify Twilio signature
  const authToken = env.TWILIO_AUTH_TOKEN;
  if (authToken) {
    const signature = req.headers.get('X-Twilio-Signature') ?? '';
    const valid = await validateTwilioSignature(authToken, url.toString(), params, signature);
    if (!valid) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  const db = createDb(env.DB);

  // Update call with transcript
  const now = new Date().toISOString();
  await db.call.update({
    where: { id: callId },
    data: {
      transcript,
      status: 'ANSWERED',
      updatedAt: now,
    },
  });

  // Classify with Claude (or mock)
  let analysis: ClassifierResult;
  try {
    if (env.ANTHROPIC_API_KEY && transcript) {
      analysis = await callClaudeJSON<ClassifierResult>(
        env.ANTHROPIC_API_KEY,
        [{ role: 'user', content: buildClassifierPrompt({ transcript, callerPhone: '[REDACTED]' }) }],
        { systemPrompt: CLASSIFIER_SYSTEM_PROMPT, maxTokens: 512 }
      );
    } else {
      analysis = mockClassifierResult(transcript);
    }
  } catch {
    analysis = mockClassifierResult(transcript);
  }

  // Update call with AI analysis
  await db.call.update({
    where: { id: callId },
    data: {
      aiAnalysisJson: JSON.stringify(analysis),
      updatedAt: new Date().toISOString(),
    },
  });

  // Auto-create job for scheduling intents
  if (
    analysis.intent === 'SCHEDULE_SERVICE' ||
    analysis.intent === 'EMERGENCY' ||
    analysis.intent === 'QUOTE_REQUEST'
  ) {
    const call = await db.call.findUnique({ where: { id: callId } });
    if (call) {
      const jobId = crypto.randomUUID();
      const jobNow = new Date().toISOString();
      const date = new Date();
      const yr = date.getFullYear().toString().slice(-2);
      const mo = (date.getMonth() + 1).toString().padStart(2, '0');
      const rnd = Math.floor(Math.random() * 9000 + 1000);
      const jobNumber = `J${yr}${mo}-${rnd}`;
      await db.job.create({
        data: {
          id: jobId,
          organizationId: orgId,
          customerId: call.customerId ?? null,
          jobNumber,
          title: analysis.suggestedJobTitle,
          description: analysis.summary,
          category: analysis.serviceCategory,
          status: 'NEW',
          priority: analysis.urgency === 'EMERGENCY' ? 'EMERGENCY' : analysis.urgency === 'SAME_DAY' ? 'HIGH' : 'NORMAL',
          callId,
          createdAt: jobNow,
          updatedAt: jobNow,
        },
      });

      // Link job back to call
      await db.call.update({
        where: { id: callId },
        data: { jobId, updatedAt: new Date().toISOString() },
      });

      // Dispatch technician (fire and forget — don't block TwiML response)
      dispatchJob(db, jobId, orgId, {
        accountSid: env.TWILIO_ACCOUNT_SID,
        authToken: env.TWILIO_AUTH_TOKEN,
        fromPhone: env.TWILIO_PHONE_NUMBER,
      }).catch(() => {
        // Non-critical — caller already has confirmation
      });
    }
  }

  // Respond to caller
  const isEmergency = analysis.urgency === 'EMERGENCY';
  const callbackWindow = isEmergency ? 'within 30 minutes' : 'within 2 hours';

  return buildTwiML(
    `<Say voice="Polly.Joanna">Thank you for that information. We have received your request and a technician will call you back ${callbackWindow}. Have a great day. Goodbye.</Say><Hangup/>`
  );
}
