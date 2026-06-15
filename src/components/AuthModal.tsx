import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useAppStore } from '../store/useAppStore';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onNavigate: (view: string) => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export default function AuthModal({ onClose, onSuccess, onNavigate }: AuthModalProps) {
  useBodyScrollLock(true);
  const { t } = useAppStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Reset state when mode changes
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (oauthErr) throw oauthErr;
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        
        onSuccess();
      } else if (mode === 'register') {
        if (!termsAccepted) {
          throw new Error(t('auth.acceptTerms'));
        }
        if (username.length < 3) throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
        if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
        if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden.');

        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              username: username,
              real_name: realName,
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('User already registered')) {
            throw new Error('Este correo ya está registrado.');
          }
          throw signUpError;
        }

        setSuccessMsg('Cuenta creada. IMPORTANTE: Confirma tu correo antes de iniciar sesión (revisa tu bandeja de entrada o spam).');
        setTimeout(() => switchMode('login'), 5000);
      } else if (mode === 'forgot_password') {
         if (!email) throw new Error('Por favor, ingresa tu correo electrónico.');
         
         const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
           redirectTo: `${window.location.origin}/reset-password`,
         });
         
         if (resetError) throw resetError;
         
         setSuccessMsg('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en breve.');
         setTimeout(() => switchMode('login'), 5000);
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      let errorMsg = err.message;
      if (errorMsg === 'Invalid login credentials') errorMsg = 'Credenciales inválidas. Verifica tu correo y contraseña.';
      if (errorMsg === 'Email not confirmed') errorMsg = 'Debes confirmar tu correo electrónico antes de iniciar sesión.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-hidden pointer-events-auto overscroll-none">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-sm bg-nexus-card overflow-hidden rounded-[2rem] border border-cyan-500/20 shadow-nexus-glow text-left p-6 sm:p-8"
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 bg-nexus-bg hover:bg-nexus-card-hover rounded-full transition-colors text-nexus-text-sec hover:text-nexus-text z-10"
         type="button" >
          <X className="w-5 h-5" />
        </button>

        {mode !== 'login' && (
           <button 
             onClick={() => switchMode('login')} 
             className="absolute top-6 left-6 p-2 bg-nexus-bg hover:bg-nexus-card-hover rounded-full transition-colors text-nexus-text-sec hover:text-nexus-text z-10"
           >
             <ArrowLeft className="w-5 h-5" />
           </button>
        )}

        <div className="mb-6 mt-4 text-center">
          <h2 className="text-3xl font-black text-nexus-text mb-2 tracking-tight">
             {mode === 'login' ? 'NexusPlay' : mode === 'register' ? 'Crear Cuenta' : 'Recuperar'}
          </h2>
          <p className="text-nexus-text-sec text-sm">
            {mode === 'login' 
              ? (t('auth.welcome')) 
              : mode === 'register' 
                ? 'Únete a la plataforma digital de nueva generación.' 
                : 'Ingresa tu email para restablecer la contraseña.'}
          </p>
        </div>

        <AnimatePresence mode="popLayout">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-left flex items-start gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-start gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {mode === 'login' && (
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 bg-white hover:bg-neutral-100 text-[#090b14] font-extrabold uppercase tracking-widest text-sm rounded-[1rem] transition-all flex items-center justify-center gap-3 shadow-lg border border-nexus-border active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#090b14]" /> : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.24 10.285V14.4h6.887C18.2 16.56 15.645 18 12.24 18 8.445 18 5.385 15.3 5.385 12c0-3.3 3.06-6 6.855-6 1.8 0 3.465.72 4.68 1.89l3.24-3.24C18.24 2.835 15.42 1.8 12.24 1.8 6.57 1.8 1.8 6.57 1.8 12.24s4.77 10.44 10.44 10.44c6.3 0 10.71-4.275 10.71-10.44 0-.765-.09-1.35-.225-1.95H12.24z"/>
                  </svg>
                  {t("auth.continueWithGoogle")}
                </>
              )}
            </button>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-nexus-border"></div>
              </div>
              <span className="relative bg-nexus-card px-4 text-[10px] font-bold uppercase tracking-widest text-nexus-text-sec">
                {t("auth.orEmail")}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-nexus-text-sec uppercase tracking-wider px-1">Usuario</label>
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-nexus-text-sec group-focus-within:text-cyan-400 transition-colors" />
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full h-12 bg-nexus-surface border border-nexus-border rounded-xl pl-11 pr-4 text-sm focus:border-cyan-500 focus:bg-cyan-500/5 transition-all text-nexus-text outline-none" 
                    placeholder="Tu nombre de usuario"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-nexus-text-sec uppercase tracking-wider px-1">Nombre Real</label>
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-nexus-text-sec group-focus-within:text-cyan-400 transition-colors" />
                  <input 
                    type="text" 
                    required
                    value={realName}
                    onChange={e => setRealName(e.target.value)}
                    className="w-full h-12 bg-nexus-surface border border-nexus-border rounded-xl pl-11 pr-4 text-sm focus:border-cyan-500 focus:bg-cyan-500/5 transition-all text-nexus-text outline-none" 
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-1.5">
             <label className="text-xs font-bold text-nexus-text-sec uppercase tracking-wider px-1">Email</label>
             <div className="relative group">
               <Mail className="absolute left-4 top-3.5 w-5 h-5 text-nexus-text-sec group-focus-within:text-cyan-400 transition-colors" />
               <input 
                 type="email" 
                 required
                 value={email}
                 onChange={e => setEmail(e.target.value)}
                 className="w-full h-12 bg-nexus-surface border border-nexus-border rounded-xl pl-11 pr-4 text-sm focus:border-cyan-500 focus:bg-cyan-500/5 transition-all text-nexus-text outline-none" 
                 placeholder="tu@email.com"
               />
             </div>
          </div>

          {mode !== 'forgot_password' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                 <label className="text-xs font-bold text-nexus-text-sec uppercase tracking-wider">Contraseña</label>
                 {mode === 'login' && (
                   <button 
                     type="button" 
                     onClick={() => switchMode('forgot_password')}
                     className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                   >
                     ¿Olvidaste tu contraseña?
                   </button>
                 )}
              </div>
              <div className="relative group">
                 <Lock className="absolute left-4 top-3.5 w-5 h-5 text-nexus-text-sec group-focus-within:text-cyan-400 transition-colors" />
                 <input 
                   type={showPassword ? "text" : "password"} 
                   required
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                   className="w-full h-12 bg-nexus-surface border border-nexus-border rounded-xl pl-11 pr-11 text-sm focus:border-cyan-500 focus:bg-cyan-500/5 transition-all text-nexus-text outline-none" 
                   placeholder="••••••••"
                 />
                 <button 
                   type="button" 
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-3 top-3.5 text-nexus-text-sec hover:text-nexus-text transition-colors"
                 >
                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-nexus-text-sec uppercase tracking-wider px-1">Confirmar Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-nexus-text-sec group-focus-within:text-cyan-400 transition-colors" />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full h-12 bg-nexus-surface border border-nexus-border rounded-xl pl-11 pr-11 text-sm focus:border-cyan-500 focus:bg-cyan-500/5 transition-all text-nexus-text outline-none" 
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-nexus-text-sec hover:text-nexus-text transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-start pt-2 px-1 gap-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-nexus-surface border-nexus-border text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="terms" className="text-xs text-nexus-text-sec">
                  {t("auth.readTerms")} {' '}
                  <button type="button" onClick={() => onNavigate('terms')} className="text-cyan-400 font-bold hover:underline"> {t('footer.terms')} </button>{' '}
                  {t("auth.andCookies")}{' '}
                  <button type="button" onClick={() => onNavigate('cookies')} className="text-cyan-400 font-bold hover:underline">
                    {t("footer.cookies")}
                  </button>
                </label>
              </div>
            </div>
          )}

          <button 
             type="submit" 
             disabled={loading || (mode === 'register' && !termsAccepted)}
             className="w-full h-12 mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-nexus-bg font-black uppercase tracking-wider text-sm rounded-[1rem] transition-all disabled:opacity-50 flex items-center justify-center shadow-nexus-glow"
          >
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'login' ? (t('auth.loginBtn')) : mode === 'register' ? (t('auth.createAccount')) : (t('auth.sendLink'))}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-8 text-center text-sm text-nexus-text-sec">
            {t("auth.noAccount")}{' '}
            <button 
              onClick={() => switchMode('register')} 
              className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
            >
              {t("auth.registerHere")}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}


