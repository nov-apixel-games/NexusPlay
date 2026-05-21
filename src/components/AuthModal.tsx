import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, X, Loader2, User, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onNavigate: (view: string) => void;
}

export default function AuthModal({ onClose, onSuccess, onNavigate }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Limpiar estado cuando cambia el modo
  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
    setUsername('');
    setRealName('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [isLogin]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      console.log("[Google Auth] Iniciando signInWithOAuth...");
      
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://nexus-play-uy.vercel.app/'
        }
      });

      if (oauthErr) throw oauthErr;
      
      setSuccessMsg("Redirigiendo a Google para iniciar sesión...");

    } catch (err: any) {
      console.error("Google Auth Exception:", err);
      console.error("Formato completo del error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      
      let errorMsg = `Error al iniciar sesión con Google: ${err.message || err.error_description || 'Ocurrió un error inesperado.'}`;
      
      if (err.message?.includes('provider is not enabled') || err.message?.includes('not supported')) {
        errorMsg = "Google Auth no está configurado en Supabase (Authentication > Providers > Google). Actívalo con tu Client ID y Client Secret.";
      }
      
      setError(errorMsg);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !termsAccepted) {
      setError('Debes aceptar los Términos y Condiciones para continuar.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        
        onSuccess();
      } else {
        // Validaciones Registro
        if (username.length < 3) throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
        if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
        if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden.');

        // Registro en Supabase Auth
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              username: username,
              real_name: realName,
              // role no se pasa por seguridad, el trigger asume 'user'
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('User already registered')) {
            throw new Error('Este correo ya está registrado.');
          }
          if (signUpError.message.includes('Database error saving new user')) {
            throw new Error("Error en la Base de Datos. Por favor, ve al panel de Supabase > SQL Editor y ejecuta el contenido del archivo 'supabase.sql' que acabo de actualizar. Esto reparará la tabla profiles y el trigger para nuevos registros.");
          }
          throw signUpError;
        }

        setSuccessMsg('Cuenta creada correctamente.');
        
        // Simular inicio de sesión exitoso si el email no requiere confirmación
        if (data.session) {
           setTimeout(() => onSuccess(), 1500);
        } else {
           // Si se requiere confirmación de email por config de Supabase
           setSuccessMsg('Cuenta creada. IMPORTANTE: Confirma tu correo antes de iniciar sesión. (O deshabilita Confirmar Email en Supabase Auth > Providers)');
           setTimeout(() => setIsLogin(true), 5000);
        }
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      let errorMsg = err.message || 'Ocurrió un error inesperado.';
      if (errorMsg === 'Invalid login credentials') errorMsg = 'Credenciales inválidas. Verifica tu correo y contraseña, o asegúrate de haber confirmado tu correo si Supabase lo requiere.';
      if (errorMsg === 'Email not confirmed') errorMsg = 'Debes confirmar tu correo electrónico. Por favor revisa tu bandeja de entrada o desactiva "Confirm Email" en el panel de Supabase.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-[#090b14] overflow-hidden rounded-[2rem] border border-cyan-500/20 shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)]"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative p-8">
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
              {isLogin ? 'Bienvenido a Nexus' : 'Crear Cuenta'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isLogin ? 'Inicia sesión para continuar tu aventura.' : 'Únete a la plataforma digital de nueva generación.'}
            </p>
          </div>

          <AnimatePresence mode="popLayout">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </motion.div>
            )}
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4 relative">
            
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Usuario</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full h-12 bg-[#0d111c] border border-white/5 rounded-xl pl-12 pr-4 text-sm focus:border-cyan-500 focus:bg-cyan-500/5 transition-all text-white outline-none" 
                      placeholder="Tu nombre de usuario"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Nombre Real</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={realName}
                      onChange={e => setRealName(e.target.value)}
                      className="w-full h-12 bg-[#0d111c] border border-white/5 rounded-xl pl-12 pr-4 text-sm focus:border-cyan-500 focus:bg-cyan-500/5 transition-all text-white outline-none" 
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-12 bg-[#0d111c] border border-white/5 rounded-xl pl-12 pr-4 text-sm focus:border-cyan-500 focus:bg-cyan-500/5 transition-all text-white outline-none" 
                  placeholder="tu@email.com"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contraseña</label>
                {isLogin && (
                  <button type="button" className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-12 bg-[#0d111c] border border-white/5 rounded-xl pl-12 pr-12 text-sm focus:border-cyan-500 focus:bg-cyan-500/5 transition-all text-white outline-none" 
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Confirmar Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full h-12 bg-[#0d111c] border border-white/5 rounded-xl pl-12 pr-12 text-sm focus:border-cyan-500 focus:bg-cyan-500/5 transition-all text-white outline-none" 
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-gray-500 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex items-center pt-2 px-1">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="w-4 h-4 rounded bg-[#0d111c] border-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-[#090b14]"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-400 cursor-pointer">
                  Recordarme en este dispositivo
                </label>
              </div>
            )}

            {!isLogin && (
              <div className="flex items-center pt-2 px-1 gap-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0d111c] border-white/10 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-400">
                  He leído y acepto los {' '}
                  <button type="button" onClick={() => onNavigate('terms')} className="text-cyan-400 font-bold hover:underline">
                    Términos y Condiciones
                  </button>{' '}
                  y la{' '}
                  <button type="button" onClick={() => onNavigate('cookies')} className="text-cyan-400 font-bold hover:underline">
                    Política de Cookies
                  </button>
                </label>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black uppercase tracking-wider text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Entrar a Nexus' : 'Completar Registro')}
            </button>
          </form>

          {/* Botón de Google Oauth */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative bg-[#090b14] px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              O CONTINUAR CON
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-12 bg-white hover:bg-neutral-100 text-[#090b14] font-extrabold uppercase tracking-widest text-xs rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_-5px_rgba(255,255,255,0.25)] border border-white/10 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.24 10.285V14.4h6.887C18.2 16.56 15.645 18 12.24 18 8.445 18 5.385 15.3 5.385 12c0-3.3 3.06-6 6.855-6 1.8 0 3.465.72 4.68 1.89l3.24-3.24C18.24 2.835 15.42 1.8 12.24 1.8 6.57 1.8 1.8 6.57 1.8 12.24s4.77 10.44 10.44 10.44c6.3 0 10.71-4.275 10.71-10.44 0-.765-.09-1.35-.225-1.95H12.24z"/>
            </svg>
            Continuar con Google
          </button>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-gray-400 hover:text-cyan-400 transition-colors"
            >
              {isLogin ? (
                <span>¿No tienes cuenta? <span className="text-white">Regístrate aquí</span></span>
              ) : (
                <span>¿Ya tienes cuenta? <span className="text-white">Inicia sesión</span></span>
              )}
            </button>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold">
              Hecho por NexusPlay Studios
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

