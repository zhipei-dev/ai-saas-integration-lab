# Security and limitations

JSON body size and inputs are bounded and Zod-validated. Client errors are generic and omit stacks, environment values, and credentials. The default mock makes no network call. The optional provider requires complete configuration, uses a new five-second abort controller for every attempt, makes at most two attempts, and never logs or persists its key.

This portfolio MVP is not production-ready. It lacks authentication, authorization, tenant isolation, rate limiting/abuse controls, CSRF/session protections, a secrets manager, encryption-at-rest policy, observability, backup/retention policy, and a coordinated migration framework. SQLite schema creation is local-demo only. Approval changes only local state; no external email, chat, payment, ticketing, or message write exists.
