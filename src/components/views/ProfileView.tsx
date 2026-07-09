import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Compass, ShieldCheck, Trophy, Star, Settings, User, Loader2, ArrowRight, Camera, Check, Shuffle, Upload, Gamepad2, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';

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
         type="button" >
          Iniciar sesión / Registrarse
        </button>
      </div>
    );
  }

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
          console.warn(`[ProfileView Profile Update] Schema cache error. Retrying attempt ${attempts} in 600ms...`);
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
  };

  return (
    <div className="pt-24 px-4 sm:px-6 max-w-4xl mx-auto pb-16 space-y-6 sm:space-y-8">
      {/* Profile Banner & Info */}
      <div className="glass-panel rounded-[2rem] border-nexus-border overflow-hidden">
        <div className="h-32 sm:h-48 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 relative">
           <img src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=2800" className="w-full h-full object-cover opacity-30" alt="" />
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
                         if (file && file.type?.startsWith('image/')) {
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
                             alt="AI Generator Output" 
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
                      type="button" >
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
