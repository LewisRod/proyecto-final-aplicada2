import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import prisma from "../db.js";

const datosUsuario = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  telefono: true,
  avatarUrl: true,
  createdAt: true,
};

const generarToken = (usuario) =>
  jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );

export const registrar = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    const existe = await prisma.usuario.findUnique({ where: { email } });

    if (existe) {
      return res
        .status(409)
        .json({ error: "Ya existe un usuario con este email" });
    }

    const hash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: { nombre, email, password: hash, rol },
      select: datosUsuario,
    });

    res.status(201).json({
      usuario,
    });
  } catch (error) {
    console.error(`\nError al realizar registro: `, error);
    res.status(500).json({ error: `Error al realizar registro` });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { ...datosUsuario, password: true },
    });

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const valido = await bcrypt.compare(password, usuario.password);

    if (!valido) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const { password: _, ...usuarioSinPassword } = usuario;

    res.json({ token: generarToken(usuario), usuario: usuarioSinPassword });
  } catch (error) {
    console.error(`\nError al realizar login: ${error}`);
    res.status(500).json({ error: `Error al realizar login` });
  }
};

export const getSession = async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
    });

    if (!usuario) {
      return res.status(401).json({ error: "El usuario ya no existe" });
    }

    res.json({ usuario });
  } catch (error) {
    console.error(`\nError al obtener la sesion: ${error}`);
    res.status(500).json({ error: `Error al obtener la sesion` });
  }
};
