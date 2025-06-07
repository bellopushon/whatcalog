import React, { createContext, useContext, useEffect, useState } from 'react';

export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent?: string;
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'predeterminado',
    name: 'Predeterminado',
    description: 'Morados vibrantes y magenta para un look moderno',
    primary: '#6366f1',
    secondary: '#ec4899',
  },
  {
    id: 'oceano-profundo',
    name: 'Océano Profundo',
    description: 'Azules calmantes con un toque turquesa brillante',
    primary: '#1e40af',
    secondary: '#06b6d4',
  },
  {
    id: 'atardecer-vibrante',
    name: 'Atardecer Vibrante',
    description: 'Naranjas y rojos cálidos y energéticos',
    primary: '#f97316',
    secondary: '#ef4444',
  },
  {
    id: 'bosque-sereno',
    name: 'Bosque Sereno',
    description: 'Verdes naturales para una sensación fresca',
    primary: '#16a34a',
    secondary: '#65a30d',
  },
  {
    id: 'chispa-electrica',
    name: 'Chispa Eléctrica',
    description: 'Amarillo energético con acentos rosa vibrante',
    primary: '#f59e0b',
    secondary: '#ec4899',
  },
  {
    id: 'montana-majestuosa',
    name: 'Montaña Majestuosa',
    description: 'Grises sofisticados y elegantes',
    primary: '#6b7280',
    secondary: '#9ca3af',
  },
];

interface ThemeContextType {
  currentPalette: ColorPalette;
  setCurrentPalette: (palette: ColorPalette) => void;
  borderRadius: number;
  setBorderRadius: (radius: number) => void;
  applyTheme: (paletteId: string, borderRadius?: number) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>(COLOR_PALETTES[0]);
  const [borderRadius, setBorderRadius] = useState<number>(8);
  
  // Estado para dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return false;
  });

  // Aplicar o quitar la clase admin-dark cuando cambie isDarkMode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('admin-dark');
    } else {
      document.documentElement.classList.remove('admin-dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Función para cambiar entre modo claro y oscuro
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const applyTheme = (paletteId: string, newBorderRadius?: number) => {
    const palette = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];
    setCurrentPalette(palette);
    
    if (newBorderRadius !== undefined) {
      setBorderRadius(newBorderRadius);
    }
    
    // Apply CSS variables
    const root = document.documentElement;
    root.style.setProperty('--color-primary', palette.primary);
    root.style.setProperty('--color-secondary', palette.secondary);
    root.style.setProperty('--border-radius', `${newBorderRadius || borderRadius}px`);
  };

  useEffect(() => {
    applyTheme(currentPalette.id, borderRadius);
  }, []);

  return (
    <ThemeContext.Provider value={{
      currentPalette,
      setCurrentPalette,
      borderRadius,
      setBorderRadius,
      applyTheme,
      isDarkMode,
      toggleDarkMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}