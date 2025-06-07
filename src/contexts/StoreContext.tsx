import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { MessageTemplate } from '../utils/whatsapp';

export interface Product {
  id: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  price: number;
  categoryId: string;
  mainImage?: string;
  gallery: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface SocialMedia {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  showInCatalog: boolean;
}

export interface Theme {
  colorPalette: string;
  mode: 'light' | 'dark' | 'system';
  borderRadius: number;
  productsPerPage: number;
}

export interface Fonts {
  heading: string;
  body: string;
}

export interface PaymentMethod {
  cash: boolean;
  bankTransfer: boolean;
  bankDetails?: string;
}

export interface ShippingMethod {
  pickup: boolean;
  delivery: boolean;
  deliveryCost?: number;
  deliveryZone?: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  whatsapp: string;
  currency: string;
  fonts: Fonts;
  theme: Theme;
  socialMedia: SocialMedia;
  paymentMethods: PaymentMethod;
  shippingMethods: ShippingMethod;
  messageTemplate?: MessageTemplate;
  products: Product[];
  categories: Category[];
  createdAt: string;
}

export interface User {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  company?: string;
  location?: string;
  plan: 'gratuito' | 'emprendedor' | 'profesional';
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionCanceledAt?: string;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AppState {
  user: User | null;
  stores: Store[];
  currentStore: Store | null;
  isAuthenticated: boolean;
  isLoaded: boolean;
}

type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_STORES'; payload: Store[] }
  | { type: 'SET_CURRENT_STORE'; payload: Store }
  | { type: 'UPDATE_STORE'; payload: Partial<Store> }
  | { type: 'DELETE_STORE'; payload: string }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_LOADED'; payload: boolean }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  user: null,
  stores: [],
  currentStore: null,
  isAuthenticated: false,
  isLoaded: false,
};

function storeReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'SET_STORES':
      return { ...state, stores: action.payload };
    case 'SET_CURRENT_STORE':
      return { ...state, currentStore: action.payload };
    case 'SET_LOADED':
      return { ...state, isLoaded: action.payload };
    case 'DELETE_STORE':
      const updatedStores = state.stores.filter(store => store.id !== action.payload);
      const newCurrentStore = state.currentStore?.id === action.payload 
        ? (updatedStores.length > 0 ? updatedStores[0] : null)
        : state.currentStore;
      return {
        ...state,
        stores: updatedStores,
        currentStore: newCurrentStore
      };
    case 'UPDATE_STORE':
      if (!state.currentStore) {
        return state;
      }
      const updatedStore = { ...state.currentStore, ...action.payload };
      const updatedStoresArray = state.stores.map(store =>
        store.id === updatedStore.id ? updatedStore : store
      );
      return {
        ...state,
        currentStore: updatedStore,
        stores: updatedStoresArray
      };
    case 'ADD_PRODUCT':
      if (!state.currentStore) {
        return state;
      }
      const storeWithNewProduct = {
        ...state.currentStore,
        products: [...state.currentStore.products, action.payload]
      };
      return {
        ...state,
        currentStore: storeWithNewProduct,
        stores: state.stores.map(store =>
          store.id === storeWithNewProduct.id ? storeWithNewProduct : store
        )
      };
    case 'UPDATE_PRODUCT':
      if (!state.currentStore) {
        return state;
      }
      const storeWithUpdatedProduct = {
        ...state.currentStore,
        products: state.currentStore.products.map(product =>
          product.id === action.payload.id ? action.payload : product
        )
      };
      return {
        ...state,
        currentStore: storeWithUpdatedProduct,
        stores: state.stores.map(store =>
          store.id === storeWithUpdatedProduct.id ? storeWithUpdatedProduct : store
        )
      };
    case 'DELETE_PRODUCT':
      if (!state.currentStore) {
        return state;
      }
      const storeWithoutProduct = {
        ...state.currentStore,
        products: state.currentStore.products.filter(product => product.id !== action.payload)
      };
      return {
        ...state,
        currentStore: storeWithoutProduct,
        stores: state.stores.map(store =>
          store.id === storeWithoutProduct.id ? storeWithoutProduct : store
        )
      };
    case 'ADD_CATEGORY':
      if (!state.currentStore) {
        return state;
      }
      const storeWithNewCategory = {
        ...state.currentStore,
        categories: [...state.currentStore.categories, action.payload]
      };
      return {
        ...state,
        currentStore: storeWithNewCategory,
        stores: state.stores.map(store =>
          store.id === storeWithNewCategory.id ? storeWithNewCategory : store
        )
      };
    case 'UPDATE_CATEGORY':
      if (!state.currentStore) {
        return state;
      }
      const storeWithUpdatedCategory = {
        ...state.currentStore,
        categories: state.currentStore.categories.map(category =>
          category.id === action.payload.id ? action.payload : category
        )
      };
      return {
        ...state,
        currentStore: storeWithUpdatedCategory,
        stores: state.stores.map(store =>
          store.id === storeWithUpdatedCategory.id ? storeWithUpdatedCategory : store
        )
      };
    case 'DELETE_CATEGORY':
      if (!state.currentStore) {
        return state;
      }
      const storeWithoutCategory = {
        ...state.currentStore,
        categories: state.currentStore.categories.filter(category => category.id !== action.payload)
      };
      return {
        ...state,
        currentStore: storeWithoutCategory,
        stores: state.stores.map(store =>
          store.id === storeWithoutCategory.id ? storeWithoutCategory : store
        )
      };
    case 'LOGOUT':
      // Clear localStorage on logout
      localStorage.removeItem(STORAGE_KEY);
      return { ...initialState, isLoaded: true };
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

const STORAGE_KEY = 'tutaviendo_data';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  // Load data from localStorage on mount (only once)
  useEffect(() => {
    let isMounted = true;
    
    const loadData = () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData && isMounted) {
          const parsedData = JSON.parse(savedData);
          
          if (parsedData.user) {
            // Add createdAt if it doesn't exist (for existing users)
            const userWithDefaults = {
              ...parsedData.user,
              createdAt: parsedData.user.createdAt || new Date().toISOString(),
            };
            dispatch({ type: 'SET_USER', payload: userWithDefaults });
          }
          
          if (parsedData.stores && Array.isArray(parsedData.stores) && parsedData.stores.length > 0) {
            dispatch({ type: 'SET_STORES', payload: parsedData.stores });
            // Set the first store as current if no current store is set
            if (parsedData.stores[0]) {
              dispatch({ type: 'SET_CURRENT_STORE', payload: parsedData.stores[0] });
            }
          }
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (isMounted) {
          dispatch({ type: 'SET_LOADED', payload: true });
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once

  // Save data to localStorage when relevant state changes (debounced)
  useEffect(() => {
    if (!state.isLoaded || !state.isAuthenticated) return;

    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          user: state.user,
          stores: state.stores,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Error saving data to localStorage:', error);
      }
    }, 500); // Debounce saves by 500ms

    return () => clearTimeout(timeoutId);
  }, [state.user, state.stores, state.isAuthenticated, state.isLoaded]);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}