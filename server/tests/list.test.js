import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { users, lists, todos, refreshTokens } from "../data/store.js";

let token;

beforeEach(async () => {
  users.splice(0);
  lists.splice(0);
  todos.splice(0);
  refreshTokens.splice(0);

  await request(app).post("/signup").send({ username: "alice", password: "pass123" });
  const res = await request(app).post("/login").send({ username: "alice", password: "pass123" });
  token = res.body.token;
});

// ─── GET /lists ────────────────────────────────────────────────────────────────

describe("GET /lists", () => {
  it("returns an empty array initially", async () => {
    const res = await request(app)
      .get("/lists")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns only the current user's lists", async () => {
    await request(app).post("/signup").send({ username: "bob", password: "pass456" });
    const bobLogin = await request(app).post("/login").send({ username: "bob", password: "pass456" });
    const bobToken = bobLogin.body.token;

    await request(app).post("/lists").set("Authorization", `Bearer ${token}`).send({ name: "Alice List" });
    await request(app).post("/lists").set("Authorization", `Bearer ${bobToken}`).send({ name: "Bob List" });

    const res = await request(app).get("/lists").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Alice List");
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/lists");
    expect(res.status).toBe(401);
  });
});

// ─── POST /lists ───────────────────────────────────────────────────────────────

describe("POST /lists", () => {
  it("creates a new list", async () => {
    const res = await request(app)
      .post("/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Shopping" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Shopping");
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("creatorId");
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).post("/lists").send({ name: "Shopping" });
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /lists/:id ─────────────────────────────────────────────────────────

describe("PATCH /lists/:id", () => {
  let listId;

  beforeEach(async () => {
    const res = await request(app)
      .post("/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Original" });
    listId = res.body.id;
  });

  it("updates the list name", async () => {
    const res = await request(app)
      .patch(`/lists/${listId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated");
  });

  it("returns 404 for a non-existent list", async () => {
    const res = await request(app)
      .patch("/lists/nonexistent-id")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated" });

    expect(res.status).toBe(404);
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .patch(`/lists/${listId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 403 when a different user tries to update", async () => {
    await request(app).post("/signup").send({ username: "bob", password: "pass456" });
    const bobLogin = await request(app).post("/login").send({ username: "bob", password: "pass456" });
    const bobToken = bobLogin.body.token;

    const res = await request(app)
      .patch(`/lists/${listId}`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send({ name: "Hijacked" });

    expect(res.status).toBe(403);
  });
});

// ─── DELETE /lists/:id ────────────────────────────────────────────────────────

describe("DELETE /lists/:id", () => {
  let listId;

  beforeEach(async () => {
    const res = await request(app)
      .post("/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "To Delete" });
    listId = res.body.id;
  });

  it("deletes the list", async () => {
    const res = await request(app)
      .delete(`/lists/${listId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const listsRes = await request(app)
      .get("/lists")
      .set("Authorization", `Bearer ${token}`);
    expect(listsRes.body).toHaveLength(0);
  });

  it("cascades: also deletes associated todos", async () => {
    await request(app)
      .post(`/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "Orphan task" });

    await request(app)
      .delete(`/lists/${listId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(todos).toHaveLength(0);
  });

  it("returns 404 for a non-existent list", async () => {
    const res = await request(app)
      .delete("/lists/nonexistent-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("returns 403 when a different user tries to delete", async () => {
    await request(app).post("/signup").send({ username: "bob", password: "pass456" });
    const bobLogin = await request(app).post("/login").send({ username: "bob", password: "pass456" });
    const bobToken = bobLogin.body.token;

    const res = await request(app)
      .delete(`/lists/${listId}`)
      .set("Authorization", `Bearer ${bobToken}`);

    expect(res.status).toBe(403);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).delete(`/lists/${listId}`);
    expect(res.status).toBe(401);
  });
});
