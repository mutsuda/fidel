# Guía Paso a Paso: Generar Certificados Apple Wallet

## 📋 Datos Necesarios
- **Team ID**: `K3GTNQT3FS` ✅
- **Pass Type ID**: `pass.com.shokupan.loyalty` (crear ahora)
- **Certificados**: Pass Type ID Certificate y Web Service Certificate

## 🎯 Paso 1: Crear Pass Type ID

### 1.1 Acceder a Apple Developer Portal
1. Ve a [developer.apple.com](https://developer.apple.com)
2. **Inicia sesión** con tu cuenta de desarrollador
3. Haz clic en **"Certificates, Identifiers & Profiles"**

### 1.2 Crear el Pass Type ID
1. En la barra lateral izquierda, haz clic en **"Identifiers"**
2. Haz clic en el botón **"+"** (nuevo identificador)
3. Selecciona **"Pass Type ID"**
4. Haz clic en **"Continue"**

### 1.3 Configurar el Pass Type ID
1. **Description**: `Shokupan Loyalty Pass`
2. **Identifier**: `pass.com.shokupan.loyalty`
3. Haz clic en **"Continue"**
4. Revisa la información y haz clic en **"Register"**

### 1.4 Configurar tipos de Pass
1. Busca y selecciona el Pass Type ID que acabas de crear
2. En la sección **"Passes"**, marca estas casillas:
   - ✅ **Generic Pass**
   - ✅ **Coupon Pass**
   - ✅ **Event Ticket Pass**
   - ✅ **Boarding Pass**
   - ✅ **Store Card Pass**
3. Haz clic en **"Save"**

---

## 🎯 Paso 2: Crear Certificate Signing Request (CSR)

### 2.1 Abrir Keychain Access
1. En tu Mac, abre **"Keychain Access"**
2. Ve al menú **"Keychain Access"** → **"Certificate Assistant"** → **"Request a Certificate From a Certificate Authority"**

### 2.2 Configurar Certificate Request
1. **User Email Address**: Tu email de desarrollador
2. **Common Name**: `Shokupan Pass Type ID`
3. **CA Email Address**: **DEJA VACÍO**
4. **Request is**: Selecciona **"Saved to disk"**
5. Haz clic en **"Continue"**

### 2.3 Guardar el CSR
1. **Choose a location**: Desktop o una carpeta fácil de encontrar
2. **Save As**: `shokupan-pass-type-id.csr`
3. Haz clic en **"Save"**
4. Haz clic en **"Done"**

---

## 🎯 Paso 3: Crear Pass Type ID Certificate

### 3.1 Ir a Certificates
1. En Apple Developer Portal, ve a **"Certificates, Identifiers & Profiles"**
2. En la barra lateral, haz clic en **"Certificates"**
3. Haz clic en el botón **"+"** (nuevo certificado)

### 3.2 Seleccionar tipo de certificado
1. Selecciona **"Pass Type ID Certificate"**
2. Haz clic en **"Continue"**

### 3.3 Seleccionar Pass Type ID
1. Selecciona el Pass Type ID: `pass.com.shokupan.loyalty`
2. Haz clic en **"Continue"**

### 3.4 Subir CSR
1. Haz clic en **"Choose File"**
2. Selecciona el archivo `shokupan-pass-type-id.csr` que creaste
3. Haz clic en **"Continue"**

### 3.5 Descargar certificado
1. Haz clic en **"Download"**
2. Guarda el archivo como `shokupan-pass-type-id.cer`

---

## 🎯 Paso 4: Convertir certificado a P12

### 4.1 Importar certificado a Keychain
1. En **Keychain Access**, ve a **"File"** → **"Import"**
2. Selecciona el archivo `shokupan-pass-type-id.cer`
3. **Keychain**: `login`
4. **Category**: `certificates`
5. Haz clic en **"Import"**

### 4.2 Encontrar el certificado
1. En Keychain Access, busca **"Shokupan Pass Type ID"**
2. Haz clic **derecho** en el certificado
3. Selecciona **"Export"**

### 4.3 Exportar como P12
1. **File Format**: Selecciona **"Personal Information Exchange (.p12)"**
2. Haz clic en **"Save"**
3. **Save As**: `shokupan-pass-type-id.p12`
4. **Where**: Desktop o carpeta fácil de encontrar

### 4.4 Configurar contraseña (IMPORTANTE)
1. **Password**: **DEJA VACÍO** (recomendado) o anota la contraseña
2. **Verify**: Confirma la contraseña
3. Haz clic en **"OK"**
4. **Keychain Password**: Tu contraseña de Mac (si es necesario)
5. Haz clic en **"OK"**

---

## 🎯 Paso 5: Crear Web Service Certificate (Opcional)

### 5.1 Repetir proceso para Web Service
1. Sigue los **Pasos 2-4** pero para Web Service Certificate
2. **Common Name**: `Shokupan Web Service`
3. **File names**: `shokupan-web-service.csr`, `shokupan-web-service.cer`, `shokupan-web-service.p12`

---

## 🎯 Paso 6: Verificar archivos

### 6.1 Archivos que deberías tener
```
Desktop/
├── shokupan-pass-type-id.csr
├── shokupan-pass-type-id.cer
├── shokupan-pass-type-id.p12
├── shokupan-web-service.csr (opcional)
├── shokupan-web-service.cer (opcional)
└── shokupan-web-service.p12 (opcional)
```

### 6.2 Información para compartir
Una vez que tengas los archivos, necesitaré:
1. **Archivo P12 principal**: `shokupan-pass-type-id.p12`
2. **Contraseña**: (si la pusiste)
3. **Archivo P12 web service**: `shokupan-web-service.p12` (opcional)
4. **Contraseña web service**: (si la pusiste)

---

## 🎯 Paso 7: Probar el sistema

### 7.1 Verificar estructura
1. Ve a tu aplicación Shokupan
2. Crea una tarjeta de cliente
3. Ve a la página de la tarjeta
4. Haz clic en **"Descargar Apple Wallet"**
5. Revisa el archivo JSON generado

### 7.2 Verificar contenido
El archivo JSON debería contener:
- ✅ Team ID: `K3GTNQT3FS`
- ✅ Pass Type ID: `pass.com.shokupan.loyalty`
- ✅ Información del cliente
- ✅ Información de la tarjeta
- ✅ Colores y branding

---

## 🆘 Troubleshooting

### Problemas comunes:

#### Error: "Certificate not found"
- Verifica que el CSR se generó correctamente
- Asegúrate de haber seleccionado el Pass Type ID correcto

#### Error: "Invalid certificate format"
- Asegúrate de exportar como P12
- Verifica que la contraseña esté correcta

#### Error: "Keychain access denied"
- Ve a **System Preferences** → **Security & Privacy** → **Privacy** → **Keychain Access**
- Asegúrate de que tu aplicación tenga permisos

### Contacto de soporte:
- **Apple Developer Support**: [developer.apple.com/contact](https://developer.apple.com/contact)
- **Documentación oficial**: [developer.apple.com/wallet](https://developer.apple.com/wallet)

---

## ✅ Checklist final

- [ ] Pass Type ID creado: `pass.com.shokupan.loyalty`
- [ ] CSR generado: `shokupan-pass-type-id.csr`
- [ ] Certificado descargado: `shokupan-pass-type-id.cer`
- [ ] P12 exportado: `shokupan-pass-type-id.p12`
- [ ] Contraseña anotada (si la pusiste)
- [ ] Web Service Certificate (opcional)
- [ ] Archivos respaldados en lugar seguro

**¡Una vez que tengas estos archivos, estaré listo para configurar el sistema completo de Apple Wallet!** 🎯 