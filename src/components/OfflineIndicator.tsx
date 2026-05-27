import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Wifi, WifiOff, RefreshCw, Database } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function OfflineIndicator() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cacheSize, setCacheSize] = useState<string>('0 MB');

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Calculate cache size
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        if (estimate.usage) {
          setCacheSize((estimate.usage / 1024 / 1024).toFixed(1) + ' MB');
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2"
      >
        {isOffline && (
          <div className="bg-red-500/95 backdrop-blur-md border border-red-500/30 text-white rounded-xl px-4 py-3 shadow-[0_5px_20px_rgba(239,68,68,0.4)] flex items-center gap-4 animate-bounce-short">
            <WifiOff className="w-5 h-5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-wider">Modo Offline Activo</span>
              <span className="text-[10px] font-medium opacity-90">Explorando caché local / offline db</span>
            </div>
          </div>
        )}

        {offlineReady && !isOffline && (
          <div className="bg-emerald-500/95 backdrop-blur-md border border-emerald-500/30 text-white rounded-xl px-4 py-2 shadow-[0_5px_20px_rgba(16,185,129,0.3)] flex items-center gap-3">
            <Database className="w-5 h-5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wider uppercase">Offline Ready</span>
              <span className="text-[10px] opacity-90 font-medium">Caché PWA: {cacheSize}</span>
            </div>
            <button 
              onClick={() => setOfflineReady(false)}
              className="ml-2 bg-white/20 hover:bg-white/30 rounded-md p-1.5 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {needRefresh && (
          <div className="bg-blue-500/95 backdrop-blur-md border border-blue-500/30 text-white rounded-xl px-4 py-2 shadow-[0_5px_20px_rgba(59,130,246,0.3)] flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wider uppercase">Actualización</span>
              <span className="text-[10px] opacity-90">Nueva versión lista ({cacheSize})</span>
            </div>
            <button 
              onClick={() => updateServiceWorker(true)}
              className="bg-white/20 hover:bg-white/30 rounded-md px-3 py-1.5 text-[10px] ml-2 cursor-pointer transition-all uppercase font-bold"
            >
              Recargar
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
