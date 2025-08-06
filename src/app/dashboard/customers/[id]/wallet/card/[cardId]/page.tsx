"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { QRCodeSVG } from "qrcode.react";

interface CardData {
  id: string;
  code: string;
  hash: string;
  type: string;
  active: boolean;
  currentUses: number;
  totalUses: number | null;
  remainingUses: number | null;
  initialUses: number | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  loyalty?: {
    currentUses: number;
    totalUses: number;
    progress: string;
    isCompleted: boolean;
    message: string;
  };
  prepaid?: {
    remainingUses: number;
    initialUses: number;
    message: string;
  };
}

export default function CardDetailPage() {
  const params = useParams();
  const customerId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const cardId = Array.isArray(params?.cardId) ? params.cardId[0] : params?.cardId;
  
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    currentUses: 0,
    remainingUses: 0,
    active: true
  });

  useEffect(() => {
    if (!customerId || !cardId) {
      setError("IDs de cliente o tarjeta no válidos");
      setLoading(false);
      return;
    }
    fetchCardData();
  }, [customerId, cardId]);

  const fetchCardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${customerId}/wallet/card/${cardId}`);
      
      if (!response.ok) {
        throw new Error("Error al cargar la tarjeta");
      }
      
      const data = await response.json();
      setCardData(data);
    } catch (error) {
      console.error("Error fetching card data:", error);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const getCardTypeLabel = (type: string) => {
    switch (type) {
      case 'FIDELITY': return 'Fidelidad';
      case 'PREPAID': return 'Prepago';
      default: return type;
    }
  };

  const getStatusColor = (isCompleted: boolean, active: boolean) => {
    if (!active) return "text-red-600";
    if (isCompleted) return "text-green-600";
    return "text-blue-600";
  };

  const startEditing = () => {
    if (cardData) {
      setEditData({
        currentUses: cardData.loyalty?.currentUses || 0,
        remainingUses: cardData.prepaid?.remainingUses || 0,
        active: cardData.active
      });
      setEditing(true);
    }
  };

  const saveChanges = async () => {
    if (!cardData) return;
    
    try {
      const response = await fetch(`/api/customers/${customerId}/wallet/card/${cardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });
      
      if (response.ok) {
        alert("Cambios guardados correctamente");
        setEditing(false);
        fetchCardData(); // Recargar datos
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Error al guardar cambios");
    }
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const deleteCard = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarjeta?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/customers/${customerId}/cards/${cardId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert("Tarjeta eliminada correctamente");
        // Redirigir a la vista del cliente
        window.location.href = `/dashboard/customers/${customerId}/wallet`;
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Error al eliminar la tarjeta");
    }
  };

  const downloadQRCode = async () => {
    if (!cardData) return;
    
    try {
      const qrDataUrl = await QRCode.toDataURL(cardData.hash, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${cardData.code}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading QR:", error);
      alert("Error al descargar QR");
    }
  };

  const downloadAppleWallet = async () => {
    if (!cardData) return;
    
    try {
      const response = await fetch(`/api/customers/${customerId}/wallet/card/${cardId}/pkpass`);
      
      if (response.ok) {
        const data = await response.json();
        // Por ahora solo mostramos la estructura
        alert("Estructura PKPass generada. Para implementación completa se requieren certificados de Apple.");
        console.log("PKPass data:", data);
      } else {
        alert("Error al generar Apple Wallet");
      }
    } catch (error) {
      console.error("Error generating Apple Wallet:", error);
      alert("Error al generar Apple Wallet");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando tarjeta...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600">{error || "Tarjeta no encontrada"}</p>
            <button
              onClick={() => window.location.href = `/dashboard/customers/${customerId}/wallet`}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Volver al cliente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => window.location.href = `/dashboard/customers/${customerId}/wallet`}
                className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver al cliente
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Tarjeta de {cardData.customer.name}
              </h1>
              <p className="text-gray-600">Código: {cardData.code}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={deleteCard}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Eliminar Tarjeta
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información de la tarjeta */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Información de la Tarjeta</h2>
              {!editing && (
                <button
                  onClick={startEditing}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Editar
                </button>
              )}
            </div>
            
            {!editing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <p className="text-lg">{getCardTypeLabel(cardData.type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <p className={`text-lg ${getStatusColor(cardData.loyalty?.isCompleted || false, cardData.active)}`}>
                    {cardData.active ? "Activa" : "Inactiva"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Creada</label>
                  <p className="text-lg">{new Date(cardData.createdAt).toLocaleDateString()}</p>
                </div>
                
                {cardData.loyalty && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Progreso Fidelidad</label>
                    <p className="text-lg">{cardData.loyalty.progress}</p>
                    <p className="text-sm text-gray-600">{cardData.loyalty.message}</p>
                  </div>
                )}
                
                {cardData.prepaid && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Usos restantes</label>
                    <p className="text-lg">{cardData.prepaid.remainingUses}</p>
                    <p className="text-sm text-gray-600">{cardData.prepaid.message}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <p className="text-lg">{getCardTypeLabel(cardData.type)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editData.active}
                      onChange={(e) => setEditData({...editData, active: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">{editData.active ? "Activa" : "Inactiva"}</span>
                  </div>
                </div>
                
                {cardData.loyalty && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Usos actuales (Fidelidad)</label>
                    <input
                      type="number"
                      min="0"
                      max={cardData.loyalty.totalUses || 10}
                      value={editData.currentUses}
                      onChange={(e) => setEditData({...editData, currentUses: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">Máximo: {cardData.loyalty.totalUses || 10}</p>
                  </div>
                )}
                
                {cardData.prepaid && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Usos restantes (Prepago)</label>
                    <input
                      type="number"
                      min="0"
                      value={editData.remainingUses}
                      onChange={(e) => setEditData({...editData, remainingUses: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={saveChanges}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* QR Code y Apple Wallet */}
          <div className="space-y-6">
            {/* QR Code */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">QR Code</h3>
                <button
                  onClick={downloadQRCode}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Descargar
                </button>
              </div>
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-white p-4 rounded border flex items-center justify-center">
                  <QRCodeSVG 
                    value={cardData.hash}
                    size={192}
                    level="M"
                  />
                </div>
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">
                Escanea este QR para validar la tarjeta
              </p>
            </div>

            {/* Apple Wallet */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Apple Wallet</h3>
                <button
                  onClick={downloadAppleWallet}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Generar
                </button>
              </div>
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-gray-600 mb-2">Tarjeta digital para Apple Wallet</p>
                <p className="text-xs text-gray-500">
                  Requiere certificados de Apple Developer para implementación completa
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 