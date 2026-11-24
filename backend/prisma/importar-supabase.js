// Importa los datos de PickyRentCar desde Supabase a Neon (Prisma).
//
//   node prisma/importar-supabase.js --dry-run   → muestra qué haría, no escribe
//   node prisma/importar-supabase.js             → importa
//
// - Lee Supabase en modo SOLO LECTURA (SUPABASE_DB_URL + prisma/supabase-ca-2021.crt).
// - Escribe en Neon con Prisma (DATABASE_URL). Conserva los ids originales.
// - Se puede repetir: usa upsert, así que el día del cambio definitivo trae
//   lo nuevo y actualiza lo existente.
//
// Decisiones (ver docs/MIGRACION-SUPABASE.md):
// - Usuarios sin contraseña (entraban con Google): se importan con una
//   contraseña aleatoria que nadie conoce → no pueden iniciar sesión hasta
//   que se les asigne una.
// - Reservas: se aplican las reglas del sistema para que no queden cruces
//   (la base nueva prohíbe el doble alquiler):
//     · pendiente_pago con fecha de fin ya pasada o plazo de pago vencido → cancelada
//     · activa / confirmada con fecha de fin ya pasada → finalizada
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import bcrypt from "bcryptjs";
import pg from "pg";

import prisma from "../src/db.js";

const DRY_RUN = process.argv.includes("--dry-run");
const HERE = path.dirname(fileURLToPath(import.meta.url));

// DATE como texto ("2026-08-29") para no desplazar días por la zona horaria.
pg.types.setTypeParser(1082, (value) => value);

function todayIso() {
  // Fecha local de República Dominicana (UTC-4).
  return new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);
}

function asDate(isoDate) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

async function connectSupabase() {
  const raw = process.env.SUPABASE_DB_URL;
  if (!raw) throw new Error("Falta SUPABASE_DB_URL en el .env");
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  const client = new pg.Client({
    connectionString: url.toString(),
    ssl: {
      ca: fs.readFileSync(path.join(HERE, "supabase-ca-2021.crt"), "utf8"),
      rejectUnauthorized: true,
    },
  });
  await client.connect();
  await client.query("set default_transaction_read_only = on");
  return client;
}

