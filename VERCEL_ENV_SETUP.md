# Configuración de Variables de Entorno en Vercel

## Variables de Entorno Requeridas

Para que el sistema de email funcione correctamente en producción, necesitas configurar las siguientes variables de entorno en Vercel:

### 1. RESEND_API_KEY

**Descripción:** API key de Resend para envío de emails  
**Valor:** `re_18JRkuZi_Dg8q2ReaGpsZ8rZ1hq8B4Fwk`  
**Tipo:** Secret

## Pasos para Configurar en Vercel

### Paso 1: Acceder al Dashboard de Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto `fidel`

### Paso 2: Ir a la Sección de Variables de Entorno

1. En el dashboard del proyecto, ve a **"Settings"**
2. Busca **"Environment Variables"** en el menú lateral
3. Haz clic en **"Environment Variables"**

### Paso 3: Añadir la Variable RESEND_API_KEY

1. **Nombre:** `RESEND_API_KEY`
2. **Valor:** `re_18JRkuZi_Dg8q2ReaGpsZ8rZ1hq8B4Fwk`
3. **Environment:** Selecciona todas las opciones:
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**
4. **Tipo:** `Secret` (recomendado)
5. Haz clic en **"Add"**

### Paso 4: Verificar la Configuración

1. **Revisa que la variable esté añadida** en la lista
2. **Verifica que esté marcada** para todos los entornos
3. **Confirma que el tipo sea "Secret"**

### Paso 5: Redeploy

1. Ve a **"Deployments"**
2. Encuentra el último deployment
3. Haz clic en **"Redeploy"** (tres puntos → Redeploy)

## Verificación

### 1. Verificar en el Dashboard

Después del redeploy, puedes verificar que la variable esté configurada:

1. Ve a **"Functions"** en el dashboard
2. Busca una función que use `process.env.RESEND_API_KEY`
3. Revisa los logs para confirmar que la variable se está cargando

### 2. Verificar con el Endpoint de Prueba

Una vez configurado, puedes probar el sistema:

```bash
# Verificar configuración
curl -X GET "https://tu-dominio.vercel.app/api/email/test" \
  -H "Content-Type: application/json"

# Enviar email de prueba
curl -X POST "https://tu-dominio.vercel.app/api/email/test" \
  -H "Content-Type: application/json" \
  -d '{"testType": "test"}'
```

## Troubleshooting

### Error: "RESEND_API_KEY no está configurado"

**Síntomas:**
- Error en logs: `RESEND_API_KEY no encontrada en variables de entorno`
- Emails no se envían
- Error 500 en endpoints de email

**Solución:**
1. Verifica que la variable esté añadida en Vercel
2. Confirma que esté marcada para todos los entornos
3. Haz redeploy del proyecto
4. Revisa los logs después del redeploy

### Error: "Missing credentials for PLAIN"

**Síntomas:**
- Error de autenticación SMTP
- Sistema intentando usar nodemailer en lugar de Resend

**Solución:**
1. Asegúrate de que `RESEND_API_KEY` esté configurada
2. Verifica que el valor sea correcto
3. Haz redeploy del proyecto

### Error: "Domain not verified"

**Síntomas:**
- Error al enviar emails con dominio personalizado
- Emails no llegan a destino

**Solución:**
1. Verifica la configuración DNS en Hover
2. Confirma que el dominio `mail.shokupan.es` esté verificado en Resend
3. Espera la propagación DNS (5-10 minutos)

## Variables Opcionales

### SMTP Configuration (Fallback)

Si quieres configurar SMTP como fallback (no recomendado):

```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=tu-api-key
```

**Nota:** Estas variables solo son necesarias si quieres usar SMTP como fallback. Con Resend configurado correctamente, no son necesarias.

## Seguridad

### Buenas Prácticas

1. **Nunca commits las API keys** en el código
2. **Usa variables de entorno** para todas las credenciales
3. **Marca las variables como "Secret"** en Vercel
4. **Revisa regularmente** las variables configuradas
5. **Rota las API keys** periódicamente

### Acceso a Variables

- **Solo administradores** pueden ver/modificar variables de entorno
- **Variables secretas** no se muestran en los logs
- **Variables públicas** se pueden ver en el código

## Soporte

Si tienes problemas:

1. **Documentación de Vercel:** [vercel.com/docs](https://vercel.com/docs)
2. **Soporte de Vercel:** [vercel.com/support](https://vercel.com/support)
3. **Documentación de Resend:** [resend.com/docs](https://resend.com/docs)

## Próximos Pasos

1. **Configura la variable** `RESEND_API_KEY` en Vercel
2. **Haz redeploy** del proyecto
3. **Verifica la configuración** con el endpoint de prueba
4. **Prueba el envío** de emails desde la interfaz web
5. **Monitorea los logs** para confirmar funcionamiento 