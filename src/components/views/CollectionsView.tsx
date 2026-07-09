import { useMemo } from 'react';
import { AppCard } from '../AppGrid';
import { AppItem } from '../../types';

export function CollectionsView({ apps, onAppClick }: { apps?: AppItem[], onAppClick?: (app: AppItem) => void }) {
  const memoizedCollections = useMemo(() => {
    const cols = [
      { title: 'Top Juegos', desc: 'Sustos y diversión garantizados', color: 'from-purple-900 to-black', filter: (a:AppItem) => a.category.toLowerCase().includes('jueg') },
      { title: 'Productividad Extrema', desc: 'Organiza tu vida entera con estas apps', color: 'from-blue-900 to-cyan-900', filter: (a:AppItem) => a.category.toLowerCase().includes('produc') || a.category.toLowerCase().includes('herr') },
    ];
    return cols.map(c => ({
       title: c.title,
       desc: c.desc,
       color: c.color,
       apps: apps?.filter(c.filter) || []
    }));
  }, [apps]);

  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto pb-16">
      <div className="space-y-16">
        {memoizedCollections.map((c, i) => {
          const filteredApps = c.apps;
          return (
            <div key={i} className="flex flex-col">
              <div className={`p-8 rounded-[2rem] bg-gradient-to-br ${c.color} border border-nexus-border shadow-2xl mb-6`}>
                 <h2 className="text-3xl font-black mb-2">{c.title}</h2>
                 <p className="text-nexus-text font-medium">{c.desc}</p>
              </div>
              {filteredApps.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-3 gap-y-5">
                   {filteredApps.map(app => (
                     <AppCard key={app.id} app={app} onClick={() => onAppClick?.(app)} />
                   ))}
                </div>
              ) : (
                <p className="text-nexus-text-sec text-sm px-4">No hay aplicaciones en esta colección todavía.</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}
