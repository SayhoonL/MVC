import crypto from "node:crypto";
import { lists, todos } from "../data/store.js";

export function getTodos(listId) {
  return todos.filter((todo) => todo.listId === listId);
}

export function createTodo(listId, userId, task, completed) {
  const list = lists.find((list) => list.id === listId);

  if (!list) {
    throw { status: 404, message: "list doesnt exist" };
  }

  if (!task) {
    throw { status: 400, message: "task is required" };
  }

  if (list.creatorId !== userId) {
    throw { status: 403, message: "invalid person" };
  }

  const newTodo = {
    id: crypto.randomUUID(),
    task,
    completed: completed ?? false,
    listId: list.id,
  };

  todos.push(newTodo);
  return newTodo;
}

export function updateTodo(todoId, listId, userId, updates) {
  const list = lists.find((l) => l.id === listId);

  if (!list) {
    throw { status: 404, message: "list doesnt exist" };
  }

  if (list.creatorId !== userId) {
    throw { status: 403, message: "invalid person" };
  }

  const todo = todos.find((t) => t.id === todoId && t.listId === listId);

  if (!todo) {
    throw { status: 404, message: "todo doesnt exist" };
  }

  if (updates.task !== undefined) {
    if (!updates.task.trim()) {
      throw { status: 400, message: "task cannot be empty" };
    }
    todo.task = updates.task.trim();
  }

  if (updates.completed !== undefined) {
    todo.completed = updates.completed;
  }

  return todo;
}

export function deleteTodo(todoId, listId, userId) {
  const list = lists.find((l) => l.id === listId);

  if (!list) {
    throw { status: 404, message: "list doesnt exist" };
  }

  if (list.creatorId !== userId) {
    throw { status: 403, message: "invalid person" };
  }

  const todoIndex = todos.findIndex((t) => t.id === todoId && t.listId === listId);

  if (todoIndex === -1) {
    throw { status: 404, message: "todo doesnt exist" };
  }

  todos.splice(todoIndex, 1);
  return { message: "todo deleted" };
}
