import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, ShieldCheck, Key, AlertTriangle, Loader2 } from 'lucide-react';

export function AdminSecurity({ addToast }: { addToast: (msg: string, type: 'success' | 'error' | 'info') => void }) {
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [mode, setMode] = useState<'view' | 'create' | 'change' | 'remove'>('view');
  
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('is_admin_pin_configured');
      if (error) {
        // Fallback in case function is not created yet
        setHasPin(false);
      } else {
        setHasPin(data);
      }
    } catch (e) {
      setHasPin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (mode === 'create' || mode === 'change') {
      if (newPin.length !== 6) {
        addToast('El nuevo PIN debe tener 6 dígitos', 'error');
        return;
      }
      if (newPin !== confirmPin) {
        addToast('Los PINs no coinciden', 'error');
        return;
      }
    }
    
    if ((mode === 'change' || mode === 'remove') && currentPin.length !== 6) {
      addToast('Ingresa el PIN actual', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const targetPin = mode === 'remove' ? null : newPin;
      const cPin = (mode === 'change' || mode === 'remove') ? currentPin : null;
      
      const { data, error } = await supabase.rpc('set_admin_pin', { 
        new_pin: targetPin, 
        current_pin: cPin 
      });

      if (error) throw error;
      
      addToast(
        mode === 'create' ? 'PIN creado exitosamente' : 
        mode === 'change' ? 'PIN actualizado exitosamente' : 
        'PIN eliminado exitosamente', 
        'success'
      );
      
      setNewPin('');
      setConfirmPin('');
      setCurrentPin('');
      setMode('view');
      checkPinStatus();
      
    } catch (e: any) {
      addToast(e.message || 'Error al procesar la solicitud', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in w-full">
      <header>
        <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-nexus-text">Seguridad del Panel</h3>
        <p className="text-red-400 text-sm md:text-base">Protección avanzada con PIN y doble factor para administradores.</p>
      </header>

      <div className="bg-nexus-card/40 border border-red-500/10 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl backdrop-blur-sm max-w-2xl">
        {mode === 'view' ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${hasPin ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                {hasPin ? <ShieldCheck className="w-7 h-7 text-green-500" /> : <AlertTriangle className="w-7 h-7 text-red-500" />}
              </div>
              <div>
                <h4 className="text-xl font-bold text-nexus-text">Estado del PIN</h4>
                <p className={`text-sm font-bold ${hasPin ? 'text-green-400' : 'text-red-400'}`}>
                  {hasPin ? 'PIN Configurado' : 'PIN No Configurado'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {!hasPin ? (
                <button onClick={() => setMode('create')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                  <Key className="w-4 h-4" /> Crear PIN
                </button>
              ) : (
                <>
                  <button onClick={() => setMode('change')} className="bg-nexus-surface hover:bg-nexus-border text-nexus-text px-4 py-2 rounded-xl text-sm font-bold transition-all border border-nexus-border">
                    Cambiar PIN
                  </button>
                  <button onClick={() => setMode('remove')} className="bg-red-950/30 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-red-900/30">
                    Eliminar PIN
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-nexus-text flex items-center gap-2">
                <Key className="w-5 h-5 text-red-500" /> 
                {mode === 'create' ? 'Crear Nuevo PIN' : mode === 'change' ? 'Cambiar PIN Actual' : 'Eliminar PIN'}
              </h4>
              <button onClick={() => setMode('view')} className="text-nexus-text-sec hover:text-nexus-text text-sm font-bold">
                Cancelar
              </button>
            </div>

            <div className="space-y-4">
              {(mode === 'change' || mode === 'remove') && (
                <div>
                  <label className="block text-xs font-bold text-nexus-text-sec uppercase tracking-widest mb-2">PIN Actual</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-nexus-surface border border-nexus-border text-nexus-text p-3 rounded-xl focus:border-red-500 transition-colors font-mono text-center tracking-[1em] text-lg"
                    placeholder="••••••"
                  />
                </div>
              )}

              {(mode === 'create' || mode === 'change') && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-nexus-text-sec uppercase tracking-widest mb-2">Nuevo PIN (6 Dígitos)</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-nexus-surface border border-nexus-border text-nexus-text p-3 rounded-xl focus:border-red-500 transition-colors font-mono text-center tracking-[1em] text-lg"
                      placeholder="••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-nexus-text-sec uppercase tracking-widest mb-2">Confirmar Nuevo PIN</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-nexus-surface border border-nexus-border text-nexus-text p-3 rounded-xl focus:border-red-500 transition-colors font-mono text-center tracking-[1em] text-lg"
                      placeholder="••••••"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleAction}
              disabled={actionLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-widest flex justify-center items-center gap-2"
            >
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
              Confirmar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
