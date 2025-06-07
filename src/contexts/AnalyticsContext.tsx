import React, { createContext, useContext, useEffect, useState } from 'react';
import { analyticsService, type DateRange } from '../services/analyticsService';

interface AnalyticsContextType {
  trackVisit: (storeId: string) => Promise<void>;
  trackOrder: (storeId: string, orderValue: number, customerName: string, orderItems: any[]) => Promise<void>;
  trackProductView: (storeId: string, productId: string) => Promise<void>;
  getVisits: (storeId: string, dateRange?: DateRange) => Promise<number>;
  getOrders: (storeId: string, dateRange?: DateRange) => Promise<number>;
  getOrderValue: (storeId: string, dateRange?: DateRange) => Promise<number>;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

// Generate a unique session ID for this browser session
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get or create session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('tutaviendo_session');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('tutaviendo_session', sessionId);
  }
  return sessionId;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [sessionId] = useState(() => getSessionId());

  // Cleanup old events periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      analyticsService.cleanupOldEvents().catch(console.error);
    }, 24 * 60 * 60 * 1000); // Once per day

    return () => clearInterval(cleanupInterval);
  }, []);

  const trackVisit = async (storeId: string) => {
    try {
      await analyticsService.trackVisit(storeId, sessionId);
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  };

  const trackOrder = async (
    storeId: string, 
    orderValue: number, 
    customerName: string, 
    orderItems: any[]
  ) => {
    try {
      await analyticsService.trackOrder(storeId, orderValue, customerName, orderItems);
    } catch (error) {
      console.error('Error tracking order:', error);
      throw error;
    }
  };

  const trackProductView = async (storeId: string, productId: string) => {
    try {
      await analyticsService.trackProductView(storeId, productId, sessionId);
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  };

  const getVisits = async (storeId: string, dateRange?: DateRange): Promise<number> => {
    try {
      return await analyticsService.getVisitsCount(storeId, dateRange);
    } catch (error) {
      console.error('Error getting visits:', error);
      return 0;
    }
  };

  const getOrders = async (storeId: string, dateRange?: DateRange): Promise<number> => {
    try {
      return await analyticsService.getOrdersCount(storeId, dateRange);
    } catch (error) {
      console.error('Error getting orders:', error);
      return 0;
    }
  };

  const getOrderValue = async (storeId: string, dateRange?: DateRange): Promise<number> => {
    try {
      return await analyticsService.getOrderValue(storeId, dateRange);
    } catch (error) {
      console.error('Error getting order value:', error);
      return 0;
    }
  };

  return (
    <AnalyticsContext.Provider value={{
      trackVisit,
      trackOrder,
      trackProductView,
      getVisits,
      getOrders,
      getOrderValue,
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}