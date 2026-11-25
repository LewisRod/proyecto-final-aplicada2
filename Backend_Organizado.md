# PickyRentCar — Backend

## 1. Estructura del backend

```text
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── routes/
│   │   ├── index.routes.js
│   │   ├── auth.routes.js
│   │   ├── usuarios.routes.js
│   │   ├── perfil.routes.js
│   │   ├── vehiculos.routes.js
│   │   ├── catalogo.routes.js
│   │   ├── reservas.routes.js
│   │   ├── pagos.routes.js
│   │   ├── favoritos.routes.js
│   │   ├── clientes.routes.js
│   │   ├── reportes.routes.js
│   │   └── dashboard.routes.js


│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── logger.middleware.js

│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── usuarios.controller.js
│   │   ├── perfil.controller.js
│   │   ├── vehiculos.controller.js
│   │   ├── catalogo.controller.js
│   │   ├── reservas.controller.js
│   │   ├── pagos.controller.js
│   │   ├── favoritos.controller.js
│   │   ├── clientes.controller.js
│   │   ├── reportes.controller.js
│   │   └── dashboard.controller.js
│   ├── db.js
│   └── index.js
├── .env
├── .gitignore
├── package.json
└── package-lock.json
```

---

## 2. Modulos


### 2.1 Autenticación — `/auth`

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| POST | `/auth/register` | Registrar un cliente | Público |
| POST | `/auth/login` | Iniciar sesión | Público |
| GET | `/auth/session` | Obtener usuario y sesión actual | Autenticado |
| POST | `/auth/logout` | Cerrar sesión | Autenticado |




### 2.2 Usuarios y perfil — `usuarios` / `perfil`

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/usuarios` | Listar usuarios | ADMIN |
| GET | `/usuarios/:id` | Consultar un usuario específico | ADMIN |
| GET | `/perfil` | Consultar mi perfil | CLIENTE |
| PUT | `/perfil` | Actualizar mi perfil | CLIENTE |




### 2.3 Vehiculos — `/vehiculos` (administración)

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/api/vehiculos` | Listar vehículos propios | ADMIN |
| GET | `/api/vehiculos/:id` | Consultar vehículo específico | ADMIN |
| POST | `/api/vehiculos` | Registrar vehículo | ADMIN |
| PUT | `/api/vehiculos/:id` | Actualizar vehículo | ADMIN |
| DELETE | `/api/vehiculos/:id` | Eliminar vehículo | ADMIN |





### 2.4 Catalogo publico — `/catalogo`

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/catalogo/vehiculos` | Listar y filtrar vehículos | Público |
| GET | `/catalogo/vehiculos/:id` | Consultar detalles | Público |
| GET | `/catalogo/vehiculos/:id/disponibilidad` | Consultar disponibilidad por fechas | Público |




### 2.5 Reservas — `/reservas`

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| POST | `/reservas` | Crear una reserva | CLIENTE |
| GET | `/reservas/mis-reservas` | Listar mis reservas | CLIENTE |
| GET | `/reservas/mis-reservas/:id` | Consultar una reserva propia | CLIENTE |
| GET | `/reservas` | Listar reservas administradas | ADMIN |
| GET | `/reservas/:id` | Consultar reserva específica | ADMIN |




### 2.6 Pagos — `/pagos`

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/pagos` | Listar pagos | ADMIN |
| GET | `/pagos/:id` | Consultar pago específico | ADMIN |
| GET | `/pagos/reserva/:reservaId` | Consultar pagos de una reserva | ADMIN |
| POST | `/pagos` | Registrar pago | ADMIN |
| PUT | `/pagos/:id/estado` | Cambiar estado del pago | ADMIN |
| DELETE | `/pagos/:id` | Eliminar pago, si permitido | ADMIN |
| GET | `/pagos/ingresos/mensuales` | Consultar ingresos mensuales | ADMIN |




### 2.7 Reportes — `/api/reportes`

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/reportes/ingresos` | Consultar ingresos | ADMIN |
| GET | `/reportes/vehiculos-mas-rentados` | Consultar vehículos más rentados | ADMIN |
| GET | `/reportes/reservas` | Consultar estadísticas de reservas | ADMIN |

---
