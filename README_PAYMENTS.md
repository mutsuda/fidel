# 💳 Sistema de Pagos para Fidel

Esta documentación explica cómo configurar y usar el sistema de pagos integrado en tu aplicación Fidel. El sistema te permite cobrar por diferentes planes de precios de forma flexible, sin tener que definir los precios en el código.

## ✨ Características Principales

- 🎯 **Precios Dinámicos**: Configura precios desde el panel de administración
- 💳 **Múltiples Formas de Pago**: Tarjetas de crédito/débito vía Stripe
- 🔄 **Suscripciones y Pagos Únicos**: Soporte para ambos modelos
- 📊 **Control de Límites**: Gestión automática de límites por plan
- 🎨 **UI Moderna**: Interfaz de usuario limpia y responsiva
- 🔐 **Seguro**: Procesamiento PCI-compliant con Stripe
- 🌍 **Multi-moneda**: Soporte para EUR, USD, GBP, MXN

## 🛠️ Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env.local` basado en `.env.example`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."  # Tu clave secreta de Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."  # Tu clave pública de Stripe
STRIPE_WEBHOOK_SECRET="whsec_..."  # Secret del webhook de Stripe

# Base de datos (si no la tienes ya)
DATABASE_URL="postgresql://username:password@localhost:5432/fidel_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 2. Configuración de Stripe

