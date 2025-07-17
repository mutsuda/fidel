import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log("[DEBUG] Debug auth endpoint called");
    
    const session = await getServerSession(authOptions);
    console.log("[DEBUG] Session result:", session);
    
    if (!session) {
      return NextResponse.json({ 
        error: "No session", 
        hasSession: false,
        session: null
      }, { status: 401 });
    }
    
    if (!session.user?.id) {
      return NextResponse.json({ 
        error: "No user ID in session", 
        hasSession: true,
        hasUserId: false,
        session: {
          user: session.user
        }
      }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("[DEBUG] User ID from session:", userId);

    // Verificar que el usuario existe en la BD
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    console.log("[DEBUG] User in DB:", user ? { id: user.id, email: user.email } : null);

    // Contar batches del usuario
    const batchesCount = await prisma.batch.count({
      where: { userId }
    });
    console.log("[DEBUG] Batches count for user:", batchesCount);

    // Obtener un batch específico
    const specificBatchId = "cmd7yht3h0001jo04ao0szpz6";
    const batch = await prisma.batch.findFirst({
      where: { id: specificBatchId, userId }
    });
    console.log("[DEBUG] Specific batch found:", batch ? { id: batch.id, name: batch.name } : null);

    return NextResponse.json({
      success: true,
      userId,
      userExists: !!user,
      batchesCount,
      specificBatchExists: !!batch,
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name
        }
      }
    });
  } catch (error) {
    console.error("[DEBUG] Error in debug auth endpoint:", error);
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 