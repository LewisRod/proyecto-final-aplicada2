# PickyRentCar — Datos y reglas por módulo

## 1. Modulo de usuarios y perfil

### `GET /usuarios`
**Información que devuelve:**
- ID
- Nombre
- Email
- Teléfono
- Fecha de registro

**Reglas:**
- Solo ADMIN puede acceder.
- Cada administrador consulta únicamente los usuarios asociados a sus vehículos y reservas.

### `GET /usuarios/:id`
**Información que devuelve:**
- ID
- Nombre
- Email
- Teléfono
- Fecha de registro

**Reglas:**
- Solo ADMIN puede acceder.
- Cada administrador consulta únicamente los usuarios asociados a sus vehículos y reservas.

### `PUT /perfil`
**Body:**
```json
{
  "nombre": "Fulanito",
  "telefono": "8091234567"
}
```

---

## 2. Módulo de vehículos

### `GET /vehiculos`
**Información que devuelve:**
- ID
- Nombre
- Placa
- Marca
- Modelo
- Año
- Color
- Asientos
- Estado
- Precio diario
- Transmisión
- Combustible
- Categoría
- Imágenes

**Reglas:**
- Requiere autenticación.
- Solo ADMIN.
- Cada administrador consulta únicamente sus vehículos.
- No debe mostrar vehículos de otros administradores.



### `GET /vehiculos/:id`
**Objetivo:** Consultar los detalles de un vehículo específico.

**Reglas:**
- Requiere autenticación.
- Solo ADMIN.
- El vehículo debe pertenecer al administrador autenticado.
- Si el vehículo no existe, devolver error.

### `POST /vehiculos`
**Body / datos a registrar:**
- Nombre
- Placa
- Marca
- Modelo
- Año
- Color
- Asientos
- Estado
- Notas
- Precio diario
- Transmisión
- Combustible
- Categoría
- Imágenes (URLs)

**Ejemplo de imágenes:**
```json
{
  "imagenes": [
    "url-imagen-1",
    "url-imagen-2"
  ]
}
```

**Reglas:**
- Requiere autenticación.
- Solo ADMIN.
- El vehículo queda asociado al administrador que lo registra.
- La placa no debe estar duplicada según la regla global que definamos.
- El precio diario debe ser mayor que cero.
- El año, asientos y demás atributos deben validarse.
- El administrador no puede enviar el ID de otro administrador para asignarse el vehículo.



### `PUT /vehiculos/:id`
**Objetivo:** Modificar la información de un vehículo existente.

**Reglas:**
- Requiere autenticación.
- Solo ADMIN.
- Solo puede modificar sus propios vehículos.
- No puede cambiar el propietario del vehículo mediante el body.
- Se deben validar los campos.
- No se debe permitir alterar reservas existentes de forma indirecta al actualizar un vehículo.

### `DELETE /vehiculos/:id`
**Objetivo:** Eliminar un vehículo registrado.

**Reglas:**
- Requiere autenticación.
- Solo ADMIN.
- Solo puede eliminar sus propios vehículos.
- No debe permitirse eliminar un vehículo que tenga reservas históricas o futuras que deban conservarse.
- Si tiene reservas, considerar desactivarlo o cambiar su estado en lugar de eliminarlo físicamente, para conservar el historial de reservas y pagos.

---

## 3. Módulo de catálogo

### `GET /catalogo/vehiculos`
**Objetivo:** Obtener el catálogo público de vehículos disponibles para alquiler.

**Reglas:**
- No requiere autenticación.
- Solo mostrar vehículos que puedan ofrecerse públicamente.
- No mostrar vehículos eliminados, inactivos o fuera de servicio.
- Permitir combinar filtros.
- Cuando se proporcionen fechas, excluir vehículos que tengan reservas que se solapen con el período solicitado.



### `GET /catalogo/vehiculos/:id`
**Objetivo:** Consultar los detalles públicos de un vehículo.

**Información que devuelve:**
- ID
- Nombre
- Marca
- Modelo
- Año
- Color
- Asientos
- Precio diario
- Transmisión
- Combustible
- Categoría
- Notas descriptivas (si son públicas)
- Imágenes
- Estado de disponibilidad general

**Reglas:**
- No requiere autenticación.
- El vehículo debe estar habilitado para mostrarse en el catálogo.

### `GET /catalogo/vehiculos/:id/disponibilidad`
**Objetivo:** Consultar si un vehículo está disponible durante un período específico.

---

## 4. Módulo de reservas

### `POST /reservas`
**Objetivo:** Permitir que un cliente autenticado solicite el alquiler de un vehículo durante un período determinado.

**Body:**
```json
{
  "vehiculoId": 15,
  "fechaInicio": "2026-12-01",
  "fechaFin": "2026-12-05",
  "ubicacion": "Aeropuerto Internacional del Cibao",
  "notas": "Necesito el vehículo temprano"
}
```

**Reglas:**
- Requiere autenticación.
- Solo CLIENTE.
- El cliente no envía el precio diario ni el precio total; los calcula el backend.
- El cliente no envía el estado inicial; el backend asigna `pendiente`.
- El vehículo debe existir y estar habilitado para alquiler.
- El vehículo debe estar disponible en las fechas solicitadas.
- La fecha de inicio debe ser anterior a la fecha de fin.
- No permitir reservas con fechas inválidas.
- El backend calcula la cantidad de días.
- El backend calcula el total a pagar.
- La reserva debe generar un número de reserva único.

### `GET/reservas/mis-reservas`
**Objetivo:** Listar todas las reservas realizadas por el cliente autenticado.

**Información que devuelve:**
- Número de reserva
- Vehículo
- Marca y modelo
- Imágenes
- Fecha inicial
- Fecha final
- Cantidad de días
- Precio diario
- Precio total
- Estado
- Fecha de creación