async function main() {
  const supabase = await connectSupabase();
  const read = async (sql) => (await supabase.query(sql)).rows;
  const today = todayIso();
  const now = new Date();
  const report = { cambiosDeEstado: [], errores: [] };

  // ---------------------------------------------------------------- usuarios
  const usuarios = await read(`
    select u.id, lower(u.email) as email, u.encrypted_password, u.created_at,
           u.raw_user_meta_data->>'full_name' as meta_name,
           p.full_name, p.role, p.phone, p.avatar_url,
           p.banco, p.tipo_cuenta, p.numero_cuenta, p.titular_cuenta, p.updated_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    where u.email is not null
    order by u.created_at`);

  const userIds = new Set(usuarios.map((u) => u.id));
  let sinPassword = 0;

  const usuariosData = await Promise.all(
    usuarios.map(async (u) => {
      let password = u.encrypted_password;
      if (!password) {
        sinPassword++;
        // Hash de una clave aleatoria: nadie puede iniciar sesión con ella.
        password = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
      }
      return {
        id: u.id,
        nombre: u.full_name || u.meta_name || u.email.split("@")[0],
        email: u.email,
        password,
        rol: u.role === "admin" ? "admin" : "cliente",
        telefono: u.phone ?? null,
        avatarUrl: u.avatar_url ?? null,
        banco: u.banco ?? null,
        tipoCuenta: u.tipo_cuenta ?? null,
        numeroCuenta: u.numero_cuenta ?? null,
        titularCuenta: u.titular_cuenta ?? null,
        createdAt: u.created_at,
        updatedAt: u.updated_at ?? u.created_at,
      };
    }),
  );

  // --------------------------------------------------------------- vehículos
  const vehiculos = await read(`select * from public.vehicles order by created_at`);
  const vehicleIds = new Set(vehiculos.map((v) => v.id));
  const vehiculosData = vehiculos.map((v) => ({
    id: v.id,
    createdById: userIds.has(v.created_by) ? v.created_by : null,
    nombre: v.nombre,
    plate: v.plate,
    brand: v.brand,
    model: v.model,
    year: v.year,
    color: v.color,
    seats: v.seats,
    status: v.status,
    transmission: v.transmission,
    fuelType: v.fuel_type,
    category: v.category,
    dailyPrice: v.daily_price,
    notes: v.notes,
    imageUrls: v.image_urls ?? [],
    createdAt: v.created_at,
    updatedAt: v.updated_at ?? v.created_at,
  }));

  // ---------------------------------------------------------------- reservas
  const reservas = await read(`select * from public.reservations order by created_at`);
  const reservaIds = new Set();
  const reservasData = [];
  for (const r of reservas) {
    if (!vehicleIds.has(r.vehicle_id)) {
      report.errores.push(`${r.numero}: su vehículo no existe, se omite`);
      continue;
    }
    let status = r.status;
    const ended = r.end_date < today;
    const dueExpired = r.payment_due_at && new Date(r.payment_due_at) < now;
    if (status === "pendiente_pago" && (ended || dueExpired)) status = "cancelada";
    else if ((status === "activa" || status === "confirmada") && ended) status = "finalizada";
    if (status !== r.status) {
      report.cambiosDeEstado.push(`${r.numero}: ${r.status} → ${status} (${r.start_date}→${r.end_date})`);
    }
    reservaIds.add(r.id);
    reservasData.push({
      id: r.id,
      numero: r.numero,
      vehicleId: r.vehicle_id,
      clientId: userIds.has(r.client_id) ? r.client_id : null,
      clientName: r.client_name,
      clientEmail: r.client_email,
      clientPhone: r.client_phone,
      startDate: asDate(r.start_date),
      endDate: asDate(r.end_date),
      days: r.days,
      dailyPrice: r.daily_price,
      totalPrice: r.total_price,
      status,
      paymentDueAt: r.payment_due_at,
      notes: r.notes,
      location: r.location,
      createdAt: r.created_at,
      updatedAt: r.updated_at ?? r.created_at,
    });
  }

  // ------------------------------------------------------------------- pagos
  const pagos = await read(`select * from public.pagos order by created_at`);
  const pagosData = pagos
    .filter((p) => {
      if (reservaIds.has(p.reservation_id)) return true;
      report.errores.push(`pago ${p.id}: su reserva no se importó, se omite`);
      return false;
    })
    .map((p) => ({
      id: p.id,
      reservationId: p.reservation_id,
      monto: p.monto,
      metodoPago: p.metodo_pago,
      estado: p.estado,
      referencia: p.referencia,
      notas: p.notas,
      comprobantePath: p.comprobante_path ?? null,
      motivoRechazo: p.motivo_rechazo ?? null,
      createdById: userIds.has(p.created_by) ? p.created_by : null,
      createdAt: p.created_at,
      updatedAt: p.updated_at ?? p.created_at,
    }));

  // --------------------------------------------------------------- favoritos
  const favoritos = await read(`select * from public.favorites order by created_at`);
  const favoritosData = favoritos
    .filter((f) => userIds.has(f.user_id) && vehicleIds.has(f.vehicle_id))
    .map((f) => ({
      id: f.id,
      userId: f.user_id,
      vehicleId: f.vehicle_id,
      createdAt: f.created_at,
    }));

  await supabase.end();

  console.log(`Origen Supabase: ${usuarios.length} usuarios (${sinPassword} sin contraseña), ` +
    `${vehiculos.length} vehículos, ${reservas.length} reservas, ${pagos.length} pagos, ${favoritos.length} favoritos`);
  console.log(`\nCambios de estado en reservas (${report.cambiosDeEstado.length}):`);
  for (const line of report.cambiosDeEstado) console.log(`  · ${line}`);
  if (report.errores.length) {
    console.log(`\nOmitidos (${report.errores.length}):`);
    for (const line of report.errores) console.log(`  · ${line}`);
  }

  if (DRY_RUN) {
    console.log("\n--dry-run: no se escribió nada en Neon.");
    await prisma.$disconnect();
    return;
  }

  // ------------------------------------------------------------- escribir
  const upsertAll = async (label, model, rows) => {
    let ok = 0;
    for (const row of rows) {
      const { id, ...rest } = row;
      try {
        await model.upsert({ where: { id }, create: row, update: rest });
        ok++;
      } catch (error) {
        report.errores.push(`${label} ${row.numero ?? id}: ${error.code ?? ""} ${String(error.message).split("\n").pop()}`);
      }
    }
    console.log(`  ${label}: ${ok}/${rows.length}`);
  };

  console.log("\nImportando en Neon…");
  await upsertAll("usuarios", prisma.usuario, usuariosData);
  await upsertAll("vehículos", prisma.vehiculo, vehiculosData);
  await upsertAll("reservas", prisma.reserva, reservasData);
  await upsertAll("pagos", prisma.pago, pagosData);
  await upsertAll("favoritos", prisma.favorito, favoritosData);

  if (report.errores.length) {
    console.log(`\nErrores (${report.errores.length}):`);
    for (const line of report.errores) console.log(`  · ${line}`);
  }
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Falló la importación:", String(error.message).replace(/postgres(ql)?:\/\/\S+/g, "<url>"));
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