1. **Crear cuenta en Stripe**: Ve a [stripe.com](https://stripe.com) y crea una cuenta
2. **Obtener claves API**: En el dashboard de Stripe, ve a Developers > API keys
3. **Configurar webhook**: 
   - Ve a Developers > Webhooks
   - Añade endpoint: `https://tu-dominio.com/api/payments/webhook`
   - Selecciona eventos:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

### 3. Migración de Base de Datos

Ejecuta la migración para añadir las tablas de pagos:

```bash
npx prisma migrate dev --name add-payment-system
```

### 4. Inicializar Datos

Al acceder por primera vez a `/api/pricing/plans`, se crearán automáticamente los planes por defecto:

- **Gratis**: 0€ - Hasta 10 tarjetas, 1 plantilla
- **Básico**: 29.99€ - Hasta 100 tarjetas, 5 plantillas
- **Pro**: 99.99€ - Hasta 1000 tarjetas, plantillas ilimitadas
- **Empresa**: 199.99€/mes - Todo ilimitado

## 📝 Uso del Sistema

### Para Usuarios Finales

1. **Ver Planes**: Accede a `/dashboard/pricing` para ver todos los planes disponibles
2. **Seleccionar Plan**: Haz clic en "Seleccionar Plan" para iniciar el pago
3. **Pagar**: Serás redirigido a Stripe Checkout para completar el pago
4. **Confirmación**: Regresarás a `/dashboard/pricing/success` tras el pago exitoso

### Para Administradores

1. **Gestionar Planes**: Accede a `/dashboard/admin/pricing` (requiere permisos de admin)
2. **Crear/Editar Planes**: Usa el formulario para añadir o modificar planes
3. **Configurar Límites**: Define cuántos lotes y tarjetas puede crear cada plan
4. **Activar/Desactivar**: Controla qué planes están disponibles para los usuarios

## 🏗️ Estructura del Código

### Modelos de Base de Datos

```typescript
// Planes de precios
model PricingPlan {
  id          String   @id @default(cuid())
  name        String   // ej: "Pro"
  description String?
  type        PlanType // SUBSCRIPTION o ONE_TIME
  price       Float    // Precio en la moneda especificada
  currency    String   @default("EUR")
  features    Json     // Array de características
  maxBatches  Int?     // null = ilimitado
  maxCards    Int?     // null = ilimitado
  duration    Int?     // días (para suscripciones)
  active      Boolean  @default(true)
}

// Suscripciones de usuarios
model Subscription {
  id       String    @id @default(cuid())
  userId   String
  planId   String
  status   SubStatus @default(ACTIVE)
  startDate DateTime @default(now())
  endDate   DateTime?
}

// Historial de pagos
model Payment {
  id       String      @id @default(cuid())
  userId   String
  planId   String?
  amount   Float
  currency String      @default("EUR")
  status   PayStatus   @default(PENDING)
  type     PaymentType
}
```

### APIs Principales

- `GET /api/pricing/plans` - Obtener planes disponibles
- `POST /api/payments/create-checkout` - Crear sesión de pago
- `POST /api/payments/webhook` - Webhook de Stripe
- `GET /api/user/limits` - Obtener límites del usuario

### Páginas Principales

- `/dashboard/pricing` - Página de planes para usuarios
- `/dashboard/pricing/success` - Página de confirmación de pago
- `/dashboard/admin/pricing` - Administración de planes

## 🔧 Personalización

### Añadir Nuevos Planes

```javascript
// En /dashboard/admin/pricing, haz clic en "Nuevo Plan" y configura:
{
  name: "Mi Plan Custom",
  description: "Descripción del plan",
  type: "ONE_TIME", // o "SUBSCRIPTION"
  price: 49.99,
  currency: "EUR",
  features: [
    "Característica 1",
    "Característica 2",
    "Característica 3"
  ],
  maxBatches: 10, // null para ilimitado
  maxCards: 500,  // null para ilimitado
  duration: null  // días (solo para suscripciones)
}
```

### Modificar Límites Existentes

Usa la función `checkUserLimits()` en `src/lib/pricing.ts`:

```typescript
const limits = await checkUserLimits(userId, newBatchCards);
// limits.canCreateBatch - ¿Puede crear más lotes?
// limits.canCreateCards - ¿Puede crear más tarjetas?
// limits.currentBatches - Lotes actuales
// limits.currentCards - Tarjetas actuales
```

### Integrar con Creación de Lotes

```typescript
// En tu página de creación de lotes
const limits = await checkUserLimits(userId, quantity);

if (!limits.canCreateCards) {
  // Mostrar mensaje para actualizar plan
  router.push('/dashboard/pricing');
  return;
}

// Continuar con la creación...
```

## 🎨 Personalización de UI

### Cambiar Colores de Planes

En `src/app/dashboard/pricing/page.tsx`:

```typescript
const getPlanIcon = (planName: string) => {
  switch (planName.toLowerCase()) {
    case 'premium':
      return <Crown className="w-8 h-8 text-gold-600" />;
    // Añadir más casos...
  }
};
```

### Modificar Características Mostradas

```typescript
// Editar el array de features en DEFAULT_PRICING_PLANS
features: [
  'Tu característica personalizada',
  'Otra característica',
  // ...
]
```

## 🔒 Seguridad

- ✅ Las claves de Stripe se almacenan como variables de entorno
- ✅ Los webhooks están verificados con firmas
- ✅ Los pagos se procesan de forma segura por Stripe
- ✅ Los límites se verifican en el servidor antes de crear recursos

## 🐛 Troubleshooting

### Error: "STRIPE_SECRET_KEY is not set"
- Asegúrate de que las variables de entorno están configuradas
- Verifica que el archivo `.env.local` esté en la raíz del proyecto

### Error: "Webhook signature verification failed"
- Verifica que `STRIPE_WEBHOOK_SECRET` esté correctamente configurado
- Asegúrate de que el endpoint del webhook apunte a `/api/payments/webhook`

### Los límites no se actualizan
- Verifica que el webhook esté funcionando correctamente
- Comprueba los logs del servidor para errores de procesamiento

### Pagos en modo de prueba
- Usa tarjetas de prueba de Stripe: `4242 4242 4242 4242`
- Fecha: cualquier fecha futura
- CVC: cualquier número de 3 dígitos

## 📞 Soporte

Si necesitas ayuda:

1. Revisa los logs del servidor para errores específicos
2. Verifica la configuración de Stripe en su dashboard
3. Asegúrate de que todas las variables de entorno estén configuradas
4. Consulta la [documentación oficial de Stripe](https://stripe.com/docs)

## 🚀 Próximos Pasos

- [ ] Añadir más pasarelas de pago (PayPal, etc.)
- [ ] Implementar descuentos y cupones
- [ ] Añadir facturación automática
- [ ] Integrar con sistemas de analytics
- [ ] Añadir notificaciones por email

---

**¡Tu sistema de pagos está listo! 🎉**

Los usuarios ahora pueden elegir planes, pagar de forma segura, y el sistema gestionará automáticamente sus límites y acceso a funcionalidades.