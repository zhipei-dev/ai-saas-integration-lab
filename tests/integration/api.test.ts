import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app.js';
import { AppDb } from '../../src/server/db.js';
import { MockAiProvider, type AiProvider } from '../../src/server/provider.js';

const databases: AppDb[] = [];

function app(provider: AiProvider = new MockAiProvider()) {
  const db = new AppDb(':memory:');
  databases.push(db);
  return createApp(db, provider);
}

afterEach(() => databases.splice(0).forEach((db) => db.close()));

const validCase = {
  subject: 'Login outage',
  customerEmail: 'person@example.test',
  description: 'Customers cannot log in to the synthetic service.',
};

describe('workflow API', () => {
  it('creates, suggests, approves, and audits', async () => {
    const api = app();
    const created = await request(api).post('/api/cases').send(validCase).expect(201);
    const id = created.body.id;

    await request(api).post(`/api/cases/${id}/suggestion`).send({}).expect(200);
    await request(api).post(`/api/cases/${id}/decision`).send({ decision: 'approved' }).expect(200);

    const detail = await request(api).get(`/api/cases/${id}`).expect(200);
    expect(detail.body.status).toBe('approved');
    expect(detail.body.timeline.map((event: { eventType: string }) => event.eventType)).toEqual([
      'case.created',
      'ai.suggestion_created',
      'approval.approved',
    ]);
  });

  it('rejects malformed, oversized, and invalid-path requests without internals', async () => {
    const api = app();

    await request(api).post('/api/cases').send({}).expect(400, { error: 'Invalid request' });
    await request(api)
      .post('/api/cases')
      .set('content-type', 'application/json')
      .send('{bad')
      .expect(400, { error: 'Invalid request' });

    await request(api)
      .post('/api/cases')
      .send({
        subject: 'Large request',
        customerEmail: 'person@example.test',
        description: 'x'.repeat(40_000),
      })
      .expect(413, { error: 'Request body too large' });

    await request(api).get('/api/cases/nope').expect(400, { error: 'Invalid case id' });
    await request(api).post('/api/cases/0/suggestion').send({}).expect(400, { error: 'Invalid case id' });
  });

  it('does not reopen a terminal case, repeat a decision, or invoke the provider again', async () => {
    const provider = new MockAiProvider();
    const suggestSpy = vi.spyOn(provider, 'suggest');
    const api = app(provider);

    const created = await request(api).post('/api/cases').send(validCase).expect(201);
    const id = created.body.id;

    await request(api).post(`/api/cases/${id}/suggestion`).send({}).expect(200);
    await request(api).post(`/api/cases/${id}/decision`).send({ decision: 'rejected' }).expect(200);

    await request(api)
      .post(`/api/cases/${id}/suggestion`)
      .send({})
      .expect(409, { error: 'Case is not open' });

    await request(api)
      .post(`/api/cases/${id}/decision`)
      .send({ decision: 'approved' })
      .expect(409, { error: 'Case is not awaiting approval' });

    expect(suggestSpy).toHaveBeenCalledTimes(1);
  });
});
