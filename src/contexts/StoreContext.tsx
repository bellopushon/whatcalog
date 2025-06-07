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
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: !!action.payload 
      };
    case 'SET_STORES':
      return { ...state, stores: action.payload };
    case 'SET_CURRENT_STORE':
      return { ...state, currentStore: action.payload };
    case 'ADD_STORE':
      return { 
        ...state, 
        stores: [...state.stores, action.payload],
        currentStore: action.payload 
      };
    case 'UPDATE_STORE':
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
      return { ...state, isLoaded: action.payload };
    case 'LOGOUT':
      return { ...initialState, isLoaded: true };
    default:
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

  // Initialize app
  useEffect(() => {
    let isMounted = true;
    let authSubscription: any = null;

    const initializeApp = async () => {
      try {
        console.log('🚀 Inicializando aplicación...');
        dispatch({ type: 'SET_LOADING', payload: true });

        // Check if user is authenticated
        const user = await authService.getCurrentUser();
        console.log('👤 Usuario actual:', user?.id || 'No autenticado');
        
        if (user && isMounted) {
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
            // Don't throw error, just continue without stores
            if (isMounted) {
              dispatch({ type: 'SET_STORES', payload: [] });
            }
          }
        } else if (isMounted) {
          // No user found, set empty state
          console.log('ℹ️ No hay usuario autenticado');
          dispatch({ type: 'SET_USER', payload: null });
          dispatch({ type: 'SET_STORES', payload: [] });
          dispatch({ type: 'SET_CURRENT_STORE', payload: null });
        }
      } catch (error) {
        console.error('❌ Error en inicialización de app:', error);
        // Even if there's an error, we should still mark as loaded
        if (isMounted) {
          dispatch({ type: 'SET_USER', payload: null });
          dispatch({ type: 'SET_STORES', payload: [] });
          dispatch({ type: 'SET_CURRENT_STORE', payload: null });
        }
      } finally {
        if (isMounted) {
          dispatch({ type: 'SET_LOADING', payload: false });
          dispatch({ type: 'SET_LOADED', payload: true });
          console.log('✅ Aplicación inicializada');
        }
      }
    };

    // Initialize app
    initializeApp();

    // Listen for auth changes
    authSubscription = authService.onAuthStateChange(async (user) => {
      console.log('🔄 Cambio de estado de autenticación:', user?.id || 'No autenticado');
      
      if (isMounted) {
        dispatch({ type: 'SET_USER', payload: user });
        
        if (user) {
          try {
            console.log('🏪 Recargando tiendas después del cambio de auth...');
            const stores = await storeService.getUserStores();
            dispatch({ type: 'SET_STORES', payload: stores });
            
            if (stores.length > 0) {
              dispatch({ type: 'SET_CURRENT_STORE', payload: stores[0] });
            } else {
              dispatch({ type: 'SET_CURRENT_STORE', payload: null });
            }
          } catch (error) {
            console.error('❌ Error cargando tiendas después del cambio de auth:', error);
            dispatch({ type: 'SET_STORES', payload: [] });
            dispatch({ type: 'SET_CURRENT_STORE', payload: null });
          }
        } else {
          dispatch({ type: 'SET_STORES', payload: [] });
          dispatch({ type: 'SET_CURRENT_STORE', payload: null });
        }
      }
    });

    return () => {
      console.log('🧹 Limpiando contexto de tienda');
      isMounted = false;
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  // Auth actions
  const signIn = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await authService.signIn({ email, password });
      dispatch({ type: 'SET_USER', payload: user });
      showSuccess('¡Bienvenido!', 'Has iniciado sesión correctamente');
    } catch (error: any) {
      showError('Error de autenticación', error.message);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await authService.signUp({ email, password, name });
      dispatch({ type: 'SET_USER', payload: user });
      showSuccess('¡Cuenta creada!', 'Tu cuenta se ha creado exitosamente');
    } catch (error: any) {
      showError('Error de registro', error.message);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      dispatch({ type: 'LOGOUT' });
      showSuccess('Sesión cerrada', 'Has cerrado sesión correctamente');
    } catch (error: any) {
      showError('Error al cerrar sesión', error.message);
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    try {
      const updatedUser = await authService.updateProfile(updates);
      dispatch({ type: 'SET_USER', payload: updatedUser });
      showSuccess('Perfil actualizado', 'Los cambios se han guardado correctamente');
    } catch (error: any) {
      showError('Error al actualizar perfil', error.message);
      throw error;
    }
  };

  const updateSubscription = async (subscriptionData: any) => {
    try {
      const updatedUser = await authService.updateSubscription(subscriptionData);
      dispatch({ type: 'SET_USER', payload: updatedUser });
      showSuccess('Suscripción actualizada', 'Tu plan se ha actualizado correctamente');
    } catch (error: any) {
      showError('Error al actualizar suscripción', error.message);
      throw error;
    }
  };

  // Store actions
  const createStore = async (storeData: any) => {
    try {
      const newStore = await storeService.createStore(storeData);
      dispatch({ type: 'ADD_STORE', payload: newStore });
      showSuccess('¡Tienda creada!', 'Tu nueva tienda está lista');
    } catch (error: any) {
      showError('Error al crear tienda', error.message);
      throw error;
    }
  };

  const updateStore = async (storeId: string, updates: Partial<Store>) => {
    try {
      const updatedStore = await storeService.updateStore(storeId, updates);
      dispatch({ type: 'UPDATE_STORE', payload: updatedStore });
      showSuccess('Tienda actualizada', 'Los cambios se han guardado');
    } catch (error: any) {
      showError('Error al actualizar tienda', error.message);
      throw error;
    }
  };

  const deleteStore = async (storeId: string) => {
    try {
      await storeService.deleteStore(storeId);
      dispatch({ type: 'DELETE_STORE', payload: storeId });
      showSuccess('Tienda eliminada', 'La tienda se ha eliminado correctamente');
    } catch (error: any) {
      showError('Error al eliminar tienda', error.message);
      throw error;
    }
  };

  const switchStore = (store: Store) => {
    dispatch({ type: 'SET_CURRENT_STORE', payload: store });
    showSuccess('Tienda cambiada', `Ahora estás gestionando "${store.name}"`);
  };

  // Product actions
  const addProduct = async (productData: any) => {
    try {
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
    } catch (error: any) {
      showError('Error al crear producto', error.message);
      throw error;
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
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
    } catch (error: any) {
      showError('Error al actualizar producto', error.message);
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
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
    } catch (error: any) {
      showError('Error al eliminar producto', error.message);
      throw error;
    }
  };

  // Category actions
  const addCategory = async (categoryData: any) => {
    try {
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
    } catch (error: any) {
      showError('Error al crear categoría', error.message);
      throw error;
    }
  };

  const updateCategory = async (categoryId: string, updates: { name: string }) => {
    try {
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
    } catch (error: any) {
      showError('Error al actualizar categoría', error.message);
      throw error;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
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
    } catch (error: any) {
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