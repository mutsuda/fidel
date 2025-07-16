"use client";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded shadow p-8 w-full max-w-sm flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Iniciar sesión</h2>
        <button className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition mb-2">
          Iniciar sesión con email
        </button>
        <button className="w-full py-2 px-4 bg-gray-200 text-blue-700 rounded hover:bg-gray-300 transition">
          Iniciar sesión con Google
        </button>
      </div>
    </main>
  );
} 