"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBatchesMenu, setShowBatchesMenu] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Cerrar menús cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
        setShowMobileMenu(false);
        setShowBatchesMenu(false);
      }
    };

    if (showProfileMenu || showMobileMenu || showBatchesMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu, showMobileMenu, showBatchesMenu]);

  // No mostrar navbar si no está autenticado
  if (status === "loading" || status === "unauthenticated") {
    return null;
  }

  return (
    <nav ref={navRef} className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 select-none">
            <img src="/icon.png" alt="Shokupan" className="w-8 h-8" />
            <span className="text-xl sm:text-2xl font-bold text-blue-700 tracking-tight">Shokupan</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-4 items-center">
            {/* Lotes Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBatchesMenu(!showBatchesMenu)}
                className="flex items-center gap-1 text-gray-700 hover:text-blue-700 font-medium transition text-sm"
              >
                Lotes
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showBatchesMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <Link
                    href="/dashboard/batches"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    onClick={() => setShowBatchesMenu(false)}
                  >
                    Gestionar Lotes
                  </Link>
                  <Link
                    href="/dashboard/templates"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    onClick={() => setShowBatchesMenu(false)}
                  >
                    Plantillas
                  </Link>
                </div>
              )}
            </div>
            
            <Link href="/dashboard/customers" className="text-gray-700 hover:text-blue-700 font-medium transition text-sm">
              Clientes
            </Link>
            <Link href="/dashboard/validate" className="text-gray-700 hover:text-blue-700 font-medium transition text-sm">
              Validar QR
            </Link>
            
            {/* Desktop Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-700 font-medium transition"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                  {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                </div>
                <span className="text-sm">{session?.user?.name || session?.user?.email}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                    {session?.user?.email}
                  </div>
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {/* Mobile Profile Button */}
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm"
            >
              {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
            </button>
            
            {/* Hamburger Menu */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-gray-700 hover:text-blue-700 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 relative z-50">
            <div className="flex flex-col space-y-3 pt-4">
              {/* Lotes Section */}
              <div className="space-y-2">
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Lotes
                </div>
                <Link 
                  href="/dashboard/batches" 
                  className="block text-gray-700 hover:text-blue-700 font-medium transition py-2 px-3 rounded-lg hover:bg-gray-50"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Gestionar Lotes
                </Link>
                <Link 
                  href="/dashboard/templates" 
                  className="block text-gray-700 hover:text-blue-700 font-medium transition py-2 px-3 rounded-lg hover:bg-gray-50"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Plantillas
                </Link>
              </div>
              
              {/* Clientes Section */}
              <div className="space-y-2">
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Clientes
                </div>
                <Link 
                  href="/dashboard/customers" 
                  className="block text-gray-700 hover:text-blue-700 font-medium transition py-2 px-3 rounded-lg hover:bg-gray-50"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Gestionar Clientes
                </Link>
              </div>
              
              {/* Validación Section */}
              <div className="space-y-2">
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Validación
                </div>
                <Link 
                  href="/dashboard/validate" 
                  className="block text-gray-700 hover:text-blue-700 font-medium transition py-2 px-3 rounded-lg hover:bg-gray-50"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Validar QR
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Profile Menu */}
        {showProfileMenu && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 relative z-50">
            <div className="pt-4">
              <div className="px-3 py-2 text-sm text-gray-500">
                {session?.user?.email}
              </div>
              <button
                onClick={() => {
                  signOut({ callbackUrl: "/login" });
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition rounded-lg"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 