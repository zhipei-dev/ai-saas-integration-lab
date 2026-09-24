import express, { type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { InvalidCaseStateError, type AppDb } from './db.js';
import type { AiProvider } from './provider.js';
import { generateSuggestion } from './service.js';

const createSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  customerEmail: z.string().email().max(254),
  description: z.string().trim().min(10).max(4000),
});
const decisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  note: z.string().trim().max(500).optional(),
});

function parseCaseId(value: string): number | undefined {
  if (!/^\d+$/.test(value)) return undefined;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

function requireCaseId(request: Request, response: Response): number | undefined {
  const value = request.params.id;
  const id = typeof value === 'string' ? parseCaseId(value) : undefined;
  if (!id) response.status(400).json({ error: 'Invalid case id' });
  return id;
}

export function createApp(db: AppDb, provider: AiProvider) {
  const app = express();
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_request, response) => response.json({ ok: true }));
  app.get('/api/cases', (_request, response) => response.json(db.listCases()));

  app.post('/api/cases', (request, response, next) => {
    try {
      response.status(201).json(db.createCase(createSchema.parse(request.body)));
    } catch (error) { next(error); }
  });

  app.get('/api/cases/:id', (request, response) => {
    const id = requireCaseId(request, response);
    if (!id) return;
    const supportCase = db.getCase(id);
    if (!supportCase) return response.status(404).json({ error: 'Case not found' });
    response.json({
      ...supportCase,
      suggestion: db.latestSuggestion(id),
      timeline: db.timeline(id),
    });
  });

  app.post('/api/cases/:id/suggestion', async (request, response, next) => {
    const id = requireCaseId(request, response);
    if (!id) return;
    try {
      const suggestion = await generateSuggestion(db, provider, id);
      if (!suggestion) return response.status(404).json({ error: 'Case not found' });
      response.json(suggestion);
    } catch (error) { next(error); }
  });

  app.post('/api/cases/:id/decision', (request, response, next) => {
    const id = requireCaseId(request, response);
    if (!id) return;
    try {
      const body = decisionSchema.parse(request.body);
      const supportCase = db.decide(id, body.decision, body.note);
      if (!supportCase) return response.status(404).json({ error: 'Case not found' });
      response.json(supportCase);
    } catch (error) { next(error); }
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError || (error as { type?: string }).type === 'entity.parse.failed') {
      return response.status(400).json({ error: 'Invalid request' });
    }
    if ((error as { type?: string }).type === 'entity.too.large') {
      return response.status(413).json({ error: 'Request body too large' });
    }
    if (error instanceof InvalidCaseStateError) {
      return response.status(409).json({ error: error.message });
    }
    return response.status(500).json({ error: 'Request could not be completed' });
  });
  return app;
}
