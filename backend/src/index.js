import "dotenv/config";
import express from "express";

import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

// 4000 por defecto para no chocar con Next.js (3000) en desarrollo.
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json());
app.use(loggerMiddleware);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
