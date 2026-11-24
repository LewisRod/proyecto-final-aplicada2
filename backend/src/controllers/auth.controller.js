import bcrypt from "bcryptjs";

import prisma from "../db.js";
import { signToken } from "../lib/jwt.js";

// Mismo costo que usaba Supabase ($2a$10$...), así los hashes migrados y los
// nuevos son compatibles.
const SALT_ROUNDS = 10;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Igual que el formulario del frontend: 8+ caracteres, mayúscula, minúscula y número.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/** Campos públicos del usuario: nunca se devuelve el hash. */
export const USUARIO_PUBLICO = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  telefono: true,
  avatarUrl: true,
  createdAt: true,
};

/**
 * POST /auth/register
 * body: { nombre, email, password, rol? }
 * rol "admin" registra un dueño de flota (multi-tenant); cualquier otro valor
 * o la ausencia de rol crea un cliente.
 */
export async function register(req, res) {
  const nombre = String(req.body?.nombre ?? "").trim();
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const rol = req.body?.rol === "admin" ? "admin" : "cliente";

  const errores = {};
  if (nombre.length < 2) errores.nombre = "Escribe tu nombre (mínimo 2 caracteres).";
  if (!EMAIL_REGEX.test(email)) errores.email = "Correo no válido.";
  if (!PASSWORD_REGEX.test(password)) {
    errores.password =
      "La contraseña necesita 8 caracteres o más, con mayúscula, minúscula y número.";
  }
  if (Object.keys(errores).length > 0) {
    return res.status(400).json({ mensaje: "Revisa los datos", errores });
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    return res.status(409).json({
      mensaje: "Ya existe una cuenta con ese correo",
      errores: { email: "Ya existe una cuenta con ese correo." },
    });
  }

  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      email,
      password: await bcrypt.hash(password, SALT_ROUNDS),
      rol,
    },
    select: USUARIO_PUBLICO,
  });

  return res.status(201).json({ token: signToken(usuario), usuario });
}

/**
 * POST /auth/login
 * body: { email, password }
 */
export async function login(req, res) {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!email || !password) {
    return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Mismo mensaje si el correo no existe o la contraseña no coincide, para
  // no revelar qué correos están registrados.
  const valido = usuario ? await bcrypt.compare(password, usuario.password) : false;
  if (!usuario || !valido) {
    return res.status(401).json({ mensaje: "Correo o contraseña incorrectos" });
  }

  // Solo los campos públicos (nunca el hash).
  const publico = Object.fromEntries(
    Object.keys(USUARIO_PUBLICO).map((campo) => [campo, usuario[campo]]),
  );
  return res.json({ token: signToken(usuario), usuario: publico });
}

/**
 * GET /auth/me  (requiere token)
 * Devuelve el usuario actual leído de la base (no solo del token), para que
 * cambios de nombre o rol se reflejen sin volver a iniciar sesión.
 */
export async function me(req, res) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario.id },
    select: USUARIO_PUBLICO,
  });

  if (!usuario) {
    return res.status(401).json({ mensaje: "La cuenta ya no existe" });
  }

  return res.json({ usuario });
}
