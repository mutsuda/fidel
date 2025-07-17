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
    console.log("[DEBUG] Simple batches API - userId:", session.user.id);
    
    // Consulta simple como templates
    const batches = await prisma.batch.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log("[DEBUG] Simple batches found:", batches.length);
    
    return NextResponse.json(batches);
  } catch (error) {
    console.error("Error fetching batches (simple):", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 