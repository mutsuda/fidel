import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Devolver un array vacío como espera el frontend
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const file = formData.get("file") as File;

    if (!name || !file) {
      return NextResponse.json({ error: "Nombre y archivo son requeridos" }, { status: 400 });
    }

    // Para el MVP, guardamos la URL del archivo como base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const template = {
      id: "temp_" + Date.now(),
      name,
      description: description || null,
      imageUrl: dataUrl,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 