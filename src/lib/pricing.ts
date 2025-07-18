import { PrismaClient, PricingPlan, PlanType } from '@prisma/client';

const prisma = new PrismaClient();

// Planes predefinidos (puedes editarlos desde el admin)
export const DEFAULT_PRICING_PLANS = [
  {
    name: 'Gratis',
    description: 'Perfecto para probar el sistema',
    type: 'ONE_TIME' as PlanType,
    price: 0,
    currency: 'EUR',
    features: [
      'Hasta 10 tarjetas',
      '1 plantilla',
      'Validación básica de QR',
      'Soporte por email'
    ],
    maxBatches: 1,
    maxCards: 10,
    duration: null,
    active: true,
  },
  {
    name: 'Básico',
    description: 'Ideal para pequeños eventos',
    type: 'ONE_TIME' as PlanType,
    price: 29.99,
    currency: 'EUR',
    features: [
      'Hasta 100 tarjetas',
      '5 plantillas',
      'Estadísticas básicas',
      'Validación de QR avanzada',
      'Soporte prioritario'
    ],
    maxBatches: 5,
    maxCards: 100,
    duration: null,
    active: true,
  },
  {
    name: 'Pro',
    description: 'Para empresas y eventos grandes',
    type: 'ONE_TIME' as PlanType,
    price: 99.99,
    currency: 'EUR',
    features: [
      'Hasta 1000 tarjetas',
      'Plantillas ilimitadas',
      'Estadísticas avanzadas',
      'API access',
      'Personalización de marca',
      'Soporte telefónico'
    ],
    maxBatches: null, // Ilimitado
    maxCards: 1000,
    duration: null,
    active: true,
  },
  {
    name: 'Empresa',
    description: 'Solución completa para grandes organizaciones',
    type: 'SUBSCRIPTION' as PlanType,
    price: 199.99,
    currency: 'EUR',
    features: [
      'Tarjetas ilimitadas',
      'Plantillas ilimitadas',
      'Dashboard de analytics',
      'API completa',
      'White-label',
      'Soporte dedicado 24/7',
      'Integración personalizada'
    ],
    maxBatches: null,
    maxCards: null,
    duration: 30, // 30 días
    active: true,
  }
];

// Obtener todos los planes activos
export async function getActivePricingPlans(): Promise<PricingPlan[]> {
  return await prisma.pricingPlan.findMany({
    where: { active: true },
    orderBy: { price: 'asc' }
  });
}

// Obtener plan por ID
export async function getPricingPlan(id: string): Promise<PricingPlan | null> {
  return await prisma.pricingPlan.findUnique({
    where: { id }
  });
}

// Crear planes por defecto si no existen
export async function initializeDefaultPlans(): Promise<void> {
  const existingPlans = await prisma.pricingPlan.count();
  
  if (existingPlans === 0) {
    console.log('Creando planes de precios por defecto...');
    
    for (const plan of DEFAULT_PRICING_PLANS) {
      await prisma.pricingPlan.create({
        data: plan
      });
    }
    
    console.log('Planes de precios creados exitosamente');
  }
}

// Verificar límites del usuario
export async function checkUserLimits(userId: string, newBatchCards: number = 0): Promise<{
  canCreateBatch: boolean;
  canCreateCards: boolean;
  currentBatches: number;
  currentCards: number;
  maxBatches: number | null;
  maxCards: number | null;
  activePlan: PricingPlan | null;
}> {
  // Obtener suscripción activa del usuario
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } }
      ]
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' }
  });

  // Si no tiene suscripción, usar plan gratuito
  let activePlan = activeSubscription?.plan;
  if (!activePlan) {
    activePlan = await prisma.pricingPlan.findFirst({
      where: { name: 'Gratis', active: true }
    });
  }

  // Contar recursos actuales del usuario
  const currentBatches = await prisma.batch.count({
    where: { userId }
  });

  const currentCards = await prisma.code.count({
    where: { batch: { userId } }
  });

  const maxBatches = activePlan?.maxBatches;
  const maxCards = activePlan?.maxCards;

  return {
    canCreateBatch: maxBatches === null || currentBatches < maxBatches,
    canCreateCards: maxCards === null || (currentCards + newBatchCards) <= maxCards,
    currentBatches,
    currentCards,
    maxBatches,
    maxCards,
    activePlan
  };
}

// Obtener precios sugeridos por número de tarjetas
export function getSuggestedPricing(cardCount: number): { 
  recommended: PricingPlan | null;
  alternatives: PricingPlan[];
} {
  // Esta es una lógica básica, puedes hacerla más sofisticada
  let recommended = null;
  const alternatives = [];

  if (cardCount <= 10) {
    recommended = DEFAULT_PRICING_PLANS.find(p => p.name === 'Gratis') || null;
    alternatives.push(...DEFAULT_PRICING_PLANS.filter(p => p.name !== 'Gratis'));
  } else if (cardCount <= 100) {
    recommended = DEFAULT_PRICING_PLANS.find(p => p.name === 'Básico') || null;
    alternatives.push(...DEFAULT_PRICING_PLANS.filter(p => p.name !== 'Básico'));
  } else if (cardCount <= 1000) {
    recommended = DEFAULT_PRICING_PLANS.find(p => p.name === 'Pro') || null;
    alternatives.push(...DEFAULT_PRICING_PLANS.filter(p => p.name !== 'Pro'));
  } else {
    recommended = DEFAULT_PRICING_PLANS.find(p => p.name === 'Empresa') || null;
    alternatives.push(...DEFAULT_PRICING_PLANS.filter(p => p.name !== 'Empresa'));
  }

  return { recommended, alternatives };
}