import { Search, Bell, LogIn, LogOut, User as UserIcon, Gamepad2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  onMenuClick: () => void;
  userProfile?: any;
  session?: any;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onSearchClick?: () => void;
  platformName?: string;
  webLogo?: string;
}

export default function Navbar({ 
  onMenuClick, 
  userProfile, 
  session, 
  onLoginClick, 
  onLogoutClick, 
  onSearchClick,
  platformName = 'NexusPlay',
  webLogo
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  
  // Usar session como fallback secundario si userProfile aún no carga
  const isAuth = !!session || !!userProfile;
  const username = userProfile?.username || session?.user?.email?.split('@')[0] || 'Usuario';
  const displayLogo = webLogo || localStorage.getItem('nexus_web_logo');

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;

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

              <div className="flex items-center gap-3 sm:gap-4 pl-2 sm:pl-4 border-l border-white/10">
                 <div className="hidden lg:block text-right">
                   <div className="text-[14px] font-black text-white leading-tight truncate max-w-[120px]">{username}</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-cyan-500">{userProfile?.role || 'User'}</div>
                 </div>
                 <div className="relative group cursor-pointer" onClick={() => onMenuClick()}>
                    <div className="absolute inset-0 bg-cyan-400 rounded-full blur-[10px] opacity-0 group-hover:opacity-40 transition-opacity"></div>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#121420] border-2 border-white/10 group-hover:border-cyan-400 flex items-center justify-center text-sm font-black text-white uppercase relative z-10 transition-all overflow-hidden shadow-lg">
                       {userProfile?.avatar_url ? (
                         <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                       ) : (
                         username?.charAt(0) || <UserIcon className="w-5 h-5"/>
                       )}
                    </div>
                 </div>
                 <button onClick={onLogoutClick} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors hidden sm:flex" title="Cerrar sesión">
                   <LogOut className="w-5 h-5" />
                 </button>
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
    </nav>
  );
}
