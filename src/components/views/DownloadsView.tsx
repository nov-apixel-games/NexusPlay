import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Download, ArrowRight, Zap } from 'lucide-react';
import { AppItem } from '../../types';

export function DownloadsView({ apps, onAppClick }: { apps: AppItem[], onAppClick?: (app: AppItem) => void }) {
  const { t } = useAppStore();
  const [downloadedIds, setDownloadedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('nexus_downloaded_ids') || '[]');
    } catch {
      return [];
    }
  });

  const downloadedApps = useMemo(() => {
    return apps.filter(a => downloadedIds.includes(a.id));
  }, [apps, downloadedIds]);

  const clearHistory = () => {
    if (confirm("¿Estás seguro de que quieres limpiar tu historial de descargas?")) {
      downloadedIds.forEach(id => {
        localStorage.removeItem(`nexus_app_version_${id}`);
        localStorage.removeItem(`has_downloaded_${id}`);
      });
      localStorage.removeItem('nexus_downloaded_ids');
      setDownloadedIds([]);
    }
  };

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black flex items-center gap-3"><Download className="w-8 h-8 text-cyan-400" /> Mis Descargas</h1>
        {downloadedApps.length > 0 && (
          <button 
            onClick={clearHistory}
            className="text-sm text-red-400 hover:text-red-300 font-bold transition-colors"
            type="button" >
            Limpiar Historial
          </button>
        )}
      </div>

      <div className="space-y-4">
        {downloadedApps.map(app => {
          const installedVersion = localStorage.getItem(`nexus_app_version_${app.id}`);
          const hasUpdate = installedVersion && installedVersion !== app.version;
          
          return (
            <div 
              key={app.id} 
              onClick={() => onAppClick?.(app)} 
              className={`glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-nexus-card transition-colors border-nexus-border cursor-pointer relative overflow-hidden group ${hasUpdate ? 'border-green-500/30 bg-green-500/5' : ''}`}
            >
              {hasUpdate && (
                <div className="absolute top-0 right-0 py-1 px-3 bg-green-500 text-nexus-bg text-[9px] font-black uppercase tracking-tighter rounded-bl-xl shadow-lg animate-pulse">
                  Actualización Disponible
                </div>
              )}

              <img src={app.icon} className="w-12 h-12 rounded-[1rem] shadow-lg object-cover" alt={app.name} />
              <div className="flex-1 min-w-0">
                 <h3 className="font-bold text-lg text-nexus-text truncate">{app.name}</h3>
                 <div className="flex items-center gap-2 mt-1">
                   <span className="text-xs text-nexus-text-sec">v{installedVersion || '1.0'}</span>
                   {hasUpdate && (
                     <>
                        <ArrowRight className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-400 font-bold">v{app.version}</span>
                     </>
                   )}
                 </div>
              </div>
              
              <div className="flex items-center gap-2">
                {hasUpdate ? (
                  <button className="px-4 py-2 bg-green-500 text-nexus-bg font-black rounded-xl text-xs hover:bg-green-400 transition-all flex items-center gap-2">
                    <Zap className="w-4 h-4" /> ACTUALIZAR
                  </button>
                ) : (
                  <>
                    <button className="hidden sm:block px-4 py-2 bg-nexus-card text-nexus-text-sec hover:bg-nexus-card-hover hover:text-nexus-text font-bold rounded-xl text-sm transition-colors border border-nexus-border">{t("main.installAgain") || "Instalar de nuevo"}</button>
                    <button className="sm:hidden p-2 bg-nexus-card text-nexus-text-sec rounded-xl border border-nexus-border"><Download className="w-5 h-5"/></button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {downloadedApps.length === 0 && (
          <div className="text-center py-20 px-6 bg-nexus-card border border-dashed border-nexus-border rounded-[2rem]">
            <div className="w-20 h-20 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <Download className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-nexus-text mb-2">{t("main.noRecentDownloads") || "No tienes descargas recientes"}</h2>
            <p className="text-nexus-text-sec text-sm max-w-xs mx-auto">Explora nuestro catálogo y empieza a descargar los mejores juegos y aplicaciones.</p>
            <button 
              onClick={() => window.location.hash = ''} 
              className="mt-8 px-6 py-2 bg-nexus-cyan text-nexus-bg font-black rounded-xl hover:scale-105 transition-all text-xs uppercase"
            >
              Explorar Catálogo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
