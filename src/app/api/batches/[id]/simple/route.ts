import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

const prisma = new PrismaClient();

function getIdFromRequest(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const segments = pathname.split("/");
  console.log("[DEBUG] Path segments:", segments);
  // Para /api/batches/[id]/simple, el ID está en la posición -2
  return segments.at(-2) || "";
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const id = getIdFromRequest(request);
    const userId = session.user.id;
    console.log("[DEBUG] Simple GET batch - batchId:", id, "userId:", userId);
    
    // Consulta simple sin includes complejos
    const batch = await prisma.batch.findFirst({
      where: { id, userId }
    });
    
    console.log("[DEBUG] Simple batch found - exists:", !!batch, "batchUserId:", batch?.userId);
    
    if (!batch) {
      return NextResponse.json({ error: "Batch no encontrado", batchId: id, userId }, { status: 404 });
    }
    
    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error fetching batch details (simple):", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 