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
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
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
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' };

// ✅ SOLUCIÓN CRÍTICA: Estado inicial que permite renderizado inmediato
const initialState: AppState = {
  user: null,
  stores: [],
  currentStore: null,
  isAuthenticated: false,
  isLoaded: true,  // ✅ CAMBIO CRÍTICO: Empezar como cargado
  isLoading: false, // ✅ CAMBIO CRÍTICO: No mostrar loading inicial
  error: null,
};

function storeReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, error: null };
    case 'SET_STORES':
      return { ...state, stores: action.payload };
    case 'SET_CURRENT_STORE':
      return { ...state, currentStore: action.payload };
    case 'SET_LOADED':
      return { ...state, isLoaded: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
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
      return { ...initialState, isLoaded: true, isLoading: false };
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  createStore?: (storeData: Partial<Store>) => Promise<Store>;
  updateStore?: (storeId: string, updates: Partial<Store>) => Promise<void>;
  deleteStore?: (storeId: string) => Promise<void>;
  createProduct?: (productData: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>;
  updateProduct?: (productData: Product) => Promise<void>;
  deleteProduct?: (productId: string) => Promise<void>;
  createCategory?: (categoryData: Omit<Category, 'id' | 'createdAt'>) => Promise<Category>;
  updateCategory?: (categoryData: Category) => Promise<void>;
  deleteCategory?: (categoryId: string) => Promise<void>;
  logout?: () => Promise<void>;
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

  // 🔍 LOGGING: Add comprehensive logging
  const log = (message: string, data?: any) => {
    console.log(`[StoreContext] ${message}`, data || '');
  };

  // ✅ SOLUCIÓN: Carga de datos en background sin bloquear UI
  const loadUserDataInBackground = async (userId: string) => {
    try {
      log('Loading user data in background for:', userId);

      // Load user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        log('Error loading user data:', userError);
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
        log('Error loading stores:', storesError);
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

      log('Background data loading completed successfully');

    } catch (error) {
      log('Error in background data loading:', error);
    }
  };

  // ✅ SOLUCIÓN CRÍTICA: Inicialización que NO bloquea el renderizado

  // CRUD Operations for Stores
  const createStore = async (storeData: Partial<Store>) => {
    try {
      log('Creating store:', storeData);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const insertData: TablesInsert<'stores'> = {
        user_id: user.id,
        name: storeData.name!,
        slug: storeData.slug!,
        description: storeData.description,
        logo: storeData.logo,
        whatsapp: storeData.whatsapp,
        currency: storeData.currency || 'USD',
        heading_font: storeData.fonts?.heading || 'Inter',
        body_font: storeData.fonts?.body || 'Inter',
        color_palette: storeData.theme?.colorPalette || 'predeterminado',
        theme_mode: storeData.theme?.mode || 'light',
        border_radius: storeData.theme?.borderRadius || 8,
        products_per_page: storeData.theme?.productsPerPage || 12,
        facebook_url: storeData.socialMedia?.facebook,
        instagram_url: storeData.socialMedia?.instagram,
        tiktok_url: storeData.socialMedia?.tiktok,
        twitter_url: storeData.socialMedia?.twitter,
        show_social_in_catalog: storeData.socialMedia?.showInCatalog ?? true,
        accept_cash: storeData.paymentMethods?.cash ?? true,
        accept_bank_transfer: storeData.paymentMethods?.bankTransfer ?? false,
        bank_details: storeData.paymentMethods?.bankDetails,
        allow_pickup: storeData.shippingMethods?.pickup ?? true,
        allow_delivery: storeData.shippingMethods?.delivery ?? false,
        delivery_cost: storeData.shippingMethods?.deliveryCost || 0,
        delivery_zone: storeData.shippingMethods?.deliveryZone,
        message_greeting: storeData.messageTemplate?.greeting,
        message_introduction: storeData.messageTemplate?.introduction,
        message_closing: storeData.messageTemplate?.closing,
        include_phone_in_message: storeData.messageTemplate?.includePhone ?? true,
        include_comments_in_message: storeData.messageTemplate?.includeComments ?? true,
      };

      const { data, error } = await supabase
        .from('stores')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      const newStore = transformSupabaseStoreToAppStore(data);
      dispatch({ type: 'SET_STORES', payload: [...state.stores, newStore] });
      dispatch({ type: 'SET_CURRENT_STORE', payload: newStore });

      log('Store created successfully:', newStore);
      return newStore;
    } catch (error) {
      log('Error creating store:', error);
      throw error;
    }
  };

  const updateStore = async (storeId: string, updates: Partial<Store>) => {
    try {
      log('Updating store:', { storeId, updates });
      
      const updateData: TablesUpdate<'stores'> = {
        name: updates.name,
        slug: updates.slug,
        description: updates.description,
        logo: updates.logo,
        whatsapp: updates.whatsapp,
        currency: updates.currency,
        heading_font: updates.fonts?.heading,
        body_font: updates.fonts?.body,
        color_palette: updates.theme?.colorPalette,
        theme_mode: updates.theme?.mode,
        border_radius: updates.theme?.borderRadius,
        products_per_page: updates.theme?.productsPerPage,
        facebook_url: updates.socialMedia?.facebook,
        instagram_url: updates.socialMedia?.instagram,
        tiktok_url: updates.socialMedia?.tiktok,
        twitter_url: updates.socialMedia?.twitter,
        show_social_in_catalog: updates.socialMedia?.showInCatalog,
        accept_cash: updates.paymentMethods?.cash,
        accept_bank_transfer: updates.paymentMethods?.bankTransfer,
        bank_details: updates.paymentMethods?.bankDetails,
        allow_pickup: updates.shippingMethods?.pickup,
        allow_delivery: updates.shippingMethods?.delivery,
        delivery_cost: updates.shippingMethods?.deliveryCost,
        delivery_zone: updates.shippingMethods?.deliveryZone,
        message_greeting: updates.messageTemplate?.greeting,
        message_introduction: updates.messageTemplate?.introduction,
        message_closing: updates.messageTemplate?.closing,
        include_phone_in_message: updates.messageTemplate?.includePhone,
        include_comments_in_message: updates.messageTemplate?.includeComments,
      };

      const { error } = await supabase
        .from('stores')
        .update(updateData)
        .eq('id', storeId);

      if (error) throw error;

      dispatch({ type: 'UPDATE_STORE', payload: updates });
      log('Store updated successfully');
    } catch (error) {
      log('Error updating store:', error);
      throw error;
    }
  };

  const deleteStore = async (storeId: string) => {
    try {
      log('Deleting store:', storeId);
      
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;

      dispatch({ type: 'DELETE_STORE', payload: storeId });
      log('Store deleted successfully');
    } catch (error) {
      log('Error deleting store:', error);
      throw error;
    }
  };

  // CRUD Operations for Products
  const createProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      log('Creating product:', productData);
      if (!state.currentStore) throw new Error('No current store selected');

      const insertData: TablesInsert<'products'> = {
        store_id: state.currentStore.id,
        category_id: productData.categoryId || null,
        name: productData.name,
        short_description: productData.shortDescription,
        long_description: productData.longDescription,
        price: productData.price,
        main_image: productData.mainImage,
        gallery: productData.gallery,
        is_active: productData.isActive,
        is_featured: productData.isFeatured,
      };

      const { data, error } = await supabase
        .from('products')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      const newProduct: Product = {
        id: data.id,
        name: data.name,
        shortDescription: data.short_description || '',
        longDescription: data.long_description || '',
        price: data.price,
        categoryId: data.category_id || '',
        mainImage: data.main_image || '',
        gallery: Array.isArray(data.gallery) ? data.gallery : [],
        isActive: data.is_active ?? true,
        isFeatured: data.is_featured ?? false,
        createdAt: data.created_at || new Date().toISOString(),
      };

      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
      log('Product created successfully:', newProduct);
      return newProduct;
    } catch (error) {
      log('Error creating product:', error);
      throw error;
    }
  };

  const updateProduct = async (productData: Product) => {
    try {
      log('Updating product:', productData);
      
      const updateData: TablesUpdate<'products'> = {
        category_id: productData.categoryId || null,
        name: productData.name,
        short_description: productData.shortDescription,
        long_description: productData.longDescription,
        price: productData.price,
        main_image: productData.mainImage,
        gallery: productData.gallery,
        is_active: productData.isActive,
        is_featured: productData.isFeatured,
      };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productData.id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_PRODUCT', payload: productData });
      log('Product updated successfully');
    } catch (error) {
      log('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      log('Deleting product:', productId);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      dispatch({ type: 'DELETE_PRODUCT', payload: productId });
      log('Product deleted successfully');
    } catch (error) {
      log('Error deleting product:', error);
      throw error;
    }
  };

  // CRUD Operations for Categories
  const createCategory = async (categoryData: Omit<Category, 'id' | 'createdAt'>) => {
    try {
      log('Creating category:', categoryData);
      if (!state.currentStore) throw new Error('No current store selected');

      const insertData: TablesInsert<'categories'> = {
        store_id: state.currentStore.id,
        name: categoryData.name,
      };

      const { data, error } = await supabase
        .from('categories')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      const newCategory: Category = {
        id: data.id,
        name: data.name,
        createdAt: data.created_at || new Date().toISOString(),
      };

      dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
      log('Category created successfully:', newCategory);
      return newCategory;
    } catch (error) {
      log('Error creating category:', error);
      throw error;
    }
  };

  const updateCategory = async (categoryData: Category) => {
    try {
      log('Updating category:', categoryData);
      
      const { error } = await supabase
        .from('categories')
        .update({ name: categoryData.name })
        .eq('id', categoryData.id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_CATEGORY', payload: categoryData });
      log('Category updated successfully');
    } catch (error) {
      log('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      log('Deleting category:', categoryId);
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      dispatch({ type: 'DELETE_CATEGORY', payload: categoryId });
      log('Category deleted successfully');
    } catch (error) {
      log('Error deleting category:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      log('Logging out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      dispatch({ type: 'LOGOUT' });
      log('Logout successful');
    } catch (error) {
      log('Error signing out:', error);
      throw error;
    }
  };

  return (
    <StoreContext.Provider value={{ 
      state, 
      dispatch,
      // Expose CRUD operations
      createStore,
      updateStore,
      deleteStore,
      createProduct,
      updateProduct,
      deleteProduct,
      createCategory,
      updateCategory,
      deleteCategory,
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