import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Copy, Eye, EyeOff, Package } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/constants';
import ProductForm from './ProductForm';

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const { state, updateProduct, deleteProduct, getMaxProducts } = useStore();
  const { success, error } = useToast();

  const store = state.currentStore;
  const products = store?.products || [];
  const categories = store?.categories || [];

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowForm(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    setIsDeleting(productId);

    try {
      await deleteProduct(productId);
      success('¡Producto eliminado!', 'El producto se ha eliminado correctamente');
    } catch (err: any) {
      console.error('Error deleting product:', err);
      error('Error al eliminar', err.message || 'No se pudo eliminar el producto. Intenta de nuevo.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleActive = async (product: any) => {
    try {
      await updateProduct({
        ...product,
        isActive: !product.isActive
      });
      success(
        product.isActive ? 'Producto desactivado' : 'Producto activado',
        `El producto ahora está ${product.isActive ? 'inactivo' : 'activo'}`
      );
    } catch (err: any) {
      console.error('Error toggling product status:', err);
      error('Error al cambiar estado', err.message || 'No se pudo cambiar el estado del producto.');
    }
  };

  const handleDuplicateProduct = async (product: any) => {
    try {
      const duplicatedProduct = {
        name: `${product.name} (Copia)`,
        shortDescription: product.shortDescription,
        price: product.price,
        categoryId: product.categoryId,
        mainImage: product.mainImage,
        gallery: product.gallery,
        isActive: product.isActive,
        isFeatured: false, // Reset featured status for duplicates
      };

      // This will be handled by createProduct in the context
      // For now, we'll show a message that this feature is coming soon
      success('Función próximamente', 'La duplicación de productos estará disponible pronto');
    } catch (err: any) {
      console.error('Error duplicating product:', err);
      error('Error al duplicar', err.message || 'No se pudo duplicar el producto.');
    }
  };

  const maxProducts = getMaxProducts();
  const canCreateProduct = products.length < maxProducts;

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onClose={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 admin-dark:text-white">Productos</h1>
            <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base mt-1">Gestiona tu catálogo</p>
          </div>
          {canCreateProduct && (
            <button
              onClick={() => setShowForm(true)}
              className="lg:hidden bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Desktop Add Button */}
        {canCreateProduct && (
          <button
            onClick={() => setShowForm(true)}
            className="hidden lg:flex bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium items-center gap-2 transition-colors self-start"
          >
            <Plus className="w-5 h-5" />
            Añadir Producto
          </button>
        )}
      </div>

      {/* Plan Limits Info */}
      <div className="bg-blue-50 admin-dark:bg-blue-900/20 border border-blue-200 admin-dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900 admin-dark:text-blue-200">Límite de Productos</h3>
            <p className="text-sm text-blue-800 admin-dark:text-blue-300">
              Puedes crear hasta {maxProducts} productos en tu plan {state.user?.plan}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900 admin-dark:text-blue-200">
              {products.length} / {maxProducts}
            </div>
          </div>
        </div>
        {!canCreateProduct && (
          <div className="mt-3 p-3 bg-yellow-100 admin-dark:bg-yellow-900/30 border border-yellow-200 admin-dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 admin-dark:text-yellow-200 font-medium">
              Has alcanzado el límite de productos para tu plan. Actualiza tu plan para crear más productos.
            </p>
          </div>
        )}
      </div>

      {/* Filters - Mobile Optimized */}
      <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4 lg:p-6">
        <div className="space-y-4 lg:space-y-0 lg:flex lg:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
              />
            </div>
          </div>
          <div className="lg:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white"
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid - Mobile Optimized */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-8 lg:p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 admin-dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 admin-dark:text-white mb-2">No hay productos</h3>
          <p className="text-gray-600 admin-dark:text-gray-300 mb-6 text-sm lg:text-base">
            {searchTerm || selectedCategory 
              ? 'No se encontraron productos con los filtros aplicados'
              : 'Comienza añadiendo tu primer producto'
            }
          </p>
          {canCreateProduct && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Añadir Producto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredProducts.map(product => {
            const category = categories.find(c => c.id === product.categoryId);
            
            return (
              <div key={product.id} className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 admin-dark:bg-gray-700 relative">
                  {product.mainImage ? (
                    <img
                      src={product.mainImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {!product.isActive && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Inactivo
                      </span>
                    </div>
                  )}
                  {product.isFeatured && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        ⭐ Destacado
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 admin-dark:text-white text-base lg:text-lg leading-tight">
                      {product.name}
                    </h3>
                  </div>
                  
                  {product.shortDescription && (
                    <p className="text-gray-600 admin-dark:text-gray-300 text-sm mb-3 line-clamp-2">
                      {product.shortDescription}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900 admin-dark:text-white">
                        {formatCurrency(product.price, store?.currency || 'USD')}
                      </p>
                      {category && (
                        <p className="text-xs text-gray-500 admin-dark:text-gray-400 mt-1">{category.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions - Mobile Optimized */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setShowForm(true);
                      }}
                      className="flex-1 bg-indigo-50 admin-dark:bg-indigo-900/20 hover:bg-indigo-100 admin-dark:hover:bg-indigo-900/30 text-indigo-700 admin-dark:text-indigo-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                    
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                        product.isActive
                          ? 'bg-red-50 admin-dark:bg-red-900/20 hover:bg-red-100 admin-dark:hover:bg-red-900/30 text-red-700 admin-dark:text-red-400'
                          : 'bg-green-50 admin-dark:bg-green-900/20 hover:bg-green-100 admin-dark:hover:bg-green-900/30 text-green-700 admin-dark:text-green-400'
                      }`}
                      title={product.isActive ? 'Desactivar producto' : 'Activar producto'}
                    >
                      {product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleDuplicateProduct(product)}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center bg-gray-50 admin-dark:bg-gray-700 hover:bg-gray-100 admin-dark:hover:bg-gray-600 text-gray-700 admin-dark:text-gray-300"
                      title="Duplicar producto"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={isDeleting === product.id}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center bg-red-50 admin-dark:bg-red-900/20 hover:bg-red-100 admin-dark:hover:bg-red-900/30 text-red-700 admin-dark:text-red-400 disabled:opacity-50"
                      title="Eliminar producto"
                    >
                      {isDeleting === product.id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}