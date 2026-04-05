import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { JWT_SECRET } from "../config.js";
import { users, refreshTokens } from "../data/store.js";

export async function signup(username, password) {
  if (!username || !password) {
    throw { status: 400, message: "username and password are required" };
  }

  if (users.find((user) => user.username === username)) {
    throw { status: 400, message: "same username exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: crypto.randomUUID(),
    username,
    password: hashedPassword,
  };

  users.push(newUser);
  return newUser;
}

export async function login(username, password) {
  const finduser = users.find((user) => user.username === username);
  if (!finduser) {
    throw { status: 400, message: "wrong username" };
  }

  const check = await bcrypt.compare(password, finduser.password);
  if (!check) {
    throw { status: 400, message: "failed to verify" };
  }

  const token = jwt.sign(
    { userId: finduser.id, username: finduser.username, role: "user" },
    JWT_SECRET,
    { expiresIn: "60m" }
  );

  const refreshToken = jwt.sign(
    { userId: finduser.id, username: finduser.username, role: "user" },
    JWT_SECRET
  );

  refreshTokens.push(refreshToken);

  return { token, refreshToken };
}

export function refresh(refreshToken) {
  if (!refreshToken) {
    throw { status: 400, message: "invalid refresh token" };
  }

  if (!refreshTokens.find((rt) => rt === refreshToken)) {
    throw { status: 400, message: "invalid refresh token" };
  }

  try {
    const user = jwt.verify(refreshToken, JWT_SECRET);
    const token = jwt.sign(
      { userId: user.userId, role: user.role },
      JWT_SECRET,
      { expiresIn: "60m" }
    );
    return token;
  } catch (err) {
    throw { status: 401, message: "invalid token" };
  }
}
