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
    const customerId = segments.at(-2) || "";

    // Verificar que el cliente pertenece al usuario
    const customer = await (prisma as any).customer.findFirst({
      where: { 
        id: customerId,
        userId: session.user.id 
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Obtener todas las tarjetas del cliente con sus validaciones
    const cardsWithScans = await (prisma as any).card.findMany({
      where: { 
        customerId: customerId,
        userId: session.user.id 
      },
      include: {
        scans: {
          orderBy: { scannedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Procesar los datos para crear un historial unificado
    const history = cardsWithScans.flatMap((card: any) => 
      card.scans.map((scan: any) => ({
        id: scan.id,
        cardId: card.id,
        cardCode: card.code,
        cardType: card.type,
        scannedAt: scan.scannedAt,
        ipAddress: scan.ipAddress,
        userAgent: scan.userAgent
      }))
    );

    // Ordenar por fecha de escaneo (más reciente primero)
    history.sort((a: any, b: any) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());

    // Agrupar por fecha para facilitar la visualización
    const groupedHistory = history.reduce((groups: any, item: any) => {
      const date = new Date(item.scannedAt).toLocaleDateString('es-ES');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    }, {});

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      },
      history,
      groupedHistory,
      totalScans: history.length
    });

  } catch (error) {
    console.error("Error fetching customer history:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 