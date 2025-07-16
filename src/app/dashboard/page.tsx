"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
      <div className="max-w-4xl mx-auto">
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
          <h2 className="text-xl font-bold mb-6 text-blue-700">Herramientas</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border rounded p-6 hover:shadow-md transition">
              <h3 className="text-lg font-semibold mb-3">Generar Tarjetas</h3>
              <p className="text-gray-600 mb-4">
                Sube tu diseño y genera cientos de tarjetas de fidelidad únicas con QR seguro.
              </p>
              <a 
                href="/dashboard/design" 
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Crear tarjetas
              </a>
            </div>
            
            <div className="border rounded p-6 hover:shadow-md transition">
              <h3 className="text-lg font-semibold mb-3">Validar QR</h3>
              <p className="text-gray-600 mb-4">
                Escanea y valida tarjetas de fidelidad para verificar su autenticidad.
              </p>
              <a 
                href="/dashboard/validate" 
                className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Validar tarjetas
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 