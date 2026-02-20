import type { ClassifierResult } from './prompts/classifier';

export function mockClassifierResult(transcript: string): ClassifierResult {
  const lower = transcript.toLowerCase();

  const isEmergency =
    lower.includes('flood') ||
    lower.includes('no heat') ||
    lower.includes('no ac') ||
    lower.includes('emergency') ||
    lower.includes('burst');

  const category = lower.includes('heat') || lower.includes('ac') || lower.includes('hvac')
    ? 'HVAC'
    : lower.includes('plumb') || lower.includes('pipe') || lower.includes('drain') || lower.includes('toilet')
      ? 'PLUMBING'
      : lower.includes('electric') || lower.includes('outlet') || lower.includes('breaker')
        ? 'ELECTRICAL'
        : lower.includes('roof')
          ? 'ROOFING'
          : 'GENERAL';

  return {
    intent: isEmergency ? 'EMERGENCY' : 'SCHEDULE_SERVICE',
    serviceCategory: category,
    urgency: isEmergency ? 'EMERGENCY' : 'WITHIN_WEEK',
    summary: 'Customer called to schedule service. Details to be confirmed on callback.',
    suggestedJobTitle: `${category} Service Request`,
    confidence: 0.6,
  };
}

export function mockVoiceResponse(): string {
  return "Thank you for calling. I've noted your service request and one of our technicians will call you back within the hour to confirm your appointment. Is there anything else I can help you with?";
}
