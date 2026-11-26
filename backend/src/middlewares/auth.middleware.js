import jwt from "jsonwebtoken";
import { Rol } from "@prisma/client";

export const verificarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Formato de token inválido" });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);

    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

export const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== Rol.admin) {
    return res.status(403).json({
      error: "Acceso denegado: requieres rol de administrador",
    });
  }
  next();
};

export const soloCliente = (req, res, next) => {
  if (req.usuario?.rol !== Rol.cliente) {
    return res.status(403).json({
      error: "Acceso denegado: esta ruta es para clientes",
    });
  }
  next();
};

export const validarNombre = (req, res, next) => {
  const nombre = req.body?.nombre;

  if (typeof nombre !== "string" || nombre.trim().length < 2) {
    return res
      .status(400)
      .json({ error: "El nombre debe tener al menos 2 caracteres" });
  }
  req.body.nombre = nombre.trim();
  next();
};

export const validarEmail = (req, res, next) => {
  const email = req.body?.email;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (typeof email !== "string" || !emailRegex.test(email.trim())) {
    return res.status(400).json({ error: "El email no es válido" });
  }
  req.body.email = email.trim().toLowerCase();
  next();
};

// Solo para el registro: las mismas reglas que el formulario del frontend.
export const validarPassword = (req, res, next) => {
  const password = req.body?.password;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (typeof password !== "string" || !passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        "La contraseña debe tener al menos 8 caracteres, con mayúscula, minúscula y número",
    });
  }
  next();
};

// Para el login: no aplica las reglas de fortaleza a contraseñas ya creadas.
export const requerirPassword = (req, res, next) => {
  const password = req.body?.password;

  if (typeof password !== "string" || password === "") {
    return res.status(400).json({ error: "Password requerido" });
  }
  next();
};

export const validarRol = (req, res, next) => {
  const rol = req.body?.rol;

  if (rol !== undefined && !Object.values(Rol).includes(rol)) {
    return res.status(400).json({
      error: `Rol inválido. Opciones válidas: ${Object.values(Rol).join(", ")}`,
    });
  }
  next();
};
