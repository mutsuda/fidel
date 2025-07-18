"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PricingPlan } from '@prisma/client';
import { formatPrice } from '@/lib/stripe';
import { CreditCard, Check, Star, Users, Zap, Shield } from 'lucide-react';

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/pricing/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (processingPayment) return;
    
    setProcessingPayment(true);
    setSelectedPlan(planId);

    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          returnUrl: '/dashboard/pricing/success',
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        throw new Error('Error creando sesión de pago');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error procesando el pago. Inténtalo de nuevo.');
    } finally {
      setProcessingPayment(false);
      setSelectedPlan(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'gratis':
        return <Users className="w-8 h-8 text-green-600" />;
      case 'básico':
        return <Zap className="w-8 h-8 text-blue-600" />;
      case 'pro':
        return <Star className="w-8 h-8 text-purple-600" />;
      case 'empresa':
        return <Shield className="w-8 h-8 text-orange-600" />;
      default:
        return <CreditCard className="w-8 h-8 text-gray-600" />;
    }
  };

  const getPlanBadge = (planName: string) => {
    if (planName.toLowerCase() === 'pro') {
      return (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Más Popular
          </span>
        </div>
      );
    }
    return null;
  };

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p>Cargando planes...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Elige tu Plan Perfecto
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Selecciona el plan que mejor se adapte a tus necesidades. Puedes cambiar o cancelar en cualquier momento.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`relative bg-white rounded-2xl shadow-lg border-2 ${
                plan.name.toLowerCase() === 'pro' 
                  ? 'border-purple-200 ring-2 ring-purple-100' 
                  : 'border-gray-200'
              } p-8 transition-all duration-300 hover:shadow-xl`}
            >
              {getPlanBadge(plan.name)}
              
              <div className="text-center mb-8">
                <div className="mb-4 flex justify-center">
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(plan.price, plan.currency as any)}
                  </span>
                  {plan.type === 'SUBSCRIPTION' && plan.duration && (
                    <span className="text-gray-600 ml-1">
                      /{plan.duration} días
                    </span>
                  )}
                  {plan.type === 'ONE_TIME' && plan.price > 0 && (
                    <span className="text-gray-600 ml-1">
                      /pago único
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {(plan.features as string[]).map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => plan.price > 0 ? handleSelectPlan(plan.id) : null}
                disabled={processingPayment || (plan.price === 0)}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  plan.price === 0
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : plan.name.toLowerCase() === 'pro'
                    ? 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                }`}
              >
                {processingPayment && selectedPlan === plan.id ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </div>
                ) : plan.price === 0 ? (
                  'Plan Actual'
                ) : (
                  `Seleccionar ${plan.name}`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Preguntas Frecuentes
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Puedo cambiar de plan más tarde?
              </h3>
              <p className="text-gray-600">
                Sí, puedes actualizar o degradar tu plan en cualquier momento desde tu dashboard.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Qué métodos de pago aceptan?
              </h3>
              <p className="text-gray-600">
                Aceptamos todas las tarjetas de crédito y débito principales procesadas de forma segura por Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Hay límites en el plan gratuito?
              </h3>
              <p className="text-gray-600">
                El plan gratuito incluye hasta 10 tarjetas y 1 plantilla, perfecto para probar el sistema.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Ofrecen soporte técnico?
              </h3>
              <p className="text-gray-600">
                Sí, todos los planes incluyen soporte. Los planes superiores tienen soporte prioritario y telefónico.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}