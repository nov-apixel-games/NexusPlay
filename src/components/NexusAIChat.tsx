import React, { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Send, User, Ghost, Trash2, ArrowLeft } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';

interface NexusAIChatProps {
  onBack: () => void;
  apiKey?: string;
}

export default function NexusAIChat({ onBack, apiKey }: NexusAIChatProps) {
  const [messages, setMessages] = useState<{role: 'user'|'model', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('nexus_ai_chat');
    if (saved) {
       try { setMessages(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0) {
      localStorage.setItem('nexus_ai_chat', JSON.stringify(messages));
    } else {
      localStorage.removeItem('nexus_ai_chat');
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
       setMessages(p => [...p, { role: 'model', content: '❌ ERROR: API Key no configurada globalmente.'}]);
       return;
    }

    const tempInput = input.trim();
    setInput('');
    setMessages(p => [...p, { role: 'user', content: tempInput }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const chat = ai.chats.create({
         model: 'gemini-2.5-flash',
         config: {
           systemInstruction: "Eres Nexus AI, asistente IA integrado de forma nativa en NexusPlay."
         }
      });
      // Feed history if needed... For now, single shot to avoid parsing history
      const result = await chat.sendMessage({ message: tempInput });
      if (result.text) {
        setMessages(p => [...p, { role: 'model', content: result.text! }]);
      }
    } catch (err: any) {
      setMessages(p => [...p, { role: 'model', content: `❌ Falla de conexión neuronal. Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col font-sans">
      <header className="h-20 shrink-0 border-b border-white/5 bg-[#020617]/90 backdrop-blur-md flex items-center justify-between px-6 z-10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-transform active:scale-95">
              <ArrowLeft className="w-6 h-6" />
           </button>
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-900/40 rounded-2xl flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                 <BrainCircuit className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                 <h1 className="text-xl font-black text-white tracking-tighter shadow-cyan-500/50 drop-shadow-sm">NEXUS AI</h1>
                 <p className="text-[10px] uppercase font-black tracking-widest text-cyan-500/80">Inteligencia Generativa</p>
              </div>
           </div>
        </div>
        <button onClick={() => setMessages([])} className="p-3 text-red-500/70 hover:text-red-400 bg-red-950/20 hover:bg-red-950/40 rounded-xl transition-all border border-red-900/20 group">
           <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#08122c] to-[#020617] custom-scrollbar">
         <div className="max-w-4xl mx-auto space-y-8">
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
                 <div className="w-24 h-24 rounded-full bg-cyan-950/30 flex items-center justify-center mb-6 border border-cyan-900/30 shadow-[0_0_50px_rgba(34,211,238,0.05)]">
                    <BrainCircuit className="w-12 h-12 text-cyan-500" />
                 </div>
                 <h2 className="text-3xl font-black text-white mb-2 tracking-tight">¿En qué puedo asistirte?</h2>
                 <p className="text-gray-400 max-w-sm font-light">Conectado a la base de datos neuronal de NexusPlay para responder a tus consultas de forma inmediata.</p>
              </motion.div>
            )}
            
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                 <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center shadow-lg ${m.role === 'user' ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white' : 'bg-[#0a0f24] border border-cyan-900/50 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]'}`}>
                    {m.role === 'user' ? <User className="w-6 h-6" /> : <Ghost className="w-6 h-6" />}
                 </div>
                 <div className={`max-w-[85%] p-5 sm:p-6 rounded-3xl ${m.role === 'user' ? 'bg-cyan-600/10 border border-cyan-500/20 text-white rounded-tr-sm shadow-xl' : 'bg-black/40 border border-white/5 text-gray-200 rounded-tl-sm shadow-xl'}`}>
                    <div className="prose prose-invert prose-p:leading-relaxed text-[15px] sm:text-base max-w-none">
                       <Markdown>{m.content}</Markdown>
                    </div>
                 </div>
              </motion.div>
            ))}
            
            {loading && (
              <div className="flex gap-4">
                 <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center bg-[#0a0f24] border border-cyan-900/50 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                    <Ghost className="w-6 h-6" />
                 </div>
                 <div className="bg-black/40 border border-white/5 p-5 rounded-3xl rounded-tl-sm flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-bounce" />
                    </div>
                 </div>
              </div>
            )}
            <div ref={endRef} />
         </div>
      </main>

      <footer className="p-4 sm:p-6 bg-[#020617] border-t border-white/5 pb-8 sm:pb-6">
         <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3 relative">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Inicia la transferencia de datos..."
              className="flex-1 bg-black/80 border border-cyan-900/30 focus:border-cyan-500 focus:bg-black text-white rounded-2xl pl-6 pr-4 h-16 transition-all outline-none shadow-inner text-base lg:text-lg"
            />
            <button disabled={loading || !input.trim()} type="submit" className="h-16 px-6 sm:px-10 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-black transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] active:scale-95">
               <span className="hidden sm:inline">ENVIAR</span> <Send className="w-5 h-5" />
            </button>
         </form>
      </footer>
    </div>
  );
}
