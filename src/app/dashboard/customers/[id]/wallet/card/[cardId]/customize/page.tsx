"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface CardCustomization {
  businessName?: string;
  customColors?: {
    backgroundColor: string;
    foregroundColor: string;
    labelColor: string;
  };
  customLogo?: string;
  businessLogo?: string;
}

export default function CustomizeCardPage() {
  const params = useParams();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const cardId = Array.isArray(params.cardId) ? params.cardId[0] : params.cardId;
  
  const [customization, setCustomization] = useState<CardCustomization>({
    businessName: "",
    customColors: {
      backgroundColor: "#E3F2FD",
      foregroundColor: "#000000",
      labelColor: "#1976D2"
    },
    customLogo: "",
    businessLogo: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const handleColorChange = (field: 'backgroundColor' | 'foregroundColor' | 'labelColor', value: string) => {
    setCustomization(prev => ({
      ...prev,
      customColors: {
        ...prev.customColors!,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`/api/customers/${customerId}/pkpass/custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cardId,
          ...customization
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreview(data);
      } else {
        console.error("Error personalizando tarjeta");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Personalizar Tarjeta Passbook</h1>
        <p className="text-gray-600 mt-2">
          Personaliza el diseño de tu tarjeta para Apple Wallet
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario de personalización */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuración</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre del negocio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del negocio
              </label>
              <input
                type="text"
                value={customization.businessName || ""}
                onChange={(e) => setCustomization(prev => ({ ...prev, businessName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mi Cafetería"
              />
            </div>

            {/* Colores personalizados */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colores personalizados
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fondo</label>
                  <input
                    type="color"
                    value={customization.customColors?.backgroundColor || "#E3F2FD"}
                    onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Texto</label>
                  <input
                    type="color"
                    value={customization.customColors?.foregroundColor || "#000000"}
                    onChange={(e) => handleColorChange("foregroundColor", e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Etiquetas</label>
                  <input
                    type="color"
                    value={customization.customColors?.labelColor || "#1976D2"}
                    onChange={(e) => handleColorChange("labelColor", e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Logo personalizado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo personalizado (URL)
              </label>
              <input
                type="url"
                value={customization.businessLogo || ""}
                onChange={(e) => setCustomization(prev => ({ ...prev, businessLogo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://ejemplo.com/logo.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL de tu logo (formato PNG, máximo 160x50px)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Generando..." : "Generar Vista Previa"}
            </button>
          </form>
        </div>

        {/* Vista previa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Vista Previa</h2>
          
          {preview ? (
            <div className="space-y-4">
              <div 
                className="p-4 rounded-lg border"
                style={{ backgroundColor: preview.passData.backgroundColor }}
              >
                <div className="text-center">
                  <h3 className="font-bold text-lg" style={{ color: preview.passData.foregroundColor }}>
                    {preview.passData.organizationName}
                  </h3>
                  <p className="text-sm" style={{ color: preview.passData.labelColor }}>
                    {preview.passData.description}
                  </p>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: preview.passData.labelColor }}>
                      Cliente:
                    </span>
                    <span className="font-medium" style={{ color: preview.passData.foregroundColor }}>
                      {preview.customer.name}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: preview.passData.labelColor }}>
                      Tipo:
                    </span>
                    <span className="font-medium" style={{ color: preview.passData.foregroundColor }}>
                      {preview.card.type === 'FIDELITY' ? 'Fidelidad' : 'Prepago'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <button className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition">
                  Descargar PKPass
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Configura los parámetros y genera una vista previa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 