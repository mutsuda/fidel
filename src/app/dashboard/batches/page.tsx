"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Batch {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  createdAt: string;
  codesCount?: number;
  codes: Code[];
  template?: {
    id: string;
    name: string;
    imageUrl: string;
  };
}

interface Code {
  id: string;
  code: string;
  hash: string;
  number: number;
}

export default function BatchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    fetchBatches();
  }, [status, router]);

  const fetchBatches = async () => {
    try {
      const response = await fetch("/api/batches");
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el lote "${batchName}"? Esta acción eliminará todas las tarjetas asociadas y no se puede deshacer.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/batches/${batchId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Refrescar la lista
        fetchBatches();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'No se pudo eliminar el lote'}`);
      }
    } catch (error) {
      console.error("Error deleting batch:", error);
      alert('Error al eliminar el lote');
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lotes de Tarjetas</h1>
          <Link
            href="/dashboard/batches/create"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Crear Nuevo Lote
          </Link>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay lotes creados</h3>
            <p className="text-gray-500 mb-6">Crea tu primer lote de tarjetas para comenzar</p>
            <Link
              href="/dashboard/batches/create"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Crear Primer Lote
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <div key={batch.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition relative group">
                {/* Iconos de acción en esquina superior derecha */}
                <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/api/batches/${batch.id}/download`}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Descargar PDF"
                  >
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBatch(batch.id, batch.name);
                    }}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition"
                    title="Eliminar lote"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Contenido clickeable */}
                <Link href={`/dashboard/batches/${batch.id}`} className="block">
                  {/* Imagen de la plantilla */}
                  {batch.template?.imageUrl && (
                    <div className="aspect-w-16 aspect-h-9 bg-gray-100 mb-4 rounded overflow-hidden flex items-center justify-center">
                      <img
                        src={batch.template.imageUrl}
                        alt={batch.template.name || "Plantilla"}
                        className="object-contain w-full h-32"
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{batch.name}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {(typeof batch.codesCount === 'number' ? batch.codesCount : batch.codes.length)} tarjetas
                    </span>
                  </div>
                  
                  {batch.description && (
                    <p className="text-gray-600 text-sm mb-4">{batch.description}</p>
                  )}
                  
                  <div className="text-sm text-gray-500">
                    Creado: {new Date(batch.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 