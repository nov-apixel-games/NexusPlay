import { useAppStore } from '../store/useAppStore';
import { Compass, Trophy, PlusSquare, Zap, Star, Hexagon } from 'lucide-react';
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
  const { t } = useAppStore();
  return (
    <section className="relative pt-28 pb-20 px-6 overflow-hidden min-h-[85vh] flex items-center justify-center">
      {/* Dynamic Sci-Fi Background Elements */}
      <div className="absolute inset-0 bg-nexus-card -z-20"></div>
      
      {/* Subtle Futuristic Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:40px_40px] -z-10 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_20%,transparent_100%)] opacity-70"></div>
      
      <div className="absolute top-0 left-1/4 w-[50rem] h-[50rem] bg-cyan-600/10 rounded-full blur-[150px] -z-10 mix-blend-screen opacity-70 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-0 right-1/4 w-[50rem] h-[50rem] bg-indigo-600/10 rounded-full blur-[150px] -z-10 mix-blend-screen opacity-70" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[100px] -z-10" />

      {/* Floating Particles/Hexagons (simulated with CSS for performance) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div animate={{ y: [0, -20, 0], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[20%] left-[15%] text-cyan-500/20"><Hexagon size={40} /></motion.div>
        <motion.div animate={{ y: [0, 30, 0], opacity: [0.05, 0.2, 0.05] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[60%] left-[5%] text-indigo-500/20"><Hexagon size={60} /></motion.div>
        <motion.div animate={{ y: [0, -40, 0], opacity: [0.05, 0.2, 0.05] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[30%] right-[15%] text-cyan-400/20"><Hexagon size={30} /></motion.div>
        <motion.div animate={{ y: [0, 20, 0], opacity: [0.05, 0.3, 0.05] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[70%] right-[10%] text-blue-500/20"><Hexagon size={50} /></motion.div>
      </div>

      <div className="flex flex-col items-center text-center max-w-[1000px] mx-auto relative z-10 w-full mt-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="relative group cursor-default"
        >
          <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full group-hover:bg-cyan-400/30 transition-all duration-500"></div>
          <div className="relative px-5 py-2 rounded-full border border-cyan-400/30 mb-8 sm:mb-10 flex items-center gap-3 bg-nexus-card/80 backdrop-blur-3xl shadow-nexus-glow">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-full h-full rounded-full bg-cyan-400 animate-ping opacity-60" />
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-nexus-glow" />
            </div>
            <span className="text-[11px] sm:text-[13px] font-black text-cyan-300 uppercase tracking-[0.2em] drop-shadow-md">Nexus AI 2.0 • Sistema Activo</span>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
           className="relative"
        >
          {/* Outer thick glow for text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-500/20 blur-[80px] -z-10 rounded-full"></div>
          
          <h1 className="text-6xl sm:text-8xl md:text-[110px] font-black mb-4 sm:mb-6 tracking-tighter leading-[1.1] relative">
            <span className="relative inline-block pb-2 sm:pb-4">
              <span className="absolute inset-0 bg-gradient-to-br from-nexus-text via-cyan-400 to-blue-500 bg-clip-text text-transparent blur-[12px] opacity-40 select-none hidden sm:block">
                {storeName}
              </span>
              <span className="relative bg-gradient-to-br from-nexus-text via-cyan-400 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
                {storeName}
              </span>
            </span>
          </h1>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="text-lg sm:text-2xl md:text-3xl text-nexus-text font-medium mb-8 sm:mb-10 max-w-3xl leading-relaxed drop-shadow-lg px-4"
        >
          {slogan} <br className="hidden sm:block" />
          <span className="text-cyan-400/80 font-normal">Experiencia premium sin límites.</span>
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-12 sm:mb-16 text-[11px] sm:text-[15px] font-black text-nexus-text-sec tracking-widest uppercase"
        >
          <span className="hover:text-cyan-300 transition-colors cursor-default drop-shadow-sm">{t('nav.games')}</span>
          <span className="text-cyan-500/50">•</span>
          <span className="hover:text-indigo-300 transition-colors cursor-default drop-shadow-sm">{t('nav.sidebar.community')}</span>
          <span className="text-indigo-500/50">•</span>
          <span className="hover:text-blue-300 transition-colors cursor-default drop-shadow-sm">Recompensas</span>
          <span className="text-blue-500/50 hidden sm:inline">•</span>
          <span className="hover:text-purple-300 transition-colors cursor-default drop-shadow-sm hidden sm:inline">Inteligencia</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          className="flex flex-wrap justify-center gap-3 sm:gap-6 z-10 relative px-2"
        >
          <QuickAction icon={Compass} label="Explorar Hub" 
             color="from-cyan-600/20 to-blue-600/20 text-cyan-300 border-cyan-500/40 hover:border-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 shadow-nexus-glow hover:shadow-nexus-glow ring-1 ring-cyan-500/10" 
             onClick={() => onAction?.('explore')} />
          
          <QuickAction icon={Trophy} label="Rankings" 
             color="from-yellow-600/10 to-orange-600/10 text-yellow-300 border-yellow-500/30 hover:border-yellow-400 hover:from-yellow-500/20 hover:to-orange-500/20 shadow-[0_0_20px_rgba(250,204,21,0.15)] hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] ring-1 ring-yellow-500/10" 
             onClick={() => onAction?.('ranking')} />
          
          <QuickAction icon={Zap} label="Eventos XP" 
             color="from-indigo-600/10 to-purple-600/10 text-indigo-300 border-indigo-500/30 hover:border-indigo-400 hover:from-indigo-500/20 hover:to-purple-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] ring-1 ring-indigo-500/10" 
             onClick={() => onAction?.('events')} />
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
      >
        <div className="w-[1px] h-10 sm:h-16 bg-gradient-to-b from-cyan-500/50 to-transparent"></div>
      </motion.div>
    </section>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`group relative flex items-center gap-2 sm:gap-3 px-5 sm:px-7 py-3 sm:py-4 rounded-[16px] sm:rounded-[20px] bg-gradient-to-br border transition-all duration-300 ease-out hover:-translate-y-1 active:scale-[0.98] ${color} backdrop-blur-xl overflow-hidden`}
    >
      <div className="absolute inset-0 bg-nexus-card opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-nexus-surface shadow-inner group-hover:scale-110 transition-transform duration-300">
         <Icon className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-md" />
      </div>
      <span className="text-[14px] sm:text-[16px] font-black tracking-wide drop-shadow-sm">{label}</span>
    </button>
  );
}
