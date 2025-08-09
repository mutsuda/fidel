"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface HistoryItem {
  id: string;
  cardId: string;
  cardCode: string;
  cardType: 'FIDELITY' | 'PREPAID';
  scannedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface HistoryData {
  customer: Customer;
  history: HistoryItem[];
  groupedHistory: { [key: string]: HistoryItem[] };
  totalScans: number;
}

export default function CustomerHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    fetchHistory();
  }, [customerId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${customerId}/history`);
      
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error al cargar el historial");
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      setError("Error al cargar el historial");
    } finally {
      setLoading(false);
    }
  };

  const getCardTypeLabel = (type: string) => {
    return type === 'FIDELITY' ? 'Fidelidad' : 'Prepago';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!historyData) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="text-center text-gray-500">No se encontraron datos</div>
      </div>
    );
  }

  const dates = Object.keys(historyData.groupedHistory).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link 
              href={`/dashboard/customers/${customerId}/wallet`}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Historial de {historyData.customer.name}
          </h1>
          <p className="text-gray-600 mt-1">
            {historyData.totalScans} validaciones registradas
          </p>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total validaciones</p>
              <p className="text-2xl font-semibold text-gray-900">{historyData.totalScans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Días activos</p>
              <p className="text-2xl font-semibold text-gray-900">{dates.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Última validación</p>
              <p className="text-lg font-semibold text-gray-900">
                {historyData.history.length > 0 
                  ? formatDateTime(historyData.history[0].scannedAt)
                  : 'Nunca'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial por fechas */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Historial detallado
          </h2>
        </div>
        
        {dates.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay validaciones registradas para este cliente.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {dates.map((date) => (
              <div key={date} className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {new Date(date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {historyData.groupedHistory[date].length} validación{historyData.groupedHistory[date].length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {historyData.groupedHistory[date].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          item.cardType === 'FIDELITY' ? 'bg-blue-500' : 'bg-green-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Tarjeta {item.cardCode} ({getCardTypeLabel(item.cardType)})
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(item.scannedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {getDayOfWeek(item.scannedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 