import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/constants';
import { COLOR_PALETTES } from '../../contexts/ThemeContext';

interface ProductModalProps {
  product: any;
  store: any;
  onClose: () => void;
  onAddToCart: (product: any) => void;
}

export default function ProductModal({ product, store, onClose, onAddToCart }: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [product.mainImage, ...product.gallery].filter(Boolean);
  const hasMultipleImages = images.length > 1;

  // Get current theme colors for dynamic styling
  const currentPalette = COLOR_PALETTES.find(p => p.id === (store.theme?.colorPalette || 'predeterminado')) || COLOR_PALETTES[0];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAddToCart = () => {
    onAddToCart(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Detalles del Producto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Image Gallery - 1080x1080 standard size */}
          <div className="relative md:w-1/2">
            {images.length > 0 ? (
              <div className="aspect-square">
                <img
                  src={images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    {/* Image indicators */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">Sin imagen</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-6 md:w-1/2">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h1>
              {/* Price with theme color */}
              <p 
                className="text-2xl font-bold"
                style={{ color: currentPalette.primary }}
              >
                {formatCurrency(product.price, store.currency)}
              </p>
            </div>

            {product.shortDescription && (
              <div className="mb-4">
                <p className="text-gray-600">{product.shortDescription}</p>
              </div>
            )}

            {/* Featured Badge */}
            {product.isFeatured && (
              <div className="mb-4">
                <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  ⭐ Producto Destacado
                </span>
              </div>
            )}

            {/* Add to Cart Button with theme color */}
            <button
              onClick={handleAddToCart}
              className="w-full text-white py-3 px-4 rounded-lg font-medium transition-all hover:opacity-90 transform hover:scale-105"
              style={{ backgroundColor: currentPalette.primary }}
            >
              Agregar al Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}