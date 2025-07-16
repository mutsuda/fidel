import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-4xl font-bold mb-4 text-blue-700">Fidel</h1>
      <p className="mb-8 text-lg text-gray-700 text-center max-w-xl">
        Crea, personaliza y valida tarjetas de fidelidad con QR seguro para tu negocio. Sube tu diseño, genera cientos de tarjetas únicas y descárgalas listas para imprenta.
      </p>
      <div className="flex gap-4">
        <a href="/login" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Iniciar sesión</a>
        <a href="/dashboard" className="px-6 py-2 bg-gray-200 text-blue-700 rounded hover:bg-gray-300 transition">Ir al dashboard</a>
      </div>
    </main>
  );
}
