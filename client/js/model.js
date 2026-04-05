const API_BASE = "";  // same-origin: served by Express

// ─── API client ────────────────────────────────────────────────────────────────

export class ApiClient {
  constructor() {
    this.token        = localStorage.getItem("token");
    this.refreshToken = localStorage.getItem("refreshToken");
  }

  async request(method, path, body = null) {
    const headers = { "Content-Type": "application/json" };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const opts = { method, headers };
    if (body !== null) opts.body = JSON.stringify(body);

    let res = await fetch(`${API_BASE}${path}`, opts);

    // Auto-refresh on 401
    if (res.status === 401 && this.refreshToken) {
      const ok = await this._tryRefresh();
      if (ok) {
        headers["Authorization"] = `Bearer ${this.token}`;
        res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
      }
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => res.statusText);
      const err = new Error(typeof errBody === "string" ? errBody : JSON.stringify(errBody));
      err.status = res.status;
      throw err;
    }

    return res.json();
  }

  async _tryRefresh() {
    try {
      const res = await fetch(`${API_BASE}/refresh`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${this.refreshToken}` },
      });
      if (!res.ok) { this.clearAuth(); return false; }
      const newToken = await res.json();
      this.token = newToken;
      localStorage.setItem("token", newToken);
      return true;
    } catch {
      this.clearAuth();
      return false;
    }
  }

  setAuth(token, refreshToken) {
    this.token        = token;
    this.refreshToken = refreshToken;
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
  }

  clearAuth() {
    this.token        = null;
    this.refreshToken = null;
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  }

  isLoggedIn() { return !!this.token; }

  // Auth endpoints
  signup(username, password) {
    return this.request("POST", "/signup", { username, password });
  }
  async login(username, password) {
    const data = await this.request("POST", "/login", { username, password });
    this.setAuth(data.token, data.refreshToken);
    return data;
  }
  getMe() {
    return this.request("GET", "/me");
  }

  // List endpoints
  getLists()           { return this.request("GET",    "/lists"); }
  createList(name)     { return this.request("POST",   "/lists",          { name }); }
  updateList(id, name) { return this.request("PATCH",  `/lists/${id}`,    { name }); }
  deleteList(id)       { return this.request("DELETE", `/lists/${id}`); }

  // Todo endpoints
  getTodos(listId)              { return this.request("GET",    `/lists/${listId}/todos`); }
  createTodo(listId, task)      { return this.request("POST",   `/lists/${listId}/todos`,            { task }); }
  updateTodo(listId, id, patch) { return this.request("PATCH",  `/lists/${listId}/todos/${id}`,      patch); }
  deleteTodo(listId, id)        { return this.request("DELETE", `/lists/${listId}/todos/${id}`); }
}

// ─── App state ─────────────────────────────────────────────────────────────────

export class AppState {
  constructor() {
    this.api           = new ApiClient();
    this.user          = null;
    this.lists         = [];
    this.currentListId = null;
    this.todos         = [];
    this.filter        = "all";   // "all" | "active" | "done"
  }

  get currentList() {
    return this.lists.find((l) => l.id === this.currentListId) ?? null;
  }

  get filteredTodos() {
    switch (this.filter) {
      case "active": return this.todos.filter((t) => !t.completed);
      case "done":   return this.todos.filter((t) =>  t.completed);
      default:       return [...this.todos];
    }
  }

  get pendingCount() { return this.todos.filter((t) => !t.completed).length; }
  get doneCount()    { return this.todos.filter((t) =>  t.completed).length; }

  sortTodos() {
    this.todos = [...this.todos].sort((a, b) => a.task.localeCompare(b.task));
  }
}
