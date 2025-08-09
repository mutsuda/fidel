import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import QRCode from "qrcode";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/");
    const customerId = segments.at(-3) || "";

    const body = await request.json();
    const { 
      cardId, 
      customLogo, 
      customColors, 
      customText,
      businessName,
      businessLogo 
    } = body;

    // Buscar el cliente y su tarjeta
    const customer = await (prisma as any).customer.findFirst({
      where: { 
        id: customerId,
        userId: session.user.id 
      },
      include: {
        cards: {
          where: { id: cardId }
        }
      }
    });

    if (!customer || customer.cards.length === 0) {
      return NextResponse.json({ error: "Cliente o tarjeta no encontrado" }, { status: 404 });
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

    // Colores personalizados o por defecto
    const colors = customColors || {
      backgroundColor: card.type === 'FIDELITY' ? "rgb(227, 242, 253)" : "rgb(232, 245, 232)",
      foregroundColor: "rgb(0, 0, 0)",
      labelColor: card.type === 'FIDELITY' ? "rgb(25, 118, 210)" : "rgb(46, 125, 50)"
    };

    // Crear estructura PKPass personalizada
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.shokupan.loyalty",
      serialNumber: card.hash,
      teamIdentifier: "TEAM123",
      organizationName: businessName || "Shokupan",
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
            value: `${card.currentUses}/${card.totalUses || 11}`,
            textAlignment: "PKTextAlignmentCenter"
          }
        ] : [
          {
            key: "remaining",
            label: "Restantes",
            value: `${card.remainingUses || 0}`,
            textAlignment: "PKTextAlignmentCenter"
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
      backgroundColor: colors.backgroundColor,
      foregroundColor: colors.foregroundColor,
      labelColor: colors.labelColor,
      // Logos personalizados si se proporcionan
      ...(customLogo && { logoText: customLogo }),
      ...(businessLogo && { logo: businessLogo })
    };

    return NextResponse.json({
      message: "Estructura PKPass personalizada generada",
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
      customization: {
        businessName,
        customColors: colors,
        hasCustomLogo: !!customLogo,
        hasBusinessLogo: !!businessLogo
      }
    });

  } catch (error) {
    console.error("Error generating custom PKPass:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 