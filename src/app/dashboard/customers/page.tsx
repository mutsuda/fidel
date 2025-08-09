"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  cards: Card[];
  lastValidation?: {
    id: string;
    scannedAt: string;
    ipAddress?: string;
    userAgent?: string;
  };
  lastValidationCard?: {
    id: string;
    code: string;
    type: 'FIDELITY' | 'PREPAID';
  };
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
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filtrar clientes cuando cambie el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        console.log("Customers data:", data); // Debug temporal
        setCustomers(data);
      } else {
        console.error("Error fetching customers");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
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
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Cliente creado:", data);
        setFormData({
          name: "",
          email: "",
          phone: ""
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

  const deleteCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        alert("Cliente eliminado correctamente");
        fetchCustomers(); // Recargar la lista
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'No se pudo eliminar el cliente'}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar el cliente");
    }
  };

  const getCardStatus = (card: Card) => {
    if (!card.active) return "Inactiva";
    
    if (card.type === 'FIDELITY') {
      return `${card.currentUses}/${card.totalUses || 10}`;
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header con título y botón */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">Gestiona tus clientes y sus tarjetas de fidelidad</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 sm:py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            {filteredCustomers.length === 1 
              ? "1 cliente encontrado" 
              : `${filteredCustomers.length} clientes encontrados`
            }
          </div>
        )}
      </div>

      {/* Formulario de registro */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Registrar nuevo cliente</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
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
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 sm:py-2 rounded-lg hover:bg-blue-700 transition text-base"
              >
                Registrar Cliente
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-full sm:w-auto bg-gray-200 text-gray-700 px-6 py-3 sm:py-2 rounded-lg hover:bg-gray-300 transition text-base"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de clientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Clientes registrados ({filteredCustomers.length})
          </h2>
        </div>
        
        {filteredCustomers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchTerm ? "No se encontraron clientes con esa búsqueda." : "No hay clientes registrados. Registra tu primer cliente para empezar."}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <Link 
                key={customer.id} 
                href={`/dashboard/customers/${customer.id}/wallet`}
                className="block p-4 sm:p-6 hover:bg-gray-50 transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      {customer.name}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base truncate">{customer.email}</p>
                    {customer.phone && (
                      <p className="text-gray-500 text-sm truncate">{customer.phone}</p>
                    )}
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Registrado el {new Date(customer.createdAt).toLocaleDateString()}
                    </p>
                    {/* Información de la última validación */}
                    {customer.lastValidation && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-gray-600">
                            Última validación: {new Date(customer.lastValidation.scannedAt).toLocaleString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {customer.lastValidationCard && (
                          <span className="text-xs text-gray-500 ml-4">
                            Tarjeta: {customer.lastValidationCard.code} ({customer.lastValidationCard.type === 'FIDELITY' ? 'Fidelidad' : 'Prepago'})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    {/* Estadísticas de tarjetas */}
                    <div className="text-left sm:text-right">
                      {customer.cards.length > 0 ? (
                        <div className="space-y-1">
                          <div className="text-xs sm:text-sm text-gray-600">
                            Tarjetas activas: {customer.cards.filter(card => card.active === true).length}
                          </div>
                          {/* Mostrar tipos de tarjetas activas */}
                          {customer.cards.filter(card => card.active === true).length > 0 && (
                            <div className="text-xs text-gray-500">
                              {(() => {
                                const activeCards = customer.cards.filter(card => card.active === true);
                                const fidelityCount = activeCards.filter(card => card.type === 'FIDELITY').length;
                                const prepaidCount = activeCards.filter(card => card.type === 'PREPAID').length;
                                if (fidelityCount > 0 && prepaidCount > 0) {
                                  return `${fidelityCount} Fidelidad, ${prepaidCount} Prepago`;
                                } else if (fidelityCount > 0) {
                                  return `${fidelityCount} Fidelidad`;
                                } else if (prepaidCount > 0) {
                                  return `${prepaidCount} Prepago`;
                                }
                                return '';
                              })()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm text-gray-500">Sin tarjetas</div>
                      )}
                    </div>
                    
                    {/* Indicador de click */}
                    <div className="flex items-center text-blue-600">
                      <span className="text-xs sm:text-sm font-medium">Ver detalles</span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    
                    {/* Botón de eliminar */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm(`¿Estás seguro de que quieres eliminar a ${customer.name} y todas sus tarjetas?`)) {
                          deleteCustomer(customer.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-xs sm:text-sm flex items-center space-x-1"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 