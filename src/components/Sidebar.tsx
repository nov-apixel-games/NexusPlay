import { 
  Home, Compass, Trophy, PlusSquare, Zap, Gamepad2, 
  User, Download, Heart, Code, Shield, LogOut, X, BrainCircuit 
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
    { label: 'Colecciones', icon: PlusSquare, id: 'collections' },
    { label: 'Eventos & Logros', icon: Zap, id: 'events' },
    { label: 'Juegos', icon: Gamepad2, id: 'games' },
  ]},
  { label: 'Cuenta', items: [
    { label: 'Nexus AI', icon: BrainCircuit, id: 'nexus-ai' },
    { label: 'Mi Perfil', icon: User, id: 'profile' },
    { label: 'Mis Descargas', icon: Download, id: 'downloads' },
    { label: 'Favoritos', icon: Heart, id: 'favorites' },
    ...(isAdmin ? [{ label: 'Panel Admin', icon: Shield, id: 'admin-panel' }] : []),
  ]}
];

export default function Sidebar({ isOpen, onClose, onAction, isAdmin, session, onLogout }: SidebarProps) {
  const MENU_ITEMS = getMenuItems(isAdmin);

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
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-72 bg-[#0a0b14] z-[70] border-r border-white/5 overflow-y-auto"
          >
            <div className="p-6 flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
                  <span className="text-gray-200 font-black tracking-wider text-xl uppercase">NexusPlay</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full">
                  <X className="w-5 h-5" />
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
