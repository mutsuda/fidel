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

    // Buscar el cliente y todas sus tarjetas
    const customer = await (prisma as any).customer.findFirst({
      where: { 
        id: customerId,
        userId: session.user.id 
      },
      include: {
        cards: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    if (customer.cards.length === 0) {
      return NextResponse.json({ error: "Cliente sin tarjetas" }, { status: 404 });
    }

    // Procesar todas las tarjetas
    const processedCards = customer.cards.map((card: any) => {
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
        
        // Datos específicos según tipo
        loyalty: card.type === 'FIDELITY' ? {
          currentUses: card.currentUses,
          totalUses: card.totalUses,
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
      
      return cardData;
    });

    // Formato optimizado para Wallet integration
    const walletData = {
      // Datos del cliente
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      },
      
      // Todas las tarjetas del cliente
      cards: processedCards,
      
      // Datos para QR (usar la tarjeta más reciente)
      qr: {
        hash: customer.cards[0].hash,
        dataUrl: null // Se generará en el cliente si es necesario
      },
      
      // Metadatos para Wallet
      metadata: {
        businessName: "Fidel", // Se puede personalizar
        cardType: customer.cards[0].type === 'FIDELITY' ? 'loyalty' : 'prepaid',
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