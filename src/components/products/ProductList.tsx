import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Copy, Eye, EyeOff, Package } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { formatCurrency } from '../../utils/constants';
import ProductForm from './ProductForm';

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { state, dispatch } = useStore();

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

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      dispatch({ type: 'DELETE_PRODUCT', payload: productId });
    }
  };

  const handleToggleActive = (product: any) => {
    dispatch({
      type: 'UPDATE_PRODUCT',
      payload: { ...product, isActive: !product.isActive }
    });
  };

  const handleDuplicateProduct = (product: any) => {
    const duplicatedProduct = {
      ...product,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: `${product.name} (Copia)`,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_PRODUCT', payload: duplicatedProduct });
  };

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
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Productos</h1>
            <p className="text-gray-600 text-sm lg:text-base mt-1">Gestiona tu catálogo</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="lg:hidden bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Desktop Add Button */}
        <button
          onClick={() => setShowForm(true)}
          className="hidden lg:flex bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium items-center gap-2 transition-colors self-start"
        >
          <Plus className="w-5 h-5" />
          Añadir Producto
        </button>
      </div>

      {/* Filters - Mobile Optimized */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="space-y-4 lg:space-y-0 lg:flex lg:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base"
              />
            </div>
          </div>
          <div className="lg:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 lg:p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
          <p className="text-gray-600 mb-6 text-sm lg:text-base">
            {searchTerm || selectedCategory 
              ? 'No se encontraron productos con los filtros aplicados'
              : 'Comienza añadiendo tu primer producto'
            }
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Añadir Producto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredProducts.map(product => {
            const category = categories.find(c => c.id === product.categoryId);
            
            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 relative">
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
                    <h3 className="font-semibold text-gray-900 text-base lg:text-lg leading-tight">
                      {product.name}
                    </h3>
                  </div>
                  
                  {product.shortDescription && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.shortDescription}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        {formatCurrency(product.price, store?.currency || 'USD')}
                      </p>
                      {category && (
                        <p className="text-xs text-gray-500 mt-1">{category.name}</p>
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
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                    
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                        product.isActive
                          ? 'bg-red-50 hover:bg-red-100 text-red-700'
                          : 'bg-green-50 hover:bg-green-100 text-green-700'
                      }`}
                      title={product.isActive ? 'Desactivar producto' : 'Activar producto'}
                    >
                      {product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleDuplicateProduct(product)}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700"
                      title="Duplicar producto"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-700"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
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