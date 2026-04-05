import { getTodos, createTodo, updateTodo, deleteTodo } from "../services/todoService.js";

export function getTodosController(req, res) {
  try {
    const listId = req.params.id;
    const result = getTodos(listId);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json(err.message);
  }
}

export function createTodoController(req, res) {
  try {
    const listId = req.params.id;
    const userId = req.user.userId;
    const { task, completed } = req.body;
    const newTodo = createTodo(listId, userId, task, completed);
    res.status(201).json(newTodo);
  } catch (err) {
    res.status(err.status || 500).json(err.message);
  }
}

export function updateTodoController(req, res) {
  try {
    const { id: listId, todoId } = req.params;
    const userId = req.user.userId;
    const updates = req.body;
    const updated = updateTodo(todoId, listId, userId, updates);
    res.status(200).json(updated);
  } catch (err) {
    res.status(err.status || 500).json(err.message);
  }
}

export function deleteTodoController(req, res) {
  try {
    const { id: listId, todoId } = req.params;
    const userId = req.user.userId;
    const result = deleteTodo(todoId, listId, userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json(err.message);
  }
}
