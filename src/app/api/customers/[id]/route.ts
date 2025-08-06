import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/");
    const customerId = segments.at(-1) || ""; // El ID está en la última posición

    const body = await request.json();
    const { name, email, phone, cardType, totalUses, initialUses } = body;

    // Buscar el cliente
    const customer = await prisma.customer.findFirst({
      where: { 
        id: customerId,
        userId: session.user.id 
      },
      include: {
        cards: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    if (customer.cards.length === 0) {
      return NextResponse.json({ error: "Cliente sin tarjeta" }, { status: 404 });
    }

    const card = customer.cards[0];

    // Actualizar información del cliente
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: name || customer.name,
        email: email || customer.email,
        phone: phone !== undefined ? phone : customer.phone
      }
    });

    // Si se cambió el tipo de tarjeta, actualizar la tarjeta
    if (cardType && cardType !== card.type) {
      const updateData: any = {
        type: cardType
      };

      if (cardType === 'FIDELITY') {
        updateData.totalUses = totalUses || 10;
        updateData.currentUses = 0; // Resetear usos
        updateData.remainingUses = null;
        updateData.initialUses = null;
      } else if (cardType === 'PREPAID') {
        updateData.initialUses = initialUses || 10;
        updateData.remainingUses = initialUses || 10;
        updateData.totalUses = null;
        updateData.currentUses = 0;
      }

      await prisma.card.update({
        where: { id: card.id },
        data: updateData
      });
    } else if (cardType === 'FIDELITY' && totalUses !== undefined) {
      // Actualizar solo totalUses para tarjetas de fidelidad
      await prisma.card.update({
        where: { id: card.id },
        data: { totalUses }
      });
    } else if (cardType === 'PREPAID' && initialUses !== undefined) {
      // Actualizar solo initialUses para tarjetas prepago
      await prisma.card.update({
        where: { id: card.id },
        data: { 
          initialUses,
          remainingUses: initialUses // Resetear usos restantes
        }
      });
    }

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: "Cliente actualizado correctamente"
    });

  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/");
    const customerId = segments.at(-1) || "";

    // Buscar el cliente
    const customer = await prisma.customer.findFirst({
      where: { 
        id: customerId,
        userId: session.user.id 
      },
      include: {
        cards: {
          include: {
            scans: true
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Eliminar en cascada: scans -> cards -> customer
    for (const card of customer.cards) {
      // Eliminar todos los scans de la tarjeta
      await prisma.cardScan.deleteMany({
        where: { cardId: card.id }
      });
    }

    // Eliminar todas las tarjetas del cliente
    await prisma.card.deleteMany({
      where: { customerId: customerId }
    });

    // Eliminar el cliente
    await prisma.customer.delete({
      where: { id: customerId }
    });

    return NextResponse.json({
      success: true,
      message: "Cliente y tarjetas eliminados correctamente"
    });

  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 