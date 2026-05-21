import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Users, Plus, Hash, Settings, MoreVertical, 
  Trash2, X, Send, Pin, Shield, AlertTriangle, UserMinus, Search, Menu, ChevronLeft, Image as ImageIcon,
  Activity, Clock, Smile, Volume2, Lock, Bot
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../lib/cloudinary';
import { motion, AnimatePresence } from 'motion/react';
import { UserItem } from '../types';

interface NexusHubProps {
  session: any;
  userProfile: any;
  onBack: () => void;
}

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url?: string;
  creator_id: string;
  created_at: string;
}

interface Message {
  id: string;
  community_id: string;
  user_id: string;
  content: string;
  is_pinned: boolean;
  deleted: boolean;
  deleted_by_admin: boolean;
  created_at: string;
  profiles: { username: string; avatar_url: string; role: string };
  temp_id?: string; // For optimistic UI
}

export default function NexusHub({ session, userProfile, onBack }: NexusHubProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
       document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [activeCommunity]); // Re-fetch when going back to list

  const fetchCommunities = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('communities').select('*').order('name');
    
    if (error && error.code === '42P01') {
      console.error("🚨 TABLA INEXISTENTE DETECTADA (42P01) 🚨");
      setTableError(true);
      setIsLoading(false);
      return;
    }
    if (error) {
      console.error("Error cargando comunidades:", error);
      setIsLoading(false);
      return;
    }
    
    if (data) {
      setCommunities(data);
    }
    setIsLoading(false);
  };

  const deleteCommunity = async (commId: string, isCorrupt?: boolean) => {
    const community = communities.find(c => c.id === commId);
    if (!community) return;
    
    // Admins can delete anything. Local users can delete their own communities or corrupt ones if they own them.
    // If it's corrupt, let's just allow anyone to delete it if it's really an incompatible schema issue to clear it out, or limit to creator. Let's limit to creator/admin.
    if (!isAdmin && community.creator_id !== session?.user?.id && community.image_url) {
       alert("No tienes permiso para eliminar esta comunidad.");
       return;
    }
    
    const confirm = window.confirm("¿Seguro que deseas eliminar esta comunidad permanentemente?");
    if (!confirm) return;
    
    await supabase.from('communities').delete().eq('id', commId);
    fetchCommunities();
    if (activeCommunity?.id === commId) {
      setActiveCommunity(null);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0a0b14] h-[100dvh] w-full overflow-hidden text-center fixed top-0 left-0 z-[100]">
         <Shield className="w-20 h-20 text-cyan-500 mb-6" />
         <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Inicia sesión requerida</h2>
         <p className="text-gray-400 max-w-lg mb-8">Debes iniciar sesión para usar Nexus Hub y conectarte con la comunidad.</p>
         <button onClick={onBack} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl">Volver al inicio</button>
      </div>
    );
  }

  if (tableError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0a0b14] h-[100dvh] w-full overflow-hidden text-center fixed top-0 left-0 z-[100]">
         <AlertTriangle className="w-20 h-20 text-red-500 mb-6" />
         <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Falta Base de Datos</h2>
         <p className="text-gray-400 max-w-lg mb-4">Las tablas de Nexus Hub no existen en tu base de datos de Supabase.</p>
         <button onClick={onBack} className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl">Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#050505] h-[100dvh] w-full overflow-hidden fixed top-0 left-0 z-[100]">
      {activeCommunity ? (
        <ChatRoom 
          community={activeCommunity} 
          session={session} 
          userProfile={userProfile} 
          onBack={() => setActiveCommunity(null)} 
          isAdmin={isAdmin}
        />
      ) : (
        <CommunitiesDashboard 
          communities={communities} 
          isLoading={isLoading} 
          onSelect={(c) => setActiveCommunity(c)} 
          onCreateClick={() => setShowCreateModal(true)}
          isAdmin={isAdmin}
          onDelete={deleteCommunity}
          onBack={onBack}
        />
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCommunityModal 
            session={session} 
            isAdmin={isAdmin}
            onClose={() => setShowCreateModal(false)}
            onSuccess={(newComm) => {
              setCommunities(prev => [...prev, newComm].sort((a,b) => a.name.localeCompare(b.name)));
              setActiveCommunity(newComm);
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// COMMUNITIES DASHBOARD
// ============================================================================

function CommunitiesDashboard({ communities, isLoading, onSelect, onCreateClick, isAdmin, onDelete, onBack }: any) {
  return (
    <div className="flex flex-col h-[100dvh] w-full relative z-10 bg-[#06070a]">
      {/* Background Orbs */}
      <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-cyan-900/30 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-[120px]" />
      </div>

      <header className="h-[72px] shrink-0 bg-[#06070a]/90 backdrop-blur-xl border-b flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 bg-white/5 hover:bg-white/10 active:bg-white/20 rounded-xl flex items-center justify-center transition-all shadow-lg">
            <ChevronLeft className="w-6 h-6 text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter flex items-center gap-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
              <Users className="w-5 h-5 text-cyan-400" />
              NEXUS HUB
            </h1>
          </div>
        </div>
        <button 
          onClick={onCreateClick}
          className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-transform shadow-[0_0_20px_rgba(8,145,178,0.3)] active:scale-95"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Nueva Comunidad</span>
        </button>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-transparent">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-8 mt-2">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tighter">Explorar Servidores</h2>
            <p className="text-gray-400 font-medium text-sm sm:text-base">Únete a debates, comparte ideas y conecta con jugadores de todo el mundo.</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-[#121420]/50 border border-white/5 rounded-[28px] h-[320px] animate-pulse"></div>
              ))}
            </div>
          ) : communities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-gradient-to-b from-[#121420]/80 to-[#0A0D14]/80 backdrop-blur-md border border-white/5 rounded-[32px] mt-12 shadow-2xl">
              <div className="w-24 h-24 bg-cyan-900/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <Users className="w-12 h-12 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Comunidades Vacías</h3>
              <p className="text-gray-400 text-center max-w-sm mb-8 font-medium">Nadie ha creado una comunidad todavía. Sé el primero en iniciar un nuevo debate.</p>
              <button 
                onClick={onCreateClick}
                className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-2xl hover:scale-105 active:scale-95 transition-transform"
              >
                Crear Mi Comunidad
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {communities.map((c: any) => (
                <div key={c.id} onClick={() => { if(c.image_url) onSelect(c); }} className="group relative bg-[#0d0f18]/90 hover:bg-[#151822] backdrop-blur-sm cursor-pointer border border-white/5 hover:border-cyan-500/30 rounded-[28px] overflow-hidden transition-all duration-300 flex flex-col h-[320px] shadow-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] active:scale-[0.98]">
                  
                  {/* Card Header */}
                  <div className="h-[140px] w-full bg-gradient-to-b from-[#1a1c29] to-[#0d0f18] relative border-b border-white/5 shrink-0 overflow-hidden">
                    {c.image_url ? (
                      <>
                        <img src={c.image_url} alt={c.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f18] via-[#0d0f18]/40 to-transparent" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center">
                         <AlertTriangle className="w-10 h-10 text-red-500/50" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${c.image_url ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse' : 'bg-red-500'}`}></span>
                       <span className="text-[10px] font-bold text-gray-200 uppercase tracking-widest">{c.category}</span>
                    </div>
                    {(isAdmin || !c.image_url) && (
                      <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-xl backdrop-blur-md transition-all border border-white/10 shadow-lg relative z-10">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Icon Overlap */}
                  <div className="absolute top-[100px] left-6 z-10">
                    <div className="w-20 h-20 bg-[#06070a] p-1.5 border border-white/10 group-hover:border-cyan-500/50 rounded-2xl flex items-center justify-center transition-colors shadow-2xl">
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.name} className="w-full h-full object-cover rounded-[12px]" />
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 pt-14 flex flex-col flex-1 relative">
                    {!c.image_url ? (
                       <div className="absolute inset-0 bg-[#0f111a]/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
                          <p className="text-sm font-bold text-white uppercase mb-1">Comunidad Incompatible</p>
                          <p className="text-xs text-gray-400 mb-4">Esta comunidad quedó incompatible tras una actualización.</p>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-lg transition-colors">
                             ELIMINAR Y RECREAR
                          </button>
                       </div>
                    ) : null}

                    <h3 className="text-xl sm:text-2xl font-black text-white mb-2 leading-tight group-hover:text-cyan-400 transition-colors line-clamp-1 drop-shadow-sm">{c.name}</h3>
                    <p className="text-[13px] sm:text-sm text-gray-400 line-clamp-2 leading-relaxed flex-1 font-medium">{c.description}</p>
                    
                    <div className="mt-5 border-t border-white/5 pt-4 flex items-center justify-between w-full">
                       <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                           <Activity className="w-4 h-4 text-cyan-500" />
                           ACTIVA
                       </div>
                       <button onClick={(e) => { e.stopPropagation(); onSelect(c); }} className="px-4 py-2 bg-white/10 rounded-xl text-xs sm:text-sm font-bold text-white hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all transform active:scale-95">
                           Unirse
                       </button>
                    </div>
                    
                    {/* Default footer info (hides on hover) */}
                    <div className="mt-4 flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-widest group-hover:opacity-0 group-hover:absolute transition-opacity">
                      <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Activa</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// CHAT ROOM 
// ============================================================================

function getCommunityChannels(comm: any): string[] {
  const defaultCols = ['general', 'anuncios', 'ayuda', 'media', 'off-topic'];
  if (!comm || !comm.description) return defaultCols;
  const parts = comm.description.split(' | channels:');
  if (parts.length > 1) {
    return parts[1].split(',').map((c: string) => c.trim()).filter(Boolean);
  }
  return defaultCols;
}

function getCleanDescription(desc: string): string {
  if (!desc) return '';
  return desc.split(' | channels:')[0];
}

function updateCommunityChannels(desc: string, channels: string[]): string {
  const clean = desc.split(' | channels:')[0];
  return `${clean} | channels:${channels.join(',')}`;
}

interface ParsedMsg {
  text: string;
  channel: string;
  image_url?: string | null;
}

function parseMessageContent(content: string): ParsedMsg {
  if (!content) return { text: '', channel: 'general', image_url: null };
  const trimmed = content.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        text: parsed.text || '',
        channel: parsed.channel || 'general',
        image_url: parsed.image_url || null
      };
    } catch (e) {
      // ignore and treat as text
    }
  }
  return {
     text: content,
     channel: 'general',
     image_url: null
  };
}

function serializeMessageContent(text: string, channel: string, imageUrl?: string | null): string {
  return JSON.stringify({
     text,
     channel,
     image_url: imageUrl || null
  });
}

function ChatRoom({ community, session, userProfile, onBack, isAdmin }: any) {
  const [currentCommunity, setCurrentCommunity] = useState(community);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [activeChannel, setActiveChannel] = useState('general');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Channels and Member states
  const [channels, setChannels] = useState<string[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [showChannelForm, setShowChannelForm] = useState(false);
  
  // Reactions list
  const [reactions, setReactions] = useState<any[]>([]);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);

  // Upload state
  const [chatImageFile, setChatImageFile] = useState<File | null>(null);
  const [chatImagePreviewUrl, setChatImagePreviewUrl] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Sync Community Details and Channels list
  useEffect(() => {
    setCurrentCommunity(community);
    setChannels(getCommunityChannels(community));
  }, [community]);

  // Fetch reactions helper
  const fetchReactions = async () => {
    if (messages.length === 0) return;
    const msgIds = messages.map(m => m.id);
    const { data, error } = await supabase
      .from('message_reactions')
      .select('*')
      .in('message_id', msgIds);
    if (data) {
      setReactions(data);
    }
  };

  useEffect(() => {
    fetchReactions();
  }, [messages]);

  // Initialize and subscribe
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      // Auto-join community in background
      try {
        await supabase.from('community_members').insert({
          community_id: community.id,
          user_id: session.user.id
        }).select();
      } catch (e) {
        // fail silently if member already exists
      }
      
      await fetchMessages();
      await fetchReactions();
    };

    init();

    // Setup Realtime messages
    const channel = supabase.channel(`public:messages:${community.id}`);
    channelRef.current = channel;

    channel
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages',
        filter: `community_id=eq.${community.id}`
      }, (payload) => {
        if (!mounted) return;
        const msg = payload.new as any;
        
        if (payload.eventType === 'INSERT') {
          supabase.from('messages').select('*, profiles:user_id(*)').eq('id', msg.id).single()
            .then(({ data }) => {
              if (data && mounted) {
                setMessages(prev => {
                   if (prev.some(p => p.id === data.id)) return prev;
                   return [...prev, data];
                });
                setTimeout(scrollToBottom, 100);
              }
            });
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(p => p.id === msg.id ? { ...p, ...msg } : p));
        } else if (payload.eventType === 'DELETE') {
          const oldMsg = payload.old as any;
          setMessages(prev => prev.filter(p => p.id !== oldMsg.id));
        }
      })
      .on('presence', { event: 'sync' }, () => {
         if (!mounted) return;
         const state = channel.presenceState();
         setOnlineCount(Object.keys(state).length || 1);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: session.user.id });
        }
      });

    // Realtime channel for community changes
    const commSub = supabase.channel(`public:communities:${community.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'communities',
        filter: `id=eq.${community.id}`
      }, (payload) => {
        if (mounted) {
          const updated = payload.new as any;
          setCurrentCommunity(updated);
          setChannels(getCommunityChannels(updated));
        }
      })
      .subscribe();

    // Realtime message reactions
    const reactSub = supabase.channel(`public:reactions:${community.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions'
      }, () => {
         if (mounted) fetchReactions();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      supabase.removeChannel(commSub);
      supabase.removeChannel(reactSub);
    };
  }, [community.id]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles:user_id(*)')
      .eq('community_id', community.id)
      .order('created_at', { ascending: true })
      .limit(150);

    if (error) {
      console.error("Error fetching messages:", error);
      setErrorMsg("No se pudieron cargar los mensajes.");
    } else if (data) {
      setMessages(data as any);
      setTimeout(scrollToBottom, 50);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleChatImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setChatImageFile(file);
      setChatImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !chatImageFile) || isSending) return;
    
    setIsSending(true);
    setErrorMsg(null);
    const textContent = newMessage.trim();
    const imageFile = chatImageFile;
    
    // Reset states
    setNewMessage('');
    setChatImageFile(null);
    setChatImagePreviewUrl(null);
    
    // Optimistic message setup
    const tempId = `temp_${Date.now()}`;
    const localImgUrl = chatImagePreviewUrl;
    
    const optimisticMsg: Message = {
      id: tempId,
      temp_id: tempId,
      community_id: community.id,
      user_id: session.user.id,
      content: serializeMessageContent(textContent, activeChannel, localImgUrl),
      is_pinned: false,
      deleted: false, 
      deleted_by_admin: false,
      created_at: new Date().toISOString(),
      profiles: {
        username: userProfile?.username || session.user.email?.split('@')[0] || 'Tú',
        avatar_url: userProfile?.avatar_url || '',
        role: userProfile?.role || 'user'
      }
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      let finalImgUrl: string | null = null;
      if (imageFile) {
        const cleanName = currentCommunity.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const uploadRes = await uploadToCloudinary(imageFile, `NexusHub/${cleanName}/chat_media`);
        if (uploadRes && (uploadRes.secure_url || uploadRes.url)) {
          finalImgUrl = uploadRes.secure_url || uploadRes.url;
        } else {
          throw new Error("No se pudo subir la foto adjunta. Por favor vuelve a intentar.");
        }
      }

      const serializedContent = serializeMessageContent(textContent, activeChannel, finalImgUrl);
      
      const { data, error } = await supabase.from('messages').insert([{
        community_id: community.id,
        user_id: session.user.id,
        content: serializedContent,
      }]).select();

      if (error) {
         throw error;
      } else if (data && data.length > 0) {
        const realMsg = data[0];
        setMessages(prev => prev.map(m => m.id === tempId ? { ...realMsg, profiles: userProfile } : m));
        
        // AI Integration
        if (textContent.startsWith('!ia ')) {
           setTimeout(async () => {
              const aiResponses = [
                 "¡Hola! Soy Nexus AI. Estoy aquí para ayudarte a descubrir contenido, recomendar apps y moderar la comunidad.",
                 "Esa es una gran pregunta. ¿Sabías que puedes crear tus propias apps usando nuestra plataforma?",
                 "¡Excelente tema de conversación! Te sugiero visitar el canal #media para compartir capturas.",
                 "NexusPlay está evolucionando. Mantente atento para más novedades sobre juegos y herramientas.",
                 "He detectado que te gusta este tema. ¡Prueba algunas de las nuevas web apps disponibles!"
              ];
              const randomRes = aiResponses[Math.floor(Math.random() * aiResponses.length)];
              const aiMessage = `[NEXUS AI] ${randomRes}`;
              
              await supabase.from('messages').insert([{
                 community_id: community.id,
                 user_id: session.user.id, // we use the same user, but format [NEXUS AI] will render it as bot
                 content: serializeMessageContent(aiMessage, activeChannel, null),
              }]);
           }, 1500);
        }
      }
    } catch (err: any) {
      console.error("Error INSERT message:", err);
      setErrorMsg(`Error al enviar: ${err.message || 'Bloqueado por reglas de base de datos'}`);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(textContent);
      if (imageFile) {
         setChatImageFile(imageFile);
         setChatImagePreviewUrl(localImgUrl);
      }
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (msgId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ deleted: true, deleted_by_admin: isAdmin, content: '' })
      .eq('id', msgId);
      
    if (error) {
      setErrorMsg("No se pudo eliminar el mensaje.");
    }
  };

  // Reactions handlers
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    // Find if user already reacted with this emoji to this message
    const existing = reactions.find(r => r.message_id === messageId && r.user_id === session.user.id && r.reaction === emoji);
    
    try {
      if (existing) {
        setReactions(prev => prev.filter(r => r.id !== existing.id));
        await supabase.from('message_reactions').delete().eq('id', existing.id);
      } else {
        const tempReaction = {
           id: `temp_r_${Date.now()}`,
           message_id: messageId,
           user_id: session.user.id,
           reaction: emoji
        };
        setReactions(prev => [...prev, tempReaction]);
        
        const { error } = await supabase.from('message_reactions').insert({
          message_id: messageId,
          user_id: session.user.id,
          reaction: emoji
        });
        if (error) throw error;
      }
      fetchReactions();
    } catch (err) {
      console.error("Error tooggling reaction:", err);
    }
    setEmojiPickerMsgId(null);
  };

  // Channel manipulation
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newChannelName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!name) return;
    if (channels.includes(name)) {
      alert("El canal ya existe.");
      return;
    }

    const updatedChannels = [...channels, name];
    const updatedDesc = updateCommunityChannels(currentCommunity.description, updatedChannels);
    
    const { error } = await supabase
      .from('communities')
      .update({ description: updatedDesc })
      .eq('id', currentCommunity.id);

    if (error) {
      alert("No se pudo crear el canal.");
    } else {
      setChannels(updatedChannels);
      setActiveChannel(name);
      setNewChannelName('');
      setShowChannelForm(false);
    }
  };

  const handleDeleteChannel = async (name: string) => {
    if (name === 'general') return;
    const confirm = window.confirm(`¿Seguro que deseas eliminar el canal #${name}?`);
    if (!confirm) return;

    const updatedChannels = channels.filter(c => c !== name);
    const updatedDesc = updateCommunityChannels(currentCommunity.description, updatedChannels);

    const { error } = await supabase
      .from('communities')
      .update({ description: updatedDesc })
      .eq('id', currentCommunity.id);

    if (error) {
      alert("No se pudo eliminar el canal.");
    } else {
      setChannels(updatedChannels);
      if (activeChannel === name) {
        setActiveChannel('general');
      }
    }
  };

  // Group reactions for render
  const getRenderReactions = (messageId: string) => {
    const msgReacts = reactions.filter(r => r.message_id === messageId);
    const grouped: { [emoji: string]: { count: number; active: boolean } } = {};
    
    msgReacts.forEach(r => {
      if (!grouped[r.reaction]) {
        grouped[r.reaction] = { count: 0, active: false };
      }
      grouped[r.reaction].count++;
      if (r.user_id === session.user.id) {
        grouped[r.reaction].active = true;
      }
    });

    return Object.entries(grouped);
  };

  const isCreatorOrAdmin = isAdmin || currentCommunity.creator_id === session.user.id;
  
  // Filter messages belonging to current active channel
  const filteredMessages = messages.filter(m => {
    const parsed = parseMessageContent(m.content);
    return parsed.channel === activeChannel;
  });

  return (
    <div className="flex h-full w-full bg-[#0a0b14] overflow-hidden relative">
       
       {/* Error Toast */}
       <AnimatePresence>
         {errorMsg && (
           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-full font-bold text-sm shadow-2xl flex items-center gap-2">
             <AlertTriangle className="w-5 h-5 animate-bounce" />
             {errorMsg}
             <button onClick={() => setErrorMsg(null)} className="ml-2 hover:bg-black/20 p-1 rounded-full"><X className="w-4 h-4" /></button>
           </motion.div>
         )}
       </AnimatePresence>

       {/* ====================================================================
           SIDEBAR DISCORD STYLE
           ==================================================================== */}
       {/* Sidebar Overlay on Mobile */}
       <AnimatePresence>
         {isSidebarOpen && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={() => setIsSidebarOpen(false)}
             className="md:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
           />
         )}
       </AnimatePresence>

       {/* Sidebar Container */}
       <aside className={`
         fixed top-0 left-0 bottom-0 z-40 w-[280px] md:relative md:translate-x-0
         bg-[#06070c] border-r border-white/5 flex flex-col h-full transform transition-transform duration-300 ease-out shrink-0
         ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
       `}>
          {/* Sidebar Header */}
          <div className="h-[68px] border-b border-white/5 px-4 flex items-center gap-3 shrink-0">
             <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-sm font-black shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                {currentCommunity.image_url ? (
                  <img src={currentCommunity.image_url} alt={currentCommunity.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  currentCommunity.name[0].toUpperCase()
                )}
             </div>
             <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-white uppercase tracking-wider truncate leading-tight">{currentCommunity.name}</h3>
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">{currentCommunity.category}</p>
             </div>
             <button onClick={onBack} className="w-7 h-7 hover:bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all shrink-0">
                <ChevronLeft className="w-4 h-4" />
             </button>
          </div>

          {/* Description Section */}
          <div className="p-4 border-b border-white/5 bg-[#090b12]/30 shrink-0">
             <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                {getCleanDescription(currentCommunity.description) || "Bienvenido a este canal."}
             </p>
          </div>

          {/* Sidebar Channels List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
             <div>
                <div className="flex items-center justify-between px-2 mb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                   <span>Canales de Texto</span>
                   {isCreatorOrAdmin && (
                     <button 
                       onClick={() => setShowChannelForm(prev => !prev)} 
                       className="p-1 hover:bg-white/5 hover:text-white rounded-md transition-colors"
                     >
                        <Plus className="w-4 h-4" />
                     </button>
                   )}
                </div>

                {/* Inline Channel Creation Form */}
                {showChannelForm && (
                  <form onSubmit={handleCreateChannel} className="px-2 mb-3">
                     <div className="flex items-center gap-2 bg-[#121420] border border-cyan-500/30 rounded-xl px-2 py-1.5">
                        <Hash className="w-4 h-4 text-cyan-400 shrink-0" />
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="nombre-canal" 
                          value={newChannelName}
                          onChange={(e) => setNewChannelName(e.target.value)}
                          className="w-full bg-transparent text-xs text-white outline-none placeholder:text-gray-600 font-bold"
                          maxLength={18}
                        />
                        <button type="submit" className="text-[10px] text-cyan-400 font-black px-2 hover:text-cyan-300">✔</button>
                     </div>
                  </form>
                )}

                {/* Listing channels */}
                <div className="space-y-1">
                   {channels.map((chanName) => {
                      const isActive = activeChannel === chanName;
                      return (
                        <div 
                          key={chanName}
                          className={`
                            group flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all
                            ${isActive 
                              ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/5 text-white shadow-inner font-bold border-l-4 border-cyan-500 pl-2' 
                              : 'text-gray-400 hover:bg-[#121420] hover:text-gray-200'}
                          `}
                          onClick={() => {
                            setActiveChannel(chanName);
                            setIsSidebarOpen(false);
                          }}
                        >
                           <div className="flex items-center gap-2 truncate">
                              <Hash className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
                              <span className="truncate">{chanName}</span>
                           </div>
                           
                           {isCreatorOrAdmin && chanName !== 'general' && (
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleDeleteChannel(chanName);
                                }}
                               className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-md transition-all"
                             >
                                <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           )}
                        </div>
                      );
                   })}
                </div>
             </div>

             {/* Dynamic Members Online Status */}
             <div>
                <div className="px-2 mb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-between">
                   <span>En línea ({onlineCount})</span>
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-[#121420]/40 rounded-xl transition-all">
                      <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-[10px] font-bold text-white relative">
                        {userProfile?.avatar_url ? (
                          <img src={userProfile.avatar_url} className="w-full h-full object-cover rounded-full" />
                        ) : (userProfile?.username?.[0]?.toUpperCase() || 'P')}
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-[#06070c]" />
                      </div>
                      <span className="text-xs font-semibold text-gray-200 truncate">{userProfile?.username || 'Tú'}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="p-4 border-t border-white/5 bg-[#06070c] flex items-center justify-between shrink-0">
             <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#121420] border border-white/5 flex items-center justify-center font-bold text-xs">
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} className="w-full h-full object-cover rounded-full" />
                  ) : (userProfile?.username?.[0]?.toUpperCase() || 'U')}
                </div>
                <div className="min-w-0">
                   <p className="text-xs font-bold text-gray-200 truncate leading-tight">{userProfile?.username || 'Usuario'}</p>
                   <p className="text-[10px] text-gray-500 uppercase tracking-wider truncate font-medium">{userProfile?.role || 'user'}</p>
                </div>
             </div>
             {isAdmin && <Settings className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer transition-colors" />}
          </div>
       </aside>

       {/* ====================================================================
           CHAT CONTAINER
           ==================================================================== */}
       <div className="flex-1 flex flex-col h-full bg-[#0a0b14] overflow-hidden relative">
          
          {/* Chat Header */}
          <header className="h-[68px] shrink-0 bg-[#0a0b14]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-3 sm:px-6 shadow-sm z-20">
             <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                {/* Burger Trigger to open channels */}
                <button 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="md:hidden w-10 h-10 hover:bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all shrink-0"
                >
                   <Menu className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-1 text-white shrink-0">
                   <Hash className="w-6 h-6 text-gray-500" />
                   <span className="text-base sm:text-lg font-black tracking-tight text-white uppercase italic">{activeChannel}</span>
                </div>

                <span className="text-gray-700 hidden sm:inline">|</span>

                <div className="flex-1 min-w-0 hidden sm:block">
                   <p className="text-xs text-gray-400 truncate font-medium">
                      Conectado a #{activeChannel} en {currentCommunity.name}
                   </p>
                </div>
             </div>
             
             {/* Action icons */}
             <div className="flex items-center gap-2.5">
                <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 select-none animate-pulse">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                   <span>{onlineCount} ONLINE</span>
                </div>
                
                <button onClick={onBack} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white rounded-lg transition-colors shadow">
                   Explorar otras
                </button>
             </div>
          </header>

          {/* Messages display area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 relative bg-[#07080d] bg-[linear-gradient(rgba(0,229,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]">
             
             {/* Dynamic welcome card based on active channel */}
             <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto mt-6 mb-10 p-6 bg-[#0f111a]/40 border border-white/5 rounded-3xl backdrop-blur">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                   <Hash className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-white italic tracking-tight mb-2">Comienzo de #{activeChannel}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                   Este es el inicio oficial de la conversación en el canal #{activeChannel}. ¡Comparte textos, capturas, y diviértete con la comunidad!
                </p>
             </div>

             {/* Loading messages spinner fallback */}
             {messages.length === 0 && !isSending && (
               <div className="text-center py-10 opacity-30">
                  <MessageSquare className="w-10 h-10 mx-auto text-gray-500 mb-2 animate-bounce" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Sin mensajes hoy</p>
               </div>
             )}

             {/* Rendering the lists of actual messages */}
             {filteredMessages.map((msg, index) => {
                const parsed = parseMessageContent(msg.content);
                const isOwn = msg.user_id === session.user.id;
                const isAI = parsed.text?.startsWith('[NEXUS AI]');
                const displayText = isAI ? parsed.text.replace('[NEXUS AI]', '').trim() : parsed.text;
                
                // Si es un mensaje falso de IA, fingimos que no es propio para que salga a la izquierda, salvo que estemos enviando un debug real
                const renderAsOwn = isOwn && !isAI; 
                
                                const showAvatar = index === 0 || filteredMessages[index-1].user_id !== msg.user_id || isAI !== (parseMessageContent(filteredMessages[index-1].content).text?.startsWith('[NEXUS AI]')) || new Date(msg.created_at).getTime() - new Date(filteredMessages[index-1].created_at).getTime() > 5 * 60000;
                const msgReactions = getRenderReactions(msg.id);

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    key={msg.id} 
                    className={`flex flex-col group hover:bg-white/[0.02] -mx-4 px-4 py-1 transition-colors ${showAvatar ? 'mt-4' : 'mt-0.5'}`}
                  >
                     <div className="flex items-start gap-4 max-w-full relative">
                        
                        {/* Avatar Column */}
                        <div className="w-10 flex-shrink-0 flex justify-center">
                          {showAvatar ? (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-lg select-none transition-transform duration-250 cursor-pointer hover:scale-105 active:scale-95
                              ${isAI ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : (isOwn ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-white')} 
                            `} style={{ overflow: 'hidden' }}>
                              {isAI ? (
                                <Bot className="w-6 h-6" />
                              ) : msg.profiles?.avatar_url ? (
                                <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" />
                              ) : (msg.profiles?.username?.[0]?.toUpperCase() || '?')}
                            </div>
                          ) : null}
                        </div>
                        
                        {/* Message Content Column */}
                        <div className="flex flex-col relative w-full pt-0.5 min-w-0">
                           {/* Author detail info */}
                           {showAvatar && (
                             <span className="text-[14px] font-black text-gray-100 flex items-baseline gap-2 mb-0.5">
                               {isAI ? 'Nexus AI' : msg.profiles?.username}
                               {isAI && (
                                 <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-[4px] text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                                    <Bot className="w-3 h-3" /> BOT
                                 </span>
                               )}
                               {!isAI && msg.profiles?.role === 'admin' && (
                                 <span className="px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded-[4px] text-[10px] font-bold tracking-widest uppercase">ADMIN</span>
                               )}
                               <span className="text-[11px] font-medium text-gray-500 tracking-wide ml-1">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                             </span>
                           )}

                           {/* Inline block */}
                           <div className={`relative pr-12 lg:pr-20 ${msg.temp_id ? 'opacity-50 animate-pulse' : 'opacity-100'}`}>
                               {msg.deleted ? (
                                  <span className="italic text-gray-500 flex items-center gap-2 text-[13px] bg-red-900/10 w-max px-2 py-1 rounded-md">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Mensaje eliminado por moderador
                                  </span>
                               ) : (
                                  <div className="space-y-2">
                                     {/* Text paragraph */}
                                     {displayText && (
                                        <div className="text-[15px] text-gray-300 leading-[1.6] whitespace-pre-wrap break-words font-normal">
                                           {displayText}
                                        </div>
                                     )}
                                     {/* Message attachment image */}
                                     {parsed.image_url && (
                                       <div className="max-w-[260px] sm:max-w-sm rounded-[16px] overflow-hidden border border-white/5 bg-[#0a0b14] cursor-pointer group/img transition-all hover:border-cyan-500/30 shadow-lg mt-2">
                                          <img 
                                            src={parsed.image_url} 
                                            alt="Adjunto" 
                                            className="w-full h-auto object-cover max-h-[350px]" 
                                            referrerPolicy="no-referrer"
                                            onClick={() => window.open(parsed.image_url || '', '_blank')}
                                          />
                                       </div>
                                     )}
                                  </div>
                               )}

                               {/* Hover Options Menu with React emoji buttons */}
                               {!msg.deleted && (
                                 <div className={`
                                   absolute -top-3 right-0
                                   opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-[#151822] shadow-2xl rounded-lg border border-white/5 px-1 py-0.5 z-30 gap-0.5
                                 `}>
                                    {['👍', '❤️', '🔥', '😂'].map(emoji => (
                                       <button 
                                         key={emoji}
                                         onClick={() => handleToggleReaction(msg.id, emoji)}
                                         className="w-8 h-8 flex items-center justify-center rounded-md text-[15px] hover:bg-white/5 transition-all active:scale-95"
                                       >
                                          {emoji}
                                       </button>
                                    ))}
                                    
                                    {(isOwn || isAdmin) && (
                                       <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                                    )}
                                    {(isOwn || isAdmin) && (
                                       <button 
                                         onClick={() => deleteMessage(msg.id)} 
                                         className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors"
                                         title="Eliminar mensaje"
                                       >
                                          <Trash2 className="w-4 h-4" />
                                       </button>
                                    )}
                                 </div>
                               )}
                           </div>

                           {/* Rendered custom reactions below message */}
                           {msgReactions.length > 0 && (
                             <div className="flex flex-wrap gap-1.5 mt-2">
                                {msgReactions.map(([emoji, meta]: any) => (
                                   <button
                                     key={emoji}
                                     onClick={() => handleToggleReaction(msg.id, emoji)}
                                     className={`
                                       px-2 py-1 rounded-[8px] text-[13px] font-bold flex items-center gap-1.5 transition-all active:scale-95 border
                                       ${meta.active 
                                         ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' 
                                         : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-gray-200'}
                                     `}
                                   >
                                      <span>{emoji}</span>
                                      <span className="text-[11px] font-black">{meta.count}</span>
                                   </button>
                                ))}
                             </div>
                           )}
                        </div>
                     </div>
                  </motion.div>
                );
             })}
             <div ref={messagesEndRef} className="h-2" />
          </main>

          {/* Message attachment & Send input form */}
          <div className="p-3 sm:p-5 bg-transparent shrink-0 z-20 pb-safe relative">
             <div className="absolute inset-0 bg-gradient-to-t from-[#06070c] via-[#06070c]/80 to-transparent pointer-events-none" />
             <div className="max-w-4xl mx-auto relative z-10">
                
                {/* Visual Image Upload Draft Preview bar */}
                {chatImagePreviewUrl && (
                  <div className="px-4 py-3 bg-[#121422] rounded-t-2xl flex items-center gap-3 border border-white/10 max-w-sm mb-0 shadow-2xl relative translate-y-2">
                     <div className="w-12 h-12 rounded-[10px] border border-white/10 overflow-hidden shrink-0 bg-black">
                        <img src={chatImagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1 overflow-hidden">
                        <p className="text-[13px] font-bold text-gray-200 truncate">{chatImageFile?.name || "Adjunto"}</p>
                        <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Listo para enviar</p>
                     </div>
                     <button 
                       type="button" 
                       onClick={() => { setChatImageFile(null); setChatImagePreviewUrl(null); }} 
                       className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
                     >
                        <X className="w-4 h-4" />
                     </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex gap-2">
                   
                   {/* Chat input fields and image sub-form togglers */}
                   <div className={`flex-1 relative flex items-center bg-[#151822] border-2 transition-all ${chatImagePreviewUrl ? 'rounded-b-2xl rounded-tr-2xl' : 'rounded-[24px]'} focus-within:border-cyan-500/50 border-white/5 shadow-2xl`}>
                      {/* Hidden image chooser input */}
                      <input 
                        type="file" 
                        id="chat-image-upload" 
                        accept="image/png, image/jpeg, image/webp, image/gif" 
                        className="hidden" 
                        onChange={handleChatImageChange}
                        disabled={isSending}
                      />
                      
                      {/* Attach button */}
                      <button 
                        type="button"
                        onClick={() => document.getElementById('chat-image-upload')?.click()}
                        disabled={isSending}
                        className="absolute left-2 w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-95 disabled:scale-100"
                        title="Adjuntar imagen (PNG, JPG, WEBP)"
                      >
                         <Plus className="w-6 h-6" />
                      </button>

                      <input 
                        type="text"
                        className="w-full bg-transparent h-[52px] sm:h-[56px] pl-14 pr-6 text-white text-[15px] sm:text-[16px] font-medium tracking-wide focus:outline-none placeholder:text-gray-500"
                        placeholder={`Enviar mensaje a #${activeChannel}...`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isSending}
                        autoComplete="off"
                      />
                   </div>

                   {/* Send Button */}
                   <button 
                      type="submit"
                      disabled={(!newMessage.trim() && !chatImageFile) || isSending}
                      className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] shrink-0 bg-cyan-600 hover:bg-cyan-500 active:scale-95 disabled:scale-100 rounded-[24px] flex items-center justify-center text-white disabled:opacity-30 disabled:bg-[#151822] disabled:text-gray-500 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] disabled:shadow-none"
                   >
                      {isSending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                   </button>
                </form>
             </div>
          </div>

       </div>
    </div>
  );
}


// ============================================================================
// CREATE MODAL
// ============================================================================

function CreateCommunityModal({ session, isAdmin, onClose, onSuccess }: any) {
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#000000cc] backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 touch-none">
      <motion.div 
        initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
        className="bg-[#0f111a] sm:border border-white/10 sm:rounded-3xl rounded-t-3xl w-full h-[90vh] sm:h-auto sm:max-w-md p-6 sm:p-8 relative shadow-2xl overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto sm:hidden mb-6"></div>
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full p-2" disabled={isCreating}>
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 rounded-2xl flex items-center justify-center mb-6">
           <Hash className="w-8 h-8 text-cyan-400" />
        </div>
        <h3 className="text-3xl font-black text-white italic tracking-tight mb-2">Nueva Comunidad</h3>
        <p className="text-gray-400 mb-8 font-medium">Inicia un tema y construye una nueva audiencia en Nexus.</p>

        {createError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{createError}</span>
          </div>
        )}
        
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            setCreateError(null);
            
            if (!selectedFile) {
               setCreateError("El logo de la comunidad es obligatorio.");
               return;
            }

            setIsCreating(true);
            
            try {
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const desc = formData.get('description') as string;
              const category = formData.get('category') as string;
              
              const cleanName = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
              const uploadRes = await uploadToCloudinary(selectedFile, `NexusHub/${cleanName}/icon`);
              
              if (!uploadRes || (!uploadRes.secure_url && !uploadRes.url)) {
                throw new Error("No se pudo subir la imagen. Por favor, intenta de nuevo.");
              }
              
              const image_url = uploadRes.secure_url || uploadRes.url;
              
              const { data, error } = await supabase.from('communities').insert([{
                name, description: desc, category, creator_id: session.user.id, image_url
              }]).select().single();
              
              if (error) {
                setCreateError(error.message || "Error al crear comunidad. Verifica que el nombre sea único.");
              } else if (data) {
                onSuccess(data);
              }
            } catch (err: any) {
               setCreateError(err?.message || "Ocurrió un error inesperado.");
            } finally {
              setIsCreating(false);
            }
          }} 
          className="space-y-5"
        >
           {/* Upload Logo Section */}
           <div className="flex flex-col items-center mb-6">
              <label htmlFor="logo-upload" className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 w-full text-left">Logo de Comunidad *</label>
              <div 
                className={`w-28 h-28 rounded-3xl border-2 border-dashed ${previewUrl ? 'border-cyan-500' : 'border-white/10 hover:border-cyan-500/50'} flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden group`}
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-500 group-hover:text-cyan-400 transition-colors">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">SUBIR</span>
                  </div>
                )}
              </div>
              <input 
                id="logo-upload"
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
                onChange={handleImageChange}
                disabled={isCreating}
              />
           </div>

           <div>
             <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nombre de la comunidad *</label>
             <input name="name" required disabled={isCreating} className="w-full bg-[#151822] border-2 border-transparent focus:border-cyan-500/50 rounded-xl px-5 py-3.5 text-white focus:outline-none transition-all placeholder:text-gray-600 font-medium shadow-inner" placeholder="P. ej., Torneo Valorant" />
           </div>
           <div>
             <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Acerca de</label>
             <textarea name="description" required disabled={isCreating} className="w-full bg-[#151822] border-2 border-transparent focus:border-cyan-500/50 rounded-xl px-5 py-3.5 text-white min-h-[100px] resize-none focus:outline-none transition-all placeholder:text-gray-600 font-medium shadow-inner" placeholder="De qué se hablará en este espacio..." />
           </div>
           <div>
             <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Categoría Principal</label>
             <div className="relative">
               <select name="category" disabled={isCreating} className="w-full bg-[#151822] border-2 border-transparent focus:border-cyan-500/50 rounded-xl px-5 py-3.5 text-white outline-none transition-all appearance-none font-medium shadow-inner">
                  <option value="Juegos">🎮 Juegos & Esports</option>
                  <option value="Tecnología">💻 Tecnología</option>
                  <option value="Desarrollo">👨‍💻 Desarrollo</option>
                  <option value="General">💬 General</option>
               </select>
             </div>
           </div>
           <div className="pt-6">
             <button type="submit" disabled={isCreating} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
               {isCreating ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
               {isCreating ? 'CREANDO...' : 'CREAR COMUNIDAD'}
             </button>
           </div>
        </form>
      </motion.div>
    </div>
  );
}
