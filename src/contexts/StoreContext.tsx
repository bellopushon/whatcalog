import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService, type AuthUser } from '../services/authService';
import { storeService, type Store } from '../services/storeService';
import { productService, type Product } from '../services/productService';
import { categoryService, type Category } from '../services/categoryService';
import { useToast } from './ToastContext';

export interface AppState {
  user: AuthUser | null;
  stores: Store[];
  currentStore: Store | null;
  isAuthenticated: boolean;
  isLoaded: boolean;
  isLoading: boolean;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: AuthUser | null }
  | { type: 'SET_STORES'; payload: Store[] }
  | { type: 'SET_CURRENT_STORE'; payload: Store | null }
  | { type: 'ADD_STORE'; payload: Store }
  | { type: 'UPDATE_STORE'; payload: Store }
  | { type: 'DELETE_STORE'; payload: string }
  | { type: 'SET_LOADED'; payload: boolean }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  user: null,
  stores: [],
  currentStore: null,
  isAuthenticated: false,
  isLoaded: false,
  isLoading: false,
};

function storeReducer(state: AppState, action: Action): AppState {
  console.log('🔄 StoreReducer acción:', action.type);
  
  switch (action.type) {
    case 'SET_LOADING':
      console.log('📊 SET_LOADING:', action.payload);
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      console.log('👤 SET_USER:', action.payload?.id || 'null');
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: !!action.payload 
      };
    case 'SET_STORES':
      console.log('🏪 SET_STORES:', action.payload.length, 'tiendas');
      return { ...state, stores: action.payload };
    case 'SET_CURRENT_STORE':
      console.log('🎯 SET_CURRENT_STORE:', action.payload?.name || 'null');
      return { ...state, currentStore: action.payload };
    case 'ADD_STORE':
      console.log('➕ ADD_STORE:', action.payload.name);
      return { 
        ...state, 
        stores: [...state.stores, action.payload],
        currentStore: action.payload 
      };
    case 'UPDATE_STORE':
      console.log('✏️ UPDATE_STORE:', action.payload.name);
      const updatedStores = state.stores.map(store =>
        store.id === action.payload.id ? action.payload : store
      );
      return {
        ...state,
        stores: updatedStores,
        currentStore: state.currentStore?.id === action.payload.id 
          ? action.payload 
          : state.currentStore
      };
    case 'DELETE_STORE':
      console.log('🗑️ DELETE_STORE:', action.payload);
      const filteredStores = state.stores.filter(store => store.id !== action.payload);
      const newCurrentStore = state.currentStore?.id === action.payload 
        ? (filteredStores.length > 0 ? filteredStores[0] : null)
        : state.currentStore;
      return {
        ...state,
        stores: filteredStores,
        currentStore: newCurrentStore
      };
    case 'SET_LOADED':
      console.log('✅ SET_LOADED:', action.payload);
      return { ...state, isLoaded: action.payload };
    case 'LOGOUT':
      console.log('🚪 LOGOUT');
      return { ...initialState, isLoaded: true };
    default:
      console.warn('⚠️ Acción desconocida en storeReducer:', action);
      return state;
  }
}

const StoreContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  updateSubscription: (subscriptionData: any) => Promise<void>;
  // Store actions
  createStore: (storeData: any) => Promise<void>;
  updateStore: (storeId: string, updates: Partial<Store>) => Promise<void>;
  deleteStore: (storeId: string) => Promise<void>;
  switchStore: (store: Store) => void;
  // Product actions
  addProduct: (productData: any) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  // Category actions
  addCategory: (categoryData: any) => Promise<void>;
  updateCategory: (categoryId: string, updates: { name: string }) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
} | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, initialState);
  const { error: showError, success: showSuccess } = useToast();

  console.log('🏗️ StoreProvider renderizado, estado actual:', {
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    userId: state.user?.id,
    storesCount: state.stores.length,
    currentStore: state.currentStore?.name
  });

  // FIXED: Initialize app only once with proper cleanup
  useEffect(() => {
    let isMounted = true;
    let authSubscription: any = null;
    let isInitialized = false;

    const initializeApp = async () => {
      // Prevent multiple initializations
      if (isInitialized) {
        console.log('⚠️ Inicialización ya en progreso, saltando...');
        return;
      }
      
      isInitialized = true;
      
      try {
        console.log('🚀 Inicializando aplicación...');
        
        if (!isMounted) return;
        dispatch({ type: 'SET_LOADING', payload: true });

        // Check if user is authenticated
        console.log('🔍 Verificando autenticación...');
        const user = await authService.getCurrentUser();
        console.log('👤 Usuario actual:', user?.id || 'No autenticado');
        
        if (!isMounted) return;
        
        if (user) {
          console.log('✅ Usuario autenticado, configurando estado...');
          dispatch({ type: 'SET_USER', payload: user });
          
          // Load user's stores
          try {
            console.log('🏪 Cargando tiendas del usuario...');
            const stores = await storeService.getUserStores();
            console.log('✅ Tiendas cargadas:', stores.length);
            
            if (isMounted) {
              dispatch({ type: 'SET_STORES', payload: stores });
              
              // Set first store as current if available
              if (stores.length > 0) {
                dispatch({ type: 'SET_CURRENT_STORE', payload: stores[0] });
                console.log('🎯 Tienda actual establecida:', stores[0].name);
              }
            }
          } catch (storeError) {
            console.error('❌ Error cargando tiendas:', storeError);
            if (isMounted) {
              dispatch({ type: 'SET_STORES', payload: [] });
            }
          }
        } else {
          console.log('ℹ️ No hay usuario autenticado');
          dispatch({ type: 'SET_USER', payload: null });
          dispatch({ type: 'SET_STORES', payload: [] });
          dispatch({ type: 'SET_CURRENT_STORE', payload: null });
        }
      } catch (error) {
        console.error('❌ Error en inicialización:', error);
        if (isMounted) {
          dispatch({ type: 'SET_USER', payload: null });
          dispatch({ type: 'SET_STORES', payload: [] });
          dispatch({ type: 'SET_CURRENT_STORE', payload: null });
        }
      } finally {
        if (isMounted) {
          console.log('🏁 Finalizando inicialización...');
          dispatch({ type: 'SET_LOADING', payload: false });
          dispatch({ type: 'SET_LOADED', payload: true });
          console.log('✅ Aplicación inicializada completamente');
        }
      }
    };

    // Initialize app only once
    console.log('🎬 Iniciando proceso de inicialización...');
    initializeApp();

    // Listen for auth changes - FIXED: Only set up once
    console.log('👂 Configurando listener de cambios de auth...');
    authSubscription = authService.onAuthStateChange(async (user) => {
      console.log('🔄 Cambio de estado de autenticación:', user?.id || 'No autenticado');
      
      if (!isMounted) return;
      
      // FIXED: Don't reload everything on auth change, just update user
      dispatch({ type: 'SET_USER', payload: user });
      
      if (user && state.isLoaded) {
        // Only reload stores if we don't have them yet
        if (state.stores.length === 0) {
          try {
            console.log('🏪 Cargando tiendas después del cambio de auth...');
            const stores = await storeService.getUserStores();
            if (isMounted) {
              dispatch({ type: 'SET_STORES', payload: stores });
              if (stores.length > 0) {
                dispatch({ type: 'SET_CURRENT_STORE', payload: stores[0] });
              }
            }
          } catch (error) {
            console.error('❌ Error cargando tiendas después del cambio de auth:', error);
            if (isMounted) {
              dispatch({ type: 'SET_STORES', payload: [] });
              dispatch({ type: 'SET_CURRENT_STORE', payload: null });
            }
          }
        }
      } else if (!user) {
        dispatch({ type: 'SET_STORES', payload: [] });
        dispatch({ type: 'SET_CURRENT_STORE', payload: null });
      }
    });

    return () => {
      console.log('🧹 Limpiando contexto de tienda');
      isMounted = false;
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, []); // CRITICAL: Empty dependency array to prevent infinite loop

  // FIXED: Timeout protection to prevent infinite loading
  useEffect(() => {
    if (!state.isLoading || state.isLoaded) return;
    
    const timeout = setTimeout(() => {
      console.warn('⚠️ Timeout de carga alcanzado, forzando finalización');
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_LOADED', payload: true });
    }, 10000); // 10 seconds maximum
    
    return () => clearTimeout(timeout);
  }, [state.isLoading, state.isLoaded]);

  // Auth actions
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Iniciando signIn...');
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await authService.signIn({ email, password });
      dispatch({ type: 'SET_USER', payload: user });
      
      // Load stores after successful sign in
      try {
        const stores = await storeService.getUserStores();
        dispatch({ type: 'SET_STORES', payload: stores });
        if (stores.length > 0) {
          dispatch({ type: 'SET_CURRENT_STORE', payload: stores[0] });
        }
      } catch (storeError) {
        console.error('Error loading stores after sign in:', storeError);
        dispatch({ type: 'SET_STORES', payload: [] });
      }
      
      showSuccess('¡Bienvenido!', 'Has iniciado sesión correctamente');
      console.log('✅ SignIn completado');
    } catch (error: any) {
      console.error('❌ Error en signIn:', error);
      showError('Error de autenticación', error.message);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('📝 Iniciando signUp...');
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await authService.signUp({ email, password, name });
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_STORES', payload: [] }); // New user has no stores
      showSuccess('¡Cuenta creada!', 'Tu cuenta se ha creado exitosamente');
      console.log('✅ SignUp completado');
    } catch (error: any) {
      console.error('❌ Error en signUp:', error);
      showError('Error de registro', error.message);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Iniciando signOut...');
      await authService.signOut();
      dispatch({ type: 'LOGOUT' });
      showSuccess('Sesión cerrada', 'Has cerrado sesión correctamente');
      console.log('✅ SignOut completado');
    } catch (error: any) {
      console.error('❌ Error en signOut:', error);
      showError('Error al cerrar sesión', error.message);
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    try {
      console.log('👤 Actualizando perfil...');
      const updatedUser = await authService.updateProfile(updates);
      dispatch({ type: 'SET_USER', payload: updatedUser });
      showSuccess('Perfil actualizado', 'Los cambios se han guardado correctamente');
      console.log('✅ Perfil actualizado');
    } catch (error: any) {
      console.error('❌ Error actualizando perfil:', error);
      showError('Error al actualizar perfil', error.message);
      throw error;
    }
  };

  const updateSubscription = async (subscriptionData: any) => {
    try {
      console.log('💳 Actualizando suscripción...');
      const updatedUser = await authService.updateSubscription(subscriptionData);
      dispatch({ type: 'SET_USER', payload: updatedUser });
      showSuccess('Suscripción actualizada', 'Tu plan se ha actualizado correctamente');
      console.log('✅ Suscripción actualizada');
    } catch (error: any) {
      console.error('❌ Error actualizando suscripción:', error);
      showError('Error al actualizar suscripción', error.message);
      throw error;
    }
  };

  // Store actions
  const createStore = async (storeData: any) => {
    try {
      console.log('🏪 Creando tienda...');
      const newStore = await storeService.createStore(storeData);
      dispatch({ type: 'ADD_STORE', payload: newStore });
      showSuccess('¡Tienda creada!', 'Tu nueva tienda está lista');
      console.log('✅ Tienda creada');
    } catch (error: any) {
      console.error('❌ Error creando tienda:', error);
      showError('Error al crear tienda', error.message);
      throw error;
    }
  };

  const updateStore = async (storeId: string, updates: Partial<Store>) => {
    try {
      console.log('✏️ Actualizando tienda...');
      const updatedStore = await storeService.updateStore(storeId, updates);
      dispatch({ type: 'UPDATE_STORE', payload: updatedStore });
      showSuccess('Tienda actualizada', 'Los cambios se han guardado');
      console.log('✅ Tienda actualizada');
    } catch (error: any) {
      console.error('❌ Error actualizando tienda:', error);
      showError('Error al actualizar tienda', error.message);
      throw error;
    }
  };

  const deleteStore = async (storeId: string) => {
    try {
      console.log('🗑️ Eliminando tienda...');
      await storeService.deleteStore(storeId);
      dispatch({ type: 'DELETE_STORE', payload: storeId });
      showSuccess('Tienda eliminada', 'La tienda se ha eliminado correctamente');
      console.log('✅ Tienda eliminada');
    } catch (error: any) {
      console.error('❌ Error eliminando tienda:', error);
      showError('Error al eliminar tienda', error.message);
      throw error;
    }
  };

  const switchStore = (store: Store) => {
    console.log('🔄 Cambiando tienda a:', store.name);
    dispatch({ type: 'SET_CURRENT_STORE', payload: store });
    showSuccess('Tienda cambiada', `Ahora estás gestionando "${store.name}"`);
  };

  // Product actions
  const addProduct = async (productData: any) => {
    try {
      console.log('📦 Añadiendo producto...');
      await productService.createProduct(productData);
      // Reload current store to get updated products
      if (state.currentStore) {
        const stores = await storeService.getUserStores();
        const updatedCurrentStore = stores.find(s => s.id === state.currentStore!.id);
        if (updatedCurrentStore) {
          dispatch({ type: 'UPDATE_STORE', payload: updatedCurrentStore });
        }
      }
      showSuccess('¡Producto creado!', 'El producto se ha añadido al catálogo');
      console.log('✅ Producto añadido');
    } catch (error: any) {
      console.error('❌ Error añadiendo producto:', error);
      showError('Error al crear producto', error.message);
      throw error;
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      console.log('✏️ Actualizando producto...');
      await productService.updateProduct(productId, updates);
      // Reload current store to get updated products
      if (state.currentStore) {
        const stores = await storeService.getUserStores();
        const updatedCurrentStore = stores.find(s => s.id === state.currentStore!.id);
        if (updatedCurrentStore) {
          dispatch({ type: 'UPDATE_STORE', payload: updatedCurrentStore });
        }
      }
      showSuccess('Producto actualizado', 'Los cambios se han guardado');
      console.log('✅ Producto actualizado');
    } catch (error: any) {
      console.error('❌ Error actualizando producto:', error);
      showError('Error al actualizar producto', error.message);
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      console.log('🗑️ Eliminando producto...');
      await productService.deleteProduct(productId);
      // Reload current store to get updated products
      if (state.currentStore) {
        const stores = await storeService.getUserStores();
        const updatedCurrentStore = stores.find(s => s.id === state.currentStore!.id);
        if (updatedCurrentStore) {
          dispatch({ type: 'UPDATE_STORE', payload: updatedCurrentStore });
        }
      }
      showSuccess('Producto eliminado', 'El producto se ha eliminado del catálogo');
      console.log('✅ Producto eliminado');
    } catch (error: any) {
      console.error('❌ Error eliminando producto:', error);
      showError('Error al eliminar producto', error.message);
      throw error;
    }
  };

  // Category actions
  const addCategory = async (categoryData: any) => {
    try {
      console.log('📁 Añadiendo categoría...');
      await categoryService.createCategory(categoryData);
      // Reload current store to get updated categories
      if (state.currentStore) {
        const stores = await storeService.getUserStores();
        const updatedCurrentStore = stores.find(s => s.id === state.currentStore!.id);
        if (updatedCurrentStore) {
          dispatch({ type: 'UPDATE_STORE', payload: updatedCurrentStore });
        }
      }
      showSuccess('¡Categoría creada!', 'La categoría se ha añadido');
      console.log('✅ Categoría añadida');
    } catch (error: any) {
      console.error('❌ Error añadiendo categoría:', error);
      showError('Error al crear categoría', error.message);
      throw error;
    }
  };

  const updateCategory = async (categoryId: string, updates: { name: string }) => {
    try {
      console.log('✏️ Actualizando categoría...');
      await categoryService.updateCategory(categoryId, updates);
      // Reload current store to get updated categories
      if (state.currentStore) {
        const stores = await storeService.getUserStores();
        const updatedCurrentStore = stores.find(s => s.id === state.currentStore!.id);
        if (updatedCurrentStore) {
          dispatch({ type: 'UPDATE_STORE', payload: updatedCurrentStore });
        }
      }
      showSuccess('Categoría actualizada', 'Los cambios se han guardado');
      console.log('✅ Categoría actualizada');
    } catch (error: any) {
      console.error('❌ Error actualizando categoría:', error);
      showError('Error al actualizar categoría', error.message);
      throw error;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      console.log('🗑️ Eliminando categoría...');
      await categoryService.deleteCategory(categoryId);
      // Reload current store to get updated categories
      if (state.currentStore) {
        const stores = await storeService.getUserStores();
        const updatedCurrentStore = stores.find(s => s.id === state.currentStore!.id);
        if (updatedCurrentStore) {
          dispatch({ type: 'UPDATE_STORE', payload: updatedCurrentStore });
        }
      }
      showSuccess('Categoría eliminada', 'La categoría se ha eliminado');
      console.log('✅ Categoría eliminada');
    } catch (error: any) {
      console.error('❌ Error eliminando categoría:', error);
      showError('Error al eliminar categoría', error.message);
      throw error;
    }
  };

  return (
    <StoreContext.Provider value={{
      state,
      dispatch,
      signIn,
      signUp,
      signOut,
      updateProfile,
      updateSubscription,
      createStore,
      updateStore,
      deleteStore,
      switchStore,
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      updateCategory,
      deleteCategory,
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