import { Home, Compass, Gamepad2, User, Users, AppWindow } from 'lucide-react';

interface BottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export default function BottomNav({ activeView, onNavigate }: BottomNavProps) {
  return (
    <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] glass-panel rounded-2xl flex items-center justify-around h-16 px-1 shadow-2xl z-50 transition-all border-white/5 bg-[#030712]/90 backdrop-blur-xl">
      <NavItem icon={Home} label="Inicio" active={activeView === 'home'} onClick={() => onNavigate('home')} />
      <NavItem icon={AppWindow} label="Apps" active={activeView === 'explore'} onClick={() => onNavigate('explore')} />
      <div 
        onClick={() => onNavigate('games-hub')}
        className={`w-14 h-14 rounded-full flex flex-col items-center justify-center -translate-y-5 shadow-xl border-[3px] border-[#0a0c10] cursor-pointer transition-all ${activeView === 'games-hub' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/50 scale-110' : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/30 hover:scale-105'}`}
      >
        <Gamepad2 className="w-6 h-6 text-white mb-0.5" />
      </div>
      <NavItem icon={Users} label="Nexus" active={activeView === 'nexus-hub'} onClick={() => onNavigate('nexus-hub')} />
      <NavItem icon={User} label="Perfil" active={activeView === 'profile'} onClick={() => onNavigate('profile')} />
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-[54px] pt-1 transition-all ${active ? 'text-cyan-400 -translate-y-1' : 'text-gray-500 hover:text-gray-300'}`}>
      <Icon className={`w-5 h-5 mb-1 transition-transform ${active ? 'scale-110' : ''}`} />
      <span className={`text-[9px] font-black tracking-wider uppercase ${active ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
      {active && <div className="w-1 h-1 bg-cyan-400 rounded-full mt-1 shadow-[0_0_5px_rgba(34,211,238,1)]"></div>}
    </button>
  );
}
