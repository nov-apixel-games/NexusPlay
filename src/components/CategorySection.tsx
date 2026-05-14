import { BookOpen, Wrench, Music, Camera, Gamepad2, Users, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../data';

const ICON_MAP: Record<string, any> = {
  BookOpen, Wrench, Music, Camera, Gamepad2, Users
};

export default function CategorySection() {
  return (
    <section className="px-6 mb-12">
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
        <button className="text-nexus-cyan text-sm font-medium flex items-center gap-1 hover:underline">
          Ver todas <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon];
          return (
            <button 
              key={cat.id}
              className="flex-shrink-0 w-32 aspect-square glass-panel rounded-3xl p-4 flex flex-col items-center justify-center gap-3 hover:border-nexus-cyan/30 hover:scale-105 transition-all group"
            >
              <div className={`p-4 rounded-2xl ${cat.color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold tracking-tight">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
