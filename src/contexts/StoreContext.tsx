import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase, type Tables, type TablesInsert, type TablesUpdate } from '../lib/supabase';
import { MessageTemplate } from '../utils/whatsapp';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
  isLoading: boolean;
  isInitialized: boolean;
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
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_AUTH_STATE'; payload: { isAuthenticated: boolean; user: User | null; isInitialized?: boolean } }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  user: null,
  stores: [],
  currentStore: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
};

function storeReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true, 
        isLoading: false,
        isInitialized: true
      };
    case 'SET_AUTH_STATE':
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        isLoading: false,
        isInitialized: action.payload.isInitialized ?? true
      };
    case 'SET_STORES':
      return { ...state, stores: action.payload };
    case 'SET_CURRENT_STORE':
      return { ...state, currentStore: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
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
      return { 
        ...initialState, 
        isInitialized: true, 
        isLoading: false 
      };
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
} | null>(null);

// Helper functions to transform data between Supabase and app formats
function transformSupabaseUserToAppUser(supabaseUser: SupabaseUser, dbUser?: Tables<'users'>): User {
  return {
    name: dbUser?.name || supabaseUser.user_metadata?.name || '',
    email: supabaseUser.email || '',
    phone: dbUser?.phone || '',
    bio: dbUser?.bio || '',
    avatar: dbUser?.avatar || '',
    company: dbUser?.company || '',
    location: dbUser?.location || '',
    plan: dbUser?.plan || 'gratuito',
    subscriptionId: dbUser?.subscription_id || undefined,
    subscriptionStatus: dbUser?.subscription_status || undefined,
    subscriptionStartDate: dbUser?.subscription_start_date || undefined,
    subscriptionEndDate: dbUser?.subscription_end_date || undefined,
    subscriptionCanceledAt: dbUser?.subscription_canceled_at || undefined,
    paymentMethod: dbUser?.payment_method || undefined,
    createdAt: dbUser?.created_at || supabaseUser.created_at,
    updatedAt: dbUser?.updated_at || undefined,
  };
}

function transformSupabaseStoreToAppStore(
  dbStore: Tables<'stores'>, 
  products: Tables<'products'>[] = [], 
  categories: Tables<'categories'>[] = []
): Store {
  return {
    id: dbStore.id,
    name: dbStore.name,
    slug: dbStore.slug,
    description: dbStore.description || '',
    logo: dbStore.logo || '',
    whatsapp: dbStore.whatsapp || '',
    currency: dbStore.currency || 'USD',
    fonts: {
      heading: dbStore.heading_font || 'Inter',
      body: dbStore.body_font || 'Inter',
    },
    theme: {
      colorPalette: dbStore.color_palette || 'predeterminado',
      mode: dbStore.theme_mode || 'light',
      borderRadius: dbStore.border_radius || 8,
      productsPerPage: dbStore.products_per_page || 12,
    },
    socialMedia: {
      facebook: dbStore.facebook_url || '',
      instagram: dbStore.instagram_url || '',
      tiktok: dbStore.tiktok_url || '',
      twitter: dbStore.twitter_url || '',
      showInCatalog: dbStore.show_social_in_catalog ?? true,
    },
    paymentMethods: {
      cash: dbStore.accept_cash ?? true,
      bankTransfer: dbStore.accept_bank_transfer ?? false,
      bankDetails: dbStore.bank_details || '',
    },
    shippingMethods: {
      pickup: dbStore.allow_pickup ?? true,
      delivery: dbStore.allow_delivery ?? false,
      deliveryCost: dbStore.delivery_cost || 0,
      deliveryZone: dbStore.delivery_zone || '',
    },
    messageTemplate: {
      greeting: dbStore.message_greeting || '¡Hola {storeName}!',
      introduction: dbStore.message_introduction || 'Soy {customerName}.\nMe gustaría hacer el siguiente pedido:',
      closing: dbStore.message_closing || '¡Muchas gracias!',
      includePhone: dbStore.include_phone_in_message ?? true,
      includeComments: dbStore.include_comments_in_message ?? true,
    },
    products: products.map(p => ({
      id: p.id,
      name: p.name,
      shortDescription: p.short_description || '',
      longDescription: p.long_description || '',
      price: p.price,
      categoryId: p.category_id || '',
      mainImage: p.main_image || '',
      gallery: Array.isArray(p.gallery) ? p.gallery : [],
      isActive: p.is_active ?? true,
      isFeatured: p.is_featured ?? false,
      createdAt: p.created_at || new Date().toISOString(),
    })),
    categories: categories.map(c => ({
      id: c.id,
      name: c.name,
      createdAt: c.created_at || new Date().toISOString(),
    })),
    createdAt: dbStore.created_at || new Date().toISOString(),
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  // Load user data
  const loadUserData = async (userId: string) => {
    try {
      console.log('Loading user data for:', userId);

      // Load user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error loading user data:', userError);
        return;
      }

      // Load stores with their products and categories
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select(`
          *,
          products(*),
          categories(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (storesError) {
        console.error('Error loading stores:', storesError);
        return;
      }

      // Transform and set stores
      const transformedStores = (storesData || []).map(store => 
        transformSupabaseStoreToAppStore(
          store,
          store.products || [],
          store.categories || []
        )
      );

      dispatch({ type: 'SET_STORES', payload: transformedStores });

      // Set current store (first one if available)
      if (transformedStores.length > 0) {
        dispatch({ type: 'SET_CURRENT_STORE', payload: transformedStores[0] });
      }

      console.log('User data loaded successfully');
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Initialize auth - SIMPLIFIED VERSION
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...');

        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          if (mounted) {
            dispatch({ type: 'SET_AUTH_STATE', payload: { isAuthenticated: false, user: null, isInitialized: true } });
          }
          return;
        }

        if (session?.user) {
          console.log('✅ Found existing session for:', session.user.email);
          
          // Load user data from database
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const appUser = transformSupabaseUserToAppUser(session.user, userData);
          
          if (mounted) {
            dispatch({ type: 'SET_USER', payload: appUser });
            await loadUserData(session.user.id);
          }
        } else {
          console.log('❌ No existing session found');
          if (mounted) {
            dispatch({ type: 'SET_AUTH_STATE', payload: { isAuthenticated: false, user: null, isInitialized: true } });
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          dispatch({ type: 'SET_AUTH_STATE', payload: { isAuthenticated: false, user: null, isInitialized: true } });
        }
      }
    };

    // Initialize immediately
    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state changed:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.email);
          
          // Create/update user profile
          await supabase
            .from('users')
            .upsert({
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
              plan: 'gratuito',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          // Load user data
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const appUser = transformSupabaseUserToAppUser(session.user, userData);
          dispatch({ type: 'SET_USER', payload: appUser });
          await loadUserData(session.user.id);

        } else if (event === 'SIGNED_OUT') {
          console.log('❌ User signed out');
          dispatch({ type: 'LOGOUT' });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    console.log('🔄 Attempting login for:', email);
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        console.error('❌ Login error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Login successful for:', email);
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  // Register function
  const register = async (email: string, password: string, name: string) => {
    console.log('🔄 Attempting registration for:', email);
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            plan: 'gratuito'
          }
        }
      });

      if (error) {
        console.error('❌ Registration error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Registration successful for:', email);
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    console.log('🔄 Logging out...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      dispatch({ type: 'LOGOUT' });
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  };

  return (
    <StoreContext.Provider value={{ 
      state, 
      dispatch,
      login,
      register,
      logout,
    }}>
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