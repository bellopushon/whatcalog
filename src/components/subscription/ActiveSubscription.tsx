import React, { useState } from 'react';
import { ArrowLeft, Crown, Calendar, CreditCard, Download, AlertTriangle, Check, X } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import DowngradeWarningModal from './DowngradeWarningModal';

export default function ActiveSubscription() {
  const { state, dispatch } = useStore();
  const { success, error } = useToast();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDowngradeWarning, setShowDowngradeWarning] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const user = state.user;
  const subscriptionEndDate = user?.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;
  const daysRemaining = subscriptionEndDate ? Math.ceil((subscriptionEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const handleCancelSubscription = async () => {
    // Check if user will exceed store limits after cancellation
    const currentStoreCount = state.stores.length;
    const maxStoresAfterCancel = 1; // Free plan allows only 1 store
    
    if (currentStoreCount > maxStoresAfterCancel) {
      setShowCancelModal(false);
      setShowDowngradeWarning(true);
      return;
    }

    // Proceed with normal cancellation
    await processCancellation();
  };

  const processCancellation = async () => {
    setIsCanceling(true);
    
    try {
      // Simulate cancellation process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updatedUser = {
        ...user,
        subscriptionStatus: 'canceled',
        subscriptionCanceledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'SET_USER', payload: updatedUser });
      
      success(
        'Suscripción cancelada',
        'Tu suscripción se cancelará al final del período actual. Mantienes acceso hasta entonces.'
      );
      
      setShowCancelModal(false);
      setShowDowngradeWarning(false);
    } catch (err) {
      console.error('Cancellation error:', err);
      error('Error al cancelar', 'No se pudo cancelar la suscripción. Intenta de nuevo.');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleReactivate = async () => {
    try {
      const updatedUser = {
        ...user,
        subscriptionStatus: 'active',
        subscriptionCanceledAt: undefined,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'SET_USER', payload: updatedUser });
      
      success(
        '¡Suscripción reactivada!',
        'Tu suscripción ha sido reactivada exitosamente.'
      );
    } catch (err) {
      error('Error al reactivar', 'No se pudo reactivar la suscripción. Intenta de nuevo.');
    }
  };

  const isCanceled = user?.subscriptionStatus === 'canceled';
  const planName = user?.plan === 'emprendedor' ? 'Emprendedor' : user?.plan === 'profesional' ? 'Profesional' : 'Premium';
  const planPrice = user?.plan === 'emprendedor' ? '4.99' : user?.plan === 'profesional' ? '9.99' : '19';

  // Get plan limits based on current plan
  const getPlanLimits = () => {
    switch (user?.plan) {
      case 'emprendedor':
        return { stores: 2, products: 30, categories: 'ilimitadas' };
      case 'profesional':
        return { stores: 5, products: 50, categories: 'ilimitadas' };
      default:
        return { stores: 10, products: 'ilimitados', categories: 'ilimitadas' };
    }
  };

  const limits = getPlanLimits();

  return (
    <div className="min-h-screen bg-gray-50 admin-dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white admin-dark:bg-gray-800 border-b border-gray-200 admin-dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-900 admin-dark:text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 admin-dark:text-white">Mi Suscripción</h1>
              <p className="text-gray-600 admin-dark:text-gray-300 mt-1">Gestiona tu plan {planName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Subscription Status */}
        <div className={`rounded-2xl shadow-lg border-2 p-6 lg:p-8 mb-8 ${
          isCanceled 
            ? 'bg-orange-50 admin-dark:bg-orange-900/20 border-orange-200 admin-dark:border-orange-800'
            : 'bg-gradient-to-r from-indigo-50 to-purple-50 admin-dark:from-indigo-900/20 admin-dark:to-purple-900/20 border-indigo-200 admin-dark:border-indigo-800'
        }`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isCanceled 
                ? 'bg-orange-100 admin-dark:bg-orange-900'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500'
            }`}>
              {isCanceled ? (
                <AlertTriangle className="w-8 h-8 text-orange-600 admin-dark:text-orange-400" />
              ) : (
                <Crown className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                isCanceled 
                  ? 'text-orange-800 admin-dark:text-orange-200'
                  : 'text-indigo-800 admin-dark:text-indigo-200'
              }`}>
                Plan {planName} {isCanceled ? '(Cancelado)' : '(Activo)'}
              </h2>
              <p className={`text-lg ${
                isCanceled 
                  ? 'text-orange-700 admin-dark:text-orange-300'
                  : 'text-indigo-700 admin-dark:text-indigo-300'
              }`}>
                {isCanceled 
                  ? `Acceso hasta ${subscriptionEndDate?.toLocaleDateString('es-ES')}`
                  : `${daysRemaining} días restantes en este período`
                }
              </p>
            </div>
          </div>

          {isCanceled && (
            <div className="bg-white admin-dark:bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 admin-dark:text-white">¿Cambiaste de opinión?</h3>
                  <p className="text-sm text-gray-600 admin-dark:text-gray-300">
                    Puedes reactivar tu suscripción en cualquier momento
                  </p>
                </div>
                <button
                  onClick={handleReactivate}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all"
                >
                  Reactivar
                </button>
              </div>
            </div>
          )}

          {/* Upgrade Option for Emprendedor users */}
          {!isCanceled && user?.plan === 'emprendedor' && (
            <div className="bg-white admin-dark:bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 admin-dark:text-white">¿Necesitas más tiendas?</h3>
                  <p className="text-sm text-gray-600 admin-dark:text-gray-300">
                    Actualiza al plan Profesional y obtén hasta 5 tiendas
                  </p>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium transition-all"
                >
                  Actualizar Plan
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 admin-dark:text-white">{limits.stores}</div>
              <div className="text-sm text-gray-600 admin-dark:text-gray-300">Tiendas máximas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 admin-dark:text-white">{limits.products}</div>
              <div className="text-sm text-gray-600 admin-dark:text-gray-300">Productos por tienda</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 admin-dark:text-white">∞</div>
              <div className="text-sm text-gray-600 admin-dark:text-gray-300">Categorías por tienda</div>
            </div>
          </div>
        </div>

        {/* Billing Information and Usage Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Billing Information */}
          <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-6">Información de Facturación</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 admin-dark:text-gray-300">Plan</span>
                <span className="font-medium text-gray-900 admin-dark:text-white">{planName}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 admin-dark:text-gray-300">Precio</span>
                <span className="font-medium text-gray-900 admin-dark:text-white">${planPrice}/mes</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 admin-dark:text-gray-300">Próxima facturación</span>
                <span className="font-medium text-gray-900 admin-dark:text-white">
                  {subscriptionEndDate?.toLocaleDateString('es-ES')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 admin-dark:text-gray-300">Método de pago</span>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900 admin-dark:text-white">
                    {user?.paymentMethod === 'paypal' ? 'PayPal' : '•••• 1234'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 admin-dark:text-gray-300">Estado</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isCanceled
                    ? 'bg-orange-100 admin-dark:bg-orange-900 text-orange-800 admin-dark:text-orange-200'
                    : 'bg-green-100 admin-dark:bg-green-900 text-green-800 admin-dark:text-green-200'
                }`}>
                  {isCanceled ? 'Cancelado' : 'Activo'}
                </span>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-6">Uso Actual</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 admin-dark:text-gray-300">Tiendas</span>
                  <span className="font-medium text-gray-900 admin-dark:text-white">
                    {state.stores.length} / {limits.stores}
                  </span>
                </div>
                <div className="w-full bg-gray-200 admin-dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${Math.min((state.stores.length / limits.stores) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 admin-dark:text-gray-300">Productos (promedio por tienda)</span>
                  <span className="font-medium text-gray-900 admin-dark:text-white">
                    {Math.round(state.stores.reduce((total, store) => total + (store.products?.length || 0), 0) / Math.max(state.stores.length, 1))} / {limits.products}
                  </span>
                </div>
                {typeof limits.products === 'number' ? (
                  <div className="w-full bg-gray-200 admin-dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${Math.min((Math.round(state.stores.reduce((total, store) => total + (store.products?.length || 0), 0) / Math.max(state.stores.length, 1)) / limits.products) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600 admin-dark:text-green-400">
                    <Check className="w-4 h-4" />
                    <span>Ilimitados</span>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 admin-dark:text-gray-300">Categorías</span>
                  <span className="font-medium text-gray-900 admin-dark:text-white">Ilimitadas</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 admin-dark:text-green-400">
                  <Check className="w-4 h-4" />
                  <span>Sin límites</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Download Invoice */}
          <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-4">Facturas</h3>
            <p className="text-gray-600 admin-dark:text-gray-300 mb-4">
              Descarga tus facturas para registros contables
            </p>
            <button className="flex items-center gap-2 bg-gray-100 admin-dark:bg-gray-700 hover:bg-gray-200 admin-dark:hover:bg-gray-600 text-gray-700 admin-dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors">
              <Download className="w-4 h-4" />
              Descargar Última Factura
            </button>
          </div>

          {/* Cancel Subscription */}
          {!isCanceled && (
            <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-4">Cancelar Suscripción</h3>
              <p className="text-gray-600 admin-dark:text-gray-300 mb-4">
                Puedes cancelar en cualquier momento. Mantienes acceso hasta el final del período
              </p>
              <button 
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-2 bg-red-50 admin-dark:bg-red-900/20 hover:bg-red-100 admin-dark:hover:bg-red-900/30 text-red-600 admin-dark:text-red-400 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar Suscripción
              </button>
            </div>
          )}
        </div>

        {/* Support */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 admin-dark:from-blue-900/20 admin-dark:to-indigo-900/20 rounded-xl border border-blue-200 admin-dark:border-blue-800 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-2">
              ¿Necesitas ayuda?
            </h3>
            <p className="text-gray-600 admin-dark:text-gray-300 mb-4">
              Como usuario {planName}, tienes acceso a soporte prioritario
            </p>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Contactar Soporte Prioritario
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white admin-dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 admin-dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 admin-dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 admin-dark:text-white mb-2">
                ¿Cancelar suscripción?
              </h2>
              <p className="text-gray-600 admin-dark:text-gray-300">
                Tu suscripción se cancelará al final del período actual. Mantienes acceso hasta el {subscriptionEndDate?.toLocaleDateString('es-ES')}.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-yellow-50 admin-dark:bg-yellow-900/20 border border-yellow-200 admin-dark:border-yellow-800 rounded-lg p-3">
                <h4 className="font-medium text-yellow-800 admin-dark:text-yellow-200 mb-1">Perderás acceso a:</h4>
                <ul className="text-sm text-yellow-700 admin-dark:text-yellow-300 space-y-1">
                  <li>• Múltiples tiendas (solo 1 tienda)</li>
                  <li>• Productos adicionales</li>
                  <li>• Analíticas avanzadas</li>
                  <li>• Personalización premium</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCanceling}
                className="flex-1 px-4 py-3 border border-gray-300 admin-dark:border-gray-600 text-gray-700 admin-dark:text-gray-300 rounded-lg hover:bg-gray-50 admin-dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
              >
                Mantener {planName}
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCanceling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Cancelando...
                  </>
                ) : (
                  'Sí, Cancelar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

{/* Upgrade Modal */}
{showUpgradeModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white admin-dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 admin-dark:text-white">Actualizar Plan</h2>
        <button
          onClick={() => setShowUpgradeModal(false)}
          className="p-2 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 admin-dark:from-purple-900/30 admin-dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-purple-600 admin-dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-2">
          Actualizar a Plan Profesional
        </h3> 
        <p className="text-gray-600 admin-dark:text-gray-300">
          Obtén hasta 5 tiendas y 50 productos por tienda
        </p>
      </div>
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 admin-dark:from-gray-700 admin-dark:to-gray-700 rounded-lg p-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-white-900 admin-dark:text-yellow mb-1">$9.99/mes</div>
          <p className="text-sm text-blue-600 admin-dark:text-blue-300">
            Diferencia: +$5.00/mes
          </p> 
        </div>
      </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 admin-dark:border-gray-600 text-gray-700 admin-dark:text-gray-300 rounded-lg hover:bg-gray-50 admin-dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <a
                href="/subscription"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-colors text-center"
              >
                Actualizar Ahora
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Downgrade Warning Modal */}
      <DowngradeWarningModal
        isOpen={showDowngradeWarning}
        onClose={() => setShowDowngradeWarning(false)}
        onConfirm={processCancellation}
        currentPlan={user?.plan || 'emprendedor'}
        newPlan="gratuito"
        excessStores={state.stores.length - 1}
      />
    </div>
  );
}