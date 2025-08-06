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
    const customers = await prisma.customer.findMany({
      where: { userId: session.user.id },
      include: {
        cards: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Solo la tarjeta más reciente
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(customers);
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
    const { name, email, phone, cardType, initialUses } = body;

    // Validaciones
    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email son obligatorios" }, { status: 400 });
    }

    // Verificar que el email no esté duplicado para este usuario
    const existingCustomer = await prisma.customer.findFirst({
      where: { 
        email: email.toLowerCase(),
        userId: session.user.id 
      }
    });

    if (existingCustomer) {
      return NextResponse.json({ error: "Ya existe un cliente con este email" }, { status: 400 });
    }

    // Crear el cliente
    const customer = await prisma.customer.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        userId: session.user.id
      }
    });

    // Generar código único para la tarjeta
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const generateHash = () => {
      const crypto = require('crypto');
      return crypto.randomBytes(32).toString('hex');
    };

    // Crear la tarjeta
    const cardData: any = {
      code: generateCode(),
      hash: generateHash(),
      customerId: customer.id,
      userId: session.user.id,
      type: cardType || 'FIDELITY',
      active: true
    };

    if (cardType === 'FIDELITY') {
      cardData.totalUses = 11; // 11 cafés = 1 gratis
      cardData.currentUses = 0;
    } else if (cardType === 'PREPAID') {
      cardData.initialUses = initialUses || 10;
      cardData.remainingUses = initialUses || 10;
    }

    const card = await prisma.card.create({
      data: cardData,
      include: {
        customer: true
      }
    });

    return NextResponse.json({ customer, card });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 