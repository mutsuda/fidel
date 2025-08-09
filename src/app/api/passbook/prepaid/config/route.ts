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
      backgroundColor: "#E8F5E8",
      foregroundColor: "#000000",
      labelColor: "#2E7D32",
      initialUses: 10,
      remainingText: "Restantes"
    };

    return NextResponse.json({ config: defaultConfig });
  } catch (error) {
    console.error("Error fetching prepaid passbook config:", error);
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
      initialUses,
      remainingText
    } = body;

    // Por ahora, solo guardamos la configuración en memoria
    // En una implementación real, esto se guardaría en la base de datos
    const config = {
      businessName,
      businessLogo,
      backgroundColor: backgroundColor || "#E8F5E8",
      foregroundColor: foregroundColor || "#000000",
      labelColor: labelColor || "#2E7D32",
      initialUses: initialUses || 10,
      remainingText: remainingText || "Restantes"
    };

    return NextResponse.json({
      success: true,
      config,
      message: "Configuración de Passbook de prepago guardada correctamente"
    });

  } catch (error) {
    console.error("Error saving prepaid passbook config:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 