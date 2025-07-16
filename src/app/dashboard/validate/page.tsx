"use client";

export default function ValidatePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded shadow p-8 w-full max-w-md flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Validar QR</h2>
        <p className="mb-4 text-gray-700 text-center">Escanea el QR de una tarjeta para comprobar su validez.</p>
        <div className="w-full flex flex-col items-center">
          <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400 mb-4">
            [Visor QR aquí]
          </div>
          <input type="text" placeholder="O pega el código aquí" className="w-full border rounded px-2 py-1 mb-2" />
          <button className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Validar</button>
        </div>
      </div>
    </main>
  );
} 