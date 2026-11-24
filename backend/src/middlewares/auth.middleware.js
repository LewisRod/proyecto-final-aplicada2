import { verifyToken } from "../lib/jwt.js";

/**
 * Exige un JWT válido en el header "Authorization: Bearer <token>".
 * Deja el usuario del token en req.usuario = { id, email, rol }.
 */
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ mensaje: "Token requerido" });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ mensaje: "Formato de token inválido" });
  }

  try {
    req.usuario = verifyToken(token);
    next();
  } catch (error) {
    // Token vencido, mal firmado o alterado: 401, no 500.
    const mensaje =
      error?.name === "TokenExpiredError"
        ? "Tu sesión expiró. Inicia sesión de nuevo."
        : "Token inválido";
    return res.status(401).json({ mensaje });
  }
};

/**
 * Exige uno de los roles indicados. Usar después de authMiddleware.
 * Ejemplo: router.get("/vehiculos", authMiddleware, requireRol("admin"), ...)
 */
export const requireRol =
  (...roles) =>
  (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res
        .status(403)
        .json({ mensaje: "No tienes permiso para esta acción" });
    }
    next();
  };
