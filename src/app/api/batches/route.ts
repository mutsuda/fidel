import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "../../../generated/prisma";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        template: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    // Agregar codes: [] a cada batch para evitar errores en el frontend
    const batchesWithCodes = batches.map(batch => ({
      ...batch,
      codes: []
    }));
    return NextResponse.json(batchesWithCodes);
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

    // Crear el lote en la base de datos
    const batch = await prisma.batch.create({
      data: {
        name,
        description: description || null,
        quantity,
        templateId,
        userId: tempUser.id
      },
      include: {
        template: true
      }
    });

    // Generar códigos para el lote
    const codes = [];
    for (let i = 1; i <= quantity; i++) {
      const code = generateCode(batch.id, i);
      const hash = crypto.randomBytes(32).toString('hex');
      
      await prisma.code.create({
        data: {
          code,
          hash,
          number: i,
          batchId: batch.id
        }
      });
      
      codes.push({ code, hash, number: i });
    }

    return NextResponse.json({ ...batch, codes });
  } catch (error) {
    console.error("Error creating batch:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

function generateCode(batchId: string, number: number): string {
  // Usa un hash del batchId y el número para generar un código único de 6 caracteres
  const base = batchId + number;
  const hash = crypto.createHash('sha256').update(base).digest('hex');
  // Solo letras y números, 6 caracteres
  return hash.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
} 