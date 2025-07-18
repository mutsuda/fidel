import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Validar QR (recibe { hash })
export async function POST(request: NextRequest) {
  try {
    const { hash } = await request.json();
    if (!hash) return NextResponse.json({ ok: false, error: "Hash requerido" }, { status: 400 });
    // Buscar tarjeta por hash
    const card = await prisma.code.findUnique({
      where: { hash },
      include: {
        batch: { include: { template: true } }
      }
    });
    if (!card) return NextResponse.json({ ok: false, error: "Tarjeta no encontrada" }, { status: 404 });
    if (!card.active) return NextResponse.json({ ok: false, error: "Tarjeta inactiva" }, { status: 403 });
    if (card.uses !== null && card.uses <= 0) return NextResponse.json({ ok: false, error: "Sin consumiciones" }, { status: 403 });
    // OK
    return NextResponse.json({
      ok: true,
      card: {
        id: card.id,
        code: card.code,
        uses: card.uses,
        active: card.active,
        batch: {
          id: card.batch.id,
          name: card.batch.name
        },
        template: {
          id: card.batch.template.id,
          name: card.batch.template.name,
          imageUrl: card.batch.template.imageUrl
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

// PATCH: Sumar/restar usos (recibe { cardId, action: "add" | "sub" })
export async function PATCH(request: NextRequest) {
  try {
    const { cardId, action } = await request.json();
    if (!cardId || !["add", "sub"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Parámetros requeridos" }, { status: 400 });
    }
    const card = await prisma.code.findUnique({ where: { id: cardId } });
    if (!card) return NextResponse.json({ ok: false, error: "Tarjeta no encontrada" }, { status: 404 });
    if (card.uses === null) return NextResponse.json({ ok: false, error: "Tarjeta ilimitada" }, { status: 400 });
    let newUses = card.uses;
    if (action === "add") newUses++;
    if (action === "sub" && card.uses > 0) newUses--;
    const updated = await prisma.code.update({ where: { id: cardId }, data: { uses: newUses } });
    return NextResponse.json({ ok: true, uses: updated.uses });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
} 