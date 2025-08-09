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
    const customers = await (prisma as any).customer.findMany({
      where: { userId: session.user.id },
      include: {
        cards: {
          include: {
            scans: {
              orderBy: { scannedAt: 'desc' },
              take: 1 // Solo la última validación
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Procesar los datos para incluir información de la última validación
    const customersWithLastValidation = customers.map((customer: any) => {
      // Encontrar la última validación entre todas las tarjetas del cliente
      let lastValidation: any = null;
      let lastValidationCard: any = null;

      customer.cards.forEach((card: any) => {
        if (card.scans && card.scans.length > 0) {
          const cardLastScan = card.scans[0]; // Ya está ordenado por scannedAt desc
          if (!lastValidation || cardLastScan.scannedAt > lastValidation.scannedAt) {
            lastValidation = cardLastScan;
            lastValidationCard = card;
          }
        }
      });

      return {
        ...customer,
        lastValidation,
        lastValidationCard: lastValidationCard ? {
          id: lastValidationCard.id,
          code: lastValidationCard.code,
          type: lastValidationCard.type
        } : null
      };
    });

    return NextResponse.json(customersWithLastValidation);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, phone } = body;

    // Validaciones
    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email son obligatorios" }, { status: 400 });
    }

    // Verificar que el email no esté duplicado para este usuario
    const existingCustomer = await (prisma as any).customer.findFirst({
      where: { 
        email: email.toLowerCase(),
        userId: session.user.id 
      }
    });

    if (existingCustomer) {
      return NextResponse.json({ error: "Ya existe un cliente con este email" }, { status: 400 });
    }

    // Crear el cliente
    const customer = await (prisma as any).customer.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        userId: session.user.id
      }
    });

    return NextResponse.json({ 
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      },
      message: "Cliente creado correctamente"
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 