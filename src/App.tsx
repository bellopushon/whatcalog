import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ui/ToastContainer';

// Auth Components
import LoginPage from './components/auth/LoginPage';

// Admin Components
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './components/dashboard/Dashboard';
import ProductList from './components/products/ProductList';
import CategoryManager from './components/categories/CategoryManager';
import GeneralSettings from './components/settings/GeneralSettings';
import ThemeCustomizer from './components/design/ThemeCustomizer';
import PaymentsShipping from './components/payments/PaymentsShipping';
import AddStore from './components/premium/AddStore';
import StoreManager from './components/stores/StoreManager';

// Profile Components
import ProfilePage from './components/profile/ProfilePage';

// Subscription Components
import SubscriptionPage from './components/subscription/SubscriptionPage';

// Public Components
import PublicCatalog from './components/catalog/PublicCatalog';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  
  // 🔍 LOGGING: Add debug info
  console.log('[ProtectedRoute] State:', {
    isLoaded: state.isLoaded,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    user: !!state.user
  });
  
  // Show loading while data is being loaded
  if (!state.isLoaded || state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {state.error ? `Error: ${state.error}` : 'Cargando...'}
          </p>
          {state.error && (
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }
  
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { state } = useStore();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  
  // SOLUCIÓN ROBUSTA: Control absoluto del modo oscuro basado en rutas
  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin') || 
                        location.pathname === '/profile' || 
                        location.pathname === '/subscription';
    
    const isPublicRoute = location.pathname.startsWith('/store/') || 
                         location.pathname === '/login';
    
    // FORZAR modo claro para rutas públicas
    if (isPublicRoute) {
      document.documentElement.classList.remove('admin-dark');
      document.body.classList.remove('admin-dark');
    }
    // APLICAR preferencia de usuario solo en rutas de admin
    else if (isAdminRoute) {
      if (isDarkMode) {
        document.documentElement.classList.add('admin-dark');
        document.body.classList.add('admin-dark');
      } else {
        document.documentElement.classList.remove('admin-dark');
        document.body.classList.remove('admin-dark');
      }
    }
    // LIMPIAR para cualquier otra ruta
    else {
      document.documentElement.classList.remove('admin-dark');
      document.body.classList.remove('admin-dark');
    }
  }, [location.pathname, isDarkMode]);
  
  // 🔍 LOGGING: Add debug info for routes
  console.log('[AppRoutes] Current state:', {
    isLoaded: state.isLoaded,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    pathname: location.pathname
  });
  
  // Show loading while data is being loaded
  if (!state.isLoaded || state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {state.error ? `Error: ${state.error}` : 'Inicializando aplicación...'}
          </p>
          {state.error && (
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={state.isAuthenticated ? <Navigate to="/admin" replace /> : <LoginPage />} />
      <Route path="/store/:slug" element={<PublicCatalog />} />
      
      {/* Protected Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="categories" element={<CategoryManager />} />
        <Route path="settings" element={<GeneralSettings />} />
        <Route path="design" element={<ThemeCustomizer />} />
        <Route path="payments-shipping" element={<PaymentsShipping />} />
        <Route path="add-store" element={<AddStore />} />
        <Route path="stores" element={<StoreManager />} />
      </Route>
      
      {/* Protected Profile Route */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <AdminLayout>
            <ProfilePage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Protected Subscription Route */}
      <Route path="/subscription" element={
        <ProtectedRoute>
          <SubscriptionPage />
        </ProtectedRoute>
      } />
      
      {/* Default redirects */}
      <Route path="/" element={<Navigate to={state.isAuthenticated ? "/admin" : "/login"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <StoreProvider>
      <AnalyticsProvider>
        <ThemeProvider>
          <ToastProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <AppRoutes />
                <ToastContainer />
              </div>
            </Router>
          </ToastProvider>
        </ThemeProvider>
      </AnalyticsProvider>
    </StoreProvider>
  );
}

export default App;