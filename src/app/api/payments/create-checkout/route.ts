import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { stripe, convertToStripeAmount } from '@/lib/stripe';
import { getPricingPlan } from '@/lib/pricing';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { planId, returnUrl, metadata } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'planId es requerido' },
        { status: 400 }
      );
    }

    // Obtener el plan de precios
    const plan = await getPricingPlan(planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    // Obtener o crear usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Crear o obtener customer en Stripe
    let customerId = user.customerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId: user.id
        }
      });
      
      customerId = customer.id;
      
      // Actualizar usuario con el ID del customer
      await prisma.user.update({
        where: { id: user.id },
        data: { customerId }
      });
    }

    // Configurar los parámetros de la sesión
    const sessionParams: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: {
              name: plan.name,
              description: plan.description || undefined,
            },
            unit_amount: convertToStripeAmount(plan.price, plan.currency as any),
          },
          quantity: 1,
        },
      ],
      mode: plan.type === 'SUBSCRIPTION' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXTAUTH_URL}${returnUrl || '/dashboard'}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/pricing`,
      metadata: {
        planId: plan.id,
        userId: user.id,
        planType: plan.type,
        ...metadata
      }
    };

    // Para suscripciones, configurar la recurrencia
    if (plan.type === 'SUBSCRIPTION' && plan.duration) {
      sessionParams.line_items[0].price_data.recurring = {
        interval: 'day',
        interval_count: plan.duration
      };
    }

    // Crear la sesión de checkout
    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    // Crear registro del pago pendiente
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency,
        status: 'PENDING',
        type: plan.type === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'ONE_TIME',
        stripeSessionId: checkoutSession.id,
        description: `Pago para plan ${plan.name}`,
        metadata: metadata || {}
      }
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      paymentId: payment.id,
      url: checkoutSession.url
    });

  } catch (error) {
    console.error('Error creando checkout session:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}