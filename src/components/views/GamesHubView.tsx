import { useAppStore } from '../../store/useAppStore';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Gamepad2, Play, Plus, Star, Clock, Heart, MessageSquare, Zap, Sparkles, Trash2, CheckCircle2, Sliders, Globe
} from 'lucide-react';
import { lazy, Suspense } from 'react';
import PublishingWizard from '../PublishingWizard';

const GameStudioEditor = lazy(() => import('./GameStudioEditor').then(m => ({ default: m.GameStudioEditor })));
const NexusStudio = lazy(() => import('./NexusStudio/NexusStudio'));
import { 
  getOfflineGames, 
  saveOfflineGame, 
  deleteOfflineGame, 
  getGameDrafts, 
  saveGameDraft, 
  deleteGameDraft, 
  OfflineGame, 
  GameDraft 
} from '../../lib/offlineDb';

interface GamesHubViewProps {
  onBack: () => void;
  apps?: any[];
  session?: any;
  userProfile?: any;
}

export function GamesHubView({ onBack, apps = [], session, userProfile }: GamesHubViewProps) {
  const { t } = useAppStore();

  const [activeTab, setActiveTab] = useState('explore');
  const [editorTemplate, setEditorTemplate] = useState<string | null>(null);
  const [editorDraftId, setEditorDraftId] = useState<string | null>(null);
  const [publishingDraftId, setPublishingDraftId] = useState<string | null>(null);
  const [selectedGamePage, setSelectedGamePage] = useState<OfflineGame | null>(null);
  
  // Offline states
  const [favorites, setFavorites] = useState<OfflineGame[]>([]);
  const [recentGames, setRecentGames] = useState<OfflineGame[]>([]);
  const [localDrafts, setLocalDrafts] = useState<GameDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all local data from IndexedDB
  const loadLocalData = async () => {
    setIsLoading(true);
    try {
      const savedGames = await getOfflineGames();
      // En nuestra store, si tiene 'lastPlayed' se considera jugado recientemente
      const recents = savedGames.filter(g => g.lastPlayed !== undefined)
        .sort((a, b) => new Date(b.lastPlayed!).getTime() - new Date(a.lastPlayed!).getTime());
      
      const favs = savedGames.filter(g => !g.id?.startsWith('draft_')); // Los borradores se guardan por separado
      
      setRecentGames(recents);
      setFavorites(favs);

      const draftsData = await getGameDrafts();
      setLocalDrafts(draftsData);
    } catch (err) {
      console.error('[IndexedDB] Error cargando datos de Juegos offline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLocalData();
  }, [activeTab]);

  const handleToggleFavorite = async (game: OfflineGame, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = favorites.some(f => f.id === game.id);
    if (isFav) {
      await deleteOfflineGame(game.id);
      setFavorites(prev => prev.filter(f => f.id !== game.id));
    } else {
      const favGame: OfflineGame = { ...game, lastPlayed: undefined };
      await saveOfflineGame(favGame);
      setFavorites(prev => [...prev, favGame]);
    }
  };

  const handlePlayGame = async (game: OfflineGame) => {
    // Registrar juego en Recientes (IndexedDB)
    const recentGame: OfflineGame = {
      ...game,
      lastPlayed: new Date().toISOString(),
      playCount: (game.playCount || 0) + 1
    };
    await saveOfflineGame(recentGame);
    
    // Abrir plantilla correspondiente en el editor interactivo de forma directa
    let templateName = 'Platformer';
    if (game.id === 'arcade-shooter') templateName = 'Arcade Shooter';
    if (game.id === 'idle-clicker') templateName = 'Clicker / Idle';

    setEditorTemplate(templateName);
  };

  const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar este proyecto local offline?')) {
      await deleteGameDraft(id);
      setLocalDrafts(prev => prev.filter(d => d.id !== id));
    }
  };

  if (editorTemplate?.includes('3D')) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-nexus-card flex items-center justify-center text-cyan-400 font-mono text-sm animate-pulse">Iniciando Motor 3D...</div>}>
         <NexusStudio onBack={() => { setEditorTemplate(null); setEditorDraftId(null); }} />
      </Suspense>
    );
  }

  if (editorTemplate) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-nexus-card flex items-center justify-center text-cyan-400 font-mono text-sm animate-pulse">Iniciando Motor 2D...</div>}>
         <GameStudioEditor initialTemplate={editorTemplate} onBack={() => setEditorTemplate(null)} />
      </Suspense>
    );
  }

  if (publishingDraftId) {
    return (
      <PublishingWizard 
        developerId="local_user"
        onSuccess={(app) => {
          setPublishingDraftId(null);
          alert('¡Juego publicado con éxito!');
        }}
        onCancel={() => setPublishingDraftId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-nexus-card pb-24 md:pb-8 relative">
      {/* Game Page Modal / Overlay */}
      {selectedGamePage && (
        <div className="fixed inset-0 z-[9999] bg-nexus-card/80 backdrop-blur-md overflow-y-auto w-full h-full p-4 md:p-12 flex justify-center items-start">
          <div className="bg-nexus-card w-full max-w-4xl border border-nexus-border rounded-3xl shadow-2xl relative overflow-hidden mt-6">
            <button onClick={() => setSelectedGamePage(null)} className="absolute top-4 right-4 bg-nexus-card-hover p-2 rounded-full cursor-pointer hover:bg-nexus-card z-50 transition-all text-nexus-text">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="h-64 bg-cyan-900/20 relative flex items-center justify-center border-b border-nexus-border overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-nexus-bg to-transparent"></div>
               <Gamepad2 className="w-32 h-32 text-cyan-500/20" />
               <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                 <div>
                    <h1 className="text-4xl font-black text-nexus-text">{selectedGamePage.title}</h1>
                    <p className="text-lg text-cyan-400 mt-1">Por {selectedGamePage.developer}</p>
                 </div>
                 <button onClick={() => handlePlayGame(selectedGamePage)} className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-nexus-bg font-black uppercase text-sm rounded-xl cursor-pointer flex items-center gap-2">
                    <Play className="w-5 h-5 fill-black" />{t('games.play')}</button>
               </div>
            </div>
            
            <div className="p-8">
               <div className="flex flex-wrap gap-4 mb-8">
                 <div className="bg-nexus-card px-4 py-2 rounded-xl text-sm font-bold text-nexus-text">{t("gameshub.activeMulti") || "👥 Multijugador Activo"}</div>
                 <div className="bg-nexus-card px-4 py-2 rounded-xl text-sm font-bold text-nexus-text">⭐ {selectedGamePage.rating} {t("gameshub.outOf5") || "de 5"}</div>
                 <div className="bg-nexus-card px-4 py-2 rounded-xl text-sm font-bold text-nexus-text">🎮 {selectedGamePage.playCount} {t("gameshub.sessions") || "Sesiones"}</div>
                 <div className="bg-nexus-card px-4 py-2 rounded-xl text-sm font-bold text-nexus-text">{t("gameshub.recentAct") || "📅 Act. Reciente"}</div>
               </div>
               <h3 className="text-xl font-bold text-nexus-text mb-2">{t("games.about") || "Acerca del juego"}</h3>
               <p className="text-nexus-text-sec leading-relaxed mb-8">{selectedGamePage.description}</p>
               
               <h3 className="text-xl font-bold text-nexus-text mb-4">{t('nav.sidebar.community')}</h3>
               <div className="space-y-4">
                 <div className="bg-nexus-card p-4 rounded-xl border border-nexus-border">
                   <p className="text-sm text-nexus-text mb-1"><span className="font-bold text-nexus-text">PlayerOne</span> - "Excelente gameplay y la optimización corre perfecto en Android!"</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Header */}
      <div className="bg-nexus-card border-b border-nexus-border sticky top-0 z-50 pt-8 sm:pt-10 pb-4 px-4 sm:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 sm:p-3 bg-nexus-card hover:bg-nexus-card-hover rounded-xl text-nexus-text-sec hover:text-nexus-text transition-all group mr-2 cursor-pointer">
                 <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-shrink-0 items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-nexus-text tracking-tight">Games Hub</h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${navigator.onLine ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${navigator.onLine ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                    {navigator.onLine ? (t('gameshub.online') || 'ONLINE') : (t('gameshub.offline') || 'OFFLINE')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-nexus-text-sec font-mono mt-1">
                  <span>{t("gameshub.cacheSize") || "Tamaño Caché: ~3.7 MB"}</span>
                  <span>•</span>
                  <span>{t("gameshub.synced") || "Sincronizado: Hoy, "}{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTab('create')}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-nexus-text px-5 py-2.5 rounded-xl font-bold shadow-nexus-glow transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-5 h-5" /> {t('games.createHtml5') || "Crear Juego HTML5"}
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
            {[
              { id: 'explore', label: t('games.games') || 'Juegos' },
              { id: 'marketplace', label: t('gameshub.marketplace') || 'Marketplace' },
              { id: 'drafts', label: t('gameshub.proProjects') || 'Proyectos Pro' },
              { id: 'social', label: t('games.community') || 'Comunidad' },
              { id: 'offline', label: t('games.locals') || 'Locales' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-white text-nexus-bg shadow-lg' 
                    : 'bg-nexus-card text-nexus-text-sec hover:bg-nexus-card-hover hover:text-nexus-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        {activeTab !== 'create' ? (
          <div className="space-y-12">
            
            {/* Offline Support Banner */}
            {activeTab === 'explore' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-12 bg-emerald-500/10 blur-[50px] rounded-full"></div>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <Zap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-nexus-text font-bold text-lg">{t('games.offlineSupport') || "Soporte Offline Integrado"}</h3>
                    <p className="text-nexus-text-sec text-sm">{t("gameshub.offlineDesc") || "Los juegos del catálogo arcade se guardan de forma local en IndexedDB y funcionan al 100% sin internet."}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* EXPLORAR TAB */}
            {activeTab === 'explore' && (
              <section>
                <h2 className="text-xl font-bold text-nexus-text flex items-center gap-2 mb-6">
                   <Star className="w-5 h-5 text-yellow-400" /> {t('games.communityFeatured') || "Destacados de la Comunidad"}
                </h2>
                {apps.length === 0 ? (
                  <div className="w-full bg-nexus-card rounded-3xl border border-cyan-500/20 p-12 flex flex-col items-center justify-center text-center shadow-nexus-glow relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full"></div>
                    
                    <div className="w-20 h-20 bg-nexus-card border-2 border-cyan-500/30 rounded-2xl flex items-center justify-center mb-6 relative group-hover:border-cyan-400 group-hover:shadow-nexus-glow transition-all">
                       <Gamepad2 className="w-10 h-10 text-cyan-400" />
                       <Sparkles className="w-5 h-5 text-fuchsia-400 absolute -top-2 -right-2 animate-bounce" />
                    </div>
                    
                    <h3 className="text-2xl font-black text-nexus-text font-mono tracking-tight mb-2">{t("games.noGamesPublished") || "Todavía no hay juegos publicados"}</h3>
                    <p className="text-cyan-200/60 max-w-sm mx-auto mb-8 text-sm">{t("gameshub.nexusWait") || "El universo Nexus está esperando. ¡Crea el próximo gran éxito y compártelo con miles de jugadores!"}</p>
                    
                    <button onClick={() => setActiveTab('create')} className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-nexus-bg font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-nexus-glow flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      {t("gameshub.beFirst") || "Sé el primero en publicar"}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {apps.map((game) => {
                      // Usar favorite states. A future update can use actual user favorites.
                      const isFav = favorites.some(f => f.id === game.id);
                      return (
                        <div key={game.id} onClick={() => setSelectedGamePage(game as any)} className="bg-nexus-card rounded-[24px] overflow-hidden border border-nexus-border group hover:border-cyan-500/30 transition-all hover:shadow-lg cursor-pointer">
                          <div className="aspect-video bg-nexus-card relative overflow-hidden flex items-center justify-center">
                            {game.banner_url ? (
                               <img src={game.banner_url} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                               <Gamepad2 className="w-12 h-12 text-nexus-text/10 group-hover:scale-110 transition-transform duration-500" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-nexus-bg to-transparent opacity-80"></div>
                            <div className="absolute top-3 left-3 bg-nexus-surface backdrop-blur-md border border-nexus-border px-3 py-1 rounded-full flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                              <span className="text-[10px] font-black text-nexus-text uppercase tracking-wider">{t("gameshub.offlineReady") || "OFFLINE READY"}</span>
                            </div>
                          </div>
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <h3 className="text-lg font-black text-nexus-text group-hover:text-cyan-400 transition-colors truncate max-w-[200px] sm:max-w-xs">{game.title}</h3>
                                <p className="text-nexus-text-sec text-xs mt-1">Por {game.developer} • {game.category}</p>
                              </div>
                              <div className="bg-yellow-500/10 text-yellow-500 px-2 py-1.5 rounded-xl flex items-center gap-1 font-bold text-xs shrink-0 h-8">
                                 <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> {game.rating || '0.0'}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <button onClick={(e) => { e.stopPropagation(); handlePlayGame(game as any); }} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-nexus-bg font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer">
                                 <Play className="w-5 h-5" />{t('games.play')}</button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleToggleFavorite(game as any, e); }} 
                                 className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                                   isFav ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-nexus-card text-nexus-text-sec hover:bg-nexus-card-hover hover:text-nexus-text'
                                 }`}
                               >
                                 <Heart className={`w-5 h-5 ${isFav ? 'fill-red-500' : ''}`} />
                               </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* OFFLINE READY / RECIENTES TAB */}
            {activeTab === 'offline' && (
              <section>
                <div className="text-center sm:text-left mb-6">
                  <h2 className="text-xl font-bold text-nexus-text flex items-center justify-center sm:justify-start gap-2">
                     <Clock className="w-5 h-5 text-emerald-400" /> {t("gameshub.playedRecently") || "Jugados Recientemente Offline"}
                  </h2>
                  <p className="text-nexus-text-sec text-sm mt-1">{t("gameshub.playedRecentlyDesc") || "Juegos que has lanzado y que están listones para ejecutarse con o sin red."}</p>
                </div>
                {recentGames.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentGames.map((game) => (
                      <div key={game.id} className="bg-nexus-card rounded-[24px] overflow-hidden border border-emerald-500/10 p-5 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-4">
                            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-xl text-[10px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> LISTO OFFLINE
                            </div>
                            {game.lastPlayed && (
                              <span className="text-[10px] text-nexus-text-sec font-mono">{t("gameshub.lastTime") || "Última vez: "}{new Date(game.lastPlayed).toLocaleDateString()}</span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-nexus-text mb-1">{game.title}</h3>
                          <p className="text-nexus-text-sec text-xs mb-4">Por {game.developer} • {game.category}</p>
                        </div>
                        <button onClick={() => handlePlayGame(game)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-nexus-bg font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer">
                          <Play className="w-4 h-4 fill-black" />{t('games.play_offline')}</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-nexus-card rounded-2xl p-10 text-center border border-nexus-border">
                    <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-nexus-text-sec font-bold">{t("gameshub.noGamesPlayed") || "¡No has jugado a ningún juego todavía!"}</p>
                    <p className="text-nexus-text-sec text-xs mt-1">{t("gameshub.noGamesPlayedDesc") || "Los juegos que abras en el modo de exploración se guardarán automáticamente aquí."}</p>
                  </div>
                )}
              </section>
            )}

            {/* MARKETPLACE TAB */}
            {activeTab === 'marketplace' && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-nexus-text flex items-center gap-2">
                     <Zap className="w-5 h-5 text-yellow-400" /> {t("gameshub.creatorsMarket") || "Marketplace de Creadores"}
                  </h2>
                  <button className="px-4 py-2 bg-nexus-card border border-nexus-border rounded-xl text-xs font-bold hover:bg-nexus-card-hover text-nexus-text cursor-pointer">
                    Subir Asset
                  </button>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                  {[(t('gameshub.all')||'Todos'), (t('gameshub.models3d')||'Modelos 3D'), (t('gameshub.textures')||'Texturas'), (t('gameshub.logicScripts')||'Scripts Lógicos'), (t('gameshub.terrains')||'Terrenos'), (t('gameshub.sounds')||'Sonidos')].map((cat, i) => (
                    <button key={i} className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 ${i === 0 ? 'bg-cyan-500 text-nexus-bg' : 'bg-nexus-card text-nexus-text-sec border border-nexus-border'}`}>{cat}</button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                   {[
                     { name: "Pack Sci-Fi Neon", type: "Modelos 3D", price: "Gratis", author: "ZeroDev" },
                     { name: "Sistema IA Enemigos", type: "Scripts Lógicos", price: "Gratis", author: "NexusTeam" },
                     { name: "Texturas PBR HQ", type: "Texturas", price: "Premium", author: "Artisan3D" },
                     { name: "Ciudad Cyberpunk", type: "Terrestial/Mapas", price: "Premium", author: "NeonNight" }
                   ].map((asset, i) => (
                     <div key={i} className="bg-nexus-card rounded-2xl overflow-hidden border border-nexus-border group hover:border-cyan-500/30">
                        <div className="h-32 bg-nexus-card border-b border-nexus-border relative flex justify-center items-center">
                          <Sliders className="w-8 h-8 text-nexus-text/10 group-hover:scale-110 transition-transform" />
                          {asset.price === "Premium" && <div className="absolute top-2 right-2 bg-yellow-500 text-nexus-bg text-[9px] font-black px-2 py-0.5 rounded-md">PREMIUM</div>}
                        </div>
                        <div className="p-3">
                           <h4 className="text-sm font-bold text-nexus-text mb-1">{asset.name}</h4>
                           <p className="text-[10px] text-nexus-text-sec mb-3">{asset.type} • Por {asset.author}</p>
                           <button className="w-full py-1.5 rounded-lg bg-nexus-card hover:bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-nexus-border transition-all cursor-pointer">{t("games.addToProjects") || "Añadir a Proyectos"}</button>
                        </div>
                     </div>
                   ))}
                </div>
              </section>
            )}

            {/* SOCIAL TAB */}
            {activeTab === 'social' && (
              <section className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-nexus-card border border-nexus-border rounded-3xl p-6">
                   <h3 className="text-lg font-bold text-nexus-text mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-fuchsia-400" /> {t("gameshub.recentActivity") || "Actividad Reciente"}</h3>
                   <div className="space-y-4">
                     {[
                       { u: "PixelMaster", m: "acaba de publicar 'Neon Racer X' - ¡Pruébalo!", t: "hace 5 min" },
                       { u: "DevNull", m: "consiguió un nuevo récord en 'Platformer 3D'.", t: "hace 12 min" },
                       { u: "SaraCreativa", m: "subió un nuevo pack de texturas al Marketplace.", t: "hace 1 hora" }
                     ].map((feed, i) => (
                       <div key={i} className="flex gap-3 bg-nexus-card p-3 rounded-2xl border border-nexus-border">
                         <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-fuchsia-500 to-cyan-500 shrink-0"></div>
                         <div>
                           <p className="text-sm text-nexus-text"><span className="font-bold text-nexus-text">{feed.u}</span> {feed.m}</p>
                           <p className="text-[10px] text-nexus-text-sec mt-0.5">{feed.t}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
                <div className="w-full md:w-72 space-y-6">
                   <div className="bg-nexus-card border border-nexus-border rounded-3xl p-6">
                     <h3 className="text-nexus-text font-bold mb-4">{t("games.topCreators") || "Mejores Creadores"}</h3>
                     <div className="space-y-3">
                       {["ZeroDev", "NexusTeam", "Artisan3D"].map((n, i) => (
                         <div key={i} className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-nexus-card-hover"></div>
                             <span className="text-sm font-bold text-nexus-text-sec">{n}</span>
                           </div>
                           <button className="text-[9px] px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 font-bold uppercase">{t("games.follow") || "Seguir"}</button>
                         </div>
                       ))}
                     </div>
                   </div>
                </div>
              </section>
            )}

            {/* PROYECTOS LOCALES TAB */}
            {activeTab === 'drafts' && (
              <section>
                <div className="text-center sm:text-left mb-6">
                  <h2 className="text-xl font-bold text-nexus-text flex items-center justify-center sm:justify-start gap-2">
                     <Plus className="w-5 h-5 text-cyan-400" /> {t("gameshub.localProjects") || "Proyectos Locales en Desarrollo"}
                  </h2>
                  <p className="text-nexus-text-sec text-sm mt-1">{t("gameshub.localProjectsDesc") || "Tus creaciones de minijuegos autoguardadas de forma segura de modo local (IndexedDB)."}</p>
                </div>
                {localDrafts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {localDrafts.map((draft) => (
                      <div key={draft.id} className="bg-nexus-card rounded-[24px] border border-nexus-border p-6 flex flex-col justify-between hover:border-cyan-500/20 transition-all group">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-lg text-[10px] font-bold">{t("gameshub.offlineDraft") || "Offline Draft"}</span>
                            <button 
                              onClick={(e) => handleDeleteDraft(draft.id, e)}
                              className="text-nexus-text-sec hover:text-red-400 p-1.5 hover:bg-nexus-card rounded-lg transition-colors cursor-pointer"
                              title="Eliminar proyecto"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                          <h3 className="text-lg font-black text-nexus-text group-hover:text-cyan-400 transition-colors mb-2">{draft.title}</h3>
                          <p className="text-nexus-text-sec text-xs font-mono mb-4">{t("gameshub.modules") || "Módulos: "}{draft.objects?.length || 0} • {new Date(draft.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <button 
                            onClick={() => {
                              setEditorDraftId(draft.id);
                              const baseTemplate = draft.title.replace(' offline game', '');
                              setEditorTemplate(baseTemplate);
                            }}
                            className="w-full bg-nexus-card hover:bg-nexus-card text-nexus-text font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer text-xs"
                          >
                            <Play className="w-4 h-4" /> {t("gameshub.edit") || "Editar"}
                          </button>
                          <button 
                            onClick={() => {
                              setPublishingDraftId(draft.id);
                            }}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-nexus-bg font-extrabold py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer text-xs"
                          >
                            <Globe className="w-4 h-4" /> {t("gameshub.publish") || "Publicar"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-nexus-card rounded-2xl p-10 text-center border border-nexus-border">
                    <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-nexus-text-sec font-bold">{t("games.noDrafts") || "No tienes borradores todavía"}</p>
                    <p className="text-nexus-text-sec text-xs mt-1">{t("gameshub.noDraftsDesc") || "Crea un nuevo juego haciendo clic en el botón superior, los cambios se autoguardarán."}</p>
                  </div>
                )}
              </section>
            )}
            
          </div>
        ) : (
          <motion.div 
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-nexus-card rounded-[32px] border border-nexus-border p-8 max-w-4xl mx-auto"
          >
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto flex items-center justify-center mb-6 shadow-nexus-glow">
                <Plus className="w-10 h-10 text-nexus-text" />
              </div>
              <h2 className="text-3xl font-black text-nexus-text mb-4">{t("gameshub.gamesStudio") || "Games Studio (Beta)"}</h2>
              <p className="text-nexus-text-sec max-w-lg mx-auto">{t("gameshub.studioDesc") || "Crea minijuegos HTML5 instantáneos, arcade puzzles o plataformas de forma táctil e intuitiva, 100% desde Android, sin necesidad de conexión."}</p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <div className="flex items-center gap-1.5 bg-nexus-card border border-emerald-500/30 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">{t("gameshub.offlineSave") || "Guardado Offline"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-nexus-card border border-blue-500/30 px-3 py-1.5 rounded-full">
                  <Zap className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase">{t("gameshub.indexedDb") || "IndexedDB Activo"}</span>
                </div>
              </div>
            <div className="grid grid-cols-1 gap-4">
               {[
                 { title: t('gameshub.create3d') || 'Crear desde cero 3D', icon: Sliders, color: 'text-cyan-400', bg: 'bg-cyan-500/10', desc: t('gameshub.create3dDesc') || 'Comienza con un lienzo limpio y herramientas 3D completas: biomas, físicas, scripts e importaciones.' },
               ].map((t, i) => (
                 <button 
                    key={i} 
                    onClick={async () => {
                      // Registrar un nuevo borrador en IndexedDB
                      const newDraft: GameDraft = {
                        id: `draft_${Date.now()}`,
                        title: `${t.title} offline game`,
                        objects: [],
                        updatedAt: new Date().toISOString()
                      };
                      await saveGameDraft(newDraft); setEditorDraftId(newDraft.id);
                      setEditorTemplate(t.title);
                    }} 
                    className="p-6 rounded-2xl bg-nexus-card border border-nexus-border hover:border-cyan-500/30 text-left transition-all hover:bg-nexus-card group cursor-pointer"
                 >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${t.bg} mb-4`}>
                      <t.icon className={`w-6 h-6 ${t.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-nexus-text group-hover:text-cyan-400 transition-colors uppercase font-mono">{t.title}</h3>
                    <p className="text-xs text-nexus-text-sec mt-2 font-medium leading-relaxed">{t.desc}</p>
                 </button>
               ))}
            </div>
            
            <div className="mt-8 p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl text-center shadow-nexus-glow">
              <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-3 animate-pulse" />
              <p className="text-cyan-100 font-bold tracking-wide font-mono text-sm max-w-md mx-auto">{t("gameshub.soon") || "Muy pronto llegarán plantillas avanzadas totalmente funcionales para Games Studio."}</p>
            </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
