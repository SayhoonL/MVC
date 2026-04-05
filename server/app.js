import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/authRoutes.js";
import listRoutes from "./routes/listRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../client")));

app.use(authRoutes);
app.use(listRoutes);

export default app;
