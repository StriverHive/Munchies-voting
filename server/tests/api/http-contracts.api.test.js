/**
 * API / contract-style tests: consistent JSON error shapes, status codes, headers.
 * Uses same stack as integration tests (memory Mongo + mocked email).
 */
const request = require("supertest");
const {
  startMemoryMongoAndApp,
  clearAllCollections,
  stopMemoryMongoAndApp,
} = require("../helpers/memoryMongoApp");
const { registerUser, login } = require("../helpers/httpTestUtils");

let app;

beforeAll(async () => {
  app = await startMemoryMongoAndApp();
});

afterAll(async () => {
  await stopMemoryMongoAndApp();
});

beforeEach(async () => {
  await clearAllCollections();
});

describe("API error responses", () => {
  it("POST /api/auth/login with bad body returns JSON with message", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email" });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("message");
  });

  it("protected route without Bearer returns 401 JSON", async () => {
    const res = await request(app).get("/api/votes");
    expect(res.status).toBe(401);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("message");
  });

  it("POST /api/locations without Authorization returns 401", async () => {
    const res = await request(app)
      .post("/api/locations")
      .send({ name: "X", code: "Y" });
    expect(res.status).toBe(401);
  });
});

describe("API success response shapes", () => {
  it("POST /api/auth/register returns user object without token", async () => {
    const { res, body } = await registerUser(app);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe(body.email);
    expect(res.body.user.password).toBeUndefined();
  });

  it("GET /api/locations returns { locations: array }", async () => {
    const { body } = await registerUser(app);
    const loginRes = await login(app, body.email);
    const res = await request(app)
      .get("/api/locations")
      .set("Authorization", `Bearer ${loginRes.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("locations");
    expect(Array.isArray(res.body.locations)).toBe(true);
  });
});

describe("GET /api/votes/:id/public-summary (PUBLIC)", () => {
  it("returns 404 for unknown vote id", async () => {
    const res = await request(app).get(
      "/api/votes/507f1f77bcf86cd799439011/public-summary"
    );
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message");
  });
});
