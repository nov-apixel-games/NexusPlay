import React from 'react';
import { motion } from 'motion/react';
import { WifiOff, Gamepad2, ArrowLeft, RefreshCw, Layers } from 'lucide-react';

interface OfflineFallbackProps {
  onBack: () => void;
  onGoToGames: () => void;
  title?: string;
  description?: string;
}

export default function OfflineFallback({ onBack, onGoToGames, title, description }: OfflineFallbackProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col items-center justify-center py-20 px-6 max-w-lg mx-auto text-center"
    >
      <div className="relative mb-8">
        {/* Animated ambient glow ring */}
        <div className="absolute inset-0 bg-red-500/10 rounded-full blur-2xl scale-125 select-none pointer-events-none animate-pulse"></div>
        
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center relative shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <WifiOff className="w-10 h-10 text-red-400" />
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-nexus-text tracking-tight mb-4">
        {title || 'Modo Offline Activado'}
      </h2>
      <p className="text-nexus-text-sec text-sm sm:text-base leading-relaxed mb-10 max-w-sm">
        {description || 'Esta función requiere conexión activa a internet para sincronizarse con el servidor central. ¡Pero puedes seguir explorando las aplicaciones precargadas o divertirte en nuestra sección de juegos!'}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 bg-nexus-card hover:bg-nexus-card border border-nexus-border text-nexus-text font-bold px-6 py-3.5 rounded-2xl transition-all w-full sm:w-auto"
        >
          <ArrowLeft className="w-5 h-5 text-nexus-text-sec" /> Volver al Inicio
        </button>
        <button
          onClick={onGoToGames}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-nexus-text font-black px-6 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-nexus-glow w-full sm:w-auto"
        >
          <Gamepad2 className="w-5 h-5" /> Entrar al Games Hub
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-nexus-border w-full flex items-center justify-center gap-2 text-xs text-nexus-text-sec font-mono">
        <Layers className="w-4 h-4 text-cyan-400/60" /> Servidores locales listos • Cache local activa
      </div>
    </motion.div>
  );
}
