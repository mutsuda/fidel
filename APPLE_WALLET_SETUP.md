# Configuración de Apple Wallet (Passbook) - Shokupan

## Datos Necesarios para la Configuración

Para configurar correctamente Apple Wallet en Shokupan, necesitamos los siguientes datos de tu cuenta de desarrollador de Apple:

### 1. Información de Certificados

#### Certificado de Pass Type ID
- **Pass Type Identifier**: `pass.com.shokupan.loyalty` (o el que hayas creado)
- **Team Identifier**: Tu Team ID de Apple Developer
- **Certificate**: Archivo `.p12` del certificado de Pass Type ID

#### Certificado de Web Service
- **Certificate**: Archivo `.p12` del certificado de Web Service
- **Password**: Contraseña del certificado (si la tiene)

### 2. Información de la Aplicación

#### Identificadores
- **Bundle ID**: `com.shokupan.app` (o el que hayas configurado)
- **App ID**: Tu App ID en Apple Developer Portal

#### Configuración de Notificaciones
- **APNs Key**: Para notificaciones push (opcional)
- **APNs Key ID**: ID de la clave APNs
- **APNs Team ID**: Team ID para APNs

## Pasos para Obtener los Datos

### Paso 1: Acceder a Apple Developer Portal

1. Ve a [developer.apple.com](https://developer.apple.com)
2. Inicia sesión con tu cuenta de desarrollador
3. Ve a **Certificates, Identifiers & Profiles**

### Paso 2: Crear Pass Type ID

1. En la sección **Identifiers**, haz clic en **+**
2. Selecciona **Pass Type ID**
3. Completa la información:
   - **Description**: `Shokupan Loyalty Pass`
   - **Identifier**: `pass.com.shokupan.loyalty`
4. Haz clic en **Continue** y **Register**

### Paso 3: Configurar Pass Type ID

1. Selecciona el Pass Type ID que creaste
2. En **Passes**, marca las casillas que necesites:
   - ✅ **Generic Pass**
   - ✅ **Coupon Pass**
   - ✅ **Event Ticket Pass**
   - ✅ **Boarding Pass**
   - ✅ **Store Card Pass**

### Paso 4: Crear Certificados

#### Certificado de Pass Type ID
1. En la sección **Certificates**, haz clic en **+**
2. Selecciona **Pass Type ID Certificate**
3. Selecciona tu Pass Type ID
4. Sigue las instrucciones para crear el certificado
5. Descarga el archivo `.p12`

#### Certificado de Web Service
1. En la sección **Certificates**, haz clic en **+**
2. Selecciona **Web Service Certificate**
3. Sigue las instrucciones para crear el certificado
4. Descarga el archivo `.p12`

### Paso 5: Obtener Team ID

1. En la página principal del portal, busca **Membership**
2. Anota tu **Team ID** (formato: `ABC123DEF4`)

## Configuración en Shokupan

### Variables de Entorno Requeridas

Una vez que tengas todos los datos, necesitarás configurar las siguientes variables de entorno:

```bash
# Apple Wallet Configuration
APPLE_TEAM_ID="tu-team-id"
APPLE_PASS_TYPE_ID="pass.com.shokupan.loyalty"
APPLE_PASS_CERTIFICATE_PATH="path/to/pass-type-id.p12"
APPLE_PASS_CERTIFICATE_PASSWORD="password-if-any"
APPLE_WEB_SERVICE_CERTIFICATE_PATH="path/to/web-service.p12"
APPLE_WEB_SERVICE_CERTIFICATE_PASSWORD="password-if-any"

# APNs Configuration (opcional)
APPLE_APNS_KEY_ID="tu-apns-key-id"
APPLE_APNS_TEAM_ID="tu-team-id"
APPLE_APNS_KEY_PATH="path/to/apns-key.p8"
```

### Estructura de Archivos

Los certificados deben estar almacenados de manera segura:

```
shokupan/
├── certificates/
│   ├── apple/
│   │   ├── pass-type-id.p12
│   │   ├── web-service.p12
│   │   └── apns-key.p8 (opcional)
│   └── README.md
```

## Implementación Técnica

### 1. Librería PKPass

Para generar archivos `.pkpass`, usaremos la librería `node-passkit`:

```bash
npm install node-passkit
```

### 2. Configuración del Servidor

```typescript
// src/lib/apple-wallet.ts
import { PKPass } from 'node-passkit';

export class AppleWalletService {
  private passKit: PKPass;
  
  constructor() {
    this.passKit = new PKPass({
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID!,
      teamIdentifier: process.env.APPLE_TEAM_ID!,
      organizationName: 'Shokupan',
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID!,
      certificates: {
        wwdr: process.env.APPLE_WWDR_CERTIFICATE_PATH!,
        signerCert: process.env.APPLE_PASS_CERTIFICATE_PATH!,
        signerKey: process.env.APPLE_PASS_CERTIFICATE_PATH!,
        signerKeyPassphrase: process.env.APPLE_PASS_CERTIFICATE_PASSWORD
      }
    });
  }
  
  async generatePass(cardData: any): Promise<Buffer> {
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID!,
      teamIdentifier: process.env.APPLE_TEAM_ID!,
      organizationName: cardData.businessName || 'Shokupan',
      description: `Tarjeta de ${cardData.type} para ${cardData.customerName}`,
      serialNumber: cardData.hash,
      generic: {
        primaryFields: [
          {
            key: 'balance',
            label: cardData.type === 'FIDELITY' ? 'Progreso' : 'Usos',
            value: cardData.type === 'FIDELITY' 
              ? `${cardData.currentUses}/${cardData.totalUses}`
              : `${cardData.remainingUses}/${cardData.initialUses}`
          }
        ],
        secondaryFields: [
          {
            key: 'type',
            label: 'Tipo',
            value: cardData.type === 'FIDELITY' ? 'Fidelidad' : 'Prepago'
          }
        ]
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: cardData.hash,
          messageEncoding: 'iso-8859-1'
        }
      ],
      backgroundColor: cardData.backgroundColor || 'rgb(227, 242, 253)',
      foregroundColor: cardData.foregroundColor || 'rgb(0, 0, 0)',
      labelColor: cardData.labelColor || 'rgb(25, 118, 210)'
    };
    
    return await this.passKit.generate(passData);
  }
}
```

### 3. API Endpoint Actualizado

```typescript
// src/app/api/customers/[id]/cards/[cardId]/pkpass/route.ts
import { AppleWalletService } from '@/lib/apple-wallet';

export async function GET(request: NextRequest) {
  // ... validación de sesión y tarjeta ...
  
  const appleWallet = new AppleWalletService();
  const passBuffer = await appleWallet.generatePass(cardData);
  
  return new Response(passBuffer, {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="shokupan-${card.code}.pkpass"`
    }
  });
}
```

## Próximos Pasos

### 1. Proporcionar Datos
Por favor, proporciona los siguientes datos:

- **Team ID**: Tu Team ID de Apple Developer
- **Pass Type Identifier**: El identificador que creaste
- **Certificados**: Los archivos `.p12` (o sus rutas)
- **Contraseñas**: Si los certificados tienen contraseñas

### 2. Configurar Variables
Una vez que tengas los datos, configuraré las variables de entorno en Vercel.

### 3. Implementar Funcionalidad
Implementaré la funcionalidad completa de Apple Wallet con:
- ✅ Generación de archivos `.pkpass`
- ✅ Personalización con branding del negocio
- ✅ Integración con el sistema de tarjetas
- ✅ Notificaciones push (opcional)

### 4. Pruebas
Realizaremos pruebas completas para asegurar que:
- Los Passbooks se generan correctamente
- Se pueden añadir a Apple Wallet
- La información se actualiza correctamente
- Las notificaciones funcionan (si se implementan)

## Notas Importantes

### Seguridad
- Los certificados deben ser manejados con extrema seguridad
- Nunca commits los certificados al repositorio
- Usa variables de entorno para todas las credenciales

### Compatibilidad
- Los Passbooks funcionan en iOS 6+ y watchOS 2+
- Google Pay en Android tiene soporte limitado
- Considera implementar alternativas para Android

### Limitaciones
- Apple Wallet requiere certificados válidos
- Los Passbooks tienen un tamaño máximo de 500KB
- Las actualizaciones requieren un servidor web válido

## Soporte

Si tienes problemas durante la configuración:
1. **Documentación de Apple**: [developer.apple.com/wallet](https://developer.apple.com/wallet/)
2. **Guías de certificados**: [developer.apple.com/certificates](https://developer.apple.com/certificates/)
3. **Soporte técnico**: [developer.apple.com/contact](https://developer.apple.com/contact/) 