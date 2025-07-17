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
  const [editUses, setEditUses] = useState<{ [id: string]: string }>({});

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

  const handleUsesChange = (card: Card, value: string) => {
    setEditUses(prev => ({ ...prev, [card.id]: value }));
  };

  const handleUsesBlur = async (card: Card) => {
    const value = editUses[card.id];
    if (card.uses === null || value === undefined) return;
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed >= 0 && parsed !== card.uses) {
      setUpdating(card.id);
      const res = await fetch(`/api/batches/${batchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, setUses: parsed })
      });
      if (res.ok) {
        setBatch(batch => batch ? {
          ...batch,
          codes: batch.codes.map(c => c.id === card.id ? { ...c, uses: parsed } : c)
        } : batch);
      }
      setUpdating(null);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!batch) return <div>No encontrado</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>Lote: {batch.name}</h1>
      <p>{batch.description}</p>
      <p>Creado: {new Date(batch.createdAt).toLocaleString()}</p>
      <h2>Tarjetas</h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 60px",
        gap: 0,
        background: "#f6f8fa",
        borderRadius: 8,
        fontFamily: "monospace"
      }}>
        <div style={{ fontWeight: "bold", padding: 12, borderBottom: "2px solid #e5e7eb" }}>Código</div>
        <div style={{ fontWeight: "bold", padding: 12, borderBottom: "2px solid #e5e7eb" }}>Última validación</div>
        <div style={{ fontWeight: "bold", padding: 12, borderBottom: "2px solid #e5e7eb" }}>Usos restantes</div>
        <div style={{ fontWeight: "bold", padding: 12, borderBottom: "2px solid #e5e7eb" }}>Estado</div>
        {batch.codes.length === 0 && (
          <div style={{ gridColumn: "1 / span 4", padding: 12 }}>No hay tarjetas activas</div>
        )}
        {batch.codes.map((card, idx) => (
          <React.Fragment key={card.id}>
            <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{card.code}</div>
            <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{card.lastValidated ? new Date(card.lastValidated).toLocaleString() : "Nunca"}</div>
            <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>
              {card.uses === null ? (
                <span title="Ilimitado">∞</span>
              ) : (
                <input
                  type="number"
                  min={0}
                  value={editUses[card.id] !== undefined ? editUses[card.id] : (card.uses ?? 0)}
                  onChange={e => handleUsesChange(card, e.target.value)}
                  onBlur={() => handleUsesBlur(card)}
                  disabled={updating === card.id}
                  style={{ width: 60, textAlign: "right", fontFamily: "monospace", border: "1px solid #ccc", borderRadius: 4, padding: "2px 4px" }}
                />
              )}
            </div>
            <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", textAlign: "center", cursor: "pointer" }}
              onClick={() => toggleActive(card)}
              title={card.active ? "Desactivar" : "Activar"}
            >
              {card.active ? <span style={{ fontSize: 20 }}>✅</span> : <span style={{ fontSize: 20 }}>❌</span>}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
} 