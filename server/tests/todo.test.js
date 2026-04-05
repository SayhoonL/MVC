import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { users, lists, todos, refreshTokens } from "../data/store.js";

let token;
let listId;

beforeEach(async () => {
  users.splice(0);
  lists.splice(0);
  todos.splice(0);
  refreshTokens.splice(0);

  await request(app).post("/signup").send({ username: "alice", password: "pass123" });
  const loginRes = await request(app).post("/login").send({ username: "alice", password: "pass123" });
  token = loginRes.body.token;

  const listRes = await request(app)
    .post("/lists")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "My List" });
  listId = listRes.body.id;
});

// ─── POST /lists/:id/todos ────────────────────────────────────────────────────

describe("POST /lists/:id/todos", () => {
  it("creates a new todo", async () => {
    const res = await request(app)
      .post(`/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "Buy milk" });

    expect(res.status).toBe(201);
    expect(res.body.task).toBe("Buy milk");
    expect(res.body.completed).toBe(false);
    expect(res.body.listId).toBe(listId);
    expect(res.body).toHaveProperty("id");
  });

  it("creates a todo with completed set to true", async () => {
    const res = await request(app)
      .post(`/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "Done task", completed: true });

    expect(res.status).toBe(201);
    expect(res.body.completed).toBe(true);
  });

  it("returns 400 when task is missing", async () => {
    const res = await request(app)
      .post(`/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 404 for a non-existent list", async () => {
    const res = await request(app)
      .post("/lists/nonexistent-id/todos")
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "Buy milk" });

    expect(res.status).toBe(404);
  });

  it("returns 403 when a different user tries to add a todo", async () => {
    await request(app).post("/signup").send({ username: "bob", password: "pass456" });
    const bobLogin = await request(app).post("/login").send({ username: "bob", password: "pass456" });
    const bobToken = bobLogin.body.token;

    const res = await request(app)
      .post(`/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send({ task: "Unauthorized task" });

    expect(res.status).toBe(403);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .post(`/lists/${listId}/todos`)
      .send({ task: "Buy milk" });

    expect(res.status).toBe(401);
  });
});

// ─── GET /lists/:id/todos ─────────────────────────────────────────────────────

describe("GET /lists/:id/todos", () => {
  it("returns an empty array when no todos exist", async () => {
    const res = await request(app)
      .get(`/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns all todos for the list", async () => {
    await request(app)
      .post(`/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "Task A" });
    await request(app)
      .post(`/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "Task B" });

    const res = await request(app)
      .get(`/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/lists/${listId}/todos`);
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /lists/:id/todos/:todoId ──────────────────────────────────────────

describe("PATCH /lists/:id/todos/:todoId", () => {
  let todoId;

  beforeEach(async () => {
    const res = await request(app)
      .post(`/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "Original task" });
    todoId = res.body.id;
  });

  it("updates the task text", async () => {
    const res = await request(app)
      .patch(`/lists/${listId}/todos/${todoId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "Updated task" });

    expect(res.status).toBe(200);
    expect(res.body.task).toBe("Updated task");
  });

  it("toggles the completed flag", async () => {
    const res = await request(app)
      .patch(`/lists/${listId}/todos/${todoId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it("returns 400 when task is an empty string", async () => {
    const res = await request(app)
      .patch(`/lists/${listId}/todos/${todoId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "   " });

    expect(res.status).toBe(400);
  });

  it("returns 404 for a non-existent todo", async () => {
    const res = await request(app)
      .patch(`/lists/${listId}/todos/nonexistent-todo`)
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "Updated" });

    expect(res.status).toBe(404);
  });

  it("returns 403 when a different user tries to update", async () => {
    await request(app).post("/signup").send({ username: "bob", password: "pass456" });
    const bobLogin = await request(app).post("/login").send({ username: "bob", password: "pass456" });
    const bobToken = bobLogin.body.token;

    const res = await request(app)
      .patch(`/lists/${listId}/todos/${todoId}`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send({ task: "Hijacked" });

    expect(res.status).toBe(403);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .patch(`/lists/${listId}/todos/${todoId}`)
      .send({ task: "No auth" });

    expect(res.status).toBe(401);
  });
});

// ─── DELETE /lists/:id/todos/:todoId ─────────────────────────────────────────

describe("DELETE /lists/:id/todos/:todoId", () => {
  let todoId;

  beforeEach(async () => {
    const res = await request(app)
      .post(`/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ task: "To be deleted" });
    todoId = res.body.id;
  });

  it("deletes the todo", async () => {
    const res = await request(app)
      .delete(`/lists/${listId}/todos/${todoId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const todosRes = await request(app)
      .get(`/lists/${listId}/todos`)
      .set("Authorization", `Bearer ${token}`);
    expect(todosRes.body).toHaveLength(0);
  });

  it("returns 404 for a non-existent todo", async () => {
    const res = await request(app)
      .delete(`/lists/${listId}/todos/nonexistent-todo`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("returns 403 when a different user tries to delete", async () => {
    await request(app).post("/signup").send({ username: "bob", password: "pass456" });
    const bobLogin = await request(app).post("/login").send({ username: "bob", password: "pass456" });
    const bobToken = bobLogin.body.token;

    const res = await request(app)
      .delete(`/lists/${listId}/todos/${todoId}`)
      .set("Authorization", `Bearer ${bobToken}`);

    expect(res.status).toBe(403);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).delete(`/lists/${listId}/todos/${todoId}`);
    expect(res.status).toBe(401);
  });
});
