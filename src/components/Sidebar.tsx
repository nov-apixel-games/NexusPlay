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
  onLogout?: () => void;
}

const getMenuItems = (isAdmin: boolean) => [
  { label: 'Plataforma', items: [
    { label: 'Inicio', icon: Home, id: 'home', active: true },
    { label: 'Modo Explorar', icon: Compass, id: 'explore' },
    { label: 'Ranking Global', icon: Trophy, id: 'ranking' },
    { label: 'Nexus Hub', icon: Users, id: 'nexus-hub' },
    { label: 'Colecciones', icon: PlusSquare, id: 'collections' },
    { label: 'Misiones & XP', icon: Zap, id: 'achievements' },
    { label: 'Novedades', icon: Compass, id: 'events' },
    { label: 'Juegos', icon: Gamepad2, id: 'games' },
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  isAdmin: boolean;
  session: any;
  onLogout?: () => void;
  webLogo?: string;
  platformName?: string;
}

export default function Sidebar({ isOpen, onClose, onAction, isAdmin, session, onLogout, webLogo, platformName: propPlatformName = 'NexusPlay' }: SidebarProps) {
  const MENU_ITEMS = getMenuItems(isAdmin);
  const displayLogo = webLogo || localStorage.getItem('nexus_web_logo');
  const platformName = propPlatformName || localStorage.getItem('nexus_platform_name') || 'NexusPlay';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.8 }}
            className="fixed top-0 left-0 h-full w-[280px] sm:w-80 bg-[#06070d]/95 backdrop-blur-2xl z-[70] border-r border-white/5 overflow-y-auto"
          >
            <div className="p-6 pt-8 flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 group">
                  {displayLogo ? (
                     <div className="relative">
                       <div className="absolute inset-0 bg-purple-500 rounded-xl blur-[12px] opacity-40 group-hover:opacity-70 group-hover:blur-[16px] transition-all duration-300"></div>
                       <img 
                         src={displayLogo} 
                         alt={`${platformName} Logo`}
                         className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[16px] object-cover relative z-10 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-transform duration-300 group-hover:scale-105"
                         referrerPolicy="no-referrer"
                       />
                     </div>
                  ) : null}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 font-black tracking-tighter text-2xl sm:text-3xl drop-shadow-sm">{platformName}</span>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 hover:bg-white/10 rounded-full shrink-0 text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {MENU_ITEMS.map((section, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <h3 className="text-gray-500 text-xs font-semibold uppercase px-3 mb-2">{section.label}</h3>
                  {section.items.map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => {
                        onAction(item.id);
                        onClose();
                      }}
                      className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group w-full text-left ${
                        item.id === 'admin-panel' 
                          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]'
                          : item.active 
                            ? 'bg-nexus-cyan/10 text-nexus-cyan shadow-[inset_0_0_10px_rgba(0,242,255,0.1)]' 
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${item.id === 'admin-panel' ? 'text-red-500' : item.active ? 'text-nexus-cyan' : 'text-nexus-cyan/70 group-hover:text-nexus-cyan'}`} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}

              {session && (
                <button 
                  onClick={async (e) => {
                    e.preventDefault();
                    if (onLogout) await onLogout();
                  }} 
                  className="flex items-center gap-4 px-3 py-3 rounded-xl text-red-400 hover:bg-red-400/10 mt-4 transition-all w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
