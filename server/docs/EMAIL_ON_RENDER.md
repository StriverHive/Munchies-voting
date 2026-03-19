# Email on Render.com (connection timeout / Gmail SMTP)

## Why you see `Connection timeout`

**Render often blocks outbound SMTP** (ports **25**, **587**, **465**) on Web Services to reduce spam. Your app tries to reach `smtp.gmail.com:587` from Render’s network; the connection never completes → **timeout**.

This is **not** a bug in your app code. It is a **platform / network policy** (or firewall) issue.

## What works instead

Use an email provider that sends mail over **HTTPS** (REST API), not raw SMTP from the server:

| Provider   | Notes                          |
|-----------|---------------------------------|
| **Resend**| Simple API, good free tier     |
| **SendGrid** | Popular, HTTP API           |
| **Mailgun**  | HTTP API                      |
| **Postmark** | Transactional focus         |

You would add a small integration (e.g. `fetch` to their API) or use their official SDK, and stop relying on Nodemailer → Gmail from Render.

## If you must use SMTP

- Some **paid** hosts or **private** networks allow SMTP; check [Render docs](https://render.com/docs) for your plan.
- Or run the worker that sends email on a **VPS** / machine where SMTP is allowed, and call it from Render via queue/webhook.

## Env vars in this repo

| Variable | Purpose |
|----------|---------|
| `EMAIL_SKIP_VERIFY=true` | Skip SMTP `verify()` on startup (less noise; does **not** unblock sending). |
| `EMAIL_FORCE_SMTP_VERIFY=true` | On Render, force startup verify anyway (for debugging). |
| `SMTP_CONNECTION_TIMEOUT_MS` | Override connection timeout (default 15000). |
| `EMAIL_LOG_EACH_SEND=true` | Log every successful single send (`SEND_OK`). Failures are always logged. Batch jobs always log `BATCH_DONE` + failure breakdown. |

## Gmail from your laptop

Gmail SMTP often **does** work from **localhost** with an [App Password](https://support.google.com/accounts/answer/185833). The same config can **fail on Render** because of blocking above, not because Gmail is “wrong.”

## Finding email logs on Render (frontend says “X failed”)

The UI message comes from the **API JSON** (`failureCount` / `errors`), so the backend **did** run `send-invites`. If you don’t see lines in the dashboard:

1. **Open “Logs” and keep them streaming**, then click **Send** again. Logs are tied to **request time**, not deploy time — scroll to the **minute** you sent.
2. **Search** the log panel for: `[EMAIL]` or `SEND_INVITES_API` or `BATCH_DONE`.
3. **Redeploy** after pulling the latest code — older builds may not include batch logging.
4. **Failures before SMTP** (e.g. voter has **no email** in MongoDB) still produce `[EMAIL] BATCH_DONE` and `BATCH_FAIL_REASONS` with `"Missing email address"` — not `[EMAIL] SEND_FAIL` (SMTP never called).
5. **SMTP blocked / timeout** produces `[EMAIL] SEND_FAIL` with `Connection timeout` (or similar) plus `BATCH_FAIL_REASONS`.

First log line when the route runs: **`[EMAIL] SEND_INVITES_API hit`** — if that never appears, the request is not reaching this service (wrong URL, 401, or a different instance).
