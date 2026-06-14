import React from 'react';
import { Star, Download, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { DEMO_APPS } from '../data';
import { AppItem } from '../types';
import { FavoriteButton } from './FavoriteButton';
import { useAppStore } from '../store/useAppStore';

export const AppCard = React.memo(({ app, onClick }: { app: AppItem, onClick?: () => void }) => {
  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.02 }}
      className="flex flex-col gap-3 group cursor-pointer relative"
      onClick={onClick}
    >
      <div className="absolute top-2 right-2 z-40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <FavoriteButton appId={app.id} />
      </div>
      
      <div className="relative aspect-square w-full rounded-[24px] overflow-hidden bg-nexus-card border border-nexus-border shadow-md group-hover:shadow-nexus-glow group-hover:border-cyan-500/40 transition-all duration-300">
        <img 
          src={app.icon} 
          alt={app.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(app.name) + '&background=121422&color=fff&size=200';
          }}
        />
        {/* Soft inner glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent group-hover:from-cyan-900/40 transition-colors pointer-events-none"></div>
        {/* Fallback image cover for depth */}
        <div className="absolute inset-0 shadow-inner rounded-[24px] pointer-events-none border border-nexus-border group-hover:border-nexus-border transition-colors"></div>

        {app.id === 'minecraft' && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-nexus-text text-[10px] font-black px-2 py-1 rounded-[8px] uppercase tracking-widest shadow-[0_5px_15px_rgba(249,115,22,0.4)] z-20 flex items-center gap-1">
            <TrendingUp size={10} /> TOP
          </div>
        )}
      </div>

      <div className="flex flex-col px-1">
        <h3 className="font-black text-[15px] text-nexus-text truncate leading-tight mb-1 group-hover:text-cyan-400 transition-colors drop-shadow-sm">{app.name}</h3>
        <p className="text-[12px] text-cyan-500 font-bold truncate mb-1.5 opacity-80">{app.developer}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-nexus-text-sec font-black tracking-wide">
          <div className="flex items-center gap-0.5 bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded-md border border-yellow-500/20">
             <Star className="w-3 h-3 fill-yellow-400" />
             <span>{app.rating}</span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-0.5 bg-nexus-card px-1.5 py-0.5 rounded-md">
             <Download className="w-3 h-3" />
             <span>{app.download_count?.toString() || app.downloads}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

AppCard.displayName = 'AppCard';

export const FeaturedHorizontalCard = React.memo(({ app, onClick }: { app: AppItem, onClick?: () => void }) => {
  const { t } = useAppStore();
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="flex flex-col sm:flex-row bg-nexus-card border border-nexus-border hover:border-cyan-500/40 rounded-[28px] overflow-hidden group cursor-pointer transition-all duration-300 shadow-nexus-glow w-[320px] sm:w-[480px] shrink-0"
      onClick={onClick}
    >
      {/* Banner/Screenshot Image area */}
      <div className="h-[160px] sm:h-auto sm:w-[200px] sm:shrink-0 relative overflow-hidden bg-nexus-surface">
         {app.screenshots && app.screenshots.length > 0 ? (
           <img src={app.screenshots[0]} alt="Screenshot preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60 group-hover:opacity-100" />
         ) : (
           <img src={app.icon} alt="Fallback banner" className="w-full h-full object-cover blur-xl group-hover:scale-110 transition-transform duration-700 opacity-30 group-hover:opacity-50" />
         )}
         {/* Gradient Overlay to fade into card on desktop, top to bottom on mobile */}
         <div className="hidden sm:block absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-nexus-bg to-transparent"></div>
         <div className="sm:hidden absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-nexus-bg to-transparent"></div>
         
         <div className="absolute top-3 left-3 bg-nexus-surface backdrop-blur-md px-2 py-1 rounded-lg border border-nexus-border flex items-center gap-1.5 shadow-lg">
           <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
           <span className="text-[10px] font-black text-nexus-text tracking-widest uppercase">{t("app.popular")}</span>
         </div>
         <div className="absolute top-3 right-3 z-20">
           <FavoriteButton appId={app.id} />
         </div>
      </div>

      <div className="p-5 flex-1 flex flex-col relative z-10 -mt-8 sm:mt-0">
        <div className="flex gap-4">
           {/* Floating App Icon */}
           <div className="w-16 h-16 rounded-[18px] overflow-hidden shadow-lg border-2 border-nexus-border shrink-0 bg-nexus-card">
             <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
           </div>
           
           <div className="flex-1 mt-6 sm:mt-0 min-w-0">
             <h3 className="font-black text-lg text-nexus-text truncate drop-shadow-md group-hover:text-cyan-400 transition-colors">{app.name}</h3>
             <p className="text-[12px] font-bold text-cyan-500 uppercase tracking-widest truncate opacity-90">{app.category}</p>
           </div>
        </div>

        <p className="text-[13px] text-nexus-text-sec font-medium line-clamp-2 mt-4 leading-relaxed flex-1">
          {app.description}
        </p>

        <div className="flex items-center justify-between mt-5">
           <div className="flex gap-2">
             <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-1 rounded-[8px] text-[11px] font-black">
                <Star className="w-3.5 h-3.5 fill-yellow-400" /> {app.rating}
             </div>
             <div className="flex items-center gap-1 bg-nexus-card text-nexus-text px-2 py-1 rounded-[8px] text-[11px] font-black">
                <Download className="w-3.5 h-3.5" /> {app.download_count?.toString() || app.downloads}
             </div>
           </div>
           
           <button 
             className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-[#080a14] font-black text-[12px] uppercase tracking-widest transition-all"
             onClick={(e) => { e.stopPropagation(); onClick?.(); }}
           >
             Instalar
           </button>
        </div>
      </div>
    </motion.div>
  );
});

FeaturedHorizontalCard.displayName = 'FeaturedHorizontalCard';

export default function AppGrid({ apps = DEMO_APPS, onAppClick }: { apps?: AppItem[], onAppClick?: (app: AppItem) => void }) {
  const { t } = useAppStore();
  return (
    <section className="pb-16 -mx-6 px-6 overflow-hidden">
      {apps.length === 0 ? (
        <div className="glass-panel p-10 rounded-[32px] border-nexus-border flex flex-col items-center justify-center text-center mt-6 shadow-2xl relative overflow-hidden bg-nexus-card">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.05)_0%,transparent_70%)]"></div>
          <div className="w-20 h-20 bg-nexus-card rounded-[24px] border border-nexus-border flex items-center justify-center mb-5 shadow-inner">
            <Sparkles className="w-10 h-10 text-cyan-500/50" />
          </div>
          <h3 className="text-xl font-black text-nexus-text mb-2 tracking-tight">{t("home.emptyUniverse")}</h3>
          <p className="text-nexus-text-sec text-[15px] max-w-md font-medium leading-relaxed">
            {t("home.emptyDesc")}
          </p>
        </div>
      ) : (
        <div className="flex gap-5 sm:gap-6 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory no-scrollbar w-full relative flex-nowrap pl-6 -ml-6 pr-6">
          {apps.map((app) => (
            <div key={app.id} className="snap-start shrink-0">
              <FeaturedHorizontalCard app={app} onClick={() => onAppClick?.(app)} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
