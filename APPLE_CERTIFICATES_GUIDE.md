# Guía para Crear Certificados Apple Wallet - Shokupan

## Datos Actuales
- **Team ID**: `K3GTNQT3FS`
- **Pass Type Identifier**: `pass.com.shokupan.loyalty`
- **Estado**: Certificados pendientes de crear

## Pasos para Crear los Certificados

### Paso 1: Crear Pass Type ID

1. Ve a [developer.apple.com](https://developer.apple.com)
2. Inicia sesión con tu cuenta de desarrollador
3. Ve a **Certificates, Identifiers & Profiles**
4. En la sección **Identifiers**, haz clic en **+**
5. Selecciona **Pass Type ID**
6. Completa la información:
   - **Description**: `Shokupan Loyalty Pass`
   - **Identifier**: `pass.com.shokupan.loyalty`
7. Haz clic en **Continue** y **Register**

### Paso 2: Configurar Pass Type ID

1. Selecciona el Pass Type ID que acabas de crear
2. En **Passes**, marca las casillas:
   - ✅ **Generic Pass**
   - ✅ **Coupon Pass**
   - ✅ **Event Ticket Pass**
   - ✅ **Boarding Pass**
   - ✅ **Store Card Pass**
3. Haz clic en **Save**

### Paso 3: Crear Certificado de Pass Type ID

1. En la sección **Certificates**, haz clic en **+**
2. Selecciona **Pass Type ID Certificate**
3. Selecciona tu Pass Type ID `pass.com.shokupan.loyalty`
4. Haz clic en **Continue**
5. **IMPORTANTE**: Sigue las instrucciones para crear un Certificate Signing Request (CSR):
   - Abre **Keychain Access** en tu Mac
   - Ve a **Keychain Access > Certificate Assistant > Request a Certificate From a Certificate Authority**
   - **User Email**: Tu email
   - **Common Name**: `Shokupan Pass Type ID`
   - **CA Email Address**: Deja vacío
   - **Request is**: Selecciona **Saved to disk**
   - Haz clic en **Continue**
   - Guarda el archivo como `shokupan-pass-type-id.csr`
6. Sube el archivo `.csr` en el portal de Apple
7. Descarga el certificado como `shokupan-pass-type-id.cer`
8. **CONVERTIR A P12**:
   - Abre **Keychain Access**
   - Importa el archivo `shokupan-pass-type-id.cer`
   - Encuentra el certificado en Keychain Access
   - Haz clic derecho > **Export**
   - Selecciona **Personal Information Exchange (.p12)**
   - Guarda como `shokupan-pass-type-id.p12`
   - **IMPORTANTE**: Cuando te pida contraseña, déjala vacía o anota la que uses

### Paso 4: Crear Certificado de Web Service (Opcional)

1. En la sección **Certificates**, haz clic en **+**
2. Selecciona **Web Service Certificate**
3. Sigue las mismas instrucciones del CSR
4. Guarda como `shokupan-web-service.p12`

## Datos Necesarios para Shokupan

Una vez que tengas los certificados, necesitaré:

1. **Archivo P12 del Pass Type ID**: `shokupan-pass-type-id.p12`
2. **Contraseña del P12** (si la pusiste)
3. **Archivo P12 del Web Service** (opcional)
4. **Contraseña del Web Service P12** (si la pusiste)

## Configuración Temporal

Mientras creas los certificados, puedo implementar el sistema con certificados de prueba para que veas cómo funcionará. ¿Quieres que proceda con la implementación básica?

## Próximos Pasos

1. **Crear los certificados** siguiendo la guía arriba
2. **Proporcionar los archivos P12** y contraseñas
3. **Configurar variables de entorno** en Vercel
4. **Implementar sistema completo** de Apple Wallet

## Notas Importantes

- Los certificados tienen una validez de 1 año
- Guarda los archivos P12 en un lugar seguro
- No compartas los certificados públicamente
- Los certificados son específicos para tu Team ID

## Soporte

Si tienes problemas durante la creación:
1. **Documentación oficial**: [developer.apple.com/wallet](https://developer.apple.com/wallet/)
2. **Guía de certificados**: [developer.apple.com/certificates](https://developer.apple.com/certificates/)
3. **Soporte Apple**: [developer.apple.com/contact](https://developer.apple.com/contact/) 