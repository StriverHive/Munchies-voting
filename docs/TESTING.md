# Testing (production readiness)

This project uses **separate folders per test type**. See the repo index at [`tests/README.md`](../tests/README.md).

## Quick commands (repo root)

| Command | Scope |
|---------|--------|
| `npm test` | Server: unit + integration + API (Jest) |
| `npm run test:client` | Client: UI/component tests (Jest + RTL) |
| `npm run test:e2e:install` | One-time Playwright browser install |
| `npm run test:e2e` | End-to-end (Playwright; starts CRA dev server) |
| `npm run test:ci` | Server + client + E2E (for local “full” run) |

## Backend (`server/tests/`)

- **`tests/unit/`** — Pure functions / middleware helpers (no HTTP).
- **`tests/integration/`** — Express + MongoDB Memory Server + Supertest (full stack in-process).
- **`tests/api/`** — HTTP contract checks (JSON shapes, status codes).
- **`tests/helpers/`** — Shared bootstrap (`memoryMongoApp.js`, `httpTestUtils.js`).
- **`tests/setup/setupAfterEnv.js`** — Mocks `sendEmail` so tests never hit SMTP.

```bash
cd server && npm test
```

Environment:

- `NODE_ENV=test` (set by npm script)
- `JWT_SECRET` — defaults in tests if unset
- `MONGODB_URI` — set by MongoDB Memory Server

## Frontend (`client/src/tests/`)

- **`src/tests/ui/`** — Component and page smoke tests (React Testing Library).
- **`src/setupTests.js`** — `jest-dom`, `TextEncoder`, `matchMedia`, `ResizeObserver`, mocks for `axios` and `lottie-react` (jsdom-safe).

```bash
cd client && npm run test:ci
```

> **Note:** Rendering the full Ant Design `LoginPage` in Jest currently hits a React 19 + jsdom `AggregateError` in this repo. Login UX is covered by **E2E** instead; `LoginPage` / `RegisterPage` still use current Ant Design `styles` / `orientation` props where updated.

## E2E (`tests/e2e/`)

Playwright specs under `tests/e2e/specs/`. Config: `tests/e2e/playwright.config.js`.

- Starts `npm start --prefix client` unless `PLAYWRIGHT_NO_SERVER=1`.
- Does **not** start Mongo/API by default; smoke tests only need the React dev server.

## Performance (`tests/performance/`)

- **k6** script: `tests/performance/k6/api-smoke.js` (requires [k6](https://k6.io/) installed).
- **Lighthouse** starter budgets: `tests/performance/lighthouse/budgets.json`.

## Security (`tests/security/`)

Checklist and optional DAST notes — see `tests/security/README.md`. Run `npm audit` on `server` and `client` regularly.

## Contract tests

Executable contracts live in `server/tests/api/`. See `tests/contract/README.md`.

## CI

GitHub Actions workflow: `.github/workflows/ci.yml` (server tests, client tests, Playwright).

Requirements:

- Node **≥ 18** (MongoDB Memory Server on the server job).
- Playwright browsers installed in the E2E job (`npx playwright install chromium --with-deps`).

## Visual regression

Optional tooling described in `tests/visual/README.md`.
