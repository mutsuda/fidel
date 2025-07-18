import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

const prisma = new PrismaClient();

function getIdFromRequest(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const segments = pathname.split("/");
  console.log("[DEBUG] Original API path segments:", segments);
  // /api/batches/[id] => [id] es el último segmento
  const id = segments.at(-1) || "";
  console.log("[DEBUG] Original API extracted ID:", id);
  return id;
}

// GET /api/batches/[id] - Detalles del batch y sus tarjetas
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const id = getIdFromRequest(request);
    const userId = session.user.id;
    console.log("[DEBUG] GET batch - batchId:", id, "userId:", userId);
    
    console.log("[DEBUG] Starting complex query for batch:", id);
    
    // Primera consulta: obtener batch con template
    const batch = await prisma.batch.findFirst({
      where: { id, userId },
      include: {
        template: true,
        codes: true // Solo códigos básicos, sin scans
      }
    });
    
    if (!batch) {
      return NextResponse.json({ error: "Batch no encontrado", batchId: id, userId }, { status: 404 });
    }
    
    // Segunda consulta: obtener scans para cada código (opcional, más eficiente)
    const codesWithScans = await Promise.all(
      batch.codes.map(async (code: any) => {
        const lastScan = await prisma.scan.findFirst({
          where: { codeId: code.id },
          orderBy: { scannedAt: "desc" }
        });
        return {
          ...code,
          lastValidated: lastScan?.scannedAt || null
        };
      })
    );
    
    console.log("[DEBUG] Batch found - exists:", !!batch, "batchUserId:", batch?.userId);
    console.log("[DEBUG] Batch codes count:", batch?.codes?.length || 0);
    console.log("[DEBUG] Batch template:", batch?.template ? { id: batch.template.id, name: batch.template.name } : null);
    
    if (!batch) {
      return NextResponse.json({ error: "Batch no encontrado", batchId: id, userId }, { status: 404 });
    }
    // Formatear tarjetas usando codesWithScans
    const cards = codesWithScans.map((card: any) => ({
      id: card.id,
      code: card.code,
      lastValidated: card.lastValidated,
      active: card.active,
      uses: card.uses
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const id = getIdFromRequest(request);
    const userId = session.user.id;
    // Verificar que el lote es del usuario
    const batch = await prisma.batch.findFirst({ where: { id, userId } });
    if (!batch) {
      return NextResponse.json({ error: "Lote no encontrado o no autorizado" }, { status: 404 });
    }
    // Eliminar todos los scans de las tarjetas del lote
    const codes = await prisma.code.findMany({ where: { batchId: id } });
    const codeIds = codes.map((c: { id: string }) => c.id);
    await prisma.scan.deleteMany({ where: { codeId: { in: codeIds } } });
    // Eliminar las tarjetas
    await prisma.code.deleteMany({ where: { batchId: id } });
    // Eliminar el lote
    await prisma.batch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando lote:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/batches/[id] - Crear más tarjetas en el batch
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const id = getIdFromRequest(request);
    const body = await request.json();
    const { quantity } = body;
    if (!quantity || quantity < 1 || quantity > 10000) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }
    // Buscar el batch del usuario
    const batch = await prisma.batch.findFirst({ where: { id, userId: session.user.id } });
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const id = getIdFromRequest(request);
    const body = await request.json();
    const { cardId, active, incrementUses, decrementUses, setUses } = body;
    if (!cardId) {
      return NextResponse.json({ error: "cardId requerido" }, { status: 400 });
    }
    // Solo permitir modificar tarjetas del usuario
    const card = await prisma.code.findFirst({
      where: {
        id: cardId,
        batch: { userId: session.user.id }
      }
    });
    if (!card) {
      return NextResponse.json({ error: "Tarjeta no encontrada o no autorizada" }, { status: 404 });
    }
    // Actualizar estado y/o usos
    let data: any = {};
    if (typeof active === "boolean") data.active = active;
    if (incrementUses) data.uses = { increment: 1 };
    if (decrementUses && card.uses !== null && card.uses > 0) data.uses = { decrement: 1 };
    if (typeof setUses === "number" && setUses >= 0 && card.uses !== null) data.uses = setUses;
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