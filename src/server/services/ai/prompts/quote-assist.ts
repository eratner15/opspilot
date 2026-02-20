export interface QuoteAssistInput {
  jobDescription: string;
  category: string; // HVAC | PLUMBING | ELECTRICAL | ROOFING | OTHER
  customerType: string; // RESIDENTIAL | COMMERCIAL
}

export interface SuggestedLineItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
  notes?: string;
}

export interface QuoteAssistResult {
  lineItems: SuggestedLineItem[];
  notes?: string;
}

export const QUOTE_ASSIST_SYSTEM = `You are an expert estimator for trades businesses (HVAC, plumbing, electrical, roofing).
Given a job description, suggest realistic line items with quantities and pricing for a service quote.

Return valid JSON in this exact format:
{
  "lineItems": [
    {
      "description": "Service description",
      "quantity": 1,
      "unitPriceCents": 15000,
      "notes": "Optional note about this item"
    }
  ],
  "notes": "Optional overall notes or warranty info"
}

Pricing guidelines:
- Labor: $75-150/hr residential, $100-200/hr commercial
- Service call / diagnostic: $89-150
- Parts: use realistic market prices
- HVAC tune-up: $89-149
- AC repair: varies by part
- Return all prices as integer cents (e.g., $150.00 = 15000)
- Suggest 2-5 line items appropriate to the job
- Be specific and professional`;

export function buildQuoteAssistPrompt(input: QuoteAssistInput): string {
  return `Please suggest quote line items for this job:

Job Description: ${input.jobDescription}
Category: ${input.category}
Customer Type: ${input.customerType}

Return JSON with realistic line items and pricing for a professional service quote.`;
}
