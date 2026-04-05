import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { users, refreshTokens } from "../data/store.js";

beforeEach(() => {
  users.splice(0);
  refreshTokens.splice(0);
});

describe("POST /signup", () => {
  it("creates a new user", async () => {
    const res = await request(app)
      .post("/signup")
      .send({ username: "alice", password: "pass123" });

    expect(res.status).toBe(201);
    expect(res.body).toBe("new user has added");
  });

  it("returns 400 when username is missing", async () => {
    const res = await request(app)
      .post("/signup")
      .send({ password: "pass123" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(app)
      .post("/signup")
      .send({ username: "alice" });

    expect(res.status).toBe(400);
  });

  it("returns 400 for duplicate username", async () => {
    await request(app).post("/signup").send({ username: "alice", password: "pass123" });

    const res = await request(app)
      .post("/signup")
      .send({ username: "alice", password: "other" });

    expect(res.status).toBe(400);
    expect(res.body).toBe("same username exists");
  });
});

describe("POST /login", () => {
  beforeEach(async () => {
    await request(app).post("/signup").send({ username: "alice", password: "pass123" });
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/login")
      .send({ username: "alice", password: "pass123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body.message).toBe("logged in");
  });

  it("returns 400 for wrong username", async () => {
    const res = await request(app)
      .post("/login")
      .send({ username: "bob", password: "pass123" });

    expect(res.status).toBe(400);
    expect(res.body).toBe("wrong username");
  });

  it("returns 400 for wrong password", async () => {
    const res = await request(app)
      .post("/login")
      .send({ username: "alice", password: "wrong" });

    expect(res.status).toBe(400);
    expect(res.body).toBe("failed to verify");
  });
});

describe("POST /refresh", () => {
  it("returns a new access token with a valid refresh token", async () => {
    await request(app).post("/signup").send({ username: "alice", password: "pass123" });
    const loginRes = await request(app)
      .post("/login")
      .send({ username: "alice", password: "pass123" });

    const { refreshToken } = loginRes.body;

    const res = await request(app)
      .post("/refresh")
      .set("Authorization", `Bearer ${refreshToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("string");
  });

  it("returns 400 for an unknown refresh token", async () => {
    const res = await request(app)
      .post("/refresh")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.status).toBe(400);
  });
});

describe("GET /me", () => {
  it("returns the current user payload", async () => {
    await request(app).post("/signup").send({ username: "alice", password: "pass123" });
    const loginRes = await request(app)
      .post("/login")
      .send({ username: "alice", password: "pass123" });

    const { token } = loginRes.body;

    const res = await request(app)
      .get("/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("userId");
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with a malformed token", async () => {
    const res = await request(app)
      .get("/me")
      .set("Authorization", "Bearer badtoken");
    expect(res.status).toBe(401);
  });
});
