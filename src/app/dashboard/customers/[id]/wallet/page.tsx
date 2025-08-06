"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { QRCodeSVG } from "qrcode.react";

interface WalletData {
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  cards: {
    id: string;
    code: string;
    hash: string;
    type: 'FIDELITY' | 'PREPAID';
    active: boolean;
    currentUses: number;
    totalUses?: number;
    remainingUses?: number;
    initialUses?: number;
    createdAt: string;
    lastValidation?: string | null;
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
  }[];
  qr: {
    hash: string;
    dataUrl: string | null;
  };
  metadata: {
    businessName: string;
    cardType: string;
    lastUpdated: string;
    version: string;
  };
}

export default function CustomerWalletPage() {
  const params = useParams();
  const customerId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pkpassData, setPkpassData] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    currentUses: 0,
    remainingUses: 0,
    active: true
  });
  const [editCustomer, setEditCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    cardType: "FIDELITY" as 'FIDELITY' | 'PREPAID',
    totalUses: 10,
    initialUses: 10
  });
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [newCardData, setNewCardData] = useState({
    cardType: 'FIDELITY' as 'FIDELITY' | 'PREPAID',
    totalUses: 10,
    initialUses: 10
  });

  useEffect(() => {
    if (!customerId) return;
    fetchWalletData();
  }, [customerId]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${customerId}/wallet`);
      
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
        
        // Generar QR code si hay tarjetas y hash
        if (data.cards && data.cards.length > 0 && data.cards[0].hash) {
          generateQRCode(data.cards[0].hash);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error al cargar datos");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (hash: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(hash, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCode(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR:", error);
    }
  };

  const downloadQRCode = async () => {
    if (!qrCode) return;
    
    try {
      const response = await fetch(qrCode);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${walletData?.cards[0]?.code}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading QR:", error);
    }
  };

  const generatePKPass = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}/pkpass`);
      if (response.ok) {
        const data = await response.json();
        setPkpassData(data);
        alert("Estructura PKPass generada. Revisa la consola para ver los datos.");
        console.log("PKPass Data:", data);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error generating PKPass:", error);
      alert("Error al generar PKPass");
    }
  };

  const startEditing = () => {
    if (walletData && walletData.cards.length > 0) {
      setEditData({
        currentUses: walletData.cards[0].loyalty?.currentUses || 0,
        remainingUses: walletData.cards[0].prepaid?.remainingUses || 0,
        active: walletData.cards[0].active
      });
      setEditing(true);
    }
  };

  const saveChanges = async () => {
    if (!walletData) return;
    
    try {
      const response = await fetch(`/api/customers/${customerId}/card`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      
      if (response.ok) {
        setEditing(false);
        fetchWalletData(); // Recargar datos
        alert("Cambios guardados correctamente");
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

  const startEditingCustomer = () => {
    if (walletData) {
      setEditCustomer({
        name: walletData.customer.name,
        email: walletData.customer.email,
        phone: walletData.customer.phone || "",
        cardType: walletData.cards[0]?.type || 'FIDELITY',
        totalUses: walletData.cards[0]?.loyalty?.totalUses || 10,
        initialUses: walletData.cards[0]?.prepaid?.remainingUses || 10
      });
      setEditingCustomer(true);
    }
  };

  const saveCustomerChanges = async () => {
    if (!walletData) return;
    
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCustomer)
      });
      
      if (response.ok) {
        setEditingCustomer(false);
        fetchWalletData(); // Recargar datos
        alert("Información del cliente actualizada correctamente");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error saving customer changes:", error);
      alert("Error al actualizar información del cliente");
    }
  };

  const cancelEditingCustomer = () => {
    setEditingCustomer(false);
  };

  const createNewCard = async () => {
    setShowCreateCardModal(true);
  };

  const handleCreateCard = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCardData)
      });
      
      if (response.ok) {
        alert("Nueva tarjeta creada correctamente");
        setShowCreateCardModal(false);
        setNewCardData({
          cardType: 'FIDELITY',
          totalUses: 10,
          initialUses: 10
        });
        fetchWalletData(); // Recargar datos
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error creating new card:", error);
      alert("Error al crear nueva tarjeta");
    }
  };

  const cancelCreateCard = () => {
    setShowCreateCardModal(false);
    setNewCardData({
      cardType: 'FIDELITY',
      totalUses: 10,
      initialUses: 10
    });
  };

  const deleteCustomer = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este cliente y todas sus tarjetas? Esta acción no se puede deshacer.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert("Cliente eliminado correctamente");
        // Redirigir a la lista de clientes
        window.location.href = '/dashboard/customers';
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Error al eliminar el cliente");
    }
  };

  const editCard = (cardId: string) => {
    // TODO: Implementar edición individual de tarjeta
    alert("Edición individual de tarjeta - próximamente");
  };

  const deleteCard = async (cardId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarjeta?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/customers/${customerId}/cards/${cardId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert("Tarjeta eliminada correctamente");
        fetchWalletData(); // Recargar datos
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Error al eliminar la tarjeta");
    }
  };

  const downloadCardQR = async (card: any) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(card.hash, {
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
      a.download = `qr-${card.code}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading QR:", error);
      alert("Error al descargar QR");
    }
  };

  const getCardTypeLabel = (type: string) => {
    return type === 'FIDELITY' ? 'Fidelidad' : 'Prepago';
  };

  const getStatusColor = (isCompleted?: boolean, active?: boolean) => {
    if (isCompleted) return 'text-green-600';
    if (!active) return 'text-red-600';
    return 'text-blue-600';
  };

  if (loading) return <div className="p-6">Cargando datos de Wallet...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!walletData) return <div className="p-6">No se encontraron datos</div>;
  if (walletData.cards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Wallet - {walletData.customer.name}
              </h1>
              <p className="text-gray-600 mt-2">
                Cliente sin tarjetas
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={createNewCard}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Crear Primera Tarjeta</span>
              </button>
              <button
                onClick={deleteCustomer}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Eliminar Cliente</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información del cliente */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Información del Cliente</h2>
              {!editingCustomer && (
                <button
                  onClick={startEditingCustomer}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Editar Cliente
                </button>
              )}
            </div>
            
            {!editingCustomer ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre</label>
                  <p className="text-lg">{walletData.customer.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-lg">{walletData.customer.email}</p>
                </div>
                {walletData.customer.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Teléfono</label>
                    <p className="text-lg">{walletData.customer.phone}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    value={editCustomer.name}
                    onChange={(e) => setEditCustomer({...editCustomer, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={editCustomer.email}
                    onChange={(e) => setEditCustomer({...editCustomer, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    type="tel"
                    value={editCustomer.phone}
                    onChange={(e) => setEditCustomer({...editCustomer, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={saveCustomerChanges}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Guardar Cliente
                  </button>
                  <button
                    onClick={cancelEditingCustomer}
                    className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Estado sin tarjetas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Estado</h2>
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">Sin tarjetas</p>
              <p className="text-gray-600 mb-4">Este cliente aún no tiene tarjetas registradas</p>
              <button
                onClick={createNewCard}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Crear Primera Tarjeta
              </button>
            </div>
          </div>
              </div>

      {/* Modal para crear nueva tarjeta */}
      {showCreateCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Crear Nueva Tarjeta</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo de tarjeta</label>
                <select
                  value={newCardData.cardType}
                  onChange={(e) => {
                    const newType = e.target.value as 'FIDELITY' | 'PREPAID';
                    setNewCardData({
                      ...newCardData,
                      cardType: newType,
                      // Resetear valores según el nuevo tipo
                      totalUses: newType === 'FIDELITY' ? 10 : newCardData.totalUses,
                      initialUses: newType === 'PREPAID' ? 10 : newCardData.initialUses
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FIDELITY">Fidelidad (10 cafés = el 11º gratis)</option>
                  <option value="PREPAID">Prepago (usos limitados)</option>
                </select>
              </div>
              
              {newCardData.cardType === 'FIDELITY' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Cafés para completar (el siguiente será gratis)</label>
                  <input
                    type="number"
                    min="1"
                    value={newCardData.totalUses}
                    onChange={(e) => setNewCardData({...newCardData, totalUses: parseInt(e.target.value) || 10})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ej: 10 cafés = el 11º gratis</p>
                </div>
              )}
              
              {newCardData.cardType === 'PREPAID' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Usos iniciales</label>
                  <input
                    type="number"
                    min="1"
                    value={newCardData.initialUses}
                    onChange={(e) => setNewCardData({...newCardData, initialUses: parseInt(e.target.value) || 10})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateCard}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
              >
                Crear Tarjeta
              </button>
              <button
                onClick={cancelCreateCard}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
                  <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Wallet - {walletData.customer.name}
              </h1>
              <p className="text-gray-600 mt-2">
                Configuración para Apple Wallet
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={deleteCustomer}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Eliminar Cliente</span>
              </button>
            </div>
          </div>
      </div>

      <div className="space-y-8">
        {/* Información del cliente */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Información del Cliente</h2>
            {!editingCustomer && (
              <button
                onClick={startEditingCustomer}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Editar Cliente
              </button>
            )}
          </div>
          
          {!editingCustomer ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <p className="text-lg">{walletData.customer.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-lg">{walletData.customer.email}</p>
              </div>
              {walletData.customer.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <p className="text-lg">{walletData.customer.phone}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  type="text"
                  value={editCustomer.name}
                  onChange={(e) => setEditCustomer({...editCustomer, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={editCustomer.email}
                  onChange={(e) => setEditCustomer({...editCustomer, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="tel"
                  value={editCustomer.phone}
                  onChange={(e) => setEditCustomer({...editCustomer, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo de tarjeta</label>
                <select
                  value={editCustomer.cardType}
                  onChange={(e) => {
                    const newType = e.target.value as 'FIDELITY' | 'PREPAID';
                    setEditCustomer({
                      ...editCustomer, 
                      cardType: newType,
                      // Resetear valores según el nuevo tipo
                      totalUses: newType === 'FIDELITY' ? 10 : editCustomer.totalUses,
                      initialUses: newType === 'PREPAID' ? 10 : editCustomer.initialUses
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FIDELITY">Fidelidad (10 cafés = el 11º gratis)</option>
                  <option value="PREPAID">Prepago (usos limitados)</option>
                </select>
              </div>
              
              {editCustomer.cardType === 'FIDELITY' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Cafés para completar (el siguiente será gratis)</label>
                  <input
                    type="number"
                    min="1"
                    value={editCustomer.totalUses}
                    onChange={(e) => setEditCustomer({...editCustomer, totalUses: parseInt(e.target.value) || 10})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ej: 10 cafés = el 11º gratis</p>
                </div>
              )}
              
              {editCustomer.cardType === 'PREPAID' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Usos iniciales</label>
                  <input
                    type="number"
                    min="1"
                    value={editCustomer.initialUses}
                    onChange={(e) => setEditCustomer({...editCustomer, initialUses: parseInt(e.target.value) || 10})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={saveCustomerChanges}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                >
                  Guardar Cliente
                </button>
                <button
                  onClick={cancelEditingCustomer}
                  className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

                {/* Tarjetas activas - Vista resumida */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tarjetas Activas ({walletData.cards.filter(card => card.active).length})</h2>
            <button
              onClick={createNewCard}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Nueva Tarjeta</span>
            </button>
          </div>
          
          {walletData.cards.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">Sin tarjetas</p>
              <p className="text-gray-600">Este cliente aún no tiene tarjetas registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {walletData.cards.filter(card => card.active).map((card, index) => (
                <div key={card.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          card.type === 'FIDELITY' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {getCardTypeLabel(card.type)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          card.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {card.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div>
                          <label className="text-xs font-medium text-gray-700">Código</label>
                          <p className="font-mono text-sm">{card.code}</p>
                        </div>
                        
                        {card.loyalty && (
                          <div>
                            <label className="text-xs font-medium text-gray-700">Progreso</label>
                            <p className="text-sm font-medium">{card.loyalty.progress}</p>
                          </div>
                        )}
                        
                        {card.prepaid && (
                          <div>
                            <label className="text-xs font-medium text-gray-700">Usos</label>
                            <p className="text-sm font-medium">{card.prepaid.remainingUses} restantes</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => window.location.href = `/dashboard/customers/${customerId}/wallet/card/${card.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Tarjetas inactivas (si las hay) */}
          {walletData.cards.filter(card => !card.active).length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Tarjetas Inactivas ({walletData.cards.filter(card => !card.active).length})</h3>
              <div className="space-y-3">
                {walletData.cards.filter(card => !card.active).map((card) => (
                  <div key={card.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
                          {getCardTypeLabel(card.type)} - Inactiva
                        </span>
                        
                        <div className="flex items-center space-x-6">
                          <div>
                            <label className="text-xs font-medium text-gray-700">Código</label>
                            <p className="font-mono text-sm">{card.code}</p>
                          </div>
                          
                          {card.loyalty && (
                            <div>
                              <label className="text-xs font-medium text-gray-700">Progreso</label>
                              <p className="text-sm font-medium">{card.loyalty.progress}</p>
                            </div>
                          )}
                          
                          {card.prepaid && (
                            <div>
                              <label className="text-xs font-medium text-gray-700">Usos</label>
                              <p className="text-sm font-medium">{card.prepaid.remainingUses} restantes</p>
                            </div>
                          )}
                          
                          <div>
                            <label className="text-xs font-medium text-gray-700">Última validación</label>
                            <p className="text-sm font-medium">
                              {card.lastValidation 
                                ? new Date(card.lastValidation).toLocaleString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Nunca'
                              }
                            </p>
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-gray-700">Última validación</label>
                            <p className="text-sm font-medium">
                              {card.lastValidation 
                                ? new Date(card.lastValidation).toLocaleString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Nunca'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => window.location.href = `/dashboard/customers/${customerId}/wallet/card/${card.id}`}
                        className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition"
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


      </div>


    </div>
  );
} 