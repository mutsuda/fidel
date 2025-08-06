import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { hash } = await request.json();

    if (!hash) {
      return NextResponse.json({ error: "Hash requerido" }, { status: 400 });
    }

    // Buscar la tarjeta por hash
    const card = await prisma.card.findUnique({
      where: { hash },
      include: {
        customer: true
      }
    });

    if (!card) {
      return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
    }

    if (!card.active) {
      return NextResponse.json({ error: "Tarjeta inactiva" }, { status: 400 });
    }

    // Verificar límites según el tipo de tarjeta
    let canUse = true;
    let message = "";

    if (card.type === 'FIDELITY') {
      // Para fidelidad, siempre se puede usar
      canUse = true;
    } else if (card.type === 'PREPAID') {
      // Para prepago, verificar que queden usos
      if (card.remainingUses !== null && card.remainingUses <= 0) {
        canUse = false;
        message = "No quedan usos disponibles";
      }
    }

    if (!canUse) {
      return NextResponse.json({ 
        error: message || "Tarjeta no válida",
        card: {
          id: card.id,
          code: card.code,
          type: card.type,
          customer: card.customer,
          currentUses: card.currentUses,
          totalUses: card.totalUses,
          remainingUses: card.remainingUses,
          active: card.active
        }
      }, { status: 400 });
    }

    // Registrar el escaneo
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    
    await prisma.cardScan.create({
      data: {
        cardId: card.id,
        ipAddress,
        userAgent
      }
    });

    // Actualizar contadores según el tipo
    if (card.type === 'FIDELITY') {
      const newCurrentUses = card.currentUses + 1;
      const isCompleted = newCurrentUses >= (card.totalUses || 11);
      
      await prisma.card.update({
        where: { id: card.id },
        data: {
          currentUses: isCompleted ? 0 : newCurrentUses // Reset si completa
        }
      });

      return NextResponse.json({
        ok: true,
        card: {
          id: card.id,
          code: card.code,
          type: card.type,
          customer: card.customer,
          currentUses: isCompleted ? 0 : newCurrentUses,
          totalUses: card.totalUses,
          isCompleted,
          message: isCompleted ? "¡Café gratis! Se reinicia el contador." : `Uso ${newCurrentUses} de ${card.totalUses}`
        }
      });
    } else if (card.type === 'PREPAID') {
      const newRemainingUses = (card.remainingUses || 0) - 1;
      
      await prisma.card.update({
        where: { id: card.id },
        data: {
          remainingUses: newRemainingUses,
          active: newRemainingUses > 0
        }
      });

      return NextResponse.json({
        ok: true,
        card: {
          id: card.id,
          code: card.code,
          type: card.type,
          customer: card.customer,
          remainingUses: newRemainingUses,
          active: newRemainingUses > 0,
          message: newRemainingUses > 0 ? `Quedan ${newRemainingUses} usos` : "Último uso completado"
        }
      });
    }

    return NextResponse.json({ error: "Tipo de tarjeta no válido" }, { status: 400 });
  } catch (error) {
    console.error("Error validating card:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 