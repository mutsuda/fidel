import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log del webhook para debugging
    console.log("Wallet webhook received:", JSON.stringify(body, null, 2));

    // Verificar autenticación del webhook (se implementará según la plataforma)
    const authHeader = request.headers.get("authorization");
    const userAgent = request.headers.get("user-agent");
    
    // TODO: Implementar verificación de autenticidad según plataforma
    // - Apple: Verificar certificado
    // - Google: Verificar JWT

    // Procesar diferentes tipos de webhooks
    if (body.eventType === "passAdded") {
      // Tarjeta añadida a Wallet
      console.log("Pass added to wallet:", body.serialNumber);
      
    } else if (body.eventType === "passUpdated") {
      // Tarjeta actualizada en Wallet
      console.log("Pass updated in wallet:", body.serialNumber);
      
    } else if (body.eventType === "passRemoved") {
      // Tarjeta removida de Wallet
      console.log("Pass removed from wallet:", body.serialNumber);
      
    } else if (body.eventType === "passViewed") {
      // Tarjeta vista en Wallet
      console.log("Pass viewed in wallet:", body.serialNumber);
      
    } else {
      // Evento desconocido
      console.log("Unknown webhook event:", body.eventType);
    }

    // Registrar el evento en la base de datos
    await prisma.cardScan.create({
      data: {
        cardId: body.serialNumber || "unknown", // Usar hash como cardId
        ipAddress: request.headers.get("x-forwarded-for") || "wallet-webhook",
        userAgent: userAgent || "wallet-webhook",
        scannedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Webhook processed successfully" 
    });
    
  } catch (error) {
    console.error("Error processing wallet webhook:", error);
    return NextResponse.json({ 
      error: "Error processing webhook" 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Endpoint para verificar que el webhook está funcionando
  return NextResponse.json({ 
    status: "Wallet webhook endpoint is active",
    timestamp: new Date().toISOString()
  });
} 