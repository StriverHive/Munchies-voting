# Performance tests

## k6 (API load / smoke)

Scripts live in `k6/`. They require [k6](https://k6.io/) installed locally or in CI.

```bash
# Terminal 1: start API + Mongo as you normally do
# Terminal 2:
set VOTE_APP_BASE_URL=http://localhost:5000
k6 run tests/performance/k6/api-smoke.js
```

Tune `options` (VUs, duration, thresholds) per environment. Add scenarios for authenticated endpoints using k6 `http.batch` and stored tokens.

## Lighthouse (frontend budgets)

`lighthouse/budgets.json` is a starter budget file. Run Lighthouse CLI or CI against your deployed preview:

```bash
npx lighthouse https://your-preview.example --budget-path=tests/performance/lighthouse/budgets.json --view
```

## Web Vitals (production)

Consider reporting Core Web Vitals from the React app (`web-vitals` is already a dependency) to your analytics in production builds.
