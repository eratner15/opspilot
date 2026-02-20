export interface ClassifierInput {
  transcript: string;
  callerPhone: string; // pre-redacted
  businessType?: string; // e.g. "HVAC"
}

export interface ClassifierResult {
  intent: 'SCHEDULE_SERVICE' | 'EMERGENCY' | 'QUOTE_REQUEST' | 'FOLLOW_UP' | 'COMPLAINT' | 'OTHER';
  serviceCategory: 'HVAC' | 'PLUMBING' | 'ELECTRICAL' | 'ROOFING' | 'GENERAL' | 'UNKNOWN';
  urgency: 'EMERGENCY' | 'SAME_DAY' | 'WITHIN_WEEK' | 'FLEXIBLE';
  summary: string; // 1-2 sentences, NO PII
  suggestedJobTitle: string; // short, e.g. "AC Not Cooling - Residential"
  extractedAddress?: string; // street address if mentioned, no name/phone
  estimatedDuration?: number; // minutes
  confidence: number; // 0-1
}

export const CLASSIFIER_SYSTEM_PROMPT = `You are an AI dispatcher for a trades business (HVAC, plumbing, electrical, roofing).
Analyze the call transcript and extract structured dispatch information.

CRITICAL: Do NOT include customer names, phone numbers, or any PII in your response.
Output ONLY valid JSON matching the ClassifierResult schema — no extra text.`;

export function buildClassifierPrompt(input: ClassifierInput): string {
  return `Business type: ${input.businessType ?? 'trades'}
Caller: [REDACTED]

Transcript:
${input.transcript}

Return JSON:
{
  "intent": "SCHEDULE_SERVICE" | "EMERGENCY" | "QUOTE_REQUEST" | "FOLLOW_UP" | "COMPLAINT" | "OTHER",
  "serviceCategory": "HVAC" | "PLUMBING" | "ELECTRICAL" | "ROOFING" | "GENERAL" | "UNKNOWN",
  "urgency": "EMERGENCY" | "SAME_DAY" | "WITHIN_WEEK" | "FLEXIBLE",
  "summary": "Brief description of the issue, no PII",
  "suggestedJobTitle": "Short job title for dispatch",
  "extractedAddress": "street address only if clearly stated, omit otherwise",
  "estimatedDuration": 60,
  "confidence": 0.0-1.0
}`;
}
