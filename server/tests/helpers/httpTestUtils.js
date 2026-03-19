/**
 * HTTP helpers for Supertest-based integration/API tests.
 */
const request = require("supertest");

async function registerUser(app, overrides = {}) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const body = {
    username: `u${suffix}`,
    email: `user${suffix}@test.local`,
    password: "password1",
    ...overrides,
  };
  const res = await request(app).post("/api/auth/register").send(body);
  return { res, body };
}

async function login(app, email, password = "password1") {
  return request(app).post("/api/auth/login").send({ email, password });
}

module.exports = { registerUser, login };
