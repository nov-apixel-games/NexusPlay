import React, { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Send, User, Ghost, Trash2, ArrowLeft, Search, Star, Download, ExternalLink, Sparkles, Zap, Smartphone, Gamepad2, Battery, BookOpen, Wrench, Palette, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { AppItem } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  recommendedApps?: AppItem[];
  isError?: boolean;
}

interface NexusAIChatProps {
  onBack: () => void;
  apps: AppItem[];
  onAppClick: (app: AppItem) => void;
  apiKey?: string; // no longer needed on frontend, keep for compatibility
}

export default function NexusAIChat({ onBack, apps, onAppClick }: NexusAIChatProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickButtons = [
    { label: 'Optimizar rendimiento', icon: Cpu, q: 'Quiero mejorar el rendimiento de mi celular' },
    { label: 'Mejorar gaming', icon: Gamepad2, q: 'Recomiéndame apps y tips para mejorar gaming' },
    { label: 'Estudiar mejor', icon: BookOpen, q: 'Necesito apps para estudiar mejor' },
    { label: 'Ahorrar batería', icon: Battery, q: '¿Cómo puedo ahorrar batería?' },
    { label: 'Personalizar Android', icon: Palette, q: 'Quiero personalizar mi Android al máximo' },
  ];

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsTyping(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const catalogue = apps.map(a => ({
        id: a.id,
        name: a.name,
        category: a.category,
        description: a.shortDescription || a.description,
        min_android: a.min_android,
        downloads: a.downloads,
        rating: a.rating
      }));

      const history = messages.map(m => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/nexus-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, history, catalogue }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "API Error");

      const responseText = data.text;
      
      // Parse JSON from markdown or raw output safely
      let recommendedIds: string[] = [];
      let cleanText = responseText;

      const jsonMarkdownMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/i);
      const possibleJsonString = jsonMarkdownMatch ? jsonMarkdownMatch[1] : responseText;
      
      try {
        const potentialJson = possibleJsonString.substring(possibleJsonString.indexOf('['), possibleJsonString.lastIndexOf(']') + 1) ||
                              possibleJsonString.substring(possibleJsonString.indexOf('{'), possibleJsonString.lastIndexOf('}') + 1);
        if (potentialJson) {
           const parsed = JSON.parse(potentialJson);
           if (Array.isArray(parsed)) {
             recommendedIds = parsed;
           } else if (parsed.recommendedIds && Array.isArray(parsed.recommendedIds)) {
             recommendedIds = parsed.recommendedIds;
           }
           // Cleanup text: remove JSON
           cleanText = responseText.replace(possibleJsonString, '').replace(/```(?:json)?/gi, '').trim();
        }
      } catch (e) {
        console.warn("Could not parse JSON blocks perfectly, text might contain raw json");
        // As fallback, just strip markdown json blocks to avoid showing raw code if possible
        cleanText = responseText.replace(/```(?:json)?\n?([\s\S]*?)\n?```/gi, '').trim() || "Aquí tienes algunas recomendaciones.";
      }

      if (!cleanText.trim()) cleanText = "He analizado tus necesidades y aquí están las opciones ideales para ti:";

      const recommendedApps = apps.filter(a => recommendedIds.includes(a.id));

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: cleanText,
        recommendedApps: recommendedApps.length > 0 ? recommendedApps : undefined
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      let errorMsg = "Error temporal de conexión. Reintentando o intentalo de nuevo.";
      if (error.name === 'AbortError') {
        errorMsg = "El servidor está tardando demasiado en responder. Por favor, intenta de nuevo.";
      } else if (error.message) {
        errorMsg = "Hubo un error al procesar tu solicitud. Intenta nuevamente.";
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errorMsg,
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => { inputRef.current?.focus(); }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend(query);
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
        
        <div className="flex items-center gap-2 text-[10px] font-black text-cyan-400 uppercase tracking-widest px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          <span>En línea</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-10 flex flex-col">
         <div className="flex-1 max-w-4xl w-full mx-auto pb-12 flex flex-col gap-6">
            
            {messages.length === 0 && !isTyping ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex flex-col items-center justify-center py-16 text-center my-auto"
              >
                 <div className="relative mb-8">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-[60px] rounded-full animate-pulse" />
                    <div className="w-28 h-28 rounded-[2.5rem] bg-slate-900 border border-cyan-500/30 flex items-center justify-center relative z-10 shadow-2xl overflow-hidden group">
                       <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                       <BrainCircuit className="w-14 h-14 text-cyan-400 relative z-10" />
                    </div>
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter italic">
                   ¿EN QUÉ TE PUEDO <span className="text-cyan-400">AYUDAR?</span>
                 </h2>
                 <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed">
                   Dime qué buscas, los specs de tu celular o qué áreas te gustaría mejorar. Crearé packs y recomendaciones a medida de nuestro catálogo de <span className="text-white font-bold">{apps.length} apps</span>.
                 </p>

                 {/* Quick Action Buttons */}
                 <div className="flex flex-wrap justify-center gap-3 mt-12 w-full max-w-2xl px-4">
                    {quickButtons.map((btn, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSend(btn.q)}
                        className="flex items-center gap-2.5 px-5 py-3 bg-slate-900/50 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/50 rounded-2xl text-slate-300 hover:text-cyan-400 transition-all shadow-lg backdrop-blur-md group"
                      >
                        <btn.icon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span className="font-bold text-sm tracking-wide">{btn.label}</span>
                      </motion.button>
                    ))}
                 </div>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-6">
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-end gap-3 max-w-[90%] md:max-w-[85%]">
                      {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-full bg-cyan-900/50 flex flex-shrink-0 items-center justify-center border border-cyan-500/40">
                          <BrainCircuit className="w-4 h-4 text-cyan-400" />
                        </div>
                      )}
                      
                      <div className={`p-5 rounded-3xl ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-sm' 
                          : msg.isError 
                            ? 'bg-red-950/50 text-red-200 border border-red-500/30 rounded-bl-sm'
                            : 'bg-slate-800/80 text-slate-200 border border-slate-700 rounded-bl-sm prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 max-w-none'
                      }`}>
                        {msg.role === 'user' ? (
                          <div className="text-[15px] leading-relaxed">{msg.text}</div>
                        ) : msg.isError ? (
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                             <span className="font-medium text-sm">{msg.text}</span>
                          </div>
                        ) : (
                          <div className="markdown-body">
                            <Markdown>{msg.text}</Markdown>
                          </div>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex flex-shrink-0 items-center justify-center border border-slate-700">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                    </div>
                    
                    {msg.role === 'model' && msg.recommendedApps && msg.recommendedApps.length > 0 && (
                      <div className="mt-4 w-full pl-11">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                           {msg.recommendedApps.map(app => (
                             <div 
                               key={app.id} 
                               onClick={() => onAppClick(app)}
                               className="bg-slate-900 border border-white/10 hover:border-cyan-400/50 p-4 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 shadow-lg hover:shadow-cyan-900/20 flex gap-4"
                             >
                                <img src={app.icon} alt={app.name} className="w-16 h-16 rounded-xl bg-slate-950 object-cover" />
                                <div className="flex flex-col flex-1 min-w-0 justify-center">
                                  <h4 className="text-white font-bold truncate">{app.name}</h4>
                                  <p className="text-xs text-slate-400 truncate mt-0.5 mb-1.5">{app.developer}</p>
                                  <div className="flex items-center gap-2">
                                     <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold"><Star className="w-3 h-3 fill-yellow-400"/> {app.rating}</span>
                                     <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold"><Download className="w-3 h-3"/> {app.downloads}</span>
                                  </div>
                                </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-end gap-3 max-w-[80%]"
                  >
                    <div className="w-8 h-8 rounded-full bg-cyan-900/50 flex flex-shrink-0 items-center justify-center border border-cyan-500/40">
                      <BrainCircuit className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="p-4 rounded-3xl rounded-bl-sm bg-slate-800/80 border border-slate-700 flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
                
                <div ref={endOfMessagesRef} />
              </div>
            )}
         </div>
      </main>

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 z-20 sticky bottom-0">
         <div className="max-w-4xl mx-auto relative group">
            <div className="absolute inset-0 bg-cyan-500/10 blur-[20px] rounded-3xl opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity" />
            
            <div className="relative flex items-center bg-slate-900 shadow-xl border-2 border-slate-800 rounded-3xl overflow-hidden focus-within:border-cyan-500/50 transition-all p-1.5">
               <input 
                 ref={inputRef}
                 type="text" 
                 value={query}
                 onChange={e => setQuery(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder="Escribe tu consulta o dímelo de esta manera: 'Mi celular es un Galaxy A10...'"
                 className="flex-1 bg-transparent border-none text-white px-5 h-12 lg:h-14 outline-none text-[15px] lg:text-base font-medium placeholder:text-slate-500"
               />
               <button 
                 onClick={() => handleSend(query)}
                 disabled={!query.trim() || isTyping}
                 className="h-10 w-10 lg:h-12 lg:w-12 shrink-0 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 transition-all flex items-center justify-center active:scale-95 ml-2 mr-1"
               >
                  <Send className="w-5 h-5 mx-auto relative right-0.5" />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
