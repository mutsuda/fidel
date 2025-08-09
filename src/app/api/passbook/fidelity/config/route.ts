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
    // Por ahora, devolvemos una configuración por defecto
    // En una implementación real, esto se cargaría desde la base de datos
    const defaultConfig = {
      businessName: "",
      businessLogo: "",
      backgroundColor: "#E3F2FD",
      foregroundColor: "#000000",
      labelColor: "#1976D2",
      totalUses: 11,
      progressText: "Progreso"
    };

    return NextResponse.json({ config: defaultConfig });
  } catch (error) {
    console.error("Error fetching fidelity passbook config:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      businessName,
      businessLogo,
      backgroundColor,
      foregroundColor,
      labelColor,
      totalUses,
      progressText
    } = body;

    // Por ahora, solo guardamos la configuración en memoria
    // En una implementación real, esto se guardaría en la base de datos
    const config = {
      businessName,
      businessLogo,
      backgroundColor: backgroundColor || "#E3F2FD",
      foregroundColor: foregroundColor || "#000000",
      labelColor: labelColor || "#1976D2",
      totalUses: totalUses || 11,
      progressText: progressText || "Progreso"
    };

    return NextResponse.json({
      success: true,
      config,
      message: "Configuración de Passbook de fidelidad guardada correctamente"
    });

  } catch (error) {
    console.error("Error saving fidelity passbook config:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 