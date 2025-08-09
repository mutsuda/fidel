# Configuración de Email - Shokupan

## Variables de Entorno Requeridas

Para que el sistema de envío de emails funcione correctamente, necesitas configurar las siguientes variables de entorno:

### Variables Básicas

```bash
# Configuración Resend (Recomendado - GRATUITO)
RESEND_API_KEY="re_xxxxxxxxxxxxx"    # API Key de Resend

# Configuración SMTP (Alternativa)
SMTP_HOST="smtp.resend.com"          # Servidor SMTP
SMTP_PORT="587"                      # Puerto SMTP (587 para TLS, 465 para SSL)
SMTP_USER="resend"                   # Usuario/email
SMTP_PASS="tu-api-key"               # Contraseña o API key
```

## Configuraciones Recomendadas

### 1. Resend (Recomendado - GRATUITO)

**Resend** es un servicio de email moderno y confiable que ofrece:
- ✅ **Plan gratuito** - 3,000 emails/mes gratis
- ✅ **Configuración sencilla** - Solo necesitas una API key
- ✅ **Excelente deliverability** - Emails llegan a la bandeja de entrada
- ✅ **API moderna** - Fácil de usar y mantener
- ✅ **Soporte técnico** - Documentación excelente

```bash
RESEND_API_KEY="re_xxxxxxxxxxxxx"
```

**Pasos para configurar Resend:**

1. **Crear cuenta en Resend:**
   - Ve a [resend.com](https://resend.com)
   - Crea una cuenta gratuita
   - Verifica tu email

2. **Obtener API Key:**
   - Ve a la sección "API Keys"
   - Crea una nueva API key
   - Copia la key (empieza con `re_`)

3. **Configurar dominio (opcional):**
   - Ve a "Domains"
   - Añade tu dominio `shokupan.es`
   - Sigue las instrucciones de DNS

4. **Configurar variables de entorno:**
   ```bash
   RESEND_API_KEY="re_xxxxxxxxxxxxx"
   ```

### 2. Gmail (Alternativa para desarrollo)

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-contraseña-de-aplicación"
```

**Nota:** Para Gmail, necesitas usar una "Contraseña de aplicación" en lugar de tu contraseña normal.

### 3. SendGrid (Alternativa para producción)

```bash
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="tu-api-key-de-sendgrid"
```

## Configuración por Proveedor

### Resend (Recomendado)

**Ventajas de Resend:**
- 🆓 **Gratuito** - 3,000 emails/mes sin costo
- 🚀 **Rápido** - API moderna y eficiente
- 📊 **Analytics** - Tracking de emails enviados
- 🎯 **Deliverability** - Excelente tasa de entrega
- 🔧 **Fácil** - Configuración en 2 minutos

**Configuración paso a paso:**

1. **Registro:**
   - Ve a [resend.com](https://resend.com)
   - Crea una cuenta gratuita
   - Verifica tu email

2. **API Key:**
   - Dashboard > API Keys > Create API Key
   - Copia la key (formato: `re_xxxxxxxxxxxxx`)

3. **Dominio (opcional):**
   - Dashboard > Domains > Add Domain
   - Añade `shokupan.es`
   - Configura los registros DNS

4. **Variables de entorno:**
   ```bash
   RESEND_API_KEY="re_xxxxxxxxxxxxx"
   ```

5. **Prueba:**
   - Usa el endpoint `/api/email/test` para verificar
   - Envía un email de prueba

### Gmail

1. Ve a tu cuenta de Google
2. Activa la verificación en dos pasos
3. Genera una contraseña de aplicación:
   - Ve a "Seguridad" > "Contraseñas de aplicación"
   - Selecciona "Correo" y "Windows Computer"
   - Copia la contraseña generada

### SendGrid

1. Crea una cuenta en SendGrid
2. Genera una API Key
3. Usa la API Key como contraseña

## Verificación de Configuración

El sistema incluye una función de verificación que puedes usar para probar la configuración:

```typescript
import { verifyEmailConfig } from '@/lib/email';

// Verificar configuración
const isConfigValid = await verifyEmailConfig();
if (isConfigValid) {
  console.log('Email configuration is valid');
} else {
  console.log('Email configuration failed');
}
```

## Plantillas de Email

El sistema incluye dos tipos de plantillas:

1. **Email con QR Code**: Incluye el código QR de la tarjeta
2. **Email con Passbook**: Incluye el archivo .pkpass adjunto

### Personalización

Las plantillas se pueden personalizar editando los archivos:
- `src/lib/email.ts` - Plantillas HTML
- `src/app/api/customers/[id]/cards/[cardId]/email/route.ts` - Lógica de envío

## Troubleshooting

### Error: "Invalid API key"

- Verifica que la API key de Resend sea correcta
- Asegúrate de que la key empiece con `re_`
- Verifica que la cuenta esté activa

### Error: "Domain not verified"

- Configura tu dominio en Resend
- Verifica los registros DNS
- Usa un dominio verificado o el dominio por defecto

### Error: "Rate limit exceeded"

- El plan gratuito tiene límites
- Considera actualizar a un plan de pago
- Revisa el uso en el dashboard de Resend

## Seguridad

- Nunca commits las API keys reales
- Usa variables de entorno
- Considera usar servicios como Resend para producción
- Implementa rate limiting para evitar spam

## Próximos Pasos

1. **Configura Resend:**
   - Crea cuenta en [resend.com](https://resend.com)
   - Obtén tu API key
   - Configura las variables de entorno

2. **Prueba el sistema:**
   - Usa el endpoint `/api/email/test`
   - Envía un email de prueba
   - Verifica la configuración

3. **Personaliza:**
   - Ajusta las plantillas según tus necesidades
   - Configura tu dominio personalizado
   - Implementa analytics

4. **Monitoreo:**
   - Revisa los logs de envío
   - Configura alertas
   - Monitorea la deliverability 