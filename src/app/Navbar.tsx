"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // No mostrar navbar si no está autenticado
  if (status === "loading" || status === "unauthenticated") {
    return null;
  }

  return (
    <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm mb-6">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-700 tracking-tight select-none">Fidel</Link>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard/batches" className="text-gray-700 hover:text-blue-700 font-medium transition">Lotes</Link>
          <Link href="/dashboard/templates" className="text-gray-700 hover:text-blue-700 font-medium transition">Plantillas</Link>
          <Link href="/dashboard/validate" className="text-gray-700 hover:text-blue-700 font-medium transition">Validar QR</Link>
          <Link href="/dashboard/pricing" className="text-gray-700 hover:text-blue-700 font-medium transition">Planes</Link>
          
          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-700 font-medium transition"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
              </div>
              <span className="hidden sm:inline">{session?.user?.name || session?.user?.email}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                  {session?.user?.email}
                </div>
                <Link
                  href="/dashboard/pricing"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  onClick={() => setShowProfileMenu(false)}
                >
                  Ver Planes
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Click outside to close menu */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </nav>
  );
} 