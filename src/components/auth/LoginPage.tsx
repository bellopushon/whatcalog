import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { state } = useStore();

  // ✅ SOLUCIÓN CRÍTICA: Redirigir automáticamente cuando el usuario se autentique
  useEffect(() => {
    if (state.isAuthenticated && !isLoading) {
      console.log('[LoginPage] User authenticated, redirecting to admin...');
      navigate('/admin', { replace: true });
    }
  }, [state.isAuthenticated, isLoading, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (isRegister && !name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) return;

  setIsLoading(true);
  setErrors({});

  try {
    console.log('[LoginPage] Attempting auth:', { isRegister, email });
    
    if (isRegister) {
      // Registro con Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            plan: 'gratuito'
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        setErrors({ general: error.message || 'Error al crear la cuenta. Intenta de nuevo.' });
        setIsLoading(false);
        return;
      }

      if (data.user && !data.session) {
        setErrors({ 
          general: 'Te hemos enviado un email de confirmación. Por favor revisa tu bandeja de entrada.' 
        });
        setIsLoading(false);
        return;
      }

      // Registro exitoso con sesión activa
      if (data.session) {
        window.location.href = '/admin';
        return;
      }
      
    } else {
      // Inicio de sesión con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        console.error('Login error:', error);
        setErrors({ general: 'Email o contraseña incorrectos.' });
        setIsLoading(false);
        return;
      }

      // Login exitoso - redirección inmediata
      if (data.session) {
        console.log('[LoginPage] Login successful, redirecting...');
        window.location.href = '/admin';
        return;
      }
    }
    
  } catch (error) {
    console.error('Auth error:', error);
    setErrors({ general: 'Error de conexión. Por favor intenta de nuevo.' });
    setIsLoading(false);
  }

    // ✅ sIMPORTANTE: No setear isLoading(false) aquí para mantener el estado de carga hasta la redirección
  };

  const handleInputChange = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'name') setName(value);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-full mb-4">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tutaviendo</h1>
          <p className="text-gray-600">
            {isRegister ? 'Crea tu cuenta y empieza a vender' : 'Accede a tu panel de control'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Tu nombre"
                  disabled={isLoading}
                  required
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="tu@email.com"
                  disabled={isLoading}
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isRegister ? 'Creando cuenta...' : 'Iniciando sesión...'}
                </>
              ) : (
                isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrors({});
                setEmail('');
                setPassword('');
                setName('');
              }}
              disabled={isLoading}
              className="text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
            >
              {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Conectado a Supabase para autenticación segura</p>
        </div>
      </div>
    </div>
  );
}