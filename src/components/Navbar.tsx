import { Search, Bell, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  onMenuClick: () => void;
  userProfile?: any;
  session?: any;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
}

export default function Navbar({ onMenuClick, userProfile, session, onLoginClick, onLogoutClick }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  
  // Usar session como fallback secundario si userProfile aún no carga
  const isAuth = !!session || !!userProfile;
  const username = userProfile?.username || session?.user?.email?.split('@')[0] || 'Usuario';

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
    <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-[#030712]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="group flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
        >
          <img 
            src="/logo.png" 
            alt="NexusPlay Logo" 
            className="w-10 h-10 object-contain rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.2)] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all" 
          />
          <span className="font-black tracking-tighter text-white hidden sm:block text-2xl">
            Nexus<span className="text-cyan-400">Play</span>
          </span>
        </button>
      </div>

      <div className="flex-1 max-w-md mx-8 relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input 
          type="text" 
          placeholder="Buscar apps y juegos..." 
          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 text-white placeholder-gray-500 transition-all"
        />
      </div>

      <div className="flex items-center gap-4 relative">
        {isAuth ? (
          <>
              <div className="relative" ref={notifRef}>
                <button 
                   onClick={() => setShowNotifications(!showNotifications)}
                   className="relative p-2 text-gray-400 hover:text-white transition-colors group"
                >
                  <Bell className="w-5 h-5 group-hover:animate-[wiggle_0.5s_ease-in-out_infinite]" />
                  {unreadCount > 0 && (
                     <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#030712]"></div>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-12 w-80 bg-[#0a0b14] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50"
                    >
                       <div className="p-4 border-b border-white/5 flex items-center justify-between">
                         <h3 className="font-bold text-white">Notificaciones</h3>
                         {unreadCount > 0 && <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">{unreadCount} nuevas</span>}
                       </div>
                       <div className="max-h-80 overflow-y-auto no-scrollbar">
                         {notifications.length === 0 ? (
                           <div className="p-8 text-center text-gray-500 text-sm">No tienes notificaciones.</div>
                         ) : (
                           notifications.map(notif => (
                             <div 
                               key={notif.id} 
                               onClick={() => markAsRead(notif.id)}
                               className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${notif.read ? 'opacity-50 hover:opacity-100' : 'bg-white/5'}`}
                             >
                                <div className="font-bold text-sm text-white mb-1">{notif.title}</div>
                                <div className="text-xs text-gray-400 leading-relaxed">{notif.message}</div>
                             </div>
                           ))
                         )}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-3">
                 <div className="hidden sm:block text-right">
                   <div className="text-sm font-bold text-white leading-tight truncate max-w-[120px]">{username}</div>
                   <div className="text-[10px] text-gray-400 capitalize">{userProfile?.role || 'user'}</div>
                 </div>
                 <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20">
                    <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-sm font-black text-white uppercase">
                      {username?.charAt(0) || <UserIcon className="w-4 h-4"/>}
                    </div>
                 </div>
                 <button onClick={onLogoutClick} className="p-2 text-gray-400 hover:text-red-400 transition-colors ml-2" title="Cerrar sesión">
                   <LogOut className="w-5 h-5" />
                 </button>
              </div>
           </>
        ) : (
          <button 
             onClick={onLoginClick}
             className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-colors text-white"
          >
             <LogIn className="w-4 h-4"/> Iniciar Sesión
          </button>
        )}
      </div>
    </nav>
  );
}
