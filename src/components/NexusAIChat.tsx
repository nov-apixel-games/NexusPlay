import React, { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Send, User, Ghost, Trash2, ArrowLeft, Search, Star, Download, ExternalLink, Sparkles, Zap, Smartphone, Gamepad2, Music, BookOpen, Wrench, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppItem } from '../types';

interface NexusAIChatProps {
  onBack: () => void;
  apps: AppItem[];
  onAppClick: (app: AppItem) => void;
  apiKey?: string;
}

export default function NexusAIChat({ onBack, apps, onAppClick }: NexusAIChatProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AppItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickButtons = [
    { label: 'Offline', icon: Smartphone, q: 'offline' },
    { label: 'Sandbox', icon: Gamepad2, q: 'sandbox' },
    { label: 'Educación', icon: BookOpen, q: 'educación' },
    { label: 'Herramientas', icon: Wrench, q: 'herramientas' },
    { label: 'Tendencia', icon: TrendingUp, q: 'top' },
  ];

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate thinking effect
    setTimeout(() => {
      const q = searchTerm.toLowerCase();
      const filtered = apps.filter(app => 
        app.name.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q) ||
        app.description?.toLowerCase().includes(q) ||
        app.shortDescription?.toLowerCase().includes(q) ||
        app.developer.toLowerCase().includes(q)
      );
      
      setResults(filtered);
      setIsSearching(false);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col font-sans overflow-hidden">
      {/* Background futuristic grid & glow */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_rgba(34,211,238,0.15),_transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

      <header className="h-20 shrink-0 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-6 z-20 sticky top-0">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-95 border border-white/5 shadow-inner">
              <ArrowLeft className="w-6 h-6" />
           </button>
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center border border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse">
                 <BrainCircuit className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="hidden sm:block">
                 <h1 className="text-xl font-black text-white tracking-tighter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">NEXUS AI <span className="text-cyan-400">ENGINE</span></h1>
                 <p className="text-[10px] uppercase font-black tracking-[0.2em] text-cyan-500/80">Recomendaciones Inteligentes</p>
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">En línea</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-10">
         <div className="max-w-5xl mx-auto space-y-12 pb-32">
            
            {/* Hero Search Area */}
            {!hasSearched && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                 <div className="relative mb-8">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-[60px] rounded-full animate-pulse" />
                    <div className="w-28 h-28 rounded-[2.5rem] bg-slate-900 border border-cyan-500/30 flex items-center justify-center relative z-10 shadow-2xl overflow-hidden group">
                       <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                       <BrainCircuit className="w-14 h-14 text-cyan-400 relative z-10" />
                    </div>
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter italic">
                   POTENCIA TUS <span className="text-cyan-400">POSIBILIDADES</span>
                 </h2>
                 <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed">
                   Describe que buscas y nuestro motor neuronal filtrará el catálogo de <span className="text-white font-bold">{apps.length} apps</span> para ti.
                 </p>

                 {/* Quick Action Buttons */}
                 <div className="flex flex-wrap justify-center gap-3 mt-12 w-full max-w-2xl px-4">
                    {quickButtons.map((btn, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setQuery(btn.q);
                          handleSearch(btn.q);
                        }}
                        className="flex items-center gap-2.5 px-5 py-3 bg-slate-900/50 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/50 rounded-2xl text-slate-300 hover:text-cyan-400 transition-all shadow-lg backdrop-blur-md group"
                      >
                        <btn.icon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span className="font-bold text-sm tracking-wide">{btn.label}</span>
                      </motion.button>
                    ))}
                 </div>
              </motion.div>
            )}
            
            {/* Loading State */}
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-24 space-y-6">
                 <div className="relative">
                    <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Zap className="w-6 h-6 text-cyan-400 animate-pulse" />
                    </div>
                 </div>
                 <div className="text-center">
                    <p className="text-cyan-400 font-black tracking-[0.3em] text-xs uppercase animate-pulse">Escaneando red neuronal...</p>
                    <p className="text-slate-500 text-sm mt-2">Buscando coincidencias tácticas</p>
                 </div>
              </div>
            )}

            {/* Empty Results */}
            {!isSearching && hasSearched && results.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/40 border border-red-500/10 rounded-[3rem] p-10 backdrop-blur-md"
              >
                 <Ghost className="w-20 h-20 text-slate-700 mb-6" />
                 <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">No encontré coincidencias exactas</h3>
                 <p className="text-slate-400 mb-8 max-w-sm">
                   El Nexus AI Engine no encontró apps con esos parámetros. Prueba con términos más generales o categorías.
                 </p>
                 <div className="flex flex-col gap-4 w-full max-w-xs">
                    <p className="text-xs font-black text-cyan-500 uppercase tracking-widest">Sugerencias recomendadas:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                       {apps.slice(0, 3).map(app => (
                         <button 
                           key={app.id} 
                           onClick={() => onAppClick(app)}
                           className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl hover:bg-cyan-500/20 text-xs font-bold transition-all text-slate-300"
                         >
                           {app.name}
                         </button>
                       ))}
                    </div>
                 </div>
              </motion.div>
            )}

            {/* Results Grid */}
            {!isSearching && hasSearched && results.length > 0 && (
              <div className="space-y-8">
                 <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div>
                       <h3 className="text-2xl font-black text-white italic truncate tracking-tight">
                         RESULTADOS <span className="text-cyan-400">DESCUBIERTOS</span>
                       </h3>
                       <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                         Se encontraron {results.length} entidades de software
                       </p>
                    </div>
                    <div className="hidden sm:block">
                       <Sparkles className="w-8 h-8 text-cyan-500/40" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {results.map((app, idx) => (
                        <motion.div 
                          key={app.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group bg-slate-900/40 border border-white/5 hover:border-cyan-500/40 rounded-[2rem] p-5 shadow-2xl backdrop-blur-md transition-all duration-300 flex flex-col h-full relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                              <ExternalLink className="w-4 h-4" />
                            </div>
                          </div>

                          <div className="flex gap-4 mb-5">
                             <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-xl group-hover:scale-105 transition-transform duration-300 bg-slate-950">
                                <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                             </div>
                             <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h4 className="font-black text-white text-lg truncate leading-tight group-hover:text-cyan-400 transition-colors uppercase italic tracking-tighter">{app.name}</h4>
                                <p className="text-slate-500 text-xs font-bold truncate mb-2">{app.developer}</p>
                                <div className="flex items-center gap-3">
                                   <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/20">
                                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                      <span className="text-[10px] font-black text-yellow-400">{app.rating}</span>
                                   </div>
                                   <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      <Download className="w-3 h-3" />
                                      <span>{app.downloads}</span>
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div className="flex-1 bg-black/30 rounded-2xl p-4 border border-white/5 mb-6 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/40" />
                             <p className="text-[11px] text-cyan-400 font-black uppercase tracking-[0.2em] mb-1">Análisis IA</p>
                             <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-2">
                               Recomendada porque coincide con tus preferencias de <span className="text-white font-bold">{query}</span> y es popular en {app.category}.
                             </p>
                          </div>

                          <button 
                            onClick={() => onAppClick(app)}
                            className="w-full py-4 bg-white/5 hover:bg-cyan-500 border border-white/10 hover:border-cyan-400 text-white hover:text-black font-black rounded-2xl transition-all shadow-lg active:scale-[0.98] uppercase italic tracking-[0.1em] text-sm"
                          >
                            Abrir Aplicación
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                 </div>
              </div>
            )}

         </div>
      </main>

      {/* Futuristic Fixed Input Box */}
      <div className="p-4 sm:p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-12 z-20 sticky bottom-0">
         <div className="max-w-4xl mx-auto relative group">
            <div className="absolute inset-0 bg-cyan-500/10 blur-[30px] rounded-[2.5rem] opacity-0 group-focus-within:opacity-100 transition-opacity" />
            
            <div className="relative flex items-center bg-slate-900 shadow-2xl border-2 border-white/5 rounded-[2.5rem] overflow-hidden group-focus-within:border-cyan-500/50 transition-all p-1">
               <div className="pl-6 pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                  <Search className="w-6 h-6" />
               </div>
               <input 
                 ref={inputRef}
                 type="text" 
                 value={query}
                 onChange={e => setQuery(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder="Descriptor de aplicaciones: 'juegos livianos'..."
                 className="flex-1 bg-transparent border-none text-white px-5 h-16 lg:h-20 outline-none text-lg lg:text-xl font-medium placeholder:text-slate-600 tracking-tight"
               />
               <button 
                 onClick={() => handleSearch(query)}
                 disabled={!query.trim()}
                 className="h-14 lg:h-18 px-6 lg:px-10 mr-1 rounded-[2rem] bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-30 text-white font-black transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(34,211,238,0.3)] group/btn relative overflow-hidden active:scale-95"
               >
                  <span className="relative z-10 lg:text-lg italic tracking-tighter">SINCRONIZAR</span>
                  <Zap className="w-5 h-5 relative z-10 group-hover/btn:rotate-12 transition-transform" />
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform" />
               </button>
            </div>
            
            <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em] mt-4">
              Nexus AI Protocol v2.5 · Encriptación Cuántica Activa
            </p>
         </div>
      </div>
    </div>
  );
}
