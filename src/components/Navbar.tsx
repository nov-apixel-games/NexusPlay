import { Search, Bell } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-[#030712]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="group flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xl group-hover:bg-cyan-500 group-hover:text-black transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]">
            N
          </div>
          <span className="font-black text-2xl tracking-tighter text-white">
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

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors group">
          <Bell className="w-5 h-5 group-hover:animate-[wiggle_0.5s_ease-in-out_infinite]" />
          <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#030712]"></div>
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-sm font-black text-white">E</div>
        </div>
      </div>
    </nav>
  );
}
