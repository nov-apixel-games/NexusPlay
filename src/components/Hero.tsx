import { Search, Compass, Trophy, PlusSquare, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Hero({ storeName = 'NexusPlay', slogan = 'La plataforma digital de nueva generación' }) {
  return (
    <section className="relative pt-24 pb-12 px-6 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-nexus-cyan/10 blur-[100px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-nexus-green/10 blur-[100px] -z-10" />

      <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel px-4 py-1.5 rounded-full border-cyan-500/20 mb-8 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50" />
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Nexus AI disponible · Generación 2.0</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-6xl sm:text-8xl font-black mb-4 tracking-tighter"
        >
          <span className="neon-text-gradient">{storeName}</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg sm:text-xl text-gray-400 font-medium mb-2"
        >
          {slogan}
        </motion.p>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500 text-sm mb-12 flex flex-wrap justify-center gap-x-2"
        >
          <span>Explora</span> • <span>Descarga</span> • <span>Niveles</span> • <span>Logros</span> • <span>IA</span> • <span>Comunidad</span>
        </motion.p>

        <div className="w-full max-w-2xl relative mb-8 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-nexus-cyan/20 to-nexus-green/20 rounded-2xl blur-lg group-hover:opacity-100 transition duration-1000 group-hover:duration-200 opacity-0" />
          <div className="relative flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar apps, juegos..." 
                className="w-full h-14 bg-nexus-card/80 border border-white/10 rounded-2xl pl-12 pr-4 focus:outline-none focus:border-nexus-cyan/50 transition-all text-lg"
              />
            </div>
            <button className="h-14 px-8 bg-nexus-cyan text-nexus-bg font-bold rounded-2xl hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/20">
              Buscar
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <QuickAction icon={Compass} label="Explorar" color="bg-cyan-500/10 text-cyan-400 border-cyan-500/30" />
          <QuickAction icon={Trophy} label="Ranking" color="bg-yellow-500/10 text-yellow-400 border-yellow-500/30" />
          <QuickAction icon={PlusSquare} label="Colecciones" color="bg-green-500/10 text-green-400 border-green-500/30" />
          <QuickAction icon={Zap} label="Eventos" color="bg-purple-500/10 text-purple-400 border-purple-500/30" />
        </div>
      </div>
    </section>
  );
}

function QuickAction({ icon: Icon, label, color }: { icon: any, label: string, color: string }) {
  return (
    <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 ${color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}
