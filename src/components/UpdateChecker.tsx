import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Rocket, Info } from 'lucide-react';

// === CONFIGURACIÓN DE VERSIÓN ACTUAL ===
// Actualiza este número de versión cada vez que compiles una nueva APK
export const CURRENT_APP_VERSION = '1.0.1';
// ======================================

interface AppUpdate {
  version: string;
  download_url: string;
  changelog?: string;
  is_mandatory?: boolean;
}

export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState<AppUpdate | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Si la app se ha minimizado al offline (PWA) no chequear
    if (!navigator.onLine || !isSupabaseConfigured) return;

    const checkUpdate = async () => {
      try {
        setChecking(true);
        // Consultar la tabla app_updates para ver la última versión
        const { data, error } = await supabase
          .from('app_updates')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          // Fallo silencioso si la tabla no existe o hay error de conexión
          console.warn('Update check failed or table not created yet:', error.message);
          return;
        }

        if (data && data.version && data.download_url) {
          // Comparación simple de versiones (ej. 1.0.1 vs 1.0.2)
          if (compareVersions(data.version, CURRENT_APP_VERSION) > 0) {
            setUpdateAvailable(data);
          }
        }
      } catch (err) {
        console.warn('Error checking for updates:', err);
      } finally {
        setChecking(false);
      }
    };

    // Darle un pequeño delay para no afectar el renderizado inicial
    const timer = setTimeout(() => {
      checkUpdate();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Función básica para comparar strings de versión (x.y.z)
  const compareVersions = (v1: string, v2: string) => {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const part1 = v1Parts[i] || 0;
      const part2 = v2Parts[i] || 0;
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    return 0;
  };

  const handleUpdate = () => {
    if (updateAvailable?.download_url) {
      window.open(updateAvailable.download_url, '_blank');
    }
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[100] bg-nexus-surface border border-nexus-cyan/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(6,182,212,0.15)] overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-nexus-cyan to-nexus-green" />
        
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-nexus-cyan/10 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-nexus-cyan" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-nexus-text">¡Nueva Versión!</h3>
              <p className="text-sm text-nexus-text-sec">
                v{updateAvailable.version} disponible (Actual: v{CURRENT_APP_VERSION})
              </p>
            </div>
          </div>
          {!updateAvailable.is_mandatory && (
            <button
              onClick={() => setDismissed(true)}
              className="p-2 -mr-2 -mt-2 text-nexus-text-sec hover:text-nexus-text hover:bg-nexus-surface-hover rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {updateAvailable.changelog && (
          <div className="mb-4 bg-nexus-bg p-3 rounded-lg border border-nexus-surface-hover">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-nexus-cyan" />
              <span className="text-xs font-bold text-nexus-cyan uppercase tracking-wider">Novedades</span>
            </div>
            <p className="text-sm text-nexus-text-sec whitespace-pre-wrap">
              {updateAvailable.changelog}
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {!updateAvailable.is_mandatory && (
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 px-4 py-2 text-sm font-medium text-nexus-text-sec bg-nexus-bg hover:bg-nexus-surface-hover border border-nexus-surface-hover rounded-xl transition-colors"
            >
              Más tarde
            </button>
          )}
          <button
            onClick={handleUpdate}
            className="flex-[2] flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-black bg-gradient-to-r from-nexus-cyan to-nexus-green hover:from-cyan-400 hover:to-green-400 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
          >
            <Download className="w-4 h-4" />
            Actualizar APK
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
