# Test suite overview (production readiness)

This repository uses **separate folders per test type**. Run commands from the **repo root** unless noted.

| Type | Location | Command |
|------|----------|---------|
| **Unit** (server) | `server/tests/unit/` | `npm test --prefix server` |
| **Integration** (server) | `server/tests/integration/` | (same Jest run) |
| **API / contract** (server) | `server/tests/api/` | (same Jest run) |
| **UI / component** (client) | `client/src/tests/ui/` | `npm run test:client` |
| **E2E** (Playwright) | `tests/e2e/specs/` | `npm run test:e2e` |
| **Performance** | `tests/performance/` | See `tests/performance/README.md` (k6, Lighthouse) |
| **Security** | `tests/security/README.md` | Manual + CI audit steps |
| **Accessibility** (planned) | `client/src/tests/accessibility/README.md` | Optional axe / Playwright a11y |

## One-shot CI-style run

```bash
npm ci --prefix server && npm ci --prefix client && npm ci
npm test --prefix server
npm run test:ci --prefix client
npx playwright install --with-deps chromium
npm run test:e2e
```

From repo root (with `npm ci` at root for Playwright): `npm run test:ci` runs **server + client + E2E** (E2E needs Chromium installed via `npm run test:e2e:install`).

## Shared server helpers

- `server/tests/helpers/memoryMongoApp.js` — MongoDB Memory Server + Express `app`
- `server/tests/helpers/httpTestUtils.js` — register/login helpers for Supertest

## Documentation

See also `docs/TESTING.md` for environment variables and CI notes.
