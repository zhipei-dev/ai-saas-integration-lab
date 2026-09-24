# Architecture

```mermaid
flowchart LR
  UI[React / Vite UI] --> API[Express JSON API]
  API --> Zod[Zod validation]
  API --> Service[Workflow service]
  Service --> Provider{AI provider}
  Provider -->|default| Mock[Deterministic offline mock]
  Provider -->|opt-in| OpenAI[OpenAI-compatible endpoint]
  Service --> DB[(SQLite)]
  DB --> Cases[cases]
  DB --> Runs[ai_runs]
  DB --> Decisions[approvals]
  DB --> Audit[audit_events]
```

The API validates payloads and positive integer identifiers. The database layer owns transactions: case + audit, suggestion + status + audit, and decision + status + audit are each atomic. Generation is permitted only from `open`; decisions only from `awaiting_approval`; `approved` and `rejected` remain terminal.
