import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface ColorPalette {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent?: string;
}

const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Calming blues with fresh accents',
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    accent: '#67e8f9'
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm oranges and coral tones',
    primary: '#f97316',
    secondary: '#fb7185',
    accent: '#fbbf24'
  },
  {
    id: 'forest-fresh',
    name: 'Forest Fresh',
    description: 'Natural greens and earth tones',
    primary: '#16a34a',
    secondary: '#65a30d',
    accent: '#84cc16'
  },
  {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    description: 'Soft purples and elegant tones',
    primary: '#8b5cf6',
    secondary: '#a855f7',
    accent: '#c084fc'
  },
  {
    id: 'coral-reef',
    name: 'Coral Reef',
    description: 'Vibrant corals and ocean blues',
    primary: '#ef4444',
    secondary: '#06b6d4',
    accent: '#f97316'
  },
  {
    id: 'midnight-sky',
    name: 'Midnight Sky',
    description: 'Deep blues with silver accents',
    primary: '#1e40af',
    secondary: '#3730a3',
    accent: '#6b7280'
  }
];

interface ModernThemeSelectorProps {
  selectedPalette?: string;
  onPaletteChange?: (palette: ColorPalette) => void;
  className?: string;
}

export default function ModernThemeSelector({ 
  selectedPalette = 'ocean-breeze', 
  onPaletteChange,
  className = '' 
}: ModernThemeSelectorProps) {
  const [selected, setSelected] = useState(selectedPalette);
  const [hoveredPalette, setHoveredPalette] = useState<string | null>(null);

  const handlePaletteSelect = (palette: ColorPalette) => {
    setSelected(palette.id);
    onPaletteChange?.(palette);
  };

  const currentPalette = COLOR_PALETTES.find(p => p.id === selected) || COLOR_PALETTES[0];

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choose Your Theme</h2>
        <p className="text-gray-600 text-sm">Select a color palette that reflects your brand</p>
      </div>

      {/* Palette Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {COLOR_PALETTES.map((palette) => {
          const isSelected = selected === palette.id;
          const isHovered = hoveredPalette === palette.id;
          
          return (
            <button
              key={palette.id}
              onClick={() => handlePaletteSelect(palette)}
              onMouseEnter={() => setHoveredPalette(palette.id)}
              onMouseLeave={() => setHoveredPalette(null)}
              className={`
                relative w-full p-5 rounded-2xl border-2 transition-all duration-300 ease-out
                transform hover:scale-[1.02] active:scale-[0.98]
                ${isSelected 
                  ? 'border-gray-900 bg-white shadow-lg' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
                ${isHovered ? 'shadow-lg' : 'shadow-sm'}
              `}
              style={{
                boxShadow: isSelected 
                  ? `0 10px 25px -5px ${palette.primary}20, 0 4px 6px -2px ${palette.primary}10`
                  : undefined
              }}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div 
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: palette.primary }}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Color Dots */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-md transition-transform duration-200"
                  style={{ backgroundColor: palette.primary }}
                />
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white shadow-md transition-transform duration-200"
                  style={{ backgroundColor: palette.secondary }}
                />
                {palette.accent && (
                  <div 
                    className="w-4 h-4 rounded-full border border-white shadow-sm transition-transform duration-200"
                    style={{ backgroundColor: palette.accent }}
                  />
                )}
              </div>

              {/* Palette Info */}
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {palette.name}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {palette.description}
                </p>
              </div>

              {/* Hover Effect Overlay */}
              <div 
                className={`
                  absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none
                  ${isHovered && !isSelected ? 'opacity-5' : 'opacity-0'}
                `}
                style={{ backgroundColor: palette.primary }}
              />
            </button>
          );
        })}
      </div>

      {/* Current Selection Preview */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
        <div className="text-center mb-4">
          <h3 className="font-semibold text-gray-900 mb-1">Current Selection</h3>
          <p className="text-sm text-gray-600">{currentPalette.name}</p>
        </div>

        {/* Color Preview */}
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <div 
              className="w-12 h-12 rounded-xl shadow-md border-2 border-white mx-auto mb-2 transition-all duration-300"
              style={{ backgroundColor: currentPalette.primary }}
            />
            <span className="text-xs font-medium text-gray-700">Primary</span>
            <div className="text-xs text-gray-500 mt-1 font-mono">
              {currentPalette.primary}
            </div>
          </div>

          <div className="text-center">
            <div 
              className="w-12 h-12 rounded-xl shadow-md border-2 border-white mx-auto mb-2 transition-all duration-300"
              style={{ backgroundColor: currentPalette.secondary }}
            />
            <span className="text-xs font-medium text-gray-700">Secondary</span>
            <div className="text-xs text-gray-500 mt-1 font-mono">
              {currentPalette.secondary}
            </div>
          </div>

          {currentPalette.accent && (
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-xl shadow-md border-2 border-white mx-auto mb-2 transition-all duration-300"
                style={{ backgroundColor: currentPalette.accent }}
              />
              <span className="text-xs font-medium text-gray-700">Accent</span>
              <div className="text-xs text-gray-500 mt-1 font-mono">
                {currentPalette.accent}
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Button */}
        <div className="mt-6 flex justify-center">
          <button
            className="px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: currentPalette.primary }}
          >
            Preview Button
          </button>
        </div>
      </div>
    </div>
  );
}