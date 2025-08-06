import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/");
    const customerId = segments.at(-3) || ""; // /api/customers/[id]/cards/[cardId]
    const cardId = segments.at(-1) || "";

    // Verificar que la tarjeta pertenece al cliente y al usuario
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

    // Eliminar todos los scans de la tarjeta
    await (prisma as any).cardScan.deleteMany({
      where: { cardId: cardId }
    });

    // Eliminar la tarjeta
    await (prisma as any).card.delete({
      where: { id: cardId }
    });

    return NextResponse.json({
      success: true,
      message: "Tarjeta eliminada correctamente"
    });

  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 