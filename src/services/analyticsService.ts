import { supabase, handleSupabaseError } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type AnalyticsEventRow = Database['public']['Tables']['analytics_events']['Row'];
type AnalyticsEventInsert = Database['public']['Tables']['analytics_events']['Insert'];
type EventType = Database['public']['Enums']['analytics_event_type'];

export interface AnalyticsEvent {
  id: string;
  storeId: string;
  eventType: EventType;
  sessionId?: string;
  productId?: string;
  orderValue?: number;
  customerName?: string;
  orderItems?: any[];
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CreateEventData {
  storeId: string;
  eventType: EventType;
  sessionId?: string;
  productId?: string;
  orderValue?: number;
  customerName?: string;
  orderItems?: any[];
  metadata?: Record<string, any>;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AnalyticsStats {
  visits: number;
  orders: number;
  orderValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    views: number;
  }>;
}

class AnalyticsService {
  async trackEvent(eventData: CreateEventData): Promise<AnalyticsEvent> {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .insert({
          store_id: eventData.storeId,
          event_type: eventData.eventType,
          session_id: eventData.sessionId,
          product_id: eventData.productId,
          order_value: eventData.orderValue,
          customer_name: eventData.customerName,
          order_items: eventData.orderItems,
          metadata: eventData.metadata || {},
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'registrar evento de analíticas');
      }

      return this.mapEventData(data);
    } catch (error) {
      console.error('TrackEvent error:', error);
      throw error;
    }
  }

  async trackVisit(storeId: string, sessionId?: string): Promise<void> {
    try {
      // Verificar si ya existe una visita para esta sesión hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: existingVisit, error: checkError } = await supabase
        .from('analytics_events')
        .select('id')
        .eq('store_id', storeId)
        .eq('event_type', 'visit')
        .eq('session_id', sessionId || 'anonymous')
        .gte('created_at', today.toISOString())
        .limit(1);

      if (checkError) {
        console.warn('Error checking existing visit:', checkError);
      }

      // Solo registrar si no existe una visita previa hoy
      if (!existingVisit || existingVisit.length === 0) {
        await this.trackEvent({
          storeId,
          eventType: 'visit',
          sessionId: sessionId || 'anonymous',
        });
      }
    } catch (error) {
      console.error('TrackVisit error:', error);
      // No lanzar error para no interrumpir la experiencia del usuario
    }
  }

  async trackOrder(
    storeId: string, 
    orderValue: number, 
    customerName: string, 
    orderItems: any[]
  ): Promise<void> {
    try {
      await this.trackEvent({
        storeId,
        eventType: 'order',
        orderValue,
        customerName,
        orderItems,
      });
    } catch (error) {
      console.error('TrackOrder error:', error);
      throw error;
    }
  }

  async trackProductView(storeId: string, productId: string, sessionId?: string): Promise<void> {
    try {
      await this.trackEvent({
        storeId,
        eventType: 'product_view',
        productId,
        sessionId: sessionId || 'anonymous',
      });
    } catch (error) {
      console.error('TrackProductView error:', error);
      // No lanzar error para no interrumpir la experiencia del usuario
    }
  }

  async getStoreAnalytics(storeId: string, dateRange?: DateRange): Promise<AnalyticsStats> {
    try {
      let query = supabase
        .from('analytics_events')
        .select('*')
        .eq('store_id', storeId);

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        handleSupabaseError(error, 'obtener analíticas');
      }

      const events = data.map(this.mapEventData);

      // Calcular estadísticas
      const visits = events.filter(e => e.eventType === 'visit').length;
      const orders = events.filter(e => e.eventType === 'order').length;
      const orderValue = events
        .filter(e => e.eventType === 'order')
        .reduce((sum, e) => sum + (e.orderValue || 0), 0);

      // Top productos más vistos
      const productViews = events
        .filter(e => e.eventType === 'product_view' && e.productId)
        .reduce((acc, e) => {
          const productId = e.productId!;
          acc[productId] = (acc[productId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topProducts = Object.entries(productViews)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([productId, views]) => ({
          productId,
          productName: 'Producto', // Se podría hacer join con products
          views,
        }));

      return {
        visits,
        orders,
        orderValue,
        topProducts,
      };
    } catch (error) {
      console.error('GetStoreAnalytics error:', error);
      throw error;
    }
  }

  async getVisitsCount(storeId: string, dateRange?: DateRange): Promise<number> {
    try {
      let query = supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('event_type', 'visit');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { count, error } = await query;

      if (error) {
        handleSupabaseError(error, 'contar visitas');
      }

      return count || 0;
    } catch (error) {
      console.error('GetVisitsCount error:', error);
      return 0;
    }
  }

  async getOrdersCount(storeId: string, dateRange?: DateRange): Promise<number> {
    try {
      let query = supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('event_type', 'order');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { count, error } = await query;

      if (error) {
        handleSupabaseError(error, 'contar pedidos');
      }

      return count || 0;
    } catch (error) {
      console.error('GetOrdersCount error:', error);
      return 0;
    }
  }

  async getOrderValue(storeId: string, dateRange?: DateRange): Promise<number> {
    try {
      let query = supabase
        .from('analytics_events')
        .select('order_value')
        .eq('store_id', storeId)
        .eq('event_type', 'order')
        .not('order_value', 'is', null);

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        handleSupabaseError(error, 'obtener valor de pedidos');
      }

      return data.reduce((sum, event) => sum + (Number(event.order_value) || 0), 0);
    } catch (error) {
      console.error('GetOrderValue error:', error);
      return 0;
    }
  }

  async cleanupOldEvents(): Promise<void> {
    try {
      const { error } = await supabase.rpc('cleanup_old_analytics');

      if (error) {
        handleSupabaseError(error, 'limpiar eventos antiguos');
      }
    } catch (error) {
      console.error('CleanupOldEvents error:', error);
      // No lanzar error ya que es una operación de mantenimiento
    }
  }

  // Función para mapear datos de la base de datos al formato de la aplicación
  private mapEventData(eventData: AnalyticsEventRow): AnalyticsEvent {
    return {
      id: eventData.id,
      storeId: eventData.store_id,
      eventType: eventData.event_type,
      sessionId: eventData.session_id || undefined,
      productId: eventData.product_id || undefined,
      orderValue: eventData.order_value ? Number(eventData.order_value) : undefined,
      customerName: eventData.customer_name || undefined,
      orderItems: Array.isArray(eventData.order_items) ? eventData.order_items as any[] : undefined,
      metadata: (eventData.metadata as Record<string, any>) || {},
      createdAt: eventData.created_at,
    };
  }
}

export const analyticsService = new AnalyticsService();