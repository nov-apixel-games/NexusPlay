import React, { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Send, User, Trash2, ArrowLeft, Star, Download, Cpu, Gamepad2, Battery, BookOpen, MessageSquarePlus, Copy, Share2, RotateCcw, Check, Menu, X, MessageSquare, Pin, Search, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { AppItem } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useConversations } from '../hooks/useConversations';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  recommendedApps?: AppItem[];
  isError?: boolean;
  errorDetails?: any;
  createdAt?: string;
}

interface NexusAIChatProps {
  onBack: () => void;
  apps: AppItem[];
  onAppClick: (app: AppItem) => void;
  apiKey?: string;
  userProfile?: any;
}

export default function NexusAIChat({ onBack, apps, onAppClick, userProfile }: NexusAIChatProps) {
  const t = useAppStore(state => state.t);
  
  const {
    conversations,
    currentId,
    currentConversation,
    setCurrentId,
    startNew,
    addMessage,
    deleteConversation,
    renameConversation,
    togglePin
  } = useConversations(userProfile?.id || 'anonymous');

  const messages = currentConversation?.messages || [];
  
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const mainRef = useRef<HTMLElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);

  const quickButtons = [
    { label: t('Recomendar juegos') || 'Recomendar juegos', icon: Gamepad2, q: 'Recomiéndame los mejores juegos' },
    { label: t('Optimizar Android') || 'Optimizar Android', icon: Cpu, q: 'Quiero optimizar el rendimiento de mi celular' },
    { label: t('Ayuda con IA') || 'Ayuda con IA', icon: BrainCircuit, q: '¿En qué tareas de IA puedes ayudarme?' },
    { label: t('Ahorrar batería') || 'Ahorrar batería', icon: Battery, q: '¿Cómo puedo ahorrar batería en mi Android?' },
    { label: t('Explorar NexusPlay') || 'Explorar NexusPlay', icon: Star, q: '¿Qué apps destacan hoy en NexusPlay?' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = (text: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Respuesta de NexusAI',
        text: text
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert("Texto copiado al portapapeles");
    }
  };

  const handleScroll = () => {
    if (!mainRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    endOfMessagesRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    isNearBottomRef.current = true; // force scroll on send
    const userMessage: Message = { 
      id: crypto.randomUUID(), 
      role: 'user', 
      text, 
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    addMessage(userMessage);
    setQuery('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setIsTyping(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const catalogue = apps.map(a => ({
        id: a.id,
        name: a.name,
        category: a.category,
        description: a.shortDescription || a.description.substring(0, 100) + '...'
      }));

      // Find last index of user message and only keep current prompt + last 5 contextual messages to avoid huge payload
      const historyLog = messages.slice(-10).map(m => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/nexus-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, history: historyLog, catalogue, language: useAppStore.getState().language }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await res.json();
      if (!data.success) {
        throw Object.assign(new Error(data.error || "API Error"), { details: data.details });
      }

      const responseText = data.text;
      
      // Parse JSON from markdown or raw output safely
      let recommendedIds: string[] = [];
      let cleanText = responseText;

      const jsonMarkdownMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/i) || responseText.match(/```\n?([\s\S]*?)\n?```/i);
      
      if (jsonMarkdownMatch) {
         try {
            const parsed = JSON.parse(jsonMarkdownMatch[1].trim());
            if (Array.isArray(parsed)) {
               recommendedIds = parsed;
            } else if (parsed.recommendedIds && Array.isArray(parsed.recommendedIds)) {
               recommendedIds = parsed.recommendedIds;
            }
         } catch(e) {
            console.warn("Could not parse JSON block", e);
         }
         // Remove the block entirely
         cleanText = responseText.replace(jsonMarkdownMatch[0], '').trim();
      } else {
         // Fallback if no markdown block but arrays exist at the end
         const matchArrayAtEnd = responseText.match(/\[[^\]]*\]\s*$/);
         if (matchArrayAtEnd) {
             try {
                const parsed = JSON.parse(matchArrayAtEnd[0].trim());
                if (Array.isArray(parsed)) {
                   recommendedIds = parsed;
                   cleanText = responseText.replace(matchArrayAtEnd[0], '').trim();
                }
             } catch(e) {}
         }
      }

      // Cleanup stray backticks only if empty or just containing "json" string at the bottom
      cleanText = cleanText.replace(/```(?:json)?/gi, '').trim();

      if (!cleanText.trim()) cleanText = t('He analizado tus necesidades y aquí están las opciones ideales para ti:') || "He analizado tus necesidades y aquí están las opciones ideales para ti:";

      const recommendedApps = apps.filter(a => recommendedIds.includes(a.id));

      const botMessage: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: cleanText,
        recommendedApps: recommendedApps.length > 0 ? recommendedApps : undefined,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      addMessage(botMessage);
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      
      let errorMsg = error.message && error.message !== "API Error" ? error.message : t('Hubo un error al procesar tu solicitud. Intenta nuevamente.') || "Hubo un error al procesar tu solicitud. Intenta nuevamente.";
      
      if (error.name === 'AbortError') {
        errorMsg = t('El servidor está tardando demasiado en responder. Por favor, intenta de nuevo.') || "El servidor está tardando demasiado en responder. Por favor, intenta de nuevo.";
      }
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: errorMsg,
        isError: true,
        errorDetails: error.details,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      addMessage(errorMessage);
    } finally {
      setIsTyping(false);
      setTimeout(() => { inputRef.current?.focus(); }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend(query);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-nexus-bg flex flex-col md:flex-row font-sans overflow-hidden transition-colors duration-300" style={{ height: '100dvh' }}>
      
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {(isSidebarOpen || window.innerWidth > 768) ? (
          <motion.aside
            initial={false}
            animate={{ 
              width: isSidebarOpen ? (window.innerWidth > 768 ? '280px' : '280px') : '0px',
              x: isSidebarOpen ? 0 : (window.innerWidth > 768 ? 0 : '-100%')
            }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className={`fixed md:static inset-y-0 left-0 z-[120] bg-nexus-card border-r border-nexus-border flex flex-col overflow-hidden ${!isSidebarOpen && window.innerWidth > 768 ? 'border-r-0' : ''}`}
          >
            <div className="p-4 border-b border-nexus-border flex items-center justify-between w-[280px]">
           <div className="flex items-center gap-2 text-nexus-text font-semibold">
              <BrainCircuit className="w-5 h-5 text-blue-500" />
              Historial
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="p-2 md:hidden text-nexus-text-sec hover:text-nexus-text bg-nexus-bg hover:bg-nexus-card-hover rounded-full">
              <X className="w-4 h-4" />
           </button>
        </div>
        
        <div className="p-3">
          <button onClick={() => { startNew(); setIsSidebarOpen(false); }} className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm active:scale-95">
             <MessageSquarePlus className="w-4 h-4" />
             Nueva Conversación
          </button>
        </div>

        <div className="px-3 pb-2">
           <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-nexus-text-sec" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-nexus-bg text-nexus-text text-[13px] rounded-xl pl-9 pr-3 py-2 border border-nexus-border focus:border-blue-500/50 outline-none"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
           {conversations
             .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
             .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.createdAt - a.createdAt)
             .map(conv => (
               <div key={conv.id} className={`group relative flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-colors ${currentId === conv.id ? 'bg-blue-500/10 text-blue-500' : 'text-nexus-text hover:bg-nexus-card-hover'}`} onClick={() => { setCurrentId(conv.id); setIsSidebarOpen(false); }}>
                  <MessageSquare className={`w-4 h-4 shrink-0 ${currentId === conv.id ? 'text-blue-500' : 'text-nexus-text-sec'}`} />
                  
                  {editingId === conv.id ? (
                    <input 
                      autoFocus
                      className="flex-1 bg-transparent border-b border-blue-500 outline-none text-[13px]"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => { renameConversation(conv.id, editTitle || conv.title); setEditingId(null); }}
                      onKeyDown={e => { if(e.key === 'Enter') { renameConversation(conv.id, editTitle || conv.title); setEditingId(null); } }}
                    />
                  ) : (
                    <div className="flex-1 min-w-0 pr-12">
                      <p className="text-[13px] font-medium truncate">{conv.title}</p>
                    </div>
                  )}

                  {!editingId && (
                    <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-nexus-card-hover md:bg-nexus-card pl-2 rounded-l-xl transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); togglePin(conv.id); }} className={`p-1.5 rounded-md hover:bg-nexus-bg ${conv.isPinned ? 'text-blue-500' : 'text-nexus-text-sec hover:text-nexus-text'}`}>
                         <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEditTitle(conv.title); setEditingId(conv.id); }} className="p-1.5 text-nexus-text-sec hover:text-nexus-text hover:bg-nexus-bg rounded-md">
                         <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} className="p-1.5 text-nexus-text-sec hover:text-red-500 hover:bg-nexus-bg rounded-md">
                         <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {conv.isPinned && !editingId && <Pin className="w-3 h-3 text-blue-500 absolute right-3 shrink-0 group-hover:hidden" />}
               </div>
           ))}
           {conversations.length === 0 && (
              <p className="text-center text-[12px] text-nexus-text-sec mt-10">No hay conversaciones previas</p>
           )}
        </div>
      </motion.aside>
      ) : null}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 bg-nexus-bg">
        {/* Subtle tech texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-10 dark:invert-0 invert" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

        <header className="h-16 shrink-0 border-b border-nexus-border bg-nexus-card/80 backdrop-blur-md flex items-center justify-between px-4 z-20 sticky top-0 transition-colors">
          <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 -ml-2 text-nexus-text-sec hover:text-nexus-text hover:bg-nexus-card-hover rounded-full transition-all active:scale-95">
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div 
               className="flex items-center gap-3 cursor-pointer group"
               onClick={() => setIsSidebarOpen(true)}
             >
                <div className="w-10 h-10 bg-nexus-card border border-nexus-border rounded-full flex flex-shrink-0 items-center justify-center overflow-hidden relative group">
                   <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors" />
                   <BrainCircuit className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex flex-col">
                   <h1 className="text-[15px] font-bold text-nexus-text leading-tight group-hover:text-blue-500 transition-colors flex items-center gap-1">
                     NexusAI <Menu className="w-3 h-3 text-nexus-text-sec opacity-50 block md:hidden" />
                   </h1>
                   <p className="text-[11px] text-nexus-text-sec font-medium flex items-center gap-1.5 mt-0.5">
                     <span className="relative flex h-1.5 w-1.5">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                     </span>
                     {t('En línea') || 'En línea'} <span className="text-[9px] opacity-70 ml-1">Nexus AI 2.0</span>
                   </p>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { startNew(); }} className="p-2 hidden md:block text-nexus-text-sec hover:text-blue-500 hover:bg-nexus-card-hover rounded-full transition-all active:scale-95" title={t('Nueva Conversación') || 'Nueva Conversación'}>
               <MessageSquarePlus className="w-5 h-5" />
            </button>
            <button onClick={() => { if(currentId) deleteConversation(currentId); }} className="p-2 text-nexus-text-sec hover:text-red-500 hover:bg-nexus-card-hover rounded-full transition-all active:scale-95" title={t('Eliminar Conversación') || 'Eliminar Conversación'}>
               <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </header>

      <main 
        ref={mainRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar relative z-10 min-h-0"
      >
         <div className={`max-w-3xl w-full mx-auto p-4 md:p-6 pb-12 flex flex-col gap-6 ${messages.length === 0 && !isTyping ? 'min-h-full justify-center' : ''}`}>
               {messages.length === 0 && !isTyping ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex flex-col items-center justify-center py-8 md:py-16 text-center px-4"
              >
                 <div className="w-16 h-16 rounded-2xl bg-nexus-card border border-nexus-border flex items-center justify-center mb-6 shadow-sm">
                    <BrainCircuit className="w-8 h-8 text-blue-500" />
                 </div>
                 <h2 className="text-2xl font-bold text-nexus-text mb-2">
                   {t('¿En qué te puedo ayudar?') || '¿En qué te puedo ayudar?'}
                 </h2>
                 <p className="text-nexus-text-sec max-w-sm text-sm mb-8 leading-relaxed">
                   {t('Pregúntame sobre optimización, recomendaciones de apps o soluciones a problemas comunes en Android.') || 'Pregúntame sobre optimización, recomendaciones de apps o soluciones a problemas comunes en Android.'}
                 </p>

                 <div className="flex flex-col gap-2 w-full max-w-sm">
                    {quickButtons.map((btn, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(btn.q)}
                        className="flex items-center gap-3 px-4 py-3.5 bg-nexus-card hover:bg-nexus-card-hover text-nexus-text-sec hover:text-nexus-text border border-nexus-border rounded-xl transition-all text-[14px] font-medium text-left shadow-sm hover:shadow-md"
                      >
                        <btn.icon className="w-5 h-5 text-blue-500/70 shrink-0" />
                        <span>{btn.label}</span>
                      </button>
                    ))}
                 </div>
              </motion.div>
            ) : (
              <>
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex items-end gap-3 w-full max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      {/* Avatars */}
                      {msg.role === 'model' && (
                        <div className="w-7 h-7 rounded-lg bg-nexus-card flex flex-shrink-0 items-center justify-center border border-nexus-border shadow-sm self-end mb-4">
                          <BrainCircuit className="w-4 h-4 text-blue-500" />
                        </div>
                      )}
                      
                      <div className="flex flex-col w-full min-w-0">
                        <div className={`px-4 py-3 md:px-5 md:py-3.5 rounded-2xl shadow-sm ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-sm' 
                            : msg.isError 
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20 rounded-bl-sm'
                              : 'bg-nexus-card text-nexus-text border border-nexus-border rounded-bl-sm prose prose-neutral dark:prose-invert prose-p:leading-relaxed prose-pre:bg-nexus-bg prose-pre:border prose-pre:border-nexus-border max-w-none text-[15px]'
                        }`}>
                          {msg.role === 'user' ? (
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                          ) : msg.isError ? (
                            <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                                  <span className="font-medium text-sm">{msg.text}</span>
                               </div>
                               {msg.errorDetails && (
                                 <details className="mt-2 text-xs opacity-80 cursor-pointer">
                                   <summary className="font-semibold outline-none">Mostrar panel de diagnóstico (Error {msg.errorDetails.code || ''})</summary>
                                   <div className="mt-2 p-2 bg-black/40 rounded border border-red-500/30 font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                                      {msg.errorDetails.fullError || JSON.stringify(msg.errorDetails, null, 2)}
                                   </div>
                                 </details>
                               )}
                            </div>
                          ) : (
                            <div className="markdown-body">
                              <Markdown>{msg.text}</Markdown>
                            </div>
                          )}
                        </div>
                        
                        {/* Footer (Time + Actions for Model) */}
                        <div className={`flex items-center gap-2 mt-1.5 px-1 ${msg.role === 'user' ? 'justify-end' : 'justify-between'}`}>
                           {msg.role === 'model' && !msg.isError && (
                             <div className="flex items-center gap-1">
                               <button onClick={() => handleCopy(msg.text, msg.id)} className="p-1.5 text-nexus-text-sec hover:text-nexus-text hover:bg-nexus-card rounded-md transition-colors">
                                 {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                               </button>
                               <button onClick={() => handleShare(msg.text)} className="p-1.5 text-nexus-text-sec hover:text-nexus-text hover:bg-nexus-card rounded-md transition-colors">
                                 <Share2 className="w-3.5 h-3.5" />
                               </button>
                               <button onClick={() => handleSend(t('Genera otra respuesta o explícalo de forma distinta') || "Genera otra respuesta o explícalo de forma distinta")} className="p-1.5 text-nexus-text-sec hover:text-nexus-text hover:bg-nexus-card rounded-md transition-colors">
                                 <RotateCcw className="w-3.5 h-3.5" />
                               </button>
                             </div>
                           )}
                           <span className="text-[10px] text-nexus-text-sec">
                             {msg.createdAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                      </div>

                    </div>
                    
                    {msg.role === 'model' && msg.recommendedApps && msg.recommendedApps.length > 0 && (
                      <div className="mt-2 w-full pl-10 pr-2">
                        <div className="flex flex-col gap-2">
                           {msg.recommendedApps.map(app => (
                             <div 
                               key={app.id} 
                               onClick={() => onAppClick(app)}
                               className="bg-nexus-card border border-nexus-border hover:border-nexus-accent/50 p-3 rounded-xl cursor-pointer transition-all flex gap-3 items-center group shadow-sm max-w-sm"
                             >
                                <img src={app.icon} alt={app.name} className="w-12 h-12 rounded-lg bg-nexus-bg object-cover group-hover:scale-105 transition-transform" />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <h4 className="text-nexus-text font-semibold text-sm truncate">{app.name}</h4>
                                  <p className="text-[11px] text-nexus-text-sec truncate mb-1">{app.developer}</p>
                                  <div className="flex items-center gap-3">
                                     <span className="flex items-center gap-1 text-[10px] text-yellow-500 font-medium"><Star className="w-3 h-3 fill-yellow-500"/> {app.rating}</span>
                                     <span className="flex items-center gap-1 text-[10px] text-blue-500 font-medium"><Download className="w-3 h-3"/> {app.downloads}</span>
                                  </div>
                                </div>
                                <ArrowLeft className="w-4 h-4 text-nexus-text-sec rotate-180 mr-2 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-end gap-3 max-w-[80%]"
                  >
                    <div className="w-7 h-7 rounded-lg bg-nexus-card flex flex-shrink-0 items-center justify-center border border-nexus-border shadow-sm mb-4">
                      <BrainCircuit className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col w-full min-w-0">
                      <div className="px-5 py-4 rounded-2xl rounded-bl-sm bg-nexus-card border border-nexus-border shadow-sm flex items-center gap-3 h-[48px]">
                        <span className="text-[13px] font-medium text-nexus-text-sec">{t('NexusAI está escribiendo...') || 'NexusAI está escribiendo...'}</span>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-blue-500/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-blue-500/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-blue-500/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={endOfMessagesRef} />
              </>
            )}
         </div>
      </main>

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-nexus-card border-t border-nexus-border z-20 shrink-0 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
         <div className="max-w-3xl mx-auto">
            <div className="flex items-end bg-nexus-bg border border-nexus-border rounded-2xl overflow-hidden focus-within:border-blue-500/50 transition-colors p-1.5 shadow-inner">
               <textarea 
                 ref={inputRef}
                 value={query}
                 onChange={e => setQuery(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSend(query);
                   }
                 }}
                 placeholder={t('Mensaje a NexusAI...') || "Mensaje a NexusAI..."}
                 rows={1}
                 className="flex-1 bg-transparent border-none text-nexus-text px-3 py-2.5 min-h-[44px] max-h-32 resize-none outline-none text-[15px] placeholder:text-nexus-text-sec custom-scrollbar leading-relaxed"
                 style={{ height: 'auto' }}
                 onInput={(e) => {
                   const target = e.target as HTMLTextAreaElement;
                   target.style.height = 'auto';
                   target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                 }}
               />
               <button 
                 onClick={() => handleSend(query)}
                 disabled={!query.trim() || isTyping}
                 className="h-[40px] w-[40px] shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-nexus-card disabled:text-nexus-text-sec text-white transition-colors flex items-center justify-center self-end mb-0.5 ml-2 mr-0.5 shadow-sm active:scale-95 border border-transparent disabled:border-nexus-border"
               >
                  <Send className="w-4 h-4 ml-0.5" />
               </button>
            </div>
            <div className="mt-2 text-center">
              <p className="text-[10px] text-nexus-text-sec">{t('NexusAI puede cometer errores. Considera verificar la información importante.') || 'NexusAI puede cometer errores. Considera verificar la información importante.'}</p>
            </div>
         </div>
      </div>
     </div>
    </div>
  );
}
