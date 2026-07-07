import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, X, Loader2, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DoubleVerificationModalProps {
  onSuccess: () => void;
  onFail: () => void;
  onClose: () => void;
  user: any;
}

export default function DoubleVerificationModal({ onSuccess, onFail, onClose, user }: DoubleVerificationModalProps) {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
  const [errorText, setErrorText] = useState('');
  const [pin, setPin] = useState('');
  
  const getSystemInfo = () => {
    const na = navigator.userAgent;
    let browser = "Desconocido";
    if(na.includes('Firefox')) browser = "Firefox";
    else if(na.includes('Chrome')) browser = "Chrome";
    else if(na.includes('Safari')) browser = "Safari";
    else if(na.includes('Edge')) browser = "Edge";
    
    return browser;
  };

  const getIP = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      return data.ip;
    } catch {
      return "0.0.0.0";
    }
  };

  const logAccess = async (success: boolean) => {
    try {
      const browser = getSystemInfo();
      const ip = await getIP();
      
      await supabase.from('admin_access_logs').insert([{
        user_id: user.id,
        email: user.email,
        browser,
        ip_address: ip,
        verification_result: success
      }]);
    } catch (e) {
      console.error("Failed to log access", e);
    }
  };

  const handleVerify = async () => {
    if (pin.length !== 6) {
      setErrorText('El PIN debe tener 6 dígitos');
      return;
    }

    setStatus('verifying');
    setErrorText('');
    
    try {
      const { data, error } = await supabase.rpc('verify_admin_pin', { p_pin: pin });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        await logAccess(true);
        setStatus('success');
        setTimeout(onSuccess, 1000);
      } else {
        await logAccess(false);
        setErrorText('PIN incorrecto.');
        setStatus('idle');
        setPin('');
      }
    } catch (e: any) {
      await logAccess(false);
      setErrorText(e.message || 'Error al verificar el PIN');
      setStatus('idle');
      setPin('');
      if (e.message && e.message.includes('bloqueada')) {
        setTimeout(onFail, 3000); // Kick out if blocked
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 6) {
      handleVerify();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-nexus-surface border border-red-500/30 rounded-2xl p-6 w-full max-w-md relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-nexus-text-sec hover:text-white">
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          
          <h2 className="text-2xl font-bold font-display text-white mb-2">Panel de Administración</h2>
          <p className="text-nexus-text-sec text-sm mb-6">
            Doble verificación requerida. Ingrese su PIN de seguridad de 6 dígitos.
          </p>

          {status === 'verifying' ? (
             <div className="py-8 flex flex-col justify-center items-center">
                <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
                <p className="text-nexus-text font-mono text-sm">Verificando credenciales...</p>
             </div>
          ) : status === 'success' ? (
            <div className="py-8 relative">
              <div className="w-32 h-32 mx-auto rounded-full border-4 border-green-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-green-400 font-mono font-bold mt-6">Identidad confirmada</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-text-sec w-5 h-5" />
                <input 
                  type="password" 
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••"
                  className="w-full bg-nexus-bg border border-nexus-border rounded-xl py-3 pl-10 pr-4 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-red-500 transition-colors"
                  autoFocus
                />
              </div>
              <button 
                onClick={handleVerify}
                disabled={pin.length !== 6}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                Verificar PIN
              </button>
              
              {errorText && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm font-medium mt-2"
                >
                  {errorText}
                </motion.p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
