import { Router } from "express";

import { getSession, login, registrar } from "../controllers/auth.controller.js";
import {
  requerirPassword,
  validarEmail,
  validarNombre,
  validarPassword,
  validarRol,
  verificarToken,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/register",
  validarNombre,
  validarEmail,
  validarPassword,
  validarRol,
  registrar,
);
router.post("/login", validarEmail, requerirPassword, login);
router.get("/session", verificarToken, getSession);

export default router;
