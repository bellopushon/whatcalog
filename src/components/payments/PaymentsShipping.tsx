import React, { useState } from 'react';
import { CreditCard, Truck, Store, DollarSign } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';

export default function PaymentsShipping() {
  const { state, dispatch } = useStore();
  const { success } = useToast();
  const store = state.currentStore;

  const [paymentMethods, setPaymentMethods] = useState({
    cash: store?.paymentMethods?.cash ?? true,
    bankTransfer: store?.paymentMethods?.bankTransfer ?? false,
    bankDetails: store?.paymentMethods?.bankDetails || '',
  });

  const [shippingMethods, setShippingMethods] = useState({
    pickup: store?.shippingMethods?.pickup ?? true,
    delivery: store?.shippingMethods?.delivery ?? false,
    deliveryCost: store?.shippingMethods?.deliveryCost || 0,
    deliveryZone: store?.shippingMethods?.deliveryZone || '',
  });

  const handlePaymentChange = (field: string, value: any) => {
    const updatedMethods = { ...paymentMethods, [field]: value };
    setPaymentMethods(updatedMethods);
    
    dispatch({
      type: 'UPDATE_STORE',
      payload: {
        paymentMethods: updatedMethods
      }
    });

    // Show success notification for immediate feedback
    success('¡Configuración actualizada!', 'Los cambios se han guardado automáticamente');
  };

  const handleShippingChange = (field: string, value: any) => {
    const updatedMethods = { ...shippingMethods, [field]: value };
    setShippingMethods(updatedMethods);
    
    dispatch({
      type: 'UPDATE_STORE',
      payload: {
        shippingMethods: updatedMethods
      }
    });

    // Show success notification for immediate feedback
    success('¡Configuración actualizada!', 'Los cambios se han guardado automáticamente');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 admin-dark:text-white">Pagos y Envíos</h1>
        <p className="text-gray-600 admin-dark:text-gray-300 mt-1">Configure los métodos de pago y entrega</p>
      </div>

      {/* Payment Methods */}
      <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-6 h-6 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white">Métodos de Pago</h2>
        </div>

        <div className="space-y-6">
          {/* Cash Payment */}
          <div className="flex items-center justify-between p-4 border border-gray-200 admin-dark:border-gray-600 rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-green-500" />
              <div>
                <h3 className="font-medium text-gray-900 admin-dark:text-white">Efectivo</h3>
                <p className="text-sm text-gray-600 admin-dark:text-gray-300">Pago en efectivo al momento de la entrega</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={paymentMethods.cash}
                onChange={(e) => handlePaymentChange('cash', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 admin-dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Bank Transfer */}
          <div className="border border-gray-200 admin-dark:border-gray-600 rounded-lg">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="font-medium text-gray-900 admin-dark:text-white">Transferencia Bancaria</h3>
                  <p className="text-sm text-gray-600 admin-dark:text-gray-300">Pago mediante transferencia bancaria</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentMethods.bankTransfer}
                  onChange={(e) => handlePaymentChange('bankTransfer', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 admin-dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {paymentMethods.bankTransfer && (
              <div className="px-4 pb-4 border-t border-gray-100 admin-dark:border-gray-600">
                <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2 mt-4">
                  Datos Bancarios
                </label>
                <textarea
                  value={paymentMethods.bankDetails}
                  onChange={(e) => handlePaymentChange('bankDetails', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                  placeholder="Incluye información como:
- Nombre del banco
- Número de cuenta
- Nombre del titular
- Tipo de cuenta"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Methods */}
      <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Truck className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white">Métodos de Entrega</h2>
        </div>

        <div className="space-y-6">
          {/* Store Pickup */}
          <div className="flex items-center justify-between p-4 border border-gray-200 admin-dark:border-gray-600 rounded-lg">
            <div className="flex items-center gap-3">
              <Store className="w-6 h-6 text-indigo-500" />
              <div>
                <h3 className="font-medium text-gray-900 admin-dark:text-white">Recogida en Tienda</h3>
                <p className="text-sm text-gray-600 admin-dark:text-gray-300">El cliente recoge el pedido en tu ubicación</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={shippingMethods.pickup}
                onChange={(e) => handleShippingChange('pickup', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 admin-dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Local Delivery */}
          <div className="border border-gray-200 admin-dark:border-gray-600 rounded-lg">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Truck className="w-6 h-6 text-orange-500" />
                <div>
                  <h3 className="font-medium text-gray-900 admin-dark:text-white">Entrega Local (Delivery)</h3>
                  <p className="text-sm text-gray-600 admin-dark:text-gray-300">Entrega a domicilio en tu zona de cobertura</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={shippingMethods.delivery}
                  onChange={(e) => handleShippingChange('delivery', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 admin-dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {shippingMethods.delivery && (
              <div className="px-4 pb-4 border-t border-gray-100 admin-dark:border-gray-600 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                      Costo de Delivery
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        value={shippingMethods.deliveryCost}
                        onChange={(e) => handleShippingChange('deliveryCost', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                      Zona de Cobertura
                    </label>
                    <input
                      type="text"
                      value={shippingMethods.deliveryZone}
                      onChange={(e) => handleShippingChange('deliveryZone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                      placeholder="Ej: Centro de la ciudad, Radio de 5km"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary - FIXED DARK MODE */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumen de Configuración</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Métodos de Pago Activos:</h4>
            <ul className="space-y-1 text-sm text-gray-900 dark:text-gray-100">
              {paymentMethods.cash && <li>• Efectivo</li>}
              {paymentMethods.bankTransfer && <li>• Transferencia Bancaria</li>}
              {!paymentMethods.cash && !paymentMethods.bankTransfer && (
                <li className="text-red-600 admin-dark:text-red-400">⚠️ No hay métodos de pago configurados</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Métodos de Entrega Activos:</h4>
            <ul className="space-y-1 text-sm text-gray-900 dark:text-gray-100">
              {shippingMethods.pickup && <li>• Recogida en Tienda</li>}
              {shippingMethods.delivery && (
                <li>• Delivery ({store?.currency === 'USD' ? '$' : store?.currency === 'EUR' ? '€' : '$'}{shippingMethods.deliveryCost})</li>
              )}
              {!shippingMethods.pickup && !shippingMethods.delivery && (
                <li className="text-red-600 admin-dark:text-red-400">⚠️ No hay métodos de entrega configurados</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200 font-medium">
            ✅ Los cambios se guardan automáticamente cuando modificas cualquier configuración
          </p>
        </div>
      </div>
    </div>
  );
}