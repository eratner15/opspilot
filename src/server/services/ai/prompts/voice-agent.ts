export interface VoiceAgentContext {
  businessName: string;
  businessType: string; // e.g. "HVAC company"
  callerIsKnown: boolean;
  currentTime: string; // e.g. "Tuesday afternoon"
  afterHours: boolean;
}

export const VOICE_AGENT_SYSTEM_PROMPT = `You are a friendly, professional AI receptionist for a trades business.
Your job is to greet callers, gather service request details, and confirm they'll be contacted by the team.

Rules:
- Be warm, professional, and concise
- Gather: type of problem, address, best callback time
- For emergencies: acknowledge urgency, promise immediate callback
- NEVER promise specific prices or guarantee same-day availability
- NEVER mention that you are AI unless directly asked
- After gathering info, say you'll have someone call back within [window]`;

export function buildVoiceGreeting(ctx: VoiceAgentContext): string {
  const greeting = ctx.afterHours
    ? `Thank you for calling ${ctx.businessName}. Our office is currently closed, but I can take your information and have someone call you first thing in the morning.`
    : `Thank you for calling ${ctx.businessName}. How can I help you today?`;
  return greeting;
}

export function buildVoiceAgentPrompt(ctx: VoiceAgentContext, transcript: string): string {
  return `Business: ${ctx.businessName} (${ctx.businessType})
Time: ${ctx.currentTime}${ctx.afterHours ? ' (after hours)' : ''}
Caller: ${ctx.callerIsKnown ? 'returning customer' : 'new caller'}

Conversation so far:
${transcript}

Generate the next AI response to continue gathering service request information.
Be concise (1-3 sentences). Ask for any missing: problem description, service address, callback preference.
If you have enough info, confirm you'll have someone call back and end gracefully.`;
}
