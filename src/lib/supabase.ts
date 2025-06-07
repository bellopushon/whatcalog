import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any, context: string = '') {
  console.error(`Supabase error ${context}:`, error);
  
  if (error?.message) {
    throw new Error(error.message);
  }
  
  throw new Error(`Error en ${context || 'la operación'}`);
}

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    handleSupabaseError(error, 'obtener usuario actual');
  }
  
  return user;
}

// Helper function to ensure user is authenticated
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  
  return user;
}