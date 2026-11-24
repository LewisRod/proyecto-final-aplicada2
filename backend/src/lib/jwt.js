import jwt from "jsonwebtoken";

const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Falta JWT_SECRET en el .env");
  }
  return secret;
}

/** Firma el token de sesión con lo mínimo necesario: id, email y rol. */
export function signToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, email: usuario.email, rol: usuario.rol },
    getSecret(),
    { expiresIn: EXPIRES_IN },
  );
}

/** Verifica el token y devuelve { id, email, rol }. Lanza si no es válido. */
export function verifyToken(token) {
  const payload = jwt.verify(token, getSecret());
  return { id: payload.sub, email: payload.email, rol: payload.rol };
}