**Reglas:**
- Requiere autenticación.
- Solo CLIENTE.
- Solo muestra reservas del cliente autenticado.
- Las reservas pueden ordenarse por fecha de creación (por ejemplo, las más recientes primero).

### `GET /reservas/mis-reservas/:id`
**Objetivo:** Consultar los detalles de una reserva específica realizada por el cliente.

**Información que devuelve:**
- Número de reserva
- Datos del vehículo
- Datos del cliente relacionados con la reserva
- Fecha de inicio
- Fecha de fin
- Cantidad de días
- Precio diario
- Precio total
- Estado
- Notas
- Ubicación
- Fecha de creación
- Fecha de actualización

**Reglas:**
- Requiere autenticación.
- Solo CLIENTE.
- La reserva debe pertenecer al cliente autenticado.
- No puede consultar reservas de otros clientes.

### `GET /reservas`
**Objetivo:** Listar las reservas relacionadas con los vehículos del administrador autenticado.

**Información que devuelve:**
- Número de reserva
- Vehículo
- Cliente
- Contacto del cliente
- Fecha de inicio
- Fecha de fin
- Cantidad de días
- Precio diario
- Precio total
- Estado
- Notas
- Ubicación
- Fecha de creación

**Reglas:**
- Requiere autenticación.
- Solo ADMIN.
- Solo consulta las reservas de sus vehículos.
- No puede consultar reservas de vehículos pertenecientes a otros administradores.

### `GET /reservas/:id`
**Objetivo:** Consultar los detalles de una reserva específica para su administración.

**Información que devuelve:**
- Número de reserva
- Datos del vehículo
- Datos del cliente
- Datos de contacto
- Fecha de inicio
- Fecha de fin
- Cantidad de días
- Precio diario
- Precio total
- Estado
- Notas
- Ubicación
- Fecha de creación
- Fecha de actualización

**Reglas:**
- Requiere autenticación.
- Solo ADMIN.
- La reserva debe estar asociada a un vehículo del administrador autenticado.

### Estados de las reservas
| Estado | Significado |
|---|---|
| `pendiente` | Reserva solicitada, esperando gestión o confirmación. |
| `confirmada` | Reserva aprobada y programada. |
| `activa` | El alquiler se encuentra en curso. |
| `finalizada` | El alquiler ha concluido. |
| `cancelada` | La reserva ha sido cancelada. |

---

## 5. Módulo de pagos

### `GET /pagos`
**Objetivo:** Listar los pagos relacionados con las reservas de los vehículos del administrador autenticado.

**Información que devuelve:**
- ID del pago
- Número de reserva
- Cliente
- Vehículo
- Monto
- Método de pago
- Estado del pago
- Fecha del pago
- Fecha de creación

**Reglas:**
- Requiere autenticación.
- Solo ADMIN.
- Solo muestra pagos asociados a sus reservas y vehículos.
- No muestra pagos de otros administradores.



### `GET /pagos/:id`
**Objetivo:** Consultar los detalles de un pago específico.

**Información:**
- ID
- Reserva relacionada
- Cliente
- Vehículo
- Monto
- Método de pago
- Estado
- Fecha de pago
- Notas (si existen)

**Reglas:**
- Requiere autenticación.
- Solo ADMIN.
- El pago debe estar relacionado con una reserva perteneciente al administrador.
- **

### `POST /pagos`
**Objetivo:** Registrar un pago asociado a una reserva.

**Body:**
```json
{
  "reservaId": 25,
  "monto": 15000,
  "metodo": "efectivo",
  "notas": "Pago recibido en oficina"
}
```

### `PUT /pagos/:id/estado`
**Objetivo:** Actualizar el estado de un pago.

**Estados propuestos:**
| Estado | Significado |
|---|---|
| `pendiente` | Pago aún no confirmado. |
| `completado` | Pago recibido o procesado satisfactoriamente. |
| `fallido` | Pago no pudo completarse. |
| `reembolsado` | Dinero devuelto. |

**Reglas:**
- Requiere autenticación.
- Solo ADMIN.
- El pago debe pertenecer a una reserva administrada por ese ADMIN.
- Solo se permiten transiciones de estado válidas.
- Cuando el pago se complete, el backend deberá evaluar la regla de actualización de la reserva.


---

## 6. Módulo de reportes

### `GET /reportes/ingresos`
**Objetivo:** Consultar estadísticas de ingresos generados por los vehículos del administrador.

**Ejemplo:** `GET /api/reportes/ingresos?anio=2026`

### `GET /reportes/vehiculos-mas-rentados`
**Objetivo:** Identificar los vehículos que más se han alquilado.

**Ejemplo:** `GET /api/reportes/vehiculos-mas-rentados`

**Reglas:**
- Requiere autenticación.
- Solo ADMIN.
- Solo consulta los vehículos del administrador autenticado.
- Las reservas canceladas no deben contar como alquileres efectivos.
- Permitir filtros por período.
- Permitir limitar la cantidad de resultados.



### `GET /api/reportes/reservas`
**Objetivo:** Obtener estadísticas sobre las reservas de los vehículos del administrador.

**Ejemplo:** `GET /api/reportes/reservas?anio=2026`

**Ejemplo de respuesta:**
```json
{
  "totalReservas": 120,
  "pendientes": 10,
  "confirmadas": 20,
  "activas": 5,
  "finalizadas": 75,
  "canceladas": 10
}
```

**Reglas:**
- Requiere autenticación.
- Solo ADMIN.
- Solo calcula las reservas asociadas a sus vehículos.
- Permite filtros por período.
- Las estadísticas se agrupan por estado.
