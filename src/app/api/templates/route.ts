import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(templates);
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

    // Crear o encontrar usuario temporal
    let tempUser = await prisma.user.findUnique({
      where: { email: "temp@example.com" }
    });

    if (!tempUser) {
      tempUser = await prisma.user.create({
        data: {
          email: "temp@example.com",
          name: "Usuario Temporal"
        }
      });
    }

    // Crear la plantilla en la base de datos
    const template = await prisma.template.create({
      data: {
        name,
        description: description || null,
        imageUrl: dataUrl,
        userId: tempUser.id
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 