import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// Tipos de autenticación
interface AuthUser {
  id: string;
  email: string;
  name: string;
  plan: 'gratuito' | 'emprendedor' | 'profesional';
  avatar?: string;
  phone?: string;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
}

interface AuthContextType extends AuthState {
  // Métodos de autenticación
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
  
  // OAuth
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithGitHub: () => Promise<{ success: boolean; error?: string }>;
  
  // Utilidades
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Hook personalizado para debugging
const useAuthDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth] ${message}`, data || '');
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Función auxiliar para transformar usuario de Supabase a AuthUser
  const transformUser = useCallback(async (supabaseUser: User): Promise<AuthUser | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        useAuthDebug('Error fetching profile:', error);
        return null;
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        name: profile?.name || supabaseUser.user_metadata?.name || supabaseUser.email!.split('@')[0],
        plan: profile?.plan || 'gratuito',
        avatar: profile?.avatar,
        phone: profile?.phone,
        createdAt: supabaseUser.created_at,
      };
    } catch (error) {
      useAuthDebug('Error transforming user:', error);
      return null;
    }
  }, []);

  // Inicializar autenticación
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        useAuthDebug('Initializing authentication...');
        
        // Obtener sesión actual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (session && mounted) {
          const authUser = await transformUser(session.user);
          
          setState({
            user: authUser,
            session,
            isLoading: false,
            isAuthenticated: !!authUser,
            error: null,
          });

          // Redirigir si estamos en login
          if (location.pathname === '/login' && authUser) {
            navigate('/admin');
          }
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        useAuthDebug('Auth initialization error:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error as AuthError 
        }));
      }
    };

    // Listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        useAuthDebug('Auth state changed:', event);

        switch (event) {
          case 'SIGNED_IN':
            if (session) {
              const authUser = await transformUser(session.user);
              setState({
                user: authUser,
                session,
                isLoading: false,
                isAuthenticated: !!authUser,
                error: null,
              });
              
              // Redirigir desde login
              if (location.pathname === '/login') {
                navigate('/admin');
              }
            }
            break;

          case 'SIGNED_OUT':
            setState({
              user: null,
              session: null,
              isLoading: false,
              isAuthenticated: false,
              error: null,
            });
            navigate('/login');
            break;

          case 'TOKEN_REFRESHED':
            setState(prev => ({ ...prev, session }));
            break;

          case 'USER_UPDATED':
            if (session) {
              const authUser = await transformUser(session.user);
              setState(prev => ({ ...prev, user: authUser }));
            }
            break;
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, transformUser]);

  // Método de inicio de sesión
  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      useAuthDebug('Sign in successful');
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError, isLoading: false }));
      return { 
        success: false, 
        error: authError.message || 'Error al iniciar sesión' 
      };
    }
  };

  // Método de registro
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 1. Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (error) throw error;

      // 2. Si el usuario se creó y hay sesión (auto-confirmación habilitada)
      if (data.user && data.session) {
        // 3. Crear perfil en la tabla users
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name,
            plan: 'gratuito',
            created_at: new Date().toISOString(),
          });

        if (profileError) {
          useAuthDebug('Profile creation error:', profileError);
        }

        return { success: true };
      }

      // 4. Si requiere confirmación por email
      if (data.user && !data.session) {
        setState(prev => ({ ...prev, isLoading: false }));
        return { 
          success: true, 
          error: 'Por favor revisa tu email para confirmar tu cuenta' 
        };
      }

      return { success: false, error: 'Error inesperado durante el registro' };
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError, isLoading: false }));
      return { 
        success: false, 
        error: authError.message || 'Error al crear la cuenta' 
      };
    }
  };

  // Cerrar sesión
  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      useAuthDebug('Sign out error:', error);
      // Aún así limpiar el estado local
      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    }
  };

  // OAuth con Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`,
        },
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: (error as AuthError).message || 'Error al iniciar sesión con Google' 
      };
    }
  };

  // OAuth con GitHub
  const signInWithGitHub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/admin`,
        },
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: (error as AuthError).message || 'Error al iniciar sesión con GitHub' 
      };
    }
  };

  // Resetear contraseña
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: (error as AuthError).message || 'Error al enviar email de recuperación' 
      };
    }
  };

  // Actualizar contraseña
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: (error as AuthError).message || 'Error al actualizar la contraseña' 
      };
    }
  };

  // Actualizar perfil
  const updateProfile = async (updates: Partial<AuthUser>) => {
    try {
      if (!state.user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.user.id);

      if (error) throw error;

      // Actualizar estado local
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null,
      }));

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message || 'Error al actualizar el perfil' 
      };
    }
  };

  // Refrescar sesión
  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (session) {
        setState(prev => ({ ...prev, session }));
      }
    } catch (error) {
      useAuthDebug('Session refresh error:', error);
    }
  };

  // Limpiar error
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithGitHub,
      resetPassword,
      updatePassword,
      updateProfile,
      refreshSession,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC para proteger rutas
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/login'
) {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        navigate(redirectTo);
      }
    }, [isAuthenticated, isLoading, navigate]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}