import { Home, Gamepad2, Search, Heart, User, Compass } from 'lucide-react';

interface BottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export default function BottomNav({ activeView, onNavigate }: BottomNavProps) {
  return (
    <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] glass-panel rounded-2xl flex items-center justify-around h-16 px-2 shadow-2xl z-50 transition-all border-white/5 bg-[#030712]/90 backdrop-blur-xl">
      <NavItem icon={Home} label="Inicio" active={activeView === 'home'} onClick={() => onNavigate('home')} />
      <NavItem icon={Gamepad2} label="Juegos" active={activeView === 'games'} onClick={() => onNavigate('games')} />
      <div 
        onClick={() => onNavigate('explore')}
        className={`w-12 h-12 rounded-full flex items-center justify-center -translate-y-4 shadow-lg border-4 border-[#030712] cursor-pointer transition-colors ${activeView === 'explore' ? 'bg-cyan-400 shadow-cyan-400/40' : 'bg-cyan-500 shadow-cyan-500/40 hover:bg-cyan-400'}`}
      >
        <Compass className="w-6 h-6 text-[#030712]" />
      </div>
      <NavItem icon={Heart} label="Colecciones" active={activeView === 'collections'} onClick={() => onNavigate('collections')} />
      <NavItem icon={User} label="Cuenta" active={activeView === 'profile'} onClick={() => onNavigate('profile')} />
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-cyan-400 -translate-y-1' : 'text-gray-500 hover:text-gray-300'}`}>
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-medium">{label}</span>
      {active && <div className="w-1 h-1 bg-cyan-400 rounded-full mt-0.5 shadow-[0_0_5px_rgba(34,211,238,1)]"></div>}
    </button>
  );
}
