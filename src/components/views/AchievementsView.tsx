import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Compass, Heart, Zap, Star } from 'lucide-react';

export function AchievementsView({ userProfile }: { userProfile?: any }) {
  const { t } = useAppStore();

  const xp = userProfile?.xp || 0;
  const level = Math.floor(xp / 1000) + 1;
  const nextLevelXp = level * 1000;
  const currentLevelXp = xp % 1000;
  const progressPercent = (currentLevelXp / 1000) * 100;

  let titleBadge = 'EXPLORADOR';
  if (level > 2) titleBadge = 'AVENTURERO';
  if (level > 5) titleBadge = 'ENTUSIASTA';
  if (level > 10) titleBadge = 'VETERANO';
  if (level > 20) titleBadge = 'LEYENDA';

  const reviewsDone = userProfile?.comments || 0;
  const favsDone = userProfile?.favorites_count || 0;

  const badges = useMemo(() => {
    return [
      { id: 'early_pioneer', title: 'Pionero Nexus', desc: 'Registrado en la fase alfa de NexusPlay', icon: Compass, color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5', unlocked: true },
      { id: 'first_review', title: 'Crítico Novato', desc: 'Publica tu primera reseña', icon: Heart, color: 'text-purple-400 border-purple-400/30 bg-purple-400/5', unlocked: reviewsDone >= 1, progress: reviewsDone, max: 1 },
      { id: 'master_reviewer', title: 'Voz Dorada', desc: 'Escribe 10 o más reseñas', icon: Zap, color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5', unlocked: reviewsDone >= 10, progress: reviewsDone, max: 10 },
      { id: 'fav_curator', title: 'Coleccionista', desc: 'Agrega 5 aplicaciones a favoritos', icon: Star, color: 'text-pink-400 border-pink-400/30 bg-pink-400/5', unlocked: favsDone >= 5, progress: favsDone, max: 5 },
    ];
  }, [reviewsDone, favsDone]);

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-16">
      <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border-nexus-border bg-gradient-to-br from-purple-900/10 to-transparent relative overflow-hidden mb-8">
         <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
         <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-yellow-500 text-nexus-bg font-black rounded-full flex items-center justify-center text-3xl shrink-0 shadow-lg shadow-yellow-500/20">
              {level}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">{titleBadge}</span>
              <h2 className="text-2xl font-black text-nexus-text">Rango de Logros</h2>
              <p className="text-xs text-nexus-text-sec mt-1 max-w-md">Estás a {nextLevelXp - xp} XP de subir al Nivel {level+1}. Sigue apoyando a creadores y descubriendo joyas.</p>
              
              <div className="w-full h-2 bg-nexus-surface rounded-full overflow-hidden mt-4 border border-nexus-border">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="glass-panel p-6 rounded-3xl border-nexus-border bg-nexus-card">
           <h3 className="font-black text-lg mb-6 text-nexus-text">Insignias de Logros</h3>
           <div className="space-y-4">
              {badges.map(b => (
                <div key={b.id} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${b.unlocked ? b.color : 'opacity-40 border-nexus-border bg-nexus-surface grayscale'}`}>
                  <div className="w-12 h-12 rounded-xl bg-nexus-bg flex items-center justify-center border border-current shrink-0">
                     <b.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <h4 className="font-bold text-nexus-text text-sm sm:text-base">{b.title}</h4>
                     <p className="text-xs text-nexus-text-sec truncate mt-0.5">{b.desc}</p>
                     
                     {b.progress !== undefined && b.max && !b.unlocked && (
                       <div className="mt-2 flex items-center gap-2">
                         <div className="flex-1 h-1 bg-nexus-surface rounded-full overflow-hidden">
                            <div className="h-full bg-current" style={{ width: `${(b.progress / b.max) * 100}%` }} />
                         </div>
                         <span className="text-[9px] font-mono font-bold leading-none">{b.progress}/{b.max}</span>
                       </div>
                     )}
                  </div>
                </div>
              ))}
           </div>
         </div>

         <div className="glass-panel p-6 rounded-3xl border-nexus-border bg-nexus-card">
            <h3 className="font-black text-lg mb-4 text-nexus-text">Próximos Desafíos</h3>
            <p className="text-xs text-nexus-text-sec mb-6">Completa estos retos temporales para recibir multiplicadores de experiencia y roles exclusivos.</p>
            
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(idx => (
                 <div key={idx} className="glass-panel p-4 rounded-3xl border-nexus-border opacity-50 grayscale flex flex-col items-center justify-center text-center">
                   <div className="w-10 h-10 bg-nexus-card rounded-full flex items-center justify-center mb-2">
                      <Star className="w-5 h-5 text-nexus-text-sec" />
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-nexus-text-sec">Bloqueado</span>
                 </div>
              ))}
            </div>
            
            <div className="mt-8 glass-panel p-6 rounded-3xl border-pink-500/20 bg-pink-500/5">
              <h3 className="font-bold text-pink-400 mb-2">Rangos Futuros</h3>
              <p className="text-xs text-nexus-text-sec leading-relaxed">A medida que obtengas XP, podrás desbloquear roles de comunidad como Moderador, Creador Elite, y Testeador Beta.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
