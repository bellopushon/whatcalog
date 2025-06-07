import { supabase, handleSupabaseError } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type UserPlan = Database['public']['Enums']['user_plan'];
type SubscriptionStatus = Database['public']['Enums']['subscription_status'];

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  company?: string;
  location?: string;
  plan: UserPlan;
  subscriptionId?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionCanceledAt?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  async signUp({ email, password, name }: SignUpData): Promise<AuthUser> {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        handleSupabaseError(authError, 'registro de usuario');
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // 2. Crear perfil de usuario en la tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          plan: 'gratuito'
        })
        .select()
        .single();

      if (userError) {
        handleSupabaseError(userError, 'creación de perfil');
      }

      // 3. Crear preferencias por defecto
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: authData.user.id,
          dark_mode_enabled: false,
          email_notifications: true,
          marketing_emails: false,
          preferred_language: 'es',
          timezone: 'UTC'
        });

      if (prefsError) {
        console.warn('Error creating user preferences:', prefsError);
      }

      return this.mapUserData(userData);
    } catch (error) {
      console.error('SignUp error:', error);
      throw error;
    }
  }

  async signIn({ email, password }: SignInData): Promise<AuthUser> {
    try {
      // 1. Autenticar con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        handleSupabaseError(authError, 'inicio de sesión');
      }

      if (!authData.user) {
        throw new Error('No se pudo autenticar el usuario');
      }

      // 2. Obtener datos del perfil
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        handleSupabaseError(userError, 'obtener perfil de usuario');
      }

      return this.mapUserData(userData);
    } catch (error) {
      console.error('SignIn error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        handleSupabaseError(error, 'cerrar sesión');
      }
    } catch (error) {
      console.error('SignOut error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        handleSupabaseError(authError, 'obtener usuario actual');
      }

      if (!user) {
        return null;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        handleSupabaseError(userError, 'obtener perfil de usuario');
      }

      return this.mapUserData(userData);
    } catch (error) {
      console.error('GetCurrentUser error:', error);
      return null;
    }
  }

  async updateProfile(updates: Partial<AuthUser>): Promise<AuthUser> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Usuario no autenticado');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .update({
          name: updates.name,
          phone: updates.phone,
          bio: updates.bio,
          avatar: updates.avatar,
          company: updates.company,
          location: updates.location,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (userError) {
        handleSupabaseError(userError, 'actualizar perfil');
      }

      return this.mapUserData(userData);
    } catch (error) {
      console.error('UpdateProfile error:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionData: {
    plan: UserPlan;
    subscriptionId?: string;
    subscriptionStatus?: SubscriptionStatus;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    paymentMethod?: string;
  }): Promise<AuthUser> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Usuario no autenticado');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .update({
          plan: subscriptionData.plan,
          subscription_id: subscriptionData.subscriptionId,
          subscription_status: subscriptionData.subscriptionStatus,
          subscription_start_date: subscriptionData.subscriptionStartDate,
          subscription_end_date: subscriptionData.subscriptionEndDate,
          payment_method: subscriptionData.paymentMethod,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (userError) {
        handleSupabaseError(userError, 'actualizar suscripción');
      }

      return this.mapUserData(userData);
    } catch (error) {
      console.error('UpdateSubscription error:', error);
      throw error;
    }
  }

  async cancelSubscription(): Promise<AuthUser> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Usuario no autenticado');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .update({
          subscription_status: 'canceled',
          subscription_canceled_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (userError) {
        handleSupabaseError(userError, 'cancelar suscripción');
      }

      return this.mapUserData(userData);
    } catch (error) {
      console.error('CancelSubscription error:', error);
      throw error;
    }
  }

  // Función para mapear datos de la base de datos al formato de la aplicación
  private mapUserData(userData: any): AuthUser {
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      bio: userData.bio,
      avatar: userData.avatar,
      company: userData.company,
      location: userData.location,
      plan: userData.plan,
      subscriptionId: userData.subscription_id,
      subscriptionStatus: userData.subscription_status,
      subscriptionStartDate: userData.subscription_start_date,
      subscriptionEndDate: userData.subscription_end_date,
      subscriptionCanceledAt: userData.subscription_canceled_at,
      paymentMethod: userData.payment_method,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    };
  }

  // Listener para cambios de autenticación
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();