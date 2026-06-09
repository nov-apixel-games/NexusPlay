import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, Settings, Edit3, Image as ImageIcon, Check, Loader2, Sparkles, Activity, Star, Calendar, Trophy, Compass, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { useAppStore } from '../../store/useAppStore';

export function ProfileView({ session, userProfile, onLoginClick, onDeveloperAction, onLogoutClick, onSettingsClick, onProfileUpdate }: { 
  session?: any, 
  userProfile?: any, 
  onLoginClick?: () => void,
  onDeveloperAction?: (action: 'activate' | 'open') => void,
  onLogoutClick?: () => void,
  onSettingsClick?: () => void,
  onProfileUpdate?: (profile: any) => void
}) {
  const { t, language } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Real stats
  const [realStats, setRealStats] = useState({
      favorites: 0,
      published: 0,
      activeDays: 0,
  });

  const metadata = session?.user?.user_metadata || {};

  useEffect(() => {
    if (userProfile || session) {
      const initialUser = userProfile?.username || session?.user?.email?.split('@')[0] || 'Usuario';
      setUsername(initialUser);
      setRealName(userProfile?.real_name || metadata.full_name || '');
      setAvatarUrl(userProfile?.avatar_url || metadata.avatar_url || '');
      setBio(userProfile?.bio || metadata.bio || '');
    }
  }, [userProfile, session]);

  useEffect(() => {
    if (session?.user?.id) {
       loadRealStats(session.user.id);
    }
  }, [session?.user?.id]);

  const loadRealStats = async (userId: string) => {
    try {
      // Favorites
      const { count: favCount } = await supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', userId);
      // Published
      const { count: pubCount } = await supabase.from('apps').select('id', { count: 'exact', head: true }).eq('developer_id', userId);
      
      // Active Days calculation
      const createdAt = new Date(userProfile?.created_at || session?.user?.created_at || new Date());
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

      setRealStats({
          favorites: favCount || 0,
          published: pubCount || 0,
          activeDays: diffDays,
      });
    } catch(e) {
      console.warn("Could not load stats", e);
    }
  };

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
         setError(t('settings.uploadError') || 'Error al subir la imagen.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (username.length < 3) throw new Error(t('profile.usernameError') || "El nombre debe tener al menos 3 caracteres");
      
      await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl, full_name: realName, bio: bio }
      });

      const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '');

      let attempts = 0;
      let finalErr = null;
      while (attempts < 3) {
        const { error } = await supabase
          .from('profiles')
          .update({ username: cleanUsername, real_name: realName, avatar_url: avatarUrl, bio: bio })
          .eq('id', session.user.id);
        
        finalErr = error;
        if (!error) break;
        if (error.message && error.message.includes('schema cache')) {
          attempts++;
          await new Promise(r => setTimeout(r, 600));
        } else {
          break;
        }
      }
        
      if (finalErr && finalErr.code !== '23505') {
         throw new Error(finalErr.message || 'Error en base de datos');
      }
      
      setIsEditing(false);
      setSuccessMsg("Perfil actualizado correctamente");
      setTimeout(() => setSuccessMsg(null), 3000);
      
      if (onProfileUpdate) {
        onProfileUpdate({ username: cleanUsername, real_name: realName, avatar_url: avatarUrl, bio: bio });
      }
      
    } catch(err: any) {
      setError(err.message || 'Error al guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="pt-24 px-6 max-w-3xl mx-auto pb-16 flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-nexus-card border border-nexus-border flex items-center justify-center mb-4 text-nexus-text-sec">
          <User className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black">{t('profile.title') || 'Tu Cuenta Nexus'}</h1>
        <p className="text-nexus-text-sec max-w-sm">{t('profile.desc') || 'Inicia sesión para acceder.'}</p>
        <button onClick={onLoginClick} className="mt-4 px-8 py-3 bg-cyan-500 text-white font-bold rounded-xl hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">
          {t('menu.login') || 'Iniciar sesión'}
        </button>
      </div>
    );
  }

  const email = session.user?.email || '';
  const isAdmin = userProfile?.role === 'admin';
  const isDeveloper = userProfile?.role === 'developer' || isAdmin;
  const initial = username.charAt(0).toUpperCase();

  const xp = Number(userProfile?.xp || metadata.xp || 0) || 0;
  const level = Math.floor(xp / 1000) + 1;
  const currentLevelXp = xp % 1000;
  const nextLevelXp = level * 1000;
  const progressPercent = (currentLevelXp / 1000) * 100;

  let joinDate = '-';
  try {
    if (userProfile?.created_at) {
      const date = new Date(userProfile.created_at);
      if (!isNaN(date.getTime())) {
        joinDate = date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long' });
      }
    }
  } catch (e) {
    console.error("Invalid join date", e);
  }

  return (
    <div className="pt-20 px-4 sm:px-6 max-w-5xl mx-auto pb-20 space-y-6 sm:space-y-8 animate-in mt-2 relative">
      {successMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] z-50 flex items-center gap-2">
          <Check className="w-5 h-5" /> {successMsg}
        </div>
      )}

      {/* HEADER HERO */}
      <div className="glass-panel overflow-hidden border border-nexus-border shadow-2xl relative rounded-3xl pb-8 sm:pb-0">
         <div className="h-40 sm:h-48 bg-gradient-to-tr from-cyan-900/50 to-purple-900/50 w-full absolute top-0" />
         
         <div className="pt-20 sm:pt-28 pb-6 px-6 sm:px-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 relative z-10 w-full">
            <div className="relative group shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] sm:rounded-full overflow-hidden border-4 border-nexus-bg bg-nexus-card shadow-2xl relative">
                 {avatarUrl ? (
                   <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-cyan-500 to-purple-500 text-white text-5xl font-black">
                     {initial}
                   </div>
                 )}
                 {uploading && (
                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white backdrop-blur-sm z-10">
                     <Loader2 className="w-8 h-8 animate-spin" />
                   </div>
                 )}
              </div>
              {isEditing && (
                <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-3 bg-cyan-500 text-white rounded-2xl sm:rounded-full shadow-lg border-4 border-nexus-bg hover:bg-cyan-400 hover:scale-105 transition-all z-20">
                  <ImageIcon className="w-5 h-5" />
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </button>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left w-full">
               {isEditing ? (
                  <div className="space-y-4 max-w-lg w-full mb-4 bg-nexus-bg/50 p-5 rounded-2xl border border-nexus-border backdrop-blur-md relative z-10 mt-4 sm:mt-0">
                     <div>
                       <label className="text-[10px] font-black text-nexus-text-sec uppercase tracking-widest mb-1.5 block">Nombre de Usuario</label>
                       <input value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-nexus-card border border-nexus-border rounded-xl px-4 py-3 font-bold focus:border-cyan-500/50 outline-none transition-colors" placeholder="Usuario" />
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-nexus-text-sec uppercase tracking-widest mb-1.5 block">Nombre Visible (Opcional)</label>
                       <input value={realName} onChange={e => setRealName(e.target.value)} className="w-full bg-nexus-card border border-nexus-border rounded-xl px-4 py-3 font-bold focus:border-cyan-500/50 outline-none transition-colors" placeholder="Nombre completo" />
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-nexus-text-sec uppercase tracking-widest mb-1.5 block">Acerca de ti</label>
                       <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-nexus-card border border-nexus-border rounded-xl px-4 py-3 resize-none h-24 font-medium focus:border-cyan-500/50 outline-none transition-colors leading-relaxed" placeholder="Añade tu bio..." maxLength={200} />
                     </div>
                     {error && <p className="text-red-500 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex items-center gap-2"><Trophy className="w-4 h-4"/> {error}</p>}
                     
                     <div className="flex flex-col-reverse sm:flex-row justify-start gap-3 sm:gap-4 mt-6">
                        <button onClick={() => { setIsEditing(false); setError(null); }} className="w-full sm:w-auto px-6 py-3 bg-nexus-card border border-nexus-border text-nexus-text rounded-xl font-black hover:bg-nexus-card-hover transition-colors">
                          Cancelar
                        </button>
                        <button onClick={handleSaveProfile} disabled={saving || uploading} className="w-full sm:w-auto px-8 py-3 bg-cyan-500 text-white font-black rounded-xl hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/20">
                          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                          {saving ? 'Guardando...' : 'Guardar Perfil'}
                        </button>
                     </div>
                  </div>
               ) : (
                  <div className="sm:pb-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-nexus-text drop-shadow-sm">{realName || username}</h1>
                    <p className="text-nexus-text-sec flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-1 sm:gap-2 mt-2 font-medium">
                      <span className="bg-nexus-bg px-2 py-0.5 rounded-md border border-nexus-border text-sm">@{username}</span>
                      <span className="hidden sm:inline opacity-50">•</span>
                      <span className="text-sm opacity-80">{email}</span>
                    </p>
                    <p className="text-nexus-text mt-4 max-w-lg mx-auto sm:mx-0 line-clamp-3 leading-relaxed font-medium bg-nexus-bg/30 p-3 rounded-xl border border-nexus-border/50">
                      {bio || <span className="opacity-50 italic">Todavía no has escrito una biografía.</span>}
                    </p>
                    
                    <div className="mt-6 flex flex-wrap gap-3 justify-center sm:justify-start w-full">
                       <button onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none px-6 py-3 bg-nexus-card hover:bg-nexus-card-hover border border-nexus-border rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-sm group">
                          <Edit3 className="w-4 h-4 group-hover:scale-110 transition-transform text-cyan-400" /> Editar
                       </button>
                       <button onClick={onSettingsClick} className="flex-1 sm:flex-none px-6 py-3 bg-nexus-card hover:bg-nexus-card-hover border border-nexus-border rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-sm">
                          <Settings className="w-4 h-4 text-nexus-text-sec" />
                       </button>
                       <button onClick={onLogoutClick} className="w-full sm:w-auto px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl font-black flex items-center justify-center gap-2 transition-all sm:ml-auto">
                          <LogOut className="w-4 h-4" /> Salir
                       </button>
                    </div>
                  </div>
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pt-4">
         {/* DETAILS */}
         <div className="col-span-1 space-y-6 sm:space-y-8">
            <div className="glass-panel p-6 sm:p-8 border-nexus-border rounded-[2rem] space-y-4">
               <h3 className="font-black text-nexus-text uppercase tracking-widest text-xs flex items-center gap-2 opacity-80">
                 <Shield className="w-4 h-4" /> Rol & Nivel
               </h3>
               
               <div className="flex items-center gap-4">
                 <div className={`p-4 rounded-2xl ${isAdmin ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : isDeveloper ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                   {isAdmin ? <Shield className="w-8 h-8" /> : isDeveloper ? <Sparkles className="w-8 h-8" /> : <User className="w-8 h-8" />}
                 </div>
                 <div>
                   <p className="text-2xl font-black capitalize tracking-tight">{userProfile?.role || 'Mortal'}</p>
                   <p className="text-[10px] font-black text-nexus-text-sec uppercase tracking-widest mt-1">Status Actual</p>
                 </div>
               </div>

               <div className="pt-6 border-t border-nexus-border/50 space-y-3">
                  <div className="flex justify-between items-center whitespace-nowrap">
                    <span className="font-black text-lg">Nivel {level}</span>
                    <span className="text-xs text-nexus-text-sec font-mono font-bold bg-nexus-bg px-2 py-1 rounded-md border border-nexus-border">{xp.toLocaleString()} XP / {nextLevelXp.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 bg-nexus-bg rounded-full overflow-hidden border border-nexus-border/50 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                  </div>
               </div>
            </div>

            <div className="glass-panel p-6 sm:p-8 border-nexus-border rounded-[2rem] space-y-4">
               <h3 className="font-black text-nexus-text uppercase tracking-widest text-xs flex items-center gap-2 opacity-80 mb-6">
                 <Calendar className="w-4 h-4" /> Actividad
               </h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-nexus-bg/50 rounded-xl border border-nexus-border">
                     <span className="text-xs font-bold text-nexus-text-sec uppercase tracking-widest">Miembro desde</span>
                     <span className="font-black text-sm">{joinDate}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-nexus-bg/50 rounded-xl border border-nexus-border">
                     <span className="text-xs font-bold text-nexus-text-sec uppercase tracking-widest">Días activos</span>
                     <span className="font-black text-sm flex items-center gap-1.5"><Activity className="w-4 h-4 text-emerald-400" /> {realStats.activeDays}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* STATS */}
         <div className="col-span-1 lg:col-span-2">
            <div className="glass-panel p-6 sm:p-8 border-nexus-border rounded-[2rem] h-full flex flex-col">
               <h3 className="font-black text-nexus-text uppercase tracking-widest text-xs flex items-center gap-2 mb-6 sm:mb-8 opacity-80">
                 <Trophy className="w-4 h-4" /> Estadísticas Reales
               </h3>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 flex-1">
                  <StatCard icon={<Star className="w-6 h-6 text-yellow-400" />} label="Favoritos Guardados" value={realStats.favorites} bg="bg-yellow-500/10 border-yellow-500/20" />
                  <StatCard icon={<Compass className="w-6 h-6 text-blue-400" />} label="Apps Publicadas" value={realStats.published} bg="bg-blue-500/10 border-blue-500/20" />
                  <StatCard icon={<Sparkles className="w-6 h-6 text-emerald-400" />} label="XP Obtenida" value={xp} bg="bg-emerald-500/10 border-emerald-500/20" />
               </div>

               {(!isDeveloper) && (
                 <div className="mt-8 p-6 sm:p-8 bg-gradient-to-br from-nexus-bg to-nexus-card rounded-[2rem] border-2 border-dashed border-nexus-border/80 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left transition-all hover:border-cyan-500/30 group">
                   <div className="p-5 bg-cyan-500/10 text-cyan-400 rounded-2xl shrink-0 group-hover:scale-110 group-hover:bg-cyan-400 group-hover:text-white transition-all">
                     <Sparkles className="w-8 h-8" />
                   </div>
                   <div>
                     <h4 className="font-black text-xl mb-2 text-nexus-text drop-shadow-sm">Conviértete en Creador</h4>
                     <p className="text-nexus-text-sec text-sm leading-relaxed mb-5 max-w-md font-medium">¿Tienes una aplicación web, un juego o quieres publicar mods? Conviértete en desarrollador verificado y monetiza tus juegos.</p>
                     <button onClick={() => onDeveloperAction?.('open')} className="px-6 py-3 bg-cyan-500 text-white border border-cyan-400/50 rounded-xl font-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all">
                       Aplicar ahora
                     </button>
                   </div>
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: any) {
  return (
    <div className="p-5 sm:p-6 bg-nexus-bg border border-nexus-border rounded-[1.5rem] flex flex-col items-center sm:items-start text-center sm:text-left space-y-4 shadow-sm hover:scale-105 transition-transform">
       <div className={`p-4 rounded-2xl border ${bg}`}>
          {icon}
       </div>
       <div>
         <p className="text-3xl font-black text-nexus-text truncate tracking-tighter">{value !== undefined && value !== null ? value.toLocaleString() : '0'}</p>
         <p className="text-[10px] sm:text-xs text-nexus-text-sec uppercase tracking-widest font-black mt-1 line-clamp-2 leading-tight">{label}</p>
       </div>
    </div>
  );
}
