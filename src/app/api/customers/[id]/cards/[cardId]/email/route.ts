import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import { sendEmail, generateCardEmailTemplate, generatePassbookEmailTemplate } from "@/lib/email";
import QRCode from "qrcode";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/");
    const customerId = segments.at(-4) || "";
    const cardId = segments.at(-2) || "";

    const body = await request.json();
    const { includePassbook = false } = body;

    // Verificar que la tarjeta pertenece al cliente y al usuario
    const card = await (prisma as any).card.findFirst({
      where: { 
        id: cardId,
        customerId: customerId,
        userId: session.user.id 
      },
      include: {
        customer: true
      }
    });

    if (!card) {
      return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
    }

    if (!card.customer.email) {
      return NextResponse.json({ error: "El cliente no tiene email registrado" }, { status: 400 });
    }

    // Generar QR code
    let qrCodeDataUrl = null;
    try {
      qrCodeDataUrl = await QRCode.toDataURL(card.hash, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
    }

    // Preparar el email
    let emailHtml: string;
    let subject: string;
    let attachments: Array<{ filename: string; content: Buffer | string; contentType?: string }> = [];

    if (includePassbook) {
      // Email con Passbook adjunto
      emailHtml = await generatePassbookEmailTemplate(
        card.customer.name,
        card.code,
        card.type,
        session.user.id
      );
      subject = `Tu Passbook - Tarjeta ${card.code} - Shokupan`;

      // TODO: Generar y adjuntar el archivo .pkpass
      // Por ahora, solo enviamos el email sin adjunto
      // En el futuro, aquí se generaría el archivo .pkpass y se adjuntaría
    } else {
      // Email con QR code
      emailHtml = await generateCardEmailTemplate(
        card.customer.name,
        card.code,
        card.type,
        qrCodeDataUrl || undefined,
        session.user.id
      );
      subject = `Tu tarjeta ${card.code} - Shokupan`;
    }

    // Enviar el email
    const emailResult = await sendEmail({
      to: card.customer.email,
      subject,
      html: emailHtml,
      attachments
    });

    if (!emailResult.success) {
      return NextResponse.json({ 
        error: "Error al enviar el email", 
        details: emailResult.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Email enviado correctamente",
      messageId: emailResult.messageId
    });

  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 