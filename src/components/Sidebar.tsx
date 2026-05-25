import { 
  Home, Compass, Trophy, PlusSquare, Zap, Gamepad2, 
  User, Users, Download, Heart, Code, Shield, LogOut, X, BrainCircuit, Settings 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  isAdmin: boolean;
  session: any;
  userProfile?: any;
  onLogout?: () => void;
  webLogo?: string;
  platformName?: string;
}

const getMenuItems = (isAdmin: boolean) => [
  { label: 'Plataforma', items: [
    { label: 'Inicio', icon: Home, id: 'home', active: true },
    { label: 'Modo Explorar', icon: Compass, id: 'explore' },
    { label: 'Games Hub', icon: Gamepad2, id: 'games-hub' },
    { label: 'Ranking Global', icon: Trophy, id: 'ranking' },
    { label: 'Nexus Hub', icon: Users, id: 'nexus-hub' },
    { label: 'Colecciones', icon: PlusSquare, id: 'collections' },
    { label: 'Misiones & XP', icon: Zap, id: 'achievements' },
    { label: 'Novedades', icon: Compass, id: 'events' },
  ]},
  { label: 'Cuenta', items: [
    { label: 'Nexus AI', icon: BrainCircuit, id: 'nexus-ai' },
    { label: 'Mi Perfil', icon: User, id: 'profile' },
    { label: 'Mis Descargas', icon: Download, id: 'downloads' },
    { label: 'Favoritos', icon: Heart, id: 'favorites' },
    { label: 'Configuración', icon: Settings, id: 'settings' },
    ...(isAdmin ? [{ label: 'Panel Admin', icon: Shield, id: 'admin-panel' }] : []),
  ]}
];

export default function Sidebar({ isOpen, onClose, onAction, isAdmin, session, userProfile, onLogout, webLogo, platformName: propPlatformName = 'NexusPlay' }: SidebarProps) {
  const MENU_ITEMS = getMenuItems(isAdmin);
  const displayLogo = webLogo || localStorage.getItem('nexus_web_logo');
  const platformName = propPlatformName || localStorage.getItem('nexus_platform_name') || 'NexusPlay';
  const username = userProfile?.username || session?.user?.email?.split('@')[0] || 'Invitado';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60]"
          />
          <motion.div 
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.8 }}
            className="fixed top-0 left-0 h-full w-[280px] sm:w-[320px] bg-[#06070d]/60 backdrop-blur-3xl z-[70] border-r border-[#1a1c2e] overflow-y-auto shadow-[20px_0_50px_rgba(0,0,0,0.8)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-cyan-500/5 before:to-purple-500/5 before:pointer-events-none"
          >
            <div className="p-6 pt-8 flex flex-col gap-6 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 sm:gap-4 group">
                  {displayLogo ? (
                     <div className="relative">
                       <div className="absolute inset-0 bg-cyan-400 rounded-xl blur-[12px] opacity-40 group-hover:opacity-70 group-hover:blur-[16px] transition-all duration-300"></div>
                       <img 
                         src={displayLogo} 
                         alt={`${platformName} Logo`}
                         className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[16px] object-cover relative z-10 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-transform duration-300 group-hover:scale-105"
                         referrerPolicy="no-referrer"
                       />
                     </div>
                  ) : null}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 font-black tracking-tighter text-2xl sm:text-3xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{platformName}</span>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 bg-white/5 hover:bg-white/15 rounded-full shrink-0 text-gray-400 hover:text-white transition-colors border border-white/5">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* User Mini Profile */}
              <div className="bg-[#0a0c16]/80 p-4 rounded-2xl border border-white/5 flex items-center gap-4 shadow-inner relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="relative isolate shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#121422] border-2 border-[#1a1c2e] shrink-0 flex items-center justify-center relative z-10">
                      {userProfile?.avatar_url ? (
                        <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="User Avatar" />
                      ) : (
                        <User className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    {session && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#0a0c16] rounded-full z-20 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    )}
                 </div>
                 <div className="flex-1 min-w-0 relative z-10">
                   <h4 className="text-white font-black text-sm truncate">{username}</h4>
                   <p className="text-[11px] text-cyan-500 font-bold tracking-widest uppercase truncate">
                     {userProfile?.role || (session ? 'Online' : 'Offline')}
                   </p>
                 </div>
              </div>

              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-1"></div>

              {MENU_ITEMS.map((section, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <h3 className="text-gray-500/80 text-[10px] font-black uppercase tracking-widest px-3 mb-2">{section.label}</h3>
                  {section.items.map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => {
                        onAction(item.id);
                        onClose();
                      }}
                      className={`relative flex items-center gap-4 px-3.5 py-3 rounded-xl transition-all duration-300 group w-full text-left overflow-hidden ${
                        item.id === 'admin-panel' 
                          ? 'bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/30 text-red-400'
                          : item.active 
                            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 text-white shadow-[0_0_20px_rgba(34,211,238,0.1)]' 
                            : 'hover:bg-white/5 border border-transparent hover:border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {item.active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                      )}
                      
                      <div className={`p-1.5 rounded-lg transition-colors ${item.id === 'admin-panel' ? 'bg-red-500/10' : item.active ? 'bg-cyan-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                         <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${item.id === 'admin-panel' ? 'text-red-400' : item.active ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'text-gray-400 group-hover:text-cyan-400'}`} />
                      </div>
                      
                      <span className={`font-bold tracking-wide transition-transform duration-300 group-hover:translate-x-1 ${item.id === 'admin-panel' ? 'text-red-400' : item.active ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{item.label}</span>
                    </button>
                  ))}
                  {idx < MENU_ITEMS.length - 1 && (
                     <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent my-3"></div>
                  )}
                </div>
              ))}

              {session && (
                <>
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-1"></div>
                  <button 
                    onClick={async (e) => {
                      e.preventDefault();
                      if (onLogout) await onLogout();
                    }} 
                    className="group flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-400 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/30 transition-all w-full text-left relative overflow-hidden"
                  >
                    <div className="p-1.5 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                      <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </div>
                    <span className="font-bold tracking-wide">Cerrar Sesión</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
