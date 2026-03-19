# Contract testing

Executable HTTP “contracts” for stable JSON shapes and status codes live next to the API implementation:

| Location | Purpose |
|----------|---------|
| `server/tests/api/` | Supertest-based checks (e.g. `http-contracts.api.test.js`) |

## Expanding

- Add **Pact** or **OpenAPI** schema validation (`jest-openapi`, `ajv`) when you publish a formal API spec.
- Keep contract tests fast: reuse `server/tests/helpers/memoryMongoApp.js` and avoid real SMTP/network.
