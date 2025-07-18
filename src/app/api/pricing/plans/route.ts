import { NextResponse } from 'next/server';
import { getActivePricingPlans, initializeDefaultPlans } from '@/lib/pricing';

export async function GET() {
  try {
    // Inicializar planes por defecto si no existen
    await initializeDefaultPlans();
    
    // Obtener todos los planes activos
    const plans = await getActivePricingPlans();
    
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}