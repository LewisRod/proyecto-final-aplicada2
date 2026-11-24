/*
  Warnings:

  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "rol" AS ENUM ('admin', 'cliente');

-- CreateEnum
CREATE TYPE "estado_vehiculo" AS ENUM ('available', 'in_use', 'maintenance');

-- CreateEnum
CREATE TYPE "estado_reserva" AS ENUM ('pendiente', 'pendiente_pago', 'confirmada', 'activa', 'finalizada', 'cancelada');

-- CreateEnum
CREATE TYPE "metodo_pago" AS ENUM ('Efectivo', 'Transferencia', 'Tarjeta');

-- CreateEnum
CREATE TYPE "estado_pago" AS ENUM ('pendiente', 'completado', 'fallido', 'reembolsado');

-- DropTable
DROP TABLE "Usuario";

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "rol" NOT NULL DEFAULT 'cliente',
    "phone" TEXT,
    "avatar_url" TEXT,
    "banco" TEXT,
    "tipo_cuenta" TEXT,
    "numero_cuenta" TEXT,
    "titular_cuenta" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "created_by" UUID,
    "nombre" TEXT,
    "plate" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT,
    "seats" INTEGER DEFAULT 5,
    "status" "estado_vehiculo" NOT NULL DEFAULT 'available',
    "transmission" TEXT NOT NULL DEFAULT 'Automático',
    "fuel_type" TEXT NOT NULL DEFAULT 'Gasolina',
    "category" TEXT NOT NULL DEFAULT 'Sedán',
    "daily_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "client_id" UUID,
    "client_name" TEXT NOT NULL,
    "client_email" TEXT,
    "client_phone" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "days" INTEGER NOT NULL,
    "daily_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "status" "estado_reserva" NOT NULL DEFAULT 'pendiente',
    "payment_due_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "location" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodo_pago" "metodo_pago" NOT NULL,
    "estado" "estado_pago" NOT NULL DEFAULT 'pendiente',
    "referencia" TEXT,
    "notas" TEXT,
    "comprobante_path" TEXT,
    "motivo_rechazo" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE INDEX "vehicles_created_by_idx" ON "vehicles"("created_by");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_numero_key" ON "reservations"("numero");

-- CreateIndex
CREATE INDEX "reservations_vehicle_id_idx" ON "reservations"("vehicle_id");

-- CreateIndex
CREATE INDEX "reservations_client_id_idx" ON "reservations"("client_id");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- CreateIndex
CREATE INDEX "pagos_reservation_id_idx" ON "pagos"("reservation_id");

-- CreateIndex
CREATE INDEX "pagos_estado_idx" ON "pagos"("estado");

-- CreateIndex
CREATE INDEX "favorites_vehicle_id_idx" ON "favorites"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_vehicle_id_key" ON "favorites"("user_id", "vehicle_id");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Restricciones agregadas a mano (Prisma no las expresa en schema.prisma).
-- Equivalen a las que tenía PickyRentCar en Supabase (migraciones 001, 007, 022).
-- ============================================================================

-- Fechas y noches coherentes. Se admite end_date = start_date porque las
-- reservas antiguas de Supabase contaban días inclusivos (días >= 1).
ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_dates_valid" CHECK ("end_date" >= "start_date"),
  ADD CONSTRAINT "reservations_days_valid" CHECK ("days" >= 1),
  ADD CONSTRAINT "reservations_total_valid" CHECK ("total_price" >= 0);

ALTER TABLE "pagos"
  ADD CONSTRAINT "pagos_monto_positive" CHECK ("monto" > 0);

ALTER TABLE "vehicles"
  ADD CONSTRAINT "vehicles_daily_price_valid" CHECK ("daily_price" >= 0);

-- Doble alquiler imposible: dos reservas que apartan fechas (por pagar,
-- confirmada o en curso) no pueden solaparse para el mismo vehículo.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_no_overlap"
  EXCLUDE USING gist (
    "vehicle_id" WITH =,
    daterange("start_date", "end_date", '[]') WITH &&
  )
  WHERE ("status" IN ('pendiente_pago', 'confirmada', 'activa'));
