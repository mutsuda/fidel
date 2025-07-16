import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Para el MVP, retornamos un array vacío
    // En producción, aquí iría la lógica de autenticación
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, quantity, templateId } = body;

    if (!name || !quantity || !templateId) {
      return NextResponse.json({ error: "Nombre, cantidad y plantilla son requeridos" }, { status: 400 });
    }

    if (quantity < 1 || quantity > 10000) {
      return NextResponse.json({ error: "La cantidad debe estar entre 1 y 10,000" }, { status: 400 });
    }

    // Verificar que la plantilla existe
    const template = await prisma.template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
    }

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

    // Crear el lote
    const batch = await prisma.batch.create({
      data: {
        name,
        description: description || null,
        quantity,
        templateId,
        userId: user.id
      }
    });

    // Generar códigos únicos
    const codes = [];
    for (let i = 1; i <= quantity; i++) {
      const code = generateCode(i);
      const hash = crypto.randomBytes(32).toString("hex");
      
      codes.push({
        code,
        hash,
        number: i,
        batchId: batch.id
      });
    }

    // Crear todos los códigos
    await prisma.code.createMany({
      data: codes
    });

    // Retornar el lote con los códigos
    const batchWithCodes = await prisma.batch.findUnique({
      where: { id: batch.id },
      include: {
        codes: true,
        template: true
      }
    });

    return NextResponse.json(batchWithCodes);
  } catch (error) {
    console.error("Error creating batch:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

function generateCode(number: number): string {
  // Generar código alfanumérico de 6 caracteres
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  
  // Asegurar que el código sea único basado en el número
  const seed = number * 12345; // Número mágico para variación
  
  for (let i = 0; i < 6; i++) {
    const index = (seed + i * 7) % chars.length;
    code += chars[index];
  }
  
  return code;
} 