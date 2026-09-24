# Demo deployment and handoff

This repository is a portfolio MVP. The steps below are for a local or controlled demo handoff, not a production deployment recipe.

## Runtime prerequisites

- Node.js 24
- npm
- a writable directory for the SQLite database

## Build and start

Install the locked dependencies and build the server/web assets:

```bash
npm ci
npm run build
```

The default mock provider requires no external credential or network service. Start the application with:

```bash
npm run start
```

By default the server listens on port `3000` and serves both the API and the built web UI. Open:

```text
http://localhost:3000
```

## Configuration

Runtime configuration comes from environment variables.

- `PORT` — HTTP port; default `3000`
- `DATABASE_PATH` — SQLite path; default `data/app.sqlite`
- `AI_PROVIDER` — `mock` for the offline demo, or `openai` for an explicitly configured OpenAI-compatible endpoint
- `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL` — required together only for the optional OpenAI-compatible provider

See `.env.example` for the supported values. Do not commit real credentials.

## Handoff checklist

Before handing the demo to another developer:

1. run `npm ci`
2. run `npm run typecheck`
3. run `npm test`
4. run `npm run build`
5. run `npm run test:e2e` when browser validation is required
6. provide only source/configuration templates, not a local SQLite database containing real data
7. confirm whether the receiver should use the default mock provider or an explicitly configured compatible provider

## Production boundary

This project is not production-ready. It intentionally lacks authentication, authorization, tenancy, abuse/rate controls, managed secrets, production migrations, observability, backup/retention policy, and production deployment hardening.

See `docs/SECURITY_AND_LIMITATIONS.md` before considering any real deployment.
