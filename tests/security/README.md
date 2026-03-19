# Security testing

## Dependency audit

Run regularly in CI and before releases:

```bash
npm audit --prefix server
npm audit --prefix client
```

## SAST / secrets

- Enable GitHub **Dependabot** and **secret scanning** for the repository.
- Optionally add **Semgrep** or **CodeQL** via GitHub Actions.

## Headers & TLS

- Terminate TLS at your host (Render, nginx, Cloudflare).
- Add `helmet` on Express if you need standardized security headers (evaluate with your hosting/CDN).

## Auth / API

- JWT secret must be strong and unique per environment (never commit real `.env`).
- Integration tests in `server/tests/integration` and API contract tests in `server/tests/api` cover auth gates; extend with abuse cases (rate limits) when implemented.

## DAST (optional)

Run OWASP ZAP baseline against a staging URL:

```bash
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://your-staging.example
```
