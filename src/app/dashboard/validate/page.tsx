"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

let Html5Qrcode: any;
if (typeof window !== "undefined") {
  Html5Qrcode = require("html5-qrcode").Html5Qrcode;
}

interface ValidationResult {
  id: number;
  type: 'success' | 'error';
  card?: any;
  message?: string;
  timestamp: Date;
}

export default function ValidatePage() {
  const [input, setInput] = useState("");
  const [currentResult, setCurrentResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const html5QrRef = useRef<any>(null);
  const qrRegionId = "qr-reader-region";
  const lastScannedRef = useRef<string>("");

  useEffect(() => {
    if (!showCamera) return;
    let qr: any;
    if (typeof window !== "undefined" && Html5Qrcode) {
      qr = new Html5Qrcode(qrRegionId);
      html5QrRef.current = qr;
      qr.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText: string) => {
          // Evitar escanear el mismo QR múltiples veces
          if (decodedText === lastScannedRef.current) return;
          lastScannedRef.current = decodedText;
          
          if (!loading) {
            handleValidate(decodedText);
          }
        },
        (err: any) => {}
      ).then(() => setCameraReady(true)).catch(() => setCameraReady(false));
    }
    return () => {
      if (qr && typeof qr.stop === "function") {
        try { qr.stop(); } catch {}
      }
      setCameraReady(false);
    };
    // eslint-disable-next-line
  }, [showCamera]);

  const handleValidate = async (hash?: string) => {
    setLoading(true);
    try {
      // Primero intentar con el sistema nuevo (tarjetas de clientes)
      let res = await fetch("/api/validate/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash: (hash ?? input).trim() })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setCurrentResult({
            id: Date.now(),
            type: 'success',
            card: data.card,
            timestamp: new Date()
          });
          setLoading(false);
          return;
        }
      }
      
      // Si no funciona, intentar con el sistema antiguo (lotes)
      res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash: (hash ?? input).trim() })
      });
      
      const data = await res.json();
      if (!data.ok) {
        setCurrentResult({
          id: Date.now(),
          type: 'error',
          message: data.error || "No válida",
          timestamp: new Date()
        });
      } else {
        setCurrentResult({
          id: Date.now(),
          type: 'success',
          card: data.card,
          timestamp: new Date()
        });
      }
    } catch {
      setCurrentResult({
        id: Date.now(),
        type: 'error',
        message: "Error de red",
        timestamp: new Date()
      });
    }
    setLoading(false);
  };

  const handleAction = async (cardId: string, action: "increment" | "decrement") => {
    setLoading(true);
    try {
      const res = await fetch("/api/validate/card/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, action })
      });
      const data = await res.json();
      if (data.ok && currentResult?.type === 'success' && currentResult.card?.id === cardId) {
        // Actualizar el resultado actual con la nueva información
        setCurrentResult({
          ...currentResult,
          card: { ...currentResult.card, ...data.card }
        });
      }
    } catch {
      // Error silencioso para no interrumpir el flujo
    }
    setLoading(false);
  };

  const clearResult = () => {
    setCurrentResult(null);
    lastScannedRef.current = "";
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Panel izquierdo - Cámara y input */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-blue-700">Validar QR</h2>
          <p className="mb-4 text-gray-700 text-sm sm:text-base">Escanea el QR de una tarjeta o pega el código aquí.</p>
          
          {showCamera && (
            <div className="w-full flex flex-col items-center mb-4">
              <div id={qrRegionId} className="w-48 h-48 sm:w-64 sm:h-64 bg-gray-100 rounded flex items-center justify-center text-gray-400 mb-2 overflow-hidden border-4 border-blue-300 shadow-inner" />
              {!cameraReady && <div className="text-gray-500 text-sm mt-2">Cargando cámara...</div>}
              <button
                className="text-blue-600 underline text-sm mt-2"
                onClick={() => setShowCamera(false)}
              >
                Usar input manual
              </button>
            </div>
          )}
          
          {!showCamera && (
            <div className="w-full flex flex-col items-center mb-4">
              <input
                type="text"
                placeholder="Pega el hash del QR aquí"
                className="w-full border rounded px-3 py-3 sm:py-2 mb-2 text-base sm:text-lg"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleValidate()}
                autoFocus
                disabled={loading}
              />
              <button
                className="w-full py-3 sm:py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-base sm:text-lg mb-2"
                onClick={() => handleValidate()}
                disabled={loading || !input.trim()}
              >
                {loading ? "Validando..." : "Validar"}
              </button>
              <button
                className="text-blue-600 underline text-sm"
                onClick={() => setShowCamera(true)}
              >
                Usar cámara
              </button>
            </div>
          )}
          
          <button
            onClick={clearResult}
            className="w-full py-3 sm:py-2 px-4 bg-gray-200 rounded hover:bg-gray-300 transition text-base"
          >
            Limpiar resultado
          </button>
        </div>

        {/* Panel derecho - Resultado actual */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-900">Última tarjeta escaneada</h3>
          <div className="min-h-48 sm:min-h-64">
            {!currentResult ? (
              <p className="text-gray-500 text-center py-8 text-sm sm:text-base">Escanea una tarjeta para ver el resultado</p>
            ) : (
              <div className={`border rounded-lg p-4 ${currentResult.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">{currentResult.type === 'success' ? '✅' : '❌'}</span>
                    <span className={`font-semibold text-sm sm:text-base ${currentResult.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                      {currentResult.type === 'success' ? 'Válida' : 'No válida'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {currentResult.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                {currentResult.type === 'success' && currentResult.card && (
                  <div className="space-y-2">
                    <div className="font-mono text-base sm:text-lg break-all">{currentResult.card.code}</div>
                    
                    {/* Mostrar información según el tipo de tarjeta */}
                    {currentResult.card.customer ? (
                      // Tarjeta de cliente (nuevo sistema)
                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm text-gray-700">Cliente: <b>{currentResult.card.customer.name}</b></div>
                        <div className="text-xs sm:text-sm text-gray-700">Email: <b>{currentResult.card.customer.email}</b></div>
                        <div className="text-xs sm:text-sm text-gray-700">Tipo: <b>{currentResult.card.type === 'FIDELITY' ? 'Fidelidad' : 'Prepago'}</b></div>
                        <div className="text-xs sm:text-sm text-gray-700">Estado: <b>{currentResult.card.active ? "Activa" : "Inactiva"}</b></div>
                        
                        {currentResult.card.type === 'FIDELITY' ? (
                          <div className="text-xs sm:text-sm text-gray-700">
                            Progreso: <b>{currentResult.card.currentUses}/{currentResult.card.totalUses}</b>
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm text-gray-700">
                            Restantes: <b>{currentResult.card.remainingUses}</b>
                          </div>
                        )}
                        
                        {currentResult.card.message && (
                          <div className="text-xs sm:text-sm font-medium text-green-600 mt-2">
                            {currentResult.card.message}
                          </div>
                        )}
                        
                        {/* Botones de acción */}
                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                          <button
                            onClick={() => handleAction(currentResult.card.id, "increment")}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-xs sm:text-sm hover:bg-green-700 transition"
                          >
                            +1 Uso
                          </button>
                          <button
                            onClick={() => handleAction(currentResult.card.id, "decrement")}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-xs sm:text-sm hover:bg-red-700 transition"
                          >
                            -1 Uso
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Tarjeta de lote (sistema antiguo)
                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm text-gray-700">Lote: <b>{currentResult.card.batchName}</b></div>
                        <div className="text-xs sm:text-sm text-gray-700">Usos: <b>{currentResult.card.uses}</b></div>
                        <div className="text-xs sm:text-sm text-gray-700">Estado: <b>{currentResult.card.active ? "Activa" : "Inactiva"}</b></div>
                        
                        {currentResult.card.message && (
                          <div className="text-xs sm:text-sm font-medium text-green-600 mt-2">
                            {currentResult.card.message}
                          </div>
                        )}
                        
                        {/* Botones de acción */}
                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                          <button
                            onClick={() => handleAction(currentResult.card.id, "increment")}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-xs sm:text-sm hover:bg-green-700 transition"
                          >
                            +1 Uso
                          </button>
                          <button
                            onClick={() => handleAction(currentResult.card.id, "decrement")}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-xs sm:text-sm hover:bg-red-700 transition"
                          >
                            -1 Uso
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {currentResult.type === 'error' && (
                  <div className="text-red-700 text-sm sm:text-base">
                    {currentResult.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 