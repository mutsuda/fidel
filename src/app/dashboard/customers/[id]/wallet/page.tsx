"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";

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
        generateQRCode(data.card.hash);
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
    if (!confirm("¿Quieres crear una nueva tarjeta para este cliente?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/customers/${customerId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardType: walletData?.cards[0]?.type || 'FIDELITY',
          totalUses: walletData?.cards[0]?.loyalty?.totalUses || 10,
          initialUses: walletData?.cards[0]?.prepaid?.remainingUses || 10
        })
      });
      
      if (response.ok) {
        alert("Nueva tarjeta creada correctamente");
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
                onClick={createNewCard}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Nueva Tarjeta</span>
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

        {/* Información de la tarjeta */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tarjeta Digital</h2>
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
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Código</label>
                <p className="font-mono text-lg">{walletData.cards[0]?.code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo</label>
                <p className="text-lg">{getCardTypeLabel(walletData.cards[0]?.type)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <p className={`text-lg ${getStatusColor(walletData.cards[0]?.loyalty?.isCompleted, walletData.cards[0]?.active)}`}>
                  {walletData.cards[0]?.active ? "Activa" : "Inactiva"}
                </p>
              </div>
              
              {walletData.cards[0]?.loyalty && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Progreso</label>
                  <p className="text-lg">{walletData.cards[0].loyalty.progress}</p>
                  <p className="text-sm text-gray-600">{walletData.cards[0].loyalty.message}</p>
                </div>
              )}
              
              {walletData.cards[0]?.prepaid && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Usos restantes</label>
                  <p className="text-lg">{walletData.cards[0].prepaid.remainingUses}</p>
                  <p className="text-sm text-gray-600">{walletData.cards[0].prepaid.message}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Código</label>
                <p className="font-mono text-lg">{walletData.cards[0]?.code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo</label>
                <p className="text-lg">{getCardTypeLabel(walletData.cards[0]?.type)}</p>
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
              
              {walletData.cards[0]?.loyalty && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Usos actuales (Fidelidad)</label>
                  <input
                    type="number"
                    min="0"
                    max={walletData.cards[0].loyalty.totalUses || 10}
                    value={editData.currentUses}
                    onChange={(e) => setEditData({...editData, currentUses: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">Máximo: {walletData.cards[0].loyalty.totalUses || 10}</p>
                </div>
              )}
              
              {walletData.cards[0]?.prepaid && (
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

        {/* QR Code */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">QR Code</h2>
          <div className="flex flex-col items-center space-y-4">
            {qrCode && (
              <img 
                src={qrCode} 
                alt="QR Code" 
                className="w-48 h-48 border border-gray-200 rounded-lg"
              />
            )}
            <button
              onClick={downloadQRCode}
              disabled={!qrCode}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Descargar QR
            </button>
            <p className="text-xs text-gray-500 text-center">
              Escanea este QR para validar la tarjeta
            </p>
          </div>
        </div>

        {/* Configuración de Apple Wallet */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Apple Wallet</h2>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Generar PKPass</h3>
              <p className="text-sm text-yellow-700 mb-3">
                Crea la estructura del archivo .pkpass (certificados requeridos)
              </p>
              <div className="space-y-2">
                <button 
                  onClick={generatePKPass}
                  className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                >
                  Generar PKPass
                </button>
                <button className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">
                  Configurar Certificados
                </button>
              </div>
            </div>
            
            {pkpassData && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">PKPass Generado</h3>
                <p className="text-sm text-green-700 mb-2">
                  Estructura creada. Revisa la consola para ver los datos.
                </p>
                <div className="text-xs text-green-600">
                  <p>• Serial Number: {pkpassData.card?.hash}</p>
                  <p>• Pass Type: {pkpassData.card?.type}</p>
                  <p>• Cliente: {pkpassData.customer?.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información técnica */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Información Técnica</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="font-medium text-gray-700">Hash de la tarjeta</label>
            <p className="font-mono text-xs text-gray-600 break-all">
              {walletData.cards[0]?.hash}
            </p>
          </div>
          <div>
            <label className="font-medium text-gray-700">Última actualización</label>
            <p className="text-gray-600">
              {new Date(walletData.metadata.lastUpdated).toLocaleString()}
            </p>
          </div>
          <div>
            <label className="font-medium text-gray-700">Versión</label>
            <p className="text-gray-600">{walletData.metadata.version}</p>
          </div>
          <div>
            <label className="font-medium text-gray-700">Tipo de Wallet</label>
            <p className="text-gray-600">{walletData.metadata.cardType}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 