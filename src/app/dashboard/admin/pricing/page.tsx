"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PricingPlan, PlanType } from '@prisma/client';
import { formatPrice } from '@/lib/stripe';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface PricingPlanForm {
  name: string;
  description: string;
  type: PlanType;
  price: number;
  currency: string;
  features: string[];
  maxBatches: number | null;
  maxCards: number | null;
  duration: number | null;
  active: boolean;
}

export default function AdminPricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<PricingPlanForm>({
    name: '',
    description: '',
    type: 'ONE_TIME',
    price: 0,
    currency: 'EUR',
    features: [''],
    maxBatches: null,
    maxCards: null,
    duration: null,
    active: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/pricing/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'ONE_TIME',
      price: 0,
      currency: 'EUR',
      features: [''],
      maxBatches: null,
      maxCards: null,
      duration: null,
      active: true,
    });
    setEditingPlan(null);
    setShowCreateForm(false);
  };

  const loadPlanToEdit = (plan: PricingPlan) => {
    setFormData({
      name: plan.name,
      description: plan.description || '',
      type: plan.type,
      price: plan.price,
      currency: plan.currency,
      features: plan.features as string[],
      maxBatches: plan.maxBatches,
      maxCards: plan.maxCards,
      duration: plan.duration,
      active: plan.active,
    });
    setEditingPlan(plan.id);
    setShowCreateForm(true);
  };

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p>Cargando administración...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Administrar Precios
            </h1>
            <p className="text-gray-600 mt-2">
              Gestiona los planes de precios y sus características
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Plan
          </button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Plan
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ej: Plan Pro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Plan
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as PlanType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ONE_TIME">Pago Único</option>
                      <option value="SUBSCRIPTION">Suscripción</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descripción del plan..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moneda
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="MXN">MXN ($)</option>
                    </select>
                  </div>
                  {formData.type === 'SUBSCRIPTION' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duración (días)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.duration || ''}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo de Lotes (vacío = ilimitado)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxBatches || ''}
                      onChange={(e) => setFormData({ ...formData, maxBatches: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo de Tarjetas (vacío = ilimitado)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxCards || ''}
                      onChange={(e) => setFormData({ ...formData, maxCards: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Características
                  </label>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ej: Hasta 100 tarjetas"
                        />
                        {formData.features.length > 1 && (
                          <button
                            onClick={() => removeFeature(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addFeature}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Añadir característica
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700">
                    Plan activo
                  </label>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      // Aquí implementarías la lógica para guardar
                      console.log('Saving plan:', formData);
                      resetForm();
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPlan ? 'Actualizar' : 'Crear'} Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plans List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => loadPlanToEdit(plan)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(plan.price, plan.currency as any)}
                </span>
                <span className="text-gray-600 ml-1">
                  {plan.type === 'SUBSCRIPTION' ? '/suscripción' : '/único'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium">
                    {plan.type === 'SUBSCRIPTION' ? 'Suscripción' : 'Pago único'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lotes máx:</span>
                  <span className="font-medium">
                    {plan.maxBatches || 'Ilimitado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tarjetas máx:</span>
                  <span className="font-medium">
                    {plan.maxCards || 'Ilimitado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`font-medium ${plan.active ? 'text-green-600' : 'text-red-600'}`}>
                    {plan.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-2">Características:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {(plan.features as string[]).slice(0, 3).map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                  {(plan.features as string[]).length > 3 && (
                    <li>• Y {(plan.features as string[]).length - 3} más...</li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}