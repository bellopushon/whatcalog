import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';
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
import ActiveSubscription from './components/subscription/ActiveSubscription';

// Public Components
import PublicCatalog from './components/catalog/PublicCatalog';

// Componente para rutas protegidas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Componente para manejar el tema según la ruta
function ThemeManager() {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  
  useEffect(() => {
    const isAdminRoute = 
      location.pathname.startsWith('/admin') || 
      location.pathname === '/profile' || 
      location.pathname === '/subscription' ||
      location.pathname === '/subscription/active';
    
    const isPublicRoute = 
      location.pathname.startsWith('/store/') || 
      location.pathname === '/login' ||
      location.pathname === '/' ||
      location.pathname === '/terms' ||
      location.pathname === '/privacy' ||
      location.pathname === '/help';
    
    // Limpiar todas las clases primero
    document.documentElement.classList.remove('admin-dark', 'dark');
    document.body.classList.remove('admin-dark', 'dark');
    
    // Aplicar dark mode solo en rutas admin si está habilitado
    if (isAdminRoute && isDarkMode) {
      document.documentElement.classList.add('admin-dark', 'dark');
      document.body.classList.add('admin-dark', 'dark');
    }
    // Las rutas públicas siempre usan modo claro
    
  }, [location.pathname, isDarkMode]);
  
  return null;
}

// Componente principal de rutas
function AppRoutes() {
  const { isAuthenticated } = useAuth();
  
  return (
    <>
      <ThemeManager />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/admin" replace /> : <LoginPage />
        } />
        <Route path="/store/:slug" element={<PublicCatalog />} />
        
        {/* Rutas protegidas del admin */}
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
        
        {/* Ruta protegida del perfil */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <AdminLayout>
              <ProfilePage />
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        {/* Rutas protegidas de suscripción */}
        <Route path="/subscription" element={
          <ProtectedRoute>
            <SubscriptionPage />
          </ProtectedRoute>
        } />
        <Route path="/subscription/active" element={
          <ProtectedRoute>
            <ActiveSubscription />
          </ProtectedRoute>
        } />
        
        {/* Rutas de utilidad */}
        <Route path="/terms" element={<div className="p-8">Términos y Condiciones</div>} />
        <Route path="/privacy" element={<div className="p-8">Política de Privacidad</div>} />
        <Route path="/help" element={<div className="p-8">Centro de Ayuda</div>} />
        
        {/* Redirección por defecto */}
        <Route path="/" element={
          <Navigate to={isAuthenticated ? "/admin" : "/login"} replace />
        } />
        
        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
              <a 
                href={isAuthenticated ? "/admin" : "/login"}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Volver al inicio
              </a>
            </div>
          </div>
        } />
      </Routes>
    </>
  );
}

// Componente principal de la aplicación
function App() {
  return (
    <Router>
      <AuthProvider>
        <StoreProvider>
          <AnalyticsProvider>
            <ThemeProvider>
              <ToastProvider>
                <div className="min-h-screen bg-gray-50">
                  <AppRoutes />
                  <ToastContainer />
                </div>
              </ToastProvider>
            </ThemeProvider>
          </AnalyticsProvider>
        </StoreProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;