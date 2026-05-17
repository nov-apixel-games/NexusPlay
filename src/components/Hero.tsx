import { Compass, Trophy, PlusSquare, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Hero({ 
  storeName = 'NexusPlay', 
  slogan = 'La plataforma digital de nueva generación',
  onAction 
}: { 
  storeName?: string, 
  slogan?: string,
  onAction?: (action: string) => void
}) {
  return (
    <section className="relative pt-24 pb-12 px-6 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-cyan-500/20 rounded-full blur-[120px] -z-10 mix-blend-screen opacity-60" />
      <div className="absolute bottom-0 right-1/4 w-[40rem] h-[40rem] bg-indigo-500/20 rounded-full blur-[120px] -z-10 mix-blend-screen opacity-60" />

      <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel px-4 py-1.5 rounded-full border border-cyan-400/30 mb-8 flex items-center gap-2 bg-cyan-950/40 backdrop-blur-xl"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Nexus AI disponible · Generación 2.0</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-6xl sm:text-8xl font-black mb-4 tracking-tight drop-shadow-[0_0_15px_rgba(0,242,255,0.3)]"
        >
          <span className="bg-gradient-to-br from-white via-cyan-100 to-cyan-500 bg-clip-text text-transparent">{storeName}</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg sm:text-2xl text-gray-300 font-medium mb-3 drop-shadow-md"
        >
          {slogan}
        </motion.p>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 text-sm sm:text-base mb-12 flex flex-wrap justify-center gap-x-3 font-semibold"
        >
          <span className="text-gray-300">Explora</span> • <span className="text-gray-300">Descarga</span> • <span className="text-gray-300">Niveles</span> • <span className="text-gray-300">Logros</span> • <span className="text-gray-300">IA</span> • <span className="text-gray-300">Comunidad</span>
        </motion.p>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8">
          <QuickAction icon={Compass} label="Explorar" color="bg-cyan-500/20 text-cyan-300 border-cyan-400/50 hover:bg-cyan-400/30 hover:border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]" onClick={() => onAction?.('explore')} />
          <QuickAction icon={Trophy} label="Ranking" color="bg-yellow-500/20 text-yellow-300 border-yellow-400/50 hover:bg-yellow-400/30 hover:border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]" onClick={() => onAction?.('ranking')} />
          <QuickAction icon={PlusSquare} label="Colecciones" color="bg-green-500/20 text-green-300 border-green-400/50 hover:bg-green-400/30 hover:border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]" onClick={() => onAction?.('collections')} />
          <QuickAction icon={Zap} label="Eventos" color="bg-purple-500/20 text-purple-300 border-purple-400/50 hover:bg-purple-400/30 hover:border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]" onClick={() => onAction?.('events')} />
        </div>
      </div>
    </section>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border transition-all duration-300 hover:scale-[1.03] active:scale-95 ${color} backdrop-blur-md`}>
      <Icon className="w-5 h-5 drop-shadow-md" />
      <span className="text-sm sm:text-base font-bold tracking-wide">{label}</span>
    </button>
  );
}
