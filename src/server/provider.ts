import { z } from 'zod';
import type { Suggestion, SupportCase } from './types.js';

export const suggestionSchema = z.object({
  priority: z.enum(['low', 'medium', 'high']),
  classification: z.string().min(2).max(80),
  draftReply: z.string().min(10).max(2000),
  confidence: z.number().min(0).max(1),
});

export interface AiProvider {
  name: string;
  suggest(supportCase: SupportCase): Promise<Suggestion>;
}

export class MockAiProvider implements AiProvider {
  name = 'mock';

  async suggest(supportCase: SupportCase): Promise<Suggestion> {
    const text = `${supportCase.subject} ${supportCase.description}`.toLowerCase();
    const urgent = /refund|down|outage|urgent|cannot/.test(text);

    return {
      priority: urgent ? 'high' : 'medium',
      classification: urgent ? 'service_issue' : 'general_support',
      draftReply: `Hello, thanks for contacting support about "${supportCase.subject}". We have logged your case and will review it shortly.`,
      confidence: urgent ? 0.91 : 0.78,
    };
  }
}

class HttpStatusError extends Error {
  constructor(readonly status: number) {
    super(`AI request failed (${status})`);
  }
}

export class OpenAiCompatibleProvider implements AiProvider {
  name = 'openai-compatible';

  constructor(
    private readonly baseUrl: string,
    private readonly key: string,
    private readonly model: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async suggest(supportCase: SupportCase): Promise<Suggestion> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        return await this.requestOnce(supportCase);
      } catch (error) {
        lastError = error;
        if (!this.shouldRetry(error) || attempt === 2) throw error;
      }
    }
    throw lastError;
  }

  private async requestOnce(supportCase: SupportCase): Promise<Suggestion> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.key}`,
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [{
            role: 'user',
            content: `Classify this support case and return JSON priority, classification, draftReply, confidence:\n${supportCase.subject}\n${supportCase.description}`,
          }],
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new HttpStatusError(response.status);

      const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      return suggestionSchema.parse(JSON.parse(body.choices?.[0]?.message?.content ?? '{}'));
    } finally {
      clearTimeout(timer);
    }
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof HttpStatusError) {
      return error.status >= 500 || error.status === 408 || error.status === 429;
    }
    return true;
  }
}

export function makeProvider(env: NodeJS.ProcessEnv = process.env): AiProvider {
  const provider = env.AI_PROVIDER ?? 'mock';
  if (provider === 'mock') return new MockAiProvider();
  if (provider !== 'openai') throw new Error(`Unsupported AI_PROVIDER: ${provider}`);

  const missing = ['OPENAI_BASE_URL', 'OPENAI_API_KEY', 'OPENAI_MODEL'].filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`AI_PROVIDER=openai requires ${missing.join(', ')}`);
  }
  return new OpenAiCompatibleProvider(env.OPENAI_BASE_URL!, env.OPENAI_API_KEY!, env.OPENAI_MODEL!);
}
