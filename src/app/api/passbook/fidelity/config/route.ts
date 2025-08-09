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
    const key = `fidelity_${session.user.id}`;
    const existingConfig = tempStorage.get(key);

    if (existingConfig) {
      return NextResponse.json({ config: existingConfig });
    }

    // Configuración por defecto si no existe
    const defaultConfig = {
      businessName: "",
      businessLogo: "",
      backgroundColor: "#E3F2FD",
      foregroundColor: "#000000",
      labelColor: "#1976D2",
      totalUses: 10,
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

    const key = `fidelity_${session.user.id}`;
    const config = {
      businessName: businessName || "",
      businessLogo: businessLogo || "",
      backgroundColor: backgroundColor || "#E3F2FD",
      foregroundColor: foregroundColor || "#000000",
      labelColor: labelColor || "#1976D2",
      totalUses: totalUses || 10,
      progressText: progressText || "Progreso"
    };

    // Guardar en almacenamiento temporal
    tempStorage.set(key, config);

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