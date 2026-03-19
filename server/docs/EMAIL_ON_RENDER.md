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

## Gmail from your laptop

Gmail SMTP often **does** work from **localhost** with an [App Password](https://support.google.com/accounts/answer/185833). The same config can **fail on Render** because of blocking above, not because Gmail is “wrong.”
