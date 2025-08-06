import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import QRCode from "qrcode";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/");
    const customerId = segments.at(-2) || ""; // El ID está en la posición -2 para /api/customers/[id]/pkpass

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

    // Generar QR code
    const qrBuffer = await QRCode.toBuffer(card.hash, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Crear estructura PKPass (sin certificados por ahora)
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.fidel.loyalty", // Se cambiará cuando tengas certificados
      serialNumber: card.hash,
      teamIdentifier: "TEAM123", // Se cambiará cuando tengas certificados
      organizationName: "Fidel",
      description: `Tarjeta de ${card.type === 'FIDELITY' ? 'fidelidad' : 'prepago'} para ${customer.name}`,
      generic: {
        primaryFields: [
          {
            key: "customer",
            label: "Cliente",
            value: customer.name
          }
        ],
        secondaryFields: [
          {
            key: "type",
            label: "Tipo",
            value: card.type === 'FIDELITY' ? 'Fidelidad' : 'Prepago'
          },
          {
            key: "code",
            label: "Código",
            value: card.code
          }
        ],
        auxiliaryFields: card.type === 'FIDELITY' ? [
          {
            key: "progress",
            label: "Progreso",
            value: `${card.currentUses}/${card.totalUses || 11}`
          }
        ] : [
          {
            key: "remaining",
            label: "Restantes",
            value: `${card.remainingUses || 0}`
          }
        ]
      },
      barcodes: [
        {
          format: "PKBarcodeFormatQR",
          message: card.hash,
          messageEncoding: "iso-8859-1"
        }
      ],
      backgroundColor: "rgb(60, 65, 76)",
      foregroundColor: "rgb(255, 255, 255)",
      labelColor: "rgb(255, 255, 255)"
    };

    // Por ahora devolvemos la estructura en lugar del archivo .pkpass
    // (porque necesitamos certificados para crear el archivo real)
    return NextResponse.json({
      message: "Estructura PKPass generada (certificados requeridos para archivo .pkpass)",
      passData,
      qrCode: qrBuffer.toString('base64'),
      customer: {
        name: customer.name,
        email: customer.email
      },
      card: {
        code: card.code,
        hash: card.hash,
        type: card.type
      },
      nextSteps: [
        "Obtener certificados de Apple Developer",
        "Configurar Pass Type ID",
        "Firmar el archivo con certificados",
        "Generar archivo .pkpass real"
      ]
    });

  } catch (error) {
    console.error("Error generating PKPass:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 