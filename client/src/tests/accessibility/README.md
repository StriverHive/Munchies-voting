# Accessibility tests (optional)

Recommended additions for production:

- **axe-core** + `@testing-library/react` in selected page tests.
- **Playwright** `@axe-core/playwright` scans on critical routes (`/login`, `/vote/:id`).
- Manual checks: keyboard-only navigation, focus order, color contrast.

No default a11y tests are wired yet to keep install size small; add dependencies when you enable this folder.
