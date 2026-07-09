import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Gamepad2 } from 'lucide-react';
import { AppCard } from '../AppGrid';
import { AppItem } from '../../types';
import { getDownloadsNum } from '../../lib/downloads';

export function GamesView({ apps, onAppClick }: { apps: AppItem[], onAppClick?: (app: AppItem) => void }) {
  const { t } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'downloads'|'rating'>('downloads');

  const filtered = useMemo(() => {
    const activeCatLower = activeCategory.toLowerCase();
    const result: AppItem[] = [];
    const len = apps.length;
    for (let i = 0; i < len; i++) {
      const a = apps[i];
      const catLower = a.category.toLowerCase();
      // Unify category check
      const isGame = catLower === 'juegos' || catLower === 'acción' || catLower === 'aventura' || catLower === 'estrategia';
      if (!isGame) continue;
      
      if (activeCategory !== 'Todos' && catLower !== activeCatLower) continue;
      
      result.push(a);
    }
    
    return result.sort((a, b) => {
      if (sortBy === 'downloads') return getDownloadsNum(b) - getDownloadsNum(a);
      return b.rating - a.rating;
    });
  }, [apps, activeCategory, sortBy]);

  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black flex items-center gap-3"><Gamepad2 className="w-8 h-8 text-cyan-400" /> {t('games.catalog') || "Catálogo de Juegos"}</h1>
        <div className="flex bg-nexus-card rounded-xl p-1 border border-nexus-border">
          <button onClick={() => setSortBy('downloads')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${sortBy==='downloads'?'bg-nexus-card-hover text-nexus-text':'text-nexus-text-sec hover:text-nexus-text'}`}>{t('games.popular') || "Populares"}</button>
          <button onClick={() => setSortBy('rating')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${sortBy==='rating'?'bg-nexus-card-hover text-nexus-text':'text-nexus-text-sec hover:text-nexus-text'}`}>{t('games.topRated') || "Mejor Valorados"}</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {['Todos', 'Acción', 'Aventura', 'Estrategia', 'RPG', 'Deportes'].map(cat => (
          <button key={cat} onClick={()=>setActiveCategory(cat)} className={`px-4 py-2 shrink-0 rounded-full text-sm font-bold border transition-colors ${activeCategory===cat ? 'bg-cyan-500 text-nexus-bg border-cyan-500' : 'bg-nexus-card text-nexus-text border-nexus-border hover:border-cyan-500/50'}`}>
            {cat === 'Todos' ? (t('games.cat.Todos') || cat) : (t(`cat.${cat}` as any) || cat)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-3 gap-y-5">
        {filtered.map(app => (
          <AppCard key={app.id} app={app} onClick={() => onAppClick?.(app)} />
        ))}
      </div>
    </div>
  );
}
