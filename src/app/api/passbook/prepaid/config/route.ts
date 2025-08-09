import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

// Almacenamiento temporal en memoria (en producción usar base de datos)
const tempStorage = new Map();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const key = `prepaid_${session.user.id}`;
    const existingConfig = tempStorage.get(key);

    if (existingConfig) {
      return NextResponse.json({ config: existingConfig });
    }

    // Configuración por defecto si no existe
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

    const key = `prepaid_${session.user.id}`;
    const config = {
      businessName: businessName || "",
      businessLogo: businessLogo || "",
      backgroundColor: backgroundColor || "#E8F5E8",
      foregroundColor: foregroundColor || "#000000",
      labelColor: labelColor || "#2E7D32",
      initialUses: initialUses || 10,
      remainingText: remainingText || "Restantes"
    };

    // Guardar en almacenamiento temporal
    tempStorage.set(key, config);

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