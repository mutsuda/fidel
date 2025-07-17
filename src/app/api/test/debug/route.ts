import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("[DEBUG] Session:", session);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ 
        error: "No autorizado", 
        session: session,
        hasUserId: !!session?.user?.id 
      }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("[DEBUG] User ID:", userId);

    // Verificar que el usuario existe en la BD
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    console.log("[DEBUG] User in DB:", user);

    // Contar templates del usuario
    const templatesCount = await prisma.template.count({
      where: { userId }
    });
    console.log("[DEBUG] Templates count:", templatesCount);

    // Contar batches del usuario
    const batchesCount = await prisma.batch.count({
      where: { userId }
    });
    console.log("[DEBUG] Batches count:", batchesCount);

    // Obtener todos los batches del usuario
    const allBatches = await prisma.batch.findMany({
      where: { userId },
      select: { id: true, name: true, createdAt: true, userId: true }
    });
    console.log("[DEBUG] All batches:", allBatches);

    // Obtener todos los templates del usuario
    const allTemplates = await prisma.template.findMany({
      where: { userId },
      select: { id: true, name: true, createdAt: true, userId: true }
    });
    console.log("[DEBUG] All templates:", allTemplates);

    return NextResponse.json({
      success: true,
      userId,
      userExists: !!user,
      templatesCount,
      batchesCount,
      allBatches,
      allTemplates,
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name
        }
      }
    });
  } catch (error) {
    console.error("[DEBUG] Error in debug endpoint:", error);
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 