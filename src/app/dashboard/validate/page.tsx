"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

let Html5Qrcode: any;
if (typeof window !== "undefined") {
  Html5Qrcode = require("html5-qrcode").Html5Qrcode;
}

export default function ValidatePage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uses, setUses] = useState<number | null>(null);
  const [showCamera, setShowCamera] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const html5QrRef = useRef<any>(null);
  const qrRegionId = "qr-reader-region";

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
          if (!loading) {
            setShowCamera(false);
            setInput(decodedText);
            handleValidate(decodedText);
            if (qr && typeof qr.stop === "function") {
              try { qr.stop(); } catch {}
            }
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
    setError(null);
    setResult(null);
    setUses(null);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash: (hash ?? input).trim() })
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "No válida");
      } else {
        setResult(data.card);
        setUses(data.card.uses);
      }
    } catch {
      setError("Error de red");
    }
    setLoading(false);
  };

  const handleAction = async (action: "add" | "sub") => {
    if (!result) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/validate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: result.id, action })
      });
      const data = await res.json();
      if (data.ok) setUses(data.uses);
      else setError(data.error || "Error");
    } catch {
      setError("Error de red");
    }
    setLoading(false);
  };

  const reset = () => {
    setInput("");
    setResult(null);
    setError(null);
    setUses(null);
    setShowCamera(true);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded shadow p-8 w-full max-w-md flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Validar QR</h2>
        {!result && !error && (
          <>
            <p className="mb-4 text-gray-700 text-center">Escanea el QR de una tarjeta o pega el código aquí.</p>
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
                  className="w-full border rounded px-2 py-2 mb-2 text-lg"
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
          </>
        )}
        {error && (
          <div className="w-full text-center mt-6">
            <div className="text-3xl mb-2 text-red-600">❌</div>
            <div className="text-lg font-bold text-red-700 mb-2">Tarjeta NO válida</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button className="w-full py-2 px-4 bg-gray-200 rounded hover:bg-gray-300" onClick={reset}>Escanear otro</button>
          </div>
        )}
        {result && (
          <div className="w-full text-center mt-6">
            <div className="text-3xl mb-2 text-green-600">✅</div>
            <div className="text-lg font-bold text-green-700 mb-2">Tarjeta válida</div>
            <div className="mb-2">
              <span className="font-mono text-xl">{result.code}</span>
            </div>
            <div className="mb-2 text-gray-700">Lote: <b>{result.batch.name}</b></div>
            <div className="mb-2 text-gray-700">Estado: <b>{result.active ? "Activa" : "Inactiva"}</b></div>
            <div className="mb-2 text-gray-700">Usos restantes: <b>{uses === null ? "∞" : uses}</b></div>
            {result.template?.imageUrl && (
              <div className="my-4 flex justify-center">
                <img src={result.template.imageUrl} alt="Plantilla" className="h-24 rounded shadow" />
              </div>
            )}
            {uses !== null && (
              <div className="flex justify-center gap-4 my-4">
                <button
                  className="bg-blue-600 text-white px-6 py-2 rounded text-lg hover:bg-blue-700"
                  onClick={() => handleAction("sub")}
                  disabled={loading || uses === 0}
                >
                  -1
                </button>
                <button
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded text-lg hover:bg-gray-300"
                  onClick={() => handleAction("add")}
                  disabled={loading}
                >
                  +1
                </button>
              </div>
            )}
            <button className="w-full py-2 px-4 bg-gray-200 rounded hover:bg-gray-300 mt-4" onClick={reset}>Escanear otro</button>
          </div>
        )}
      </div>
    </main>
  );
} 