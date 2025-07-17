import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getIdFromRequest(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const segments = pathname.split("/");
  console.log("[DEBUG] Test API path segments:", segments);
  // Para /api/batches/[id]/test, el ID está en la posición -3
  return segments.at(-3) || "";
}

export async function GET(request: NextRequest) {
  try {
    const id = getIdFromRequest(request);
    console.log("[DEBUG] Test API - batchId:", id);
    
    // Consulta simple sin autenticación para probar
    const batch = await prisma.batch.findFirst({
      where: { id },
      include: {
        template: true,
        codes: true
      }
    });
    
    console.log("[DEBUG] Test API - batch found:", !!batch);
    
    if (!batch) {
      return NextResponse.json({ error: "Batch no encontrado", batchId: id }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        name: batch.name,
        description: batch.description,
        quantity: batch.quantity,
        userId: batch.userId,
        createdAt: batch.createdAt,
        codesCount: batch.codes.length
      }
    });
  } catch (error) {
    console.error("Error in test API:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 