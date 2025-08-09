import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Configuración del transportador de email (fallback para nodemailer)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'resend',
    pass: process.env.SMTP_PASS || process.env.RESEND_API_KEY || '',
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verificar la configuración del transportador
export const verifyEmailConfig = async () => {
  try {
    // Intentar con Resend primero
    if (process.env.RESEND_API_KEY) {
      try {
        // Verificar la API key intentando enviar un email de prueba
        const { data, error } = await resend.emails.send({
          from: 'Shokupan <noreply@shokupan.es>',
          to: ['test@example.com'],
          subject: 'Test',
          html: '<p>Test</p>'
        });
        
        if (!error) {
          console.log('Resend configuration verified successfully');
          return true;
        }
      } catch (resendError) {
        console.log('Resend not available, falling back to SMTP');
      }
    }
    
    // Fallback a nodemailer
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

// Función específica para probar configuración de Resend
export const testResendEmailConfig = async () => {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY no está configurado' };
    }

    // Enviar email de prueba con Resend
    const { data, error } = await resend.emails.send({
      from: 'Shokupan <onboarding@resend.dev>', // Usar dominio por defecto hasta verificar shokupan.es
      to: ['test@example.com'], // Email de prueba
      subject: 'Prueba de configuración - Shokupan',
      html: `
        <h2>✅ Configuración de email exitosa</h2>
        <p>La configuración de email con Resend está funcionando correctamente.</p>
        <p><strong>Servicio:</strong> Resend</p>
        <p><strong>API Key:</strong> Configurado</p>
        <p><em>Este es un email de prueba automático.</em></p>
      `
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id, message: 'Email de prueba enviado correctamente' };
  } catch (error) {
    console.error('Error testing Resend email config:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Interfaz para los datos del email
interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Función para enviar emails (usando Resend como prioridad)
export const sendEmail = async (emailData: EmailData) => {
  try {
    // Intentar con Resend primero
    if (process.env.RESEND_API_KEY) {
      const { data, error } = await resend.emails.send({
        from: 'Shokupan <onboarding@resend.dev>', // Usar dominio por defecto hasta verificar shokupan.es
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments?.map(attachment => ({
          filename: attachment.filename,
          content: typeof attachment.content === 'string' 
            ? Buffer.from(attachment.content) 
            : attachment.content
        })) || []
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Email sent successfully via Resend:', data?.id);
      return { success: true, messageId: data?.id };
    }

    // Fallback a nodemailer
    const mailOptions = {
      from: `"Shokupan" <${process.env.SMTP_USER || 'noreply@shokupan.es'}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      attachments: emailData.attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Plantilla para email de tarjeta
export const generateCardEmailTemplate = (customerName: string, cardCode: string, cardType: string, qrCodeDataUrl?: string) => {
  const cardTypeLabel = cardType === 'FIDELITY' ? 'Fidelidad' : 'Prepago';
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tu tarjeta de ${cardTypeLabel} - Shokupan</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 10px;
        }
        .title {
          color: #1976d2;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .card-info {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #1976d2;
        }
        .qr-code {
          text-align: center;
          margin: 30px 0;
        }
        .qr-code img {
          max-width: 200px;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background-color: #1976d2;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 10px 0;
        }
        .button:hover {
          background-color: #1565c0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">☕ Shokupan</div>
          <h1 class="title">¡Tu tarjeta de ${cardTypeLabel} está lista!</h1>
        </div>
        
        <p>Hola <strong>${customerName}</strong>,</p>
        
        <p>Te hemos creado una tarjeta de ${cardTypeLabel} personalizada. Aquí tienes toda la información:</p>
        
        <div class="card-info">
          <h3>📋 Información de tu tarjeta</h3>
          <p><strong>Código:</strong> ${cardCode}</p>
          <p><strong>Tipo:</strong> ${cardTypeLabel}</p>
          <p><strong>Estado:</strong> Activa</p>
        </div>
        
        ${qrCodeDataUrl ? `
        <div class="qr-code">
          <h3>📱 Código QR</h3>
          <p>Escanea este código QR con tu dispositivo para usar tu tarjeta:</p>
          <img src="${qrCodeDataUrl}" alt="Código QR de la tarjeta" />
        </div>
        ` : ''}
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>🎯 ¿Cómo usar tu tarjeta?</h3>
          <ul>
            <li>Muestra el código QR al barista cuando hagas tu pedido</li>
            <li>El sistema registrará automáticamente tu uso</li>
            <li>Puedes ver tu progreso en cualquier momento</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>© 2024 Shokupan. Todos los derechos reservados.</p>
          <p>Este email fue enviado desde <strong>noreply@shokupan.es</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Plantilla para email con Passbook adjunto
export const generatePassbookEmailTemplate = (customerName: string, cardCode: string, cardType: string) => {
  const cardTypeLabel = cardType === 'FIDELITY' ? 'Fidelidad' : 'Prepago';
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tu Passbook - Shokupan</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 10px;
        }
        .title {
          color: #1976d2;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .card-info {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #1976d2;
        }
        .passbook-info {
          background-color: #e8f5e8;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #4caf50;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">☕ Shokupan</div>
          <h1 class="title">¡Tu Passbook está listo!</h1>
        </div>
        
        <p>Hola <strong>${customerName}</strong>,</p>
        
        <p>Te hemos creado un Passbook personalizado para tu tarjeta de ${cardTypeLabel}. Adjunto encontrarás el archivo para añadirlo a tu Apple Wallet o Google Pay.</p>
        
        <div class="card-info">
          <h3>📋 Información de tu tarjeta</h3>
          <p><strong>Código:</strong> ${cardCode}</p>
          <p><strong>Tipo:</strong> ${cardTypeLabel}</p>
          <p><strong>Estado:</strong> Activa</p>
        </div>
        
        <div class="passbook-info">
          <h3>📱 Passbook adjunto</h3>
          <p>En este email encontrarás un archivo <strong>.pkpass</strong> que puedes:</p>
          <ul>
            <li>Abrir directamente en tu iPhone para añadirlo a Apple Wallet</li>
            <li>Usar con Google Pay en dispositivos Android</li>
            <li>Guardar en tu dispositivo para uso posterior</li>
          </ul>
        </div>
        
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>🎯 ¿Cómo usar tu Passbook?</h3>
          <ul>
            <li>Abre el archivo .pkpass adjunto</li>
            <li>Sigue las instrucciones para añadirlo a tu wallet</li>
            <li>Muestra tu Passbook al barista cuando hagas tu pedido</li>
            <li>El sistema registrará automáticamente tu uso</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>© 2024 Shokupan. Todos los derechos reservados.</p>
          <p>Este email fue enviado desde <strong>noreply@shokupan.es</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}; 