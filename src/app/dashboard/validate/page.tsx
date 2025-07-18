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
  const [results, setResults] = useState<ValidationResult[]>([]);
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
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash: (hash ?? input).trim() })
      });
      const data = await res.json();
      if (!data.ok) {
        // Añadir resultado de error a la lista
        setResults(prev => [...prev, {
          id: Date.now(),
          type: 'error',
          message: data.error || "No válida",
          timestamp: new Date()
        }]);
      } else {
        // Añadir resultado exitoso a la lista
        setResults(prev => [...prev, {
          id: Date.now(),
          type: 'success',
          card: data.card,
          timestamp: new Date()
        }]);
      }
    } catch {
      setResults(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: "Error de red",
        timestamp: new Date()
      }]);
    }
    setLoading(false);
  };

  const handleAction = async (cardId: string, action: "add" | "sub") => {
    setLoading(true);
    try {
      const res = await fetch("/api/validate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, action })
      });
      const data = await res.json();
      if (data.ok) {
        // Actualizar el resultado en la lista
        setResults(prev => prev.map(result => 
          result.type === 'success' && result.card?.id === cardId 
            ? { ...result, card: { ...result.card, uses: data.uses } }
            : result
        ));
      }
    } catch {
      // Error silencioso para no interrumpir el flujo
    }
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
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
              onClick={clearResults}
              className="w-full py-2 px-4 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Limpiar historial
            </button>
          </div>

          {/* Panel derecho - Resultados */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Resultados</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Escanea una tarjeta para ver los resultados</p>
              ) : (
                results.map((result) => (
                  <div key={result.id} className={`border rounded-lg p-4 ${result.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{result.type === 'success' ? '✅' : '❌'}</span>
                        <span className={`font-semibold ${result.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                          {result.type === 'success' ? 'Válida' : 'No válida'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {result.type === 'success' && result.card && (
                      <div className="space-y-2">
                        <div className="font-mono text-lg">{result.card.code}</div>
                        <div className="text-sm text-gray-700">Lote: <b>{result.card.batch.name}</b></div>
                        <div className="text-sm text-gray-700">Estado: <b>{result.card.active ? "Activa" : "Inactiva"}</b></div>
                        <div className="text-sm text-gray-700">Usos: <b>{result.card.uses === null ? "∞" : result.card.uses}</b></div>
                        
                        {result.card.uses !== null && (
                          <div className="flex gap-2 mt-3">
                            <button
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                              onClick={() => handleAction(result.card.id, "sub")}
                              disabled={loading || result.card.uses === 0}
                            >
                              -1
                            </button>
                            <button
                              className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300"
                              onClick={() => handleAction(result.card.id, "add")}
                              disabled={loading}
                            >
                              +1
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {result.type === 'error' && (
                      <div className="text-sm text-red-700">{result.message}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 