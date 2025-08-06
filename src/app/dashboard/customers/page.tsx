"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  cards: Card[];
}

interface Card {
  id: string;
  code: string;
  hash: string;
  type: 'FIDELITY' | 'PREPAID';
  currentUses: number;
  totalUses?: number;
  remainingUses?: number;
  active: boolean;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cardType: "FIDELITY" as 'FIDELITY' | 'PREPAID',
    initialUses: "10"
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
        // Generar QR codes para cada cliente
        generateQRCodes(data);
      } else {
        console.error("Error fetching customers");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodes = async (customersData: Customer[]) => {
    const newQrCodes: { [key: string]: string } = {};
    
    for (const customer of customersData) {
      if (customer.cards.length > 0) {
        try {
          const qrDataUrl = await QRCode.toDataURL(customer.cards[0].hash);
          newQrCodes[customer.id] = qrDataUrl;
        } catch (error) {
          console.error("Error generating QR for customer:", customer.id, error);
        }
      }
    }
    
    setQrCodes(newQrCodes);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const body = {
        ...formData,
        initialUses: formData.cardType === 'PREPAID' ? parseInt(formData.initialUses) : undefined
      };

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Cliente creado:", data);
        setFormData({
          name: "",
          email: "",
          phone: "",
          cardType: "FIDELITY",
          initialUses: "10"
        });
        setShowForm(false);
        fetchCustomers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'No se pudo crear el cliente'}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear el cliente");
    }
  };

  const getCardStatus = (card: Card) => {
    if (!card.active) return "Inactiva";
    
    if (card.type === 'FIDELITY') {
      return `${card.currentUses}/${card.totalUses || 11}`;
    } else if (card.type === 'PREPAID') {
      return `${card.remainingUses || 0} usos restantes`;
    }
    
    return "Activa";
  };

  const getCardTypeLabel = (type: string) => {
    return type === 'FIDELITY' ? 'Fidelidad' : 'Prepago';
  };

  if (loading) return <div className="p-6">Cargando clientes...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? "Cancelar" : "Registrar Cliente"}
        </button>
      </div>

      {/* Formulario de registro */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Registrar nuevo cliente</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de tarjeta
                </label>
                <select
                  name="cardType"
                  value={formData.cardType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FIDELITY">Fidelidad (11 cafés = 1 gratis)</option>
                  <option value="PREPAID">Prepago (usos limitados)</option>
                </select>
              </div>
              
              {formData.cardType === 'PREPAID' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usos iniciales
                  </label>
                  <input
                    type="number"
                    name="initialUses"
                    value={formData.initialUses}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Registrar Cliente
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de clientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Clientes registrados ({customers.length})
          </h2>
        </div>
        
        {customers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay clientes registrados. Registra tu primer cliente para empezar.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {customers.map((customer) => (
              <div key={customer.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {customer.name}
                    </h3>
                    <p className="text-gray-600">{customer.email}</p>
                    {customer.phone && (
                      <p className="text-gray-500 text-sm">{customer.phone}</p>
                    )}
                    <p className="text-gray-400 text-sm">
                      Registrado el {new Date(customer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Información de la tarjeta */}
                    <div className="text-right">
                      {customer.cards.length > 0 ? (
                        <div>
                          <div className="text-sm text-gray-600">
                            {getCardTypeLabel(customer.cards[0].type)}
                          </div>
                          <div className={`text-sm font-medium ${
                            customer.cards[0].active ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {getCardStatus(customer.cards[0])}
                          </div>
                          <div className="text-xs text-gray-500">
                            {customer.cards[0].code}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Sin tarjeta</div>
                      )}
                    </div>
                    
                    {/* QR Code */}
                    {customer.cards.length > 0 && qrCodes[customer.id] && (
                      <div className="flex flex-col items-center">
                        <img 
                          src={qrCodes[customer.id]} 
                          alt="QR Code" 
                          className="w-16 h-16 border border-gray-200 rounded"
                        />
                        <p className="text-xs text-gray-500 mt-1">QR para escanear</p>
                      </div>
                    )}
                    
                    {/* Enlace a Wallet */}
                    {customer.cards.length > 0 && (
                      <div className="flex flex-col items-center">
                        <Link
                          href={`/dashboard/customers/${customer.id}/wallet`}
                          className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition"
                          title="Configurar Apple Wallet"
                        >
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">Wallet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 