import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Users, Plus, Hash, Settings, MoreVertical, 
  Trash2, X, Send, Pin, Shield, AlertTriangle, UserMinus, Search, Menu, ChevronLeft, Image as ImageIcon,
  Activity, Clock, Smile, Volume2, Lock, Bot, Compass, Flame, Star, Sparkles, Gamepad2, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../lib/cloudinary';
import { motion, AnimatePresence } from 'motion/react';
import { UserItem } from '../types';

interface NexusHubProps {
  session: any;
  userProfile: any;
  onBack: () => void;
}

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url?: string;
  creator_id: string;
  created_at: string;
}

interface Message {
  id: string;
  community_id: string;
  user_id: string;
  content: string;
  is_pinned: boolean;
  deleted: boolean;
  deleted_by_admin: boolean;
  created_at: string;
  profiles: { username: string; avatar_url: string; role: string };
  temp_id?: string; // For optimistic UI
}

export default function NexusHub({ session, userProfile, onBack }: NexusHubProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
       document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [activeCommunity]); // Re-fetch when going back to list

  const fetchCommunities = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('communities').select('*').order('name');
    
    if (error && error.code === '42P01') {
      console.error("🚨 TABLA INEXISTENTE DETECTADA (42P01) 🚨");
      setTableError(true);
      setIsLoading(false);
      return;
    }
    if (error) {
      console.error("Error cargando comunidades:", error);
      setIsLoading(false);
      return;
    }
    
    if (data) {
      setCommunities(data);
    }
    setIsLoading(false);
  };

  const deleteCommunity = async (commId: string, isCorrupt?: boolean) => {
    const community = communities.find(c => c.id === commId);
    if (!community) return;
    
    // Admins can delete anything. Local users can delete their own communities or corrupt ones if they own them.
    // If it's corrupt, let's just allow anyone to delete it if it's really an incompatible schema issue to clear it out, or limit to creator. Let's limit to creator/admin.
    if (!isAdmin && community.creator_id !== session?.user?.id && community.image_url) {
       alert("No tienes permiso para eliminar esta comunidad.");
       return;
    }
    
    const confirm = window.confirm("¿Seguro que deseas eliminar esta comunidad permanentemente?");
    if (!confirm) return;
    
    await supabase.from('communities').delete().eq('id', commId);
    fetchCommunities();
    if (activeCommunity?.id === commId) {
      setActiveCommunity(null);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0a0b14] h-[100dvh] w-full overflow-hidden text-center fixed top-0 left-0 z-[100]">
         <Shield className="w-20 h-20 text-cyan-500 mb-6" />
         <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Inicia sesión requerida</h2>
         <p className="text-gray-400 max-w-lg mb-8">Debes iniciar sesión para usar Nexus Hub y conectarte con la comunidad.</p>
         <button onClick={onBack} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl">Volver al inicio</button>
      </div>
    );
  }

  if (tableError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0a0b14] h-[100dvh] w-full overflow-hidden text-center fixed top-0 left-0 z-[100]">
         <AlertTriangle className="w-20 h-20 text-red-500 mb-6" />
         <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Falta Base de Datos</h2>
         <p className="text-gray-400 max-w-lg mb-4">Las tablas de Nexus Hub no existen en tu base de datos de Supabase.</p>
         <button onClick={onBack} className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl">Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#050505] h-[100dvh] w-full overflow-hidden fixed top-0 left-0 z-[100]">
      {activeCommunity ? (
        <ChatRoom 
          community={activeCommunity} 
          communities={communities}
          onSelectCommunity={(c: Community) => setActiveCommunity(c)}
          session={session} 
          userProfile={userProfile} 
          onBack={() => setActiveCommunity(null)} 
          isAdmin={isAdmin}
        />
      ) : (
        <CommunitiesDashboard 
          communities={communities} 
          isLoading={isLoading} 
          onSelect={(c: Community) => setActiveCommunity(c)} 
          onCreateClick={() => setShowCreateModal(true)}
          isAdmin={isAdmin}
          onDelete={deleteCommunity}
          onBack={onBack}
          userProfile={userProfile}
          session={session}
        />
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCommunityModal 
            session={session} 
            isAdmin={isAdmin}
            onClose={() => setShowCreateModal(false)}
            onSuccess={(newComm) => {
              setCommunities(prev => [...prev, newComm].sort((a,b) => a.name.localeCompare(b.name)));
              setActiveCommunity(newComm);
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// COMMUNITIES DASHBOARD
// ============================================================================

function CommunitiesDashboard({ communities, isLoading, onSelect, onCreateClick, isAdmin, onDelete, onBack, userProfile, session }: any) {
  const [activeTab, setActiveTab] = useState<'home' | 'explore'>('home');
  const validCommunities = communities.filter((c: any) => c.image_url);
  const recommended = validCommunities.slice(0, 4);
  const activeNow = validCommunities.slice().reverse().slice(0, 3);
  const username = userProfile?.username || session?.user?.email?.split('@')[0] || 'Jugador';

  return (
    <div className="flex flex-col h-[100dvh] w-full relative z-10 bg-[#06070a]">
      {/* Background Orbs */}
      <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-cyan-900/30 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-[120px]" />
      </div>

      <header className="shrink-0 bg-[#06070a]/80 backdrop-blur-3xl border-b flex flex-col justify-between px-6 sm:px-10 sticky top-0 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] pt-6" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
           <div className="flex items-center gap-4">
             <button onClick={onBack} className="w-12 h-12 bg-white/5 hover:bg-white/10 active:bg-white/20 rounded-[16px] flex items-center justify-center transition-all shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]">
               <ChevronLeft className="w-6 h-6 text-gray-300" />
             </button>
             <div>
               <h1 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter flex items-center gap-3 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                    <Users className="w-5 h-5 text-white drop-shadow-md" />
                 </div>
                 NEXUS HUB
               </h1>
             </div>
           </div>
           
           <button 
             onClick={onCreateClick}
             className="px-5 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-[13px] uppercase tracking-widest rounded-[16px] flex items-center gap-2 transition-transform shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_rgba(8,145,178,0.6)] active:scale-95"
           >
             <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Nueva Comunidad</span>
           </button>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-8 mt-6 overflow-x-auto scrollbar-hide">
           <button 
             onClick={() => setActiveTab('home')}
             className={`pb-4 text-[13px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'home' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-gray-500 hover:text-gray-300'}`}
           >
              <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Inicio</div>
              {activeTab === 'home' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-cyan-400 rounded-t-full shadow-[0_-2px_10px_rgba(34,211,238,0.8)]"></div>}
           </button>
           <button 
             onClick={() => setActiveTab('explore')}
             className={`pb-4 text-[13px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'explore' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-gray-500 hover:text-gray-300'}`}
           >
              <div className="flex items-center gap-2"><Compass className="w-4 h-4" /> Explorar Servidores</div>
              {activeTab === 'explore' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-cyan-400 rounded-t-full shadow-[0_-2px_10px_rgba(34,211,238,0.8)]"></div>}
           </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto bg-transparent">
        {activeTab === 'home' ? (
           <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-10 space-y-12 pb-24">
              
              {/* Home Welcome Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#0d0f18] to-transparent p-6 sm:p-8 rounded-[32px] border border-white/5 relative overflow-hidden shadow-2xl">
                 <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-cyan-900/10 to-transparent pointer-events-none"></div>
                 <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] bg-[#1a1d2d] border-2 border-cyan-500/30 flex items-center justify-center p-1 shadow-[0_0_20px_rgba(34,211,238,0.2)] overflow-hidden">
                       {userProfile?.avatar_url ? (
                         <img src={userProfile.avatar_url} className="w-full h-full object-cover rounded-[18px]" />
                       ) : (
                         <span className="text-2xl font-black text-white">{username[0].toUpperCase()}</span>
                       )}
                    </div>
                    <div>
                       <h2 className="text-xl sm:text-3xl font-black text-white tracking-tighter shadow-sm mb-1">Que bueno verte, <span className="text-cyan-400">{username}</span></h2>
                       <p className="text-cyan-500 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 opacity-80 mt-1"><Activity className="w-4 h-4" /> Sesión Iniciada en Nexus Hub</p>
                    </div>
                 </div>
              </div>

              {/* Home Recommended Section */}
              <section>
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Flame className="w-6 h-6 text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" /> 
                      Tendencias y Populares
                    </h3>
                 </div>
                 
                 {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       {[1,2,3,4].map(i => <div key={i} className="bg-[#121420]/50 border border-white/5 rounded-[28px] h-[300px] animate-pulse"></div>)}
                    </div>
                 ) : recommended.length === 0 ? (
                    <div className="p-8 bg-white/5 border border-white/10 rounded-[24px] text-center">
                       <p className="text-gray-400 font-medium tracking-wide">No hay comunidades suficientes para mostrar tendencias.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 hover-group">
                       {recommended.map((c: any) => (
                           <div key={c.id} onClick={() => onSelect(c)} className="group cursor-pointer bg-[#0a0c16] rounded-[28px] border border-white/5 hover:border-orange-500/40 overflow-hidden transition-all duration-300 hover:shadow-[0_15px_40px_rgba(249,115,22,0.15)] hover:-translate-y-1">
                              <div className="h-[140px] relative overflow-hidden">
                                 <img src={c.image_url} className="w-full h-full object-cover transform scale-105 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c16] to-transparent opacity-90"></div>
                                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none"></div>
                                 <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-[10px] flex items-center gap-1.5 border border-white/10 shadow-lg">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span className="text-[10px] font-black text-white tracking-widest">TOP</span>
                                 </div>
                              </div>
                              <div className="p-5 relative">
                                 <div className="absolute -top-12 left-5 w-[68px] h-[68px] rounded-[20px] border-[3px] border-[#0a0c16] overflow-hidden bg-[#121422] shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all">
                                    <img src={c.image_url} className="w-full h-full object-cover" />
                                 </div>
                                 <h4 className="text-[19px] font-black text-white mt-5 line-clamp-1 group-hover:text-orange-400 transition-colors drop-shadow-sm">{c.name}</h4>
                                 <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-widest font-black bg-white/5 inline-block px-2 py-0.5 rounded-lg border border-white/5">{c.category}</p>
                              </div>
                           </div>
                       ))}
                    </div>
                 )}
              </section>

              {/* Active Now / Hot */}
              <section>
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Zap className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" /> 
                      Activas Ahora
                    </h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {activeNow.map((c: any) => (
                       <div key={c.id} onClick={() => onSelect(c)} className="flex items-center gap-4 bg-[#0d0f18]/80 hover:bg-[#121422] border border-white/5 hover:border-yellow-400/30 p-4 sm:p-5 rounded-[28px] cursor-pointer transition-all group shadow-lg hover:shadow-[0_10px_30px_rgba(250,204,21,0.1)] hover:-translate-y-1">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] overflow-hidden shrink-0 relative shadow-inner">
                             <img src={c.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                             <div className="absolute inset-0 bg-gradient-to-tr from-black/50 to-transparent"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="text-lg font-black text-white truncate group-hover:text-yellow-400 transition-colors">{c.name}</h4>
                             <p className="text-[13px] text-gray-400 line-clamp-1 font-medium mt-0.5">{c.description}</p>
                             <div className="flex items-center gap-2 mt-2.5">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                                </span>
                                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">En Línea</span>
                             </div>
                          </div>
                          <div className="w-10 h-10 rounded-[14px] bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-yellow-400/10 transition-colors">
                             <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-yellow-400 rotate-180 transition-colors" />
                          </div>
                       </div>
                    ))}
                 </div>
              </section>

              {/* Events Banner */}
              <section className="bg-gradient-to-br from-indigo-900/60 to-[#06070a] border border-indigo-500/30 rounded-[32px] p-8 md:p-14 relative overflow-hidden group hover:border-indigo-500/50 shadow-[0_20px_50px_rgba(79,70,229,0.15)] transition-all">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-screen group-hover:scale-105 transition-transform duration-1000 ease-out"></div>
                 <div className="absolute inset-0 bg-gradient-to-r from-[#06070a] via-[#06070a]/90 to-transparent"></div>
                 <div className="relative z-10 max-w-xl">
                    <span className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-black text-[11px] uppercase tracking-widest rounded-xl mb-6 inline-block shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                       <span className="flex items-center gap-2"><Gamepad2 className="w-4 h-4" /> EVENTO DESTACADO</span>
                    </span>
                    <h3 className="text-4xl md:text-5xl font-black text-white mb-5 tracking-tighter leading-tight drop-shadow-md">Nexus Play <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Festival</span></h3>
                    <p className="text-gray-300 font-medium mb-8 text-base md:text-lg leading-relaxed shadow-sm">Únete a las mayores comunidades gaming, participa en torneos exclusivos y conecta con jugadores este fin de semana.</p>
                    <button className="px-8 py-4 bg-white hover:bg-gray-100 text-black font-black uppercase tracking-widest text-[13px] rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] flex items-center gap-2">
                       Ver Detalles <ChevronLeft className="w-4 h-4 rotate-180" />
                    </button>
                 </div>
              </section>

           </div>
        ) : (
           <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-10">
              <div className="mb-10 mt-2 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tighter">Explorar Todas</h2>
                  <p className="text-gray-400 font-medium text-[15px]">Únete a debates, comparte ideas y conecta con jugadores de todo el mundo.</p>
                </div>
                <div className="relative w-full md:w-auto">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-500" />
                   </div>
                   <input type="text" placeholder="Buscar comunidad..." className="w-full md:w-[320px] bg-[#121422]/80 backdrop-blur-md border border-white/10 rounded-[20px] pl-12 pr-4 py-3.5 text-[15px] text-white font-medium focus:outline-none focus:border-cyan-500/50 focus:bg-[#151822] transition-colors shadow-inner" />
                </div>
              </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-[#121420]/50 border border-white/5 rounded-[28px] h-[320px] animate-pulse"></div>
              ))}
            </div>
          ) : communities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-gradient-to-b from-[#121420]/80 to-[#0A0D14]/80 backdrop-blur-md border border-white/5 rounded-[32px] mt-12 shadow-2xl">
              <div className="w-24 h-24 bg-cyan-900/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <Users className="w-12 h-12 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Comunidades Vacías</h3>
              <p className="text-gray-400 text-center max-w-sm mb-8 font-medium">Nadie ha creado una comunidad todavía. Sé el primero en iniciar un nuevo debate.</p>
              <button 
                onClick={onCreateClick}
                className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-2xl hover:scale-105 active:scale-95 transition-transform"
              >
                Crear Mi Comunidad
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {communities.map((c: any) => (
                <div key={c.id} onClick={() => { if(c.image_url) onSelect(c); }} className="group relative bg-[#090b12]/60 hover:bg-[#0c0e18]/80 backdrop-blur-3xl cursor-pointer border border-white/5 hover:border-cyan-500/50 rounded-[32px] overflow-hidden transition-all duration-300 flex flex-col h-[340px] shadow-2xl hover:shadow-[0_20px_50px_rgba(34,211,238,0.2)] hover:-translate-y-2">
                  
                  {/* Card Header Banner */}
                  <div className="h-[140px] w-full bg-gradient-to-br from-[#151822] to-[#0d0f18] relative shrink-0 overflow-hidden">
                    {c.image_url ? (
                      <>
                        <img src={c.image_url} alt={c.name} className="w-full h-full object-cover transform scale-105 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#090b12] to-transparent opacity-80" />
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.05)_1px,transparent_1px)] bg-[size:16px_16px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-red-900/10 flex items-center justify-center">
                         <AlertTriangle className="w-10 h-10 text-red-500/30" />
                      </div>
                    )}
                    
                    {/* Glowing effect line at top edge */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-[12px] border border-white/10 flex items-center gap-2 shadow-lg">
                       <span className={`w-2 h-2 rounded-full ${c.image_url ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse' : 'bg-red-500'}`}></span>
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">{c.category}</span>
                    </div>
                    {(isAdmin || !c.image_url) && (
                      <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-xl backdrop-blur-md transition-all border border-white/10 shadow-lg relative z-10 opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Icon Overlap */}
                  <div className="absolute top-[100px] left-6 z-10">
                    <div className="w-20 h-20 bg-[#090b12] p-1.5 border-2 border-white/10 group-hover:border-cyan-500/50 rounded-[20px] flex items-center justify-center transition-colors duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                      {c.image_url ? (
                        <div className="w-full h-full rounded-[14px] overflow-hidden relative">
                           <img src={c.image_url} alt={c.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                        </div>
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 pt-14 flex flex-col flex-1 relative bg-gradient-to-b from-transparent to-[#030407]/40">
                    {!c.image_url ? (
                       <div className="absolute inset-0 bg-[#0f111a]/95 backdrop-blur-md z-10 flex flex-col items-center justify-center p-4 text-center">
                          <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
                          <p className="text-sm font-black text-white uppercase tracking-widest mb-1">Comunidad Incompatible</p>
                          <p className="text-xs text-gray-400 mb-6 font-medium">Esta comunidad quedó incompatible tras una actualización.</p>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                             Eliminar y Recrear
                          </button>
                       </div>
                    ) : null}

                    <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight group-hover:text-cyan-400 transition-colors line-clamp-1 drop-shadow-sm tracking-tighter">{c.name}</h3>
                    <p className="text-[14px] sm:text-[15px] text-gray-400 line-clamp-2 leading-relaxed flex-1 font-medium">{c.description}</p>
                    
                    <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between w-full relative">
                       <div className="flex items-center gap-2 text-[12px] font-black text-gray-400 uppercase tracking-widest group-hover:text-cyan-400 transition-colors">
                           <Users className="w-[18px] h-[18px] text-cyan-500 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all" />
                           Descubrir
                       </div>
                       
                       <div className="absolute right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <button onClick={(e) => { e.stopPropagation(); onSelect(c); }} className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 rounded-[14px] text-[13px] font-black text-[#030407] hover:text-black shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.8)] transition-all border border-cyan-300 transform hover:scale-105 active:scale-95 uppercase tracking-widest">
                              Unirse →
                          </button>
                       </div>
                       
                       {/* Default footer info (hides on hover) */}
                       <div className="absolute right-0 flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:opacity-0 transition-opacity duration-300 transform group-hover:-translate-y-2">
                         <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(c.created_at).toLocaleDateString()}</span>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// CHAT ROOM 
// ============================================================================

function getCommunityChannels(comm: any): string[] {
  const defaultCols = ['general', 'anuncios', 'ayuda', 'media', 'off-topic'];
  if (!comm || !comm.description) return defaultCols;
  const parts = comm.description.split(' | channels:');
  if (parts.length > 1) {
    return parts[1].split(',').map((c: string) => c.trim()).filter(Boolean);
  }
  return defaultCols;
}

function getCleanDescription(desc: string): string {
  if (!desc) return '';
  return desc.split(' | channels:')[0];
}

function updateCommunityChannels(desc: string, channels: string[]): string {
  const clean = desc.split(' | channels:')[0];
  return `${clean} | channels:${channels.join(',')}`;
}

interface ParsedMsg {
  text: string;
  channel: string;
  image_url?: string | null;
}

function parseMessageContent(content: string): ParsedMsg {
  if (!content) return { text: '', channel: 'general', image_url: null };
  const trimmed = content.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        text: parsed.text || '',
        channel: parsed.channel || 'general',
        image_url: parsed.image_url || null
      };
    } catch (e) {
      // ignore and treat as text
    }
  }
  return {
     text: content,
     channel: 'general',
     image_url: null
  };
}

function serializeMessageContent(text: string, channel: string, imageUrl?: string | null): string {
  return JSON.stringify({
     text,
     channel,
     image_url: imageUrl || null
  });
}

function ChatRoom({ community, communities, onSelectCommunity, session, userProfile, onBack, isAdmin }: any) {
  const [currentCommunity, setCurrentCommunity] = useState(community);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [activeChannel, setActiveChannel] = useState('general');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Channels and Member states
  const [channels, setChannels] = useState<string[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [showChannelForm, setShowChannelForm] = useState(false);
  
  // Reactions list
  const [reactions, setReactions] = useState<any[]>([]);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);

  // Upload state
  const [chatImageFile, setChatImageFile] = useState<File | null>(null);
  const [chatImagePreviewUrl, setChatImagePreviewUrl] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Sync Community Details and Channels list
  useEffect(() => {
    setCurrentCommunity(community);
    setChannels(getCommunityChannels(community));
  }, [community]);

  // Fetch reactions helper
  const fetchReactions = async () => {
    if (messages.length === 0) return;
    const msgIds = messages.map(m => m.id);
    const { data, error } = await supabase
      .from('message_reactions')
      .select('*')
      .in('message_id', msgIds);
    if (data) {
      setReactions(data);
    }
  };

  useEffect(() => {
    fetchReactions();
  }, [messages]);

  // Initialize and subscribe
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      // Auto-join community in background
      try {
        await supabase.from('community_members').insert({
          community_id: community.id,
          user_id: session.user.id
        }).select();
      } catch (e) {
        // fail silently if member already exists
      }
      
      await fetchMessages();
      await fetchReactions();
    };

    init();

    // Setup Realtime messages
    const channel = supabase.channel(`public:messages:${community.id}`);
    channelRef.current = channel;

    channel
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages',
        filter: `community_id=eq.${community.id}`
      }, (payload) => {
        if (!mounted) return;
        const msg = payload.new as any;
        
        if (payload.eventType === 'INSERT') {
          supabase.from('messages').select('*, profiles(*)').eq('id', msg.id).single()
            .then(({ data }) => {
              if (data && mounted) {
                setMessages(prev => {
                   if (prev.some(p => p.id === data.id)) return prev;
                   return [...prev, data];
                });
                setTimeout(scrollToBottom, 100);
              }
            });
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(p => p.id === msg.id ? { ...p, ...msg } : p));
        } else if (payload.eventType === 'DELETE') {
          const oldMsg = payload.old as any;
          setMessages(prev => prev.filter(p => p.id !== oldMsg.id));
        }
      })
      .on('presence', { event: 'sync' }, () => {
         if (!mounted) return;
         const state = channel.presenceState();
         setOnlineCount(Object.keys(state).length || 1);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: session.user.id });
        }
      });

    // Realtime channel for community changes
    const commSub = supabase.channel(`public:communities:${community.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'communities',
        filter: `id=eq.${community.id}`
      }, (payload) => {
        if (mounted) {
          const updated = payload.new as any;
          setCurrentCommunity(updated);
          setChannels(getCommunityChannels(updated));
        }
      })
      .subscribe();

    // Realtime message reactions
    const reactSub = supabase.channel(`public:reactions:${community.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions'
      }, () => {
         if (mounted) fetchReactions();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      supabase.removeChannel(commSub);
      supabase.removeChannel(reactSub);
    };
  }, [community.id]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(*)')
      .eq('community_id', community.id)
      .order('created_at', { ascending: true })
      .limit(150);

    if (error) {
      console.error("Error fetching messages:", error);
      setErrorMsg("No se pudieron cargar los mensajes.");
    } else if (data) {
      setMessages(data as any);
      setTimeout(scrollToBottom, 50);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleChatImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setChatImageFile(file);
      setChatImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !chatImageFile) || isSending) return;
    
    setIsSending(true);
    setErrorMsg(null);
    const textContent = newMessage.trim();
    const imageFile = chatImageFile;
    
    // Reset states
    setNewMessage('');
    setChatImageFile(null);
    setChatImagePreviewUrl(null);
    
    // Optimistic message setup
    const tempId = `temp_${Date.now()}`;
    const localImgUrl = chatImagePreviewUrl;
    
    const optimisticMsg: Message = {
      id: tempId,
      temp_id: tempId,
      community_id: community.id,
      user_id: session.user.id,
      content: serializeMessageContent(textContent, activeChannel, localImgUrl),
      is_pinned: false,
      deleted: false, 
      deleted_by_admin: false,
      created_at: new Date().toISOString(),
      profiles: {
        username: userProfile?.username || session.user.email?.split('@')[0] || 'Tú',
        avatar_url: userProfile?.avatar_url || '',
        role: userProfile?.role || 'user'
      }
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      let finalImgUrl: string | null = null;
      if (imageFile) {
        const cleanName = currentCommunity.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const uploadRes = await uploadToCloudinary(imageFile, `NexusHub/${cleanName}/chat_media`);
        if (uploadRes && (uploadRes.secure_url || uploadRes.url)) {
          finalImgUrl = uploadRes.secure_url || uploadRes.url;
        } else {
          throw new Error("No se pudo subir la foto adjunta. Por favor vuelve a intentar.");
        }
      }

      const serializedContent = serializeMessageContent(textContent, activeChannel, finalImgUrl);
      
      const { data, error } = await supabase.from('messages').insert([{
        community_id: community.id,
        user_id: session.user.id,
        content: serializedContent,
      }]).select();

      if (error) {
         throw error;
      } else if (data && data.length > 0) {
        const realMsg = data[0];
        setMessages(prev => prev.map(m => m.id === tempId ? { ...realMsg, profiles: userProfile } : m));
        
        // AI Integration
        if (textContent.startsWith('!ia ')) {
           setTimeout(async () => {
              const aiResponses = [
                 "¡Hola! Soy Nexus AI. Estoy aquí para ayudarte a descubrir contenido, recomendar apps y moderar la comunidad.",
                 "Esa es una gran pregunta. ¿Sabías que puedes crear tus propias apps usando nuestra plataforma?",
                 "¡Excelente tema de conversación! Te sugiero visitar el canal #media para compartir capturas.",
                 "NexusPlay está evolucionando. Mantente atento para más novedades sobre juegos y herramientas.",
                 "He detectado que te gusta este tema. ¡Prueba algunas de las nuevas web apps disponibles!"
              ];
              const randomRes = aiResponses[Math.floor(Math.random() * aiResponses.length)];
              const aiMessage = `[NEXUS AI] ${randomRes}`;
              
              await supabase.from('messages').insert([{
                 community_id: community.id,
                 user_id: session.user.id, // we use the same user, but format [NEXUS AI] will render it as bot
                 content: serializeMessageContent(aiMessage, activeChannel, null),
              }]);
           }, 1500);
        }
      }
    } catch (err: any) {
      console.error("Error INSERT message:", err);
      setErrorMsg(`Error al enviar: ${err.message || 'Bloqueado por reglas de base de datos'}`);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(textContent);
      if (imageFile) {
         setChatImageFile(imageFile);
         setChatImagePreviewUrl(localImgUrl);
      }
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (msgId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ deleted: true, deleted_by_admin: isAdmin, content: '' })
      .eq('id', msgId);
      
    if (error) {
      setErrorMsg("No se pudo eliminar el mensaje.");
    }
  };

  // Reactions handlers
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    // Find if user already reacted with this emoji to this message
    const existing = reactions.find(r => r.message_id === messageId && r.user_id === session.user.id && r.reaction === emoji);
    
    try {
      if (existing) {
        setReactions(prev => prev.filter(r => r.id !== existing.id));
        await supabase.from('message_reactions').delete().eq('id', existing.id);
      } else {
        const tempReaction = {
           id: `temp_r_${Date.now()}`,
           message_id: messageId,
           user_id: session.user.id,
           reaction: emoji
        };
        setReactions(prev => [...prev, tempReaction]);
        
        const { error } = await supabase.from('message_reactions').insert({
          message_id: messageId,
          user_id: session.user.id,
          reaction: emoji
        });
        if (error) throw error;
      }
      fetchReactions();
    } catch (err) {
      console.error("Error tooggling reaction:", err);
    }
    setEmojiPickerMsgId(null);
  };

  // Channel manipulation
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newChannelName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!name) return;
    if (channels.includes(name)) {
      alert("El canal ya existe.");
      return;
    }

    const updatedChannels = [...channels, name];
    const updatedDesc = updateCommunityChannels(currentCommunity.description, updatedChannels);
    
    const { error } = await supabase
      .from('communities')
      .update({ description: updatedDesc })
      .eq('id', currentCommunity.id);

    if (error) {
      alert("No se pudo crear el canal.");
    } else {
      setChannels(updatedChannels);
      setActiveChannel(name);
      setNewChannelName('');
      setShowChannelForm(false);
    }
  };

  const handleDeleteChannel = async (name: string) => {
    if (name === 'general') return;
    const confirm = window.confirm(`¿Seguro que deseas eliminar el canal #${name}?`);
    if (!confirm) return;

    const updatedChannels = channels.filter(c => c !== name);
    const updatedDesc = updateCommunityChannels(currentCommunity.description, updatedChannels);

    const { error } = await supabase
      .from('communities')
      .update({ description: updatedDesc })
      .eq('id', currentCommunity.id);

    if (error) {
      alert("No se pudo eliminar el canal.");
    } else {
      setChannels(updatedChannels);
      if (activeChannel === name) {
        setActiveChannel('general');
      }
    }
  };

  // Group reactions for render
  const getRenderReactions = (messageId: string) => {
    const msgReacts = reactions.filter(r => r.message_id === messageId);
    const grouped: { [emoji: string]: { count: number; active: boolean } } = {};
    
    msgReacts.forEach(r => {
      if (!grouped[r.reaction]) {
        grouped[r.reaction] = { count: 0, active: false };
      }
      grouped[r.reaction].count++;
      if (r.user_id === session.user.id) {
        grouped[r.reaction].active = true;
      }
    });

    return Object.entries(grouped);
  };

  const isCreatorOrAdmin = isAdmin || currentCommunity.creator_id === session.user.id;
  
  // Filter messages belonging to current active channel
  const filteredMessages = messages.filter(m => {
    const parsed = parseMessageContent(m.content);
    return parsed.channel === activeChannel;
  });

  return (
    <div className="flex h-full w-full bg-[#0a0b14] overflow-hidden relative">
       
       {/* Error Toast */}
       <AnimatePresence>
         {errorMsg && (
           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-full font-bold text-sm shadow-2xl flex items-center gap-2">
             <AlertTriangle className="w-5 h-5 animate-bounce" />
             {errorMsg}
             <button onClick={() => setErrorMsg(null)} className="ml-2 hover:bg-black/20 p-1 rounded-full"><X className="w-4 h-4" /></button>
           </motion.div>
         )}
       </AnimatePresence>

       {/* ====================================================================
           SIDEBAR DISCORD STYLE
           ==================================================================== */}
       {/* Sidebar Overlay on Mobile */}
       <AnimatePresence>
         {isSidebarOpen && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={() => setIsSidebarOpen(false)}
             className="md:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
           />
         )}
       </AnimatePresence>

       {/* Sidebars Container (Servers + Channels) */}
       <aside className={`
         fixed top-0 left-0 bottom-0 z-40 md:relative flex h-full transform transition-transform duration-300 ease-out shrink-0
         ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
       `}>
          {/* Server Sidebar (Extreme Left) */}
          <div className="w-[80px] bg-gradient-to-b from-[#030407] to-[#06070a] border-r border-white/5 flex flex-col items-center py-4 gap-4 h-full shrink-0 overflow-y-auto overflow-x-hidden pt-safe pb-safe scrollbar-hide relative z-10 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
             {/* Home / Discover Button */}
             <div className="relative group flex items-center justify-center w-full">
                <div className="absolute left-0 w-[4px] h-0 bg-cyan-400 rounded-r-full transition-all duration-300 ease-out group-hover:h-8 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                <button 
                  onClick={onBack}
                  className="w-[52px] h-[52px] rounded-[24px] bg-gradient-to-br from-[#121422] to-[#0a0c14] border border-white/10 hover:border-cyan-500/50 hover:bg-gradient-to-tr hover:from-cyan-600 hover:to-blue-600 hover:rounded-[18px] flex items-center justify-center text-cyan-400 hover:text-white transition-all duration-300 shadow-md group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] relative overflow-hidden"
                >
                  <Activity className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform" />
                </button>
             </div>

             <div className="w-8 h-[2px] bg-white/5 rounded-full my-1"></div>

             {/* Communities List */}
             {communities?.map((c: any) => {
               const isActive = c.id === currentCommunity.id;
               return (
                 <div key={c.id} className="relative group w-full flex items-center justify-center">
                    <div className={`absolute left-0 w-[4px] bg-white rounded-r-full transition-all duration-300 ease-out ${isActive ? 'h-10 opacity-100 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'h-0 opacity-0 group-hover:h-6 group-hover:opacity-100'}`}></div>
                    <button
                      onClick={() => {
                        onSelectCommunity(c);
                        if(window.innerWidth < 768) setIsSidebarOpen(false);
                      }}
                      className={`w-[52px] h-[52px] flex items-center justify-center overflow-hidden transition-all duration-300 shadow-md group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] relative border border-transparent
                         ${isActive ? 'rounded-[18px] border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.4)] ring-2 ring-cyan-500/20' : 'rounded-[26px] bg-[#121422] group-hover:rounded-[18px] group-hover:border-cyan-500/50 hover:ring-2 hover:ring-cyan-500/10 border-white/5'}
                      `}
                    >
                       {isActive && <div className="absolute inset-0 bg-gradient-to-tr from-cyan-600/80 to-blue-600/80 pointer-events-none" />}
                       {c.image_url ? (
                         <img src={c.image_url} alt={c.name} className={`w-full h-full object-cover relative z-10 transition-transform duration-500 ${isActive ? 'opacity-90 scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-105'}`} />
                       ) : (
                         <span className={`font-black text-lg relative z-10 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{c.name[0].toUpperCase()}</span>
                       )}
                    </button>
                 </div>
               );
             })}
             
             <div className="w-8 h-[2px] bg-white/5 rounded-full my-1"></div>
             
             {/* New Server Button */}
             <div className="relative group flex items-center justify-center w-full mt-2">
                <button 
                  onClick={() => { onBack(); }}
                  className="w-[52px] h-[52px] rounded-[24px] bg-[#121422] border border-white/5 hover:border-green-500/50 hover:bg-green-500/10 hover:rounded-[18px] flex items-center justify-center text-green-400 hover:text-green-300 transition-all duration-300 shadow-md group-hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
             </div>
          </div>

          {/* Channel Sidebar */}
          <div className="w-[280px] bg-gradient-to-b from-[#090b12] to-[#0a0c16] border-r border-white/5 flex flex-col h-full shrink-0 relative z-20">
          {/* Sidebar Header */}
          <div className="h-[76px] border-b border-white/5 px-5 flex items-center gap-4 shrink-0 bg-gradient-to-r from-transparent to-white/[0.02] shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
             <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-base font-black shadow-[0_0_20px_rgba(0,229,255,0.4)] border border-cyan-400/30 overflow-hidden relative">
                {currentCommunity.image_url ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/50 to-transparent mix-blend-overlay z-10 pointer-events-none" />
                    <img src={currentCommunity.image_url} alt={currentCommunity.name} className="w-full h-full object-cover" />
                  </>
                ) : (
                  currentCommunity.name[0].toUpperCase()
                )}
             </div>
             <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-black text-white uppercase tracking-wider truncate leading-tight drop-shadow-sm">{currentCommunity.name}</h3>
                <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest bg-cyan-900/30 px-1.5 py-0.5 rounded-md inline-block mt-0.5 border border-cyan-500/20">{currentCommunity.category}</p>
             </div>
             <button onClick={onBack} className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all shrink-0">
                <ChevronLeft className="w-5 h-5" />
             </button>
          </div>

          {/* Description Section */}
          <div className="p-4 border-b border-white/5 bg-[#090b12]/30 shrink-0">
             <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                {getCleanDescription(currentCommunity.description) || "Bienvenido a este canal."}
             </p>
          </div>

          {/* Sidebar Channels List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
             <div>
                <div className="flex items-center justify-between px-2 mb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                   <span>Canales de Texto</span>
                   {isCreatorOrAdmin && (
                     <button 
                       onClick={() => setShowChannelForm(prev => !prev)} 
                       className="p-1 hover:bg-white/5 hover:text-white rounded-md transition-colors"
                     >
                        <Plus className="w-4 h-4" />
                     </button>
                   )}
                </div>

                {/* Inline Channel Creation Form */}
                {showChannelForm && (
                  <form onSubmit={handleCreateChannel} className="px-2 mb-3">
                     <div className="flex items-center gap-2 bg-[#121420] border border-cyan-500/30 rounded-xl px-2 py-1.5">
                        <Hash className="w-4 h-4 text-cyan-400 shrink-0" />
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="nombre-canal" 
                          value={newChannelName}
                          onChange={(e) => setNewChannelName(e.target.value)}
                          className="w-full bg-transparent text-xs text-white outline-none placeholder:text-gray-600 font-bold"
                          maxLength={18}
                        />
                        <button type="submit" className="text-[10px] text-cyan-400 font-black px-2 hover:text-cyan-300">✔</button>
                     </div>
                  </form>
                )}

                {/* Listing channels */}
                <div className="space-y-1">
                   {channels.map((chanName) => {
                      const isActive = activeChannel === chanName;
                      return (
                        <div 
                          key={chanName}
                          className={`
                            group flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all
                            ${isActive 
                              ? 'bg-gradient-to-r from-cyan-900/40 text-white font-bold border-l-[3px] border-cyan-400 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]' 
                              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-[3px] border-transparent font-medium'}
                          `}
                          onClick={() => {
                            setActiveChannel(chanName);
                            setIsSidebarOpen(false);
                          }}
                        >
                           <div className="flex items-center gap-2 truncate">
                              <Hash className={`w-4 h-4 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'text-gray-600 group-hover:text-gray-400'}`} />
                              <span className="truncate">{chanName}</span>
                           </div>
                           
                           {isCreatorOrAdmin && chanName !== 'general' && (
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleDeleteChannel(chanName);
                                }}
                               className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-md transition-all"
                             >
                                <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           )}
                        </div>
                      );
                   })}
                </div>
             </div>

             {/* Dynamic Members Online Status */}
             <div>
                <div className="px-2 mb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-between">
                   <span>En línea ({onlineCount})</span>
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-[#121420]/40 rounded-xl transition-all">
                      <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-[10px] font-bold text-white relative">
                        {userProfile?.avatar_url ? (
                          <img src={userProfile.avatar_url} className="w-full h-full object-cover rounded-full" />
                        ) : (userProfile?.username?.[0]?.toUpperCase() || 'P')}
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-[#06070c]" />
                      </div>
                      <span className="text-xs font-semibold text-gray-200 truncate">{userProfile?.username || 'Tú'}</span>
                   </div>
                </div>
              </div>
            </div>
           <div className="p-4 border-t border-white/5 bg-[#06070c] flex items-center justify-between shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-30">
             <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-[12px] bg-[#121420] border border-white/10 flex items-center justify-center font-bold text-xs relative group cursor-pointer overflow-hidden shadow-inner">
                  {userProfile?.avatar_url ? (
                     <img src={userProfile.avatar_url} className="w-full h-full object-cover" />
                  ) : (userProfile?.username?.[0]?.toUpperCase() || 'U')}
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-[3px] border-[#06070c] shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <div className="min-w-0 flex-1 cursor-pointer group">
                   <p className="text-[13px] font-black text-gray-200 truncate leading-tight group-hover:text-cyan-400 transition-colors drop-shadow-sm">{userProfile?.username || 'Usuario'}</p>
                   <p className="text-[11px] text-gray-500 font-black uppercase tracking-widest truncate">{userProfile?.role || 'Online'}</p>
                </div>
             </div>
             
             <div className="flex items-center gap-1">
                <button className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                   <Volume2 className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                     <Settings className="w-4 h-4" />
                  </button>
                )}
             </div>
           </div>
          </div>
       </aside>
            {/* ====================================================================
           CHAT CONTAINER
           ==================================================================== */}
       <div className="flex-1 flex flex-col h-full bg-[#030407] overflow-hidden relative">
          
          {/* Chat Header */}
          <header className="h-[76px] shrink-0 bg-[#06070c]/80 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-4 sm:px-8 shadow-2xl z-20 relative">
             <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/10 to-transparent pointer-events-none" />
             <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 relative z-10">
                {/* Burger Trigger to open channels */}
                <button 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="md:hidden w-10 h-10 hover:bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all shrink-0"
                >
                   <Menu className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-2 text-white shrink-0 group">
                   <Hash className="w-7 h-7 text-cyan-500 group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] transform group-hover:scale-110" />
                   <span className="text-lg sm:text-2xl font-black tracking-tighter text-white uppercase drop-shadow-md">{activeChannel}</span>
                </div>

                <div className="h-6 w-[2px] bg-white/10 hidden sm:block mx-2"></div>

                <div className="flex-1 min-w-0 hidden sm:block">
                   <p className="text-[14px] text-gray-400 truncate flex items-center gap-2">
                      <span className="text-gray-500 font-medium">en</span>
                      <span className="text-gray-200 font-bold hover:text-white cursor-pointer transition-colors">{currentCommunity.name}</span>
                      <span className="px-2 py-0.5 rounded-[8px] text-[10px] bg-cyan-900/30 text-cyan-400 font-black uppercase tracking-widest border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]">{currentCommunity.category}</span>
                   </p>
                </div>
             </div>
             
             {/* Action icons */}
             <div className="flex items-center gap-3 relative z-10">
                {/* Online members indicator modern */}
                <div className="px-4 py-2 bg-[#0d0f18] border border-white/10 text-gray-200 text-[11px] font-black uppercase tracking-widest rounded-[12px] flex items-center gap-2 sm:gap-3 select-none shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] transition-all hover:bg-[#121420]">
                   <div className="relative flex items-center justify-center w-2.5 h-2.5">
                     <span className="absolute w-full h-full rounded-full bg-green-500 animate-ping opacity-60" />
                     <span className="relative w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                   </div>
                   <span>{onlineCount} Online</span>
                </div>

                <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3">
                   <button className="w-10 h-10 rounded-[12px] bg-[#121420] border border-white/5 hover:border-cyan-500/30 hover:bg-[#1a1d2d] flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]" title="Buscar">
                     <Search className="w-4 h-4" />
                   </button>
                   <button className="w-10 h-10 rounded-[12px] bg-[#121420] border border-white/5 hover:border-cyan-500/30 hover:bg-[#1a1d2d] flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]" title="Miembros">
                     <Users className="w-4 h-4" />
                   </button>
                </div>
             </div>
          </header>

          {/* Messages display area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 relative bg-[#07080d] bg-[linear-gradient(rgba(0,229,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]">
             
             {/* Dynamic welcome card based on active channel */}
             <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto mt-6 mb-10 p-6 bg-[#0f111a]/40 border border-white/5 rounded-3xl backdrop-blur">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                   <Hash className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-white italic tracking-tight mb-2">Comienzo de #{activeChannel}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                   Este es el inicio oficial de la conversación en el canal #{activeChannel}. ¡Comparte textos, capturas, y diviértete con la comunidad!
                </p>
             </div>

             {/* Loading messages spinner fallback */}
             {messages.length === 0 && !isSending && (
               <div className="text-center py-10 opacity-30">
                  <MessageSquare className="w-10 h-10 mx-auto text-gray-500 mb-2 animate-bounce" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Sin mensajes hoy</p>
               </div>
             )}

             {/* Rendering the lists of actual messages */}
             {filteredMessages.map((msg, index) => {
                const parsed = parseMessageContent(msg.content);
                const isOwn = msg.user_id === session.user.id;
                const isAI = parsed.text?.startsWith('[NEXUS AI]');
                const displayText = isAI ? parsed.text.replace('[NEXUS AI]', '').trim() : parsed.text;
                
                // Si es un mensaje falso de IA, fingimos que no es propio para que salga a la izquierda, salvo que estemos enviando un debug real
                const renderAsOwn = isOwn && !isAI; 
                
                                const showAvatar = index === 0 || filteredMessages[index-1].user_id !== msg.user_id || isAI !== (parseMessageContent(filteredMessages[index-1].content).text?.startsWith('[NEXUS AI]')) || new Date(msg.created_at).getTime() - new Date(filteredMessages[index-1].created_at).getTime() > 5 * 60000;
                const msgReactions = getRenderReactions(msg.id);

                return (
                    <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    key={msg.id} 
                    className={`flex flex-col group hover:bg-white/[0.02] -mx-4 px-4 py-2 transition-colors ${showAvatar ? 'mt-6' : 'mt-1'}`}
                  >
                     <div className="flex items-start gap-4 max-w-full relative">
                        
                        {/* Avatar Column */}
                        <div className="w-12 flex-shrink-0 flex justify-center mt-1">
                          {showAvatar ? (
                            <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-sm font-black shadow-lg select-none transition-transform duration-300 cursor-pointer hover:scale-110 active:scale-95 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] relative overflow-hidden
                              ${isAI ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : (isOwn ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white' : 'bg-[#151822] border border-white/10 text-white')} 
                            `}>
                              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                              {isAI ? (
                                <Bot className="w-6 h-6 drop-shadow-md relative z-10" />
                              ) : msg.profiles?.avatar_url ? (
                                <img src={msg.profiles.avatar_url} className="w-full h-full object-cover relative z-10" />
                              ) : (<span className="relative z-10">{msg.profiles?.username?.[0]?.toUpperCase() || '?'}</span>)}
                              
                              {/* Online indicator */}
                              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#090b12] rounded-full z-20"></span>
                            </div>
                          ) : null}
                        </div>
                        
                        {/* Message Content Column */}
                        <div className="flex flex-col relative w-full pt-1.5 min-w-0">
                           {/* Author detail info */}
                           {showAvatar && (
                             <div className="flex items-baseline flex-wrap gap-2 mb-1.5">
                               <span className="text-[15px] font-bold tracking-wide text-gray-100 hover:underline cursor-pointer decoration-white/30 underline-offset-4">{isAI ? 'Nexus AI' : msg.profiles?.username}</span>
                               {isAI && (
                                 <span className="px-1.5 py-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 rounded-[6px] text-[9px] font-black tracking-widest uppercase flex items-center gap-1 shadow-sm">
                                    <Bot className="w-3 h-3" /> BOT
                                 </span>
                               )}
                               {!isAI && msg.profiles?.role === 'admin' && (
                                 <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-[6px] text-[9px] font-black tracking-widest uppercase shadow-sm">ADMIN</span>
                               )}
                               <span className="text-[11px] font-medium text-gray-500 tracking-wider transition-opacity opacity-70">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                             </div>
                           )}

                           {/* Inline block */}
                           <div className={`relative pr-12 lg:pr-20 ${msg.temp_id ? 'opacity-50 animate-pulse' : 'opacity-100'}`}>
                               {msg.deleted ? (
                                  <span className="italic text-gray-500 flex items-center gap-2 text-[13px] bg-red-900/10 border border-red-900/20 w-max px-3 py-1.5 rounded-xl font-medium">
                                    <AlertTriangle className="w-4 h-4 text-red-500" /> Mensaje oculto
                                  </span>
                               ) : (
                                  <div className="space-y-3 mt-0.5">
                                     {/* Text paragraph */}
                                     {displayText && (
                                        <div className={`text-[15px] ${isAI ? 'text-indigo-200' : 'text-gray-300'} leading-[1.6] whitespace-pre-wrap break-words`}>
                                           {displayText}
                                        </div>
                                     )}
                                     {/* Message attachment image */}
                                     {parsed.image_url && (
                                       <div className="max-w-[280px] sm:max-w-md rounded-[16px] overflow-hidden border border-white/10 bg-[#0a0b14] cursor-zoom-in group/img transition-all hover:border-cyan-500/50 shadow-lg relative mt-2">
                                          <img 
                                            src={parsed.image_url} 
                                            alt="Adjunto" 
                                            className="w-full h-auto object-cover max-h-[400px] transform group-hover/img:scale-[1.02] transition-transform duration-500" 
                                            referrerPolicy="no-referrer"
                                            onClick={() => window.open(parsed.image_url || '', '_blank')}
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors pointer-events-none" />
                                       </div>
                                     )}
                                  </div>
                               )}

                               {/* Hover Options Menu with React emoji buttons */}
                               {!msg.deleted && (
                                 <div className={`
                                   absolute -top-5 right-0
                                   opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0
                                   flex items-center bg-[#0d0f18]/90 backdrop-blur-md shadow-[0_4_20px_rgba(0,0,0,0.5)] rounded-[12px] border border-white/10 px-1.5 py-1 z-30 gap-0.5
                                 `}>
                                    {['👍', '❤️', '🔥', '😂', '💯'].map(emoji => (
                                       <button 
                                         key={emoji}
                                         onClick={() => handleToggleReaction(msg.id, emoji)}
                                         className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[16px] hover:bg-[#1a1d2d] hover:scale-110 transition-all active:scale-95"
                                       >
                                          <span className="drop-shadow-sm">{emoji}</span>
                                       </button>
                                    ))}
                                    
                                    {(isOwn || isAdmin) && (
                                       <div className="w-[1px] h-5 bg-white/10 mx-1.5"></div>
                                    )}
                                    {(isOwn || isAdmin) && (
                                       <button 
                                         onClick={() => deleteMessage(msg.id)} 
                                         className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-red-500/15 text-red-400 hover:text-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)] transition-all active:scale-95"
                                         title="Eliminar mensaje"
                                       >
                                          <Trash2 className="w-4 h-4" />
                                       </button>
                                    )}
                                 </div>
                               )}
                           </div>

                           {/* Rendered custom reactions below message */}
                           {msgReactions.length > 0 && (
                             <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {msgReactions.map(([emoji, meta]: any) => (
                                   <button
                                     key={emoji}
                                     onClick={() => handleToggleReaction(msg.id, emoji)}
                                     className={`
                                       px-2.5 py-1 rounded-[10px] text-[13px] font-bold flex items-center gap-1.5 transition-all active:scale-95 border
                                       ${meta.active 
                                         ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.15)]' 
                                         : 'bg-[#151822]/80 border-white/5 text-gray-400 hover:bg-[#1a1d2d] hover:text-gray-200 hover:border-white/10'}
                                     `}
                                   >
                                      <span className="drop-shadow-sm">{emoji}</span>
                                      <span className="text-[11px] font-black">{meta.count}</span>
                                   </button>
                                ))}
                             </div>
                           )}
                        </div>
                     </div>
                  </motion.div>
                );
             })}
             <div ref={messagesEndRef} className="h-4" />
          </main>

          {/* Message attachment & Send input form */}
          <div className="p-3 sm:p-5 bg-transparent shrink-0 z-20 pb-safe relative">
             <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-[#030407]/90 to-transparent pointer-events-none" />
             <div className="max-w-4xl mx-auto relative z-10">
                
                {/* Visual Image Upload Draft Preview bar */}
                {chatImagePreviewUrl && (
                  <div className="px-4 py-3 bg-[#0d0f18]/90 backdrop-blur-xl rounded-t-[20px] flex items-center gap-3 border border-white/10 border-b-0 max-w-sm mb-0 shadow-2xl relative translate-y-3">
                     <div className="w-12 h-12 rounded-[12px] border border-white/10 overflow-hidden shrink-0 bg-black shadow-inner">
                        <img src={chatImagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1 overflow-hidden">
                        <p className="text-[13px] font-black text-gray-200 truncate">{chatImageFile?.name || "Adjunto"}</p>
                        <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Listo para enviar
                        </p>
                     </div>
                     <button 
                       type="button" 
                       onClick={() => { setChatImageFile(null); setChatImagePreviewUrl(null); }} 
                       className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
                     >
                        <X className="w-4 h-4" />
                     </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
                   
                   {/* Chat input fields and image sub-form togglers */}
                   <div className={`flex-1 relative flex items-center bg-[#090b12]/80 backdrop-blur-3xl border border-white/10 transition-all duration-300 ${chatImagePreviewUrl ? 'rounded-b-[24px] rounded-tr-[24px]' : 'rounded-[24px]'} focus-within:border-cyan-500/50 focus-within:bg-[#0c0e18]/90 shadow-[0_10px_40px_rgba(0,0,0,0.5)] focus-within:shadow-[0_0_40px_rgba(34,211,238,0.15)] group/input`}>
                      <div className="absolute inset-0 rounded-[24px] bg-gradient-to-r from-cyan-900/10 to-blue-900/5 opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none" />
                      {/* Hidden image chooser input */}
                      <input 
                        type="file" 
                        id="chat-image-upload" 
                        accept="image/png, image/jpeg, image/webp, image/gif" 
                        className="hidden" 
                        onChange={handleChatImageChange}
                        disabled={isSending}
                      />
                      
                      {/* Attach button */}
                      <button 
                        type="button"
                        onClick={() => document.getElementById('chat-image-upload')?.click()}
                        disabled={isSending}
                        className="absolute left-2 w-11 h-11 rounded-[16px] hover:bg-cyan-500/20 flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-all active:scale-95 disabled:scale-100 group relative z-10"
                        title="Adjuntar"
                      >
                         <Plus className="w-[22px] h-[22px] group-hover:rotate-90 transition-transform duration-300" />
                      </button>

                      <input 
                        type="text"
                        className="w-full bg-transparent h-[60px] sm:h-[64px] pl-16 pr-16 text-white text-[15px] sm:text-[16px] font-medium tracking-wide focus:outline-none placeholder:text-gray-600 relative z-10"
                        placeholder={`Enviar mensaje en #${activeChannel}...`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isSending}
                        autoComplete="off"
                      />

                      {/* Right edge emoji button (visual only) */}
                      <div className="absolute right-3 w-10 h-10 rounded-[14px] flex items-center justify-center hover:bg-white/5 opacity-60 hover:opacity-100 transition-all cursor-pointer text-gray-400 hover:text-white relative z-10">
                         <Smile className="w-[22px] h-[22px]" />
                      </div>
                   </div>

                   {/* Send Button */}
                   <button 
                      type="submit"
                      disabled={(!newMessage.trim() && !chatImageFile) || isSending}
                      className="w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] shrink-0 bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-[#151822] disabled:to-[#151822] active:scale-95 disabled:scale-100 rounded-[24px] flex items-center justify-center text-white disabled:opacity-50 disabled:text-gray-600 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] disabled:shadow-none relative group overflow-hidden border border-cyan-400/20 disabled:border-white/5"
                   >
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden" />
                      {isSending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5 ml-1 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                   </button>
                </form>
             </div>
          </div>

       </div>
    </div>
  );
}


// ============================================================================
// CREATE MODAL
// ============================================================================

function CreateCommunityModal({ session, isAdmin, onClose, onSuccess }: any) {
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#000000cc] backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 touch-none">
      <motion.div 
        initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
        className="bg-[#0f111a] sm:border border-white/10 sm:rounded-3xl rounded-t-3xl w-full h-[90vh] sm:h-auto sm:max-w-md p-6 sm:p-8 relative shadow-2xl overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto sm:hidden mb-6"></div>
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full p-2" disabled={isCreating}>
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 rounded-2xl flex items-center justify-center mb-6">
           <Hash className="w-8 h-8 text-cyan-400" />
        </div>
        <h3 className="text-3xl font-black text-white italic tracking-tight mb-2">Nueva Comunidad</h3>
        <p className="text-gray-400 mb-8 font-medium">Inicia un tema y construye una nueva audiencia en Nexus.</p>

        {createError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{createError}</span>
          </div>
        )}
        
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            setCreateError(null);
            
            if (!selectedFile) {
               setCreateError("El logo de la comunidad es obligatorio.");
               return;
            }

            setIsCreating(true);
            
            try {
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const desc = formData.get('description') as string;
              const category = formData.get('category') as string;
              
              const cleanName = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
              const uploadRes = await uploadToCloudinary(selectedFile, `NexusHub/${cleanName}/icon`);
              
              if (!uploadRes || (!uploadRes.secure_url && !uploadRes.url)) {
                throw new Error("No se pudo subir la imagen. Por favor, intenta de nuevo.");
              }
              
              const image_url = uploadRes.secure_url || uploadRes.url;
              
              const { data, error } = await supabase.from('communities').insert([{
                name, description: desc, category, creator_id: session.user.id, image_url
              }]).select().single();
              
              if (error) {
                setCreateError(error.message || "Error al crear comunidad. Verifica que el nombre sea único.");
              } else if (data) {
                onSuccess(data);
              }
            } catch (err: any) {
               setCreateError(err?.message || "Ocurrió un error inesperado.");
            } finally {
              setIsCreating(false);
            }
          }} 
          className="space-y-5"
        >
           {/* Upload Logo Section */}
           <div className="flex flex-col items-center mb-6">
              <label htmlFor="logo-upload" className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 w-full text-left">Logo de Comunidad *</label>
              <div 
                className={`w-28 h-28 rounded-3xl border-2 border-dashed ${previewUrl ? 'border-cyan-500' : 'border-white/10 hover:border-cyan-500/50'} flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden group`}
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-500 group-hover:text-cyan-400 transition-colors">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">SUBIR</span>
                  </div>
                )}
              </div>
              <input 
                id="logo-upload"
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
                onChange={handleImageChange}
                disabled={isCreating}
              />
           </div>

           <div>
             <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nombre de la comunidad *</label>
             <input name="name" required disabled={isCreating} className="w-full bg-[#151822] border-2 border-transparent focus:border-cyan-500/50 rounded-xl px-5 py-3.5 text-white focus:outline-none transition-all placeholder:text-gray-600 font-medium shadow-inner" placeholder="P. ej., Torneo Valorant" />
           </div>
           <div>
             <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Acerca de</label>
             <textarea name="description" required disabled={isCreating} className="w-full bg-[#151822] border-2 border-transparent focus:border-cyan-500/50 rounded-xl px-5 py-3.5 text-white min-h-[100px] resize-none focus:outline-none transition-all placeholder:text-gray-600 font-medium shadow-inner" placeholder="De qué se hablará en este espacio..." />
           </div>
           <div>
             <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Categoría Principal</label>
             <div className="relative">
               <select name="category" disabled={isCreating} className="w-full bg-[#151822] border-2 border-transparent focus:border-cyan-500/50 rounded-xl px-5 py-3.5 text-white outline-none transition-all appearance-none font-medium shadow-inner">
                  <option value="Juegos">🎮 Juegos & Esports</option>
                  <option value="Tecnología">💻 Tecnología</option>
                  <option value="Desarrollo">👨‍💻 Desarrollo</option>
                  <option value="General">💬 General</option>
               </select>
             </div>
           </div>
           <div className="pt-6">
             <button type="submit" disabled={isCreating} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
               {isCreating ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
               {isCreating ? 'CREANDO...' : 'CREAR COMUNIDAD'}
             </button>
           </div>
        </form>
      </motion.div>
    </div>
  );
}
