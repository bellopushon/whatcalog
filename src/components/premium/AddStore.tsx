import React, { useState } from 'react';
import { ArrowLeft, Store, Package, Palette, BarChart3, Headphones, X, Plus } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { generateId } from '../../utils/constants';

export default function AddStore() {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const { state, dispatch } = useStore();
  const { success, error } = useToast();

  // Updated logic for new plans
  const canCreateStore = () => {
    const userPlan = state.user?.plan || 'gratuito';
    const currentStoreCount = state.stores.length;
    
    switch (userPlan) {
      case 'gratuito':
        return currentStoreCount < 1;
      case 'emprendedor':
        return currentStoreCount < 2;
      case 'profesional':
        return currentStoreCount < 5;
      default:
        return false;
    }
  };

  const getMaxStores = () => {
    const userPlan = state.user?.plan || 'gratuito';
    switch (userPlan) {
      case 'gratuito': return 1;
      case 'emprendedor': return 2;
      case 'profesional': return 5;
      default: return 1;
    }
  };

  const premiumFeatures = [
    {
      icon: Store,
      title: 'Múltiples Tiendas',
      description: 'Crea hasta 5 tiendas diferentes con catálogos únicos'
    },
    {
      icon: Package,
      title: 'Más Productos y Categorías',
      description: 'Hasta 50 productos por tienda con categorías ilimitadas'
    },
    {
      icon: Palette,
      title: 'Personalización Avanzada',
      description: 'Colores personalizados y sin marca de agua'
    },
    {
      icon: BarChart3,
      title: 'Analíticas Completas',
      description: 'Estadísticas avanzadas con filtros detallados'
    },
    {
      icon: Headphones,
      title: 'Soporte Prioritario',
      description: 'Soporte técnico prioritario con respuesta rápida'
    },
  ];

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-generate slug when name changes
      if (name === 'name') {
        newData.slug = generateSlug(value);
      }
      
      return newData;
    });
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      error('Error de validación', 'El nombre de la tienda es requerido');
      return;
    }

    if (!formData.slug.trim()) {
      error('Error de validación', 'La URL amigable es requerida');
      return;
    }

    // Check if slug already exists
    const slugExists = state.stores.some(store => store.slug === formData.slug);
    if (slugExists) {
      error('URL en uso', 'Esta URL ya está en uso. Por favor elige otra.');
      return;
    }

    setIsCreating(true);

    try {
      const newStore = {
        id: generateId(),
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || 'Catálogo de productos',
        whatsapp: '',
        currency: 'USD',
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        theme: {
          colorPalette: 'predeterminado',
          mode: 'light' as const,
          borderRadius: 8,
          productsPerPage: 12,
        },
        socialMedia: {
          showInCatalog: true,
        },
        paymentMethods: {
          cash: true,
          bankTransfer: false,
        },
        shippingMethods: {
          pickup: true,
          delivery: false,
        },
        products: [],
        categories: [],
        createdAt: new Date().toISOString(),
      };

      // Add the new store to the stores array
      const updatedStores = [...state.stores, newStore];
      dispatch({ type: 'SET_STORES', payload: updatedStores });
      dispatch({ type: 'SET_CURRENT_STORE', payload: newStore });

      success('¡Tienda creada exitosamente!', 'Tu nueva tienda está lista para configurar');
      setShowCreateForm(false);
      setFormData({ name: '', slug: '', description: '' });
    } catch (err) {
      console.error('Error creating store:', err);
      error('Error al crear tienda', 'No se pudo crear la tienda. Intenta de nuevo.');
    } finally {
      setIsCreating(false);
    }
  };

  // Show create form for users who can create stores
  if (canCreateStore() && showCreateForm) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCreateForm(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crear Nueva Tienda</h1>
            <p className="text-gray-600 mt-1">Configura tu nueva tienda online</p>
          </div>
        </div>

        {/* Create Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleCreateStore} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Tienda *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Mi Tienda Increíble"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Amigable *
              </label>
              <div className="flex items-center">
                <span className="bg-gray-100 px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-600">
                  tutaviendo.com/store/
                </span>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="mi-tienda"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Solo letras minúsculas, números y guiones. Ejemplo: mi-tienda-online
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Breve descripción de tu tienda"
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/160 caracteres
              </p>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                disabled={isCreating}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Crear Tienda
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show create button for users who can create stores
  if (canCreateStore()) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Añadir Nueva Tienda</h1>
          <p className="text-gray-600 mt-1">Crea tu tienda online y empieza a vender</p>
        </div>

        {/* Create Store Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10 text-indigo-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {state.stores.length === 0 ? 'Crea tu Primera Tienda' : 'Añadir Nueva Tienda'}
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {state.stores.length === 0 
                ? 'Configura tu tienda online y empieza a vender tus productos'
                : 'Expande tu negocio con una nueva tienda'
              }
            </p>

            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Crear Tienda
            </button>
          </div>
        </div>

        {/* Current Stores */}
        {state.stores.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tus Tiendas</h3>
            <div className="space-y-3">
              {state.stores.map(store => (
                <div key={store.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{store.name}</h4>
                    <p className="text-sm text-gray-600">/{store.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {store.products?.length || 0} productos
                    </span>
                    {state.currentStore?.id === store.id && (
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                        Actual
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show upgrade message for users who have reached their limit
  const userPlan = state.user?.plan || 'gratuito';
  const maxStores = getMaxStores();
  const planNames = {
    gratuito: 'Gratis',
    emprendedor: 'Emprendedor',
    profesional: 'Profesional'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Añadir Nueva Tienda</h1>
        <p className="text-gray-600 mt-1">Expande tu negocio con múltiples catálogos</p>
      </div>

      {/* Locked State */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          {/* Lock Icon */}
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-gray-400" />
          </div>

          {/* Main Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Has alcanzado el límite de tiendas de tu plan {planNames[userPlan]}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            ¡Actualiza para seguir expandiendo tu negocio!
          </p>

          {/* Current Plan Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8 max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Plan Actual</p>
                <p className="text-2xl font-bold text-gray-900">{planNames[userPlan]}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Tiendas</p>
                <p className="text-lg font-semibold text-gray-900">{state.stores.length} / {maxStores}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowPremiumModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all transform hover:scale-105"
            >
              Ver Planes y Precios →
            </button>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium transition-colors">
              Quizás Más Tarde
            </button>
          </div>
        </div>
      </div>

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">¡Más Espacio para Crecer!</h2>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Desbloquea todo el potencial de Tutaviendo con nuestros planes de pago
              </p>
            </div>

            {/* Features List */}
            <div className="p-6">
              <div className="space-y-4 mb-8">
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                    <div className="text-green-500 flex-shrink-0">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              {/* Plans Comparison - FIXED CONTRAST */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compara los Planes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Plan Emprendedor</h4>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">$4.99/mes</div>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Hasta 2 tiendas</li>
                      <li>• 30 productos por tienda</li>
                      <li>• Analíticas avanzadas</li>
                    </ul>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-indigo-200 dark:border-indigo-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Plan Profesional</h4>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">$9.99/mes</div>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Hasta 5 tiendas</li>
                      <li>• 50 productos por tienda</li>
                      <li>• Analíticas completas</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/subscription"
                  onClick={() => setShowPremiumModal(false)}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-6 rounded-lg font-medium transition-all text-center"
                >
                  Ver Planes y Precios
                </a>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Quizás Más Tarde
                </button>
              </div>

              {/* Guarantee */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  💰 Garantía de devolución de 30 días • 🔒 Pago seguro con SSL
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
