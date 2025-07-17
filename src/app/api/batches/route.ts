import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    // Obtener todos los batches y contar las tarjetas asociadas
    const batches = await prisma.batch.findMany({
      where: { userId: session.user.id },
      include: {
        template: true,
        _count: { select: { codes: true } }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    // Agregar codesCount a cada batch
    const batchesWithCodes = batches.map((batch: any) => ({
      ...batch,
      codesCount: batch._count.codes,
      codes: []
    }));
    return NextResponse.json(batchesWithCodes);
  } catch (error) {
    console.error("Error fetching batches:", error);
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
    const { name, description, quantity, templateId, initialUses } = body;

    console.log("[DEBUG] Creating batch", { 
      userId: session.user.id, 
      name, 
      quantity, 
      templateId 
    });

    if (!name || !quantity || !templateId) {
      return NextResponse.json({ error: "Nombre, cantidad y plantilla son requeridos" }, { status: 400 });
    }

    if (quantity < 1 || quantity > 10000) {
      return NextResponse.json({ error: "La cantidad debe estar entre 1 y 10,000" }, { status: 400 });
    }

    // Verificar que el usuario existe en la BD
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    console.log("[DEBUG] User in DB", { 
      user: user ? { id: user.id, email: user.email } : null 
    });

    // Crear el lote en la base de datos
    const batch = await prisma.batch.create({
      data: {
        name,
        description: description || null,
        quantity,
        templateId,
        userId: session.user.id
      },
      include: {
        template: true
      }
    });

    console.log("[DEBUG] Batch created", { 
      batchId: batch.id, 
      userId: batch.userId 
    });

    // Listar todos los batches del usuario
    const allBatches = await prisma.batch.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, createdAt: true }
    });
    console.log("[DEBUG] All batches for user", { userId: session.user.id, batches: allBatches });

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
          batchId: batch.id,
          uses: (typeof initialUses === 'number' && initialUses >= 0) ? initialUses : null,
          active: true
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