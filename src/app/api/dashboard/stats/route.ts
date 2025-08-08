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
    // Obtener estadísticas del usuario
    const [
      totalCustomers,
      totalCards,
      activeCards,
      totalBatches,
      totalTemplates
    ] = await Promise.all([
      // Total de clientes
      (prisma as any).customer.count({
        where: { userId: session.user.id }
      }),
      
      // Total de tarjetas
      (prisma as any).card.count({
        where: { userId: session.user.id }
      }),
      
      // Tarjetas activas
      (prisma as any).card.count({
        where: { 
          userId: session.user.id,
          active: true
        }
      }),
      
      // Total de lotes
      (prisma as any).batch.count({
        where: { userId: session.user.id }
      }),
      
      // Total de plantillas
      (prisma as any).template.count({
        where: { userId: session.user.id }
      })
    ]);

    return NextResponse.json({
      totalCustomers,
      totalCards,
      activeCards,
      totalBatches,
      totalTemplates
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 