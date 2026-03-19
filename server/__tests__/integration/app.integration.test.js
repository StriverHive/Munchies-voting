/**
 * Integration tests: in-memory MongoDB + real Express app + mocked email.
 * Run: cd server && npm test
 */
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "jest-jwt-secret-min-32-chars-long";

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  // eslint-disable-next-line global-require
  app = require("../../app");
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  const cols = mongoose.connection.collections;
  await Promise.all(Object.values(cols).map((c) => c.deleteMany({})));
});

async function registerUser(overrides = {}) {
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

async function login(email, password = "password1") {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res;
}

describe("POST /api/auth/register", () => {
  it("creates user (201)", async () => {
    const { res, body } = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(body.email);
    expect(res.body.token).toBeUndefined();
  });

  it("rejects short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "a", email: "a@test.local", password: "12345" });
    expect(res.status).toBe(400);
  });

  it("rejects duplicate email", async () => {
    const { body } = await registerUser();
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "other",
        email: body.email,
        password: "password1",
      });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns JWT on success", async () => {
    const { body } = await registerUser();
    const res = await login(body.email);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(body.email);
  });

  it("rejects wrong password", async () => {
    const { body } = await registerUser();
    const res = await login(body.email, "wrongpass");
    expect(res.status).toBe(400);
  });
});

describe("Auth-protected API", () => {
  it("GET /api/locations returns 401 without token", async () => {
    const res = await request(app).get("/api/locations");
    expect(res.status).toBe(401);
  });

  it("GET /api/votes returns 401 without token", async () => {
    const res = await request(app).get("/api/votes");
    expect(res.status).toBe(401);
  });

  it("GET /api/employees returns 401 without token", async () => {
    const res = await request(app).get("/api/employees");
    expect(res.status).toBe(401);
  });

  it("GET /api/locations returns 200 with token (empty)", async () => {
    const { body } = await registerUser();
    const loginRes = await login(body.email);
    const res = await request(app)
      .get("/api/locations")
      .set("Authorization", `Bearer ${loginRes.body.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.locations)).toBe(true);
  });
});

describe("Locations CRUD (authenticated)", () => {
  let token;

  beforeEach(async () => {
    const { body } = await registerUser();
    const loginRes = await login(body.email);
    token = loginRes.body.token;
  });

  it("creates and lists location", async () => {
    const code = `T${Date.now()}`;
    const create = await request(app)
      .post("/api/locations")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `Test Store ${code}`, code });

    expect(create.status).toBe(201);
    expect(create.body.location.code).toBe(code);

    const list = await request(app)
      .get("/api/locations")
      .set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.locations.length).toBe(1);
  });
});

describe("Votes + public voting endpoints", () => {
  let token;
  let locationId;
  let voterId;
  let nomineeId;
  let voteId;

  beforeEach(async () => {
    const { body: u } = await registerUser();
    const loginRes = await login(u.email);
    token = loginRes.body.token;

    const loc = await request(app)
      .post("/api/locations")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `Loc ${Date.now()}`, code: `LC${Date.now()}` });
    locationId = loc.body.location._id;

    const emp = (payload) =>
      request(app)
        .post("/api/employees")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

    const v1 = await emp({
      firstName: "Voter",
      lastName: "One",
      employeeId: `E${Date.now()}a`,
      email: `v1${Date.now()}@t.local`,
      locationIds: [locationId],
    });
    const v2 = await emp({
      firstName: "Nom",
      lastName: "One",
      employeeId: `E${Date.now()}b`,
      email: `n1${Date.now()}@t.local`,
      locationIds: [locationId],
    });
    voterId = v1.body.employee._id;
    nomineeId = v2.body.employee._id;

    const start = new Date(Date.now() - 60_000).toISOString();
    const end = new Date(Date.now() + 86400_000).toISOString();

    const voteRes = await request(app)
      .post("/api/votes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Integration vote",
        locationIds: [locationId],
        startAt: start,
        endAt: end,
        voterIds: [voterId],
        nomineeIds: [nomineeId],
        votePoints: 1,
        maxVotesPerVoter: 1,
      });

    expect(voteRes.status).toBe(201);
    voteId = voteRes.body.vote._id;
  });

  it("GET /api/votes lists vote for owner", async () => {
    const res = await request(app)
      .get("/api/votes")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.votes.length).toBe(1);
  });

  it("POST check-employee works without auth", async () => {
    const res = await request(app)
      .post(`/api/votes/${voteId}/check-employee`)
      .send({ employeeId: "E999unknown" });
    expect(res.status).toBe(400);
  });

  it("another user cannot see vote (403 or empty list)", async () => {
    const { body: u2 } = await registerUser();
    const login2 = await login(u2.email);
    const res = await request(app)
      .get("/api/votes")
      .set("Authorization", `Bearer ${login2.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.votes.length).toBe(0);
  });
});
