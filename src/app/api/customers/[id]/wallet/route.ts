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
    const customerId = segments.at(-2) || ""; // El ID está en la posición -2 para /api/customers/[id]/wallet

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

    // Formato optimizado para Wallet integration
    const walletData = {
      // Datos del cliente
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      },
      
      // Datos de la tarjeta
      card: {
        id: card.id,
        code: card.code,
        hash: card.hash,
        type: card.type,
        active: card.active,
        createdAt: card.createdAt
      },
      
      // Datos específicos según tipo
      loyalty: card.type === 'FIDELITY' ? {
        currentUses: card.currentUses,
        totalUses: card.totalUses,
        progress: `${card.currentUses}/${card.totalUses || 11}`,
        isCompleted: card.currentUses >= (card.totalUses || 11),
        message: card.currentUses >= (card.totalUses || 11) 
          ? "¡Café gratis disponible!" 
          : `${card.currentUses} de ${card.totalUses || 11} cafés`
      } : null,
      
      prepaid: card.type === 'PREPAID' ? {
        remainingUses: card.remainingUses,
        initialUses: card.initialUses,
        message: card.remainingUses 
          ? `Quedan ${card.remainingUses} usos` 
          : "No quedan usos disponibles"
      } : null,
      
      // Datos para QR
      qr: {
        hash: card.hash,
        dataUrl: null // Se generará en el cliente si es necesario
      },
      
      // Metadatos para Wallet
      metadata: {
        businessName: "Fidel", // Se puede personalizar
        cardType: card.type === 'FIDELITY' ? 'loyalty' : 'prepaid',
        lastUpdated: new Date().toISOString(),
        version: "1.0"
      }
    };

    return NextResponse.json(walletData);
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 