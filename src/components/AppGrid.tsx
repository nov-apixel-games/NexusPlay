import React from 'react';
import { Star, Download, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { DEMO_APPS } from '../data';
import { AppItem } from '../types';

export const AppCard = React.memo(({ app }: { app: AppItem }) => {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="flex flex-col gap-3 group"
    >
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-nexus-cyan/40 transition-all duration-300">
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
          <div className="absolute top-2 right-2 bg-nexus-green text-nexus-bg text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter shadow-sm">
            Top
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 px-1">
        <h3 className="font-semibold text-sm text-white truncate leading-tight">{app.name}</h3>
        <p className="text-[11px] text-gray-500 font-medium truncate">{app.developer}</p>
      </div>

      <div className="flex items-center justify-between px-1 mt-auto">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold">
          <div className="flex items-center gap-0.5">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span>{app.rating}</span>
          </div>
        </div>
        <button className="px-3 py-1 bg-white/10 hover:bg-nexus-green text-white hover:text-nexus-bg rounded-lg font-bold text-[11px] transition-colors">
          Obtener
        </button>
      </div>
    </motion.div>
  );
});

AppCard.displayName = 'AppCard';

export default function AppGrid({ apps = DEMO_APPS }: { apps?: AppItem[] }) {
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
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory no-scrollbar w-full relative">
          {apps.map((app) => (
            <div key={app.id} className="snap-start shrink-0 w-36 sm:w-40 md:w-48">
              <AppCard app={app} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
