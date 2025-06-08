import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, X, Star, AlertCircle } from 'lucide-react';
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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 admin-dark:text-white">Nuevo Producto</h1>
        </div>

        <div className="bg-yellow-50 admin-dark:bg-yellow-900/20 border border-yellow-200 admin-dark:border-yellow-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 admin-dark:text-yellow-400" />
            <h2 className="text-lg font-semibold text-yellow-800 admin-dark:text-yellow-200">Necesitas crear categorías primero</h2>
          </div>
          <p className="text-yellow-700 admin-dark:text-yellow-300 mb-4">
            Para añadir productos, primero debes crear al menos una categoría.
          </p>
          <button
            onClick={() => window.location.href = '/admin/categories'}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Ir a Categorías
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 admin-dark:text-white">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          <p className="text-gray-600 admin-dark:text-gray-300 mt-1">
            {product ? 'Modifica la información del producto' : 'Añade un nuevo producto a tu catálogo'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Basic Info */}
          <div className="space-y-6">
            <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-4">Información Básica</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                    Nombre del producto *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:border-gray-600 admin-dark:text-white admin-dark:placeholder-gray-400 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ej: iPhone 15 Pro Max"
                    maxLength={100}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                    Descripción corta (opcional)
                  </label>
                  <input
                    type="text"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    maxLength={100}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:border-gray-600 admin-dark:text-white admin-dark:placeholder-gray-400 ${
                      errors.shortDescription ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Breve descripción para el catálogo"
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.shortDescription && <p className="text-red-500 text-sm">{errors.shortDescription}</p>}
                    <p className="text-xs text-gray-500 admin-dark:text-gray-400 ml-auto">
                      {formData.shortDescription.length}/100 caracteres
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                      Precio *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:border-gray-600 admin-dark:text-white admin-dark:placeholder-gray-400 ${
                        errors.price ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                      Categoría *
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:border-gray-600 admin-dark:text-white ${
                        errors.categoryId ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-4">Configuración</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 admin-dark:text-gray-300">Estado</label>
                    <p className="text-xs text-gray-500 admin-dark:text-gray-400">Mostrar producto en el catálogo</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 admin-dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 admin-dark:text-gray-300">Producto Destacado</label>
                    <p className="text-xs text-gray-500 admin-dark:text-gray-400">Mostrar con una insignia especial</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 admin-dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-yellow-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Images */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-4">Imagen Principal</h2>
              
              <div className="space-y-4">
                {formData.mainImage ? (
                  <div className="relative">
                    <img
                      src={formData.mainImage}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, mainImage: '' }))}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 admin-dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 admin-dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 admin-dark:text-gray-300 font-medium mb-2">Clic para subir imagen</p>
                    <p className="text-sm text-gray-500 admin-dark:text-gray-400">JPG, PNG o WEBP (máx. 5MB)</p>
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
            </div>

            {/* Gallery */}
            <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-4">
                Galería Adicional
                <span className="text-sm font-normal text-gray-500 admin-dark:text-gray-400 ml-2">(Hasta 5 imágenes)</span>
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {formData.gallery.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {formData.gallery.length < 5 && (
                    <div
                      onClick={() => galleryInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 admin-dark:border-gray-600 rounded-lg h-24 flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 admin-dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-gray-400" />
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
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 admin-dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 admin-dark:border-gray-600 text-gray-700 admin-dark:text-gray-300 rounded-lg hover:bg-gray-50 admin-dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              product ? 'Actualizar Producto' : 'Crear Producto'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}