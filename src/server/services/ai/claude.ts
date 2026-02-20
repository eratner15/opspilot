import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface ClaudeResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number; // in cents
}

// Cost per million tokens in cents (Sonnet 4 pricing)
const INPUT_COST_PER_M = 300;  // $3.00/M
const OUTPUT_COST_PER_M = 1500; // $15.00/M

function calcCostCents(inputTokens: number, outputTokens: number): number {
  return Math.round(
    (inputTokens / 1_000_000) * INPUT_COST_PER_M +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_M
  );
}

export async function callClaude(
  apiKey: string,
  messages: ClaudeMessage[],
  options: ClaudeOptions = {}
): Promise<ClaudeResponse> {
  const {
    model = 'claude-sonnet-4-6',
    maxTokens = 1024,
    temperature,
    systemPrompt,
  } = options;

  const client = new Anthropic({ apiKey });

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        ...(temperature !== undefined && { temperature }),
        ...(systemPrompt && { system: systemPrompt }),
        messages,
      });

      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const content =
        response.content[0]?.type === 'text' ? response.content[0].text : '';

      return {
        content,
        inputTokens,
        outputTokens,
        costCents: calcCostCents(inputTokens, outputTokens),
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error('Claude API failed after 3 attempts');
}

export async function callClaudeJSON<T>(
  apiKey: string,
  messages: ClaudeMessage[],
  options: ClaudeOptions = {}
): Promise<T & { _usage: { inputTokens: number; outputTokens: number; costCents: number } }> {
  const result = await callClaude(apiKey, messages, {
    ...options,
    maxTokens: options.maxTokens ?? 2048,
  });

  // Extract JSON from response (may be wrapped in markdown code block)
  const jsonMatch =
    result.content.match(/```(?:json)?\s*([\s\S]*?)```/) ??
    result.content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);

  const jsonStr = jsonMatch ? jsonMatch[1] : result.content;

  const parsed = JSON.parse(jsonStr.trim()) as T;
  return {
    ...parsed,
    _usage: {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costCents: result.costCents,
    },
  };
}
