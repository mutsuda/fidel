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
    const id = segments.at(-1) || "";
    const userId = session.user.id;
    // Verificar que la plantilla es del usuario
    const template = await prisma.template.findFirst({ where: { id, userId } });
    if (!template) {
      return NextResponse.json({ error: "Plantilla no encontrada o no autorizada" }, { status: 404 });
    }
    // Verificar que no tiene lotes asociados
    const batches = await prisma.batch.findMany({ where: { templateId: id } });
    if (batches.length > 0) {
      return NextResponse.json({ error: "No se puede eliminar una plantilla en uso" }, { status: 400 });
    }
    await prisma.template.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando plantilla:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 