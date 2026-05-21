import { useState, useEffect } from 'react';
import { Gamepad2, Compass, Trophy, Star, ShieldCheck, Download, Layers, Settings, User, Search, Loader2, Zap, ArrowRight, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import AppGrid, { AppCard } from '../AppGrid';
import { AppItem, Category } from '../../types';
import { CATEGORIES } from '../../data';
import { supabase } from '../../lib/supabase';

export function GamesView({ apps, onAppClick }: { apps: AppItem[], onAppClick?: (app: AppItem) => void }) {
  const gameApps = apps.filter(a => a.category.toLowerCase() === 'juegos' || a.category.toLowerCase() === 'acción' || a.category.toLowerCase() === 'aventura' || a.category.toLowerCase() === 'estrategia');
  
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'downloads'|'rating'>('downloads');

  const getDownloadsNum = (d: any) => {
    if (typeof d === 'number') return d;
    if (typeof d === 'string') return parseInt(d.replace(/[^0-9]/g, '')) || 0;
    return 0;
  };

  const filtered = gameApps
    .filter(a => activeCategory === 'Todos' || a.category.toLowerCase() === activeCategory.toLowerCase())
    .sort((a, b) => {
      if(sortBy === 'downloads') return getDownloadsNum(b.downloads) - getDownloadsNum(a.downloads);
      return b.rating - a.rating;
    });

  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black flex items-center gap-3"><Gamepad2 className="w-8 h-8 text-cyan-400" /> Catálogo de Juegos</h1>
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
          <button onClick={() => setSortBy('downloads')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${sortBy==='downloads'?'bg-white/10 text-white':'text-gray-400 hover:text-white'}`}>Populares</button>
          <button onClick={() => setSortBy('rating')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${sortBy==='rating'?'bg-white/10 text-white':'text-gray-400 hover:text-white'}`}>Mejor Valorados</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {['Todos', 'Acción', 'Aventura', 'Estrategia', 'RPG', 'Deportes'].map(cat => (
          <button key={cat} onClick={()=>setActiveCategory(cat)} className={`px-4 py-2 shrink-0 rounded-full text-sm font-bold border transition-colors ${activeCategory===cat ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-white/5 text-gray-300 border-white/10 hover:border-cyan-500/50'}`}>
            {cat}
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
  const getDownloadsNum = (d: any) => {
    if (typeof d === 'number') return d;
    if (typeof d === 'string') return parseInt(d.replace(/[^0-9]/g, '')) || 0;
    return 0;
  };

  const [activeTab, setActiveTab] = useState<'feed' | 'packs'>('feed');

  // Mock social feed data
  const feedItems = [
    { id: 1, type: 'new_app', user: 'Nexus Devs', avatar: 'https://res.cloudinary.com/dpp9889/image/upload/v1/logos/nexus_logo.png', content: '¡Hemos lanzado una nueva actualización de la plataforma!', time: 'Hace 2 horas', likes: 124 },
    { id: 2, type: 'pack', user: 'GamerPro99', avatar: '', content: 'He creado un nuevo Pack para celulares de gama baja. ¡Corre a 60fps asegurado!', time: 'Hace 5 horas', likes: 89, packName: 'Low-End Survival' },
    { id: 3, type: 'community', user: 'IndieGames', avatar: '', content: 'Nuestra comunidad superó los 10,000 miembros. Únete si amas los juegos independientes.', time: 'Ayer', likes: 256 },
  ];

  // Mock packs
  const packs = [
    { id: '1', name: 'Pack Supervivencia', desc: 'Los mejores juegos de supervivencia offline', creator: 'NexusTeam', likes: 540, apps: apps.slice(0, 4), banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2800' },
    { id: '2', name: 'Low-End Android', desc: 'Juegos súper ligeros para celulares de gama baja (< 1GB RAM)', creator: 'GamerPro99', likes: 320, apps: apps.slice(1, 5), banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2800' },
  ];

  const trends = apps.slice().sort((a, b) => getDownloadsNum(b.downloads) - getDownloadsNum(a.downloads)).slice(0, 4);

  return (
    <div className="pt-24 px-4 sm:px-6 max-w-7xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black flex items-center gap-3"><Compass className="w-8 h-8 text-cyan-400" /> Descubrir</h1>
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
          <button onClick={() => setActiveTab('feed')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab==='feed'?'bg-white/10 text-white':'text-gray-400 hover:text-white'}`}>Feed Social</button>
          <button onClick={() => setActiveTab('packs')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab==='packs'?'bg-white/10 text-white':'text-gray-400 hover:text-white'}`}>Packs y Colecciones</button>
        </div>
      </div>

      {activeTab === 'feed' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {feedItems.map(item => (
              <div key={item.id} className="glass-panel p-5 sm:p-6 rounded-3xl border-white/5 hover:border-cyan-500/30 transition-all bg-[#0a0c14]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-900 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                    {item.avatar ? <img src={item.avatar} className="w-full h-full object-cover" /> : item.user[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-tight flex items-center gap-2">
                      {item.user}
                      {item.user === 'Nexus Devs' && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
                    </h3>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </div>
                <p className="text-gray-300 font-medium mb-4">{item.content}</p>
                {item.type === 'pack' && (
                  <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border border-white/10 cursor-pointer hover:scale-[1.02] transition-transform">
                    <h4 className="font-black text-white text-lg flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-400"/> {item.packName}</h4>
                    <p className="text-xs text-cyan-200/70 mt-1">Ver aplicaciones del pack →</p>
                  </div>
                )}
                {item.type === 'new_app' && apps[0] && (
                  <div className="mb-4" onClick={() => onAppClick?.(apps[0])}>
                    <AppCard app={apps[0]} onClick={() => onAppClick?.(apps[0])} />
                  </div>
                )}
                <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                  <button className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-red-400 transition-colors">
                    <Heart className="w-4 h-4" /> {item.likes}
                  </button>
                  <button onClick={() => onAction?.('nexus-hub')} className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-cyan-400 transition-colors">
                    💬 Comentar
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent">
              <h2 className="font-black mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400"/> Tendencias del Día</h2>
              <div className="space-y-3">
                {trends.map((app, idx) => (
                   <div key={app.id} onClick={() => onAppClick?.(app)} className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-6 font-black text-gray-500 group-hover:text-cyan-400 transition-colors">#{idx+1}</div>
                      <img src={app.icon} className="w-10 h-10 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                         <p className="text-sm font-bold text-white truncate">{app.name}</p>
                         <p className="text-[10px] text-gray-400 uppercase tracking-widest">{app.category}</p>
                      </div>
                   </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent">
              <h2 className="font-black mb-1">Nexus AI <span className="px-2 py-0.5 ml-2 bg-cyan-500 text-black text-[9px] uppercase tracking-widest rounded-lg">Inteligencia</span></h2>
              <p className="text-xs text-gray-400 mb-4 mb-4">¿No sabes a qué jugar o qué pack descargar? Pregúntale a Nexus AI.</p>
              <button onClick={() => onAction?.('nexus-ai')} className="w-full py-2 bg-white/10 hover:bg-cyan-500 hover:text-black font-bold text-sm rounded-xl transition-all">Consultar IA</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {packs.map(pack => (
             <div key={pack.id} className="glass-panel rounded-[2rem] overflow-hidden border-white/5 shadow-2xl relative group">
                <div className="h-48 sm:h-64 relative w-full overflow-hidden">
                   <img src={pack.banner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60" />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c14] to-transparent" />
                   <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                       <Heart className="w-4 h-4 text-red-500" />
                       <span className="text-xs font-bold">{pack.likes}</span>
                   </div>
                </div>
                <div className="p-6 sm:p-8 relative z-10 -mt-20">
                   <h2 className="text-3xl font-black text-white drop-shadow-md mb-2">{pack.name}</h2>
                   <p className="text-gray-300 font-medium max-w-2xl text-sm sm:text-base leading-relaxed mb-6">{pack.desc}</p>
                   
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {pack.apps.map(app => (
                        <div key={app.id} onClick={() => onAppClick?.(app)} className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors">
                           <img src={app.icon} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                           <div className="min-w-0">
                              <h4 className="font-bold text-sm text-white truncate">{app.name}</h4>
                              <p className="text-xs text-gray-400 capitalize truncate">{app.category}</p>
                           </div>
                        </div>
                     ))}
                   </div>
                   
                   <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center font-bold text-xs">{pack.creator[0]}</div>
                        <span className="text-sm font-bold text-gray-300">Creado por {pack.creator}</span>
                      </div>
                      <button onClick={() => alert("Función de Guardar Pack en desarrollo")} className="px-6 py-2 bg-white/10 hover:bg-cyan-500 hover:text-black font-bold rounded-xl transition-colors text-sm">
                        Compartir Pack
                      </button>
                   </div>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RankingView({ apps, onAppClick }: { apps: AppItem[], onAppClick?: (app: AppItem) => void }) {
  const getDownloadsNum = (d: any) => {
    if (typeof d === 'number') return d;
    if (typeof d === 'string') return parseInt(d.replace(/[^0-9]/g, '')) || 0;
    return 0;
  };
  const sortedByDownloads = apps.slice().sort((a, b) => getDownloadsNum(b.downloads) - getDownloadsNum(a.downloads)).slice(0, 100);
  
  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-16">
      <h1 className="text-3xl font-black flex items-center gap-3 mb-8"><Trophy className="w-8 h-8 text-yellow-400" /> Ranking Global</h1>
      
      <div className="space-y-3">
        {sortedByDownloads.map((app, idx) => (
          <div key={app.id} onClick={() => onAppClick?.(app)} className="glass-panel p-4 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors bg-white/5 cursor-pointer">
            <div className={`w-8 font-black text-xl text-center ${idx===0 ? 'text-yellow-400' : idx===1 ? 'text-gray-300' : idx===2 ? 'text-orange-400' : 'text-gray-500'}`}>
              #{idx + 1}
            </div>
            <img src={app.icon} alt={app.name} className="w-12 h-12 rounded-[1rem] object-cover bg-white/10 shadow-sm" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-white truncate">{app.name}</h3>
              <p className="text-xs text-gray-400 truncate">{app.developer}</p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-sm font-bold text-white"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/> {app.rating}</div>
              <div className="text-xs text-gray-500 font-medium">{app.downloads} descargas</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileView({ session, userProfile, onLoginClick, onDeveloperAction }: { 
  session?: any, 
  userProfile?: any, 
  onLoginClick?: () => void,
  onDeveloperAction?: (action: 'activate' | 'open') => void 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default values combining DB and metadata
  const metadata = session?.user?.user_metadata || {};

  useEffect(() => {
    if (userProfile || session) {
      setUsername(userProfile?.username || session?.user?.email?.split('@')[0] || 'Usuario');
      setRealName(userProfile?.real_name || metadata.full_name || '');
      setAvatarUrl(userProfile?.avatar_url || metadata.avatar_url || '');
      setBio(metadata.bio || '');
    }
  }, [userProfile, session]);

  if (!session) {
    return (
      <div className="pt-24 px-6 max-w-3xl mx-auto pb-16 flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-gray-500" />
        </div>
        <h1 className="text-3xl font-black">Tu Cuenta Nexus</h1>
        <p className="text-gray-400 max-w-sm">Inicia sesión o regístrate para acceder a tus descargas, guardar favoritos, crear packs y ganar experiencia en NexusPlay.</p>
        <button 
          onClick={onLoginClick}
          className="mt-4 px-8 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
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

      const { error: err1 } = await supabase
        .from('profiles')
        .update({ username: cleanUsername, real_name: realName, avatar_url: avatarUrl })
        .eq('id', session.user.id);
        
      updateErr = err1;

      if (err1 && err1.message && err1.message.includes('schema cache')) {
        const { error: err2 } = await supabase
          .from('profiles')
          .update({ username: cleanUsername, real_name: realName })
          .eq('id', session.user.id);
        updateErr = err2;
      }
        
      if (updateErr && updateErr.code !== '23505') {
         // Silently ignore schema cache errors if Auth updated correctly
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

  // Mock XP calculation
  const xp = metadata.xp || 1240;
  const level = Math.floor(xp / 1000) + 1;
  const nextLevelXp = level * 1000;
  const currentLevelXp = xp % 1000;
  const progressPercent = (currentLevelXp / 1000) * 100;

  return (
    <div className="pt-24 px-4 sm:px-6 max-w-4xl mx-auto pb-16 space-y-6 sm:space-y-8">
      {/* Profile Banner & Info */}
      <div className="glass-panel rounded-[2rem] border-white/5 overflow-hidden">
        <div className="h-32 sm:h-48 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 relative">
           <img src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=2800" className="w-full h-full object-cover opacity-30" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c14] to-transparent" />
        </div>
        
        <div className="p-4 sm:p-8 pt-0 relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-20">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] bg-gradient-to-tr from-cyan-400 to-purple-500 p-1 flex-shrink-0 shadow-2xl relative group">
            <div className="w-full h-full bg-[#0a0c14] rounded-[1.8rem] flex items-center justify-center text-4xl sm:text-5xl font-black overflow-hidden relative">
               {avatarUrl ? (
                 <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
               ) : (
                 <span>{initial}</span>
               )}
            </div>
            <div className="absolute -bottom-3 -right-3 bg-[#0a0c14] rounded-full p-1.5 shadow-xl border border-white/10">
               <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center font-black text-black text-xs">
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
                    <div className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] font-black border border-green-500/20 uppercase tracking-widest">Verificado</div>
                    {isAdmin && (
                      <div className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-black border border-amber-500/20 uppercase tracking-widest">Admin</div>
                    )}
                    {isDeveloper && !isAdmin && (
                      <div className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-black border border-cyan-500/20 uppercase tracking-widest">Dev</div>
                    )}
                  </div>
                </div>
                {realName && <p className="text-gray-300 font-medium mb-1 truncate text-sm sm:text-base">{realName}</p>}
                {bio ? (
                   <p className="text-gray-400 text-sm mb-4 max-w-lg italic">"{bio}"</p>
                ) : (
                   <p className="text-gray-500 text-xs sm:text-sm mb-4">Sin biografía establecida.</p>
                )}
                
                <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
                   <div className="text-center">
                     <div className="text-lg font-black text-white">0</div>
                     <div className="text-[10px] text-gray-500 uppercase tracking-widest">Packs</div>
                   </div>
                   <div className="w-[1px] h-6 bg-white/10" />
                   <div className="text-center">
                     <div className="text-lg font-black text-white">12</div>
                     <div className="text-[10px] text-gray-500 uppercase tracking-widest">Favs</div>
                   </div>
                </div>

                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  Editar Perfil Social
                </button>
              </>
            ) : (
              <div className="space-y-4 w-full bg-[#0a0c14]/50 p-6 rounded-2xl border border-white/5 backdrop-blur-md text-left">
                 {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium">{error}</div>}
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre de Usuario (Único)</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-cyan-500 focus:bg-black/80 transition-all font-medium" placeholder="usuario_123" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre Visible</label>
                    <input type="text" value={realName} onChange={e => setRealName(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-cyan-500 focus:bg-black/80 transition-all font-medium" placeholder="Tu Nombre Real" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Biografía corta</label>
                    <input type="text" value={bio} onChange={e => setBio(e.target.value)} maxLength={100} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-cyan-500 focus:bg-black/80 transition-all font-medium" placeholder="Amo los juegos Indie..." />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">URL de Avatar (Opcional)</label>
                    <input type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-cyan-500 focus:bg-black/80 transition-all font-medium" placeholder="https://..." />
                 </div>
                 <div className="flex items-center gap-3 pt-4">
                    <button onClick={handleSaveProfile} disabled={saving} className="flex-1 sm:flex-none px-6 py-2.5 bg-cyan-500 text-black font-black rounded-xl hover:bg-cyan-400 disabled:opacity-50 transition-colors">
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    <button onClick={() => {
                      setIsEditing(false); setError(null);
                      setUsername(userProfile?.username || ''); setRealName(userProfile?.real_name || '');
                      setAvatarUrl(userProfile?.avatar_url || ''); setBio(metadata.bio || '');
                    }} disabled={saving} className="px-6 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
                      Cancelar
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Nivel y XP */}
        <div className="glass-panel p-6 rounded-3xl border-white/5 bg-gradient-to-br from-yellow-900/10 to-transparent">
           <h3 className="font-black mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Progreso de Nivel</h3>
           <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl font-black text-yellow-500">{level}</div>
               <div className="flex-1">
                 <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">
                    <span>XP Actual</span>
                    <span>Nivel {level + 1}</span>
                 </div>
                 <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400" style={{ width: `${progressPercent}%` }} />
                 </div>
                 <div className="text-[10px] text-yellow-500/70 text-right mt-1 font-mono">
                    {currentLevelXp} / 1000 XP
                 </div>
               </div>
           </div>
           <p className="text-xs text-gray-400 font-medium leading-relaxed">Completa <span className="text-cyan-400 cursor-pointer hover:underline">Misiones de Comunidad</span> descargando apps y comentando en foros para ganar más XP.</p>
        </div>

        {/* Insignias / Badges */}
        <div className="glass-panel p-6 rounded-3xl border-white/5 col-span-1 md:col-span-2 bg-[#080910]">
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
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 border-dashed flex flex-col items-center justify-center opacity-50 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                 <Gamepad2 className="w-6 h-6 text-gray-500 mb-1" />
                 <span className="text-[8px] font-bold uppercase text-gray-500">?</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sección de Desarrollador */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-cyan-500/20 hover:border-cyan-500/40 transition-all bg-gradient-to-br from-black to-cyan-900/20 shadow-xl group">
           <h3 className="text-xl font-black mb-2 flex items-center gap-2">
            <Layers className={`w-6 h-6 ${isDeveloper ? 'text-cyan-400' : 'text-gray-400'}`} /> 
            {isDeveloper ? 'Espacio Creador' : 'Conviértete en Dev'}
          </h3>
           <p className="text-sm text-gray-300 mb-6 font-medium leading-relaxed max-w-xs">
            {isDeveloper 
              ? 'Abre tu panel para publicar nuevas obras, gestionar colecciones y revisar métricas.' 
              : 'Publica tus propias apps, construye tu comunidad y gana insignias únicas.'}
          </p>
           <button 
             onClick={() => onDeveloperAction?.(isDeveloper ? 'open' : 'activate')}
             className={`px-6 py-3 rounded-xl text-sm font-black transition-all shadow-lg active:scale-95 flex items-center gap-2 ${isDeveloper ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-cyan-500/20' : 'bg-white/10 hover:bg-white/20 text-white'}`}
           >
             {isDeveloper ? 'Ir a My Studio' : 'Activar Modo Creador'} <ArrowRight className="w-4 h-4" />
           </button>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-white/5 hover:border-white/10 transition-colors bg-[#080910]">
           <h3 className="text-xl font-black mb-2 flex items-center gap-2"><Settings className="w-6 h-6 text-gray-400" /> Configuración</h3>
           <p className="text-sm text-gray-400 mb-6 font-medium leading-relaxed max-w-xs">Ajusta preferencias de privacidad, seguridad de la cuenta y notificaciones.</p>
           <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-bold transition-colors">Abrir Ajustes</button>
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
              className={`glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors border-white/5 cursor-pointer relative overflow-hidden group ${hasUpdate ? 'border-green-500/30 bg-green-500/5' : ''}`}
            >
              {hasUpdate && (
                <div className="absolute top-0 right-0 py-1 px-3 bg-green-500 text-black text-[9px] font-black uppercase tracking-tighter rounded-bl-xl shadow-lg animate-pulse">
                  Actualización Disponibe
                </div>
              )}

              <img src={app.icon} className="w-12 h-12 rounded-[1rem] shadow-lg object-cover" alt={app.name} />
              <div className="flex-1 min-w-0">
                 <h3 className="font-bold text-lg text-white truncate">{app.name}</h3>
                 <div className="flex items-center gap-2 mt-1">
                   <span className="text-xs text-gray-500">v{installedVersion || '1.0'}</span>
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
                  <button className="px-4 py-2 bg-green-500 text-black font-black rounded-xl text-xs hover:bg-green-400 transition-all flex items-center gap-2">
                    <Zap className="w-4 h-4" /> ACTUALIZAR
                  </button>
                ) : (
                  <>
                    <button className="hidden sm:block px-4 py-2 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white font-bold rounded-xl text-sm transition-colors border border-white/5">Instalar de nuevo</button>
                    <button className="sm:hidden p-2 bg-white/5 text-gray-400 rounded-xl border border-white/5"><Download className="w-5 h-5"/></button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {downloadedApps.length === 0 && (
          <div className="text-center py-20 px-6 bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
            <div className="w-20 h-20 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <Download className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No tienes descargas recientes</h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">Explora nuestro catálogo y empieza a descargar los mejores juegos y aplicaciones.</p>
            <button 
              onClick={() => window.location.hash = ''} 
              className="mt-8 px-6 py-2 bg-nexus-cyan text-black font-black rounded-xl hover:scale-105 transition-all text-xs uppercase"
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
              <div className={`p-8 rounded-[2rem] bg-gradient-to-br ${c.color} border border-white/10 shadow-2xl mb-6`}>
                 <h2 className="text-3xl font-black mb-2">{c.title}</h2>
                 <p className="text-gray-300 font-medium">{c.desc}</p>
              </div>
              {filteredApps.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-3 gap-y-5">
                   {filteredApps.map(app => (
                     <AppCard key={app.id} app={app} onClick={() => onAppClick?.(app)} />
                   ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm px-4">No hay aplicaciones en esta colección todavía.</p>
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
      <h1 className="text-3xl font-black mb-8 text-white flex items-center gap-3"><Zap className="w-8 h-8 text-yellow-400" /> Eventos & Novedades</h1>
      <div className="space-y-6">
        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border-cyan-500/30 bg-cyan-500/5 relative overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.1)]">
          <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 uppercase rounded-lg animate-pulse tracking-widest shadow-lg shadow-red-500/20">EVENTO EN VIVO</div>
          <h2 className="text-2xl font-black mb-3 text-cyan-400 drop-shadow-md">NexusPlay Developer Fest 2026</h2>
          <p className="text-gray-300 mb-6 max-w-xl text-lg leading-relaxed">Conoce las nuevas herramientas de desarrollo, actualizaciones de seguridad y el nuevo modelo Nexus AI para crear apps más rápido.</p>
          <button className="px-6 py-3 bg-cyan-500 text-black font-black uppercase tracking-wider rounded-xl text-sm hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(34,211,238,0.3)]">Explorar Evento</button>
        </div>

        {newlyUpdated.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-black text-white mb-6">Apps Recientemente Actualizadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {newlyUpdated.map(app => (
                 <div key={app.id} onClick={() => onAppClick?.(app)} className="glass-panel p-5 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-all hover:scale-[1.02]">
                    <img src={app.icon} className="w-12 h-12 rounded-[1rem] object-cover" />
                    <div>
                      <h4 className="font-bold text-white text-lg">{app.name}</h4>
                      <p className="text-nexus-cyan font-bold text-xs uppercase tracking-wider">Nueva v{app.version}</p>
                      <p className="text-gray-400 text-xs mt-1 truncate max-w-[150px]">{app.changelog}</p>
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
export function AchievementsView() {
  const missions = [
    { id: 1, title: 'Descarga tu primera app', desc: 'Prueba algo nuevo del catálogo', xp: 100, progress: 100, completed: true },
    { id: 2, title: 'Conviértete en Creador', desc: 'Usa el Panel Dev para subir un apk', xp: 500, progress: 0, completed: false },
    { id: 3, title: 'Únete a la Comunidad', desc: 'Vincula una cuenta real de correo', xp: 200, progress: 200, completed: true },
    { id: 4, title: 'Dale like a 5 Packs', desc: 'Apoya el contenido de otros usuarios', xp: 150, progress: 3, maxProgress: 5, completed: false },
    { id: 5, title: 'Comentar en Foro Nexus', desc: 'Inicia o participa en un tema', xp: 300, progress: 0, completed: false },
  ];

  return (
    <div className="pt-24 px-4 sm:px-6 max-w-5xl mx-auto pb-16 space-y-12">
      <div className="text-center glass-panel p-8 rounded-[3rem] border-yellow-500/20 bg-gradient-to-tr from-[#0a0c14] to-yellow-900/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[100px] pointer-events-none" />
        <div className="w-28 h-28 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-yellow-500/20 group hover:scale-[1.02] transition-transform cursor-crosshair">
          <Trophy className="w-14 h-14 text-white drop-shadow-md group-hover:animate-bounce" />
        </div>
        <h1 className="text-4xl font-black mb-2 text-white">Nivel 15</h1>
        <p className="text-gray-300 font-medium mb-8 max-w-lg mx-auto">Completando misiones y usando NexusPlay ganarás XP para desbloquear insignias y rangos exclusivos.</p>
        
        <div className="w-full h-5 bg-[#080910] rounded-full overflow-hidden max-w-2xl mx-auto mb-3 border border-white/5 shadow-inner">
           <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 w-[60%] relative">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay" />
           </div>
        </div>
        <p className="text-xs text-yellow-500 font-black uppercase tracking-widest">600 / 1000 XP — rango actual: EXPLORADOR</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
           <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><Gamepad2 className="w-6 h-6 text-cyan-400" /> Misiones Activas</h2>
           <div className="space-y-4">
             {missions.map(mission => (
                <div key={mission.id} className={`glass-panel p-5 rounded-2xl border transition-all ${mission.completed ? 'border-green-500/30 bg-green-500/5 opacity-70' : 'border-white/5 hover:border-cyan-500/30'}`}>
                   <div className="flex justify-between items-start mb-2">
                     <div>
                       <h3 className={`font-bold text-lg ${mission.completed ? 'text-green-400 line-through' : 'text-white'}`}>{mission.title}</h3>
                       <p className="text-xs text-gray-400 font-medium">{mission.desc}</p>
                     </div>
                     <div className="flex items-center gap-1 font-black text-yellow-500 text-sm px-2 py-1 bg-yellow-500/10 rounded-lg">
                       <Zap className="w-3 h-3" /> {mission.xp} XP
                     </div>
                   </div>
                   
                   {!mission.completed && mission.maxProgress && (
                     <div className="mt-4">
                       <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                         <span>Progreso</span>
                         <span>{mission.progress} / {mission.maxProgress}</span>
                       </div>
                       <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
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
                <div key={idx} className="glass-panel p-4 rounded-3xl border-white/5 opacity-50 grayscale flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-2">
                     <Star className="w-5 h-5 text-gray-500" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Bloqueado</span>
                </div>
             ))}
           </div>
           
           <div className="mt-8 glass-panel p-6 rounded-3xl border-pink-500/20 bg-pink-500/5">
             <h3 className="font-bold text-pink-400 mb-2">Rangos Futuros</h3>
             <p className="text-xs text-gray-400 leading-relaxed">A medida que obtengas XP, podrás desbloquear roles de comunidad como Moderador, Creador Elite, y Testeador Beta.</p>
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
      <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-nexus-bg/90 backdrop-blur-xl shrink-0 pt-8 sm:pt-4">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar apps y juegos" 
            className="w-full bg-transparent border-none text-white text-lg font-medium focus:outline-none focus:ring-0 placeholder-gray-500"
            autoFocus
          />
        </div>
        {query && (
           <button 
             onClick={() => { setQuery(''); setDebouncedQuery(''); setResults([]); setHasSearched(false); }} 
             className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
           </button>
        )}
      </div>

      {/* Main Search Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-white/[0.02] to-transparent relative">
        {isLoading && (
           <div className="absolute top-0 left-0 w-full h-[3px] overflow-hidden bg-white/5">
             <div className="h-full bg-cyan-500 animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '30%' }}></div>
           </div>
        )}

        <div className="max-w-3xl mx-auto p-4 pb-24">
          
          {/* Default State (No Query) */}
          {!hasSearched && query.length === 0 && (
             <div className="mt-8">
               <h3 className="text-sm font-bold text-gray-400 px-2 py-4 mb-2 uppercase tracking-wider">Descubre</h3>
               <div className="flex flex-wrap gap-2 px-2">
                 {['Juegos de acción', 'Minecraft', 'Herramientas', 'Estilo de vida', 'Aventura'].map(tag => (
                   <button 
                     key={tag}
                     onClick={() => setQuery(tag)}
                     className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-full text-sm font-semibold text-gray-300 transition-all"
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
              <div className="px-2 pb-4 text-sm font-bold text-gray-400">
                Resultados para "{debouncedQuery}"
              </div>
              {results.map(app => (
                <div 
                   key={app.id} 
                   onClick={() => onAppClick?.(app)} 
                   className="flex items-center gap-4 bg-transparent hover:bg-white/5 rounded-2xl p-3 cursor-pointer transition-colors group"
                >
                  <img src={app.icon} className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] object-cover shadow-sm border border-white/5 group-hover:scale-105 transition-transform" />
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight truncate mb-0.5">{app.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 truncate mb-1">
                      {app.developer}
                    </p>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1">
                          <span className="font-bold text-gray-300 text-[10px] sm:text-xs">{app.rating}</span>
                          <Star className="w-3 h-3 text-gray-400 fill-gray-400 group-hover:text-yellow-500 group-hover:fill-yellow-500 transition-colors" />
                       </div>
                       <span className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded border border-white/10">{app.category}</span>
                       <span className="text-[10px] text-gray-500">{app.size}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results State */}
          {!isLoading && hasSearched && results.length === 0 && (
            <div className="text-center py-20 px-6">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Search className="w-10 h-10 text-gray-600" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No encontramos resultados</h2>
              <p className="text-gray-400 text-sm">Intenta otro nombre o revisa la ortografía</p>
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


