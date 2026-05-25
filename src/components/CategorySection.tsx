import { BookOpen, Wrench, Music, Camera, Gamepad2, Users, ChevronRight, Briefcase, Film, Brain, Box, Monitor, Zap } from 'lucide-react';
import { CATEGORIES } from '../data';
import { AppItem } from '../types';
import { motion } from 'motion/react';

const ICON_MAP: Record<string, any> = {
  BookOpen, Wrench, Music, Camera, Gamepad2, Users, Briefcase, Film, Brain, Box, Monitor
};

export default function CategorySection({ apps = [], onCategoryClick, onSeeAll }: { apps?: AppItem[], onCategoryClick?: (catId: string) => void, onSeeAll?: () => void }) {
  // Count apps by category
  const categoryCounts = apps.reduce((acc, app) => {
    acc[app.category] = (acc[app.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter categories that have at least 1 app, if none have apps, show 4 generic ones
  let activeCategories = CATEGORIES.filter(cat => categoryCounts[cat.name] > 0);
  if (activeCategories.length === 0) {
    activeCategories = CATEGORIES.slice(0, 4);
  }
  
  // Show up to 6 categories visually
  const displayCategories = activeCategories.slice(0, 6);

  return (
    <section className="mb-16 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8 relative">
          <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-3 text-white tracking-tight drop-shadow-md">
             <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 fill-cyan-400/20 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
             Explorar Categorías
          </h2>
          <button onClick={onSeeAll} className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-cyan-400 font-bold text-sm tracking-wide transition-all border border-cyan-500/10 hover:border-cyan-500/30 shadow-sm hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] group">
            Catálogo completo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-8 pt-2 pl-6 pr-6 snap-x snap-mandatory no-scrollbar w-full max-w-7xl mx-auto flex-nowrap">
        {displayCategories.map((cat, i) => {
          const Icon = ICON_MAP[cat.icon] || BookOpen;
          const count = categoryCounts[cat.name] || 0;
          return (
            <motion.button 
              key={cat.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5, type: 'spring', bounce: 0.4 }}
              onClick={() => onCategoryClick?.(cat.name)}
              className="snap-start shrink-0 w-[240px] sm:w-[280px] group relative overflow-hidden rounded-[28px] bg-[#0d0f1a]/80 backdrop-blur-xl border border-white/5 hover:border-cyan-500/40 transition-all duration-300 shadow-lg hover:shadow-[0_15px_30px_rgba(0,0,0,0.6)] flex flex-col items-start p-5 sm:p-6 hover:-translate-y-1.5 focus:outline-none"
            >
              {/* Background Glow / Glassmorphism effect */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none ${cat.color} blur-2xl`}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-center gap-4 mb-4 z-10 w-full relative">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] relative overflow-hidden flex items-center justify-center shrink-0 border border-white/5 shadow-inner group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-shadow`}>
                     <div className={`absolute inset-0 ${cat.color} opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
                     <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-md z-10 relative group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  {/* Tag count */}
                  <div className="ml-auto bg-[#121422] border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 group-hover:border-cyan-500/30 transition-colors shadow-sm">
                     <span className="relative flex h-2 w-2">
                       {count > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>}
                       <span className={`relative inline-flex rounded-full h-2 w-2 ${count > 0 ? 'bg-cyan-500' : 'bg-gray-600'}`}></span>
                     </span>
                     <span className="text-[12px] font-black tracking-widest text-[#a1a1aa] uppercase group-hover:text-cyan-400">{count} {count === 1 ? 'App' : 'Apps'}</span>
                  </div>
              </div>
              
              <div className="text-left z-10 w-full relative mt-2">
                <h3 className="text-lg sm:text-[22px] font-black text-gray-100 group-hover:text-white transition-colors tracking-tight drop-shadow-sm">{cat.name}</h3>
                <p className="text-[13px] text-cyan-500 mt-1 font-bold tracking-wide flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                   Explorar <ChevronRight className="w-3.5 h-3.5" />
                </p>
              </div>
              
              {/* Decorative edge line */}
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5 group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-blue-500 transition-all duration-500"></div>
            </motion.button>
          );
        })}
      </div>
      
      <div className="max-w-7xl mx-auto px-6">
        <button onClick={onSeeAll} className="w-full sm:hidden mt-4 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-cyan-400 font-black text-[13px] uppercase tracking-widest transition-all border border-cyan-500/10 active:scale-[0.98]">
            Explorar todas las categorías <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}

