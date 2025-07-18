"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, TrendingUp, AlertTriangle } from "lucide-react";

interface UserLimits {
  canCreateBatch: boolean;
  canCreateCards: boolean;
  currentBatches: number;
  currentCards: number;
  maxBatches: number | null;
  maxCards: number | null;
  activePlan: {
    id: string;
    name: string;
    price: number;
    currency: string;
  } | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserLimits();
    }
  }, [session]);

  const fetchUserLimits = async () => {
    try {
      const response = await fetch('/api/user/limits');
      if (response.ok) {
        const data = await response.json();
        setUserLimits(data);
      }
    } catch (error) {
      console.error('Error fetching user limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, max: number | null) => {
    if (max === null) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">Dashboard</h1>
              <p className="text-gray-600">Bienvenido, {session.user?.name || session.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Plan y Límites */}
        {userLimits && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Tu Plan Actual</h2>
              <Link
                href="/dashboard/pricing"
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Ver Planes
              </Link>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Plan Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Plan: {userLimits.activePlan?.name || 'Gratis'}
                </h3>
                <p className="text-blue-700 text-sm">
                  {userLimits.activePlan?.price === 0 ? 'Plan gratuito' : 
                   `€${userLimits.activePlan?.price || 0}`}
                </p>
              </div>

              {/* Uso de Lotes */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Lotes</h3>
                  {!userLimits.canCreateBatch && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {userLimits.currentBatches} / {userLimits.maxBatches || '∞'}
                  </span>
                  {userLimits.maxBatches && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      getUsageColor(getUsagePercentage(userLimits.currentBatches, userLimits.maxBatches))
                    }`}>
                      {Math.round(getUsagePercentage(userLimits.currentBatches, userLimits.maxBatches))}%
                    </span>
                  )}
                </div>
              </div>

              {/* Uso de Tarjetas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Tarjetas</h3>
                  {!userLimits.canCreateCards && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {userLimits.currentCards} / {userLimits.maxCards || '∞'}
                  </span>
                  {userLimits.maxCards && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      getUsageColor(getUsagePercentage(userLimits.currentCards, userLimits.maxCards))
                    }`}>
                      {Math.round(getUsagePercentage(userLimits.currentCards, userLimits.maxCards))}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Advertencia si se alcanzan límites */}
            {(!userLimits.canCreateBatch || !userLimits.canCreateCards) && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-yellow-800 font-medium">Límites alcanzados</p>
                    <p className="text-yellow-700 text-sm">
                      Has alcanzado los límites de tu plan. 
                      <Link href="/dashboard/pricing" className="text-yellow-800 underline ml-1">
                        Actualiza tu plan
                      </Link> para continuar.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded shadow p-8">
          <h2 className="text-xl font-bold mb-6 text-blue-700">Sistema de Tarjetas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border rounded p-6 hover:shadow-md transition">
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-semibold">Lotes de Tarjetas</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Crea y gestiona lotes de tarjetas con códigos únicos y QR seguros.
              </p>
              <Link 
                href="/dashboard/batches" 
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Gestionar Lotes
              </Link>
            </div>
            
            <div className="border rounded p-6 hover:shadow-md transition">
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-semibold">Plantillas</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Sube y gestiona diseños de plantillas para tus tarjetas.
              </p>
              <Link 
                href="/dashboard/templates" 
                className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Gestionar Plantillas
              </Link>
            </div>

            <div className="border rounded p-6 hover:shadow-md transition">
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold">Validar QR</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Escanea y valida tarjetas para verificar su autenticidad.
              </p>
              <Link 
                href="/dashboard/validate" 
                className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
              >
                Validar Tarjetas
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Acciones Rápidas</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/batches/create"
                className={`px-4 py-2 rounded-lg transition ${
                  userLimits?.canCreateBatch 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
                onClick={(e) => {
                  if (!userLimits?.canCreateBatch) {
                    e.preventDefault();
                  }
                }}
              >
                + Crear Nuevo Lote
              </Link>
              <Link
                href="/dashboard/templates/create"
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
              >
                + Subir Nueva Plantilla
              </Link>
              <Link
                href="/dashboard/pricing"
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition flex items-center"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Actualizar Plan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 