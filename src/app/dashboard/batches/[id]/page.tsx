"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Card {
  id: string;
  code: string;
  lastValidated: string | null;
  active: boolean;
  uses: number | null;
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
  const batchId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

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
      .catch(() => {
        setError("Error cargando lote");
        setLoading(false);
      });
  }, [batchId]);

  const toggleActive = async (card: Card) => {
    setUpdating(card.id);
    const res = await fetch(`/api/batches/${batchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, active: !card.active })
    });
    if (res.ok) {
      setBatch(batch => batch ? {
        ...batch,
        codes: batch.codes.map(c => c.id === card.id ? { ...c, active: !c.active } : c)
      } : batch);
    }
    setUpdating(null);
  };

  function decrementUsesValue(uses: number | null): number | null {
    if (uses === null) return null;
    return Math.max(0, uses - 1);
  }

  const incrementUses = async (card: Card) => {
    setUpdating(card.id);
    const res = await fetch(`/api/batches/${batchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, incrementUses: true })
    });
    if (res.ok) {
      setBatch(batch => batch ? {
        ...batch,
        codes: batch.codes.map(c => c.id === card.id ? { ...c, uses: c.uses + 1 } : c)
      } : batch);
    }
    setUpdating(null);
  };

  const decrementUses = async (card: Card) => {
    setUpdating(card.id);
    const res = await fetch(`/api/batches/${batchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, decrementUses: true })
    });
    if (res.ok) {
      setBatch(batch => batch ? {
        ...batch,
        codes: batch.codes.map(c =>
          c.id === card.id
            ? { ...c, uses: decrementUsesValue(c.uses) }
            : c
        )
      } : batch);
    }
    setUpdating(null);
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!batch) return <div>No encontrado</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>Lote: {batch.name}</h1>
      <p>{batch.description}</p>
      <p>Creado: {new Date(batch.createdAt).toLocaleString()}</p>
      <h2>Tarjetas activas</h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: 12,
        background: "#f6f8fa",
        borderRadius: 8,
        padding: 12,
        fontFamily: "monospace"
      }}>
        <div style={{ fontWeight: "bold" }}>Código</div>
        <div style={{ fontWeight: "bold" }}>Última validación</div>
        <div style={{ fontWeight: "bold" }}>Usos restantes</div>
        <div style={{ fontWeight: "bold" }}>Activo</div>
        {batch.codes.length === 0 && (
          <div style={{ gridColumn: "1 / span 4" }}>No hay tarjetas activas</div>
        )}
        {batch.codes.map(card => (
          <React.Fragment key={card.id}>
            <div>{card.code}</div>
            <div>{card.lastValidated ? new Date(card.lastValidated).toLocaleString() : "Nunca"}</div>
            <div>
              {card.uses === null ? "∞" : card.uses}
              <button
                onClick={() => decrementUses(card)}
                disabled={updating === card.id || !card.active || (card.uses !== null && card.uses <= 0)}
                style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 4, border: "1px solid #ccc", background: "#fff" }}
                title="Restar uso"
              >
                -1
              </button>
            </div>
            <div>
              <input
                type="checkbox"
                checked={card.active}
                onChange={() => toggleActive(card)}
                disabled={updating === card.id}
              />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
} 