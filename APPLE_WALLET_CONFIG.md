# Configuración de Apple Wallet - Variables de Entorno

## Variables Requeridas para Vercel

Una vez que tengas los certificados, configura estas variables en Vercel:

### Variables Básicas

```bash
# Apple Wallet Configuration
APPLE_TEAM_ID="K3GTNQT3FS"
APPLE_PASS_TYPE_ID="pass.com.shokupan.loyalty"
```

### Variables de Certificados (Opcionales - Solo cuando tengas los certificados)

```bash
# Certificados de Apple Wallet
APPLE_PASS_CERTIFICATE_PATH="certificates/apple/pass-type-id.p12"
APPLE_PASS_CERTIFICATE_PASSWORD="password-if-any"
APPLE_WEB_SERVICE_CERTIFICATE_PATH="certificates/apple/web-service.p12"
APPLE_WEB_SERVICE_CERTIFICATE_PASSWORD="password-if-any"

# APNs Configuration (Opcional - Para notificaciones push)
APPLE_APNS_KEY_ID="tu-apns-key-id"
APPLE_APNS_TEAM_ID="K3GTNQT3FS"
APPLE_APNS_KEY_PATH="certificates/apple/apns-key.p8"
```

## Configuración Actual

### Datos Configurados
- ✅ **Team ID**: `K3GTNQT3FS`
- ✅ **Pass Type ID**: `pass.com.shokupan.loyalty`
- ⏳ **Certificados**: Pendientes de crear

### Estado del Sistema
- 🟡 **Modo Preview**: El sistema genera estructura JSON sin certificados
- 🟡 **Funcionalidad**: Básica (preview de estructura)
- 🟡 **Archivos**: Se descargan como `.json` temporalmente

## Próximos Pasos

### 1. Crear Certificados
Sigue la guía en `APPLE_CERTIFICATES_GUIDE.md` para crear:
1. Pass Type ID Certificate
2. Web Service Certificate (opcional)

### 2. Configurar Variables
Una vez que tengas los certificados:
1. Ve a Vercel Dashboard
2. Selecciona tu proyecto
3. Ve a Settings → Environment Variables
4. Añade las variables de certificados

### 3. Implementar Certificados
Cuando tengas los certificados:
1. Sube los archivos `.p12` a Vercel
2. Configura las rutas en las variables de entorno
3. Actualiza el servicio de Apple Wallet

## Estructura de Archivos

```
shokupan/
├── certificates/
│   └── apple/
│       ├── pass-type-id.p12 (pendiente)
│       ├── web-service.p12 (opcional)
│       └── apns-key.p8 (opcional)
├── src/
│   └── lib/
│       └── apple-wallet.ts (implementado)
└── README.md
```

## Funcionalidad Actual

### ✅ Implementado
- Estructura PKPass JSON
- Integración con perfil de negocio
- Colores personalizados
- Información de tarjeta
- Códigos de barras QR
- Descarga de archivos

### ⏳ Pendiente
- Certificados de Apple
- Archivos .pkpass válidos
- Notificaciones push
- Actualizaciones automáticas

## Testing

### Endpoints Disponibles
1. **Preview**: `GET /api/customers/[id]/cards/[cardId]/pkpass`
   - Devuelve estructura JSON del Passbook
2. **Download**: `GET /api/customers/[id]/cards/[cardId]/pkpass/download`
   - Descarga archivo JSON (futuro: .pkpass)

### Pruebas Recomendadas
1. Crear una tarjeta de cliente
2. Ir a la página de la tarjeta
3. Hacer clic en "Descargar Apple Wallet"
4. Revisar el archivo JSON generado

## Notas Importantes

- Los certificados tienen validez de 1 año
- Los archivos P12 deben ser manejados con seguridad
- Nunca commits los certificados al repositorio
- Usa variables de entorno para todas las credenciales 