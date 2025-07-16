import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";

// Configurar DATABASE_URL para Vercel
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Para el MVP, retornamos un array vacío
    // En producción, aquí iría la lógica de autenticación
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

    // Crear un usuario temporal para el MVP
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "temp@example.com",
          name: "Usuario Temporal"
        }
      });
    }

    const template = await prisma.template.create({
      data: {
        name,
        description: description || null,
        imageUrl: dataUrl,
        userId: user.id
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 