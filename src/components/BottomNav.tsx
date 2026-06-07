import { Home, Compass, Gamepad2, User, Users, AppWindow } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface BottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export default function BottomNav({ activeView, onNavigate }: BottomNavProps) {
  const { t } = useAppStore();
  
  return (
    <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] glass-panel rounded-2xl flex items-center justify-around h-16 px-1 shadow-2xl z-50 transition-all border-nexus-border bg-nexus-bg/90 backdrop-blur-xl">
      <NavItem icon={Home} label={t('nav.home')} active={activeView === 'home'} onClick={() => onNavigate('home')} />
      <NavItem icon={AppWindow} label={t('nav.app.apps')} active={activeView === 'explore'} onClick={() => onNavigate('explore')} />
      <div 
        onClick={() => onNavigate('games-hub')}
        className={`w-14 h-14 rounded-full flex flex-col items-center justify-center -translate-y-5 shadow-xl border-[3px] border-nexus-bg cursor-pointer transition-all ${activeView === 'games-hub' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/50 scale-110' : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/30 hover:scale-105'}`}
      >
        <Gamepad2 className="w-6 h-6 text-nexus-text mb-0.5" />
      </div>
      <NavItem icon={Users} label="Nexus" active={activeView === 'nexus-hub'} onClick={() => onNavigate('nexus-hub')} />
      <NavItem icon={User} label={t('nav.profile')} active={activeView === 'profile'} onClick={() => onNavigate('profile')} />
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-[54px] pt-1 transition-all ${active ? 'text-cyan-400 -translate-y-1' : 'text-nexus-text-sec hover:text-nexus-text'}`}>
      <Icon className={`w-5 h-5 mb-1 transition-transform ${active ? 'scale-110' : ''}`} />
      <span className={`text-[9px] font-black tracking-wider uppercase truncate w-full px-1 ${active ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
      {active && <div className="w-1 h-1 bg-cyan-400 rounded-full mt-1 shadow-nexus-glow"></div>}
    </button>
  );
}
