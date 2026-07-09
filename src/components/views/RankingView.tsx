import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Trophy, Star } from 'lucide-react';
import { AppItem } from '../../types';
import { getDownloadsNum } from '../../lib/downloads';

export function RankingView({ apps, onAppClick }: { apps: AppItem[], onAppClick?: (app: AppItem) => void }) {
  const { t } = useAppStore();
  const sortedByDownloads = useMemo(() => {
    return apps.slice().sort((a, b) => getDownloadsNum(b) - getDownloadsNum(a));
  }, [apps]);

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-16">
      <h1 className="text-3xl font-black mb-8 text-nexus-text flex items-center gap-3"><Trophy className="w-8 h-8 text-cyan-400" /> {t('ranking.title') || "Ranking de Aplicaciones"}</h1>
      
      <div className="space-y-4">
        {sortedByDownloads.map((app, idx) => (
          <div 
            key={app.id} 
            onClick={() => onAppClick?.(app)} 
            className="glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-nexus-card transition-colors border-nexus-border cursor-pointer relative"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${idx === 0 ? 'bg-yellow-500 text-nexus-bg' : idx === 1 ? 'bg-gray-400 text-nexus-bg' : idx === 2 ? 'bg-amber-600 text-nexus-bg' : 'bg-nexus-card text-nexus-text-sec'}`}>
              {idx + 1}
            </div>
            <img src={app.icon} className="w-12 h-12 rounded-[1rem] shadow-lg object-cover shrink-0" alt="" />
            <div className="flex-1 min-w-0">
               <h3 className="font-bold text-lg text-nexus-text truncate">{app.name}</h3>
               <p className="text-xs text-nexus-text-sec truncate">{app.developer}</p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-sm font-bold text-nexus-text"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/> {app.rating}</div>
              <div className="text-xs text-nexus-text-sec font-medium">{app.download_count?.toString() || app.downloads || '0'} {t('ranking.downloads') || "descargas"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
