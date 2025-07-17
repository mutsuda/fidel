import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";

const prisma = new PrismaClient();

// Medidas en puntos (1 punto = 1/72 pulgadas)
const MM_TO_PT = 72 / 25.4;
const CARD_WIDTH = 85 * MM_TO_PT; // 240.945 pt
const CARD_HEIGHT = 55 * MM_TO_PT; // 155.906 pt
const PAGE_WIDTH = 595.28; // A4: 210mm
const PAGE_HEIGHT = 841.89; // A4: 297mm
const CARDS_PER_ROW = 2;
const CARDS_PER_COL = 5;
const CARDS_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COL;
const MARGIN_X = (PAGE_WIDTH - (CARDS_PER_ROW * CARD_WIDTH)) / 2;
const MARGIN_Y = 36; // 0.5 inch
const CROP_MARK = 3 * MM_TO_PT; // 3mm en puntos

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { pathname } = new URL(request.url);
    const batchId = pathname.split("/").at(-2);
    if (!batchId) return NextResponse.json({ error: "BatchId requerido" }, { status: 400 });

    // Obtener batch, plantilla y tarjetas SOLO del usuario autenticado
    const batch = await prisma.batch.findFirst({
      where: { id: batchId, userId: session.user.id },
      include: {
        template: true,
        codes: true
      }
    });
    if (!batch) return NextResponse.json({ error: "Batch no encontrado" }, { status: 404 });
    if (!batch.template) return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });

    // Cargar imagen de plantilla (base64 data URL)
    const imageUrl = batch.template.imageUrl;
    const base64 = imageUrl.split(",")[1];
    const imageBytes = Buffer.from(base64, "base64");

    // Crear PDF
    const pdfDoc = await PDFDocument.create();
    const image = await pdfDoc.embedPng(imageBytes);

    for (let i = 0; i < batch.codes.length; i += CARDS_PER_PAGE) {
      const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      for (let j = 0; j < CARDS_PER_PAGE; j++) {
        const idx = i + j;
        if (idx >= batch.codes.length) break;
        const card = batch.codes[idx];
        // Posición de la tarjeta en la hoja
        const row = Math.floor(j / CARDS_PER_ROW);
        const col = j % CARDS_PER_ROW;
        const x = MARGIN_X + col * CARD_WIDTH;
        const y = PAGE_HEIGHT - MARGIN_Y - (row + 1) * CARD_HEIGHT;
        // Fondo: plantilla
        page.drawImage(image, {
          x,
          y,
          width: CARD_WIDTH,
          height: CARD_HEIGHT
        });
        // QR
        const qrDataUrl = await QRCode.toDataURL(card.hash, { margin: 0, width: 100 });
        const qrBase64 = qrDataUrl.split(",")[1];
        const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, "base64"));
        // QR en esquina inferior derecha
        const qrSize = 36; // pt
        page.drawImage(qrImage, {
          x: x + CARD_WIDTH - qrSize - 8,
          y: y + 8,
          width: qrSize,
          height: qrSize
        });
        // Código legible debajo del QR
        page.drawText(card.code, {
          x: x + CARD_WIDTH - qrSize - 8,
          y: y + 8 + qrSize + 4,
          size: 10,
          color: rgb(0, 0, 0)
        });
        // --- Marcas de corte ---
        // Verticales (izquierda y derecha)
        if (col === 0) {
          // Izquierda
          page.drawLine({
            start: { x: x, y: y - CROP_MARK },
            end: { x: x, y: y },
            thickness: 0.5,
            color: rgb(0.2, 0.2, 0.2)
          });
          page.drawLine({
            start: { x: x, y: y + CARD_HEIGHT },
            end: { x: x, y: y + CARD_HEIGHT + CROP_MARK },
            thickness: 0.5,
            color: rgb(0.2, 0.2, 0.2)
          });
        }
        if (col === CARDS_PER_ROW - 1) {
          // Derecha
          page.drawLine({
            start: { x: x + CARD_WIDTH, y: y - CROP_MARK },
            end: { x: x + CARD_WIDTH, y: y },
            thickness: 0.5,
            color: rgb(0.2, 0.2, 0.2)
          });
          page.drawLine({
            start: { x: x + CARD_WIDTH, y: y + CARD_HEIGHT },
            end: { x: x + CARD_WIDTH, y: y + CARD_HEIGHT + CROP_MARK },
            thickness: 0.5,
            color: rgb(0.2, 0.2, 0.2)
          });
        }
        // Horizontales (arriba y abajo)
        if (row === 0) {
          // Arriba
          page.drawLine({
            start: { x: x - CROP_MARK, y: y + CARD_HEIGHT },
            end: { x: x, y: y + CARD_HEIGHT },
            thickness: 0.5,
            color: rgb(0.2, 0.2, 0.2)
          });
          page.drawLine({
            start: { x: x + CARD_WIDTH, y: y + CARD_HEIGHT },
            end: { x: x + CARD_WIDTH + CROP_MARK, y: y + CARD_HEIGHT },
            thickness: 0.5,
            color: rgb(0.2, 0.2, 0.2)
          });
        }
        if (row === CARDS_PER_COL - 1) {
          // Abajo
          page.drawLine({
            start: { x: x - CROP_MARK, y: y },
            end: { x: x, y: y },
            thickness: 0.5,
            color: rgb(0.2, 0.2, 0.2)
          });
          page.drawLine({
            start: { x: x + CARD_WIDTH, y: y },
            end: { x: x + CARD_WIDTH + CROP_MARK, y: y },
            thickness: 0.5,
            color: rgb(0.2, 0.2, 0.2)
          });
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lote-${batchId}.pdf"`
      }
    });
  } catch (error) {
    console.error("Error generando PDF:", error);
    return NextResponse.json({ error: "Error generando PDF" }, { status: 500 });
  }
} 