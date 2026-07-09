import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';
import { Search, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { AppItem } from '../../types';

export function SearchView({ onAppClick, onBack, initialQuery = '' }: { apps?: AppItem[], onAppClick?: (app: AppItem) => void, onBack?: () => void, initialQuery?: string }) {
  const { t } = useAppStore();
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<AppItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Memory cache to prevent repeated database requests on low-end / mid-range devices with a 5-minute (300000ms) TTL
  const searchCache = useRef<Record<string, { data: AppItem[]; timestamp: number }>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    async function searchSupabase() {
      const trimmedQuery = debouncedQuery.trim();
      if (!trimmedQuery) {
        setResults([]);
        setHasSearched(false);
        setIsLoading(false);
        return;
      }
      
      // Serve from memory cache if query was already fetched and hasn't expired (TTL of 5 minutes)
      const cached = searchCache.current[trimmedQuery];
      const now = Date.now();
      if (cached && (now - cached.timestamp < 300000)) {
        setResults(cached.data);
        setHasSearched(true);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setHasSearched(true);
      
      const searchTerm = `%${trimmedQuery}%`;

      const { data, error } = await supabase
        .from('apps')
        .select('*').limit(500)
        .eq('status', 'published')
        .or(`app_name.ilike.${searchTerm},company_name.ilike.${searchTerm},category.ilike.${searchTerm},description.ilike.${searchTerm}`);

      if (error) {
         console.error(`[Buscador NexusPlay] ERROR EXACTO de Supabase:`, error);
      } else if (data) {
         const mapped: AppItem[] = data.map(d => ({
            id: d.id,
            name: d.app_name,
            developer: d.company_name,
            developerId: d.developer_id,
            description: d.description,
            shortDescription: d.shortDescription,
            category: d.category,
            size: d.size,
            version: d.version,
            icon: d.icon_url,
            screenshots: d.screenshots,
            downloadUrl: d.download_url,
            status: d.status,
            rating: typeof d.rating === 'string' ? parseFloat(d.rating) : d.rating || 5.0,
            downloads: d.downloads,
            price: d.price,
            date: d.created_at,
            download_count: d.download_count || 0
         }));
         
         // Store in cache with current timestamp
         searchCache.current[trimmedQuery] = {
            data: mapped,
            timestamp: Date.now()
         };
         setResults(mapped);
      }
      setIsLoading(false);
    }

    searchSupabase();
  }, [debouncedQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-[100] bg-nexus-bg flex flex-col"
    >
      {/* Top Bar with Search Input */}
      <div className="flex items-center gap-3 p-4 border-b border-nexus-border bg-nexus-bg/90 backdrop-blur-xl shrink-0 pt-8 sm:pt-4">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-nexus-card-hover text-nexus-text-sec hover:text-nexus-text transition-colors"
          type="button" >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar apps y juegos" 
            className="w-full bg-transparent border-none text-nexus-text text-lg font-medium focus:outline-none focus:ring-0 placeholder-gray-500"
            autoFocus
          />
        </div>
        {query && (
           <button 
             onClick={() => { setQuery(''); setDebouncedQuery(''); setResults([]); setHasSearched(false); }} 
             className="p-2 rounded-full hover:bg-nexus-surface-hover text-nexus-text-sec hover:text-nexus-text transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
           </button>
        )}
      </div>

      {/* Main Search Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-white/[0.02] to-transparent relative">
        {isLoading && (
           <div className="absolute top-0 left-0 w-full h-[3px] overflow-hidden bg-nexus-card">
             <div className="h-full bg-cyan-500 animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '30%' }}></div>
           </div>
        )}

        <div className="max-w-3xl mx-auto p-4 pb-24">
          
          {/* Default State (No Query) */}
          {!hasSearched && query.length === 0 && (
             <div className="mt-8">
               <h3 className="text-sm font-bold text-nexus-text-sec px-2 py-4 mb-2 uppercase tracking-wider">Descubre</h3>
               <div className="flex flex-wrap gap-2 px-2">
                 {['Juegos de acción', 'Minecraft', 'Herramientas', 'Estilo de vida', 'Aventura'].map(tag => (
                   <button 
                     key={tag}
                     onClick={() => setQuery(tag)}
                     className="px-4 py-2 bg-nexus-card hover:bg-nexus-card-hover border border-nexus-border hover:border-nexus-border rounded-full text-sm font-semibold text-nexus-text transition-all"
                   >
                     {tag}
                   </button>
                 ))}
               </div>
             </div>
          )}

          {/* Results State */}
          {!isLoading && hasSearched && results.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="px-2 pb-4 text-sm font-bold text-nexus-text-sec">
                Resultados para "{debouncedQuery}"
              </div>
              {results.map(app => (
                <div 
                   key={app.id} 
                   onClick={() => onAppClick?.(app)} 
                   className="flex items-center gap-4 bg-transparent hover:bg-nexus-card rounded-2xl p-3 cursor-pointer transition-colors group"
                >
                  <img src={app.icon} className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] object-cover shadow-sm border border-nexus-border group-hover:scale-105 transition-transform" alt="" />
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-base sm:text-lg font-bold text-nexus-text leading-tight truncate mb-0.5">{app.name}</h3>
                    <p className="text-xs sm:text-sm text-nexus-text-sec truncate mb-1">
                      {app.developer}
                    </p>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1">
                          <span className="font-bold text-nexus-text text-[10px] sm:text-xs">{app.rating}</span>
                          <Star className="w-3 h-3 text-nexus-text-sec fill-gray-400 group-hover:text-yellow-500 group-hover:fill-yellow-500 transition-colors" />
                       </div>
                       <span className="text-[10px] text-nexus-text-sec px-1.5 py-0.5 rounded border border-nexus-border">{app.category}</span>
                       <span className="text-[10px] text-nexus-text-sec">{app.size}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results State */}
          {!isLoading && hasSearched && results.length === 0 && (
            <div className="text-center py-20 px-6">
              <div className="w-20 h-20 bg-nexus-card rounded-full flex items-center justify-center mx-auto mb-6">
                 <Search className="w-10 h-10 text-gray-600" />
              </div>
              <h2 className="text-xl font-bold text-nexus-text mb-2">{t("main.noResults") || "No encontramos resultados"}</h2>
              <p className="text-nexus-text-sec text-sm">{t("main.tryAnother") || "Intenta otro nombre o revisa la ortografía"}</p>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </motion.div>
  );
}
