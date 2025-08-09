import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import { testResendEmailConfig, verifyEmailConfig } from "@/lib/email";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { testType = 'verify' } = body;

    if (testType === 'verify') {
      // Solo verificar la configuración
      const isConfigValid = await verifyEmailConfig();
      return NextResponse.json({
        success: isConfigValid,
        message: isConfigValid ? 'Configuración de email válida' : 'Error en la configuración de email'
      });
    } else if (testType === 'test') {
      // Enviar email de prueba
      const result = await testResendEmailConfig();
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "Tipo de prueba no válido" }, { status: 400 });
    }

  } catch (error) {
    console.error("Error testing email configuration:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Verificar configuración básica
    const isConfigValid = await verifyEmailConfig();
    
    return NextResponse.json({
      success: isConfigValid,
      config: {
        service: process.env.RESEND_API_KEY ? 'Resend' : 'SMTP',
        host: process.env.SMTP_HOST || 'smtp.resend.com',
        port: process.env.SMTP_PORT || '587',
        apiKey: process.env.RESEND_API_KEY ? 'Configurado' : 'No configurado',
        user: process.env.SMTP_USER ? 'Configurado' : 'No configurado',
        pass: process.env.SMTP_PASS ? 'Configurado' : 'No configurado'
      },
      message: isConfigValid ? 'Configuración de email válida' : 'Error en la configuración de email'
    });

  } catch (error) {
    console.error("Error checking email configuration:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 