# Configuración DNS en Hover para mail.shokupan.es

## Registros DNS necesarios para Resend

Para que el dominio `mail.shokupan.es` funcione correctamente con Resend, necesitas configurar los siguientes registros DNS en Hover:

### 1. Registro A para el subdominio

**Tipo:** `A`  
**Nombre:** `mail`  
**Valor:** `76.76.19.36`  
**TTL:** `3600`

### 2. Registro TXT para SPF

**Tipo:** `TXT`  
**Nombre:** `mail`  
**Valor:** `v=spf1 include:_spf.resend.com ~all`  
**TTL:** `3600`

### 3. Registro CNAME para verificación (opcional)

**Tipo:** `CNAME`  
**Nombre:** `mail`  
**Valor:** `mail.shokupan.es.cname.verification-dns.resend.com`  
**TTL:** `3600`

## Pasos detallados en Hover

### Paso 1: Acceder al panel de control
1. Ve a [hover.com](https://hover.com)
2. Inicia sesión con tu cuenta
3. Selecciona el dominio `shokupan.es`

### Paso 2: Ir a la sección DNS
1. En el panel de control, busca "DNS" o "DNS Records"
2. Haz clic en "Manage DNS" o "Gestionar DNS"

### Paso 3: Añadir registros
1. **Busca "Add Record" o "Añadir registro"**
2. **Añade cada registro uno por uno:**

#### Registro A:
- **Tipo:** `A`
- **Hostname:** `mail`
- **Value:** `76.76.19.36`
- **TTL:** `3600`

#### Registro TXT:
- **Tipo:** `TXT`
- **Hostname:** `mail`
- **Value:** `v=spf1 include:_spf.resend.com ~all`
- **TTL:** `3600`

### Paso 4: Verificar configuración
1. **Espera 5-10 minutos** para que los cambios se propaguen
2. **Verifica en Resend:**
   - Ve a [resend.com/domains](https://resend.com/domains)
   - Busca tu dominio `mail.shokupan.es`
   - Debería mostrar "Verified" o "Active"

## Verificación

### Comando para verificar:
```bash
# Verificar registro A
dig mail.shokupan.es A

# Verificar registro TXT
dig mail.shokupan.es TXT
```

### Resultados esperados:
- **A record:** `76.76.19.36`
- **TXT record:** `v=spf1 include:_spf.resend.com ~all`

## Troubleshooting

### Error: "Domain not verified"
1. **Verifica los registros DNS** - Asegúrate de que todos los registros estén correctos
2. **Espera propagación** - Los cambios pueden tardar hasta 24 horas
3. **Contacta soporte** - Si persiste el problema

### Error: "DNS propagation"
1. **Usa herramientas online** - [whatsmydns.net](https://whatsmydns.net)
2. **Verifica desde diferentes ubicaciones**
3. **Limpia caché DNS** - `nslookup mail.shokupan.es`

## Notas importantes

- **TTL:** Usa 3600 (1 hora) para cambios rápidos
- **Propagación:** Los cambios pueden tardar 5-10 minutos
- **Verificación:** Resend verificará automáticamente el dominio
- **Backup:** Guarda una copia de la configuración actual

## Soporte

Si tienes problemas:
1. **Documentación de Resend:** [resend.com/docs](https://resend.com/docs)
2. **Soporte de Hover:** [hover.com/support](https://hover.com/support)
3. **Verificación DNS:** [whatsmydns.net](https://whatsmydns.net) 