import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/");
    const customerId = segments.at(-3) || ""; // /api/customers/[id]/wallet/card/[cardId]
    const cardId = segments.at(-1) || "";

    const card = await (prisma as any).card.findFirst({
      where: {
        id: cardId,
        customerId: customerId,
        userId: session.user.id
      },
      include: {
        customer: true
      }
    });

    if (!card) {
      return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
    }

    // Procesar datos de la tarjeta
    const cardData = {
      id: card.id,
      code: card.code,
      hash: card.hash,
      type: card.type,
      active: card.active,
      currentUses: card.currentUses,
      totalUses: card.totalUses,
      remainingUses: card.remainingUses,
      initialUses: card.initialUses,
      createdAt: card.createdAt,
      customer: card.customer,

      loyalty: card.type === 'FIDELITY' ? {
        currentUses: card.currentUses,
        totalUses: card.totalUses || 10,
        progress: `${card.currentUses}/${card.totalUses || 10}`,
        isCompleted: card.currentUses >= (card.totalUses || 10),
        message: card.currentUses >= (card.totalUses || 10)
          ? "¡Café gratis disponible!"
          : `${card.currentUses} de ${card.totalUses || 10} cafés`
      } : null,

      prepaid: card.type === 'PREPAID' ? {
        remainingUses: card.remainingUses,
        initialUses: card.initialUses,
        message: card.remainingUses
          ? `Quedan ${card.remainingUses} usos`
          : "No quedan usos disponibles"
      } : null
    };

    return NextResponse.json(cardData);
  } catch (error) {
    console.error("Error fetching card data:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/");
    const customerId = segments.at(-3) || "";
    const cardId = segments.at(-1) || "";

    const body = await request.json();
    const { currentUses, remainingUses, active } = body;

    // Verificar que la tarjeta pertenece al usuario
    const card = await (prisma as any).card.findFirst({
      where: {
        id: cardId,
        customerId: customerId,
        userId: session.user.id
      }
    });

    if (!card) {
      return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
    }

    // Actualizar datos según el tipo de tarjeta
    const updateData: any = { active };

    if (card.type === 'FIDELITY' && currentUses !== undefined) {
      updateData.currentUses = Math.min(currentUses, card.totalUses || 10);
    }

    if (card.type === 'PREPAID' && remainingUses !== undefined) {
      updateData.remainingUses = Math.max(0, remainingUses);
      // Desactivar si no quedan usos
      if (remainingUses <= 0) {
        updateData.active = false;
      }
    }

    const updatedCard = await (prisma as any).card.update({
      where: { id: cardId },
      data: updateData,
      include: {
        customer: true
      }
    });

    return NextResponse.json({
      success: true,
      card: updatedCard,
      message: "Tarjeta actualizada correctamente"
    });

  } catch (error) {
    console.error("Error updating card:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 