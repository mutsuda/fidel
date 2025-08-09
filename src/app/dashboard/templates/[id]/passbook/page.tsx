"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface PassbookConfig {
  businessName?: string;
  businessLogo?: string;
  backgroundColor: string;
  foregroundColor: string;
  labelColor: string;
  fidelityConfig?: {
    backgroundColor: string;
    labelColor: string;
    totalUses: number;
    progressText: string;
  };
  prepaidConfig?: {
    backgroundColor: string;
    labelColor: string;
    initialUses: number;
    remainingText: string;
  };
}

interface Template {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
}

export default function PassbookDesignPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const templateId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'fidelity' | 'prepaid'>('general');
  
  const [config, setConfig] = useState<PassbookConfig>({
    businessName: "",
    businessLogo: "",
    backgroundColor: "#E3F2FD",
    foregroundColor: "#000000",
    labelColor: "#1976D2",
    fidelityConfig: {
      backgroundColor: "#E3F2FD",
      labelColor: "#1976D2",
      totalUses: 11,
      progressText: "Progreso"
    },
    prepaidConfig: {
      backgroundColor: "#E8F5E8",
      labelColor: "#2E7D32",
      initialUses: 10,
      remainingText: "Restantes"
    }
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (templateId) {
      fetchTemplate();
    }
  }, [status, templateId, router]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplate(data);
        
        // Por ahora, usar configuración por defecto
        // En el futuro, esto se cargaría desde la configuración global de Passbook
      }
    } catch (error) {
      console.error("Error fetching template:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templateId) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/templates/${templateId}/passbook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        alert("Configuración guardada correctamente");
        fetchTemplate(); // Recargar datos
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'No se pudo guardar la configuración'}`);
      }
    } catch (error) {
      console.error("Error saving passbook config:", error);
      alert("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = (field: keyof PassbookConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFidelityConfigChange = (field: 'backgroundColor' | 'labelColor' | 'totalUses' | 'progressText', value: string | number) => {
    setConfig(prev => ({
      ...prev,
      fidelityConfig: {
        ...prev.fidelityConfig!,
        [field]: value
      }
    }));
  };

  const handlePrepaidConfigChange = (field: 'backgroundColor' | 'labelColor' | 'initialUses' | 'remainingText', value: string | number) => {
    setConfig(prev => ({
      ...prev,
      prepaidConfig: {
        ...prev.prepaidConfig!,
        [field]: value
      }
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

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Plantilla no encontrada</h1>
            <Link
              href="/dashboard/templates"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Volver a Plantillas
            </Link>
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
                href="/dashboard/templates"
                className="text-blue-600 hover:text-blue-800 flex items-center mb-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a Plantillas
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Diseñar Passbook - {template.name}</h1>
              <p className="text-gray-600 mt-2">
                Personaliza el diseño de las tarjetas Passbook para Apple Wallet
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? "Guardando..." : "Guardar Configuración"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuración */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('general')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'general'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    General
                  </button>
                  <button
                    onClick={() => setActiveTab('fidelity')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'fidelity'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Fidelidad
                  </button>
                  <button
                    onClick={() => setActiveTab('prepaid')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'prepaid'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Prepago
                  </button>
                </nav>
              </div>
            </div>

            {/* Contenido de las pestañas */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del negocio
                  </label>
                  <input
                    type="text"
                    value={config.businessName || ""}
                    onChange={(e) => setConfig(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://ejemplo.com/logo.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL de tu logo (formato PNG, máximo 160x50px)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colores generales
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
              </div>
            )}

            {activeTab === 'fidelity' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colores para tarjetas de fidelidad
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fondo</label>
                      <input
                        type="color"
                        value={config.fidelityConfig?.backgroundColor || "#E3F2FD"}
                        onChange={(e) => handleFidelityConfigChange("backgroundColor", e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Etiquetas</label>
                      <input
                        type="color"
                        value={config.fidelityConfig?.labelColor || "#1976D2"}
                        onChange={(e) => handleFidelityConfigChange("labelColor", e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total de usos para café gratis
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.fidelityConfig?.totalUses || 11}
                    onChange={(e) => handleFidelityConfigChange("totalUses", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ej: 11 significa que el 11º café será gratis
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texto de progreso
                  </label>
                  <input
                    type="text"
                    value={config.fidelityConfig?.progressText || "Progreso"}
                    onChange={(e) => handleFidelityConfigChange("progressText", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Progreso"
                  />
                </div>
              </div>
            )}

            {activeTab === 'prepaid' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colores para tarjetas prepago
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fondo</label>
                      <input
                        type="color"
                        value={config.prepaidConfig?.backgroundColor || "#E8F5E8"}
                        onChange={(e) => handlePrepaidConfigChange("backgroundColor", e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Etiquetas</label>
                      <input
                        type="color"
                        value={config.prepaidConfig?.labelColor || "#2E7D32"}
                        onChange={(e) => handlePrepaidConfigChange("labelColor", e.target.value)}
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
                    value={config.prepaidConfig?.initialUses || 10}
                    onChange={(e) => handlePrepaidConfigChange("initialUses", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    value={config.prepaidConfig?.remainingText || "Restantes"}
                    onChange={(e) => handlePrepaidConfigChange("remainingText", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Restantes"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Vista previa */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Vista Previa</h2>
            
            <div className="space-y-6">
              {/* Vista previa de tarjeta de fidelidad */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tarjeta de Fidelidad</h3>
                <div 
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: config.fidelityConfig?.backgroundColor || config.backgroundColor }}
                >
                  <div className="text-center">
                    <h4 className="font-bold text-lg" style={{ color: config.foregroundColor }}>
                      {config.businessName || "Mi Cafetería"}
                    </h4>
                    <p className="text-sm" style={{ color: config.fidelityConfig?.labelColor || config.labelColor }}>
                      Tarjeta de fidelidad para Cliente
                    </p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: config.fidelityConfig?.labelColor || config.labelColor }}>
                        Cliente:
                      </span>
                      <span className="font-medium" style={{ color: config.foregroundColor }}>
                        Juan Pérez
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: config.fidelityConfig?.labelColor || config.labelColor }}>
                        Tipo:
                      </span>
                      <span className="font-medium" style={{ color: config.foregroundColor }}>
                        Fidelidad
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: config.fidelityConfig?.labelColor || config.labelColor }}>
                        {config.fidelityConfig?.progressText || "Progreso"}:
                      </span>
                      <span className="font-medium" style={{ color: config.foregroundColor }}>
                        5/{config.fidelityConfig?.totalUses || 11}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vista previa de tarjeta prepago */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tarjeta Prepago</h3>
                <div 
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: config.prepaidConfig?.backgroundColor || config.backgroundColor }}
                >
                  <div className="text-center">
                    <h4 className="font-bold text-lg" style={{ color: config.foregroundColor }}>
                      {config.businessName || "Mi Cafetería"}
                    </h4>
                    <p className="text-sm" style={{ color: config.prepaidConfig?.labelColor || config.labelColor }}>
                      Tarjeta prepago para Cliente
                    </p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: config.prepaidConfig?.labelColor || config.labelColor }}>
                        Cliente:
                      </span>
                      <span className="font-medium" style={{ color: config.foregroundColor }}>
                        María García
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: config.prepaidConfig?.labelColor || config.labelColor }}>
                        Tipo:
                      </span>
                      <span className="font-medium" style={{ color: config.foregroundColor }}>
                        Prepago
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: config.prepaidConfig?.labelColor || config.labelColor }}>
                        {config.prepaidConfig?.remainingText || "Restantes"}:
                      </span>
                      <span className="font-medium" style={{ color: config.foregroundColor }}>
                        {config.prepaidConfig?.initialUses || 10}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 