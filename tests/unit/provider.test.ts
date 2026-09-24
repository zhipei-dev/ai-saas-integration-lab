import { describe, expect, it, vi } from 'vitest';
import { MockAiProvider, OpenAiCompatibleProvider, makeProvider, suggestionSchema } from '../../src/server/provider.js';

const supportCase = {
  id: 1, subject: 'Service outage', customerEmail: 'a@example.test',
  description: 'Our service is down and customers cannot log in.', status: 'open' as const, createdAt: 'now',
};

describe('AI providers', () => {
  it('returns a deterministic, schema-valid mock suggestion', async () => {
    const provider = new MockAiProvider();
    const first = await provider.suggest(supportCase);
    expect(first).toEqual(await provider.suggest(supportCase));
    expect(suggestionSchema.parse(first).priority).toBe('high');
  });

  it('fails fast for incomplete or unknown provider configuration', () => {
    expect(() => makeProvider({ AI_PROVIDER: 'openai' })).toThrow('OPENAI_BASE_URL');
    expect(() => makeProvider({ AI_PROVIDER: 'other' })).toThrow('Unsupported AI_PROVIDER');
  });

  it('retries a transient provider failure at most once', async () => {
    const fetchStub = vi.fn()
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ priority: 'high', classification: 'outage', draftReply: 'We are investigating the reported outage now.', confidence: 0.9 }) } }] }), { status: 200 }));
    const provider = new OpenAiCompatibleProvider('https://example.test/v1', 'not-logged', 'test', fetchStub);
    await expect(provider.suggest(supportCase)).resolves.toMatchObject({ priority: 'high' });
    expect(fetchStub).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-retryable 4xx responses', async () => {
    const fetchStub = vi.fn().mockResolvedValue(new Response('bad request', { status: 400 }));
    const provider = new OpenAiCompatibleProvider('https://example.test/v1', 'not-logged', 'test', fetchStub);
    await expect(provider.suggest(supportCase)).rejects.toThrow('400');
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });
});
