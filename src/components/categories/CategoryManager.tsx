import React, { useState } from 'react';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { generateId } from '../../utils/constants';

export default function CategoryManager() {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const { state, dispatch } = useStore();

  const store = state.currentStore;
  const categories = store?.categories || [];
  const products = store?.products || [];

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !store) return;

    const newCategory = {
      id: generateId(),
      name: newCategoryName.trim(),
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    setNewCategoryName('');
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category.id);
    setEditName(category.name);
  };

  const handleUpdateCategory = (e) => {
    e.preventDefault();
    if (!editName.trim() || !store) return;

    const categoryToUpdate = categories.find(c => c.id === editingCategory);
    if (!categoryToUpdate) return;

    dispatch({
      type: 'UPDATE_CATEGORY',
      payload: {
        ...categoryToUpdate,
        name: editName.trim(),
      }
    });

    setEditingCategory(null);
    setEditName('');
  };

  const handleDeleteCategory = (categoryId) => {
    if (!store) return;
    
    const productsInCategory = products.filter(p => p.categoryId === categoryId);
    
    if (productsInCategory.length > 0) {
      if (!window.confirm(`Esta categoría tiene ${productsInCategory.length} producto(s). Si la eliminas, estos productos se quedarán sin categoría. ¿Continuar?`)) {
        return;
      }
    }

    dispatch({ type: 'DELETE_CATEGORY', payload: categoryId });
  };

  const getProductCount = (categoryId) => {
    return products.filter(p => p.categoryId === categoryId).length;
  };

  // Show message if no store is available
  if (!store) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
          <p className="text-gray-600 text-sm lg:text-base mt-1">Organiza tus productos en categorías</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 lg:p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tienda configurada</h3>
          <p className="text-gray-600 text-sm lg:text-base">Primero debes configurar tu tienda para gestionar categorías</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">Organiza tus productos en categorías</p>
      </div>

      {/* Add New Category - Mobile Optimized */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Añadir Nueva Categoría</h2>
        
        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3 lg:gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nombre de la categoría"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base"
              maxLength={50}
              required
            />
          </div>
          <button
            type="submit"
            disabled={!newCategoryName.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Añadir</span>
          </button>
        </form>
      </div>

      {/* Categories List - Mobile Optimized */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Categorías Existentes</h2>
        </div>

        {categories.length === 0 ? (
          <div className="p-8 lg:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
            <p className="text-gray-600 text-sm lg:text-base">Crea tu primera categoría para organizar tus productos</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {categories.map(category => (
              <div key={category.id} className="p-4 lg:p-6 flex items-center justify-between">
                <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingCategory === category.id ? (
                      <form onSubmit={handleUpdateCategory} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base"
                          maxLength={50}
                          autoFocus
                          required
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(null);
                              setEditName('');
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <h3 className="font-semibold text-gray-900 text-sm lg:text-base truncate">{category.name}</h3>
                        <p className="text-xs lg:text-sm text-gray-500">
                          {getProductCount(category.id)} producto(s)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {editingCategory !== category.id && (
                  <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}