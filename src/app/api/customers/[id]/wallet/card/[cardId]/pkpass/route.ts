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
    const customerId = segments.at(-4) || ""; // /api/customers/[id]/wallet/card/[cardId]/pkpass
    const cardId = segments.at(-2) || "";

    const card = await (prisma as any).card.findFirst({
      where: {
        id: cardId,
        customerId: customerId,
        userId: session.user.id
      },
      include: {
        customer: true
      }
    });

    if (!card) {
      return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
    }

    // Generar QR code para esta tarjeta específica
    const qrDataUrl = `https://fidel-one.vercel.app/api/validate/card?hash=${card.hash}`;

    // Estructura PKPass para esta tarjeta específica
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.fidel.loyalty", // Requiere certificado Apple
      teamIdentifier: "TEAM_ID", // Requiere certificado Apple
      organizationName: "Fidel",
      description: `Tarjeta de ${card.customer.name}`,
      serialNumber: card.code,
      generic: {
        primaryFields: [
          {
            key: "balance",
            label: card.type === 'FIDELITY' ? "Progreso" : "Usos",
            value: card.type === 'FIDELITY' 
              ? `${card.currentUses}/${card.totalUses || 10}`
              : `${card.remainingUses}/${card.initialUses}`
          }
        ],
        secondaryFields: [
          {
            key: "type",
            label: "Tipo",
            value: card.type === 'FIDELITY' ? 'Fidelidad' : 'Prepago'
          },
          {
            key: "status",
            label: "Estado",
            value: card.active ? 'Activa' : 'Inactiva'
          }
        ],
        auxiliaryFields: [
          {
            key: "customer",
            label: "Cliente",
            value: card.customer.name
          },
          {
            key: "created",
            label: "Creada",
            value: new Date(card.createdAt).toLocaleDateString()
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
      locations: [
        {
          longitude: -3.7038, // Madrid coordinates (example)
          latitude: 40.4168,
          relevantText: "Escanea aquí para usar tu tarjeta"
        }
      ],
      webServiceURL: "https://fidel-one.vercel.app/api/wallet/webhook",
      authenticationToken: "TOKEN", // Requiere certificado Apple
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año
      voided: !card.active
    };

    return NextResponse.json({
      success: true,
      passData,
      qrDataUrl,
      message: "Estructura PKPass generada. Para implementación completa se requieren certificados de Apple Developer."
    });

  } catch (error) {
    console.error("Error generating PKPass:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 