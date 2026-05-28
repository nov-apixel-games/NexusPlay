import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, Play, Plus, Star, Trophy, Clock, Search, Heart, 
  Share2, MessageSquare, ExternalLink, Zap, Crosshair, Sparkles, Trash2, CheckCircle2,
  Compass, Sliders, Globe
} from 'lucide-react';
import { GameStudioEditor } from './GameStudioEditor';
import { GameStudioEditor3D } from './GameStudioEditor3D';
import PublishingWizard from '../PublishingWizard';
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
}

const COMMUNITY_GAMES: OfflineGame[] = [
  {
    id: "pub_1",
    title: "Neon Cyber Racer",
    developer: "ZeroDev",
    category: "Racing 3D",
    rating: 4.9,
    description: "Carreras futuristas con multijugador asíncrono y leaderboards mundiales.",
    playCount: 15420
  },
  {
    id: "pub_2",
    title: "Zombie Last Stand Outpost",
    developer: "NexusTeam",
    category: "Zombie Survival 3D",
    rating: 4.8,
    description: "Defiende tu base el mayor tiempo posible con mecánicas de supervivencia y looteo avanzado.",
    playCount: 8900
  },
  {
    id: "pub_3",
    title: "Skyborne Platformer HD",
    developer: "Artisan3D",
    category: "Platformer 3D",
    rating: 4.6,
    description: "Un mundo vibrante PBR con físicas precisas y checkpoints en nubes.",
    playCount: 4200
  }
];

