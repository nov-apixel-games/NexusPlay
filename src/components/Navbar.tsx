import { Search, Bell, LogIn, LogOut, User as UserIcon, Sparkles, X, Edit2, User, Mail, Camera, Check, Loader2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../lib/cloudinary';

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

  const isAuth = !!session || !!userProfile;
  const username = userProfile?.username || session?.user?.email?.split('@')[0] || 'Usuario';
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
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setNotifications(data);
    };

    fetchNotifications();

    const channel = supabase.channel('user_notifs')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${userProfile.id}` 
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 10));
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
    setEditError(null);
    setIsSaving(false);
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

      // 2. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          username: cleanUsername, 
          real_name: inputRealName, 
          avatar_url: inputAvatar 
        })
        .eq('id', session.user.id);

      if (profileError && profileError.message && !profileError.message.includes('schema cache')) {
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
  const roleName = userRole === 'admin' ? 'Administrador' : userRole === 'developer' ? 'Desarrollador' : 'Jugador Nexus';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[80px] bg-[#030407]/70 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-6 sm:px-10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
      
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="group flex items-center gap-3 sm:gap-4 transition-transform hover:scale-105 active:scale-95"
        >
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
        <div className="relative flex items-center bg-[#0a0c16]/80 backdrop-blur-xl border border-white/10 group-hover:border-cyan-500/40 rounded-full pr-4 transition-all duration-300 shadow-inner group-hover:bg-[#0d0f1a]/80 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]">
          <div className="pl-5 pr-3 py-3">
             <Search className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar juegos, comunidades, eventos..." 
            readOnly
            className="w-full bg-transparent text-[14px] text-white placeholder-gray-500 focus:outline-none cursor-pointer py-3"
          />
          <div className="bg-white/5 border border-white/10 text-[10px] uppercase font-black text-gray-400 px-2.5 py-1 rounded-[8px] tracking-widest shadow-sm">
            Buscar
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 relative">
        <button 
          onClick={onSearchClick}
          className="md:hidden p-2 text-gray-400 hover:text-cyan-400 transition-colors"
        >
          <Search className="w-6 h-6" />
        </button>
        {isAuth ? (
          <>
              {/* Notificaciones */}
              <div className="relative" ref={notifRef}>
                <button 
                   onClick={() => setShowNotifications(!showNotifications)}
                   className="relative w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-cyan-400 transition-all group"
                >
                  <Bell className="w-5 h-5 group-hover:animate-[wiggle_0.5s_ease-in-out_infinite]" />
                  {unreadCount > 0 && (
                     <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#030407] shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                      className="absolute right-0 top-14 w-80 sm:w-96 bg-[#0a0c16]/95 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50"
                    >
                       <div className="p-5 border-b border-white/5 flex items-center justify-between">
                         <h3 className="font-black text-white text-[15px] flex items-center gap-2"><Bell className="w-4 h-4 text-cyan-400" /> Notificaciones</h3>
                         {unreadCount > 0 && <span className="text-[10px] font-black tracking-widest bg-cyan-500/20 text-cyan-400 px-2.5 py-1 rounded-lg uppercase border border-cyan-500/20">{unreadCount} Nuevas</span>}
                       </div>
                       <div className="max-h-80 overflow-y-auto no-scrollbar">
                         {notifications.length === 0 ? (
                           <div className="p-10 text-center flex flex-col items-center gap-3">
                             <Sparkles className="w-8 h-8 text-gray-600" />
                             <span className="text-gray-500 text-[13px] font-medium tracking-wide">Todo está al día</span>
                           </div>
                         ) : (
                           notifications.map(notif => (
                             <div 
                                key={notif.id} 
                                onClick={() => markAsRead(notif.id)}
                                className={`p-4 sm:p-5 border-b border-white/5 cursor-pointer transition-colors ${notif.read ? 'opacity-50 hover:bg-white/5 hover:opacity-100' : 'bg-cyan-900/10 hover:bg-cyan-900/20 border-l-[3px] border-l-cyan-500'}`}
                             >
                                 <div className="font-black text-[13px] text-white mb-1 drop-shadow-sm">{notif.title}</div>
                                 <div className="text-[12px] text-gray-400 leading-relaxed font-medium">{notif.message}</div>
                             </div>
                           ))
                         )}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Menú de Perfil de Usuario Desplegable (Estilo Play Store / TapTap) */}
              <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-white/10 relative" ref={profileMenuRef}>
                 <div className="hidden lg:block text-right select-none">
                   <div className="text-[14px] font-black text-white leading-tight truncate max-w-[120px]">{username}</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-cyan-500">{userProfile?.role || 'User'}</div>
                 </div>
                 
                 <div 
                   className="relative group cursor-pointer" 
                   onClick={(e) => {
                     e.stopPropagation();
                     setShowProfileMenu(!showProfileMenu);
                   }}
                 >
                    <div className="absolute inset-0 bg-cyan-400 rounded-full blur-[10px] opacity-0 group-hover:opacity-40 transition-opacity"></div>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#121420] border-2 border-white/10 group-hover:border-cyan-400 flex items-center justify-center text-sm font-black text-white uppercase relative z-10 transition-all overflow-hidden shadow-lg animate-fade-in">
                       {userProfile?.avatar_url ? (
                         <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                       ) : (
                         username?.charAt(0) || <UserIcon className="w-5 h-5"/>
                       )}
                    </div>
                 </div>

                 {/* Dropdown del Perfil */}
                 <AnimatePresence>
                   {showProfileMenu && (
                     <motion.div
                       initial={{ opacity: 0, y: 20, scale: 0.95 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: 15, scale: 0.95 }}
                       transition={{ duration: 0.25, type: "spring", stiffness: 350, damping: 26 }}
                       className="absolute right-0 top-14 w-[310px] sm:w-[350px] bg-[#0d0f1a]/95 backdrop-blur-3xl border border-white/10 rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.85)] z-50 overflow-hidden p-6 flex flex-col"
                     >
                        {/* Cabecera del Usuario */}
                        <div className="flex flex-col items-center text-center pb-5 border-b border-white/5 relative">
                          <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 shadow-xl relative mb-3">
                            <div className="w-full h-full rounded-full bg-[#0d0f1a] overflow-hidden flex items-center justify-center font-black text-2xl text-white">
                              {userProfile?.avatar_url ? (
                                <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="Avatar Grande" />
                              ) : (
                                username?.charAt(0)
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-[#121422] rounded-full p-1 border border-white/10">
                              <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-black font-black text-[10px]" title="Nivel del Jugador">
                                Lvl 1
                              </div>
                            </div>
                          </div>

                          <h4 className="text-[17px] font-black text-white leading-tight drop-shadow-sm flex items-center gap-1.5 justify-center">
                            {userRealName || username}
                          </h4>
                          <span className="text-[11px] font-bold text-gray-500 tracking-wider font-mono mt-0.5">{`@${username}`}</span>
                          <span className="text-[11px] text-gray-400 mt-1 flex items-center gap-1.5 truncate max-w-[220px]">
                            <Mail className="w-3.5 h-3.5 text-cyan-400" /> {userEmail}
                          </span>

                          <div className="mt-3 px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-[10px] font-black tracking-widest uppercase border border-cyan-400/20 shadow-sm inline-block">
                            {roleName}
                          </div>

                          {userBio && (
                            <p className="text-[12px] text-gray-400 italic max-w-[2400px] mt-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 line-clamp-2">
                              "{userBio}"
                            </p>
                          )}
                        </div>

                        {/* Lista de Acciones del Menú */}
                        <div className="pt-4 flex flex-col gap-2">
                           {/* Botón Editar Perfil */}
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleOpenEditProfile();
                             }}
                             className="w-full py-3 px-4 bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/30 rounded-2xl text-white hover:text-cyan-400 text-[13px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-wider shadow-sm group"
                           >
                             <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Editar Perfil
                           </button>

                           {/* Botón Mi Cuenta */}
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setShowProfileMenu(false);
                               if (onProfileClick) onProfileClick();
                             }}
                             className="w-full py-3 px-4 bg-transparent hover:bg-white/5 rounded-2xl text-gray-300 hover:text-white text-[13px] font-bold transition-colors flex items-center gap-3 text-left"
                           >
                              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="flex-1">Mi Cuenta</span>
                              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Ir</span>
                           </button>

                           {/* Botón Cerrar Sesión */}
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setShowProfileMenu(false);
                               if (onLogoutClick) onLogoutClick();
                             }}
                             className="w-full py-3 px-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 rounded-2xl text-red-400 hover:text-red-300 text-[13px] font-black transition-all flex items-center gap-3 text-left mt-2"
                           >
                              <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                                <LogOut className="w-4 h-4" />
                              </div>
                              <span className="flex-1 uppercase tracking-wider text-[11px]">Cerrar Sesión</span>
                           </button>
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
          </>
        ) : (
          <button 
             onClick={onLoginClick}
             className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-5 sm:px-6 py-2 sm:py-2.5 rounded-[12px] sm:rounded-[14px] text-[13px] sm:text-[14px] uppercase tracking-widest font-black transition-all text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] active:scale-95"
          >
             <LogIn className="w-4 h-4"/> <span className="hidden sm:inline">Iniciar Sesión</span>
          </button>
        )}
      </div>

      {/* Modal Moderno de Edición de Perfil (Estilo TapTap/Play Store) */}
      <AnimatePresence>
        {showEditProfileModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            {/* Backdrop click blocker to dismiss modal */}
            <div className="absolute inset-0 cursor-default" onClick={() => setShowEditProfileModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 350, damping: 28 }}
              className="bg-[#0a0c16]/95 border border-white/10 rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col relative z-50 overflow-y-auto max-h-[92vh] no-scrollbar"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                <h3 className="text-[17px] sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Edit2 className="w-4.5 h-4.5 text-cyan-400" /> Editar Perfil Nexus
                </h3>
                <button 
                  onClick={() => setShowEditProfileModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold mb-5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-400 shrink-0" /> {editError}
                </div>
              )}

              {/* Form - Avatar Upload & Selector */}
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="relative group cursor-pointer w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 hover:border-cyan-400/50 flex flex-col items-center justify-center overflow-hidden shadow-inner transition-colors">
                    {inputAvatar ? (
                      <img src={inputAvatar} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <UserIcon className="w-8 h-8 text-gray-400" />
                    )}
                    <label 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-black transition-opacity gap-1"
                    >
                      <Camera className="w-4 h-4 text-cyan-400" />
                      {uploadingImage ? 'Subiendo...' : 'SUBIR FOTO'}
                    </label>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="image/*" 
                  />
                  <p className="text-[10px] text-gray-500 font-medium uppercase mt-2 tracking-wider">Toca la foto para cargar una personalizada</p>
                </div>

                {/* Avatar Presets Grid */}
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Foto de Perfil Premium (Presets)</label>
                  <div className="grid grid-cols-6 gap-2 bg-[#05060a] p-3 rounded-2xl border border-white/5">
                    {AVATAR_PRESETS.map((preset, index) => {
                      const isSelected = inputAvatar === preset.url;
                      return (
                        <div 
                          key={index} 
                          onClick={() => setInputAvatar(preset.url)}
                          className={`relative cursor-pointer aspect-square rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-cyan-400 scale-105 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'border-transparent hover:scale-105'}`}
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

                {/* Username Input */}
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre de Usuario (Único)</label>
                  <input 
                    type="text" 
                    value={inputUsername} 
                    onChange={e => setInputUsername(e.target.value)} 
                    placeholder="jugador_nexus"
                    maxLength={15}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-[13px] font-semibold outline-none focus:border-cyan-400 transition-all font-mono"
                  />
                  <span className="text-[10px] text-gray-500 font-bold block mt-1 uppercase tracking-wider">Solo se permiten letras, números y guión bajo (_).</span>
                </div>

                {/* Real name / display name Input */}
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre Visible (Real o Alias)</label>
                  <input 
                    type="text" 
                    value={inputRealName} 
                    onChange={e => setInputRealName(e.target.value)} 
                    placeholder="Nombre Completo"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-[13px] font-semibold outline-none focus:border-cyan-400 transition-all"
                  />
                </div>

                {/* Description / Bio */}
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Descripción o Biografía Corta</label>
                  <textarea 
                    value={inputBio} 
                    onChange={e => setInputBio(e.target.value)} 
                    placeholder="Amo los juegos Pixel-Art y de estrategia."
                    maxLength={100}
                    rows={2}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-[13px] font-semibold outline-none focus:border-cyan-400 transition-all resize-none shadow-inner"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1 font-bold">
                    <span>MÁXIMO 100 CARACTERES</span>
                    <span>{inputBio.length}/100</span>
                  </div>
                </div>

                {/* Buttons Action Footer */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <button 
                    onClick={handleSaveProfile} 
                    disabled={isSaving || uploadingImage} 
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-black font-black uppercase tracking-widest rounded-xl text-[12px] transition-all duration-300 shadow-[0_4px_15px_rgba(34,211,238,0.25)] flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin stroke-[3]" /> Guardando...
                      </>
                    ) : 'Guardar'}
                  </button>
                  <button 
                    onClick={() => setShowEditProfileModal(false)} 
                    disabled={isSaving || uploadingImage} 
                    className="py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-gray-300 hover:text-white font-black uppercase tracking-widest rounded-xl text-[12px] transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
