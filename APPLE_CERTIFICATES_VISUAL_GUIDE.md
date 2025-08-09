# Guía Visual: Certificados Apple Wallet

## 🎯 Resumen Rápido

**Objetivo**: Crear certificados para Apple Wallet (Passbook)
**Tiempo estimado**: 15-20 minutos
**Dificultad**: Intermedia
**Requisitos**: Mac con Keychain Access, cuenta de desarrollador Apple

---

## 📋 Paso 1: Crear Pass Type ID

### 1.1 Acceder al portal
1. Ve a [developer.apple.com](https://developer.apple.com)
2. **Inicia sesión** con tu cuenta
3. Haz clic en **"Certificates, Identifiers & Profiles"**

### 1.2 Crear nuevo identificador
1. En la barra lateral, haz clic en **"Identifiers"**
2. Haz clic en **"+"** (botón azul)
3. Selecciona **"Pass Type ID"**
4. Haz clic en **"Continue"**

### 1.3 Configurar Pass Type ID
```
Description: Shokupan Loyalty Pass
Identifier: pass.com.shokupan.loyalty
```

**IMPORTANTE**: El identifier debe ser exactamente `pass.com.shokupan.loyalty`

### 1.4 Seleccionar tipos de Pass
Marca todas estas casillas:
- ✅ **Generic Pass**
- ✅ **Coupon Pass** 
- ✅ **Event Ticket Pass**
- ✅ **Boarding Pass**
- ✅ **Store Card Pass**

---

## 📋 Paso 2: Crear Certificate Signing Request (CSR)

### 2.1 Abrir Keychain Access
1. En tu Mac, abre **"Keychain Access"** (usando Spotlight o Applications)
2. Ve al menú superior: **"Keychain Access"** → **"Certificate Assistant"** → **"Request a Certificate From a Certificate Authority"**

### 2.2 Llenar formulario CSR
```
User Email Address: [tu-email@ejemplo.com]
Common Name: Shokupan Pass Type ID
CA Email Address: [DEJAR VACÍO]
Request is: Saved to disk
```

### 2.3 Guardar CSR
- **Location**: Desktop (fácil de encontrar)
- **Filename**: `shokupan-pass-type-id.csr`

---

## 📋 Paso 3: Crear certificado en Apple

### 3.1 Ir a Certificates
1. En Apple Developer Portal
2. Barra lateral → **"Certificates"**
3. Haz clic en **"+"**

### 3.2 Seleccionar tipo
1. Selecciona **"Pass Type ID Certificate"**
2. Haz clic en **"Continue"**

### 3.3 Seleccionar Pass Type ID
1. Selecciona: `pass.com.shokupan.loyalty`
2. Haz clic en **"Continue"**

### 3.4 Subir CSR
1. **"Choose File"** → Selecciona `shokupan-pass-type-id.csr`
2. Haz clic en **"Continue"**

### 3.5 Descargar certificado
1. Haz clic en **"Download"**
2. Guarda como: `shokupan-pass-type-id.cer`

---

## 📋 Paso 4: Convertir a P12

### 4.1 Importar certificado
1. Keychain Access → **"File"** → **"Import"**
2. Selecciona `shokupan-pass-type-id.cer`
3. **Keychain**: `login`
4. **Category**: `certificates`

### 4.2 Encontrar certificado
1. En Keychain Access, busca **"Shokupan Pass Type ID"**
2. Haz clic **derecho** → **"Export"**

### 4.3 Exportar como P12
1. **File Format**: `Personal Information Exchange (.p12)`
2. **Save As**: `shokupan-pass-type-id.p12`
3. **Where**: Desktop

### 4.4 Contraseña (IMPORTANTE)
- **Password**: [DEJAR VACÍO] ← **RECOMENDADO**
- **Verify**: [DEJAR VACÍO]
- Haz clic en **"OK"**

---

## 📋 Paso 5: Verificar archivos

### Archivos que deberías tener en Desktop:
```
Desktop/
├── shokupan-pass-type-id.csr
├── shokupan-pass-type-id.cer  
├── shokupan-pass-type-id.p12  ← ESTE ES EL IMPORTANTE
└── shokupan-web-service.p12   ← OPCIONAL
```

---

## 🎯 Información para compartir

Una vez que tengas los archivos, dime:

1. **¿Tienes el archivo**: `shokupan-pass-type-id.p12`?
2. **¿Pusiste contraseña** al archivo P12? (Sí/No)
3. **¿Quieres crear también** el Web Service Certificate? (Sí/No)

---

## 🆘 Problemas comunes

### Error: "Certificate not found"
- **Solución**: Verifica que el CSR se generó correctamente
- **Verificación**: El archivo `.csr` debe estar en Desktop

### Error: "Invalid certificate format"  
- **Solución**: Asegúrate de exportar como P12 (no CER)
- **Verificación**: El archivo debe terminar en `.p12`

### Error: "Keychain access denied"
- **Solución**: Ve a System Preferences → Security & Privacy → Privacy → Keychain Access
- **Verificación**: Tu aplicación debe tener permisos

### Error: "Pass Type ID not found"
- **Solución**: Verifica que creaste el Pass Type ID correcto
- **Verificación**: Debe ser `pass.com.shokupan.loyalty`

---

## ✅ Checklist de verificación

- [ ] Pass Type ID creado: `pass.com.shokupan.loyalty`
- [ ] CSR generado: `shokupan-pass-type-id.csr`
- [ ] Certificado descargado: `shokupan-pass-type-id.cer`
- [ ] P12 exportado: `shokupan-pass-type-id.p12`
- [ ] Contraseña: Vacía o anotada
- [ ] Archivos en Desktop
- [ ] Prueba del sistema funcionando

---

## 🚀 Próximos pasos

1. **Completa** todos los pasos arriba
2. **Verifica** que tienes el archivo P12
3. **Comparte** conmigo la información
4. **Configuraré** las variables en Vercel
5. **Implementaré** el sistema completo

**¡Estaré listo para configurar el sistema completo una vez que tengas el archivo P12!** 🎯 