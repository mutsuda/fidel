"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
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
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
              >
                + Crear Nuevo Lote
              </Link>
              <Link
                href="/dashboard/templates/create"
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
              >
                + Subir Nueva Plantilla
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 