/**
 * Frontend unit tests for AppState (model.js)
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ApiClient, AppState } from "../js/model.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTodo(overrides = {}) {
  return { id: "t1", task: "Buy milk", completed: false, listId: "l1", ...overrides };
}

// ─── AppState ─────────────────────────────────────────────────────────────────

describe("AppState", () => {
  let state;

  beforeEach(() => {
    state = new AppState();
    state.todos = [
      makeTodo({ id: "t1", task: "Bananas",   completed: false }),
      makeTodo({ id: "t2", task: "Apples",    completed: true  }),
      makeTodo({ id: "t3", task: "Cherries",  completed: false }),
    ];
    state.lists = [
      { id: "l1", name: "Groceries", creatorId: "u1" },
      { id: "l2", name: "Work",      creatorId: "u1" },
    ];
    state.currentListId = "l1";
  });

  describe("currentList", () => {
    it("returns the list matching currentListId", () => {
      expect(state.currentList).toEqual({ id: "l1", name: "Groceries", creatorId: "u1" });
    });

    it("returns null when no list is selected", () => {
      state.currentListId = null;
      expect(state.currentList).toBeNull();
    });

    it("returns null when currentListId does not match any list", () => {
      state.currentListId = "nonexistent";
      expect(state.currentList).toBeNull();
    });
  });

  describe("filteredTodos", () => {
    it('returns all todos when filter is "all"', () => {
      state.filter = "all";
      expect(state.filteredTodos).toHaveLength(3);
    });

    it('returns only pending todos when filter is "active"', () => {
      state.filter = "active";
      const result = state.filteredTodos;
      expect(result).toHaveLength(2);
      expect(result.every((t) => !t.completed)).toBe(true);
    });

    it('returns only completed todos when filter is "done"', () => {
      state.filter = "done";
      const result = state.filteredTodos;
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("t2");
    });

    it("returns a copy (does not mutate original array)", () => {
      const original = state.todos;
      state.filteredTodos.push({ id: "fake" });
      expect(state.todos).toBe(original);
    });
  });

  describe("pendingCount / doneCount", () => {
    it("returns correct pending count", () => {
      expect(state.pendingCount).toBe(2);
    });

    it("returns correct done count", () => {
      expect(state.doneCount).toBe(1);
    });

    it("returns 0 counts for empty todos", () => {
      state.todos = [];
      expect(state.pendingCount).toBe(0);
      expect(state.doneCount).toBe(0);
    });
  });

  describe("sortTodos", () => {
    it("sorts todos alphabetically by task", () => {
      state.sortTodos();
      expect(state.todos.map((t) => t.task)).toEqual(["Apples", "Bananas", "Cherries"]);
    });

    it("does not mutate the original reference but replaces state.todos", () => {
      const before = state.todos;
      state.sortTodos();
      expect(state.todos).not.toBe(before);
    });

    it("is stable with a single item", () => {
      state.todos = [makeTodo({ task: "Only" })];
      state.sortTodos();
      expect(state.todos).toHaveLength(1);
    });

    it("handles empty list", () => {
      state.todos = [];
      state.sortTodos();
      expect(state.todos).toEqual([]);
    });
  });
});

// ─── ApiClient auth helpers ───────────────────────────────────────────────────

describe("ApiClient", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("isLoggedIn", () => {
    it("returns false when no token in storage", () => {
      const client = new ApiClient();
      expect(client.isLoggedIn()).toBe(false);
    });

    it("returns true when token is present", () => {
      localStorage.setItem("token", "abc");
      const client = new ApiClient();
      expect(client.isLoggedIn()).toBe(true);
    });
  });

  describe("setAuth / clearAuth", () => {
    it("persists token and refreshToken to localStorage", () => {
      const client = new ApiClient();
      client.setAuth("tok123", "ref456");
      expect(localStorage.getItem("token")).toBe("tok123");
      expect(localStorage.getItem("refreshToken")).toBe("ref456");
      expect(client.token).toBe("tok123");
      expect(client.refreshToken).toBe("ref456");
    });

    it("clears tokens from storage and memory", () => {
      localStorage.setItem("token", "tok123");
      localStorage.setItem("refreshToken", "ref456");
      const client = new ApiClient();
      client.clearAuth();
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(client.token).toBeNull();
      expect(client.refreshToken).toBeNull();
    });
  });

  describe("request – successful fetch", () => {
    it("sends GET with Authorization header", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: "ok" }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const client = new ApiClient();
      client.setAuth("mytoken", "myrefresh");
      const result = await client.request("GET", "/me");

      expect(result).toEqual({ data: "ok" });
      expect(mockFetch).toHaveBeenCalledOnce();
      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.headers["Authorization"]).toBe("Bearer mytoken");
      expect(opts.method).toBe("GET");
    });

    it("sends POST with JSON body", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ id: "1" }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const client = new ApiClient();
      await client.request("POST", "/lists", { name: "Test" });

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe("POST");
      expect(JSON.parse(opts.body)).toEqual({ name: "Test" });
    });
  });

  describe("request – error handling", () => {
    it("throws an Error with status on non-ok response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => "bad request",
      });
      vi.stubGlobal("fetch", mockFetch);

      const client = new ApiClient();
      client.token = null; // skip refresh path
      await expect(client.request("GET", "/me")).rejects.toMatchObject({
        status: 400,
        message: "bad request",
      });
    });
  });
});
