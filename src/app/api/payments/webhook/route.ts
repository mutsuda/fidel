import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const payment = await prisma.payment.findFirst({
    where: { stripeSessionId: session.id }
  });

  if (!payment) {
    console.error('Payment not found for session:', session.id);
    return;
  }

  // Actualizar el pago como completado
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      stripePaymentIntentId: session.payment_intent as string,
    }
  });

  // Si es una suscripción, crear el registro de suscripción
  if (session.mode === 'subscription' && session.subscription) {
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: payment.planId! }
    });

    if (plan) {
      const endDate = plan.duration 
        ? new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000)
        : null;

      await prisma.subscription.create({
        data: {
          userId: payment.userId,
          planId: plan.id,
          status: 'ACTIVE',
          endDate,
          stripeSubscriptionId: session.subscription as string,
        }
      });
    }
  }

  console.log('Payment completed successfully:', payment.id);
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Buscar el pago por el payment intent ID
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id }
  });

  if (payment && payment.status !== 'COMPLETED') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' }
    });
    
    console.log('Payment marked as succeeded:', payment.id);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id }
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' }
    });
    
    console.log('Payment marked as failed:', payment.id);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (dbSubscription) {
    let status: 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAUSED' = 'ACTIVE';
    
    switch (subscription.status) {
      case 'active':
        status = 'ACTIVE';
        break;
      case 'canceled':
        status = 'CANCELED';
        break;
      case 'past_due':
      case 'unpaid':
        status = 'PAUSED';
        break;
      default:
        status = 'EXPIRED';
    }

    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: { status }
    });
    
    console.log('Subscription updated:', dbSubscription.id, status);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (dbSubscription) {
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: { status: 'CANCELED' }
    });
    
    console.log('Subscription canceled:', dbSubscription.id);
  }
}