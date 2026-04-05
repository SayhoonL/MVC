import { signup, login, refresh } from "../services/authService.js";

export async function signupController(req, res) {
  try {
    const { username, password } = req.body;
    await signup(username, password);
    res.status(201).json("new user has added");
  } catch (err) {
    res.status(err.status || 500).json(err.message);
  }
}

export async function loginController(req, res) {
  try {
    const { username, password } = req.body;
    const result = await login(username, password);
    res.status(200).json({ message: "logged in", ...result });
  } catch (err) {
    res.status(err.status || 500).json(err.message);
  }
}

export function refreshController(req, res) {
  try {
    const authHead = req.headers.authorization;
    const parts = authHead.split(" ");
    const refreshToken = parts[1];
    const token = refresh(refreshToken);
    res.status(200).json(token);
  } catch (err) {
    res.status(err.status || 500).json(err.message);
  }
}

export function getMeController(req, res) {
  res.status(200).json(req.user);
}
