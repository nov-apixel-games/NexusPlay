import { Search, Bell, LogIn, User as UserIcon, Sparkles, Camera, Check, Loader2, Upload, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../lib/cloudinary';
import { useAppStore } from '../store/useAppStore';
import { ModalWrapper } from './ModalWrapper';

interface NavbarProps {
  onMenuClick: () => void;
  userProfile?: any;
  session?: any;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onSearchClick?: () => void;
  onProfileClick?: () => void;
  platformName?: string;
  webLogo?: string;
}

const AVATAR_PRESETS = [
  { name: 'Onda Futura', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80' },
  { name: 'Brillo Cyber', url: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=150&q=80' },
  { name: 'Orbe Halógeno', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=150&q=80' },
  { name: 'Estrellas Cósmicas', url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=150&q=80' },
  { name: 'Oculto Esmeralda', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=150&q=80' },
  { name: 'Fiebre Volcánica', url: 'https://images.unsplash.com/photo-1618005198143-e5283b519a7f?auto=format&fit=crop&w=150&q=80' },
];

export default function Navbar({ 
  onMenuClick, 
  userProfile, 
  session, 
  onLoginClick, 
  onLogoutClick, 
  onSearchClick,
  onProfileClick,
  platformName = 'NexusPlay',
  webLogo
}: NavbarProps) {
  const { t } = useAppStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  
  // profile menu states
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // edit profile modal input states
  const [inputUsername, setInputUsername] = useState('');
  const [inputRealName, setInputRealName] = useState('');
  const [inputAvatar, setInputAvatar] = useState('');
  const [inputBio, setInputBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Drag & drop metadata / AI generator state
  const [isDragActive, setIsDragActive] = useState(false);
  const [aiPresetSeed, setAiPresetSeed] = useState('');
  const [aiPresetStyle, setAiPresetStyle] = useState('bottts');

  const isAuth = !!session || !!userProfile;
  const username = userProfile?.username || session?.user?.email?.split('@')[0] || (t('nav.user') || 'Usuario');
  const displayLogo = webLogo || localStorage.getItem('nexus_web_logo');
  const userEmail = session?.user?.email || userProfile?.email || '';
  const userBio = session?.user?.user_metadata?.bio || '';
  const userRealName = userProfile?.real_name || session?.user?.user_metadata?.full_name || '';

  useEffect(() => {
    if (!userProfile) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
            const { data } = await supabase.from('notifications')
        .select('*').limit(500)
        .eq('user_id', userProfile.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setNotifications(data);
    };

    fetchNotifications();

        const channel = supabase.channel('user_notifs')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${userProfile.id}` 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // Check if it's already expired just in case
          if (new Date(payload.new.expires_at) > new Date()) {
            setNotifications(prev => [payload.new, ...prev].slice(0, 10));
          }
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleOpenEditProfile = () => {
    setInputUsername(username);
    setInputRealName(userRealName);
    setInputAvatar(userProfile?.avatar_url || '');
    setInputBio(userBio);
    setAiPresetSeed(username || 'nexus_player');
    setEditError(null);
    setIsSaving(false);
    setIsDragActive(false);
    setShowEditProfileModal(true);
    setShowProfileMenu(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      setEditError(null);
      const res = await uploadToCloudinary(file, 'avatars');
      if (res && res.secure_url) {
        setInputAvatar(res.secure_url);
      } else {
        throw new Error('No se recibió la dirección web de la imagen subida.');
      }
    } catch (err: any) {
      console.error(err);
      setEditError(err.message || 'Error al subir imagen. Puedes usar los presets.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (inputUsername.length < 3) {
      setEditError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }
    setEditError(null);
    setIsSaving(true);
    try {
      const cleanUsername = inputUsername.replace(/[^a-zA-Z0-9_]/g, '');

      // 1. Update Auth User Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: inputRealName, 
          avatar_url: inputAvatar, 
          bio: inputBio 
        }
      });
      if (authError) throw authError;

      // 2. Update profiles table with retry for schema cache errors
      let profileError: any = null;
      let attempts = 0;
      while (attempts < 3) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            username: cleanUsername, 
            real_name: inputRealName, 
            avatar_url: inputAvatar 
          })
          .eq('id', session.user.id);
        
        profileError = error;
        if (!error) {
          break;
        }
        if (error.message && error.message.includes('schema cache')) {
          attempts++;
          console.warn(`[Navbar Profile Update] Schema cache error. Retrying attempt ${attempts} in 600ms...`);
          await new Promise(r => setTimeout(r, 600));
        } else {
          break;
        }
      }

      if (profileError) {
        throw profileError;
      }

      // Success
      setShowEditProfileModal(false);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setEditError(err.message || 'Error al actualizar el perfil en la base de datos.');
    } finally {
      setIsSaving(false);
    }
  };

  // Profile Roles
  const userRole = userProfile?.role || 'user';
  const roleName = userRole === 'admin' ? (t('nav.roleAdmin') || 'Administrador') : userRole === 'developer' ? (t('nav.roleDev') || 'Desarrollador') : (t('nav.rolePlayer') || 'Jugador Nexus');

  const xp = userProfile?.xp || 0;
  const level = Math.floor(xp / 1000) + 1;
  const currentLevelXp = xp % 1000;
  const progressPercent = (currentLevelXp / 1000) * 100;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[80px] bg-nexus-card/80 backdrop-blur-3xl border-b border-nexus-border flex items-center justify-between px-6 sm:px-10 shadow-lg">
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
      
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="group flex items-center gap-3 sm:gap-4 transition-transform hover:scale-105 active:scale-95"
         type="button" >
          {displayLogo ? (
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 rounded-xl blur-[12px] opacity-40 group-hover:opacity-70 group-hover:blur-[16px] transition-all duration-300"></div>
              <img 
                src={displayLogo}
                alt={`${platformName} Logo`} 
                className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-xl sm:rounded-[16px] shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-transform duration-300 relative z-10" 
                referrerPolicy="no-referrer"
              />
            </div>
          ) : null}
          <span className="font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 hidden sm:block text-2xl sm:text-3xl drop-shadow-sm">
            {platformName}
          </span>
        </button>
      </div>

      <div 
        className="flex-1 max-w-xl mx-4 sm:mx-10 relative hidden md:block group cursor-pointer" 
        onClick={onSearchClick}
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"></div>
        <div className="relative flex items-center bg-nexus-card/80 backdrop-blur-xl border border-nexus-border group-hover:border-cyan-500/40 rounded-full pr-4 transition-all duration-300 shadow-inner group-hover:bg-nexus-card-hover/90 group-hover:shadow-nexus-glow">
          <div className="pl-5 pr-3 py-3">
             <Search className="w-4 h-4 text-nexus-text-sec group-hover:text-cyan-400 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder={t('nav.search')} 
            readOnly
            className="w-full bg-transparent text-[14px] text-nexus-text placeholder-gray-500 focus:outline-none cursor-pointer py-3"
          />
          <div className="bg-nexus-surface border border-nexus-border text-[10px] uppercase font-black text-nexus-text-sec px-2.5 py-1 rounded-[8px] tracking-widest shadow-sm">
            /
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 relative">
        <button 
          onClick={onSearchClick}
          className="md:hidden p-2 text-nexus-text-sec hover:text-cyan-400 transition-colors"
         type="button" >
          <Search className="w-6 h-6" />
        </button>
        {isAuth ? (
          <>
              {/* Notificaciones */}
              <div className="relative" ref={notifRef}>
                <button 
                   onClick={() => setShowNotifications(!showNotifications)}
                   className="relative w-10 h-10 rounded-full flex items-center justify-center bg-nexus-card hover:bg-nexus-card-hover border border-nexus-border text-nexus-text hover:text-cyan-400 transition-all group"
                >
                  <Bell className="w-5 h-5 group-hover:animate-[wiggle_0.5s_ease-in-out_infinite]" />
                  {unreadCount > 0 && (
                     <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-nexus-border shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                      className="absolute right-0 top-14 w-80 sm:w-96 bg-nexus-card/80 backdrop-blur-2xl border border-nexus-border rounded-[24px] shadow-lg overflow-hidden z-50"
                    >
                       <div className="p-5 border-b border-nexus-border flex items-center justify-between">
                         <h3 className="font-black text-nexus-text text-[15px] flex items-center gap-2"><Bell className="w-4 h-4 text-cyan-400" /> {t('nav.notifications') || 'Notificaciones'}</h3>
                         {unreadCount > 0 && <span className="text-[10px] font-black tracking-widest bg-cyan-500/20 text-cyan-400 px-2.5 py-1 rounded-lg uppercase border border-cyan-500/20">{unreadCount} {t('nav.new') || 'Nuevas'}</span>}
                       </div>
                       <div className="max-h-80 overflow-y-auto no-scrollbar">
                         {notifications.length === 0 ? (
                           <div className="p-10 text-center flex flex-col items-center gap-3">
                             <Sparkles className="w-8 h-8 text-gray-600" />
                             <span className="text-nexus-text-sec text-[13px] font-medium tracking-wide">{t('nav.allCaughtUp') || '{t("nav.allCaughtUp") || "Todo está al día"}'}</span>
                           </div>
                         ) : (
                           notifications.map(notif => (
                             <div 
                                key={notif.id} 
                                onClick={() => markAsRead(notif.id)}
                                className={`p-4 sm:p-5 border-b border-nexus-border cursor-pointer transition-colors ${notif.read ? 'opacity-50 hover:bg-nexus-card hover:opacity-100' : 'bg-cyan-900/10 hover:bg-cyan-900/20 border-l-[3px] border-l-cyan-500'}`}
                             >
                                 <div className="font-black text-[13px] text-nexus-text mb-1 drop-shadow-sm">{notif.title}</div>
                                 <div className="text-[12px] text-nexus-text-sec leading-relaxed font-medium">{notif.message}</div>
                             </div>
                           ))
                         )}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Menú de Perfil de Usuario Desplegable (Estilo Play Store / TapTap) */}
              <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-nexus-border relative" ref={profileMenuRef}>
                 <div className="hidden lg:block text-right select-none cursor-pointer" onClick={(e) => { e.stopPropagation(); if (onProfileClick) onProfileClick(); }}>
                   <div className="text-[14px] font-black text-nexus-text leading-tight truncate max-w-[120px]">{username}</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-cyan-500">{userProfile?.role || 'User'}</div>
                 </div>
                 
                 <div 
                   className="relative group cursor-pointer" 
                   onClick={(e) => {
                     e.stopPropagation();
                     if (onProfileClick) onProfileClick();
                   }}
                 >
                    <div className="absolute inset-0 bg-cyan-400 rounded-full blur-[10px] opacity-0 group-hover:opacity-40 transition-opacity"></div>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-nexus-card border-2 border-nexus-border group-hover:border-cyan-400 flex items-center justify-center text-sm font-black text-nexus-text uppercase relative z-10 transition-all overflow-hidden shadow-lg animate-fade-in">
                       {userProfile?.avatar_url ? (
                         <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="Avatar" onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username || 'nexus')}`; }} />
                       ) : (
                         username?.charAt(0) || <UserIcon className="w-5 h-5"/>
                       )}
                    </div>
                 </div>

              </div>
          </>
        ) : (
          <button 
             onClick={onLoginClick}
             className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-5 sm:px-6 py-2 sm:py-2.5 rounded-[12px] sm:rounded-[14px] text-[13px] sm:text-[14px] uppercase tracking-widest font-black transition-all text-nexus-text shadow-nexus-glow hover:shadow-nexus-glow active:scale-95"
           type="button" >
             <LogIn className="w-4 h-4"/> <span className="hidden sm:inline">{t('auth.login')}</span>
          </button>
        )}
      </div>

      {/* Modal Moderno de Edición de Perfil (Estilo TapTap/Play Store) */}
      <AnimatePresence>
        {showEditProfileModal && (
          <ModalWrapper onClose={() => setShowEditProfileModal(false)}>
            <div className="w-full h-full flex flex-col relative z-50 overflow-hidden">
              {/* Sticky Header */}
              <div className="flex-none p-5 sm:p-6 pb-4 border-b border-nexus-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-nexus-text uppercase tracking-wider leading-none">
                      {t('profile.editProfile') || 'Perfil Personalizado'}
                    </h3>
                    <p className="text-[10px] text-nexus-text-sec font-medium uppercase tracking-widest mt-1">{t("nav.identityHub") || "Identidad en Nexus Hub"}</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto w-full p-5 sm:p-6 no-scrollbar relative min-h-0">
              {editError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold mb-5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-400 shrink-0" /> {editError}
                </div>
              )}

              {/* LIVE CARD PREVIEW (Amazing feature) */}
              <div className="mb-6 w-full p-4 rounded-2xl bg-gradient-to-br from-nexus-bg to-nexus-bg border border-nexus-border shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[40px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-[30px] pointer-events-none" />
                
                <span className="absolute top-3 right-3 text-[8px] uppercase tracking-wider font-mono font-bold text-cyan-500/70 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/10">{t("nav.preview") || "Vista Previa"}</span>
                
                <div className="flex items-center gap-4 relative z-10 w-full">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-nexus-card border border-nexus-border overflow-visible relative shadow-lg shrink-0 flex items-center justify-center font-black text-xl text-nexus-text">
                    {inputAvatar ? (
                      <img 
                        src={inputAvatar} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 rounded-2xl" 
                        alt="Quick Preview" 
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(inputUsername || 'nexus')}`;
                        }}
                      />
                    ) : (
                      <span className="text-2xl">{(inputUsername || username).charAt(0).toUpperCase()}</span>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-nexus-bg text-[10px] font-black rounded-full px-2 py-0.5 border-2 border-slate-950 shadow-lg z-20">
                      Lvl {level}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 pl-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-nexus-text font-black text-base sm:text-lg truncate font-mono">@{inputUsername || 'jugador_nexus'}</h4>
                      <span className="px-1.5 py-0.5 bg-cyan-400/10 text-cyan-400 text-[8px] font-black uppercase rounded border border-cyan-400/20">{roleName}</span>
                    </div>
                    <p className="text-nexus-text-sec text-xs truncate">{inputRealName || 'Tu Nombre o Alias'}</p>
                    <p className="text-nexus-text-sec text-[10px] italic truncate mt-1">"{inputBio || '{t("nav.noBio") || "Sin biografía establecida."}'}"</p>
                  </div>
                </div>
              </div>

              {/* PHOTO PICKER TABS */}
              <div className="mb-6 w-full">
                <div className="grid grid-cols-3 gap-1 bg-nexus-card p-1 rounded-2xl border border-nexus-border mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      const modeEl = document.getElementById('avatar-tab-upload');
                      if (modeEl) modeEl.click();
                    }}
                    className={`py-2 px-1 text-[9px] sm:text-[10px] font-bold text-center rounded-xl transition-all cursor-pointer uppercase tracking-wider ${
                      !inputAvatar.includes('unsplash.com') && !inputAvatar.includes('api.dicebear.com') ? 'bg-cyan-500 text-nexus-bg font-black shadow-nexus-glow' : 'text-nexus-text-sec hover:text-nexus-text'
                    }`}
                  >
                    📂 Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const modeEl = document.getElementById('avatar-tab-ai');
                      if (modeEl) modeEl.click();
                    }}
                    className={`py-2 px-1 text-[9px] sm:text-[10px] font-bold text-center rounded-xl transition-all cursor-pointer uppercase tracking-wider ${
                      inputAvatar.includes('api.dicebear.com') ? 'bg-cyan-500 text-nexus-bg font-black shadow-nexus-glow' : 'text-nexus-text-sec hover:text-nexus-text'
                    }`}
                  >
                    ⚡ IA
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const modeEl = document.getElementById('avatar-tab-presets');
                      if (modeEl) modeEl.click();
                    }}
                    className={`py-2 px-1 text-[9px] sm:text-[10px] font-bold text-center rounded-xl transition-all cursor-pointer uppercase tracking-wider ${
                      inputAvatar.includes('unsplash.com') ? 'bg-cyan-500 text-nexus-bg font-black shadow-nexus-glow' : 'text-nexus-text-sec hover:text-nexus-text'
                    }`}
                  >
                    💎 PRESETS
                  </button>
                </div>

                {/* HIDDEN INPUT TABS SWITCH CONTROLLER */}
                <div className="hidden">
                  <button id="avatar-tab-upload" onClick={() => {
                    if (inputAvatar.includes('unsplash.com') || inputAvatar.includes('api.dicebear.com')) {
                      setInputAvatar('');
                    }
                  }} />
                  <button id="avatar-tab-ai" onClick={() => {
                    const seed = aiPresetSeed || inputUsername || 'nexus';
                    setInputAvatar(`https://api.dicebear.com/7.x/${aiPresetStyle}/svg?seed=${encodeURIComponent(seed)}`);
                  }} />
                  <button id="avatar-tab-presets" onClick={() => {
                    setInputAvatar(AVATAR_PRESETS[0].url);
                  }} />
                </div>

                {/* TAB CONTENT: 1. UPLOAD CUSTOM */}
                {!inputAvatar.includes('unsplash.com') && !inputAvatar.includes('api.dicebear.com') && (
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
                          setUploadingImage(true);
                          setEditError(null);
                          const res = await uploadToCloudinary(file, 'avatars');
                          if (res && res.secure_url) {
                            setInputAvatar(res.secure_url);
                          } else {
                            throw new Error('No se recibió la dirección web de la imagen subida.');
                          }
                        } catch (err: any) {
                          console.error(err);
                          setEditError(err.message || 'Error al subir la imagen.');
                        } finally {
                          setUploadingImage(false);
                        }
                      }
                    }}
                    onClick={() => {
                      if (!uploadingImage) fileInputRef.current?.click();
                    }}
                    className={`relative w-full h-32 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer overflow-hidden ${
                      isDragActive 
                        ? 'border-cyan-400 bg-cyan-950/20 shadow-nexus-glow' 
                        : 'border-nexus-border hover:border-cyan-400/50 bg-nexus-card/80 hover:bg-nexus-card'
                    }`}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                        <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400 animate-pulse">{t("nav.uploading") || "Subiendo a Cloudinary..."}</span>
                      </div>
                    ) : inputAvatar ? (
                      <div className="absolute inset-0 flex items-center justify-center group">
                        <img src={inputAvatar} className="w-full h-full object-cover opacity-80" alt="Uploaded Profile" />
                        <div className="absolute inset-0 bg-nexus-surface opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-xs font-black transition-opacity text-nexus-text gap-2 uppercase">
                          <Upload className="w-5 h-5 text-cyan-400" /> Cambiar Imagen
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 mb-2">
                          <Camera className="w-5 h-5" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-200">{t("nav.dropToUpload") || "Suelta o Clic para subir"}</p>
                        <p className="text-[8px] text-nexus-text-sec uppercase tracking-widest mt-1">{t("nav.supportedFormats") || "PNG, JPG, WEBP (Guardado Seguro)"}</p>
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
                {inputAvatar.includes('api.dicebear.com') && (
                  <div className="space-y-4 bg-nexus-surface/80 p-4 rounded-2xl border border-nexus-border w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-nexus-card border border-nexus-border rounded-xl shrink-0 overflow-hidden flex items-center justify-center p-1.5 shadow-inner">
                        <img 
                          src={inputAvatar} 
                          className="w-full h-full object-contain" 
                          alt="AI Generator Realtime Output" 
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">{t("nav.aiGenerator") || "Generador IA"}</span>
                        <p className="text-[11px] font-bold text-nexus-text truncate w-full">{t("nav.dynamicCreation") || "Creación Dinámica"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 w-full">
                      {[
                        { id: 'bottts', label: t('nav.bottts') || 'Robots' },
                        { id: 'pixel-art', label: t('nav.pixelArt') || 'Pixeles' },
                        { id: 'avataaars', label: t('nav.avataaars') || 'Gente' },
                        { id: 'micah', label: t('nav.abstract') || 'Abstract' }
                      ].map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => {
                            setAiPresetStyle(style.id);
                            const seed = aiPresetSeed || inputUsername || 'nexus';
                            setInputAvatar(`https://api.dicebear.com/7.x/${style.id}/svg?seed=${encodeURIComponent(seed)}`);
                          }}
                          className={`py-2 px-1 text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold rounded-lg transition-all border ${
                            aiPresetStyle === style.id 
                              ? 'bg-cyan-500/15 border-cyan-400 text-cyan-400' 
                              : 'bg-nexus-card border-transparent text-nexus-text-sec hover:text-nexus-text'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2 w-full">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={aiPresetSeed}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAiPresetSeed(val);
                            setInputAvatar(`https://api.dicebear.com/7.x/${aiPresetStyle}/svg?seed=${encodeURIComponent(val || 'nexus')}`);
                          }}
                          placeholder={t("nav.creativeSeed") || "Semilla creativa..."}
                          className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-nexus-text text-[11px] font-mono outline-none focus:border-cyan-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const val = 'nexus_' + Math.floor(Math.random() * 89999 + 10000);
                          setAiPresetSeed(val);
                          setInputAvatar(`https://api.dicebear.com/7.x/${aiPresetStyle}/svg?seed=${encodeURIComponent(val)}`);
                        }}
                        className="p-2 sm:p-2.5 bg-nexus-surface hover:bg-nexus-card-hover border border-nexus-border rounded-xl text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer"
                        title={t("nav.randomSeed") || "Randomizar semilla"}
                      >
                        <Shuffle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: 3. PREMIUM PRESETS */}
                {inputAvatar.includes('unsplash.com') && (
                  <div className="space-y-2 w-full">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-nexus-card/80 p-3 rounded-2xl border border-nexus-border">
                      {AVATAR_PRESETS.map((preset, index) => {
                        const isSelected = inputAvatar === preset.url;
                        return (
                          <div 
                            key={index} 
                            onClick={() => setInputAvatar(preset.url)}
                            className={`relative cursor-pointer aspect-square rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-cyan-400 scale-105 shadow-nexus-glow z-10' : 'border-transparent hover:scale-105'}`}
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

              {/* Form - Inputs Configuration */}
              <div className="space-y-4 w-full pb-2">
                {/* Username Input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[9px] font-black text-nexus-text-sec uppercase tracking-widest">{t("nav.userId") || "Id de Usuario"}</label>
                    {inputUsername.length >= 3 ? (
                      <span className="text-[8px] uppercase font-mono text-green-400 font-black flex items-center gap-0.5">✓ VÁLIDO</span>
                    ) : (
                      <span className="text-[8px] uppercase font-mono text-yellow-500 font-black">MIN 3</span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={inputUsername} 
                    onChange={e => setInputUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} 
                    placeholder="jugador_nexus"
                    maxLength={15}
                    className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-nexus-text text-xs sm:text-[13px] font-semibold outline-none focus:border-cyan-400 transition-all font-mono"
                  />
                  <span className="text-[8px] text-nexus-text-sec font-extrabold block mt-1.5 uppercase tracking-wider">{t("nav.userHint") || "Solo letras, números y guiños bajos (_)."}</span>
                </div>

                {/* Real name / display name Input */}
                <div>
                  <label className="block text-[9px] font-black text-nexus-text-sec uppercase tracking-widest mb-1.5">{t("nav.displayName") || "Nombre Visible"}</label>
                  <input 
                    type="text" 
                    value={inputRealName} 
                    onChange={e => setInputRealName(e.target.value)} 
                    placeholder={t("nav.nameHint") || "Tu Nombre / Alias"}
                    className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-nexus-text text-xs sm:text-[13px] font-semibold outline-none focus:border-cyan-400 transition-all"
                  />
                </div>

                {/* Description / Bio */}
                <div>
                  <label className="block text-[9px] font-black text-nexus-text-sec uppercase tracking-widest mb-1.5">{t("nav.shortBio") || "Biografía corta"}</label>
                  <textarea 
                    value={inputBio} 
                    onChange={e => setInputBio(e.target.value)} 
                    placeholder={t("nav.bioHint") || "¡Hola! Bienvenidos a mi rincón de juegos..."}
                    maxLength={100}
                    rows={2}
                    className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-nexus-text text-xs sm:text-[13px] font-semibold outline-none focus:border-cyan-400 transition-all resize-none shadow-inner"
                  />
                  <div className="flex justify-between text-[8px] text-nexus-text-sec font-mono mt-1 font-extrabold">
                    <span>{t("nav.maxChars") || "MÁXIMO 100 CAR."}</span>
                    <span>{inputBio.length}/100</span>
                  </div>
                </div>
              </div>
              
              </div> {/* End Scrollable Content */}

              {/* Sticky Footer Buttons */}
              <div className="flex-none p-5 sm:p-6 pt-4 border-t border-nexus-border bg-nexus-surface/80 backdrop-blur flex items-center justify-end gap-3 z-20">
                <button 
                  type="button"
                  onClick={() => setShowEditProfileModal(false)} 
                  disabled={isSaving || uploadingImage} 
                  className="py-3 px-5 sm:px-6 bg-nexus-surface hover:bg-nexus-card border border-nexus-border disabled:opacity-50 text-nexus-text hover:text-nexus-text font-black uppercase tracking-widest rounded-xl text-[10px] sm:text-[11px] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving || uploadingImage || inputUsername.length < 3} 
                  className="flex-1 sm:flex-none py-3 px-6 sm:px-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-nexus-bg font-black uppercase tracking-widest rounded-xl text-[10px] sm:text-[11px] transition-all duration-300 shadow-nexus-glow flex items-center justify-center gap-2 cursor-pointer"
                 type="button" >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin stroke-[3]" /> <span className="hidden sm:inline">Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 hidden sm:inline" /> {t('profile.save')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </nav>
  );
}
