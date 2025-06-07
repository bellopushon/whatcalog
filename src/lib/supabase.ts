import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Configuración de Supabase:');
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
console.log('Anon Key:', supabaseAnonKey ? '✅ Configurada' : '❌ Faltante');
console.log('URL completa:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase faltantes:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[CONFIGURADA]' : '[FALTANTE]');
  throw new Error('Missing Supabase environment variables');
}

// FIXED: Robust timeout and connection handling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  }
});

// FIXED: Non-blocking connection test
console.log('🔄 Probando conexión a Supabase...');
const connectionTest = supabase.from('users').select('count', { count: 'exact', head: true });

// Non-blocking connection test with proper error handling
connectionTest.then(
  ({ error, count }) => {
    if (error) {
      console.warn('⚠️ Advertencia en conexión inicial a Supabase:', error.message);
      console.log('ℹ️ La aplicación continuará funcionando. La conexión se establecerá cuando sea necesaria.');
    } else {
      console.log('✅ Conexión a Supabase exitosa');
      console.log('📊 Test de tabla users completado');
    }
  }
).catch(error => {
  console.warn('⚠️ Advertencia en conexión a Supabase:', error.message);
  console.log('ℹ️ La aplicación continuará funcionando. La conexión se establecerá cuando sea necesaria.');
});

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any, context: string = '') {
  console.error(`❌ Error de Supabase ${context}:`, error);
  console.error('Detalles completos del error:', {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    stack: error?.stack
  });
  
  if (error?.message) {
    throw new Error(error.message);
  }
  
  throw new Error(`Error en ${context || 'la operación'}`);
}

// Helper function to get current user
export async function getCurrentUser() {
  console.log('🔄 Helper getCurrentUser llamado...');
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('❌ Error en helper getCurrentUser:', error);
    handleSupabaseError(error, 'obtener usuario actual');
  }
  
  console.log('✅ Helper getCurrentUser completado:', user?.id || 'No user');
  return user;
}

// Helper function to ensure user is authenticated
export async function requireAuth() {
  console.log('🔄 RequireAuth llamado...');
  const user = await getCurrentUser();
  
  if (!user) {
    console.error('❌ Usuario no autenticado en requireAuth');
    throw new Error('Usuario no autenticado');
  }
  
  console.log('✅ RequireAuth completado para usuario:', user.id);
  return user;
}