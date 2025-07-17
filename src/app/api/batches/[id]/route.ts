import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";

const prisma = new PrismaClient();

function getIdFromRequest(request: NextRequest) {
  const { pathname } = new URL(request.url);
  // /api/batches/[id] => [id] es el último segmento
  return pathname.split("/").pop() || "";
}

// GET /api/batches/[id] - Detalles del batch y sus tarjetas
export async function GET(request: NextRequest) {
  try {
    const id = getIdFromRequest(request);
    const batch = await prisma.batch.findUnique({
      where: { id },
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
export async function DELETE(request: NextRequest) {
  try {
    const id = getIdFromRequest(request);
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
export async function POST(request: NextRequest) {
  try {
    const id = getIdFromRequest(request);
    const body = await request.json();
    const { quantity } = body;
    if (!quantity || quantity < 1 || quantity > 10000) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }
    // Buscar el batch
    const batch = await prisma.batch.findUnique({ where: { id } });
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

export async function PATCH(request: NextRequest) {
  try {
    const id = getIdFromRequest(request);
    const body = await request.json();
    const { cardId, active, incrementUses } = body;
    if (!cardId) {
      return NextResponse.json({ error: "cardId requerido" }, { status: 400 });
    }
    // Buscar la tarjeta
    const card = await prisma.code.findUnique({ where: { id: cardId } });
    if (!card) {
      return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
    }
    // Actualizar estado y/o usos
    let data: any = {};
    if (typeof active === "boolean") data.active = active;
    if (incrementUses) data.uses = { increment: 1 };
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }
    const updated = await prisma.code.update({
      where: { id: cardId },
      data
    });
    return NextResponse.json({ success: true, card: updated });
  } catch (error) {
    console.error("Error actualizando tarjeta:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

function generateCode(batchId: string, number: number): string {
  // Genera un código robusto, único, de 10 caracteres, usando letras y números
  const crypto = require("crypto");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  // Usa un hash fuerte del batchId, number y un random
  const hash = crypto.createHash('sha256')
    .update(batchId + number + crypto.randomBytes(16).toString('hex'))
    .digest('base64');
  // Convierte el hash a solo caracteres válidos
  for (let i = 0; code.length < 10 && i < hash.length; i++) {
    const c = hash[i];
    if (chars.includes(c)) code += c;
  }
  // Si por alguna razón no llega a 10, rellena con random
  while (code.length < 10) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
} 