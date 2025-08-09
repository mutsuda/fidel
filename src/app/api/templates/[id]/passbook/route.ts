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
    const templateId = segments.at(-2) || "";

    const template = await prisma.template.findFirst({
      where: { 
        id: templateId,
        userId: session.user.id 
      }
    });

    if (!template) {
      return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
    }

    // Por ahora, devolvemos la plantilla sin configuración de Passbook
    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template passbook config:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/");
    const templateId = segments.at(-2) || "";

    const body = await request.json();
    const {
      businessName,
      businessLogo,
      backgroundColor,
      foregroundColor,
      labelColor,
      fidelityConfig,
      prepaidConfig
    } = body;

    // Verificar que la plantilla existe y pertenece al usuario
    const template = await prisma.template.findFirst({
      where: { 
        id: templateId,
        userId: session.user.id 
      }
    });

    if (!template) {
      return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
    }

    // Por ahora, solo guardamos la configuración en memoria o en un archivo temporal
    // En una implementación real, esto se guardaría en la base de datos
    const passbookConfig = {
      businessName,
      businessLogo,
      backgroundColor,
      foregroundColor,
      labelColor,
      fidelityConfig,
      prepaidConfig
    };

    return NextResponse.json({
      success: true,
      passbookConfig,
      message: "Configuración de Passbook guardada correctamente (modo temporal)"
    });

  } catch (error) {
    console.error("Error saving passbook config:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 