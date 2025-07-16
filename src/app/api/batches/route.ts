import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "../../../generated/prisma";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Devolver un array vacío como espera el frontend
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

    // Para el MVP, crear un lote simulado
    const batch = {
      id: "batch_" + Date.now(),
      name,
      description: description || null,
      quantity,
      templateId,
      createdAt: new Date().toISOString(),
      codes: []
    };

    return NextResponse.json(batch);
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