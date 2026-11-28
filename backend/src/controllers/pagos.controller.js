import prisma from "../db.js";

export const listarPagos = async (req, res) => {
  try {
    const pagos = await prisma.pago.findMany({
      where: { reserva: { vehiculo: { createdById: req.usuario.id } } },
      include: { reserva: { include: { vehiculo: true, cliente: true } } },
    });

    res.json(pagos);
  } catch (error) {
    res.status(500).json({ error: "Error al listar pagos" });
  }
};


export const registrarPago = async (req, res) => {
  try {
    const { reservationId, metodoPago, referencia, comprobantePath, notas } =
      req.body;

    if (!reservationId || !metodoPago) {
      return res
        .status(400)
        .json({ error: "Reserva y metodo de pago requeridos" });
    }

    const reserva = await prisma.reserva.findUnique({
      where: { id: reservationId },
    });

    if (!reserva) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    if (reserva.status !== "pendiente_pago") {
      return res
        .status(400)
        .json({ error: "La reserva no está pendiente de pago" });
    }

    const pagoPendiente = await prisma.pago.findFirst({
      where: {
        reservationId,
        estado: "pendiente",
      },
    });
    

    if (pagoPendiente) {
      return res
        .status(400)
        .json({ error: "La reserva ya tiene un pago pendiente" });
    }

    if (!["Transferencia", "Efectivo"].includes(metodoPago)) {
      return res.status(400).json({ error: "Método de pago inválido" });
    }

    const pago = await prisma.pago.create({
      data: {
        reservationId,
        monto: reserva.totalPrice,
        metodoPago,
        referencia,
        comprobantePath,
        notas,
        createdById: req.usuario.id,
      },
    });

    res.status(201).json(pago);
  } catch (error) {
    res.status(500).json({ error: "Error al registrar pago" });
  }
};

export const confirmarPago = async (req, res) => {
  try {
    const { id } = req.params;

    const pago = await prisma.pago.findUnique({
      where: { id },
      include: { reserva: { include: { vehiculo: true } } },
    });

    if (!pago) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }

    if (pago.estado !== "pendiente") {
      return res.status(400).json({ error: "El pago no está pendiente" });
    }

    if (pago.reserva.vehiculo.createdById !== req.usuario.id) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para confirmar este pago" });
    }

    await prisma.$transaction([
      prisma.pago.update({
        where: { id },
        data: { estado: "completado" },
      }),

      prisma.reserva.update({
        where: { id: pago.reservationId },
        data: { status: "confirmada" },
      }),
    ]);

    res.json({ mensaje: "Pago confirmado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al confirmar pago" });
  }
};




export const rechazarPago = async (req, res) => {
    try {
      
        const { id } = req.params;

        const pago = await prisma.pago.findUnique({
          where: { id },
          include: {
            reserva: {
              include: {
                vehiculo: true,
              },
            },
          },
        });


        if (!pago) {
          return res.status(404).json({ error: "Pago no encontrado" });
        }

        if (pago.estado !== "pendiente") {
          return res.status(400).json({ error: "El pago no está pendiente" });
        }

        if (pago.reserva.vehiculo.createdById !== req.usuario.id) {
          return res
            .status(403)
            .json({ error: "No tienes permiso para rechazar este pago" });
        }

        const { motivoRechazo } = req.body;

        if (!motivoRechazo) {
          return res
            .status(400)
            .json({ error: "El motivo del rechazo es requerido" });
        }

        const pagoActualizado = await prisma.pago.update({
          where: { id },
          data: {
            estado: "fallido",
            motivoRechazo,
          },
        });

        res.json(pagoActualizado);

  } catch (error) {
    res.status(500).json({ error: "Error al rechazar pago" });
  }
};