export function GamesHubView({ onBack }: GamesHubViewProps) {
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
      
      const favs = savedGames.filter(g => !g.id.startsWith('draft_')); // Los borradores se guardan por separado
      
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
    return <GameStudioEditor3D initialTemplate={editorTemplate} draftId={editorDraftId} onBack={() => { setEditorTemplate(null); setEditorDraftId(null); }} />;
  }

  if (editorTemplate) {
    return <GameStudioEditor initialTemplate={editorTemplate} onBack={() => setEditorTemplate(null)} />;
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
    <div className="min-h-screen bg-[#0a0c10] pb-24 md:pb-8 relative">
      {/* Game Page Modal / Overlay */}
      {selectedGamePage && (
        <div className="fixed inset-0 z-[9999] bg-[#0a0c10]/95 backdrop-blur-md overflow-y-auto w-full h-full p-4 md:p-12 flex justify-center items-start">
          <div className="bg-[#12141c] w-full max-w-4xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden mt-6">
            <button onClick={() => setSelectedGamePage(null)} className="absolute top-4 right-4 bg-white/10 p-2 rounded-full cursor-pointer hover:bg-white/20 z-50 transition-all text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="h-64 bg-cyan-900/20 relative flex items-center justify-center border-b border-white/5 overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-[#12141c] to-transparent"></div>
               <Gamepad2 className="w-32 h-32 text-cyan-500/20" />
               <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                 <div>
                    <h1 className="text-4xl font-black text-white">{selectedGamePage.title}</h1>
                    <p className="text-lg text-cyan-400 mt-1">Por {selectedGamePage.developer}</p>
                 </div>
                 <button onClick={() => handlePlayGame(selectedGamePage)} className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-sm rounded-xl cursor-pointer flex items-center gap-2">
                    <Play className="w-5 h-5 fill-black" /> Jugar
                 </button>
               </div>
            </div>
            
            <div className="p-8">
               <div className="flex flex-wrap gap-4 mb-8">
                 <div className="bg-white/5 px-4 py-2 rounded-xl text-sm font-bold text-gray-300">👥 Multijugador Activo</div>
                 <div className="bg-white/5 px-4 py-2 rounded-xl text-sm font-bold text-gray-300">⭐ {selectedGamePage.rating} de 5</div>
                 <div className="bg-white/5 px-4 py-2 rounded-xl text-sm font-bold text-gray-300">🎮 {selectedGamePage.playCount} Sesiones</div>
                 <div className="bg-white/5 px-4 py-2 rounded-xl text-sm font-bold text-gray-300">📅 Act. Reciente</div>
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Acerca del juego</h3>
               <p className="text-gray-400 leading-relaxed mb-8">{selectedGamePage.description}</p>
               
               <h3 className="text-xl font-bold text-white mb-4">Comunidad</h3>
               <div className="space-y-4">
                 <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                   <p className="text-sm text-gray-300 mb-1"><span className="font-bold text-white">PlayerOne</span> - "Excelente gameplay y la optimización corre perfecto en Android!"</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Header */}
      <div className="bg-[#12141c] border-b border-white/5 sticky top-0 z-50 pt-8 sm:pt-10 pb-4 px-4 sm:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all group mr-2 cursor-pointer">
                 <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-shrink-0 items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-white tracking-tight">Games Hub</h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${navigator.onLine ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${navigator.onLine ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                    {navigator.onLine ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-mono mt-1">
                  <span>Tamaño Caché: ~3.7 MB</span>
                  <span>•</span>
                  <span>Sincronizado: Hoy, {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTab('create')}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-5 py-2.5 rounded-xl font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-5 h-5" /> Crear Juego HTML5
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
            {[
              { id: 'explore', label: 'Juegos' },
              { id: 'marketplace', label: 'Marketplace' },
              { id: 'drafts', label: 'Proyectos Pro' },
              { id: 'social', label: 'Comunidad' },
              { id: 'offline', label: 'Locales' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
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
                    <h3 className="text-white font-bold text-lg">Soporte Offline Integrado</h3>
                    <p className="text-gray-400 text-sm">Los juegos del catálogo arcade se guardan de forma local en IndexedDB y funcionan al 100% sin internet.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* EXPLORAR TAB */}
            {activeTab === 'explore' && (
              <section>
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                   <Star className="w-5 h-5 text-yellow-400" /> Destacados de la Comunidad
                </h2>
                {COMMUNITY_GAMES.length === 0 ? (
                  <div className="w-full bg-[#0d1017] rounded-3xl border border-cyan-500/20 p-12 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full"></div>
                    
                    <div className="w-20 h-20 bg-[#121620] border-2 border-cyan-500/30 rounded-2xl flex items-center justify-center mb-6 relative group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all">
                       <Gamepad2 className="w-10 h-10 text-cyan-400" />
                       <Sparkles className="w-5 h-5 text-fuchsia-400 absolute -top-2 -right-2 animate-bounce" />
                    </div>
                    
                    <h3 className="text-2xl font-black text-white font-mono tracking-tight mb-2">Todavía no hay juegos publicados</h3>
                    <p className="text-cyan-200/60 max-w-sm mx-auto mb-8 text-sm">El universo Nexus está esperando. ¡Crea el próximo gran éxito y compártelo con miles de jugadores!</p>
                    
                    <button onClick={() => setActiveTab('create')} className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Sé el primero en publicar
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {COMMUNITY_GAMES.map((game) => {
                      const isFav = favorites.some(f => f.id === game.id);
                      return (
                        <div key={game.id} onClick={() => setSelectedGamePage(game)} className="bg-[#12141c] rounded-[24px] overflow-hidden border border-white/5 group hover:border-cyan-500/30 transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer">
                          <div className="aspect-video bg-[#1a1c24] relative overflow-hidden flex items-center justify-center">
                            <Gamepad2 className="w-12 h-12 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#12141c] to-transparent opacity-80"></div>
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                              <span className="text-[10px] font-black text-white uppercase tracking-wider">OFFLINE READY</span>
                            </div>
                          </div>
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors truncate max-w-[200px] sm:max-w-xs">{game.title}</h3>
                                <p className="text-gray-400 text-xs mt-1">Por {game.developer} • {game.category}</p>
                              </div>
                              <div className="bg-yellow-500/10 text-yellow-500 px-2 py-1.5 rounded-xl flex items-center gap-1 font-bold text-xs shrink-0 h-8">
                                 <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> {game.rating}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <button onClick={(e) => { e.stopPropagation(); handlePlayGame(game); }} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer">
                                 <Play className="w-5 h-5" /> Jugar Ahora
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleToggleFavorite(game, e); }} 
                                 className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                                   isFav ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
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
                  <h2 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                     <Clock className="w-5 h-5 text-emerald-400" /> Jugados Recientemente Offline
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Juegos que has lanzado y que están listones para ejecutarse con o sin red.</p>
                </div>
                {recentGames.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentGames.map((game) => (
                      <div key={game.id} className="bg-[#12141c] rounded-[24px] overflow-hidden border border-emerald-500/10 p-5 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-4">
                            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-xl text-[10px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> LISTO OFFLINE
                            </div>
                            {game.lastPlayed && (
                              <span className="text-[10px] text-gray-500 font-mono">Última vez: {new Date(game.lastPlayed).toLocaleDateString()}</span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-white mb-1">{game.title}</h3>
                          <p className="text-gray-400 text-xs mb-4">Por {game.developer} • {game.category}</p>
                        </div>
                        <button onClick={() => handlePlayGame(game)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer">
                          <Play className="w-4 h-4 fill-black" /> Jugar sin Red
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#12141c] rounded-2xl p-10 text-center border border-white/5">
                    <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">¡No has jugado a ningún juego todavía!</p>
                    <p className="text-gray-500 text-xs mt-1">Los juegos que abras en el modo de exploración se guardarán automáticamente aquí.</p>
                  </div>
                )}
              </section>
            )}

            {/* MARKETPLACE TAB */}
            {activeTab === 'marketplace' && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <Zap className="w-5 h-5 text-yellow-400" /> Marketplace de Creadores
                  </h2>
                  <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 text-white cursor-pointer">
                    Subir Asset
                  </button>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                  {['Todos', 'Modelos 3D', 'Texturas', 'Scripts Lógicos', 'Terrenos', 'Sonidos'].map((cat, i) => (
                    <button key={i} className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 ${i === 0 ? 'bg-cyan-500 text-black' : 'bg-[#12141c] text-slate-400 border border-white/5'}`}>{cat}</button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                   {[
                     { name: "Pack Sci-Fi Neon", type: "Modelos 3D", price: "Gratis", author: "ZeroDev" },
                     { name: "Sistema IA Enemigos", type: "Scripts Lógicos", price: "Gratis", author: "NexusTeam" },
                     { name: "Texturas PBR HQ", type: "Texturas", price: "Premium", author: "Artisan3D" },
                     { name: "Ciudad Cyberpunk", type: "Terrestial/Mapas", price: "Premium", author: "NeonNight" }
                   ].map((asset, i) => (
                     <div key={i} className="bg-[#12141c] rounded-2xl overflow-hidden border border-white/5 group hover:border-cyan-500/30">
                        <div className="h-32 bg-[#1a1c24] border-b border-white/5 relative flex justify-center items-center">
                          <Sliders className="w-8 h-8 text-white/10 group-hover:scale-110 transition-transform" />
                          {asset.price === "Premium" && <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded-md">PREMIUM</div>}
                        </div>
                        <div className="p-3">
                           <h4 className="text-sm font-bold text-white mb-1">{asset.name}</h4>
                           <p className="text-[10px] text-gray-500 mb-3">{asset.type} • Por {asset.author}</p>
                           <button className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-white/5 transition-all cursor-pointer">Añadir a Proyectos</button>
                        </div>
                     </div>
                   ))}
                </div>
              </section>
            )}

            {/* SOCIAL TAB */}
            {activeTab === 'social' && (
              <section className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-[#12141c] border border-white/5 rounded-3xl p-6">
                   <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-fuchsia-400" /> Actividad Reciente</h3>
                   <div className="space-y-4">
                     {[
                       { u: "PixelMaster", m: "acaba de publicar 'Neon Racer X' - ¡Pruébalo!", t: "hace 5 min" },
                       { u: "DevNull", m: "consiguió un nuevo récord en 'Platformer 3D'.", t: "hace 12 min" },
                       { u: "SaraCreativa", m: "subió un nuevo pack de texturas al Marketplace.", t: "hace 1 hora" }
                     ].map((feed, i) => (
                       <div key={i} className="flex gap-3 bg-[#1a1c24] p-3 rounded-2xl border border-white/5">
                         <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-fuchsia-500 to-cyan-500 shrink-0"></div>
                         <div>
                           <p className="text-sm text-gray-300"><span className="font-bold text-white">{feed.u}</span> {feed.m}</p>
                           <p className="text-[10px] text-gray-500 mt-0.5">{feed.t}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
                <div className="w-full md:w-72 space-y-6">
                   <div className="bg-[#12141c] border border-white/5 rounded-3xl p-6">
                     <h3 className="text-white font-bold mb-4">Mejores Creadores</h3>
                     <div className="space-y-3">
                       {["ZeroDev", "NexusTeam", "Artisan3D"].map((n, i) => (
                         <div key={i} className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-white/10"></div>
                             <span className="text-sm font-bold text-slate-300">{n}</span>
                           </div>
                           <button className="text-[9px] px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 font-bold uppercase">Seguir</button>
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
                  <h2 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                     <Plus className="w-5 h-5 text-cyan-400" /> Proyectos Locales en Desarrollo
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Tus creaciones de minijuegos autoguardadas de forma segura de modo local (IndexedDB).</p>
                </div>
                {localDrafts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {localDrafts.map((draft) => (
                      <div key={draft.id} className="bg-[#12141c] rounded-[24px] border border-white/5 p-6 flex flex-col justify-between hover:border-cyan-500/20 transition-all group">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-lg text-[10px] font-bold">Offline Draft</span>
                            <button 
                              onClick={(e) => handleDeleteDraft(draft.id, e)}
                              className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar proyecto"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                          <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors mb-2">{draft.title}</h3>
                          <p className="text-gray-500 text-xs font-mono mb-4">Módulos: {draft.objects?.length || 0} • {new Date(draft.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <button 
                            onClick={() => {
                              setEditorDraftId(draft.id);
                              const baseTemplate = draft.title.replace(' offline game', '');
                              setEditorTemplate(baseTemplate);
                            }}
                            className="w-full bg-[#1e293b] hover:bg-[#334155] text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer text-xs"
                          >
                            <Play className="w-4 h-4" /> Editar
                          </button>
                          <button 
                            onClick={() => {
                              setPublishingDraftId(draft.id);
                            }}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer text-xs"
                          >
                            <Globe className="w-4 h-4" /> Publicar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#12141c] rounded-2xl p-10 text-center border border-white/5">
                    <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">No tienes borradores todavía</p>
                    <p className="text-gray-500 text-xs mt-1">Crea un nuevo juego haciendo clic en el botón superior, los cambios se autoguardarán.</p>
                  </div>
                )}
              </section>
            )}
            
          </div>
        ) : (
          <motion.div 
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-[#12141c] rounded-[32px] border border-white/5 p-8 max-w-4xl mx-auto"
          >
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                <Plus className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">Games Studio (Beta)</h2>
              <p className="text-gray-400 max-w-lg mx-auto">Crea minijuegos HTML5 instantáneos, arcade puzzles o plataformas de forma táctil e intuitiva, 100% desde Android, sin necesidad de conexión.</p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <div className="flex items-center gap-1.5 bg-[#12141c] border border-emerald-500/30 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">Guardado Offline</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#12141c] border border-blue-500/30 px-3 py-1.5 rounded-full">
                  <Zap className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase">IndexedDB Activo</span>
                </div>
              </div>
            <div className="grid grid-cols-1 gap-4">
               {[
                 { title: 'Crear desde cero 3D', icon: Sliders, color: 'text-cyan-400', bg: 'bg-cyan-500/10', desc: 'Comienza con un lienzo limpio y herramientas 3D completas: biomas, físicas, scripts e importaciones.' },
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
                    className="p-6 rounded-2xl bg-[#1a1c24] border border-white/5 hover:border-cyan-500/30 text-left transition-all hover:bg-[#1f212a] group cursor-pointer"
                 >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${t.bg} mb-4`}>
                      <t.icon className={`w-6 h-6 ${t.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase font-mono">{t.title}</h3>
                    <p className="text-xs text-gray-400 mt-2 font-medium leading-relaxed">{t.desc}</p>
                 </button>
               ))}
            </div>
            
            <div className="mt-8 p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl text-center shadow-[0_0_15px_rgba(34,211,238,0.1)]">
              <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-3 animate-pulse" />
              <p className="text-cyan-100 font-bold tracking-wide font-mono text-sm max-w-md mx-auto">Muy pronto llegarán plantillas avanzadas totalmente funcionales para Games Studio.</p>
            </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
