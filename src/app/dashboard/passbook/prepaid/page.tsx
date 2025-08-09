"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PrepaidPassbookConfig {
  businessName?: string;
  businessLogo?: string;
  backgroundColor: string;
  foregroundColor: string;
  labelColor: string;
  initialUses: number;
  remainingText: string;
}

export default function PrepaidPassbookDesignPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState<PrepaidPassbookConfig>({
    businessName: "",
    businessLogo: "",
    backgroundColor: "#E8F5E8",
    foregroundColor: "#000000",
    labelColor: "#2E7D32",
    initialUses: 10,
    remainingText: "Restantes"
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    fetchConfig();
  }, [status, router]);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/passbook/prepaid/config");
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error("Error fetching config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/passbook/prepaid/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        alert("Configuración guardada correctamente");
        fetchConfig(); // Recargar configuración
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'No se pudo guardar la configuración'}`);
      }
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = (field: keyof PrepaidPassbookConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 flex items-center mb-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver al Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Diseño de Passbook - Prepago</h1>
              <p className="text-gray-600 mt-2">
                Personaliza el diseño de las tarjetas prepago para Apple Wallet
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
            >
              {saving ? "Guardando..." : "Guardar Configuración"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuración */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuración</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del negocio
                </label>
                <input
                  type="text"
                  value={config.businessName || ""}
                  onChange={(e) => setConfig(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Mi Cafetería"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo del negocio (URL)
                </label>
                <input
                  type="url"
                  value={config.businessLogo || ""}
                  onChange={(e) => setConfig(prev => ({ ...prev, businessLogo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://ejemplo.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL de tu logo (formato PNG, máximo 160x50px)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colores
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fondo</label>
                    <input
                      type="color"
                      value={config.backgroundColor}
                      onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Texto</label>
                    <input
                      type="color"
                      value={config.foregroundColor}
                      onChange={(e) => handleColorChange("foregroundColor", e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Etiquetas</label>
                    <input
                      type="color"
                      value={config.labelColor}
                      onChange={(e) => handleColorChange("labelColor", e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usos iniciales por defecto
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.initialUses}
                  onChange={(e) => setConfig(prev => ({ ...prev, initialUses: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número de usos que tendrán las tarjetas prepago por defecto
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto de usos restantes
                </label>
                <input
                  type="text"
                  value={config.remainingText}
                  onChange={(e) => setConfig(prev => ({ ...prev, remainingText: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Restantes"
                />
              </div>
            </div>
          </div>

          {/* Vista previa */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Vista Previa</h2>
            
            <div className="space-y-4">
              <div 
                className="p-4 rounded-lg border"
                style={{ backgroundColor: config.backgroundColor }}
              >
                <div className="text-center">
                  <h3 className="font-bold text-lg" style={{ color: config.foregroundColor }}>
                    {config.businessName || "Mi Cafetería"}
                  </h3>
                  <p className="text-sm" style={{ color: config.labelColor }}>
                    Tarjeta prepago para Cliente
                  </p>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: config.labelColor }}>
                      Cliente:
                    </span>
                    <span className="font-medium" style={{ color: config.foregroundColor }}>
                      María García
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: config.labelColor }}>
                      Tipo:
                    </span>
                    <span className="font-medium" style={{ color: config.foregroundColor }}>
                      Prepago
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: config.labelColor }}>
                      {config.remainingText}:
                    </span>
                    <span className="font-medium" style={{ color: config.foregroundColor }}>
                      {config.initialUses}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Esta configuración se aplicará a todas las tarjetas prepago
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 