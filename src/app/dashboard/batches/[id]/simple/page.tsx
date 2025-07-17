"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Batch {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  templateId: string;
  userId: string;
  createdAt: string;
}

export default function SimpleBatchDetailPage() {
  const params = useParams();
  const batchId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) return;
    setLoading(true);
    fetch(`/api/batches/${batchId}/simple`)
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

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!batch) return <div>No encontrado</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>Lote: {batch.name}</h1>
      <p>{batch.description}</p>
      <p>Cantidad: {batch.quantity} tarjetas</p>
      <p>Creado: {new Date(batch.createdAt).toLocaleString()}</p>
      <p>Template ID: {batch.templateId}</p>
      <p>User ID: {batch.userId}</p>
      
      <div style={{ marginTop: 20, padding: 16, backgroundColor: "#f0f8ff", borderRadius: 8 }}>
        <h3>✅ API Simple Funciona</h3>
        <p>Esta página usa la API simple que sabemos que funciona correctamente.</p>
        <p>El problema está en la API compleja con includes anidados.</p>
      </div>
    </div>
  );
} 