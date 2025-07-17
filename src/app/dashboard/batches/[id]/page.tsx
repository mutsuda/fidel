"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Card {
  id: string;
  code: string;
  lastValidated: string | null;
  active?: boolean;
}

interface Batch {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  codes: Card[];
}

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) return;
    setLoading(true);
    fetch(`/api/batches/${batchId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setBatch(data);
        setLoading(false);
      })
      .catch(err => {
        setError("Error cargando lote");
        setLoading(false);
      });
  }, [batchId]);

  const revokeCard = async (cardId: string) => {
    setRevoking(cardId);
    const res = await fetch(`/api/batches/${batchId}?cardId=${cardId}`, { method: "DELETE" });
    if (res.ok) {
      setBatch(batch => batch ? { ...batch, codes: batch.codes.filter(c => c.id !== cardId) } : batch);
    }
    setRevoking(null);
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!batch) return <div>No encontrado</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1>Lote: {batch.name}</h1>
      <p>{batch.description}</p>
      <p>Creado: {new Date(batch.createdAt).toLocaleString()}</p>
      <h2>Tarjetas activas</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc" }}>ID</th>
            <th style={{ borderBottom: "1px solid #ccc" }}>Código</th>
            <th style={{ borderBottom: "1px solid #ccc" }}>Última validación</th>
            <th style={{ borderBottom: "1px solid #ccc" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {batch.codes.length === 0 && (
            <tr><td colSpan={4}>No hay tarjetas activas</td></tr>
          )}
          {batch.codes.map(card => (
            <tr key={card.id}>
              <td>{card.id}</td>
              <td>{card.code}</td>
              <td>{card.lastValidated ? new Date(card.lastValidated).toLocaleString() : "Nunca"}</td>
              <td>
                <button
                  onClick={() => revokeCard(card.id)}
                  disabled={revoking === card.id}
                  style={{ color: "red" }}
                >
                  {revoking === card.id ? "Revocando..." : "Desactivar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 