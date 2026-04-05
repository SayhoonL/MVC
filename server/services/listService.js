import crypto from "node:crypto";
import { lists, todos } from "../data/store.js";

export function getLists(userId) {
  return lists.filter((list) => list.creatorId === userId);
}

export function getList(id, userId) {
  const list = lists.find((l) => l.id === id);

  if (!list) {
    throw { status: 404, message: "list doesnt exist" };
  }

  if (list.creatorId !== userId) {
    throw { status: 403, message: "invalid person" };
  }

  return list;
}

export function createList(userId, name) {
  if (!name) {
    throw { status: 400, message: "name is required" };
  }

  const newList = {
    id: crypto.randomUUID(),
    name,
    creatorId: userId,
  };

  lists.push(newList);
  return newList;
}

export function updateList(id, userId, name) {
  const list = lists.find((list) => list.id === id);

  if (!list) {
    throw { status: 404, message: "list doesnt exist" };
  }

  if (!name) {
    throw { status: 400, message: "name is required" };
  }

  if (list.creatorId !== userId) {
    throw { status: 403, message: "invalid person" };
  }

  list.name = name;
  return list;
}

export function deleteList(id, userId) {
  const list = lists.find((l) => l.id === id);

  if (!list) {
    throw { status: 404, message: "list doesnt exist" };
  }

  if (list.creatorId !== userId) {
    throw { status: 403, message: "invalid person" };
  }

  const listIndex = lists.findIndex((l) => l.id === id);
  lists.splice(listIndex, 1);

  // cascade-delete associated todos
  for (let i = todos.length - 1; i >= 0; i--) {
    if (todos[i].listId === id) todos.splice(i, 1);
  }

  return { message: "list deleted" };
}
