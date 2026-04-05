import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getListsController,
  createListController,
  updateListController,
  deleteListController,
} from "../controllers/listController.js";
import {
  getTodosController,
  createTodoController,
  updateTodoController,
  deleteTodoController,
} from "../controllers/todoController.js";

const router = Router();

router.get("/lists", authMiddleware, getListsController);
router.post("/lists", authMiddleware, createListController);
router.patch("/lists/:id", authMiddleware, updateListController);
router.delete("/lists/:id", authMiddleware, deleteListController);

router.get("/lists/:id/todos", authMiddleware, getTodosController);
router.post("/lists/:id/todos", authMiddleware, createTodoController);
router.patch("/lists/:id/todos/:todoId", authMiddleware, updateTodoController);
router.delete("/lists/:id/todos/:todoId", authMiddleware, deleteTodoController);

export default router;
