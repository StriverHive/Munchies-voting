# Testing (production readiness)

## Backend (critical path)

Uses **Jest**, **Supertest**, and **MongoDB Memory Server** (no real DB required).

```bash
cd server
npm install
npm test
```

From repo root:

```bash
npm test
```

### What is covered

| Area | Type | Notes |
|------|------|--------|
| `createdByFilter` / `canModify` | Unit | Auth scoping rules |
| `formatEmailSendError` | Unit | Email error formatting |
| Register / login / JWT | Integration | Real HTTP + in-memory Mongo |
| Protected routes (`401` without `Authorization`) | Integration | Locations, votes, employees |
| Locations CRUD | Integration | Create + list with Bearer token |
| Votes create + list + isolation | Integration | Owner sees vote; other user sees none |
| Public `check-employee` | Integration | No auth required |
| **Email** | Mocked | `sendEmail` is mocked so tests never hit SMTP |

### Environment

- `NODE_ENV=test` (set by npm script)
- `JWT_SECRET` — defaults to a test value in integration tests if unset
- `MONGODB_URI` — set automatically by MongoDB Memory Server in tests

### CI

Example GitHub Actions step:

```yaml
- run: npm ci && npm ci --prefix server
- run: npm test
```

Ensure Node **≥ 18** (MongoDB Memory Server).

## Frontend (smoke)

```bash
cd client
npm test -- --watchAll=false
```

`App.test.js` checks that the app renders and reaches the login screen when `localStorage` has no token.

## Suggested next steps

- Contract tests for CSV export / bulk employee upload
- E2E (Playwright/Cypress) for login → create vote → public vote link
- Load test for `/api/votes` list with large datasets
- Security: rate limiting, helmet, CSRF if you add cookies
