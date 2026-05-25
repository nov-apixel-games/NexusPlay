import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Play, Plus, Star, Trophy, Clock, Search, Heart, Share2, MessageSquare, ExternalLink, Zap } from 'lucide-react';
import { GameStudioEditor } from './GameStudioEditor';

interface GamesHubViewProps {
  onBack: () => void;
}

export function GamesHubView({ onBack }: GamesHubViewProps) {
  const [activeTab, setActiveTab] = useState('explore');
  const [editorTemplate, setEditorTemplate] = useState<string | null>(null);

  if (editorTemplate) {
    return <GameStudioEditor initialTemplate={editorTemplate} onBack={() => setEditorTemplate(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] pb-24 md:pb-8">
      {/* Search Header */}
      <div className="bg-[#12141c] border-b border-white/5 sticky top-0 z-50 pt-20 sm:pt-24 pb-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-shrink-0 items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Games Hub</h1>
                <p className="text-cyan-400/80 text-sm font-bold tracking-wide uppercase">Arcade HTML5 & Instant Games</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTab('create')}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-5 py-2.5 rounded-xl font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all transform hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5" /> Crear Juego HTML5
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
            {['explore', 'trending', 'offline', 'favorites'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab === 'explore' && 'Explorar'}
                {tab === 'trending' && 'Top Semanal'}
                {tab === 'offline' && 'Offline Ready'}
                {tab === 'favorites' && 'Mis Favoritos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        {activeTab !== 'create' ? (
          <div className="space-y-12">
            
            {/* Offline Support Banner */}
            {activeTab === 'explore' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-12 bg-emerald-500/10 blur-[50px] rounded-full"></div>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <Zap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Soporte Offline Activado</h3>
                    <p className="text-gray-400 text-sm">Los juegos HTML5 que abras se guardarán automáticamente para jugar sin internet.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Featured Games */}
            <section>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                 <Star className="w-5 h-5 text-yellow-400" /> Destacados de la Comunidad
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-[#12141c] rounded-[24px] overflow-hidden border border-white/5 group hover:border-cyan-500/30 transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    <div className="aspect-video bg-[#1a1c24] relative overflow-hidden flex items-center justify-center">
                      <Gamepad2 className="w-12 h-12 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#12141c] to-transparent opacity-80"></div>
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className="text-xs font-bold text-white uppercase">HTML5</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors">Neon Rider X</h3>
                          <p className="text-gray-400 text-xs mt-1">Por @retro_dev • Arcade</p>
                        </div>
                        <div className="bg-yellow-500/10 text-yellow-500 p-2 rounded-xl flex items-center gap-1 font-bold text-xs">
                           <Star className="w-4 h-4 fill-yellow-500" /> 4.9
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <button className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                           <Play className="w-5 h-5" /> Jugar Ahora
                         </button>
                         <button className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                           <Heart className="w-5 h-5" />
                         </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
          </div>
        ) : (
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-[#12141c] rounded-[32px] border border-white/5 p-8 max-w-4xl mx-auto"
          >
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                <Plus className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">Games Studio (Beta)</h2>
              <p className="text-gray-400 max-w-lg mx-auto">Crea minijuegos HTML5 instantáneos, arcade puzzles o plataformas de forma táctil e intuitiva, 100% desde Android.</p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <div className="flex items-center gap-1.5 bg-[#12141c] border border-emerald-500/30 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">Offline Ready</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#12141c] border border-blue-500/30 px-3 py-1.5 rounded-full">
                  <Zap className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase">Cloudinary Storage</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {[
                 { title: 'Platformer', icon: Gamepad2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                 { title: 'Arcade Shooter', icon: ExternalLink, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                 { title: 'Clicker / Idle', icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                 { title: 'Blank Canvas', icon: Plus, color: 'text-gray-400', bg: 'bg-white/5' },
               ].map((t, i) => (
                 <button key={i} onClick={() => setEditorTemplate(t.title)} className="p-6 rounded-2xl bg-[#1a1c24] border border-white/5 hover:border-cyan-500/30 text-left transition-all hover:bg-[#1f212a] group">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${t.bg} mb-4`}>
                      <t.icon className={`w-6 h-6 ${t.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{t.title}</h3>
                    <p className="text-sm text-gray-500 mt-2">Plantilla base para iniciar</p>
                 </button>
               ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
