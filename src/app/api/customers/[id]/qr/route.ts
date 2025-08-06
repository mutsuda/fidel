import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import QRCode from "qrcode";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const customerId = params.id;

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

    // Generar QR code con el hash
    const qrDataUrl = await QRCode.toDataURL(card.hash, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Generar QR code en formato PNG para Wallet
    const qrBuffer = await QRCode.toBuffer(card.hash, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      },
      card: {
        id: card.id,
        code: card.code,
        hash: card.hash,
        type: card.type
      },
      qr: {
        dataUrl: qrDataUrl,
        buffer: qrBuffer.toString('base64'),
        hash: card.hash
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        size: 300,
        format: 'PNG'
      }
    });
  } catch (error) {
    console.error("Error generating QR:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 