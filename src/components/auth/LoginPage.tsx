import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

type FormMode = 'login' | 'register' | 'forgot-password';

interface FormData {
  email: string;
  password: string;
  name: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  general?: string;
}

export default function LoginPage() {
  const { signIn, signUp, resetPassword, isLoading, error: authError, clearError } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  
  const [mode, setMode] = useState<FormMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Limpiar errores cuando cambia el modo
  useEffect(() => {
    setErrors({});
    setSuccessMessage('');
    clearError();
  }, [mode, clearError]);

// Mostrar error de autenticación
useEffect(() => {
  if (authError) {
    setErrors({ general: authError.message });
  }
}, [authError?.message]); // <-- CAMBIO AQUÍ

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar contraseña (solo para login y registro)
    if (mode !== 'forgot-password') {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (mode === 'register' && formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    }

    // Validar nombre (solo para registro)
    if (mode === 'register' && !formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en inputs
  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');

    try {
      switch (mode) {
        case 'login': {
          const result = await signIn(formData.email, formData.password);
          if (!result.success) {
            setErrors({ general: result.error });
          } else {
            showSuccess('¡Bienvenido!', 'Iniciando sesión...');
          }
          break;
        }

        case 'register': {
          const result = await signUp(formData.email, formData.password, formData.name);
          if (!result.success) {
            setErrors({ general: result.error });
          } else if (result.error) {
            // Caso de confirmación por email
            setSuccessMessage(result.error);
            setMode('login');
            showSuccess('¡Cuenta creada!', result.error);
          } else {
            showSuccess('¡Bienvenido!', 'Cuenta creada exitosamente');
          }
          break;
        }

        case 'forgot-password': {
          const result = await resetPassword(formData.email);
          if (!result.success) {
            setErrors({ general: result.error });
          } else {
            setSuccessMessage('Te hemos enviado un email con instrucciones para resetear tu contraseña');
            showSuccess('Email enviado', 'Revisa tu bandeja de entrada');
            setMode('login');
          }
          break;
        }
      }
    } catch (error) {
      setErrors({ general: 'Error inesperado. Por favor intenta de nuevo.' });
      showError('Error', 'Algo salió mal. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cambiar entre modos
  const switchMode = (newMode: FormMode) => {
    setMode(newMode);
    setFormData({ email: '', password: '', name: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-full mb-4 shadow-lg">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tutaviendo</h1>
          <p className="text-gray-600">
            {mode === 'login' && 'Accede a tu panel de control'}
            {mode === 'register' && 'Crea tu cuenta y empieza a vender'}
            {mode === 'forgot-password' && 'Recupera tu contraseña'}
          </p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Mensajes de éxito */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Errores generales */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo de nombre (solo registro) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Tu nombre"
                  disabled={isSubmitting || isLoading}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
            )}

            {/* Campo de email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="tu@email.com"
                  disabled={isSubmitting || isLoading}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Campo de contraseña (no en forgot password) */}
            {mode !== 'forgot-password' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                    disabled={isSubmitting || isLoading}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isSubmitting || isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>
            )}

            {/* Link de contraseña olvidada */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('forgot-password')}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {/* Botón de submit */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 
                       disabled:from-gray-400 disabled:to-gray-400 text-white py-3 px-4 rounded-lg font-medium 
                       transition-all transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed 
                       flex items-center justify-center gap-2"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === 'login' && 'Iniciando sesión...'}
                  {mode === 'register' && 'Creando cuenta...'}
                  {mode === 'forgot-password' && 'Enviando email...'}
                </>
              ) : (
                <>
                  {mode === 'login' && 'Iniciar Sesión'}
                  {mode === 'register' && 'Crear Cuenta'}
                  {mode === 'forgot-password' && 'Enviar Email'}
                </>
              )}
            </button>
          </form>

          {/* Separador para OAuth */}
          {mode !== 'forgot-password' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">O continúa con</span>
                </div>
              </div>

              {/* Botones de OAuth */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => showError('Próximamente', 'Google login estará disponible pronto')}
                  disabled={isSubmitting || isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg 
                           hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>

                <button
                  type="button"
                  onClick={() => showError('Próximamente', 'GitHub login estará disponible pronto')}
                  disabled={isSubmitting || isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg 
                           hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>
            </>
          )}

          {/* Enlaces de cambio de modo */}
          <div className="mt-6 text-center">
            {mode === 'login' && (
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Regístrate
                </button>
              </p>
            )}
            
            {mode === 'register' && (
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Inicia sesión
                </button>
              </p>
            )}
            
            {mode === 'forgot-password' && (
              <p className="text-sm text-gray-600">
                ¿Recordaste tu contraseña?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Volver al login
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Conectado a Supabase para autenticación segura
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
            <Link to="/terms" className="hover:text-gray-600">
              Términos
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-gray-600">
              Privacidad
            </Link>
            <span>•</span>
            <Link to="/help" className="hover:text-gray-600">
              Ayuda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}