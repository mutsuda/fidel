"use client";
import { useRef } from "react";

export default function DesignPage() {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded shadow p-8 w-full max-w-lg flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Subir diseño y generar tarjetas</h2>
        <form className="flex flex-col gap-4 w-full max-w-md">
          <label className="block text-gray-700">Diseño base (PNG/JPG/SVG):</label>
          <input ref={fileInput} type="file" accept="image/*" className="mb-4" />
          <label className="block text-gray-700">Cantidad de tarjetas a generar:</label>
          <input type="number" min={1} max={10000} defaultValue={1000} className="mb-4 border rounded px-2 py-1" />
          <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Generar tarjetas</button>
        </form>
      </div>
    </main>
  );
} 