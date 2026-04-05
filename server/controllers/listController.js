import { getLists, createList, updateList, deleteList } from "../services/listService.js";

export function getListsController(req, res) {
  try {
    const userId = req.user.userId;
    const result = getLists(userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json(err.message);
  }
}

export function createListController(req, res) {
  try {
    const userId = req.user.userId;
    const { name } = req.body;
    const newList = createList(userId, name);
    res.status(201).json(newList);
  } catch (err) {
    res.status(err.status || 500).json(err.message);
  }
}

export function updateListController(req, res) {
  try {
    const id = req.params.id;
    const userId = req.user.userId;
    const { name } = req.body;
    const updated = updateList(id, userId, name);
    res.status(200).json(updated);
  } catch (err) {
    res.status(err.status || 500).json(err.message);
  }
}

export function deleteListController(req, res) {
  try {
    const id = req.params.id;
    const userId = req.user.userId;
    const result = deleteList(id, userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json(err.message);
  }
}
