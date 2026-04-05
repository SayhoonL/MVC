// ─── Toast ────────────────────────────────────────────────────────────────────

export function showToast(message, type = "info") {
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] ?? "ℹ️"}</span>
                     <span class="toast-msg">${escHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, 3000);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function showAuth() {
  document.getElementById("auth-overlay").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}

export function hideAuth() {
  document.getElementById("auth-overlay").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

export function setAuthError(msg) {
  const el = document.getElementById("auth-error");
  el.textContent = msg;
  el.classList.toggle("hidden", !msg);
}

export function setAuthMode(mode) {
  const submitBtn = document.getElementById("auth-submit");
  submitBtn.textContent = mode === "login" ? "Sign In" : "Create Account";
  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === mode);
  });
  setAuthError("");
}

// ─── User ─────────────────────────────────────────────────────────────────────

export function renderUser(username) {
  document.getElementById("username-display").textContent = username;
  document.getElementById("user-avatar").textContent = username[0].toUpperCase();
}

// ─── Lists sidebar ────────────────────────────────────────────────────────────

export function renderLists(lists, currentListId, todosByList = {}) {
  const nav = document.getElementById("lists-nav");
  nav.innerHTML = "";

  lists.forEach((list) => {
    const count = (todosByList[list.id] ?? []).filter((t) => !t.completed).length;
    const li = document.createElement("li");
    li.className = `list-item${list.id === currentListId ? " active" : ""}`;
    li.dataset.listId = list.id;
    li.innerHTML = `
      <span class="list-icon">📝</span>
      <span class="list-name">${escHtml(list.name)}</span>
      <span class="todo-badge">${count}</span>`;
    nav.appendChild(li);
  });
}

// ─── Todo panel ───────────────────────────────────────────────────────────────

export function showTodoPanel(list) {
  document.getElementById("empty-state").classList.add("hidden");
  document.getElementById("todo-panel").classList.remove("hidden");
  document.getElementById("list-title").textContent = list.name;
}

export function showEmptyState() {
  document.getElementById("empty-state").classList.remove("hidden");
  document.getElementById("todo-panel").classList.add("hidden");
}

export function renderTodos(todos, filter = "all") {
  const ul = document.getElementById("todo-list");
  const emptyDiv = document.getElementById("todo-empty");
  ul.innerHTML = "";

  const visible = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "done")   return  t.completed;
    return true;
  });

  if (visible.length === 0) {
    emptyDiv.classList.remove("hidden");
  } else {
    emptyDiv.classList.add("hidden");
    visible.forEach((todo) => ul.appendChild(createTodoItem(todo)));
  }
}

export function renderStats(pendingCount, doneCount) {
  const total = pendingCount + doneCount;
  const parts = [];
  if (total === 0) {
    document.getElementById("todo-stats-text").textContent = "No tasks yet";
    return;
  }
  parts.push(`${total} task${total !== 1 ? "s" : ""}`);
  if (doneCount > 0) parts.push(`${doneCount} done`);
  document.getElementById("todo-stats-text").textContent = parts.join(" · ");
}

function createTodoItem(todo) {
  const li = document.createElement("li");
  li.className = `todo-item${todo.completed ? " completed" : ""}`;
  li.dataset.id = todo.id;

  li.innerHTML = `
    <button class="todo-check" title="${todo.completed ? "Mark active" : "Mark done"}"></button>
    <span class="todo-text">${escHtml(todo.task)}</span>
    <div class="todo-actions">
      <button class="action-btn edit-btn" title="Edit">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="action-btn delete delete-btn" title="Delete">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6"/>
        </svg>
      </button>
    </div>`;

  return li;
}

export function enterEditMode(li) {
  const span    = li.querySelector(".todo-text");
  const editBtn = li.querySelector(".edit-btn");
  const current = span.textContent;

  const input = document.createElement("input");
  input.className = "todo-edit-input";
  input.value = current;

  span.replaceWith(input);
  input.focus();
  input.select();

  editBtn.classList.remove("edit-btn");
  editBtn.classList.add("save-btn", "save");
  editBtn.title = "Save";
  editBtn.innerHTML = `
    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`;
}

export function getEditValue(li) {
  return li.querySelector(".todo-edit-input")?.value.trim() ?? null;
}

export function setFilterActive(filter) {
  document.querySelectorAll(".filter-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
