import React, { createContext, useContext, useReducer, useEffect, Dispatch, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// Definición de tipos
export interface User {
  id: string;
  email: string;
  name: string;
  // Añade otros campos según sea necesario
}

export interface StoreState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  // Añade otros campos de estado según sea necesario
}

// Definición del estado inicial
const initialState: StoreState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
};

// Tipos de acciones
type ActionType =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean };

// Reducer
function storeReducer(state: StoreState, action: ActionType): StoreState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
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
}>({
  state: initialState,
  dispatch: () => null,
  login: async () => {},
  register: async () => {},
});

// Funciones auxiliares
function transformSupabaseUserToAppUser(supabaseUser: any, userData: any): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: userData?.name || '',
    // Añade otros campos según sea necesario
  };
}

// Proveedor de contexto
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  // Función de login
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
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Función de registro
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
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
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
    <StoreContext.Provider value={{ state, dispatch, login, register }}>
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
