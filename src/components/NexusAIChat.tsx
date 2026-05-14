import { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Send, User, Bot, AlertTriangle, Key, ArrowLeft } from 'lucide-react';
import { AIConfig } from '../types';
import { GoogleGenAI } from '@google/genai';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function NexusAIChat({ config, onReturn }: { config: AIConfig, onReturn: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (!config.enabled) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#030712] flex flex-col items-center justify-center text-center p-6">
        <button onClick={onReturn} className="absolute top-6 left-6 p-3 rounded-full bg-white/5 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="w-20 h-20 bg-nexus-cyan/10 rounded-full flex items-center justify-center mb-6">
          <BrainCircuit className="w-10 h-10 text-nexus-cyan" />
        </div>
        <h1 className="text-4xl font-black mb-4 tracking-tighter">Nexus AI <span className="text-gray-500">Desactivado</span></h1>
        <p className="text-gray-400 mb-8 leading-relaxed max-w-md">
          El asistente impulsado por inteligencia artificial está temporalmente inactivo. 
          Los administradores de la plataforma deben habilitarlo desde el panel de control.
        </p>
      </div>
    );
  }

  if (!config.apiKey) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#030712] flex flex-col items-center justify-center text-center p-6">
        <button onClick={onReturn} className="absolute top-6 left-6 p-3 rounded-full bg-white/5 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
          <Key className="w-10 h-10 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-black mb-4">Falta Configuración</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          Nexus AI está activo, pero falta la clave de API (API Key) para conectar con el motor de inferencia. Configúralo en el modo administrador.
        </p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: config.apiKey });
      
      const formattedHistory = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // In real scenario we would pass history properly if configured to use chat history.
      const response = await ai.models.generateContent({
        model: config.model || 'gemini-2.5-flash',
        contents: [
            ...formattedHistory,
            { role: 'user', parts: [{ text: userMessage }] }
        ]
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.text || 'Sin respuesta.' }]);
    } catch (err: any) {
      console.error('Nexus AI Error:', err);
      // Wait, let's catch auth or connection errors
      const msg = err?.message || 'Error desconocido de conexión';
      setError(`No se pudo generar la respuesta: ${msg}`);
      
      // Keep user message but allow retry or something similar? Actually we can just show error inline or below.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[200] bg-[#030712] flex flex-col overflow-hidden"
    >
      <div className="h-20 shrink-0 border-b border-white/5 flex items-center px-6 gap-6 relative z-10 bg-black/40 backdrop-blur-md">
        <button onClick={onReturn} className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="w-12 h-12 rounded-xl bg-nexus-cyan/20 flex items-center justify-center">
          <BrainCircuit className="w-6 h-6 text-nexus-cyan" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            Nexus AI <div className="px-2 py-0.5 rounded-md bg-nexus-cyan/20 text-nexus-cyan text-[10px] uppercase font-bold tracking-wider">Beta</div>
          </h1>
          <p className="text-xs text-gray-400 font-medium hidden sm:block">Modelo Activo: {config.model}</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative max-w-5xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
              <BrainCircuit className="w-16 h-16 text-nexus-cyan mb-2" />
              <p className="text-sm font-medium">Inicia una conversación con Nexus AI</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                key={idx} 
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-gradient-to-tr from-cyan-500 to-blue-500 text-white' : 'bg-white/10 text-nexus-cyan'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
                </div>
                <div 
                  className={`max-w-[80%] rounded-2xl p-4 prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:rounded-xl prose-a:text-cyan-400 ${
                    msg.role === 'user' 
                      ? 'bg-nexus-cyan/10 border border-nexus-cyan/20 text-white rounded-tr-sm' 
                      : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
                  }`}
                >
                  <Markdown>{msg.content}</Markdown>
                </div>
              </motion.div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-white/10 text-nexus-cyan shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-pulse">
                <Bot className="w-6 h-6" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 w-24 flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-nexus-cyan rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-nexus-cyan rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-nexus-cyan rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 sm:p-6 bg-[#030712]/90 backdrop-blur-xl shrink-0 mt-auto border-t border-white/5">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-3 max-w-4xl mx-auto"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje a la IA..."
              disabled={isLoading}
              className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm md:text-base focus:outline-none focus:border-nexus-cyan/50 focus:bg-white/10 transition-all text-white placeholder-gray-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-14 h-14 rounded-2xl bg-cyan-500 flex flex-col items-center justify-center text-black hover:bg-cyan-400 active:scale-95 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:hover:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
