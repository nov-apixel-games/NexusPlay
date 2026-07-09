import { useAppStore } from '../../store/useAppStore';
import { Zap } from 'lucide-react';
import { AppItem } from '../../types';

export function EventsView({ apps, onAppClick }: { apps?: AppItem[], onAppClick?: (app: AppItem) => void }) {
  const { t } = useAppStore();
  const newlyUpdated = apps?.filter(a => a.previous_versions && a.previous_versions.length > 0).slice(0, 3) || [];
  
  return (
    <div className="pt-24 px-6 max-w-5xl mx-auto pb-16">
      <h1 className="text-3xl font-black mb-8 text-nexus-text flex items-center gap-3"><Zap className="w-8 h-8 text-yellow-400" /> Eventos & Novedades</h1>
      <div className="space-y-6">
        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border-cyan-500/30 bg-cyan-500/5 relative overflow-hidden shadow-nexus-glow">
           <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                 <span className="px-3 py-1 bg-cyan-500 text-nexus-bg text-[10px] font-black uppercase tracking-widest rounded-lg">Destacado</span>
                 <h2 className="text-2xl font-black text-nexus-text">Nexus Summer Game Jam</h2>
                 <p className="text-nexus-text-sec text-sm leading-relaxed max-w-xl">¡Ya comenzó el evento más esperado del año! Los creadores tienen 72 horas para publicar un juego temático. Vota tus favoritos y gana XP doble en todas las reviews.</p>
              </div>
              <button onClick={() => alert("Summer Game Jam comenzará pronto")} className="px-6 py-3 bg-cyan-500 text-nexus-bg font-black rounded-xl hover:bg-cyan-400 transition-all text-sm shadow-lg shadow-cyan-500/20 shrink-0">
                 Participar Ahora
              </button>
           </div>
        </div>
        
        {newlyUpdated.length > 0 && (
          <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border-nexus-border bg-nexus-card">
            <h3 className="text-xl font-black mb-6 text-nexus-text">Últimas Actualizaciones</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               {newlyUpdated.map(app => (
                  <div key={app.id} onClick={() => onAppClick?.(app)} className="p-4 bg-nexus-surface border border-nexus-border rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-nexus-card-hover transition-colors">
                    <img src={app.icon} className="w-12 h-12 rounded-xl object-cover shadow-md" alt="" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-nexus-text text-lg">{app.name}</h4>
                      <p className="text-nexus-cyan font-bold text-xs uppercase tracking-wider">Nueva v{app.version}</p>
                      <p className="text-nexus-text-sec text-xs mt-1 truncate max-w-[150px]">{app.changelog}</p>
                    </div>
                  </div>
               ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
