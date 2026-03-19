# Integration tests (reference)

Executable **server** integration tests live in:

`server/tests/integration/`

Run: `npm test --prefix server`

These spin up an in-memory MongoDB instance and the real Express `app` (see `server/tests/helpers/memoryMongoApp.js`).
