import {
  listarPagos,
  registrarPago,
  confirmarPago,
  rechazarPago,
} from "../controllers/pagos.controller.js";
import {
  verificarToken,
  soloAdmin,
  soloCliente,
} from "../middlewares/auth.middleware.js";
import express from "express";


const router = express.Router();

router.get("/", verificarToken, soloAdmin, listarPagos);
router.post("/", verificarToken, soloCliente, registrarPago);
router.put("/:id/confirmar", verificarToken, soloAdmin, confirmarPago)
router.put("/:id/rechazar", verificarToken, soloAdmin, rechazarPago)

export default router