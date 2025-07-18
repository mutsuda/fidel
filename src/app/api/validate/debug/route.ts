import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[DEBUG] Validate debug request body:", body);
    
    const { hash } = body;
    if (!hash) {
      return NextResponse.json({ 
        ok: false, 
        error: "Hash requerido",
        debug: { receivedBody: body }
      }, { status: 400 });
    }
    
    console.log("[DEBUG] Looking for hash:", hash);
    
    // Buscar tarjeta por hash
    const card = await prisma.code.findUnique({
      where: { hash },
      include: {
        batch: { include: { template: true } }
      }
    });
    
    console.log("[DEBUG] Found card:", card ? "YES" : "NO");
    if (card) {
      console.log("[DEBUG] Card details:", {
        id: card.id,
        code: card.code,
        active: card.active,
        uses: card.uses,
        batchName: card.batch.name
      });
    }
    
    // También buscar por code por si acaso
    const cardByCode = await prisma.code.findFirst({
      where: { code: hash },
      include: {
        batch: { include: { template: true } }
      }
    });
    
    console.log("[DEBUG] Found card by code:", cardByCode ? "YES" : "NO");
    
    return NextResponse.json({
      ok: true,
      debug: {
        receivedHash: hash,
        hashLength: hash.length,
        foundByHash: !!card,
        foundByCode: !!cardByCode,
        totalCodes: await prisma.code.count(),
        sampleCodes: await prisma.code.findMany({ take: 3, select: { hash: true, code: true } })
      }
    });
  } catch (error) {
    console.error("[DEBUG] Validate debug error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: "Error interno",
      debug: { error: error instanceof Error ? error.message : String(error) }
    }, { status: 500 });
  }
} 