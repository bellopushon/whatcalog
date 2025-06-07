import { supabase, handleSupabaseError, requireAuth } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type StoreRow = Database['public']['Tables']['stores']['Row'];
type StoreInsert = Database['public']['Tables']['stores']['Insert'];
type StoreUpdate = Database['public']['Tables']['stores']['Update'];

export interface Store {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  whatsapp?: string;
  currency: string;
  
  // Fonts
  headingFont: string;
  bodyFont: string;
  
  // Theme
  colorPalette: string;
  themeMode: 'light' | 'dark' | 'system';
  borderRadius: number;
  productsPerPage: number;
  
  // Social Media
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  showSocialInCatalog: boolean;
  
  // Payment Methods
  acceptCash: boolean;
  acceptBankTransfer: boolean;
  bankDetails?: string;
  
  // Shipping Methods
  allowPickup: boolean;
  allowDelivery: boolean;
  deliveryCost: number;
  deliveryZone?: string;
  
  // Message Template
  messageGreeting: string;
  messageIntroduction: string;
  messageClosing: string;
  includePhoneInMessage: boolean;
  includeCommentsInMessage: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreData {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  whatsapp?: string;
  currency?: string;
}

class StoreService {
  async getUserStores(): Promise<Store[]> {
    try {
      console.log('🔄 StoreService: Obteniendo tiendas del usuario...');
      const user = await requireAuth();
      console.log('✅ Usuario autenticado para obtener tiendas:', user.id);

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error en query de tiendas:', error);
        handleSupabaseError(error, 'obtener tiendas');
      }

      console.log('✅ Tiendas obtenidas exitosamente:', data?.length || 0);
      return data.map(this.mapStoreData);
    } catch (error) {
      console.error('❌ Error completo en getUserStores:', error);
      throw error;
    }
  }

  async getStoreBySlug(slug: string): Promise<Store | null> {
    try {
      console.log('🔄 StoreService: Obteniendo tienda por slug:', slug);
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Tienda no encontrada para slug:', slug);
          return null; // Store not found
        }
        console.error('❌ Error obteniendo tienda por slug:', error);
        handleSupabaseError(error, 'obtener tienda por slug');
      }

