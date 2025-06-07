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

// ✅ SOLUCIÓN CRÍTICA: ProtectedRoute que NO bloquea el renderizado
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  
  // ✅ CAMBIO CRÍTICO: Solo verificar autenticación, no estados de carga
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
  
  // ✅ CRÍTICO: Renderizar inmediatamente sin verificar estados de carga
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