import { AppState } from "./model.js";
import * as View from "./view.js";

const state = new AppState();

// ─── Boot ──────────────────────────────────────────────────────────────────────

async function init() {
  if (!state.api.isLoggedIn()) {
    View.showAuth();
    bindAuthEvents();
    return;
  }

  try {
    state.user = await state.api.getMe();
    await boot();
  } catch {
    state.api.clearAuth();
    View.showAuth();
    bindAuthEvents();
  }
}

async function boot() {
  View.renderUser(state.user.username ?? state.user.userId);
  View.hideAuth();
  state.lists = await state.api.getLists();
  View.renderLists(state.lists, state.currentListId);
  bindAppEvents();
}

// ─── Auth events ──────────────────────────────────────────────────────────────

function bindAuthEvents() {
  let mode = "login";

  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      mode = tab.dataset.tab;
      View.setAuthMode(mode);
    });
  });

  document.getElementById("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("auth-username").value.trim();
    const password = document.getElementById("auth-password").value;

    if (!username || !password) {
      View.setAuthError("Please fill in all fields.");
      return;
    }

    const btn = document.getElementById("auth-submit");
    btn.disabled = true;
    btn.textContent = "…";
    View.setAuthError("");

    try {
      if (mode === "signup") {
        await state.api.signup(username, password);
        await state.api.login(username, password);
      } else {
        await state.api.login(username, password);
      }
      state.user = await state.api.getMe();
      await boot();
    } catch (err) {
      View.setAuthError(err.message ?? "Something went wrong.");
    } finally {
      btn.disabled = false;
      btn.textContent = mode === "login" ? "Sign In" : "Create Account";
    }
  });
}

// ─── App events ───────────────────────────────────────────────────────────────

function bindAppEvents() {
  document.getElementById("logout-btn").addEventListener("click", handleLogout);

  // New list
  document.getElementById("new-list-btn").addEventListener("click", openListModal);
  document.getElementById("create-first-list-btn").addEventListener("click", openListModal);
  document.getElementById("cancel-list-btn").addEventListener("click", closeListModal);
  document.getElementById("modal-overlay").addEventListener("click", closeListModal);

  document.getElementById("new-list-form").addEventListener("submit", handleCreateList);

  // List nav (event delegation)
  document.getElementById("lists-nav").addEventListener("click", handleListNavClick);

  // Delete current list
  document.getElementById("delete-list-btn").addEventListener("click", handleDeleteList);

  // Add todo
  document.getElementById("todo-form").addEventListener("submit", handleAddTodo);

  // Sort
  document.getElementById("sort-btn").addEventListener("click", handleSort);

  // Filter tabs
  document.querySelectorAll(".filter-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter;
      View.setFilterActive(state.filter);
      View.renderTodos(state.todos, state.filter);
    });
  });

  // Todo list (event delegation)
  document.getElementById("todo-list").addEventListener("click", handleTodoClick);

  // Save edit on Enter key inside edit input
  document.getElementById("todo-list").addEventListener("keydown", handleTodoKeydown);
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

function handleLogout() {
  state.api.clearAuth();
  state.user          = null;
  state.lists         = [];
  state.currentListId = null;
  state.todos         = [];
  View.showAuth();
  View.showEmptyState();
  View.setAuthMode("login");
}

// — List modal —

function openListModal() {
  document.getElementById("new-list-modal").classList.remove("hidden");
  document.getElementById("new-list-name").value = "";
  document.getElementById("new-list-name").focus();
}

function closeListModal() {
  document.getElementById("new-list-modal").classList.add("hidden");
}

async function handleCreateList(e) {
  e.preventDefault();
  const name = document.getElementById("new-list-name").value.trim();
  if (!name) return;

  try {
    const list = await state.api.createList(name);
    state.lists.push(list);
    closeListModal();
    View.renderLists(state.lists, state.currentListId);
    View.showToast(`List "${name}" created`, "success");
    await selectList(list.id);
  } catch (err) {
    View.showToast(err.message ?? "Failed to create list", "error");
  }
}

// — List selection —

async function handleListNavClick(e) {
  const item = e.target.closest(".list-item");
  if (!item) return;
  await selectList(item.dataset.listId);
}

