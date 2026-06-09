import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, Settings, Edit3, Image as ImageIcon, Check, Loader2, Sparkles, Activity, Star, Calendar, Download, Trophy, Compass, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { useAppStore } from '../../store/useAppStore';

export function ProfileView({ session, userProfile, onLoginClick, onDeveloperAction, onLogoutClick, onSettingsClick }: { 
  session?: any, 
  userProfile?: any, 
  onLoginClick?: () => void,
  onDeveloperAction?: (action: 'activate' | 'open') => void,
  onLogoutClick?: () => void,
  onSettingsClick?: () => void
}) {
  const { t, language } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
         console.warn("DB update issue", finalErr);
      }
      
      setIsEditing(false);
      window.location.reload();
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

  const xp = userProfile?.xp || metadata.xp || 0;
  const level = Math.floor(xp / 1000) + 1;
  const currentLevelXp = xp % 1000;
  const progressPercent = (currentLevelXp / 1000) * 100;

  const joinDate = userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long' }) : '-';

  return (
    <div className="pt-24 px-4 sm:px-6 max-w-4xl mx-auto pb-16 space-y-8 animate-in mt-1">
      {/* HEADER HERO */}
      <div className="glass-panel overflow-hidden border border-nexus-border/50 shadow-2xl relative rounded-3xl">
         <div className="h-40 bg-gradient-to-tr from-cyan-900/30 to-purple-900/30 w-full absolute top-0" />
         
         <div className="pt-24 pb-8 px-6 sm:px-10 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10 w-full">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-nexus-bg bg-nexus-card shadow-2xl">
                 {avatarUrl ? (
                   <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-cyan-500 to-purple-500 text-white text-5xl font-black">
                     {initial}
                   </div>
                 )}
              </div>
              {isEditing && (
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-3 bg-nexus-bg text-nexus-text rounded-full shadow-lg border border-nexus-border hover:bg-nexus-card-hover hover:scale-105 transition-all">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </button>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
               {isEditing ? (
                  <div className="space-y-4 max-w-md w-full mb-4">
                     <div>
                       <label className="text-xs font-bold text-nexus-text-sec uppercase mb-1 block">Usuario</label>
                       <input value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-nexus-bg border border-nexus-border rounded-xl px-4 py-2" placeholder="Usuario" />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-nexus-text-sec uppercase mb-1 block">Nombre real</label>
                       <input value={realName} onChange={e => setRealName(e.target.value)} className="w-full bg-nexus-bg border border-nexus-border rounded-xl px-4 py-2" placeholder="Nombre completo" />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-nexus-text-sec uppercase mb-1 block">Biografía</label>
                       <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-nexus-bg border border-nexus-border rounded-xl px-4 py-2 resize-none h-20" placeholder="Añade tu bio..." />
                     </div>
                     {error && <p className="text-red-500 text-sm">{error}</p>}
                     <div className="flex justify-start gap-4">
                        <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2 bg-nexus-accent text-white font-bold rounded-xl hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Guardar
                        </button>
                        <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-nexus-card-hover border border-nexus-border text-nexus-text rounded-xl font-bold hover:bg-nexus-border">
                          Cancelar
                        </button>
                     </div>
                  </div>
               ) : (
                  <div>
                    <h1 className="text-3xl font-black text-nexus-text">{realName || username}</h1>
                    <p className="text-nexus-text-sec flex items-center justify-center sm:justify-start gap-2 mt-1">
                      @{username} <span className="opacity-50">•</span> {email}
                    </p>
                    <p className="text-nexus-text-sec mt-3 max-w-md line-clamp-2 leading-relaxed">
                      {bio || 'Escribe una biografía en tu perfil para que otros usuarios y estudios te conozcan mejor.'}
                    </p>
                    
                    <div className="mt-6 flex flex-wrap gap-3 justify-center sm:justify-start">
                       <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-nexus-card hover:bg-nexus-card-hover border border-nexus-border rounded-xl font-medium flex items-center gap-2 transition-all">
                          <Edit3 className="w-4 h-4" /> Editar Perfil
                       </button>
                       <button onClick={onSettingsClick} className="px-4 py-2 bg-nexus-card hover:bg-nexus-card-hover border border-nexus-border rounded-xl font-medium flex items-center gap-2 transition-all">
                          <Settings className="w-4 h-4" /> Configuración
                       </button>
                       <button onClick={onLogoutClick} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-medium flex items-center gap-2 transition-all ml-auto sm:ml-0">
                          <LogOut className="w-4 h-4" /> Cerrar Sesión
                       </button>
                    </div>
                  </div>
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* DETAILS */}
         <div className="md:col-span-1 space-y-6">
            <div className="glass-panel p-6 border-nexus-border rounded-[2rem] space-y-4">
               <h3 className="font-bold text-nexus-text uppercase tracking-widest text-xs flex items-center gap-2">
                 <Shield className="w-4 h-4" /> Rol & Nivel
               </h3>
               
               <div className="flex items-center gap-3">
                 <div className={`p-3 rounded-2xl ${isAdmin ? 'bg-purple-500/10 text-purple-400' : isDeveloper ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                   {isAdmin ? <Shield className="w-6 h-6" /> : isDeveloper ? <Sparkles className="w-6 h-6" /> : <User className="w-6 h-6" />}
                 </div>
                 <div>
                   <p className="text-xl font-black capitalize">{userProfile?.role || 'Mortal'}</p>
                   <p className="text-xs font-medium text-nexus-text-sec uppercase tracking-widest">Status Actual</p>
                 </div>
               </div>

               <div className="pt-4 border-t border-nexus-border space-y-2">
                  <div className="flex justify-between items-center whitespace-nowrap">
                    <span className="font-bold">Nivel {level}</span>
                    <span className="text-xs text-nexus-text-sec font-mono">{xp.toLocaleString()} XP / {nextLevelXp.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-nexus-bg rounded-full overflow-hidden border border-nexus-border/50">
                    <div className="h-full bg-gradient-to-r from-nexus-accent to-purple-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                  </div>
               </div>
            </div>

            <div className="glass-panel p-6 border-nexus-border rounded-[2rem] space-y-4">
               <h3 className="font-bold text-nexus-text uppercase tracking-widest text-xs flex items-center gap-2">
                 <Calendar className="w-4 h-4" /> Actividad
               </h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-nexus-text-sec">Miembro desde</span>
                     <span className="font-medium text-sm">{joinDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-nexus-text-sec">Días activos</span>
                     <span className="font-medium text-sm flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-400" /> {realStats.activeDays} d</span>
                  </div>
               </div>
            </div>
         </div>

         {/* STATS */}
         <div className="md:col-span-2">
            <div className="glass-panel p-6 sm:p-8 border-nexus-border rounded-[2rem] h-full">
               <h3 className="font-bold text-nexus-text uppercase tracking-widest text-xs flex items-center gap-2 mb-6">
                 <Trophy className="w-4 h-4" /> Estadísticas Reales
               </h3>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  <StatCard icon={<Star className="w-6 h-6 text-yellow-400" />} label="Favoritos Guardados" value={realStats.favorites} bg="bg-yellow-500/10" />
                  <StatCard icon={<Compass className="w-6 h-6 text-blue-400" />} label="Apps Publicadas" value={realStats.published} bg="bg-blue-500/10" />
                  <StatCard icon={<Sparkles className="w-6 h-6 text-emerald-400" />} label="XP Obtenida" value={xp} bg="bg-emerald-500/10" />
               </div>

               {(!isDeveloper) && (
                 <div className="mt-8 p-6 bg-nexus-bg rounded-[2rem] border border-nexus-border flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left transition-all hover:border-nexus-accent/50">
                   <div className="p-4 bg-nexus-accent/10 text-nexus-accent rounded-full shrink-0">
                     <Sparkles className="w-8 h-8" />
                   </div>
                   <div>
                     <h4 className="font-bold text-lg mb-2">Conviértete en Creador</h4>
                     <p className="text-nexus-text-sec text-sm leading-relaxed mb-4">¿Tienes una aplicación web, un juego o quieres publicar mods? Conviértete en desarrollador verificado.</p>
                     <button onClick={() => onDeveloperAction?.('open')} className="px-5 py-2.5 bg-nexus-card border border-nexus-border rounded-xl font-bold hover:bg-nexus-card-hover">
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
    <div className="p-5 bg-nexus-bg border border-nexus-border rounded-[1.5rem] flex flex-col items-center sm:items-start text-center sm:text-left space-y-3">
       <div className={`p-3 rounded-2xl ${bg}`}>
          {icon}
       </div>
       <div>
         <p className="text-2xl font-black text-nexus-text truncate">{value.toLocaleString()}</p>
         <p className="text-[10px] text-nexus-text-sec uppercase tracking-widest font-bold mt-1 line-clamp-1">{label}</p>
       </div>
    </div>
  );
}
