import React from 'react';
import { Star, Download, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { DEMO_APPS } from '../data';
import { AppItem } from '../types';

export const AppCard = React.memo(({ app, onClick }: { app: AppItem, onClick?: () => void }) => {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className="flex flex-col gap-2 group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-square w-full rounded-[1.25rem] overflow-hidden bg-white/5 border border-white/5 shadow-md group-hover:shadow-lg group-hover:shadow-cyan-500/20 group-hover:border-cyan-500/30 transition-all duration-300">
        <img 
          src={app.icon} 
          alt={app.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(app.name) + '&background=random&color=fff';
          }}
        />
        {app.id === 'minecraft' && (
          <div className="absolute top-2 right-2 bg-nexus-green text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm z-20">
            Top
          </div>
        )}
      </div>

      <div className="flex flex-col px-0.5">
        <h3 className="font-bold text-[13px] text-white truncate leading-tight mb-0.5">{app.name}</h3>
        <p className="text-[11px] text-gray-400 font-medium truncate mb-1">{app.developer}</p>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <span className="text-gray-300">{app.rating}</span>
          <span className="text-gray-600 mx-0.5">•</span>
          <span>{app.downloads}</span>
        </div>
      </div>
    </motion.div>
  );
});

AppCard.displayName = 'AppCard';

export default function AppGrid({ apps = DEMO_APPS, onAppClick }: { apps?: AppItem[], onAppClick?: (app: AppItem) => void }) {
  return (
    <section className="px-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          Apps Destacadas
        </h2>
        <button className="text-gray-400 text-xs font-semibold flex items-center gap-1 hover:text-white transition-colors">
          Ver todas <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="glass-panel p-10 rounded-3xl border-white/5 flex flex-col items-center justify-center text-center mt-6">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Aún no hay apps publicadas</h3>
          <p className="text-gray-400 text-sm max-w-sm">
            Sé el primero en publicar en NexusPlay. Muestra tus creaciones al mundo.
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory no-scrollbar w-full relative flex-nowrap">
          {apps.map((app) => (
            <div key={app.id} className="snap-start shrink-0 w-28 sm:w-32 md:w-40 lg:w-48">
              <AppCard app={app} onClick={() => onAppClick?.(app)} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
