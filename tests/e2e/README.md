# End-to-end tests (Playwright)

- **Config:** `playwright.config.js` (repo-relative: `tests/e2e/playwright.config.js`)
- **Specs:** `specs/*.spec.js`

## Run

From repo root (after `npm ci` / `npm install` at root and `npm ci --prefix client`):

```bash
npm run test:e2e:install   # once per machine / CI image
npm run test:e2e
```

- The dev server command runs with **`cwd` = repository root** so `npm start --prefix client` finds `client/package.json` (Playwright defaults `cwd` to the config file’s folder).
- Set `PLAYWRIGHT_NO_SERVER=1` if the CRA dev server is already running on port 3000.
- Override base URL: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000`

HTML report is written under `tests/e2e/report/` (gitignored).

## “Timed out waiting … from config.webServer”

The first `npm start` (webpack) compile can take **several minutes**. The config waits up to **6 minutes** and sets `BROWSER=none` so the OS browser isn’t opened.

To warm the cache: run `npm start --prefix client` once, stop it, then `npm run test:e2e` again (often much faster).
