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
    activeCategories = CATEGORIES.slice(0, 8);
  }
  
  // Show up to 10 categories visually in the grid
  const displayCategories = activeCategories.slice(0, 10);

  return (
    <section className="mb-12 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6 relative">
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2 text-white tracking-tight drop-shadow-md">
             <Zap className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]" />
             Explorar Categorías
          </h2>
          <button onClick={onSeeAll} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 font-bold text-xs tracking-wide transition-all border border-cyan-500/10 hover:border-cyan-500/30 shadow-sm hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] group">
             Ver Catálogo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 w-full">
          {displayCategories.map((cat, i) => {
            const Icon = ICON_MAP[cat.icon] || BookOpen;
            return (
              <motion.button 
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.5), duration: 0.4 }}
                onClick={() => onCategoryClick?.(cat.name)}
                className="group relative flex items-center gap-3 p-3 sm:p-4 rounded-[1.25rem] bg-[#0a0c14]/80 backdrop-blur-md border border-white/5 hover:border-cyan-500/40 hover:bg-white/5 transition-all duration-300 shadow-sm hover:shadow-[0_8px_20px_rgba(34,211,238,0.15)] text-left"
              >
                {/* Background Glow / Glassmorphism effect */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none ${cat.color} blur-xl rounded-[1.25rem]`}></div>
                
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl relative overflow-hidden flex items-center justify-center shrink-0 border border-white/5 shadow-inner transition-transform duration-300 group-hover:scale-110`}>
                   <div className={`absolute inset-0 ${cat.color} opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
                   <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md z-10 relative" />
                </div>
                
                <div className="flex-1 min-w-0 z-10 relative">
                  <h3 className="text-sm sm:text-base font-bold text-gray-200 group-hover:text-white transition-colors tracking-tight truncate">{cat.name}</h3>
                </div>
              </motion.button>
            );
          })}
        </div>
        
        <button onClick={onSeeAll} className="w-full sm:hidden mt-6 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 font-black text-xs uppercase tracking-widest transition-all border border-cyan-500/10 active:scale-[0.98]">
            Ver todas las áreas <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}

