"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight, CreditCard } from 'lucide-react';

export default function PaymentSuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      // Aquí podrías verificar el estado del pago con tu API
      // Por ahora simplemente mostramos el éxito
      setTimeout(() => {
        setPaymentDetails({
          sessionId,
          success: true
        });
        setLoading(false);
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p>Verificando pago...</p>
        </div>
      </main>
    );
  }

  if (!session || !paymentDetails) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Error verificando el pago</p>
          <Link 
            href="/dashboard" 
            className="text-blue-600 hover:text-blue-800 mt-4 inline-block"
          >
            Volver al Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Pago Exitoso!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Tu pago ha sido procesado correctamente. Ya puedes disfrutar de las nuevas funcionalidades de tu plan.
          </p>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center mb-2">
              <CreditCard className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">ID de Transacción</span>
            </div>
            <code className="text-xs text-gray-800 font-mono">
              {paymentDetails.sessionId.substring(0, 24)}...
            </code>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              Ir al Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            
            <Link
              href="/dashboard/batches/create"
              className="w-full bg-green-100 text-green-700 py-3 px-6 rounded-lg font-semibold hover:bg-green-200 transition-colors block"
            >
              Crear Nuevo Lote
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Recibirás un email de confirmación en breve. Si tienes alguna pregunta, contacta con nuestro soporte.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}