import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export const getStripeJs = async () => {
  const { loadStripe } = await import('@stripe/stripe-js');
  
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
  }
  
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
};

// Configuración de monedas soportadas
export const SUPPORTED_CURRENCIES = {
  EUR: { symbol: '€', name: 'Euro' },
  USD: { symbol: '$', name: 'US Dollar' },
  GBP: { symbol: '£', name: 'British Pound' },
  MXN: { symbol: '$', name: 'Mexican Peso' },
} as const;

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES;

// Utilidades para formatear precios
export const formatPrice = (amount: number, currency: SupportedCurrency = 'EUR'): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Convertir precio a centavos para Stripe
export const convertToStripeAmount = (amount: number, currency: SupportedCurrency = 'EUR'): number => {
  // Stripe maneja la mayoría de las monedas en centavos
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'CLP', 'VND'];
  
  if (zeroDecimalCurrencies.includes(currency)) {
    return Math.round(amount);
  }
  
  return Math.round(amount * 100);
};

// Convertir de centavos de Stripe a precio normal
export const convertFromStripeAmount = (amount: number, currency: SupportedCurrency = 'EUR'): number => {
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'CLP', 'VND'];
  
  if (zeroDecimalCurrencies.includes(currency)) {
    return amount;
  }
  
  return amount / 100;
};