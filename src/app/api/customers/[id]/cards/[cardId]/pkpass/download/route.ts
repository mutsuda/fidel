import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import { getAppleWalletService } from "@/lib/apple-wallet";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/");
    const customerId = segments.at(-5) || "";
    const cardId = segments.at(-3) || "";

    // Buscar la tarjeta
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

    // Obtener perfil de negocio
    const businessProfile = await (prisma as any).businessProfile.findUnique({
      where: { userId: session.user.id }
    });

    // Preparar datos para el Passbook
    const cardData = {
      id: card.id,
      hash: card.hash,
      code: card.code,
      type: card.type,
      customerName: card.customer.name,
      customerEmail: card.customer.email,
      currentUses: card.currentUses,
      totalUses: card.totalUses,
      remainingUses: card.remainingUses,
      initialUses: card.initialUses,
      active: card.active,
      createdAt: card.createdAt.toISOString(),
      businessName: businessProfile?.businessName || 'Shokupan',
      businessLogo: businessProfile?.businessLogo,
      backgroundColor: businessProfile?.primaryColor || 'rgb(227, 242, 253)',
      foregroundColor: businessProfile?.foregroundColor || 'rgb(0, 0, 0)',
      labelColor: businessProfile?.accentColor || 'rgb(25, 118, 210)'
    };

    // Generar Passbook
    const appleWallet = getAppleWalletService();
    const passBuffer = await appleWallet.generatePass(cardData);

    // Por ahora, devolvemos JSON como texto
    // En el futuro, esto será un archivo .pkpass válido
    const passJson = JSON.parse(passBuffer.toString());
    const jsonString = JSON.stringify(passJson, null, 2);

    return new Response(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="shokupan-${card.code}.pkpass.json"`
      }
    });

  } catch (error) {
    console.error("Error downloading Apple Wallet pass:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 