import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

const prisma = new PrismaClient();

function getIdFromRequest(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const segments = pathname.split("/");
  console.log("[DEBUG] Path segments:", segments);
  // Para /api/batches/[id]/simple-with-codes, el ID está en la posición -3
  return segments.at(-3) || "";
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const id = getIdFromRequest(request);
    const userId = session.user.id;
    console.log("[DEBUG] Simple with codes GET batch - batchId:", id, "userId:", userId);
    
    // Consulta con códigos pero sin includes complejos
    const batch = await prisma.batch.findFirst({
      where: { id, userId },
      include: {
        codes: true // Solo incluir códigos básicos
      }
    });
    
    console.log("[DEBUG] Simple with codes batch found - exists:", !!batch, "batchUserId:", batch?.userId);
    console.log("[DEBUG] Batch codes count:", batch?.codes?.length || 0);
    
    if (!batch) {
      return NextResponse.json({ error: "Batch no encontrado", batchId: id, userId }, { status: 404 });
    }
    
    // Formatear códigos para el frontend
    const cards = batch.codes.map((card: any) => ({
      id: card.id,
      code: card.code,
      lastValidated: null, // No tenemos scans en esta versión
      active: card.active,
      uses: card.uses
    }));
    
    return NextResponse.json({
      ...batch,
      codes: cards
    });
  } catch (error) {
    console.error("Error fetching batch details (simple with codes):", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 