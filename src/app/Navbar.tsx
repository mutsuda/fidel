"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm mb-6">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
        <Link href="/dashboard/batches" className="text-2xl font-bold text-blue-700 tracking-tight select-none">Fidel</Link>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard/batches" className="text-gray-700 hover:text-blue-700 font-medium transition">Lotes</Link>
          <Link href="/dashboard/templates" className="text-gray-700 hover:text-blue-700 font-medium transition">Plantillas</Link>
          <Link href="/dashboard/validate" className="text-gray-700 hover:text-blue-700 font-medium transition">Validar QR</Link>
        </div>
      </div>
    </nav>
  );
} 