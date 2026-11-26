/**
 * Manejo central de errores. Express 5 envía aquí los errores lanzados en
 * rutas y controladores (también los async).
 */
export const errorMiddleware = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  // JSON mal formado en el body.
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es JSON válido" });
  }

  // Prisma: valor duplicado en un campo @unique (email, placa, número…).
  if (error?.code === "P2002") {
    return res.status(409).json({ error: "Ya existe un registro con ese valor" });
  }

  // Prisma: registro no encontrado.
  if (error?.code === "P2025") {
    return res.status(404).json({ error: "No encontrado" });
  }

  console.error(`[error] ${req.method} ${req.url}`, error);
  return res.status(500).json({ error: "Error interno del servidor" });
};

/** 404 para rutas que no existen. */
export const notFoundMiddleware = (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.url}` });
};
