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
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Panel izquierdo - Cámara y input */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 text-blue-700">Validar QR</h2>
            <p className="mb-4 text-gray-700">Escanea el QR de una tarjeta o pega el código aquí.</p>
            
            {showCamera && (
              <div className="w-full flex flex-col items-center mb-4">
                <div id={qrRegionId} className="w-64 h-64 bg-gray-100 rounded flex items-center justify-center text-gray-400 mb-2 overflow-hidden border-4 border-blue-300 shadow-inner" />
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
                  className="w-full border rounded px-3 py-2 mb-2 text-lg"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleValidate()}
                  autoFocus
                  disabled={loading}
                />
                <button
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-lg mb-2"
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
              className="w-full py-2 px-4 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Limpiar resultado
            </button>
          </div>

          {/* Panel derecho - Resultado actual */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Última tarjeta escaneada</h3>
            <div className="min-h-64">
              {!currentResult ? (
                <p className="text-gray-500 text-center py-8">Escanea una tarjeta para ver el resultado</p>
              ) : (
                <div className={`border rounded-lg p-4 ${currentResult.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{currentResult.type === 'success' ? '✅' : '❌'}</span>
                      <span className={`font-semibold ${currentResult.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                        {currentResult.type === 'success' ? 'Válida' : 'No válida'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {currentResult.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {currentResult.type === 'success' && currentResult.card && (
                    <div className="space-y-2">
                      <div className="font-mono text-lg">{currentResult.card.code}</div>
                      
                      {/* Mostrar información según el tipo de tarjeta */}
                      {currentResult.card.customer ? (
                        // Tarjeta de cliente (nuevo sistema)
                        <div>
                          <div className="text-sm text-gray-700">Cliente: <b>{currentResult.card.customer.name}</b></div>
                          <div className="text-sm text-gray-700">Email: <b>{currentResult.card.customer.email}</b></div>
                          <div className="text-sm text-gray-700">Tipo: <b>{currentResult.card.type === 'FIDELITY' ? 'Fidelidad' : 'Prepago'}</b></div>
                          <div className="text-sm text-gray-700">Estado: <b>{currentResult.card.active ? "Activa" : "Inactiva"}</b></div>
                          
                          {currentResult.card.type === 'FIDELITY' ? (
                            <div className="text-sm text-gray-700">
                              Progreso: <b>{currentResult.card.currentUses}/{currentResult.card.totalUses}</b>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-700">
                              Restantes: <b>{currentResult.card.remainingUses}</b>
                            </div>
                          )}
                          
                          {currentResult.card.message && (
                            <div className="text-sm font-medium text-green-600 mt-2">
                              {currentResult.card.message}
                            </div>
                          )}
                          
                          {/* Botones de acción para tarjetas de cliente */}
                          <div className="flex gap-2 mt-3">
                            {currentResult.card.type === 'FIDELITY' ? (
                              <>
                                <button
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                  onClick={() => handleAction(currentResult.card.id, "increment")}
                                  disabled={loading}
                                >
                                  +1 Café
                                </button>
                                {currentResult.card.currentUses > 0 && (
                                  <button
                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                    onClick={() => handleAction(currentResult.card.id, "decrement")}
                                    disabled={loading}
                                  >
                                    -1 Café
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <button
                                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                  onClick={() => handleAction(currentResult.card.id, "decrement")}
                                  disabled={loading || (currentResult.card.remainingUses || 0) <= 0}
                                >
                                  Usar 1
                                </button>
                                <button
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                  onClick={() => handleAction(currentResult.card.id, "increment")}
                                  disabled={loading}
                                >
                                  +1 Uso
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Tarjeta de lote (sistema antiguo)
                        <div>
                          <div className="text-sm text-gray-700">Lote: <b>{currentResult.card.batch.name}</b></div>
                          <div className="text-sm text-gray-700">Estado: <b>{currentResult.card.active ? "Activa" : "Inactiva"}</b></div>
                          <div className="text-sm text-gray-700">Usos: <b>{currentResult.card.uses === null ? "∞" : currentResult.card.uses}</b></div>
                          
                          {currentResult.card.uses !== null && (
                            <div className="flex gap-2 mt-3">
                                                          <button
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                              onClick={() => handleAction(currentResult.card.id, "decrement")}
                              disabled={loading || currentResult.card.uses === 0}
                            >
                              -1
                            </button>
                            <button
                              className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300"
                              onClick={() => handleAction(currentResult.card.id, "increment")}
                              disabled={loading}
                            >
                              +1
                            </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {currentResult.type === 'error' && (
                    <div className="text-sm text-red-700">{currentResult.message}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 