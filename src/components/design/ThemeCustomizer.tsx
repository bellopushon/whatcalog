import React, { useState } from 'react';
import { Palette, Smartphone, Save } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useTheme, COLOR_PALETTES } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { PRODUCTS_PER_PAGE_OPTIONS } from '../../utils/constants';

export default function ThemeCustomizer() {
  const { state, updateStore } = useStore();
  const { currentPalette, borderRadius, applyTheme } = useTheme();
  const { success, error } = useToast();
  const store = state.currentStore;
  
  const [selectedPalette, setSelectedPalette] = useState(store?.colorPalette || 'predeterminado');
  const [selectedRadius, setSelectedRadius] = useState(store?.borderRadius || 8);
  const [productsPerPage, setProductsPerPage] = useState(store?.productsPerPage || 12);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handlePaletteChange = (paletteId: string) => {
    setSelectedPalette(paletteId);
    setHasUnsavedChanges(true);
    // Apply theme immediately for preview
    applyTheme(paletteId, selectedRadius);
  };

  const handleRadiusChange = (radius: number) => {
    setSelectedRadius(radius);
    setHasUnsavedChanges(true);
    // Apply theme immediately for preview
    applyTheme(selectedPalette, radius);
  };

  const handleProductsPerPageChange = (count: number) => {
    setProductsPerPage(count);
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!store) return;

    setIsSaving(true);

    try {
      // Preparar datos para actualizar
      const updateData = {
        colorPalette: selectedPalette,
        borderRadius: selectedRadius,
        productsPerPage: productsPerPage,
      };

      // Actualizar tienda en Supabase
      await updateStore(updateData);

      // Apply the theme
      applyTheme(selectedPalette, selectedRadius);

      setHasUnsavedChanges(false);
      success('¡Configuración guardada!', 'Los cambios de diseño se han aplicado correctamente');
    } catch (err: any) {
      console.error('Error saving theme settings:', err);
      error('Error al guardar', err.message || 'No se pudieron guardar los cambios. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentPaletteData = COLOR_PALETTES.find(p => p.id === selectedPalette) || COLOR_PALETTES[0];

  // Show message if no store is available
  if (!store) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 admin-dark:text-white">Diseño de la Tienda</h1>
          <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base mt-1">Personaliza la apariencia de tu catálogo</p>
        </div>
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-8 lg:p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 admin-dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 admin-dark:text-white mb-2">No hay tienda configurada</h3>
          <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base">Primero debes configurar tu tienda para personalizar el diseño</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 admin-dark:text-white">Diseño de la Tienda</h1>
          <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base mt-1">Personaliza la apariencia de tu catálogo</p>
        </div>
        
        {/* Save Button - Always Visible */}
        <button
          onClick={handleSaveChanges}
          disabled={isSaving || !hasUnsavedChanges}
          className={`flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all ${
            hasUnsavedChanges
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
              : 'bg-gray-100 admin-dark:bg-gray-700 text-gray-400 admin-dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="hidden sm:inline">Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">
                {hasUnsavedChanges ? 'Guardar Cambios' : 'Sin Cambios'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 admin-dark:bg-yellow-900/20 border border-yellow-200 admin-dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <p className="text-yellow-800 admin-dark:text-yellow-200 text-sm font-medium">
              Tienes cambios sin guardar. Haz clic en "Guardar Cambios" para aplicarlos permanentemente.
            </p>
          </div>
        </div>
      )}

      {/* Color Palettes */}
      <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4 lg:mb-6">
          <Palette className="w-6 h-6 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white">Paletas de Colores</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COLOR_PALETTES.map((palette) => (
            <div
              key={palette.id}
              onClick={() => handlePaletteChange(palette.id)}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedPalette === palette.id
                  ? 'border-indigo-500 bg-indigo-50 admin-dark:bg-indigo-900/30 ring-2 ring-indigo-200 admin-dark:ring-indigo-800'
                  : 'border-gray-200 admin-dark:border-gray-600 hover:border-gray-300 admin-dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-1">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: palette.primary }}
                  ></div>
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: palette.secondary }}
                  ></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 admin-dark:text-white text-sm">{palette.name}</h3>
                  {selectedPalette === palette.id && (
                    <span className="text-indigo-600 admin-dark:text-indigo-400 text-xs font-medium">✓ Seleccionado</span>
                  )}
                </div>
              </div>
              <p className="text-xs leading-relaxed line-clamp-2 text-gray-700 admin-dark:text-gray-300">{palette.description}</p>
            </div>
          ))}
        </div>

        {/* Current Palette Preview */}
        <div className="mt-6 p-4 bg-gray-50 admin-dark:bg-gray-700 rounded-lg">
          <h3 className="font-medium text-gray-900 admin-dark:text-white mb-2">Vista Previa del Tema Actual</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg shadow-sm border border-gray-200 admin-dark:border-gray-600"
                style={{ backgroundColor: currentPaletteData.primary }}
              ></div>
              <span className="text-sm text-gray-700 admin-dark:text-gray-300">Primario</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg shadow-sm border border-gray-200 admin-dark:border-gray-600"
                style={{ backgroundColor: currentPaletteData.secondary }}
              ></div>
              <span className="text-sm text-gray-700 admin-dark:text-gray-300">Secundario</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Configurations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Border Radius */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-4">Radio del Borde</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 admin-dark:text-gray-300">Redondeado</span>
              <span className="text-sm font-medium text-gray-900 admin-dark:text-white">{selectedRadius}px</span>
            </div>
            
            <input
              type="range"
              min="0"
              max="20"
              value={selectedRadius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 admin-dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            
            <div className="flex justify-between text-xs text-gray-500 admin-dark:text-gray-400">
              <span>0px</span>
              <span>10px</span>
              <span>20px</span>
            </div>

            {/* Preview */}
            <div className="mt-4">
              <div 
                className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 border-2 border-gray-200 admin-dark:border-gray-600"
                style={{ borderRadius: `${selectedRadius}px` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Products Per Page */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white">Productos por Página</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <select
              value={productsPerPage}
              onChange={(e) => handleProductsPerPageChange(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white"
            >
              {PRODUCTS_PER_PAGE_OPTIONS.map(count => (
                <option key={count} value={count}>
                  {count} Productos
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600 admin-dark:text-gray-300">
              Los clientes verán {productsPerPage} productos por página en tu catálogo
            </span>
          </div>
        </div>
      </div>

      {/* Preview Link */}
      {store && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 admin-dark:from-gray-800 admin-dark:to-gray-900 rounded-xl border border-indigo-200 admin-dark:border-indigo-800 p-4 lg:p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-2">¿Quieres ver cómo se ve?</h3>
            <p className="text-gray-700 admin-dark:text-gray-300 mb-4 text-sm lg:text-base">
              Revisa tu catálogo con los cambios aplicados
            </p>
            <a
              href={`/store/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Palette className="w-5 h-5" />
              Ver Catálogo
            </a>
          </div>
        </div>
      )}

      {/* Save Button - Mobile Fixed */}
      {hasUnsavedChanges && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40">
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Guardando Cambios...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}