import React, { createContext, useContext, useReducer, useEffect, Dispatch, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// Definición de tipos
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  company?: string;
  location?: string;
  plan: 'gratuito' | 'emprendedor' | 'profesional';
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'expired';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionCanceledAt?: string;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Store {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  whatsapp?: string;
  currency: string;
  headingFont: string;
  bodyFont: string;
  colorPalette: string;
  themeMode: 'light' | 'dark' | 'system';
  borderRadius: number;
  productsPerPage: number;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  showSocialInCatalog: boolean;
  acceptCash: boolean;
  acceptBankTransfer: boolean;
  bankDetails?: string;
  allowPickup: boolean;
  allowDelivery: boolean;
  deliveryCost: number;
  deliveryZone?: string;
  messageGreeting: string;
  messageIntroduction: string;
  messageClosing: string;
  includePhoneInMessage: boolean;
  includeCommentsInMessage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreState {
  user: User | null;
  stores: Store[];
  currentStore: Store | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

// Definición del estado inicial
const initialState: StoreState = {
  user: null,
  stores: [],
  currentStore: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
};

// Tipos de acciones
type ActionType =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_STORES'; payload: Store[] }
  | { type: 'SET_CURRENT_STORE'; payload: Store | null }
  | { type: 'ADD_STORE'; payload: Store }
  | { type: 'UPDATE_STORE'; payload: Partial<Store> }
  | { type: 'DELETE_STORE'; payload: string }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'LOGOUT' };

// Reducer
function storeReducer(state: StoreState, action: ActionType): StoreState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_STORES':
      return { ...state, stores: action.payload };
    case 'SET_CURRENT_STORE':
      return { ...state, currentStore: action.payload };
    case 'ADD_STORE':
      const newStores = [...state.stores, action.payload];
      return { 
        ...state, 
        stores: newStores,
        currentStore: action.payload // Set as current store
      };
    case 'UPDATE_STORE':
      const updatedStores = state.stores.map(store =>
        store.id === state.currentStore?.id
          ? { ...store, ...action.payload, updatedAt: new Date().toISOString() }
          : store
      );
      const updatedCurrentStore = state.currentStore
        ? { ...state.currentStore, ...action.payload, updatedAt: new Date().toISOString() }
        : null;
      return {
        ...state,
        stores: updatedStores,
        currentStore: updatedCurrentStore
      };
    case 'DELETE_STORE':
      const filteredStores = state.stores.filter(store => store.id !== action.payload);
      const newCurrentStore = state.currentStore?.id === action.payload
        ? (filteredStores.length > 0 ? filteredStores[0] : null)
        : state.currentStore;
      return {
        ...state,
        stores: filteredStores,
        currentStore: newCurrentStore
      };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'LOGOUT':
      return {
        ...initialState,
        isInitialized: true
      };
    default:
      return state;
  }
}

// Contexto
const StoreContext = createContext<{
  state: StoreState;
  dispatch: Dispatch<ActionType>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  createStore: (storeData: Omit<Store, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Store>;
  canCreateStore: () => boolean;
  getMaxStores: () => number;
}>({
  state: initialState,
  dispatch: () => null,
  login: async () => {},
  register: async () => {},
  createStore: async () => ({} as Store),
  canCreateStore: () => false,
  getMaxStores: () => 1,
});

// Funciones auxiliares
function transformSupabaseUserToAppUser(supabaseUser: any, userData: any): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: userData?.name || '',
    phone: userData?.phone || undefined,
    bio: userData?.bio || undefined,
    avatar: userData?.avatar || undefined,
    company: userData?.company || undefined,
    location: userData?.location || undefined,
    plan: userData?.plan || 'gratuito',
    subscriptionId: userData?.subscription_id || undefined,
    subscriptionStatus: userData?.subscription_status || undefined,
    subscriptionStartDate: userData?.subscription_start_date || undefined,
    subscriptionEndDate: userData?.subscription_end_date || undefined,
    subscriptionCanceledAt: userData?.subscription_canceled_at || undefined,
    paymentMethod: userData?.payment_method || undefined,
    createdAt: userData?.created_at || undefined,
    updatedAt: userData?.updated_at || undefined,
  };
}

function transformSupabaseStoreToAppStore(storeData: any): Store {
  return {
    id: storeData.id,
    userId: storeData.user_id,
    name: storeData.name,
    slug: storeData.slug,
    description: storeData.description || undefined,
    logo: storeData.logo || undefined,
    whatsapp: storeData.whatsapp || undefined,
    currency: storeData.currency || 'USD',
    headingFont: storeData.heading_font || 'Inter',
    bodyFont: storeData.body_font || 'Inter',
    colorPalette: storeData.color_palette || 'predeterminado',
    themeMode: storeData.theme_mode || 'light',
    borderRadius: storeData.border_radius || 8,
    productsPerPage: storeData.products_per_page || 12,
    facebookUrl: storeData.facebook_url || undefined,
    instagramUrl: storeData.instagram_url || undefined,
    tiktokUrl: storeData.tiktok_url || undefined,
    twitterUrl: storeData.twitter_url || undefined,
    showSocialInCatalog: storeData.show_social_in_catalog ?? true,
    acceptCash: storeData.accept_cash ?? true,
    acceptBankTransfer: storeData.accept_bank_transfer ?? false,
    bankDetails: storeData.bank_details || undefined,
    allowPickup: storeData.allow_pickup ?? true,
    allowDelivery: storeData.allow_delivery ?? false,
    deliveryCost: storeData.delivery_cost || 0,
    deliveryZone: storeData.delivery_zone || undefined,
    messageGreeting: storeData.message_greeting || '¡Hola {storeName}!',
    messageIntroduction: storeData.message_introduction || 'Soy {customerName}.\nMe gustaría hacer el siguiente pedido:',
    messageClosing: storeData.message_closing || '¡Muchas gracias!',
    includePhoneInMessage: storeData.include_phone_in_message ?? true,
    includeCommentsInMessage: storeData.include_comments_in_message ?? true,
    createdAt: storeData.created_at,
    updatedAt: storeData.updated_at,
  };
}

