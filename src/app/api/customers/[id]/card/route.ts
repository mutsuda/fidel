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
    const customerId = segments.at(-2) || ""; // El ID está en la posición -2 para /api/customers/[id]/card

    const body = await request.json();
    const { currentUses, remainingUses, active } = body;

    // Buscar el cliente y su tarjeta
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

    // Preparar datos de actualización
    const updateData: any = {
      active: typeof active === 'boolean' ? active : card.active
    };

    // Actualizar según el tipo de tarjeta
    if (card.type === 'FIDELITY' && typeof currentUses === 'number') {
      updateData.currentUses = Math.max(0, Math.min(currentUses, card.totalUses || 11));
    } else if (card.type === 'PREPAID' && typeof remainingUses === 'number') {
      updateData.remainingUses = Math.max(0, remainingUses);
      updateData.active = updateData.remainingUses > 0;
    }

    // Actualizar la tarjeta
    const updatedCard = await prisma.card.update({
      where: { id: card.id },
      data: updateData,
      include: {
        customer: true
      }
    });

    return NextResponse.json({
      success: true,
      card: {
        id: updatedCard.id,
        code: updatedCard.code,
        type: updatedCard.type,
        active: updatedCard.active,
        currentUses: updatedCard.currentUses,
        remainingUses: updatedCard.remainingUses,
        customer: updatedCard.customer
      }
    });

  } catch (error) {
    console.error("Error updating card:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 