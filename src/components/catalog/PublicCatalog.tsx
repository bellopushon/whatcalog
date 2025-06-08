import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Share2, Phone, Facebook, Instagram, Twitter, MessageCircle, Search, Filter } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useTheme, COLOR_PALETTES } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../utils/constants';
import ProductModal from './ProductModal';
import CartModal from './CartModal';

export default function PublicCatalog() {
  const { slug } = useParams();
  const { state } = useStore();
  const { trackVisit } = useAnalytics();
  const { applyTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hasTrackedVisit, setHasTrackedVisit] = useState(false);

  // Find store by slug
  const store = state.stores.find(s => s.slug === slug);

  useEffect(() => {
    if (store && !hasTrackedVisit) {
      // Track visit only once per component mount
      trackVisit(store.id);
      setHasTrackedVisit(true);

      // Apply store theme to the public catalog
      const paletteId = store.theme?.colorPalette || 'predeterminado';
      const borderRadius = store.theme?.borderRadius || 8;
      
      // Find the palette data
      const palette = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];
      
      // Apply CSS variables for the theme
      const root = document.documentElement;
      root.style.setProperty('--color-primary', palette.primary);
      root.style.setProperty('--color-secondary', palette.secondary);
      root.style.setProperty('--border-radius', `${borderRadius}px`);
      
      // Apply theme using the theme context
      applyTheme(paletteId, borderRadius);
      
      // Set page title
      document.title = `${store.name} - Catálogo`;
    }

    // Cleanup function to reset theme when component unmounts
    return () => {
      // Reset to default theme
      const root = document.documentElement;
      root.style.setProperty('--color-primary', '#6366f1');
      root.style.setProperty('--color-secondary', '#ec4899');
      root.style.setProperty('--border-radius', '8px');
    };
  }, [store, applyTheme, trackVisit, hasTrackedVisit]);

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tienda no encontrada</h1>
          <p className="text-gray-600">La tienda que buscas no existe o ha sido eliminada.</p>
        </div>
      </div>
    );
  }

  const activeProducts = store.products.filter(p => p.isActive);
  const categories = store.categories;

  const filteredProducts = activeProducts.filter(product => {
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const shareStore = async () => {
    const shareData = {
      title: store.name,
      text: store.description || `Catálogo de ${store.name}`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to clipboard
        fallbackShare();
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Enlace copiado al portapapeles');
    }).catch(() => {
      // Final fallback
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Enlace copiado al portapapeles');
    });
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Get current theme colors for dynamic styling
  const currentPalette = COLOR_PALETTES.find(p => p.id === (store.theme?.colorPalette || 'predeterminado')) || COLOR_PALETTES[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {store.logo && (
                <img
                  src={store.logo}
                  alt={store.name}
                  className="w-12 h-12 object-contain rounded-lg"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
                {store.description && (
                  <p className="text-sm text-gray-600">{store.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={shareStore}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>

              {cartItemsCount > 0 && (
                <button
                  onClick={() => setShowCart(true)}
                  className="relative p-2 text-white rounded-lg transition-colors"
                  style={{ backgroundColor: currentPalette.primary }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ 
                  '--tw-ring-color': currentPalette.primary,
                  focusRingColor: currentPalette.primary 
                }}
                autoFocus
              />
            </div>
          )}
        </div>
      </header>

      {/* Category Navigation */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  !selectedCategory
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={!selectedCategory ? { backgroundColor: currentPalette.primary } : {}}
              >
                Todos ({activeProducts.length})
              </button>
              {categories.map(category => {
                const categoryProductCount = activeProducts.filter(p => p.categoryId === category.id).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category.id
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={selectedCategory === category.id ? { backgroundColor: currentPalette.primary } : {}}
                  >
                    {category.name} ({categoryProductCount})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron productos' : 'No hay productos'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `No hay productos que coincidan con "${searchTerm}"`
                : selectedCategory 
                ? 'No hay productos en esta categoría' 
                : 'Esta tienda aún no tiene productos'
              }
            </p>
            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                }}
                className="mt-4 font-medium transition-colors"
                style={{ color: currentPalette.primary }}
              >
                Ver todos los productos
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} 
                {searchTerm && ` para "${searchTerm}"`}
                {selectedCategory && ` en ${categories.find(c => c.id === selectedCategory)?.name}`}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Product Image */}
                  <div
                    className="aspect-square bg-gray-100 cursor-pointer relative"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {product.mainImage ? (
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    {product.isFeatured && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          ⭐
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <h3
                      className="font-medium text-gray-900 text-sm leading-tight mb-2 cursor-pointer transition-colors line-clamp-2"
                      onClick={() => setSelectedProduct(product)}
                      style={{ 
                        ':hover': { color: currentPalette.primary }
                      }}
                    >
                      {product.name}
                    </h3>
                    
                    {product.shortDescription && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {product.shortDescription}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(product.price, store.currency)}
                      </p>
                      <button
                        onClick={() => addToCart(product)}
                        className="text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: currentPalette.primary }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Social Media */}
          {store.socialMedia?.showInCatalog && (
            <div className="flex justify-center gap-4 mb-4">
              {store.socialMedia.facebook && (
                <a
                  href={store.socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {store.socialMedia.instagram && (
                <a
                  href={store.socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-pink-600 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {store.socialMedia.twitter && (
                <a
                  href={store.socialMedia.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-blue-400 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
            </div>
          )}

          {/* WhatsApp Contact */}
          {store.whatsapp && (
            <div className="text-center mb-4">
              <a
                href={`https://wa.me/${store.whatsapp.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Contactar por WhatsApp
              </a>
            </div>
          )}

          {/* Powered by */}
          <div className="text-center text-xs text-gray-500">
            Powered by <span className="font-medium">Tutaviendo</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          store={store}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {showCart && (
        <CartModal
          cart={cart}
          store={store}
          onClose={() => setShowCart(false)}
          onUpdateCart={setCart}
        />
      )}
    </div>
  );
}
