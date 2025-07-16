"use client";

export default function DashboardPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded shadow p-8 w-full max-w-lg flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Dashboard</h2>
        <p className="mb-6 text-gray-700 text-center">Bienvenido a Fidel. Desde aquí puedes subir tu diseño, generar tarjetas y validar QRs.</p>
        <div className="flex flex-col gap-4 w-full">
          <a href="/dashboard/design" className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-center">Subir diseño y generar tarjetas</a>
          <a href="/dashboard/validate" className="w-full py-2 px-4 bg-gray-200 text-blue-700 rounded hover:bg-gray-300 transition text-center">Validar QR</a>
        </div>
      </div>
    </main>
  );
} 