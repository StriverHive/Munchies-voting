// @ts-check
const path = require("path");
const { defineConfig, devices } = require("@playwright/test");

/** Repo root (config lives in tests/e2e — without this, npm --prefix client resolves to tests/e2e/client) */
const REPO_ROOT = path.join(__dirname, "..", "..");

/**
 * End-to-end tests — run from repo root:
 *   npm run test:e2e:install   # once per machine
 *   npm run test:e2e
 *
 * Starts the CRA dev server unless PLAYWRIGHT_NO_SERVER=1 (then start client yourself).
 */
module.exports = defineConfig({
  testDir: "./specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: path.join(__dirname, "report") }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_NO_SERVER
    ? undefined
    : {
        command: "npm start --prefix client",
        cwd: REPO_ROOT,
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        // First CRA/webpack compile often exceeds 3 minutes on slower disks / cold cache
        timeout: 360000,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          BROWSER: "none",
          // Do not set HOST here — CRA + webpack-dev-server can fail with
          // allowedHosts schema errors when HOST is forced (see cra.link/advanced-config).
        },
      },
});
