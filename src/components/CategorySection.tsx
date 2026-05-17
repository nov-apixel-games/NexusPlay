import { BookOpen, Wrench, Music, Camera, Gamepad2, Users, ChevronRight, Briefcase, Film, Brain, Box, Monitor } from 'lucide-react';
import { CATEGORIES } from '../data';

const ICON_MAP: Record<string, any> = {
  BookOpen, Wrench, Music, Camera, Gamepad2, Users, Briefcase, Film, Brain, Box, Monitor
};

export default function CategorySection({ onCategoryClick, onSeeAll }: { onCategoryClick?: (catId: string) => void, onSeeAll?: () => void }) {
  return (
    <section className="px-4 sm:px-6 mb-12 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
            <div className="bg-nexus-cyan rounded-[1px]" />
            <div className="bg-nexus-cyan/40 rounded-[1px]" />
            <div className="bg-nexus-cyan/40 rounded-[1px]" />
            <div className="bg-nexus-cyan rounded-[1px]" />
          </div>
          Categorías
        </h2>
        <button onClick={onSeeAll} className="text-nexus-cyan text-sm font-bold flex items-center gap-1 hover:text-cyan-300 transition-colors pointer-events-auto">
          Ver todas <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory flex-nowrap">
        {CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || BookOpen;
          return (
            <button 
              key={cat.id}
              onClick={() => onCategoryClick?.(cat.name)}
              className="snap-start flex-shrink-0 w-[42vw] sm:w-[35vw] md:w-[22vw] lg:w-48 bg-nexus-card/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-4 flex flex-col items-center justify-center gap-3 hover:bg-nexus-card/80 hover:border-nexus-cyan/30 hover:scale-[1.02] active:scale-95 transition-all group shadow-lg pointer-events-auto"
            >
              <div className={`p-4 rounded-[1.5rem] ${cat.color} group-hover:scale-110 transition-transform shadow-inner`}>
                <Icon className="w-8 h-8 drop-shadow-md" />
              </div>
              <span className="text-sm font-bold tracking-wide text-gray-200 group-hover:text-white transition-colors">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

