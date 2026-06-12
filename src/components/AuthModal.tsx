import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useAppStore } from '../store/useAppStore';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onNavigate: (view: string) => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  useBodyScrollLock(true);
  const { t } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (oauthErr) throw oauthErr;
    } catch (err: any) {
      setError(`Error: ${err.message || 'Ocurrió un error inesperado.'}`);
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
        className="relative w-full max-w-sm bg-nexus-card overflow-hidden rounded-[2rem] border border-cyan-500/20 shadow-nexus-glow text-center p-8"
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 bg-nexus-bg hover:bg-nexus-card-hover rounded-full transition-colors text-nexus-text-sec hover:text-nexus-text"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8 mt-4">
          <h2 className="text-3xl font-black text-nexus-text mb-2 tracking-tight">NexusPlay</h2>
          <p className="text-nexus-text-sec text-sm">
            {t('auth.welcome') || 'Inicia sesión para continuar tu aventura.'}
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-left flex items-start gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-14 mt-4 bg-white hover:bg-neutral-100 ring-4 ring-white/10 hover:ring-white/20 text-[#090b14] font-extrabold uppercase tracking-widest text-sm rounded-[1rem] transition-all flex items-center justify-center gap-3 shadow-2xl border border-nexus-border active:scale-[0.98]"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin text-[#090b14]" /> : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V14.4h6.887C18.2 16.56 15.645 18 12.24 18 8.445 18 5.385 15.3 5.385 12c0-3.3 3.06-6 6.855-6 1.8 0 3.465.72 4.68 1.89l3.24-3.24C18.24 2.835 15.42 1.8 12.24 1.8 6.57 1.8 1.8 6.57 1.8 12.24s4.77 10.44 10.44 10.44c6.3 0 10.71-4.275 10.71-10.44 0-.765-.09-1.35-.225-1.95H12.24z"/>
              </svg>
              Google
            </>
          )}
        </button>
        
        <p className="mt-8 text-[10px] text-nexus-text-sec uppercase tracking-widest opacity-60 font-bold max-w-xs mx-auto">
          Al iniciar sesión aceptas nuestros Términos de Servicio y Políticas.
        </p>
      </motion.div>
    </div>
  );
}

