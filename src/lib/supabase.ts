import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // ✅ CRITICAL: Force session persistence
    storage: window.localStorage,
    storageKey: 'tutaviendo-auth-token',
    flowType: 'pkce'
  }
});

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          bio: string | null;
          avatar: string | null;
          company: string | null;
          location: string | null;
          plan: 'gratuito' | 'emprendedor' | 'profesional';
          subscription_id: string | null;
          subscription_status: 'active' | 'canceled' | 'expired' | null;
          subscription_start_date: string | null;
          subscription_end_date: string | null;
          subscription_canceled_at: string | null;
          payment_method: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string | null;
          bio?: string | null;
          avatar?: string | null;
          company?: string | null;
          location?: string | null;
          plan?: 'gratuito' | 'emprendedor' | 'profesional';
          subscription_id?: string | null;
          subscription_status?: 'active' | 'canceled' | 'expired' | null;
          subscription_start_date?: string | null;
          subscription_end_date?: string | null;
          subscription_canceled_at?: string | null;
          payment_method?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          bio?: string | null;
          avatar?: string | null;
          company?: string | null;
          location?: string | null;
          plan?: 'gratuito' | 'emprendedor' | 'profesional';
          subscription_id?: string | null;
          subscription_status?: 'active' | 'canceled' | 'expired' | null;
          subscription_start_date?: string | null;
          subscription_end_date?: string | null;
          subscription_canceled_at?: string | null;
          payment_method?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      stores: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          description: string | null;
          logo: string | null;
          whatsapp: string | null;
          currency: string | null;
          heading_font: string | null;
          body_font: string | null;
          color_palette: string | null;
          theme_mode: 'light' | 'dark' | 'system' | null;
          border_radius: number | null;
          products_per_page: number | null;
          facebook_url: string | null;
          instagram_url: string | null;
          tiktok_url: string | null;
          twitter_url: string | null;
          show_social_in_catalog: boolean | null;
          accept_cash: boolean | null;
          accept_bank_transfer: boolean | null;
          bank_details: string | null;
          allow_pickup: boolean | null;
          allow_delivery: boolean | null;
          delivery_cost: number | null;
          delivery_zone: string | null;
          message_greeting: string | null;
          message_introduction: string | null;
          message_closing: string | null;
          include_phone_in_message: boolean | null;
          include_comments_in_message: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          description?: string | null;
          logo?: string | null;
          whatsapp?: string | null;
          currency?: string | null;
          heading_font?: string | null;
          body_font?: string | null;
          color_palette?: string | null;
          theme_mode?: 'light' | 'dark' | 'system' | null;
          border_radius?: number | null;
          products_per_page?: number | null;
          facebook_url?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          twitter_url?: string | null;
          show_social_in_catalog?: boolean | null;
          accept_cash?: boolean | null;
          accept_bank_transfer?: boolean | null;
          bank_details?: string | null;
          allow_pickup?: boolean | null;
          allow_delivery?: boolean | null;
          delivery_cost?: number | null;
          delivery_zone?: string | null;
          message_greeting?: string | null;
          message_introduction?: string | null;
          message_closing?: string | null;
          include_phone_in_message?: boolean | null;
          include_comments_in_message?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo?: string | null;
          whatsapp?: string | null;
          currency?: string | null;
          heading_font?: string | null;
          body_font?: string | null;
          color_palette?: string | null;
          theme_mode?: 'light' | 'dark' | 'system' | null;
          border_radius?: number | null;
          products_per_page?: number | null;
          facebook_url?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          twitter_url?: string | null;
          show_social_in_catalog?: boolean | null;
          accept_cash?: boolean | null;
          accept_bank_transfer?: boolean | null;
          bank_details?: string | null;
          allow_pickup?: boolean | null;
          allow_delivery?: boolean | null;
          delivery_cost?: number | null;
          delivery_zone?: string | null;
          message_greeting?: string | null;
          message_introduction?: string | null;
          message_closing?: string | null;
          include_phone_in_message?: boolean | null;
          include_comments_in_message?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          category_id: string | null;
          name: string;
          short_description: string | null;
          long_description: string | null;
          price: number;
          main_image: string | null;
          gallery: any | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          store_id: string;
          category_id?: string | null;
          name: string;
          short_description?: string | null;
          long_description?: string | null;
          price: number;
          main_image?: string | null;
          gallery?: any | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          store_id?: string;
          category_id?: string | null;
          name?: string;
          short_description?: string | null;
          long_description?: string | null;
          price?: number;
          main_image?: string | null;
          gallery?: any | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          created_at?: string | null;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          store_id: string;
          event_type: 'visit' | 'order' | 'product_view';
          session_id: string | null;
          product_id: string | null;
          order_value: number | null;
          customer_name: string | null;
          order_items: any | null;
          metadata: any | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          store_id: string;
          event_type: 'visit' | 'order' | 'product_view';
          session_id?: string | null;
          product_id?: string | null;
          order_value?: number | null;
          customer_name?: string | null;
          order_items?: any | null;
          metadata?: any | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          store_id?: string;
          event_type?: 'visit' | 'order' | 'product_view';
          session_id?: string | null;
          product_id?: string | null;
          order_value?: number | null;
          customer_name?: string | null;
          order_items?: any | null;
          metadata?: any | null;
          created_at?: string | null;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          dark_mode_enabled: boolean | null;
          email_notifications: boolean | null;
          marketing_emails: boolean | null;
          preferred_language: string | null;
          timezone: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          dark_mode_enabled?: boolean | null;
          email_notifications?: boolean | null;
          marketing_emails?: boolean | null;
          preferred_language?: string | null;
          timezone?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          dark_mode_enabled?: boolean | null;
          email_notifications?: boolean | null;
          marketing_emails?: boolean | null;
          preferred_language?: string | null;
          timezone?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
