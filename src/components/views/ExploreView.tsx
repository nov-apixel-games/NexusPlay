import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Compass, ShieldCheck, Layers, Heart, Users, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AppCard } from '../AppGrid';
import { AppItem } from '../../types';
import { getDownloadsNum } from '../../lib/downloads';

export function ExploreView({ apps, onAppClick, onAction }: { apps: AppItem[], onAppClick?: (app: AppItem) => void, onAction?: (action: string) => void }) {
  const { t } = useAppStore();

  const [activeTab, setActiveTab] = useState<'feed' | 'packs'>('feed');
  const [feedItems, setFeedItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchFeed = async () => {
      // Fetch recent reviews
      const { data: reviews } = await supabase.from('reviews').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false }).limit(10);
      
      let items: any[] = [];
      if (reviews) {
         items = reviews.map(r => {
            const relApp = apps.find(a => a.id === r.app_id);
            return {
               id: r.id,
               type: 'review',
               user: r.profiles?.username || r.user_name || 'Anónimo',
               avatar: r.profiles?.avatar_url || null,
               time: new Date(r.created_at).toLocaleDateString(),
               content: `${t("explore.leftReview1") || "Dejó una reseña de"} ${r.rating} ${t("explore.leftReview2") || "estrellas en"} ${relApp?.name || "una app"}: "${r.comment}"`,
               image: null,
               likes: 0
            };
         });
      }

      // Add recent apps to feed
      const recentApps = [...apps].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 5);
      const appItems = recentApps.map(a => ({
         id: a.id,
         type: 'new_app',
         user: a.developer,
         avatar: null,
         time: new Date(a.date || 0).toLocaleDateString(),
         content: `${t("explore.publishedNew") || "¡Ha publicado un nuevo juego:"} ${a.name}! ${t("explore.nowPlayable") || "Ya puedes jugarlo en el catálogo."}`,
         image: a.icon,
         likes: 0
      }));

      const combined = [...items, ...appItems].sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setFeedItems(combined);
    };
    
    fetchFeed();
  }, [apps, t]);

  const packs: any[] = [];

  const trends = useMemo(() => {
    return apps.slice().sort((a, b) => getDownloadsNum(b) - getDownloadsNum(a)).slice(0, 4);
  }, [apps]);

  return (
    <div className="pt-24 px-4 sm:px-6 max-w-7xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black flex items-center gap-3"><Compass className="w-8 h-8 text-cyan-400" /> {t('explore.discover') || "Descubrir"}</h1>
        <div className="flex bg-nexus-card rounded-xl p-1 border border-nexus-border">
          <button onClick={() => setActiveTab('feed')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab==='feed'?'bg-nexus-card-hover text-nexus-text':'text-nexus-text-sec hover:text-nexus-text'}`}>{t('explore.socialFeed') || "Feed Social"}</button>
          <button onClick={() => setActiveTab('packs')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab==='packs'?'bg-nexus-card-hover text-nexus-text':'text-nexus-text-sec hover:text-nexus-text'}`}>{t('explore.packs') || "Packs y Colecciones"}</button>
        </div>
      </div>

      {activeTab === 'feed' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {feedItems.length > 0 ? feedItems.map(item => (
              <div key={item.id} className="glass-panel p-5 sm:p-6 rounded-3xl border-nexus-border hover:border-cyan-500/30 transition-all bg-nexus-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-900 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                    {item.avatar ? <img src={item.avatar} className="w-full h-full object-cover" alt="" /> : item.user[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-nexus-text leading-tight flex items-center gap-2">
                      {item.user}
                      {item.user === 'Nexus Devs' && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
                    </h3>
                    <p className="text-xs text-nexus-text-sec">{item.time}</p>
                  </div>
                </div>
                <p className="text-nexus-text font-medium mb-4">{item.content}</p>
                {item.type === 'pack' && (
                  <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border border-nexus-border cursor-pointer hover:scale-[1.02] transition-transform">
                    <h4 className="font-black text-nexus-text text-lg flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-400"/> {item.packName}</h4>
                    <p className="text-xs text-cyan-200/70 mt-1">{t("explore.viewPackApps") || "Ver aplicaciones del pack →"}</p>
                  </div>
                )}
                {item.type === 'new_app' && apps[0] && (
                  <div className="mb-4" onClick={() => onAppClick?.(apps[0])}>
                    <AppCard app={apps[0]} onClick={() => onAppClick?.(apps[0])} />
                  </div>
                )}
                <div className="flex items-center gap-4 border-t border-nexus-border pt-4">
                  <button className="flex items-center gap-1.5 text-sm font-bold text-nexus-text-sec hover:text-red-400 transition-colors">
                    <Heart className="w-4 h-4" /> {item.likes}
                  </button>
                  <button onClick={() => onAction?.('nexus-hub')} className="flex items-center gap-1.5 text-sm font-bold text-nexus-text-sec hover:text-cyan-400 transition-colors">
                    💬 {t("explore.comment") || "Comentar"}
                  </button>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-nexus-card border border-nexus-border rounded-3xl">
                <Users className="w-12 h-12 text-nexus-text-sec mb-4" />
                <h3 className="text-xl font-bold text-nexus-text">{t("main.noPosts") || "No hay publicaciones todavía"}</h3>
                <p className="text-nexus-text-sec font-medium mt-2">{t("explore.communitySoon") || "Pronto la comunidad empezará a publicar."}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent">
              <h2 className="font-black mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400"/> {t('explore.trends') || "Tendencias del Día"}</h2>
              <div className="space-y-3">
                {trends.map((app, idx) => (
                   <div key={app.id} onClick={() => onAppClick?.(app)} className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-6 font-black text-nexus-text-sec group-hover:text-cyan-400 transition-colors">#{idx+1}</div>
                      <img src={app.icon} className="w-10 h-10 rounded-xl object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                         <p className="text-sm font-bold text-nexus-text truncate">{app.name}</p>
                         <p className="text-[10px] text-nexus-text-sec uppercase tracking-widest">{t(`cat.${app.category}`) || app.category}</p>
                      </div>
                   </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent">
              <h2 className="font-black mb-1">Nexus AI <span className="px-2 py-0.5 ml-2 bg-cyan-500 text-nexus-bg text-[9px] uppercase tracking-widest rounded-lg">{t("explore.intelligence") || "Inteligencia"}</span></h2>
              <p className="text-xs text-nexus-text-sec mb-4">{t("explore.askAiDesc") || "¿No sabes a qué jugar o qué pack descargar? Pregúntale a Nexus AI."}</p>
              <button onClick={() => onAction?.('nexus-ai')} className="w-full py-2 bg-nexus-card-hover hover:bg-cyan-500 hover:text-nexus-bg font-bold text-sm rounded-xl transition-all">{t("explore.consultAi") || "Consultar IA"}</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {packs.length > 0 ? packs.map(pack => (
             <div key={pack.id} className="glass-panel rounded-[2rem] overflow-hidden border-nexus-border shadow-2xl relative group">
                <div className="h-48 sm:h-64 relative w-full overflow-hidden">
                   <img src={pack.banner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60" alt="" />
                   <div className="absolute inset-0 bg-gradient-to-t from-nexus-bg to-transparent" />
                   <div className="absolute top-4 right-4 bg-nexus-surface backdrop-blur-md px-3 py-1.5 rounded-xl border border-nexus-border flex items-center gap-2">
                       <Heart className="w-4 h-4 text-red-500" />
                       <span className="text-xs font-bold">{pack.likes}</span>
                   </div>
                </div>
                <div className="p-6 sm:p-8 relative z-10 -mt-20">
                   <h2 className="text-3xl font-black text-nexus-text drop-shadow-md mb-2">{pack.name}</h2>
                   <p className="text-nexus-text font-medium max-w-2xl text-sm sm:text-base leading-relaxed mb-6">{pack.desc}</p>
                   
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {pack.apps.map(app => (
                        <div key={app.id} onClick={() => onAppClick?.(app)} className="bg-nexus-card border border-nexus-border rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:bg-nexus-card-hover transition-colors">
                           <img src={app.icon} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                           <div className="min-w-0">
                              <h4 className="font-bold text-sm text-nexus-text truncate">{app.name}</h4>
                              <p className="text-xs text-nexus-text-sec capitalize truncate">{t(`cat.${app.category}`) || app.category}</p>
                           </div>
                        </div>
                     ))}
                   </div>
                   
                   <div className="mt-8 flex items-center justify-between border-t border-nexus-border pt-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center font-bold text-xs">{pack.creator[0]}</div>
                        <span className="text-sm font-bold text-nexus-text">{t("explore.createdBy") || "Creado por"} {pack.creator}</span>
                      </div>
                      <button onClick={() => alert("Función de Guardar Pack en desarrollo")} className="px-6 py-2 bg-nexus-card-hover hover:bg-cyan-500 hover:text-nexus-bg font-bold rounded-xl transition-colors text-sm">
                        Compartir Pack
                      </button>
                   </div>
                </div>
             </div>
          )) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-nexus-card border border-nexus-border rounded-3xl">
              <Layers className="w-12 h-12 text-nexus-text-sec mb-4" />
              <h3 className="text-xl font-bold text-nexus-text">{t("main.noPacks") || "No hay packs todavía"}</h3>
              <p className="text-nexus-text-sec font-medium mt-2">{t("explore.collectionsSoon") || "Crea tus propias colecciones pronto."}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
