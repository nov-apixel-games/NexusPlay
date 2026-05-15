import { useState } from 'react';
import { Gamepad2, Compass, Trophy, Star, ShieldCheck, Download, Layers, Settings, User, Search } from 'lucide-react';
import { motion } from 'motion/react';
import AppGrid, { AppCard } from '../AppGrid';
import { AppItem, Category } from '../../types';
import { CATEGORIES } from '../../data';

export function GamesView({ apps }: { apps: AppItem[] }) {
  const gameApps = apps.filter(a => a.category.toLowerCase() === 'juegos' || a.category.toLowerCase() === 'acción' || a.category.toLowerCase() === 'aventura' || a.category.toLowerCase() === 'estrategia');
  
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'downloads'|'rating'>('downloads');

  const filtered = gameApps
    .filter(a => activeCategory === 'Todos' || a.category.toLowerCase() === activeCategory.toLowerCase())
    .sort((a, b) => {
      if(sortBy === 'downloads') return parseInt(b.downloads.replace(/[^0-9]/g, '')) - parseInt(a.downloads.replace(/[^0-9]/g, ''));
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
        {filtered.map(app => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}

export function ExploreView({ apps }: { apps: AppItem[] }) {
  const recommended = apps.slice(0, 4);
  const trends = apps.slice().sort((a, b) => b.rating - a.rating).slice(0, 4);

  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto pb-16 space-y-12">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3 mb-6"><Compass className="w-8 h-8 text-purple-400" /> Descubrir</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 md:p-8 rounded-3xl border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
            <h2 className="text-2xl font-bold mb-2 relative z-10 w-2/3">Top Recomendaciones para ti</h2>
            <p className="text-gray-400 text-sm mb-6 relative z-10 w-2/3">Basado en tu historial de descargas e intereses actuales.</p>
            <button className="px-5 py-2 bg-cyan-500 text-black font-bold rounded-xl text-sm relative z-10 hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20">Ver Lista</button>
            <Compass className="absolute -bottom-10 -right-10 w-48 h-48 text-cyan-500/10 group-hover:scale-110 transition-transform" />
          </div>
          <div className="glass-panel p-6 md:p-8 rounded-3xl border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent relative overflow-hidden group hover:border-purple-500/40 transition-colors">
            <h2 className="text-2xl font-bold mb-2 relative z-10 w-2/3">Tendencias Semanales</h2>
            <p className="text-gray-400 text-sm mb-6 relative z-10 w-2/3">Lo más popular y descargado por la comunidad esta semana.</p>
            <button className="px-5 py-2 bg-purple-500 text-white font-bold rounded-xl text-sm relative z-10 hover:scale-105 transition-transform shadow-lg shadow-purple-500/20">Explorar</button>
            <Star className="absolute -bottom-10 -right-10 w-48 h-48 text-purple-500/10 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-6">Selección Inteligente</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
          {recommended.map(app => <AppCard key={app.id} app={app} />)}
        </div>
      </div>
    </div>
  );
}

export function RankingView({ apps }: { apps: AppItem[] }) {
  const sortedByDownloads = apps.slice().sort((a, b) => parseInt(b.downloads.replace(/[^0-9]/g, '')) - parseInt(a.downloads.replace(/[^0-9]/g, '')));
  
  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-16">
      <h1 className="text-3xl font-black flex items-center gap-3 mb-8"><Trophy className="w-8 h-8 text-yellow-400" /> Ranking Global</h1>
      
      <div className="space-y-3">
        {sortedByDownloads.map((app, idx) => (
          <div key={app.id} className="glass-panel p-4 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors bg-white/5">
            <div className={`w-8 font-black text-xl text-center ${idx===0 ? 'text-yellow-400' : idx===1 ? 'text-gray-300' : idx===2 ? 'text-orange-400' : 'text-gray-500'}`}>
              #{idx + 1}
            </div>
            <img src={app.icon} alt={app.name} className="w-14 h-14 rounded-xl object-cover bg-white/10" />
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
  if (!session) {
    return (
      <div className="pt-24 px-6 max-w-3xl mx-auto pb-16 flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-gray-500" />
        </div>
        <h1 className="text-3xl font-black">Tu Cuenta Nexus</h1>
        <p className="text-gray-400 max-w-sm">Inicia sesión o regístrate para acceder a tus descargas, guardar favoritos y sincronizar tu progreso en los juegos.</p>
        <button 
          onClick={onLoginClick}
          className="mt-4 px-8 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
        >
          Iniciar sesión / Registrarse
        </button>
      </div>
    );
  }

  const username = userProfile?.username || session.user?.email?.split('@')[0] || 'Usuario';
  const email = session.user?.email || '';
  const isAdmin = userProfile?.role === 'admin';
  const isDeveloper = userProfile?.role === 'developer' || isAdmin;
  const initial = username.charAt(0).toUpperCase();

  return (
    <div className="pt-24 px-6 max-w-3xl mx-auto pb-16 space-y-8">
      <div className="glass-panel p-8 rounded-3xl border-white/5 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-1">
          <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-3xl font-black">{initial}</div>
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
            <h1 className="text-2xl font-black">{username}</h1>
            <div className="flex gap-2">
              <div className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20 uppercase">Verificado</div>
              {isAdmin && (
                <div className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20 uppercase">Admin</div>
              )}
              {isDeveloper && !isAdmin && (
                <div className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20 uppercase">Dev</div>
              )}
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-4">{email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border-white/5 hover:border-white/10 transition-colors">
          <h3 className="font-bold mb-2 flex items-center gap-2"><Settings className="w-5 h-5 text-gray-400" /> Configuración</h3>
          <p className="text-sm text-gray-400 mb-4">Actualiza tus contraseñas y preferencias de notificaciones.</p>
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors">Administrar</button>
        </div>
        
        {/* Sección de Desarrollador */}
        <div className="glass-panel p-6 rounded-3xl border-white/5 hover:border-cyan-500/20 transition-all bg-gradient-to-br from-transparent to-cyan-500/5">
           <h3 className="font-bold mb-2 flex items-center gap-2">
            <Layers className={`w-5 h-5 ${isDeveloper ? 'text-cyan-400' : 'text-gray-500'}`} /> 
            {isDeveloper ? 'Panel Desarrollador' : 'Programa de Desarrolladores'}
          </h3>
           <p className="text-sm text-gray-400 mb-4">
            {isDeveloper 
              ? 'Sube nuevos juegos, gestiona tus aplicaciones publicadas y revisa estadísticas.' 
              : 'Únete a nuestra comunidad y publica tus propios juegos y aplicaciones.'}
          </p>
           <button 
             onClick={() => onDeveloperAction?.(isDeveloper ? 'open' : 'activate')}
             className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isDeveloper ? 'bg-cyan-500 text-black hover:bg-cyan-400' : 'bg-white/10 hover:bg-white/20 text-white'}`}
           >
             {isDeveloper ? 'Ir al Panel' : 'Activar Ahora'}
           </button>
        </div>

        <div className="glass-panel p-6 rounded-3xl border-white/5 hover:border-white/10 transition-colors">
           <h3 className="font-bold mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-400" /> Seguridad</h3>
           <p className="text-sm text-gray-400 mb-4">Gestiona las sesiones activas y la seguridad de tu cuenta.</p>
           <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors">Seguridad</button>
        </div>
      </div>
    </div>
  );
}

export function DownloadsView({ apps }: { apps: AppItem[] }) {
  const downloaded = apps.slice(1, 4); // Mock data

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black flex items-center gap-3"><Download className="w-8 h-8 text-cyan-400" /> Mis Descargas</h1>
        <button className="text-sm text-red-400 hover:text-red-300 font-bold transition-colors">Limpiar Historial</button>
      </div>

      <div className="space-y-4">
        {downloaded.map(app => (
          <div key={app.id} className="glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors border-white/5">
            <img src={app.icon} className="w-16 h-16 rounded-xl" alt="" />
            <div className="flex-1 min-w-0">
               <h3 className="font-bold text-lg text-white truncate">{app.name}</h3>
               <p className="text-xs text-gray-400">Descargado hace 2 días</p>
            </div>
            <button className="hidden sm:block px-4 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 font-bold rounded-xl text-sm transition-colors">Descargar de nuevo</button>
            <button className="sm:hidden p-2 bg-cyan-500/10 text-cyan-400 rounded-xl"><Download className="w-5 h-5"/></button>
          </div>
        ))}
        {downloaded.length === 0 && <p className="text-gray-500 text-center py-10">No tienes descargas recientes.</p>}
      </div>
    </div>
  );
}

export function CollectionsView() {
  const cols = [
    { title: 'Juegos de Terror 2026', desc: 'Sustos garantizados para jugar a oscuras', color: 'from-purple-900 to-black' },
    { title: 'Productividad Extrema', desc: 'Organiza tu vida entera con estas apps', color: 'from-blue-900 to-cyan-900' },
  ];
  return (
    <div className="pt-24 px-6 max-w-5xl mx-auto pb-16">
      <h1 className="text-3xl font-black flex items-center gap-3 mb-8"><Layers className="w-8 h-8 text-purple-400" /> Colecciones</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cols.map((c, i) => (
          <div key={i} className={`p-8 rounded-3xl bg-gradient-to-br ${c.color} border border-white/10 hover:scale-[1.02] cursor-pointer transition-transform shadow-2xl`}>
             <h2 className="text-2xl font-black mb-2">{c.title}</h2>
             <p className="text-gray-300 mb-6">{c.desc}</p>
             <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold backdrop-blur-md transition-colors">Explorar Colección</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EventsView() {
  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-16">
      <h1 className="text-3xl font-black mb-8 text-white">Eventos & Lanzamientos</h1>
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-3xl border-cyan-500/30 bg-cyan-500/5 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-2 py-1 uppercase rounded-md animate-pulse">EN VIVO</div>
          <h2 className="text-xl font-bold mb-2 text-cyan-400">Torneo Global Free Fire</h2>
          <p className="text-gray-300 text-sm mb-4">Compite por 1M de NexusCoins en este evento especial de fin de semana.</p>
          <button className="px-5 py-2 bg-cyan-500 text-black font-bold rounded-xl text-sm hover:bg-cyan-400 transition-colors">Participar Ahora</button>
        </div>
      </div>
    </div>
  );
}

// ... existing code ...
export function AchievementsView() {
  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-16 text-center">
      <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Trophy className="w-12 h-12 text-yellow-500" />
      </div>
      <h1 className="text-3xl font-black mb-4">Logros & Nivel</h1>
      <p className="text-gray-400 mb-8">Sube de nivel descargando apps y jugando. Tienes nivel 15.</p>
      
      <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden max-w-md mx-auto mb-2">
         <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 w-[60%]"></div>
      </div>
      <p className="text-xs text-gray-500 font-bold mb-12">400 XP para el Nivel 16</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {[1,2,3,4].map(idx => (
           <div key={idx} className="glass-panel p-4 rounded-3xl border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
             <div className="w-12 h-12 bg-white/10 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Star className="w-6 h-6" />
             </div>
             <div className="text-xs font-bold text-center">Coleccionista</div>
           </div>
        ))}
      </div>
    </div>
  );
}

export function SearchView({ apps }: { apps: AppItem[] }) {
  const [query, setQuery] = useState('');
  const filtered = apps.filter(a => a.name.toLowerCase().includes(query.toLowerCase()) || a.developer.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase()));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pt-24 px-6 max-w-7xl mx-auto pb-24"
    >
      <div className="max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-black mb-6 flex items-center justify-center gap-3 tracking-tight"><Search className="w-8 h-8 text-cyan-500" /> Búsqueda Avanzada</h1>
        <div className="relative group">
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Juegos, aplicaciones, desarrolladores..." 
            className="w-full h-16 bg-[#050B14] border border-white/10 rounded-2xl pl-14 pr-6 text-xl text-white focus:outline-none focus:border-cyan-500 focus:bg-white/5 transition-all shadow-xl group-hover:border-white/20"
            autoFocus
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
        </div>
      </div>

      {query && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-400 font-medium">Resultados para <span className="text-white">"{query}"</span></p>
          <span className="text-sm font-bold bg-white/5 px-3 py-1 rounded-full text-cyan-400 border border-white/10">{filtered.length} encontrados</span>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
          {filtered.map(app => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#050B14] rounded-3xl border border-white/5">
          <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Sin resultados</h2>
          <p className="text-gray-400">No hemos encontrado nada que coincida con "{query}". Intenta con otros términos.</p>
        </div>
      )}
    </motion.div>
  );
}