      console.log('✅ Tienda encontrada por slug:', data?.name);
      return this.mapStoreData(data);
    } catch (error) {
      console.error('❌ Error completo en getStoreBySlug:', error);
      throw error;
    }
  }

  async createStore(storeData: CreateStoreData): Promise<Store> {
    try {
      console.log('🔄 StoreService: Creando tienda:', storeData.name);
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('stores')
        .insert({
          user_id: user.id,
          name: storeData.name,
          slug: storeData.slug,
          description: storeData.description,
          logo: storeData.logo,
          whatsapp: storeData.whatsapp,
          currency: storeData.currency || 'USD',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creando tienda:', error);
        handleSupabaseError(error, 'crear tienda');
      }

      console.log('✅ Tienda creada exitosamente:', data.name);
      return this.mapStoreData(data);
    } catch (error) {
      console.error('❌ Error completo en createStore:', error);
      throw error;
    }
  }

  async updateStore(storeId: string, updates: Partial<Store>): Promise<Store> {
    try {
      console.log('🔄 StoreService: Actualizando tienda:', storeId);
      const user = await requireAuth();

      // Mapear los datos de la aplicación al formato de la base de datos
      const dbUpdates: Partial<StoreUpdate> = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.logo !== undefined) dbUpdates.logo = updates.logo;
      if (updates.whatsapp !== undefined) dbUpdates.whatsapp = updates.whatsapp;
      if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
      if (updates.headingFont !== undefined) dbUpdates.heading_font = updates.headingFont;
      if (updates.bodyFont !== undefined) dbUpdates.body_font = updates.bodyFont;
      if (updates.colorPalette !== undefined) dbUpdates.color_palette = updates.colorPalette;
      if (updates.themeMode !== undefined) dbUpdates.theme_mode = updates.themeMode;
      if (updates.borderRadius !== undefined) dbUpdates.border_radius = updates.borderRadius;
      if (updates.productsPerPage !== undefined) dbUpdates.products_per_page = updates.productsPerPage;
      if (updates.facebookUrl !== undefined) dbUpdates.facebook_url = updates.facebookUrl;
      if (updates.instagramUrl !== undefined) dbUpdates.instagram_url = updates.instagramUrl;
      if (updates.tiktokUrl !== undefined) dbUpdates.tiktok_url = updates.tiktokUrl;
      if (updates.twitterUrl !== undefined) dbUpdates.twitter_url = updates.twitterUrl;
      if (updates.showSocialInCatalog !== undefined) dbUpdates.show_social_in_catalog = updates.showSocialInCatalog;
      if (updates.acceptCash !== undefined) dbUpdates.accept_cash = updates.acceptCash;
      if (updates.acceptBankTransfer !== undefined) dbUpdates.accept_bank_transfer = updates.acceptBankTransfer;
      if (updates.bankDetails !== undefined) dbUpdates.bank_details = updates.bankDetails;
      if (updates.allowPickup !== undefined) dbUpdates.allow_pickup = updates.allowPickup;
      if (updates.allowDelivery !== undefined) dbUpdates.allow_delivery = updates.allowDelivery;
      if (updates.deliveryCost !== undefined) dbUpdates.delivery_cost = updates.deliveryCost;
      if (updates.deliveryZone !== undefined) dbUpdates.delivery_zone = updates.deliveryZone;
      if (updates.messageGreeting !== undefined) dbUpdates.message_greeting = updates.messageGreeting;
      if (updates.messageIntroduction !== undefined) dbUpdates.message_introduction = updates.messageIntroduction;
      if (updates.messageClosing !== undefined) dbUpdates.message_closing = updates.messageClosing;
      if (updates.includePhoneInMessage !== undefined) dbUpdates.include_phone_in_message = updates.includePhoneInMessage;
      if (updates.includeCommentsInMessage !== undefined) dbUpdates.include_comments_in_message = updates.includeCommentsInMessage;

      console.log('📊 Actualizaciones a aplicar:', Object.keys(dbUpdates));

      const { data, error } = await supabase
        .from('stores')
        .update(dbUpdates)
        .eq('id', storeId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error actualizando tienda:', error);
        handleSupabaseError(error, 'actualizar tienda');
      }

      console.log('✅ Tienda actualizada exitosamente:', data.name);
      return this.mapStoreData(data);
    } catch (error) {
      console.error('❌ Error completo en updateStore:', error);
      throw error;
    }
  }

  async deleteStore(storeId: string): Promise<void> {
    try {
      console.log('🔄 StoreService: Eliminando tienda:', storeId);
      const user = await requireAuth();

      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error eliminando tienda:', error);
        handleSupabaseError(error, 'eliminar tienda');
      }

      console.log('✅ Tienda eliminada exitosamente');
    } catch (error) {
      console.error('❌ Error completo en deleteStore:', error);
      throw error;
    }
  }

  async checkSlugAvailability(slug: string, excludeStoreId?: string): Promise<boolean> {
    try {
      console.log('🔄 StoreService: Verificando disponibilidad de slug:', slug);
      
      let query = supabase
        .from('stores')
        .select('id')
        .eq('slug', slug);

      if (excludeStoreId) {
        query = query.neq('id', excludeStoreId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error verificando slug:', error);
        handleSupabaseError(error, 'verificar disponibilidad de slug');
      }

      const isAvailable = data.length === 0;
      console.log('✅ Slug disponible:', isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('❌ Error completo en checkSlugAvailability:', error);
      throw error;
    }
  }

  // Función para mapear datos de la base de datos al formato de la aplicación
  private mapStoreData(storeData: StoreRow): Store {
    return {
      id: storeData.id,
      userId: storeData.user_id,
      name: storeData.name,
      slug: storeData.slug,
      description: storeData.description || undefined,
      logo: storeData.logo || undefined,
      whatsapp: storeData.whatsapp || undefined,
      currency: storeData.currency,
      headingFont: storeData.heading_font,
      bodyFont: storeData.body_font,
      colorPalette: storeData.color_palette,
      themeMode: storeData.theme_mode,
      borderRadius: storeData.border_radius,
      productsPerPage: storeData.products_per_page,
      facebookUrl: storeData.facebook_url || undefined,
      instagramUrl: storeData.instagram_url || undefined,
      tiktokUrl: storeData.tiktok_url || undefined,
      twitterUrl: storeData.twitter_url || undefined,
      showSocialInCatalog: storeData.show_social_in_catalog,
      acceptCash: storeData.accept_cash,
      acceptBankTransfer: storeData.accept_bank_transfer,
      bankDetails: storeData.bank_details || undefined,
      allowPickup: storeData.allow_pickup,
      allowDelivery: storeData.allow_delivery,
      deliveryCost: Number(storeData.delivery_cost),
      deliveryZone: storeData.delivery_zone || undefined,
      messageGreeting: storeData.message_greeting,
      messageIntroduction: storeData.message_introduction,
      messageClosing: storeData.message_closing,
      includePhoneInMessage: storeData.include_phone_in_message,
      includeCommentsInMessage: storeData.include_comments_in_message,
      createdAt: storeData.created_at,
      updatedAt: storeData.updated_at,
    };
  }
}

export const storeService = new StoreService();