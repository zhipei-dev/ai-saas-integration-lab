# AI SaaS Integration Lab

A portfolio MVP for a human-in-the-loop support workflow. It turns synthetic support cases into consistent AI draft replies without allowing AI output or approval to send a real customer message.

## Client fit

Relevant proof for small AI automation / SaaS integration work where the buyer needs structured model output, approval gates, API validation, retries, persistence, auditability, and browser-verified delivery without handing autonomous write authority to the model.

## Capability proof

- Creates synthetic support cases in local SQLite.
- Generates deterministic, schema-validated offline suggestions by default.
- Requires human approve/reject decisions and retains an audit trail.
- Demonstrates provider validation, bounded retries, API validation, transactional workflow updates, and browser E2E coverage.

## Workflow

`open` → generate suggestion → `awaiting_approval` → human `approved` or `rejected`.

Approved and rejected states are terminal. The service checks workflow state before invoking an AI provider, and the database re-checks state inside the transaction before persisting the suggestion. Approval is only a local database transition; it never sends email, chat, or another external action.

## Stack and architecture

React/Vite UI, Express JSON API, Zod validation, Node 24 `node:sqlite`, and a deterministic mock or opt-in OpenAI-compatible provider. See [architecture](docs/ARCHITECTURE.md).

## Quick start

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`. No key or network is required in mock mode.

On Windows PowerShell environments that block `npm.ps1`, use the equivalent `npm.cmd` commands.

## Validation

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## AI provider mode

`AI_PROVIDER=mock` is the offline default. For an OpenAI-compatible endpoint, set `AI_PROVIDER=openai` plus `OPENAI_BASE_URL`, `OPENAI_API_KEY`, and `OPENAI_MODEL`. Missing configuration or an unknown provider stops startup instead of silently using mock. Requests have a five-second timeout and no more than two attempts; non-retryable 4xx responses are not retried.

## Security, limitations, and status

Inputs and model-shaped output are validated; keys are not logged or stored; client errors are generic. This is a completed educational portfolio MVP, not production-ready. It has no auth, tenancy, rate limiting, migration framework, or production operational controls. See [security and limitations](docs/SECURITY_AND_LIMITATIONS.md).
## Handoff and support

- [Demo deployment and handoff](DEPLOYMENT.md)
- [Support](SUPPORT.md)
- [Security and limitations](docs/SECURITY_AND_LIMITATIONS.md)

