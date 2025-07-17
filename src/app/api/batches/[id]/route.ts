import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";

const prisma = new PrismaClient();

// GET /api/batches/[id] - Detalles del batch y sus tarjetas
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: params.id },
      include: {
        template: true,
        codes: {
          include: {
            scans: {
              orderBy: { scannedAt: "desc" },
              take: 1 // Solo la última validación
            }
          }
        }
      }
    });
    if (!batch) {
      return NextResponse.json({ error: "Batch no encontrado" }, { status: 404 });
    }
    // Formatear tarjetas para mostrar solo id, code, última validación
    const cards = batch.codes.map(card => ({
      id: card.id,
      code: card.code,
      lastValidated: card.scans[0]?.scannedAt || null
    }));
    return NextResponse.json({
      ...batch,
      codes: cards
    });
  } catch (error) {
    console.error("Error fetching batch details:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/batches/[id]?cardId=... - Revocar (eliminar) una tarjeta
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get("cardId");
    if (!cardId) {
      return NextResponse.json({ error: "cardId requerido" }, { status: 400 });
    }
    await prisma.code.delete({ where: { id: cardId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revocando tarjeta:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/batches/[id] - Crear más tarjetas en el batch
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { quantity } = body;
    if (!quantity || quantity < 1 || quantity > 10000) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }
    // Buscar el batch
    const batch = await prisma.batch.findUnique({ where: { id: params.id } });
    if (!batch) {
      return NextResponse.json({ error: "Batch no encontrado" }, { status: 404 });
    }
    // Crear nuevas tarjetas
    const created = [];
    for (let i = 1; i <= quantity; i++) {
      // Buscar el siguiente número secuencial
      const maxNumber = await prisma.code.aggregate({
        where: { batchId: batch.id },
        _max: { number: true }
      });
      const number = (maxNumber._max.number || 0) + 1;
      // Generar código único
      const code = generateCode(batch.id, number);
      const hash = require("crypto").randomBytes(32).toString("hex");
      const card = await prisma.code.create({
        data: {
          code,
          hash,
          number,
          batchId: batch.id
        }
      });
      created.push(card);
    }
    return NextResponse.json({ created });
  } catch (error) {
    console.error("Error creando tarjetas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

function generateCode(batchId: string, number: number): string {
  const crypto = require("crypto");
  const base = batchId + number;
  const hash = crypto.createHash('sha256').update(base).digest('hex');
  return hash.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
} 