async function selectList(listId) {
  state.currentListId = listId;
  const list = state.currentList;
  if (!list) return;

  try {
    state.todos = await state.api.getTodos(listId);
  } catch {
    state.todos = [];
  }

  View.renderLists(state.lists, listId);
  View.showTodoPanel(list);
  View.renderTodos(state.todos, state.filter);
  View.renderStats(state.pendingCount, state.doneCount);
}

// — Delete list —

async function handleDeleteList() {
  if (!state.currentListId) return;
  const list = state.currentList;
  if (!list) return;

  if (!confirm(`Delete list "${list.name}" and all its tasks?`)) return;

  try {
    await state.api.deleteList(state.currentListId);
    state.lists = state.lists.filter((l) => l.id !== state.currentListId);
    state.currentListId = null;
    state.todos = [];
    View.renderLists(state.lists, null);
    View.showEmptyState();
    View.showToast("List deleted", "info");
  } catch (err) {
    View.showToast(err.message ?? "Failed to delete list", "error");
  }
}

// — Add todo —

async function handleAddTodo(e) {
  e.preventDefault();
  const input = document.getElementById("todo-input");
  const task  = input.value.trim();
  if (!task || !state.currentListId) return;

  try {
    const todo = await state.api.createTodo(state.currentListId, task);
    state.todos.unshift(todo);
    input.value = "";
    View.renderTodos(state.todos, state.filter);
    View.renderStats(state.pendingCount, state.doneCount);
    View.renderLists(state.lists, state.currentListId);
    View.showToast("Task added", "success");
  } catch (err) {
    View.showToast(err.message ?? "Failed to add task", "error");
  }
}

// — Todo actions (toggle / edit / delete) —

async function handleTodoClick(e) {
  const li = e.target.closest("li");
  if (!li) return;
  const todoId = li.dataset.id;

  if (e.target.closest(".todo-check")) {
    await handleToggle(todoId);
    return;
  }

  if (e.target.closest(".delete-btn")) {
    await handleDelete(li, todoId);
    return;
  }

  if (e.target.closest(".edit-btn")) {
    View.enterEditMode(li);
    return;
  }

  if (e.target.closest(".save-btn")) {
    await handleSave(li, todoId);
  }
}

async function handleTodoKeydown(e) {
  if (e.key !== "Enter") return;
  const li = e.target.closest("li");
  if (!li?.querySelector(".todo-edit-input")) return;
  e.preventDefault();
  await handleSave(li, li.dataset.id);
}

async function handleToggle(todoId) {
  const todo = state.todos.find((t) => t.id === todoId);
  if (!todo) return;

  try {
    const updated = await state.api.updateTodo(state.currentListId, todoId, {
      completed: !todo.completed,
    });
    Object.assign(todo, updated);
    View.renderTodos(state.todos, state.filter);
    View.renderStats(state.pendingCount, state.doneCount);
    View.renderLists(state.lists, state.currentListId);
  } catch (err) {
    View.showToast(err.message ?? "Failed to update task", "error");
  }
}

async function handleSave(li, todoId) {
  const newText = View.getEditValue(li);
  if (!newText) return;

  const todo = state.todos.find((t) => t.id === todoId);
  if (!todo || newText === todo.task) {
    // No change — re-render to restore view
    View.renderTodos(state.todos, state.filter);
    return;
  }

  try {
    const updated = await state.api.updateTodo(state.currentListId, todoId, { task: newText });
    Object.assign(todo, updated);
    View.renderTodos(state.todos, state.filter);
    View.showToast("Task updated", "success");
  } catch (err) {
    View.showToast(err.message ?? "Failed to update task", "error");
    View.renderTodos(state.todos, state.filter);
  }
}

async function handleDelete(li, todoId) {
  try {
    await state.api.deleteTodo(state.currentListId, todoId);
    state.todos = state.todos.filter((t) => t.id !== todoId);
    li.style.animation = "none";
    li.style.transition = "opacity .15s";
    li.style.opacity = "0";
    setTimeout(() => {
      View.renderTodos(state.todos, state.filter);
      View.renderStats(state.pendingCount, state.doneCount);
      View.renderLists(state.lists, state.currentListId);
    }, 150);
  } catch (err) {
    View.showToast(err.message ?? "Failed to delete task", "error");
  }
}

// — Sort —

function handleSort() {
  state.sortTodos();
  View.renderTodos(state.todos, state.filter);
  View.showToast("Sorted A–Z", "info");
}

// ─── Start ─────────────────────────────────────────────────────────────────────

init();
