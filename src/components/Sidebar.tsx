import { 
  Home, Compass, Trophy, Gamepad2, 
  User, Users, Download, Heart, Shield, LogOut, X, BrainCircuit, Settings,
  Sparkles, Layers, Box, Cpu, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';

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

const getMenuItems = (isAdmin: boolean, t: any) => [
  { label: t('nav.sidebar.discover'), items: [
    { label: t('nav.home'), icon: Home, id: 'home', active: true, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { label: t('nav.explore'), icon: Compass, id: 'explore', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Games Hub', icon: Gamepad2, id: 'games-hub', color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' },
    { label: 'Nexus AI', icon: BrainCircuit, id: 'nexus-ai', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ]},
  { label: t('nav.sidebar.community'), items: [
    { label: 'Nexus Hub', icon: Users, id: 'nexus-hub', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: t('nav.ranking'), icon: Trophy, id: 'ranking', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  ]},
  { label: t('nav.sidebar.library'), items: [
    { label: t('nav.favorites'), icon: Heart, id: 'favorites', color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { label: t('nav.downloads'), icon: Download, id: 'downloads', color: 'text-nexus-text-sec', bg: 'bg-zinc-300/10' },
  ]},
  { label: t('nav.sidebar.account'), items: [
    { label: t('nav.profile'), icon: User, id: 'profile', color: 'text-nexus-text-sec', bg: 'bg-slate-300/10' },
    { label: t('nav.settings'), icon: Settings, id: 'settings', color: 'text-nexus-text-sec', bg: 'bg-gray-400/10' },
    ...(isAdmin ? [{ label: 'Admin', icon: Shield, id: 'admin-panel', color: 'text-red-500', bg: 'bg-red-500/10' }] : []),
  ]}
];

export default function Sidebar({ isOpen, onClose, onAction, isAdmin, session, userProfile, onLogout, webLogo, platformName: propPlatformName = 'NexusPlay' }: SidebarProps) {
  const { t } = useAppStore();
  const MENU_ITEMS = getMenuItems(isAdmin, t);
  const displayLogo = webLogo || localStorage.getItem('nexus_web_logo');
  const platformName = propPlatformName || localStorage.getItem('nexus_platform_name') || 'Nexus';
  const username = userProfile?.username || session?.user?.email?.split('@')[0] || 'Invitado';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-nexus-overlay backdrop-blur-sm z-[80]"
          />
          <motion.div 
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 250, mass: 0.8 }}
            className="fixed top-0 left-0 h-[100dvh] w-[85%] sm:w-[360px] bg-nexus-card/80 backdrop-blur-3xl z-[90] border-r border-nexus-border overflow-y-auto no-scrollbar shadow-lg flex flex-col"
          >
            {/* Header / Logo Zone */}
            <div className="sticky top-0 z-20 bg-gradient-to-b from-nexus-bg/95 to-nexus-bg/0 p-5 sm:p-6 pb-2 backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {displayLogo ? (
                     <div className="relative p-0.5 rounded-2xl bg-gradient-to-b from-cyan-500/50 to-purple-500/50 shadow-nexus-glow">
                       <img 
                         src={displayLogo} 
                         alt="Logo"
                         className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover relative z-10"
                         referrerPolicy="no-referrer"
                       />
                     </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-nexus-glow">
                      <Zap className="w-5 h-5 text-nexus-text" />
                    </div>
                  )}
                  <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 tracking-tighter">
                    {platformName}
                  </h1>
                </div>
                <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-nexus-card hover:bg-nexus-card-hover border border-nexus-border text-nexus-text-sec hover:text-nexus-text transition-all cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 px-4 sm:px-5 pb-8 space-y-6 mt-4">
              
              {/* User Mini Profile */}
              <div className="p-4 rounded-[20px] bg-nexus-card/50 border border-nexus-border flex items-center gap-4 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-[30px]"></div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-black border border-nexus-border shadow-lg shrink-0 flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform">
                    {userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="User" />
                    ) : (
                      <User className="w-5 h-5 text-nexus-text-sec" />
                    )}
                  </div>
                  {session && (
                    <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-nexus-border rounded-full z-20 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 z-10">
                  <h4 className="text-nexus-text font-black text-[15px] truncate font-mono">@{username}</h4>
                  <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {userProfile?.role || (session ? 'Jugador' : 'Invitado')}
                  </p>
                </div>
              </div>

              {/* Navigation sections */}
              <div className="space-y-6">
                {MENU_ITEMS.map((section, idx) => (
                  <div key={idx} className="space-y-2">
                    <h3 className="text-nexus-text-sec text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-3 mb-1">{section.label}</h3>
                    <div className="space-y-1">
                      {section.items.map((item, i) => (
                        <button 
                          key={i} 
                          onClick={() => {
                            onAction(item.id);
                            onClose();
                          }}
                          className={`flex items-center gap-4 px-3 py-3 w-full rounded-2xl transition-all duration-200 group relative border cursor-pointer ${
                            item.active 
                              ? 'bg-nexus-card-hover border-nexus-border shadow-lg' 
                              : 'bg-transparent border-transparent hover:bg-white-[0.04] hover:border-nexus-border'
                          }`}
                        >
                          {item.active && (
                            <div className="absolute left-0 top-[20%] bottom-[20%] w-1 bg-cyan-400 rounded-r shadow-nexus-glow"></div>
                          )}
                          
                          <div className={`p-2 rounded-xl transition-transform duration-300 group-hover:scale-110 ${item.active ? item.bg : 'bg-nexus-card/50'}`}>
                             <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.active ? item.color : 'text-nexus-text-sec'}`} />
                          </div>
                          
                          <span className={`font-black tracking-wide text-[13px] sm:text-[14px] transition-colors ${item.active ? 'text-nexus-text' : 'text-nexus-text-sec group-hover:text-gray-200'}`}>
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Footer */}
            {session && (
              <div className="p-4 sm:p-5 mt-auto bg-gradient-to-t from-nexus-bg to-transparent sticky bottom-0 z-20">
                <button 
                  onClick={async (e) => {
                    e.preventDefault();
                    if (onLogout) await onLogout();
                  }} 
                  className="flex items-center justify-center gap-2 px-4 py-3.5 w-full rounded-2xl text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all group font-black uppercase tracking-widest text-[11px] sm:text-[12px] cursor-pointer shadow-[0_4px_15px_rgba(239,68,68,0.1)]"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