// Proveedor de contexto
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  // Función para obtener límites por plan
  const getMaxStores = (): number => {
    const userPlan = state.user?.plan || 'gratuito';
    switch (userPlan) {
      case 'gratuito': return 1;
      case 'emprendedor': return 2;
      case 'profesional': return 5;
      default: return 1;
    }
  };

  // Función para verificar si puede crear tiendas
  const canCreateStore = (): boolean => {
    const maxStores = getMaxStores();
    const currentStoreCount = state.stores.length;
    return currentStoreCount < maxStores;
  };

  // Función para crear tienda
  const createStore = async (storeData: Omit<Store, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Store> => {
    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar límites
    if (!canCreateStore()) {
      const maxStores = getMaxStores();
      throw new Error(`Has alcanzado el límite de ${maxStores} tienda(s) para tu plan ${state.user.plan}. Actualiza tu plan para crear más tiendas.`);
    }

    // Verificar que el slug no exista
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', storeData.slug)
      .single();

    if (existingStore) {
      throw new Error('Esta URL ya está en uso. Por favor elige otra.');
    }

    // Crear tienda en Supabase
    const { data, error } = await supabase
      .from('stores')
      .insert({
        user_id: state.user.id,
        name: storeData.name,
        slug: storeData.slug,
        description: storeData.description,
        logo: storeData.logo,
        whatsapp: storeData.whatsapp,
        currency: storeData.currency,
        heading_font: storeData.headingFont,
        body_font: storeData.bodyFont,
        color_palette: storeData.colorPalette,
        theme_mode: storeData.themeMode,
        border_radius: storeData.borderRadius,
        products_per_page: storeData.productsPerPage,
        facebook_url: storeData.facebookUrl,
        instagram_url: storeData.instagramUrl,
        tiktok_url: storeData.tiktokUrl,
        twitter_url: storeData.twitterUrl,
        show_social_in_catalog: storeData.showSocialInCatalog,
        accept_cash: storeData.acceptCash,
        accept_bank_transfer: storeData.acceptBankTransfer,
        bank_details: storeData.bankDetails,
        allow_pickup: storeData.allowPickup,
        allow_delivery: storeData.allowDelivery,
        delivery_cost: storeData.deliveryCost,
        delivery_zone: storeData.deliveryZone,
        message_greeting: storeData.messageGreeting,
        message_introduction: storeData.messageIntroduction,
        message_closing: storeData.messageClosing,
        include_phone_in_message: storeData.includePhoneInMessage,
        include_comments_in_message: storeData.includeCommentsInMessage,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating store:', error);
      throw new Error('No se pudo crear la tienda. Intenta de nuevo.');
    }

    const newStore = transformSupabaseStoreToAppStore(data);
    dispatch({ type: 'ADD_STORE', payload: newStore });
    
    return newStore;
  };

  // Función de login (sin cambios)
  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const appUser = transformSupabaseUserToAppUser(data.user, userData);
      dispatch({ type: 'SET_USER', payload: appUser });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });

      // Cargar tiendas del usuario
      await loadUserStores(data.user.id);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Función de registro (sin cambios)
  const register = async (email: string, password: string, name: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { name }
        }
      });
      if (error) throw error;
      
      if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          name: name,
          plan: 'gratuito'
        });

        const appUser = transformSupabaseUserToAppUser(data.user, { name, plan: 'gratuito' });
        dispatch({ type: 'SET_USER', payload: appUser });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });

        // Cargar tiendas del usuario (debería estar vacío para nuevos usuarios)
        await loadUserStores(data.user.id);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Función para cargar tiendas del usuario
  const loadUserStores = async (userId: string) => {
    try {
      const { data: storesData, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading stores:', error);
        return;
      }

      const stores = storesData?.map(transformSupabaseStoreToAppStore) || [];
      dispatch({ type: 'SET_STORES', payload: stores });

      // Set first store as current if exists
      if (stores.length > 0) {
        dispatch({ type: 'SET_CURRENT_STORE', payload: stores[0] });
      }
    } catch (error) {
      console.error('Error loading user stores:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          const appUser = transformSupabaseUserToAppUser(user, userData);
          dispatch({ type: 'SET_USER', payload: appUser });
          dispatch({ type: 'SET_AUTHENTICATED', payload: true });

          // Cargar tiendas del usuario
          await loadUserStores(user.id);
        }
      } catch (error) {
        console.error('Authentication initialization error:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    };

    initializeAuth();
  }, []);

  return (
    <StoreContext.Provider value={{ 
      state, 
      dispatch, 
      login, 
      register, 
      createStore,
      canCreateStore,
      getMaxStores
    }}>
      {children}
    </StoreContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

export default StoreContext;