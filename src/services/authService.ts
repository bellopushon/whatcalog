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
      console.log('🔄 Iniciando registro de usuario...');
      
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (authError) {
        console.error('❌ Error en auth signup:', authError);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      console.log('✅ Usuario creado en Auth:', authData.user.id);

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
        console.error('❌ Error creando perfil de usuario:', userError);
        // Si el perfil ya existe, intentar obtenerlo
        if (userError.code === '23505') { // Unique violation
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
          
          if (fetchError) {
            console.error('❌ Error obteniendo usuario existente:', fetchError);
            throw new Error('Error al crear o recuperar el perfil de usuario');
          }
          
          console.log('✅ Usuario existente recuperado');
          return this.mapUserData(existingUser);
        }
        throw new Error(userError.message);
      }

      console.log('✅ Perfil de usuario creado');

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

      if (prefsError && prefsError.code !== '23505') {
        console.warn('⚠️ Error creando preferencias de usuario:', prefsError);
      } else {
        console.log('✅ Preferencias de usuario creadas');
      }

      return this.mapUserData(userData);
    } catch (error) {
      console.error('❌ Error completo en signUp:', error);
      throw error;
    }
  }

  async signIn({ email, password }: SignInData): Promise<AuthUser> {
    try {
      console.log('🔄 Iniciando sesión...');
      
      // 1. Autenticar con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('❌ Error en auth signin:', authError);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('No se pudo autenticar el usuario');
      }

      console.log('✅ Usuario autenticado:', authData.user.id);

      // 2. Obtener o crear datos del perfil
      let userData = await this.getOrCreateUserProfile(authData.user);

      return this.mapUserData(userData);
    } catch (error) {
      console.error('❌ Error completo en signIn:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('🔄 Cerrando sesión...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error en signOut:', error);
        throw new Error(error.message);
      }
      console.log('✅ Sesión cerrada');
    } catch (error) {
      console.error('❌ Error completo en signOut:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      console.log('🔄 Obteniendo usuario actual...');
      
      // Obtener usuario de la sesión actual
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        // Si es solo que no hay sesión, retornar null sin error
        if (authError.message === 'Auth session missing!' || 
            authError.message.includes('session') ||
            authError.message.includes('JWT')) {
          console.log('ℹ️ No hay sesión activa');
          return null;
        }
        console.error('❌ Error obteniendo usuario:', authError);
        return null;
      }

      if (!user) {
        console.log('ℹ️ No hay usuario en la sesión');
        return null;
      }

      console.log('✅ Usuario encontrado en sesión:', user.id);

      // Obtener o crear perfil de usuario
      const userData = await this.getOrCreateUserProfile(user);
      console.log('✅ Perfil de usuario obtenido');
      return this.mapUserData(userData);
    } catch (error) {
      console.error('❌ Error completo en getCurrentUser:', error);
      return null;
    }
  }

  private async getOrCreateUserProfile(authUser: any): Promise<any> {
    try {
      console.log('🔄 Obteniendo perfil de usuario:', authUser.id);
      
      // Intentar obtener el perfil existente
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .limit(1);

      if (userError) {
        console.error('❌ Error obteniendo perfil de usuario:', userError);
        throw new Error('Error al obtener el perfil de usuario');
      }

      // Si encontramos el usuario, devolverlo
      if (userData && userData.length > 0) {
        console.log('✅ Perfil de usuario encontrado');
        return userData[0];
      }

      // Usuario no existe en la tabla, intentar crearlo
      console.log('🔄 Creando perfil para usuario existente:', authUser.id);
      
      const { data: newUserData, error: createError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email.split('@')[0],
          plan: 'gratuito'
        })
        .select()
        .single();

      if (createError) {
        // Si hay un error de clave duplicada, significa que otro proceso creó el usuario
        if (createError.code === '23505') {
          console.log('🔄 Perfil ya existe, obteniendo perfil existente');
          const { data: existingUserData, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .limit(1);

          if (fetchError || !existingUserData || existingUserData.length === 0) {
            console.error('❌ Error obteniendo perfil existente:', fetchError);
            throw new Error('No se pudo obtener el perfil de usuario existente');
          }

          return existingUserData[0];
        }
        
        console.error('❌ Error creando perfil de usuario:', createError);
        throw new Error('No se pudo crear el perfil de usuario');
      }

      console.log('✅ Perfil de usuario creado');

      // Crear preferencias por defecto para el nuevo usuario
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: authUser.id,
          dark_mode_enabled: false,
          email_notifications: true,
          marketing_emails: false,
          preferred_language: 'es',
          timezone: 'UTC'
        });

      if (prefsError && prefsError.code !== '23505') {
        console.warn('⚠️ Error creando preferencias de usuario:', prefsError);
      }

      return newUserData;
    } catch (error) {
      console.error('❌ Error completo en getOrCreateUserProfile:', error);
      throw error;
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
        console.error('UpdateProfile error:', userError);
        throw new Error(userError.message);
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
        console.error('UpdateSubscription error:', userError);
        throw new Error(userError.message);
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
        console.error('CancelSubscription error:', userError);
        throw new Error(userError.message);
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
      console.log('🔄 Cambio de estado de auth:', event, session?.user?.id);
      
      if (session?.user) {
        try {
          const user = await this.getCurrentUser();
          callback(user);
        } catch (error) {
          console.error('❌ Error obteniendo usuario después del cambio de auth:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();