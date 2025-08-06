import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/");
    const customerId = segments.at(-2) || ""; // El ID está en la posición -2 para /api/customers/[id]/cards

    const body = await request.json();
    const { cardType, totalUses, initialUses } = body;

    // Buscar el cliente
    const customer = await prisma.customer.findFirst({
      where: { 
        id: customerId,
        userId: session.user.id 
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Generar código único
    const generateUniqueCode = async () => {
      let code: string;
      let hash: string;
      let isUnique = false;
      
      while (!isUnique) {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        hash = randomBytes(16).toString('hex');
        
        const existingCard = await prisma.card.findFirst({
          where: {
            OR: [
              { code: code },
              { hash: hash }
            ]
          }
        });
        
        if (!existingCard) {
          isUnique = true;
        }
      }
      
      return { code: code!, hash: hash! };
    };

    const { code, hash } = await generateUniqueCode();

    // Preparar datos de la tarjeta
    const cardData: any = {
      code,
      hash,
      customerId,
      userId: session.user.id,
      type: cardType || 'FIDELITY',
      active: true,
      currentUses: 0
    };

    if (cardType === 'FIDELITY') {
      cardData.totalUses = totalUses || 10;
      cardData.remainingUses = null;
      cardData.initialUses = null;
    } else if (cardType === 'PREPAID') {
      cardData.initialUses = initialUses || 10;
      cardData.remainingUses = initialUses || 10;
      cardData.totalUses = null;
    }

    // Crear la nueva tarjeta
    const newCard = await prisma.card.create({
      data: cardData,
      include: {
        customer: true
      }
    });

    return NextResponse.json({
      success: true,
      card: {
        id: newCard.id,
        code: newCard.code,
        hash: newCard.hash,
        type: newCard.type,
        active: newCard.active,
        currentUses: newCard.currentUses,
        remainingUses: newCard.remainingUses,
        totalUses: newCard.totalUses,
        customer: newCard.customer
      },
      message: "Nueva tarjeta creada correctamente"
    });

  } catch (error) {
    console.error("Error creating new card:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 