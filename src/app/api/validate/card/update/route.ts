import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(request: NextRequest) {
  try {
    const { cardId, action } = await request.json();

    if (!cardId || !action) {
      return NextResponse.json({ error: "cardId y action son requeridos" }, { status: 400 });
    }

    // Buscar la tarjeta
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        customer: true
      }
    });

    if (!card) {
      return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
    }

    if (!card.active) {
      return NextResponse.json({ error: "Tarjeta inactiva" }, { status: 400 });
    }

    let updateData: any = {};
    let message = "";

    if (card.type === 'FIDELITY') {
      if (action === 'increment') {
        const newCurrentUses = card.currentUses + 1;
        const isCompleted = newCurrentUses >= (card.totalUses || 11);
        
        updateData.currentUses = isCompleted ? 0 : newCurrentUses; // Reset si completa
        message = isCompleted ? "¡Café gratis! Se reinicia el contador." : `Uso ${newCurrentUses} de ${card.totalUses}`;
      } else if (action === 'decrement' && card.currentUses > 0) {
        updateData.currentUses = card.currentUses - 1;
        message = `Uso ${updateData.currentUses} de ${card.totalUses}`;
      }
    } else if (card.type === 'PREPAID') {
      if (action === 'decrement' && card.remainingUses !== null && card.remainingUses > 0) {
        const newRemainingUses = card.remainingUses - 1;
        updateData.remainingUses = newRemainingUses;
        updateData.active = newRemainingUses > 0;
        message = newRemainingUses > 0 ? `Quedan ${newRemainingUses} usos` : "Último uso completado";
      } else if (action === 'increment' && card.remainingUses !== null) {
        updateData.remainingUses = card.remainingUses + 1;
        updateData.active = true;
        message = `Quedan ${updateData.remainingUses} usos`;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Acción no válida para este tipo de tarjeta" }, { status: 400 });
    }

    // Actualizar la tarjeta
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: updateData,
      include: {
        customer: true
      }
    });

    return NextResponse.json({
      ok: true,
      card: {
        id: updatedCard.id,
        code: updatedCard.code,
        type: updatedCard.type,
        customer: updatedCard.customer,
        currentUses: updatedCard.currentUses,
        totalUses: updatedCard.totalUses,
        remainingUses: updatedCard.remainingUses,
        active: updatedCard.active,
        message
      }
    });
  } catch (error) {
    console.error("Error updating card:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 