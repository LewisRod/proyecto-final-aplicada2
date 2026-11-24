// Configuración de Prisma 7 para la CLI (migrate, generate, studio…).
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Las migraciones usan la conexión directa de Neon (sin pooler).
    // La API en ejecución usa DATABASE_URL (con pooler) desde src/db.js.
    url: env("DIRECT_URL"),
  },
});
