import { useAppStore } from '../../store/useAppStore';
import { useState, useEffect, useRef } from 'react';
import { Gamepad2, Compass, Trophy, Star, ShieldCheck, Download, Layers, Settings, User, Search, Loader2, Zap, ArrowRight, Heart, Edit2, Camera, X, Check, Shuffle, Upload, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AppGrid, { AppCard } from '../AppGrid';
import { AppItem, Category } from '../../types';
import { CATEGORIES } from '../../data';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';

export function GamesView({ apps, onAppClick }: { apps: AppItem[], onAppClick?: (app: AppItem) => void }) {
  const { t } = useAppStore();
  const gameApps = apps.filter(a => a.category.toLowerCase() === 'juegos' || a.category.toLowerCase() === 'acción' || a.category.toLowerCase() === 'aventura' || a.category.toLowerCase() === 'estrategia');
  
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'downloads'|'rating'>('downloads');

  const getDownloadsNum = (app: any) => {
    if (typeof app.download_count === 'number') return app.download_count;
    const d = app.downloads;
    if (typeof d === 'number') return d;
    if (typeof d === 'string') return parseInt(d.replace(/[^0-9]/g, '')) || 0;
    return 0;
  };

  const filtered = gameApps
    .filter(a => activeCategory === 'Todos' || a.category.toLowerCase() === activeCategory.toLowerCase())
    .sort((a, b) => {
      if(sortBy === 'downloads') return getDownloadsNum(b) - getDownloadsNum(a);
      return b.rating - a.rating;
    });

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

export function ExploreView({ apps, onAppClick, onAction }: { apps: AppItem[], onAppClick?: (app: AppItem) => void, onAction?: (action: string) => void }) {
  const { t } = useAppStore();
  const getDownloadsNum = (d: any) => {

    if (typeof d === 'number') return d;
    if (typeof d === 'string') return parseInt(d.replace(/[^0-9]/g, '')) || 0;
    return 0;
  };

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
               image: null
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
         image: a.icon
      }));

      const combined = [...items, ...appItems].sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setFeedItems(combined);
    };
    
    fetchFeed();
  }, [apps]);

  const packs: any[] = [];

  const trends = apps.slice().sort((a, b) => getDownloadsNum(b) - getDownloadsNum(a)).slice(0, 4);

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
                    {item.avatar ? <img src={item.avatar} className="w-full h-full object-cover" /> : item.user[0]}
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
                      <img src={app.icon} className="w-10 h-10 rounded-xl object-cover" />
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
              <p className="text-xs text-nexus-text-sec mb-4 mb-4">{t("explore.askAiDesc") || "¿No sabes a qué jugar o qué pack descargar? Pregúntale a Nexus AI."}</p>
              <button onClick={() => onAction?.('nexus-ai')} className="w-full py-2 bg-nexus-card-hover hover:bg-cyan-500 hover:text-nexus-bg font-bold text-sm rounded-xl transition-all">{t("explore.consultAi") || "Consultar IA"}</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {packs.length > 0 ? packs.map(pack => (
             <div key={pack.id} className="glass-panel rounded-[2rem] overflow-hidden border-nexus-border shadow-2xl relative group">
                <div className="h-48 sm:h-64 relative w-full overflow-hidden">
                   <img src={pack.banner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60" />
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
                           <img src={app.icon} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
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

export function RankingView({ apps, onAppClick }: { apps: AppItem[], onAppClick?: (app: AppItem) => void }) {
  const { t } = useAppStore();
  const getDownloadsNum = (app: any) => {
    if (typeof app.download_count === 'number') return app.download_count;
    const d = app.downloads;
    if (typeof d === 'number') return d;
    if (typeof d === 'string') return parseInt(d.replace(/[^0-9]/g, '')) || 0;
    return 0;
  };
  const sortedByDownloads = apps.slice().sort((a, b) => getDownloadsNum(b) - getDownloadsNum(a)).slice(0, 100);
  
  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-16">
      <h1 className="text-3xl font-black flex items-center gap-3 mb-8"><Trophy className="w-8 h-8 text-yellow-400" /> {t('ranking.title') || "Ranking Global"}</h1>
      
      <div className="space-y-3">
        {sortedByDownloads.map((app, idx) => (
          <div key={app.id} onClick={() => onAppClick?.(app)} className="glass-panel p-4 rounded-2xl flex items-center gap-4 hover:border-nexus-border transition-colors bg-nexus-card cursor-pointer">
            <div className={`w-8 font-black text-xl text-center ${idx===0 ? 'text-yellow-400' : idx===1 ? 'text-nexus-text' : idx===2 ? 'text-orange-400' : 'text-nexus-text-sec'}`}>
              #{idx + 1}
            </div>
            <img src={app.icon} alt={app.name} className="w-12 h-12 rounded-[1rem] object-cover bg-nexus-card-hover shadow-sm" />
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

const PROFILE_AVATAR_PRESETS = [
  { name: 'Onda Futura', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80' },
  { name: 'Brillo Cyber', url: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=150&q=80' },
  { name: 'Orbe Halógeno', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=150&q=80' },
  { name: 'Estrellas Cósmicas', url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=150&q=80' },
  { name: 'Oculto Esmeralda', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=150&q=80' },
  { name: 'Fiebre Volcánica', url: 'https://images.unsplash.com/photo-1618005198143-e5283b519a7f?auto=format&fit=crop&w=150&q=80' },
];

export function ProfileView({ session, userProfile, onLoginClick, onDeveloperAction }: { 
  session?: any, 
  userProfile?: any, 
  onLoginClick?: () => void,
  onDeveloperAction?: (action: 'activate' | 'open') => void 
}) {
  const { t } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  // Custom states for drag-and-drop and AI generator
  const [isDragActive, setIsDragActive] = useState(false);
  const [aiPresetSeed, setAiPresetSeed] = useState('');
  const [aiPresetStyle, setAiPresetStyle] = useState('bottts');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      const res = await uploadToCloudinary(file, 'avatars');
      if (res && res.secure_url) {
        setAvatarUrl(res.secure_url);
      } else {
        throw new Error('No se recibió la dirección web de la imagen subida.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  // Default values combining DB and metadata
  const metadata = session?.user?.user_metadata || {};

  useEffect(() => {
    if (userProfile || session) {
      const initialUser = userProfile?.username || session?.user?.email?.split('@')[0] || 'Usuario';
      setUsername(initialUser);
      setRealName(userProfile?.real_name || metadata.full_name || '');
      setAvatarUrl(userProfile?.avatar_url || metadata.avatar_url || '');
      setBio(metadata.bio || '');
      setAiPresetSeed(initialUser);
    }
  }, [userProfile, session]);

  if (!session) {
    return (
      <div className="pt-24 px-6 max-w-3xl mx-auto pb-16 flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-nexus-card border border-nexus-border flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-nexus-text-sec" />
        </div>
        <h1 className="text-3xl font-black">{t("main.yourAccount") || "Tu Cuenta Nexus"}</h1>
        <p className="text-nexus-text-sec max-w-sm">Inicia sesión o regístrate para acceder a tus descargas, guardar favoritos, crear packs y ganar experiencia en NexusPlay.</p>
        <button 
          onClick={onLoginClick}
          className="mt-4 px-8 py-3 bg-cyan-500 text-nexus-bg font-bold rounded-xl hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
        >
          Iniciar sesión / Registrarse
        </button>
      </div>
    );
  }

  const email = session.user?.email || '';
  const isAdmin = userProfile?.role === 'admin';
  const isDeveloper = userProfile?.role === 'developer' || isAdmin;
  const initial = username.charAt(0).toUpperCase();

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    try {
      if (username.length < 3) throw new Error("El nombre de usuario debe tener al menos 3 caracteres");
      
      await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl, full_name: realName, bio: bio }
      });

      let updateErr: any = null;
      const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '');

      let attempts = 0;
      while (attempts < 3) {
        const { error } = await supabase
          .from('profiles')
          .update({ username: cleanUsername, real_name: realName, avatar_url: avatarUrl })
          .eq('id', session.user.id);
        
        updateErr = error;
        if (!error) {
          break;
        }
        if (error.message && error.message.includes('schema cache')) {
          attempts++;
          console.warn(`[MainViews Profile Update] Schema cache error. Retrying attempt ${attempts} in 600ms...`);
          await new Promise(r => setTimeout(r, 600));
        } else {
          break;
        }
      }
        
      if (updateErr && updateErr.code !== '23505') {
         console.warn("DB update issue", updateErr);
      }
      
      setIsEditing(false);
      window.location.reload();
    } catch(err: any) {
      setError(err.message || 'Error al guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const xp = userProfile?.xp || metadata.xp || 0;
  const level = Math.floor(xp / 1000) + 1;
  const nextLevelXp = level * 1000;
  const currentLevelXp = xp % 1000;
  const progressPercent = (currentLevelXp / 1000) * 100;

  const stats = {
    favorites: userProfile?.favorites_count || 0,
    quests: userProfile?.completed_quests || 0,
    games: userProfile?.published_games || 0,
    followers: userProfile?.followers || 0,
    likes: userProfile?.likes || 0,
    comments: userProfile?.comments || 0,
  };

  return (
    <div className="pt-24 px-4 sm:px-6 max-w-4xl mx-auto pb-16 space-y-6 sm:space-y-8">
      {/* Profile Banner & Info */}
      <div className="glass-panel rounded-[2rem] border-nexus-border overflow-hidden">
        <div className="h-32 sm:h-48 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 relative">
           <img src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=2800" className="w-full h-full object-cover opacity-30" />
           <div className="absolute inset-0 bg-gradient-to-t from-nexus-bg to-transparent" />
        </div>
        
        <div className="p-4 sm:p-8 pt-0 relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-20">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] bg-gradient-to-tr from-cyan-400 to-purple-500 p-1 flex-shrink-0 shadow-2xl relative group">
            <div className="w-full h-full bg-nexus-card rounded-[1.8rem] flex items-center justify-center text-4xl sm:text-5xl font-black overflow-hidden relative">
               {avatarUrl ? (
                 <img 
                   src={avatarUrl} 
                   alt={username} 
                   className="w-full h-full object-cover" 
                   onError={(e) => {
                     e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username || 'nexus')}`;
                   }}
                 />
               ) : (
                 <span>{initial}</span>
               )}
            </div>
            <div className="absolute -bottom-3 -right-3 bg-nexus-card rounded-full p-1.5 shadow-xl border border-nexus-border">
               <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center font-black text-nexus-bg text-xs">
                 {level}
               </div>
            </div>
          </div>
          
          <div className="text-center sm:text-left flex-1 min-w-0 mt-2 sm:mt-0 pb-2">
            {!isEditing ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black truncate drop-shadow-md">{username}</h1>
                  <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                    <div className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] font-black border border-green-500/20 uppercase tracking-widest">{t("main.verified") || "Verificado"}</div>
                    {isAdmin && (
                      <div className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-black border border-amber-500/20 uppercase tracking-widest">Admin</div>
                    )}
                    {isDeveloper && !isAdmin && (
                      <div className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-black border border-cyan-500/20 uppercase tracking-widest">Dev</div>
                    )}
                  </div>
                </div>
                {realName && <p className="text-nexus-text font-medium mb-1 truncate text-sm sm:text-base">{realName}</p>}
                {bio ? (
                   <p className="text-nexus-text-sec text-sm mb-4 max-w-lg italic">"{bio}"</p>
                ) : (
                   <p className="text-nexus-text-sec text-xs sm:text-sm mb-4">Sin biografía establecida.</p>
                )}
                
                <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
                   <div className="text-center">
                     <div className="text-lg font-black text-nexus-text">{stats.games}</div>
                     <div className="text-[10px] text-nexus-text-sec uppercase tracking-widest">{t('nav.games')}</div>
                   </div>
                   <div className="w-[1px] h-6 bg-nexus-card-hover" />
                   <div className="text-center">
                     <div className="text-lg font-black text-nexus-text">{stats.favorites}</div>
                     <div className="text-[10px] text-nexus-text-sec uppercase tracking-widest">Favs</div>
                   </div>
                   <div className="w-[1px] h-6 bg-nexus-card-hover" />
                   <div className="text-center">
                     <div className="text-lg font-black text-nexus-text">{stats.quests}</div>
                     <div className="text-[10px] text-nexus-text-sec uppercase tracking-widest">Misiones</div>
                   </div>
                </div>

                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2 bg-nexus-card hover:bg-nexus-card-hover border border-nexus-border rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
                >
                  Editar Perfil Social
                </button>
              </>
            ) : (
              <div className="space-y-6 w-full bg-nexus-card/80 p-6 sm:p-8 rounded-[2rem] border border-nexus-border backdrop-blur-md text-left shadow-2xl relative overflow-hidden">
                 {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold mb-5">{error}</div>}
                 
                 {/* Live preview banner card */}
                 <div className="mb-6 p-4 rounded-2xl bg-nexus-card border border-nexus-border shadow-inner relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[40px] pointer-events-none" />
                   
                   <span className="absolute top-3 right-3 text-[8px] uppercase tracking-wider font-mono font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/10">Identidad Actualizada</span>
                   
                   <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-2xl bg-nexus-card border border-nexus-border overflow-hidden relative shadow-lg shrink-0 flex items-center justify-center font-black text-xl text-nexus-text">
                       {avatarUrl ? (
                         <img 
                           src={avatarUrl} 
                           className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                           alt="Quick Preview" 
                           onError={(e) => {
                             e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username || 'nexus')}`;
                           }}
                         />
                       ) : (
                         <span>{(username || 'U').charAt(0).toUpperCase()}</span>
                       )}
                       <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-nexus-bg text-[9px] font-black rounded-full px-1.5 py-0.5 border border-slate-950 scale-90">
                         Lvl {level}
                       </div>
                     </div>
                     <div className="min-w-0 flex-1">
                       <div className="flex items-center gap-2">
                         <h4 className="text-nexus-text font-black text-base truncate font-mono">@{username || 'jugador_nexus'}</h4>
                         <span className="px-1.5 py-0.5 bg-cyan-400/10 text-cyan-400 text-[8px] font-black uppercase rounded border border-cyan-400/20">{t("main.player") || "Jugador"}</span>
                       </div>
                       <p className="text-nexus-text-sec text-xs truncate mt-0.5">{realName || 'Tu Nombre o Alias'}</p>
                       <p className="text-nexus-text-sec text-[10px] italic truncate mt-1">"{bio || 'Sin biografía establecida.'}"</p>
                     </div>
                   </div>
                 </div>

                 {/* PHOTO PICKER TABS */}
                 <div className="mb-5">
                   <div className="grid grid-cols-3 gap-1 bg-nexus-card p-1 rounded-2xl border border-nexus-border mb-4">
                     <button
                       type="button"
                       onClick={() => {
                         // Fallback to custom upload
                         if (avatarUrl.includes('unsplash.com') || avatarUrl.includes('api.dicebear.com')) {
                           setAvatarUrl('');
                         }
                       }}
                       className={`py-2 px-1 text-[10px] sm:text-[11px] font-bold text-center rounded-xl transition-all cursor-pointer uppercase tracking-wider ${
                         !avatarUrl.includes('unsplash.com') && !avatarUrl.includes('api.dicebear.com') ? 'bg-cyan-500 text-nexus-bg font-black shadow-nexus-glow' : 'text-nexus-text-sec hover:text-nexus-text'
                       }`}
                     >
                       📂 Subir Custom
                     </button>
                     <button
                       type="button"
                       onClick={() => {
                         const seed = aiPresetSeed || username || 'nexus';
                         setAvatarUrl(`https://api.dicebear.com/7.x/${aiPresetStyle}/svg?seed=${encodeURIComponent(seed)}`);
                       }}
                       className={`py-2 px-1 text-[10px] sm:text-[11px] font-bold text-center rounded-xl transition-all cursor-pointer uppercase tracking-wider ${
                         avatarUrl.includes('api.dicebear.com') ? 'bg-cyan-500 text-nexus-bg font-black shadow-nexus-glow' : 'text-nexus-text-sec hover:text-nexus-text'
                       }`}
                     >
                       ⚡ Avatar IA
                     </button>
                     <button
                       type="button"
                       onClick={() => {
                         setAvatarUrl(PROFILE_AVATAR_PRESETS[0].url);
                       }}
                       className={`py-2 px-1 text-[10px] sm:text-[11px] font-bold text-center rounded-xl transition-all cursor-pointer uppercase tracking-wider ${
                         avatarUrl.includes('unsplash.com') ? 'bg-cyan-500 text-nexus-bg font-black shadow-nexus-glow' : 'text-nexus-text-sec hover:text-nexus-text'
                       }`}
                     >
                       💎 PRESETS
                     </button>
                   </div>

                   {/* TAB CONTENT: 1. UPLOAD CUSTOM */}
                   {!avatarUrl.includes('unsplash.com') && !avatarUrl.includes('api.dicebear.com') && (
                     <div 
                       onDragOver={(e) => {
                         e.preventDefault();
                         setIsDragActive(true);
                       }}
                       onDragLeave={() => setIsDragActive(false)}
                       onDrop={async (e) => {
                         e.preventDefault();
                         setIsDragActive(false);
                         const file = e.dataTransfer.files?.[0];
                         if (file && file.type.startsWith('image/')) {
                           try {
                             setUploading(true);
                             setError(null);
                             const res = await uploadToCloudinary(file, 'avatars');
                             if (res && res.secure_url) {
                               setAvatarUrl(res.secure_url);
                             } else {
                               throw new Error('No se recibió la dirección web de la imagen subida.');
                             }
                           } catch (err: any) {
                             console.error(err);
                             setError(err.message || 'Error al subir la imagen.');
                           } finally {
                             setUploading(false);
                           }
                         }
                       }}
                       onClick={() => {
                         if (!uploading) fileInputRef.current?.click();
                       }}
                       className={`relative w-full h-32 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer overflow-hidden ${
                         isDragActive 
                           ? 'border-cyan-400 bg-cyan-950/20 shadow-nexus-glow' 
                           : 'border-nexus-border hover:border-cyan-400/50 bg-nexus-surface hover:bg-nexus-card'
                       }`}
                     >
                       {uploading ? (
                         <div className="flex flex-col items-center gap-2">
                           <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                           <span className="text-xs uppercase font-black tracking-widest text-cyan-400 animate-pulse">Subiendo a Cloudinary...</span>
                         </div>
                       ) : avatarUrl ? (
                         <div className="absolute inset-0 flex items-center justify-center group">
                           <img src={avatarUrl} className="w-full h-full object-cover opacity-80" alt="Uploaded Profile" />
                           <div className="absolute inset-0 bg-nexus-surface opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-xs font-black transition-opacity text-nexus-text gap-1 uppercase">
                             <Upload className="w-4 h-4 text-cyan-400" /> Cambiar Imagen
                           </div>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center">
                           <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 mb-2">
                             <Camera className="w-5 h-5" />
                           </div>
                           <p className="text-xs font-bold text-gray-200">{t("main.dropImage") || "Suelta tu imagen o Haz Clic para subir"}</p>
                           <p className="text-[9px] text-nexus-text-sec uppercase tracking-widest mt-1">PNG, JPG, WEBP (SE GUARDA EN CLOUDINARY)</p>
                         </div>
                       )}
                       <input 
                         type="file" 
                         ref={fileInputRef} 
                         onChange={handleFileUpload} 
                         className="hidden" 
                         accept="image/*" 
                       />
                     </div>
                   )}

                   {/* TAB CONTENT: 2. AI AVATAR ENGINE */}
                   {avatarUrl.includes('api.dicebear.com') && (
                     <div className="space-y-4 bg-nexus-surface/80 p-4 rounded-2xl border border-nexus-border">
                       <div className="flex items-center gap-3">
                         <div className="w-12 h-12 bg-nexus-card border border-nexus-border rounded-xl shrink-0 overflow-hidden flex items-center justify-center p-1.5 shadow-inner">
                           <img 
                             src={avatarUrl} 
                             className="w-full h-full object-contain" 
                             alt="AI Generator Realtime Output" 
                           />
                         </div>
                         <div>
                           <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono">{t("main.generatingAI") || "Generando por IA"}</span>
                           <p className="text-xs font-bold text-nexus-text">Generación Dinámica Directa</p>
                         </div>
                       </div>

                       <div className="grid grid-cols-4 gap-1.5">
                         {[
                           { id: 'bottts', label: 'Robots' },
                           { id: 'pixel-art', label: 'Pixeles' },
                           { id: 'avataaars', label: 'Gente' },
                           { id: 'micah', label: 'Abstract' }
                         ].map((style) => (
                           <button
                             key={style.id}
                             type="button"
                             onClick={() => {
                               setAiPresetStyle(style.id);
                               const seed = aiPresetSeed || username || 'nexus';
                               setAvatarUrl(`https://api.dicebear.com/7.x/${style.id}/svg?seed=${encodeURIComponent(seed)}`);
                             }}
                             className={`py-2 px-1 text-[9px] uppercase tracking-wider font-extrabold rounded-lg transition-all border ${
                               aiPresetStyle === style.id 
                                 ? 'bg-cyan-500/15 border-cyan-400 text-cyan-400' 
                                 : 'bg-nexus-card border-transparent text-nexus-text-sec hover:text-nexus-text'
                             }`}
                           >
                             {style.label}
                           </button>
                         ))}
                       </div>

                       <div className="flex gap-2">
                         <div className="relative flex-1">
                           <input
                             type="text"
                             value={aiPresetSeed}
                             onChange={(e) => {
                               const val = e.target.value;
                               setAiPresetSeed(val);
                               setAvatarUrl(`https://api.dicebear.com/7.x/${aiPresetStyle}/svg?seed=${encodeURIComponent(val || 'nexus')}`);
                             }}
                             placeholder="Semilla (ej. Juan, Matrix, Cyberpunk)"
                             className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-3.5 py-2.5 text-nexus-text text-xs font-mono outline-none focus:border-cyan-400"
                           />
                         </div>
                         <button
                           type="button"
                           onClick={() => {
                             const val = 'nexus_' + Math.floor(Math.random() * 89999 + 10000);
                             setAiPresetSeed(val);
                             setAvatarUrl(`https://api.dicebear.com/7.x/${aiPresetStyle}/svg?seed=${encodeURIComponent(val)}`);
                           }}
                           className="p-2.5 bg-nexus-surface hover:bg-nexus-card-hover border border-nexus-border rounded-xl text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer"
                           title="Randomizar semilla"
                         >
                           <Shuffle className="w-4 h-4" />
                         </button>
                       </div>
                     </div>
                   )}

                   {/* TAB CONTENT: 3. PREMIUM PRESETS */}
                   {avatarUrl.includes('unsplash.com') && (
                     <div className="space-y-2">
                       <div className="grid grid-cols-6 gap-2 bg-nexus-card/80 p-3 rounded-2xl border border-nexus-border">
                         {PROFILE_AVATAR_PRESETS.map((preset, index) => {
                           const isSelected = avatarUrl === preset.url;
                           return (
                             <div 
                               key={index} 
                               onClick={() => setAvatarUrl(preset.url)}
                               className={`relative cursor-pointer aspect-square rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-cyan-400 scale-105 shadow-nexus-glow' : 'border-transparent hover:scale-105'}`}
                               title={preset.name}
                             >
                               <img src={preset.url} className="w-full h-full object-cover" alt={preset.name} />
                               {isSelected && (
                                 <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                                   <Check className="w-4 h-4 text-cyan-400 font-extrabold stroke-[3]" />
                                 </div>
                               )}
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}
                 </div>

                 <div className="space-y-4">
                   <div>
                     <div className="flex justify-between items-center mb-1.5">
                       <label className="block text-[10px] font-black text-nexus-text-sec uppercase tracking-widest font-mono">Nombre de Usuario (Único)</label>
                       {username.length >= 3 ? (
                         <span className="text-[9px] uppercase font-mono text-green-400 font-extrabold">✓ VÁLIDO</span>
                       ) : (
                         <span className="text-[9px] uppercase font-mono text-yellow-500 font-extrabold">MIN 3 CARACT.</span>
                       )}
                     </div>
                     <input type="text" value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-3 text-nexus-text outline-none focus:border-cyan-500 focus:bg-nexus-surface transition-all font-semibold font-mono text-[13px]" placeholder="usuario_123" />
                     <span className="text-[8px] text-nexus-text-sec font-bold block mt-1.5 uppercase tracking-wider">Solo se permiten letras, números y guiones bajos (_).</span>
                   </div>
                   
                   <div>
                     <label className="block text-[10px] font-black text-nexus-text-sec uppercase tracking-widest mb-1.5 font-mono">{t("main.displayName") || "Nombre Visible"}</label>
                     <input type="text" value={realName} onChange={e => setRealName(e.target.value)} className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-3 text-nexus-text outline-none focus:border-cyan-500 focus:bg-nexus-surface transition-all font-semibold text-[13px]" placeholder="Tu Nombre Real" />
                   </div>

                   <div>
                     <div className="flex justify-between text-[10px] font-black text-nexus-text-sec uppercase tracking-widest mb-1.5 font-mono">
                       <span>{t("main.shortBio") || "Biografía corta o Estado"}</span>
                       <span className="text-nexus-text-sec font-bold">{bio.length}/100</span>
                     </div>
                     <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={100} rows={2} className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-3 text-nexus-text outline-none focus:border-cyan-500 focus:bg-nexus-surface transition-all font-semibold text-[13px] resize-none" placeholder="Amo los juegos Indie..." />
                   </div>
                   
                   <div className="flex items-center gap-3 pt-4 border-t border-nexus-border">
                     <button 
                       onClick={handleSaveProfile} 
                       disabled={saving || uploading || username.length < 3} 
                       className="flex-1 py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-nexus-bg font-black uppercase tracking-widest rounded-xl text-[11px] transition-all duration-300 shadow-nexus-glow flex items-center justify-center gap-2 cursor-pointer"
                     >
                       {saving ? (
                         <>
                           <Loader2 className="w-4 h-4 animate-spin stroke-[3]" /> Guardando...
                         </>
                       ) : 'Guardar Cambios'}
                     </button>
                     <button 
                       onClick={() => {
                         setIsEditing(false); setError(null);
                         setUsername(userProfile?.username || ''); setRealName(userProfile?.real_name || '');
                         setAvatarUrl(userProfile?.avatar_url || ''); setBio(metadata.bio || '');
                       }} 
                       disabled={saving || uploading} 
                      className="px-6 py-2.5 bg-nexus-surface border border-nexus-border text-nexus-text font-bold rounded-xl hover:bg-nexus-surface-hover transition-colors"
                    >
                      Cancelar
                     </button>
                  </div>
                </div>
              </div>
             )}
             
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Nivel y XP */}
        <div className="glass-panel p-6 rounded-3xl border-nexus-border bg-gradient-to-br from-yellow-900/10 to-transparent">
           <h3 className="font-black mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Progreso de Nivel</h3>
           <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl font-black text-yellow-500">{level}</div>
               <div className="flex-1">
                 <div className="flex justify-between text-[10px] font-bold text-nexus-text-sec mb-1 uppercase tracking-widest">
                    <span>{t("main.currentXP") || "XP Actual"}</span>
                    <span>Nivel {level + 1}</span>
                 </div>
                 <div className="w-full h-3 bg-nexus-surface rounded-full overflow-hidden border border-nexus-border">
                    <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400" style={{ width: `${progressPercent}%` }} />
                 </div>
                 <div className="text-[10px] text-yellow-500/70 text-right mt-1 font-mono">
                    {currentLevelXp} / 1000 XP
                 </div>
               </div>
           </div>
           <p className="text-xs text-nexus-text-sec font-medium leading-relaxed">Completa <span className="text-cyan-400 cursor-pointer hover:underline">{t("main.communityMissions") || "Misiones de Comunidad"}</span> descargando apps y comentando en foros para ganar más XP.</p>
        </div>

        {/* Insignias / Badges */}
        <div className="glass-panel p-6 rounded-3xl border-nexus-border col-span-1 md:col-span-2 bg-nexus-card">
           <h3 className="font-black mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-cyan-400" /> Mis Insignias</h3>
           <div className="flex flex-wrap gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-900/60 to-blue-900/60 border border-cyan-500/30 flex flex-col items-center justify-center relative group cursor-pointer hover:scale-105 transition-transform shadow-lg cursor-help text-center p-1" title="Pionero: Te uniste en los primeros meses.">
                 <Compass className="w-6 h-6 text-cyan-400 mb-1 drop-shadow-md" />
                 <span className="text-[8px] font-black uppercase text-cyan-200">Pionero</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-900/60 to-pink-900/60 border border-purple-500/30 flex flex-col items-center justify-center relative group cursor-pointer hover:scale-105 transition-transform shadow-lg cursor-help text-center p-1" title="Verificado: Vinculaste cuenta válida.">
                 <ShieldCheck className="w-6 h-6 text-purple-400 mb-1 drop-shadow-md" />
                 <span className="text-[8px] font-black uppercase text-purple-200">Verificado</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-nexus-card border border-nexus-border border-dashed flex flex-col items-center justify-center opacity-50 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                 <Gamepad2 className="w-6 h-6 text-nexus-text-sec mb-1" />
                 <span className="text-[8px] font-bold uppercase text-nexus-text-sec">?</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sección de Desarrollador */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-cyan-500/20 hover:border-cyan-500/40 transition-all bg-gradient-to-br from-black to-cyan-900/20 shadow-xl group">
           <h3 className="text-xl font-black mb-2 flex items-center gap-2">
            <Layers className={`w-6 h-6 ${isDeveloper ? 'text-cyan-400' : 'text-nexus-text-sec'}`} /> 
            {isDeveloper ? 'Espacio Creador' : 'Conviértete en Dev'}
          </h3>
           <p className="text-sm text-nexus-text mb-6 font-medium leading-relaxed max-w-xs">
            {isDeveloper 
              ? 'Abre tu panel para publicar nuevas obras, gestionar colecciones y revisar métricas.' 
              : 'Publica tus propias apps, construye tu comunidad y gana insignias únicas.'}
          </p>
           <button 
             onClick={() => onDeveloperAction?.(isDeveloper ? 'open' : 'activate')}
             className={`px-6 py-3 rounded-xl text-sm font-black transition-all shadow-lg active:scale-95 flex items-center gap-2 ${isDeveloper ? 'bg-cyan-500 text-nexus-bg hover:bg-cyan-400 shadow-cyan-500/20' : 'bg-nexus-card-hover hover:bg-nexus-card text-nexus-text'}`}
           >
             {isDeveloper ? 'Ir a My Studio' : 'Activar Modo Creador'} <ArrowRight className="w-4 h-4" />
           </button>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-nexus-border hover:border-nexus-border transition-colors bg-nexus-card">
           <h3 className="text-xl font-black mb-2 flex items-center gap-2"><Settings className="w-6 h-6 text-nexus-text-sec" /> Configuración</h3>
           <p className="text-sm text-nexus-text-sec mb-6 font-medium leading-relaxed max-w-xs">Ajusta preferencias de privacidad, seguridad de la cuenta y notificaciones.</p>
           <button className="px-6 py-3 bg-nexus-card hover:bg-nexus-card-hover border border-nexus-border text-nexus-text rounded-xl text-sm font-bold transition-colors">{t("main.openSettings") || "Abrir Ajustes"}</button>
        </div>
      </div>
    </div>
  );
}

export function DownloadsView({ apps, onAppClick }: { apps: AppItem[], onAppClick?: (app: AppItem) => void }) {
  const [downloadedApps, setDownloadedApps] = useState<AppItem[]>([]);

  useEffect(() => {
    const downloadedIds = JSON.parse(localStorage.getItem('nexus_downloaded_ids') || '[]');
    const filtered = apps.filter(a => downloadedIds.includes(a.id));
    setDownloadedApps(filtered);
  }, [apps]);

  const clearHistory = () => {
    if (confirm("¿Estás seguro de que quieres limpiar tu historial de descargas?")) {
      localStorage.removeItem('nexus_downloaded_ids');
      setDownloadedApps([]);
    }
  };

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black flex items-center gap-3"><Download className="w-8 h-8 text-cyan-400" /> Mis Descargas</h1>
        {downloadedApps.length > 0 && (
          <button 
            onClick={clearHistory}
            className="text-sm text-red-400 hover:text-red-300 font-bold transition-colors"
          >
            Limpiar Historial
          </button>
        )}
      </div>

      <div className="space-y-4">
        {downloadedApps.map(app => {
          const installedVersion = localStorage.getItem(`nexus_app_version_${app.id}`);
          const hasUpdate = installedVersion && installedVersion !== app.version;
          
          return (
            <div 
              key={app.id} 
              onClick={() => onAppClick?.(app)} 
              className={`glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-nexus-card transition-colors border-nexus-border cursor-pointer relative overflow-hidden group ${hasUpdate ? 'border-green-500/30 bg-green-500/5' : ''}`}
            >
              {hasUpdate && (
                <div className="absolute top-0 right-0 py-1 px-3 bg-green-500 text-nexus-bg text-[9px] font-black uppercase tracking-tighter rounded-bl-xl shadow-lg animate-pulse">
                  Actualización Disponibe
                </div>
              )}

              <img src={app.icon} className="w-12 h-12 rounded-[1rem] shadow-lg object-cover" alt={app.name} />
              <div className="flex-1 min-w-0">
                 <h3 className="font-bold text-lg text-nexus-text truncate">{app.name}</h3>
                 <div className="flex items-center gap-2 mt-1">
                   <span className="text-xs text-nexus-text-sec">v{installedVersion || '1.0'}</span>
                   {hasUpdate && (
                     <>
                        <ArrowRight className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-400 font-bold">v{app.version}</span>
                     </>
                   )}
                 </div>
              </div>
              
              <div className="flex items-center gap-2">
                {hasUpdate ? (
                  <button className="px-4 py-2 bg-green-500 text-nexus-bg font-black rounded-xl text-xs hover:bg-green-400 transition-all flex items-center gap-2">
                    <Zap className="w-4 h-4" /> ACTUALIZAR
                  </button>
                ) : (
                  <>
                    <button className="hidden sm:block px-4 py-2 bg-nexus-card text-nexus-text-sec hover:bg-nexus-card-hover hover:text-nexus-text font-bold rounded-xl text-sm transition-colors border border-nexus-border">{t("main.installAgain") || "Instalar de nuevo"}</button>
                    <button className="sm:hidden p-2 bg-nexus-card text-nexus-text-sec rounded-xl border border-nexus-border"><Download className="w-5 h-5"/></button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {downloadedApps.length === 0 && (
          <div className="text-center py-20 px-6 bg-nexus-card border border-dashed border-nexus-border rounded-[2rem]">
            <div className="w-20 h-20 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <Download className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-nexus-text mb-2">{t("main.noRecentDownloads") || "No tienes descargas recientes"}</h2>
            <p className="text-nexus-text-sec text-sm max-w-xs mx-auto">Explora nuestro catálogo y empieza a descargar los mejores juegos y aplicaciones.</p>
            <button 
              onClick={() => window.location.hash = ''} 
              className="mt-8 px-6 py-2 bg-nexus-cyan text-nexus-bg font-black rounded-xl hover:scale-105 transition-all text-xs uppercase"
            >
              Explorar Catálogo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CollectionsView({ apps, onAppClick }: { apps?: AppItem[], onAppClick?: (app: AppItem) => void }) {
  const cols = [
    { title: 'Top Juegos', desc: 'Sustos y diversión garantizados', color: 'from-purple-900 to-black', filter: (a:AppItem) => a.category.toLowerCase().includes('jueg') },
    { title: 'Productividad Extrema', desc: 'Organiza tu vida entera con estas apps', color: 'from-blue-900 to-cyan-900', filter: (a:AppItem) => a.category.toLowerCase().includes('produc') || a.category.toLowerCase().includes('herr') },
  ];
  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto pb-16">
      <h1 className="text-3xl font-black flex items-center gap-3 mb-8"><Layers className="w-8 h-8 text-purple-400" /> Colecciones Destacadas</h1>
      <div className="flex flex-col gap-12">
        {cols.map((c, i) => {
           const filteredApps = apps?.filter(c.filter).slice(0, 5) || [];
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

export function EventsView({ apps, onAppClick }: { apps?: AppItem[], onAppClick?: (app: AppItem) => void }) {
  const newlyUpdated = apps?.filter(a => a.previous_versions && a.previous_versions.length > 0).slice(0, 3) || [];
  
  return (
    <div className="pt-24 px-6 max-w-5xl mx-auto pb-16">
      <h1 className="text-3xl font-black mb-8 text-nexus-text flex items-center gap-3"><Zap className="w-8 h-8 text-yellow-400" /> Eventos & Novedades</h1>
      <div className="space-y-6">
        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border-cyan-500/30 bg-cyan-500/5 relative overflow-hidden shadow-nexus-glow">
          <div className="absolute top-4 right-4 bg-red-500 text-nexus-text text-[10px] font-black px-3 py-1.5 uppercase rounded-lg animate-pulse tracking-widest shadow-lg shadow-red-500/20">{t("main.liveEvent") || "EVENTO EN VIVO"}</div>
          <h2 className="text-2xl font-black mb-3 text-cyan-400 drop-shadow-md">NexusPlay Developer Fest 2026</h2>
          <p className="text-nexus-text mb-6 max-w-xl text-lg leading-relaxed">Conoce las nuevas herramientas de desarrollo, actualizaciones de seguridad y el nuevo modelo Nexus AI para crear apps más rápido.</p>
          <button className="px-6 py-3 bg-cyan-500 text-nexus-bg font-black uppercase tracking-wider rounded-xl text-sm hover:bg-cyan-400 transition-colors shadow-nexus-glow">{t("main.exploreEvent") || "Explorar Evento"}</button>
        </div>

        {newlyUpdated.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-black text-nexus-text mb-6">Apps Recientemente Actualizadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {newlyUpdated.map(app => (
                 <div key={app.id} onClick={() => onAppClick?.(app)} className="glass-panel p-5 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-nexus-card transition-all hover:scale-[1.02]">
                    <img src={app.icon} className="w-12 h-12 rounded-[1rem] object-cover" />
                    <div>
                      <h4 className="font-bold text-nexus-text text-lg">{app.name}</h4>
                      <p className="text-nexus-cyan font-bold text-xs uppercase tracking-wider">Nueva v{app.version}</p>
                      <p className="text-nexus-text-sec text-xs mt-1 truncate max-w-[150px]">{app.changelog}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ... existing code ...
export function AchievementsView({ userProfile }: { userProfile?: any }) {
  const { t } = useAppStore();

  const xp = userProfile?.xp || 0;
  const level = Math.floor(xp / 1000) + 1;
  const nextLevelXp = level * 1000;
  const currentLevelXp = xp % 1000;
  const progressPercent = (currentLevelXp / 1000) * 100;

  let titleBadge = 'EXPLORADOR';
  if (level > 2) titleBadge = 'AVENTURERO';
  if (level > 5) titleBadge = 'ENTUSIASTA';
  if (level > 10) titleBadge = 'VETERANO';
  if (level > 20) titleBadge = 'LEYENDA';

  const reviewsDone = userProfile?.comments || 0;

  const missions = [
    { id: 1, title: 'Descarga apps', desc: 'Sigue instalando contenido del catálogo', xp: 50, progress: userProfile?.downloads || 0, maxProgress: 10, completed: false },
    { id: 2, title: 'Conviértete en Creador', desc: 'Usa el Panel Dev para subir un apk', xp: 500, progress: userProfile?.published_games > 0 ? 1 : 0, maxProgress: 1, completed: userProfile?.published_games > 0 },
    { id: 3, title: 'Comparte tu Opinión', desc: 'Deja una reseña en un juego o app', xp: 150, progress: reviewsDone, maxProgress: 1, completed: reviewsDone >= 1 },
  ];

  return (
    <div className="pt-24 px-4 sm:px-6 max-w-5xl mx-auto pb-16 space-y-12">
      <div className="text-center glass-panel p-8 rounded-[3rem] border-yellow-500/20 bg-gradient-to-tr from-nexus-bg to-yellow-900/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[100px] pointer-events-none" />
        <div className="w-28 h-28 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-yellow-500/20 group hover:scale-[1.02] transition-transform cursor-crosshair">
          <Trophy className="w-14 h-14 text-nexus-text drop-shadow-md group-hover:animate-bounce" />
        </div>
        <h1 className="text-4xl font-black mb-2 text-nexus-text">Nivel {level}</h1>
        <p className="text-nexus-text font-medium mb-8 max-w-lg mx-auto">Completando misiones y usando NexusPlay ganarás XP para desbloquear insignias y rangos exclusivos.</p>
        
        <div className="w-full h-5 bg-nexus-card rounded-full overflow-hidden max-w-2xl mx-auto mb-3 border border-nexus-border shadow-inner">
           <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 relative" style={{ width: `${progressPercent}%` }}>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay" />
           </div>
        </div>
        <p className="text-xs text-yellow-500 font-black uppercase tracking-widest">{currentLevelXp} / 1000 XP — rango actual: {titleBadge}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
           <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><Gamepad2 className="w-6 h-6 text-cyan-400" /> Misiones Activas</h2>
           <div className="space-y-4">
             {missions.map(mission => (
                <div key={mission.id} className={`glass-panel p-5 rounded-2xl border transition-all ${mission.completed ? 'border-green-500/30 bg-green-500/5 opacity-70' : 'border-nexus-border hover:border-cyan-500/30'}`}>
                   <div className="flex justify-between items-start mb-2">
                     <div>
                       <h3 className={`font-bold text-lg ${mission.completed ? 'text-green-400 line-through' : 'text-nexus-text'}`}>{mission.title}</h3>
                       <p className="text-xs text-nexus-text-sec font-medium">{mission.desc}</p>
                     </div>
                     <div className="flex items-center gap-1 font-black text-yellow-500 text-sm px-2 py-1 bg-yellow-500/10 rounded-lg">
                       <Zap className="w-3 h-3" /> {mission.xp} XP
                     </div>
                   </div>
                   
                   {!mission.completed && mission.maxProgress && (
                     <div className="mt-4">
                       <div className="flex justify-between text-[10px] font-bold text-nexus-text-sec mb-1">
                         <span>Progreso</span>
                         <span>{mission.progress} / {mission.maxProgress}</span>
                       </div>
                       <div className="w-full h-1.5 bg-nexus-surface rounded-full overflow-hidden">
                         <div className="h-full bg-cyan-400" style={{ width: `${(mission.progress / mission.maxProgress) * 100}%` }} />
                       </div>
                     </div>
                   )}
                </div>
             ))}
           </div>
        </div>

        <div>
           <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><Star className="w-6 h-6 text-purple-400" /> Insignias Coleccionables</h2>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
             <div className="glass-panel p-4 rounded-3xl border-cyan-500/30 bg-gradient-to-br from-cyan-900/30 to-transparent flex flex-col items-center justify-center text-center group cursor-pointer">
               <Compass className="w-8 h-8 text-cyan-400 mb-2 group-hover:rotate-180 transition-all duration-700" />
               <span className="text-[10px] font-black uppercase tracking-widest text-cyan-200">Pionero</span>
             </div>
             <div className="glass-panel p-4 rounded-3xl border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-transparent flex flex-col items-center justify-center text-center group cursor-pointer">
               <ShieldCheck className="w-8 h-8 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
               <span className="text-[10px] font-black uppercase tracking-widest text-purple-200">Verificado</span>
             </div>
             
             {[1,2,3,4].map(idx => (
                <div key={idx} className="glass-panel p-4 rounded-3xl border-nexus-border opacity-50 grayscale flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-nexus-card rounded-full flex items-center justify-center mb-2">
                     <Star className="w-5 h-5 text-nexus-text-sec" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-nexus-text-sec">Bloqueado</span>
                </div>
             ))}
           </div>
           
           <div className="mt-8 glass-panel p-6 rounded-3xl border-pink-500/20 bg-pink-500/5">
             <h3 className="font-bold text-pink-400 mb-2">Rangos Futuros</h3>
             <p className="text-xs text-nexus-text-sec leading-relaxed">A medida que obtengas XP, podrás desbloquear roles de comunidad como Moderador, Creador Elite, y Testeador Beta.</p>
           </div>
        </div>
      </div>
    </div>
  );
}

export function SearchView({ onAppClick, onBack, initialQuery = '' }: { apps?: AppItem[], onAppClick?: (app: AppItem) => void, onBack?: () => void, initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<AppItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    async function searchSupabase() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setHasSearched(true);
      
      const searchTerm = `%${debouncedQuery}%`;
      console.log(`[Buscador NexusPlay] Iniciando búsqueda con término original: "${debouncedQuery}"`);
      console.log(`[Buscador NexusPlay] Consulta construida (ilike): ${searchTerm}`);
      console.log(`[Buscador NexusPlay] Columnas a buscar: app_name, company_name, category, description`);

      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .eq('status', 'published')
        .or(`app_name.ilike.${searchTerm},company_name.ilike.${searchTerm},category.ilike.${searchTerm},description.ilike.${searchTerm}`);

      if (error) {
         console.error(`[Buscador NexusPlay] ERROR EXACTO de Supabase:`, error);
      } else if (data) {
         console.log(`[Buscador NexusPlay] Resultados encontrados: ${data.length}`);
         const mapped = data.map(d => ({
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
            date: d.created_at
         }));
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
        >
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
                  <img src={app.icon} className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] object-cover shadow-sm border border-nexus-border group-hover:scale-105 transition-transform" />
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
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}} />
    </motion.div>
  );
}


