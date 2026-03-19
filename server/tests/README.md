# Server automated tests

All server tests run with **Jest** from the `server/` directory (`npm test`).

| Folder | Type |
|--------|------|
| `unit/` | Unit tests (pure logic, middleware helpers) |
| `integration/` | Integration tests (Express + MongoDB Memory Server + Supertest) |
| `api/` | API / HTTP contract tests |
| `helpers/` | Shared test utilities |
| `setup/` | Jest `setupFilesAfterEnv` (e.g. email mock) |
