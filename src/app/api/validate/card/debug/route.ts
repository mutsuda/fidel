import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Obtener todas las tarjetas para debug
    const cards = await prisma.card.findMany({
      include: {
        customer: true
      },
      take: 10 // Solo las últimas 10
    });

    return NextResponse.json({
      totalCards: cards.length,
      cards: cards.map(card => ({
        id: card.id,
        code: card.code,
        hash: card.hash,
        type: card.type,
        customer: card.customer ? {
          name: card.customer.name,
          email: card.customer.email
        } : null,
        active: card.active,
        currentUses: card.currentUses,
        totalUses: card.totalUses,
        remainingUses: card.remainingUses
      }))
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { hash } = await request.json();

    if (!hash) {
      return NextResponse.json({ error: "Hash requerido" }, { status: 400 });
    }

    // Buscar la tarjeta por hash
    const card = await prisma.card.findUnique({
      where: { hash },
      include: {
        customer: true
      }
    });

    if (!card) {
      // Si no encuentra por hash, buscar por código
      const cardByCode = await prisma.card.findFirst({
        where: { code: hash },
        include: {
          customer: true
        }
      });

      return NextResponse.json({
        hash: hash,
        foundByHash: false,
        foundByCode: !!cardByCode,
        cardByCode: cardByCode ? {
          id: cardByCode.id,
          code: cardByCode.code,
          hash: cardByCode.hash,
          type: cardByCode.type,
          customer: cardByCode.customer ? {
            name: cardByCode.customer.name,
            email: cardByCode.customer.email
          } : null
        } : null
      });
    }

    return NextResponse.json({
      hash: hash,
      foundByHash: true,
      card: {
        id: card.id,
        code: card.code,
        hash: card.hash,
        type: card.type,
        customer: card.customer ? {
          name: card.customer.name,
          email: card.customer.email
        } : null
      }
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 