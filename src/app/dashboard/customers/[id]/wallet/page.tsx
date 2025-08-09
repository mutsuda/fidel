"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

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
    phone: ""
  });
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [newCardData, setNewCardData] = useState({
    cardType: 'FIDELITY' as 'FIDELITY' | 'PREPAID',
    totalUses: 10,
    initialUses: 10
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

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
        phone: walletData.customer.phone || ""
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
    console.log("createNewCard clicked");
    console.log("showCreateCardModal before:", showCreateCardModal);
    setShowCreateCardModal(true);
    console.log("showCreateCardModal after setState:", showCreateCardModal);
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

  const sendCardEmail = async (cardId: string, includePassbook: boolean = false) => {
    if (!walletData?.customer.email) {
      alert("El cliente no tiene email registrado");
      return;
    }

    setSendingEmail(true);
    setEmailStatus(null);

    try {
      const response = await fetch(`/api/customers/${customerId}/cards/${cardId}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          includePassbook
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEmailStatus({
          success: true,
          message: `Email enviado correctamente a ${walletData.customer.email}`
        });
      } else {
        setEmailStatus({
          success: false,
          message: data.error || 'Error al enviar el email'
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailStatus({
        success: false,
        message: 'Error al enviar el email'
      });
    } finally {
      setSendingEmail(false);
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

  if (loading) return <div className="p-6">Cargando datos del cliente...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!walletData) return <div className="p-6">No se encontraron datos</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {walletData.customer.name}
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Configuración de tarjetas
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <button
              onClick={deleteCustomer}
              className="w-full sm:w-auto bg-red-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Eliminar Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notificación de estado del email */}
      {emailStatus && (
        <div className={`mb-6 p-4 rounded-lg ${
          emailStatus.success 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {emailStatus.success ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {emailStatus.message}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setEmailStatus(null)}
                  className={`inline-flex rounded-md p-1.5 ${
                    emailStatus.success 
                      ? 'bg-green-50 text-green-500 hover:bg-green-100' 
                      : 'bg-red-50 text-red-500 hover:bg-red-100'
                  }`}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 sm:space-y-8">
        {/* Información del cliente */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">Información del Cliente</h2>
            {!editingCustomer && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                <Link
                  href={`/dashboard/customers/${customerId}/history`}
                  className="w-full sm:w-auto bg-green-600 text-white px-4 py-3 sm:px-3 sm:py-1 rounded text-sm hover:bg-green-700 transition flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Ver Historial</span>
                </Link>
                <button
                  onClick={startEditingCustomer}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 sm:px-3 sm:py-1 rounded text-sm hover:bg-blue-700"
                >
                  Editar Cliente
                </button>
              </div>
            )}
          </div>
          
          {!editingCustomer ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <p className="text-base sm:text-lg">{walletData.customer.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-base sm:text-lg">{walletData.customer.email}</p>
              </div>
              {walletData.customer.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <p className="text-base sm:text-lg">{walletData.customer.phone}</p>
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
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={editCustomer.email}
                  onChange={(e) => setEditCustomer({...editCustomer, email: e.target.value})}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="tel"
                  value={editCustomer.phone}
                  onChange={(e) => setEditCustomer({...editCustomer, phone: e.target.value})}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                <button
                  onClick={saveCustomerChanges}
                  className="w-full sm:w-auto bg-green-600 text-white px-4 py-3 sm:py-2 rounded text-sm hover:bg-green-700"
                >
                  Guardar Cliente
                </button>
                <button
                  onClick={cancelEditingCustomer}
                  className="w-full sm:w-auto bg-gray-500 text-white px-4 py-3 sm:py-2 rounded text-sm hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tarjetas Activas */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">Tarjetas Activas ({walletData.cards.filter(card => card.active).length})</h2>
            <button
              onClick={createNewCard}
              className="w-full sm:w-auto bg-green-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Nueva Tarjeta</span>
            </button>
          </div>
          
          {walletData.cards.filter(card => card.active).length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">Sin tarjetas activas</p>
              <p className="text-gray-600 mb-4">Este cliente no tiene tarjetas activas</p>
              <button
                onClick={createNewCard}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Crear Primera Tarjeta
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {walletData.cards.filter(card => card.active).map((card) => (
                <div key={card.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                      <div className="flex flex-wrap items-center gap-2">
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
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
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
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                      <button
                        onClick={() => window.location.href = `/dashboard/customers/${customerId}/wallet/card/${card.id}`}
                        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 sm:py-2 rounded text-sm hover:bg-blue-700 transition"
                      >
                        Ver Detalles
                      </button>
                      
                      <button
                        onClick={() => sendCardEmail(card.id, false)}
                        disabled={sendingEmail}
                        className="w-full sm:w-auto bg-green-600 text-white px-4 py-3 sm:py-2 rounded text-sm hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {sendingEmail ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>Enviar QR</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => sendCardEmail(card.id, true)}
                        disabled={sendingEmail}
                        className="w-full sm:w-auto bg-purple-600 text-white px-4 py-3 sm:py-2 rounded text-sm hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {sendingEmail ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Enviar Passbook</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Tarjetas inactivas (si las hay) */}
        {walletData.cards.filter(card => !card.active).length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Tarjetas Inactivas ({walletData.cards.filter(card => !card.active).length})</h3>
            <div className="space-y-3">
              {walletData.cards.filter(card => !card.active).map((card) => (
                <div key={card.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
                        {getCardTypeLabel(card.type)} - Inactiva
                      </span>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
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
                      </div>
                    </div>
                    
                    <button
                      onClick={() => window.location.href = `/dashboard/customers/${customerId}/wallet/card/${card.id}`}
                      className="w-full sm:w-auto bg-gray-600 text-white px-4 py-3 sm:py-2 rounded text-sm hover:bg-gray-700 transition"
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

      {/* Modal para crear nueva tarjeta */}
      {showCreateCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
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
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  />
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={handleCreateCard}
                className="flex-1 bg-green-600 text-white px-4 py-3 sm:py-2 rounded text-sm hover:bg-green-700"
              >
                Crear Tarjeta
              </button>
              <button
                onClick={cancelCreateCard}
                className="flex-1 bg-gray-500 text-white px-4 py-3 sm:py-2 rounded text-sm hover:bg-gray-600"
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
