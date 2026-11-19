import "dotenv/config";
import express from "express";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";

const app = express();

app.use(express.json());

app.listen(3000, () => {
  console.log("tamo en el puerto 3000");
});
