import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, X, Star, AlertCircle, Plus } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';

interface ProductFormProps {
  product?: any;
  onClose: () => void;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    shortDescription: product?.shortDescription || '',
    price: product?.price || '',
    categoryId: product?.categoryId || '',
    mainImage: product?.mainImage || '',
    gallery: product?.gallery || [],
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
  });

  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { state, createProduct, updateProduct } = useStore();
  const { success, error } = useToast();

  const store = state.currentStore;
  const categories = store?.categories || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type = 'main') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        error('Error de archivo', 'La imagen debe ser menor a 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        error('Error de archivo', 'Por favor selecciona un archivo de imagen válido');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'main') {
          setFormData(prev => ({ ...prev, mainImage: e.target?.result as string }));
        } else {
          if (formData.gallery.length >= 5) {
            error('Límite alcanzado', 'Máximo 5 imágenes en la galería');
            return;
          }
          setFormData(prev => ({
            ...prev,
            gallery: [...prev.gallery, e.target?.result as string]
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0';
    } else if (isNaN(parseFloat(formData.price))) {
      newErrors.price = 'El precio debe ser un número válido';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Selecciona una categoría';
    }

    if (formData.shortDescription && formData.shortDescription.length > 100) {
      newErrors.shortDescription = 'La descripción corta no puede exceder 100 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const productData = {
        name: formData.name.trim(),
        shortDescription: formData.shortDescription.trim() || undefined,
        price: parseFloat(formData.price),
        categoryId: formData.categoryId || undefined,
        mainImage: formData.mainImage || undefined,
        gallery: formData.gallery,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      };

      if (product) {
        await updateProduct({
          ...product,
          ...productData,
        });
        success('¡Producto actualizado!', 'Los cambios se han guardado correctamente');
      } else {
        await createProduct(productData);
        success('¡Producto creado!', 'El nuevo producto se ha añadido al catálogo');
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving product:', err);
      error('Error al guardar', err.message || 'No se pudo guardar el producto. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 admin-dark:bg-gray-900 p-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900 admin-dark:text-white" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 admin-dark:text-white">Nuevo Producto</h1>
        </div>

        <div className="bg-yellow-50 admin-dark:bg-yellow-900/20 border border-yellow-200 admin-dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 admin-dark:text-yellow-400" />
            <h2 className="font-semibold text-yellow-800 admin-dark:text-yellow-200">Necesitas crear categorías primero</h2>
          </div>
          <p className="text-yellow-700 admin-dark:text-yellow-300 mb-4 text-sm">
            Para añadir productos, primero debes crear al menos una categoría.
          </p>
          <button
            onClick={() => window.location.href = '/admin/categories'}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Ir a Categorías
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 admin-dark:bg-gray-900">
      {/* Header - Fixed at top */}
      <div className="sticky top-0 z-10 bg-gray-50 admin-dark:bg-gray-900 border-b border-gray-200 admin-dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900 admin-dark:text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 admin-dark:text-white">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h1>
            <p className="text-xs text-gray-500 admin-dark:text-gray-400">
              {product ? 'Modifica la información del producto' : 'Añade un nuevo producto a tu catálogo'}
            </p>
          </div>
        </div>
        
        <button
          type="submit"
          form="product-form"
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            product ? 'Actualizar' : 'Publicar'
          )}
        </button>
      </div>

      {/* Form */}
      <form id="product-form" onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Main Image - 1080x1080 format */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 admin-dark:border-gray-700 overflow-hidden">
          {formData.mainImage ? (
            <div className="relative">
              <img
                src={formData.mainImage}
                alt="Vista previa"
                className="w-full aspect-square object-cover"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, mainImage: '' }))}
                className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square flex flex-col items-center justify-center cursor-pointer bg-gray-50 admin-dark:bg-gray-700 hover:bg-gray-100 admin-dark:hover:bg-gray-600 transition-colors"
            >
              <Upload className="w-10 h-10 text-gray-400 mb-3" />
              <p className="text-gray-600 admin-dark:text-gray-300 font-medium mb-1">Subir imagen principal</p>
              <p className="text-xs text-gray-500 admin-dark:text-gray-400">Recomendado: 1080×1080px</p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'main')}
            className="hidden"
          />
        </div>

        {/* Basic Info */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-1">
                Nombre del producto *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:border-gray-600 admin-dark:text-white admin-dark:placeholder-gray-400 text-sm ${
                  errors.name ? 'border-red-300 admin-dark:border-red-500' : 'border-gray-300 admin-dark:border-gray-600'
                }`}
                placeholder="Ej: Zapatillas deportivas"
                maxLength={100}
              />
              {errors.name && <p className="text-red-500 admin-dark:text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-1">
                Descripción corta (opcional)
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                maxLength={100}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:border-gray-600 admin-dark:text-white admin-dark:placeholder-gray-400 text-sm ${
                  errors.shortDescription ? 'border-red-300 admin-dark:border-red-500' : 'border-gray-300 admin-dark:border-gray-600'
                }`}
                placeholder="Breve descripción para el catálogo"
              />
              <div className="flex justify-end">
                <p className="text-xs text-gray-500 admin-dark:text-gray-400 mt-1">
                  {formData.shortDescription.length}/100
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-1">
                  Precio *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:border-gray-600 admin-dark:text-white admin-dark:placeholder-gray-400 text-sm ${
                    errors.price ? 'border-red-300 admin-dark:border-red-500' : 'border-gray-300 admin-dark:border-gray-600'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && <p className="text-red-500 admin-dark:text-red-400 text-xs mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-1">
                  Categoría *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:border-gray-600 admin-dark:text-white text-sm ${
                    errors.categoryId ? 'border-red-300 admin-dark:border-red-500' : 'border-gray-300 admin-dark:border-gray-600'
                  }`}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-red-500 admin-dark:text-red-400 text-xs mt-1">{errors.categoryId}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700 admin-dark:text-gray-300">Galería adicional</h2>
            <span className="text-xs text-gray-500 admin-dark:text-gray-400">{formData.gallery.length}/5 imágenes</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {formData.gallery.map((image, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={image}
                  alt={`Galería ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {formData.gallery.length < 5 && (
              <div
                onClick={() => galleryInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-300 admin-dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 admin-dark:hover:bg-indigo-900/20 transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
          
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'gallery')}
            className="hidden"
          />
        </div>

        {/* Settings */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4">
          <h2 className="text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-3">Configuración</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700 admin-dark:text-gray-300">Estado</label>
                <p className="text-xs text-gray-500 admin-dark:text-gray-400">Mostrar en catálogo</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 admin-dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700 admin-dark:text-gray-300">Destacado</label>
                <p className="text-xs text-gray-500 admin-dark:text-gray-400">Mostrar con insignia</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 admin-dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-yellow-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Padding */}
        <div className="h-20"></div>
      </form>

      {/* Bottom Action Bar - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white admin-dark:bg-gray-800 border-t border-gray-200 admin-dark:border-gray-700 p-3 flex justify-between items-center">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 admin-dark:border-gray-600 text-gray-700 admin-dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="product-form"
          disabled={isSubmitting}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Guardando...</span>
            </>
          ) : (
            <span>{product ? 'Actualizar' : 'Publicar'}</span>
          )}
        </button>
      </div>
    </div>
  );
}