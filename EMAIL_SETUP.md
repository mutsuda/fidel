# Configuración de Email - Shokupan

## Variables de Entorno Requeridas

Para que el sistema de envío de emails funcione correctamente, necesitas configurar las siguientes variables de entorno:

### Variables Básicas

```bash
# Configuración SMTP
SMTP_HOST="smtp.gmail.com"          # Servidor SMTP
SMTP_PORT="587"                     # Puerto SMTP (587 para TLS, 465 para SSL)
SMTP_USER="tu-email@gmail.com"      # Usuario/email
SMTP_PASS="tu-contraseña"           # Contraseña o contraseña de aplicación
```

## Configuraciones Recomendadas

### 1. Gmail (Recomendado para desarrollo)

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-contraseña-de-aplicación"
```

**Nota:** Para Gmail, necesitas usar una "Contraseña de aplicación" en lugar de tu contraseña normal.

### 2. Tu Dominio shokupan.es

```bash
SMTP_HOST="mail.shokupan.es"
SMTP_PORT="587"
SMTP_USER="noreply@shokupan.es"
SMTP_PASS="tu-contraseña-de-email"
```

### 3. SendGrid (Recomendado para producción)

```bash
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="tu-api-key-de-sendgrid"
```

## Configuración por Proveedor

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

### Dominio Propio (shokupan.es)

1. Configura el servidor de correo en tu hosting
2. Usa las credenciales proporcionadas por tu proveedor
3. Asegúrate de que el puerto 587 esté abierto

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

### Error: "Invalid login"

- Verifica que las credenciales sean correctas
- Para Gmail, asegúrate de usar una contraseña de aplicación
- Verifica que la verificación en dos pasos esté activada

### Error: "Connection timeout"

- Verifica que el puerto esté abierto
- Asegúrate de que el servidor SMTP sea correcto
- Revisa la configuración de firewall

### Error: "Authentication failed"

- Verifica que el usuario y contraseña sean correctos
- Para Gmail, usa contraseña de aplicación
- Asegúrate de que la cuenta tenga permisos de SMTP

## Seguridad

- Nunca commits las credenciales reales
- Usa variables de entorno
- Considera usar servicios como SendGrid para producción
- Implementa rate limiting para evitar spam

## Próximos Pasos

1. Configura las variables de entorno
2. Prueba el envío de emails
3. Personaliza las plantillas según tus necesidades
4. Implementa rate limiting y monitoreo
5. Configura logs para debugging 