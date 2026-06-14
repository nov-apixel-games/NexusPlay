import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Hash, 
  Trash2, X, Send, Shield, AlertTriangle, ChevronLeft, Image as ImageIcon, Lock, Bot, Flame, Zap, Timer
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../lib/cloudinary';
import { motion, AnimatePresence } from 'motion/react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useAppStore } from '../store/useAppStore';

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
  const { t } = useAppStore();
  useBodyScrollLock(true);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const isAdmin = userProfile?.role === 'admin';

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
      <div className="flex flex-col items-center justify-center p-8 bg-nexus-card h-[100dvh] w-full overflow-hidden text-center fixed top-0 left-0 z-[100]">
         <Shield className="w-20 h-20 text-cyan-500 mb-6" />
         <h2 className="text-2xl font-black text-nexus-text uppercase italic tracking-tighter mb-4">{t('community.restricted')}</h2>
         <p className="text-nexus-text-sec max-w-lg mb-8">{t('community.loginRequired')}</p>
         <button onClick={onBack} className="px-6 py-2 bg-nexus-card-hover hover:bg-nexus-card text-nexus-text rounded-xl">{t('nav.home')}</button>
      </div>
    );
  }

  if (tableError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-nexus-card h-[100dvh] w-full overflow-hidden text-center fixed inset-0 z-[100000] pointer-events-auto overscroll-none">
         <AlertTriangle className="w-20 h-20 text-red-500 mb-6" />
         <h2 className="text-2xl font-black text-nexus-text uppercase italic tracking-tighter mb-4">{t("hub.dbMissing")}</h2>
         <p className="text-nexus-text-sec max-w-lg mb-4">{t("hub.dbMissingDesc")}</p>
         <button onClick={onBack} className="mt-4 px-6 py-2 bg-nexus-card-hover hover:bg-nexus-card text-nexus-text rounded-xl">Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-nexus-card h-[100dvh] w-full overflow-hidden fixed inset-0 z-[100000] pointer-events-auto overscroll-none">
      {activeCommunity ? (
        <ChatRoom 
          community={activeCommunity} 
          communities={communities}
          onSelectCommunity={(c: Community) => setActiveCommunity(c)}
          session={session} 
          userProfile={userProfile} 
          onBack={() => setActiveCommunity(null)} 
          isAdmin={isAdmin}
        />
      ) : (
        <CommunitiesDashboard 
          communities={communities} 
          isLoading={isLoading} 
          onSelect={(c: Community) => setActiveCommunity(c)} 
          onCreateClick={() => setShowCreateModal(true)}
          isAdmin={isAdmin}
          onDelete={deleteCommunity}
          onBack={onBack}
          userProfile={userProfile}
          session={session}
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

function CommunitiesDashboard({ communities, isLoading, onSelect, onCreateClick, isAdmin, onDelete, onBack, userProfile, session }: any) {
  const { t } = useAppStore();
  const [activeTab, setActiveTab] = useState<'home' | 'explore'>('home');
  const validCommunities = communities.filter((c: any) => c.image_url);
  const recommended = validCommunities.slice(0, 4);
  const activeNow = validCommunities.slice().reverse().slice(0, 3);
  const username = userProfile?.username || session?.user?.email?.split('@')[0];


  return (
    <div className="flex flex-col h-[100dvh] w-full relative z-10 bg-nexus-card overflow-hidden">
      {/* Sci-fi Overlay Elements */}
      <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      <div className="absolute top-0 w-full h-[500px] bg-gradient-to-b from-cyan-900/20 via-blue-900/10 to-transparent pointer-events-none"></div>

      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 sticky top-0 z-30 bg-nexus-surface backdrop-blur-md border-b border-nexus-border/50">
        <div className="flex items-center gap-3 sm:gap-4">
           <button onClick={onBack} className="w-10 h-10 sm:w-12 sm:h-12 bg-nexus-surface border border-cyan-500/30 hover:bg-cyan-900/40 rounded-xl flex items-center justify-center transition-all shadow-nexus-glow">
             <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
           </button>
           <div className="relative">
             <h1 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tighter uppercase drop-shadow-nexus-glow">Nexus_Net</h1>
             <p className="text-[8px] sm:text-[10px] text-cyan-400 font-mono tracking-widest bg-cyan-950/80 px-2 py-0.5 rounded border border-nexus-border absolute -bottom-3 sm:-bottom-1 left-0">SYS.ONLINE</p>
           </div>
        </div>
        <button onClick={onCreateClick} className="px-3 py-2 sm:px-5 sm:py-3 bg-cyan-500 hover:bg-cyan-400 text-nexus-bg font-black uppercase text-[10px] sm:text-xs tracking-widest rounded-xl transition-all shadow-nexus-glow animate-pulse flex items-center gap-1.5">
           <Plus className="w-4 h-4"/> <span className="hidden sm:inline">{t('hub.startServer') || t("hub.startServer")}</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-32">
        <div className="max-w-7xl mx-auto space-y-12 mt-8">
           {/* Active/Trending Showcase */}
           <section>
             <h2 className="text-xs sm:text-sm font-black text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2 drop-shadow-nexus-glow"><Flame className="w-4 h-4 sm:w-5 sm:h-5"/> {t('hub.featuredSectors') || t("hub.featuredSectors")}</h2>
             <div className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6 pt-2 px-2 -mx-2">
               {recommended.map((c: any) => (
                 <div key={c.id} onClick={() => onSelect(c)} className="snap-center shrink-0 w-[280px] sm:w-[400px] h-[200px] sm:h-[240px] rounded-[24px] relative group cursor-pointer border border-cyan-500/20 hover:border-cyan-400 shadow-nexus-glow overflow-hidden transition-all duration-300">
                    <img src={c.image_url} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 mix-blend-screen" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute top-4 right-4 bg-nexus-surface border border-cyan-500/50 text-cyan-400 px-2 py-1 rounded text-[9px] font-black tracking-widest shadow-nexus-glow uppercase animate-pulse">
                      LIVE
                    </div>
                    <div className="absolute bottom-6 left-6 right-6">
                       <h3 className="text-xl sm:text-3xl font-black text-nexus-text uppercase tracking-tighter drop-shadow-nexus-glow mb-1 leading-tight">{c.name}</h3>
                       <p className="text-[10px] sm:text-xs text-cyan-400 font-mono opacity-90 truncate bg-cyan-900/30 inline-block px-2 py-0.5 rounded border border-nexus-border/50">{t(`cat.${c.category}`) || c.category}</p>
                    </div>
                 </div>
               ))}
             </div>
           </section>

           {/* All Communities as Sci-fi Panels */}
           <section>
             <h2 className="text-xs sm:text-sm font-black text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2 drop-shadow-nexus-glow"><Zap className="w-4 h-4 sm:w-5 sm:h-5"/> {t('hub.globalDatabanks') || t("hub.globalDatabanks")}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {communities.map((c: any) => (
                  <div key={c.id} onClick={() => onSelect(c)} className="group bg-nexus-surface backdrop-blur-md border border-nexus-border/50 hover:border-cyan-400/80 rounded-[20px] p-4 sm:p-5 cursor-pointer transition-all hover:bg-cyan-950/20 hover:shadow-nexus-glow flex gap-4 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/20 transition-all rounded-full pointer-events-none"></div>
                     <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-black rounded-[14px] border border-nexus-border overflow-hidden relative shadow-inner">
                        {c.image_url ? (
                           <img src={c.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 mix-blend-screen group-hover:scale-110 transition-transform duration-500"/>
                        ) : (
                           <div className="w-full h-full flex items-center justify-center">
                              <span className="text-cyan-800 font-black text-2xl group-hover:text-cyan-500 transition-colors uppercase">{c.name[0]}</span>
                           </div>
                        )}
                     </div>
                     <div className="flex-1 flex flex-col justify-center min-w-0 z-10">
                        <h4 className="text-base sm:text-lg font-black text-nexus-text truncate uppercase tracking-tight group-hover:text-cyan-400 drop-shadow-sm">{c.name}</h4>
                        <p className="text-[10px] sm:text-[11px] text-nexus-text-sec font-mono mt-1 line-clamp-1">{c.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                           <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#0ff] bg-cyan-950/50 px-2 py-0.5 rounded border border-nexus-border">{t('hub.active')}</span>
                           {isAdmin && (
                             <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" title={t('hub.deleteBase')}>
                               <Trash2 className="w-4 h-4"/>
                             </button>
                           )}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           </section>
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
  if (trimmed?.startsWith('{') && trimmed?.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        text: parsed.text,
        channel: parsed.channel,
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

function ChatRoom({ community, communities, onSelectCommunity, session, userProfile, onBack, isAdmin }: any) {
  const { t } = useAppStore();
  const [currentCommunity, setCurrentCommunity] = useState(community);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [activeChannel, setActiveChannel] = useState('general');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [isJoining, setIsJoining] = useState(false);
  
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

  const handleJoin = async () => {
    setIsJoining(true);
    const { error } = await supabase.from('community_members').insert({
       community_id: community.id,
       user_id: session.user.id
    });
    if (!error) {
      setIsJoined(true);
      setMemberCount(prev => prev + 1);
    } else {
      setErrorMsg("No se pudo unir a la comunidad.");
    }
    setIsJoining(false);
  };

  const handleLeave = async () => {
    const confirm = window.confirm("¿Seguro que quieres dejar esta comunidad?");
    if (!confirm) return;
    setIsJoining(true);
    const { error } = await supabase.from('community_members').delete()
       .eq('community_id', community.id)
       .eq('user_id', session.user.id);
    if (!error) {
      setIsJoined(false);
      setMemberCount(prev => Math.max(0, prev - 1));
    } else {
      setErrorMsg("No se pudo dejar la comunidad.");
    }
    setIsJoining(false);
  };

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
      try {
        const { data: memberData } = await supabase.from('community_members')
          .select('*')
          .eq('community_id', community.id)
          .eq('user_id', session.user.id)
          .single();
        
        if (mounted && memberData) setIsJoined(true);
      } catch (e) {
        if (mounted) setIsJoined(false);
      }

      try {
        const { count } = await supabase.from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', community.id);
        
        if (mounted && count !== null) setMemberCount(count);
      } catch (e) {
        console.error("Error fetching member count");
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
          supabase.from('messages').select('*, profiles(*)').eq('id', msg.id).single()
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

    // Realtime profiles update for avatars
    const profilesSub = supabase.channel(`public:profiles_updates_${community.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        const updatedProfile = payload.new;
        if (mounted) {
           setMessages(prev => prev.map(msg => {
             if (msg.user_id === updatedProfile.id) {
               return {
                 ...msg,
                 profiles: {
                   ...msg.profiles,
                   username: updatedProfile.username || msg.profiles?.username,
                   avatar_url: updatedProfile.avatar_url,
                   real_name: updatedProfile.real_name,
                   role: updatedProfile.role || msg.profiles?.role
                 }
               };
             }
             return msg;
           }));
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      supabase.removeChannel(commSub);
      supabase.removeChannel(reactSub);
      supabase.removeChannel(profilesSub);
    };
  }, [community.id]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(*)')
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
    
    // Reset inputs visually but keep uploading
    setNewMessage('');
    setChatImageFile(null);
    setChatImagePreviewUrl(null);
    
    // Optimistic message setup
    const tempId = `temp_${Date.now()}`;
    const localImgUrl = imageFile ? URL.createObjectURL(imageFile) : null;
    
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
        username: userProfile?.username || session.user.email?.split('@')[0],
        avatar_url: userProfile?.avatar_url || session.user.user_metadata?.avatar_url,
        role: userProfile?.role
      }
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      let finalImgUrl: string | null = null;
      if (imageFile) {
        // Fallback for WebView/Android issues where signature might fail on relative URLs
        const cleanName = currentCommunity.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        try {
           const uploadRes = await uploadToCloudinary(imageFile, `NexusHub/${cleanName}/chat_media`);
           if (uploadRes && (uploadRes.secure_url || uploadRes.url)) {
             finalImgUrl = uploadRes.secure_url || uploadRes.url;
           } else {
             throw new Error("No se recibió URL de la imagen.");
           }
        } catch (uploadErr: any) {
           console.error("Cloudinary Error, intentando solución alterna...", uploadErr);
           // Retry with unsigned if signed failed (though we don't have preset, we just throw real error)
           throw new Error(`Fallo al enviar imagen: ${uploadErr.message}`);
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
        if (textContent?.startsWith('!ia ')) {
           try {
               const prompt = textContent?.replace('!ia ', '').trim();
               const res = await fetch('/api/nexus-ai', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ prompt, history: [], catalogue: [] })
               });
               const json = await res.json();
               if (json.success && json.text) {
                   const aiMessage = `[NEXUS AI] ${json.text.replace(/```json\n\[.*\]\n```/s, '')}`; // strip JSON for regular chat
                   await supabase.from('messages').insert([{
                      community_id: community.id,
                      user_id: session.user.id, 
                      content: serializeMessageContent(aiMessage, activeChannel, null),
                   }]);
               }
           } catch (e) {
               console.error("AI Response error in NexusHub", e);
           }
        }
      }
    } catch (err: any) {
      console.error("Error INSERT message:", err);
      setErrorMsg(`Error al enviar: ${err.message}`);
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
    <div className="flex flex-col h-[100dvh] w-full bg-nexus-card overflow-hidden relative font-sans">
      
       {/* Sci background */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
       
       <header className="shrink-0 bg-nexus-surface backdrop-blur-xl border-b border-nexus-border/80 flex flex-col justify-center px-2 sm:px-6 py-2 sm:py-4 z-20 shadow-nexus-glow">
          <div className="flex items-center justify-between mb-3 mt- safe-top">
             <div className="flex items-center gap-2 sm:gap-4 flex-1 overflow-hidden">
                <button onClick={onBack} className="p-2 sm:p-2.5 border border-nexus-border rounded-lg text-cyan-500 hover:bg-cyan-950/50 hover:text-cyan-300 transition-colors shrink-0 shadow-inner">
                   <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="flex items-center gap-3 min-w-0" onClick={() => setIsSidebarOpen(true)}>
                   <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black border border-cyan-500/50 rounded-[10px] shrink-0 overflow-hidden shadow-nexus-glow">
                      {currentCommunity.image_url ? (
                        <img src={currentCommunity.image_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cyan-400 font-black text-xl uppercase">{currentCommunity.name[0]}</div>
                      )}
                   </div>
                   <div className="min-w-0">
                      <h2 className="text-lg sm:text-2xl font-black text-nexus-text uppercase tracking-tighter drop-shadow-nexus-glow truncate">{currentCommunity.name}</h2>
                      <p className="text-[9px] sm:text-[10px] font-mono text-cyan-400 capitalize flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                        {onlineCount} {t('community.membersOnline')} <span className="opacity-50">| {memberCount} {t('community.members')}</span>
                      </p>
                   </div>
                </div>
             </div>
             
             {/* HUD elements */}
             <div className="hidden sm:flex items-center gap-4 shrink-0 border-l border-nexus-border/50 pl-4 ml-4">
                 {isJoined && (
                   <button onClick={handleLeave} disabled={isJoining} className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg mr-2 transition-colors">
                     {t('community.leave')}
                   </button>
                 )}
                 <div className="text-right">
                    <p className="text-[9px] font-mono text-cyan-500 uppercase tracking-widest opacity-80">Identidad</p>
                    <p className="text-xs font-black text-nexus-text uppercase tracking-wider">{session.user.email?.split('@')[0]}</p>
                 </div>
                 <div className="w-10 h-10 rounded bg-cyan-950/40 border border-nexus-border flex items-center justify-center shadow-inner">
                    <Users className="w-5 h-5 text-cyan-400" />
                 </div>
             </div>
          </div>
          
          {/* Top Channel Bar */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
             {channels.map(chanName => (
               <button 
                  key={chanName}
                  onClick={() => setActiveChannel(chanName)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-[8px] transition-all whitespace-nowrap flex items-center gap-1.5
                    ${activeChannel === chanName 
                      ? 'bg-cyan-500 text-nexus-bg shadow-nexus-glow' 
                      : 'bg-black border border-nexus-border/80 text-cyan-500/70 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-950/20'}
                  `}
               >
                 <Hash className="w-3 h-3 sm:w-4 sm:h-4 opacity-70" /> {chanName}
               </button>
             ))}
             {isCreatorOrAdmin && (
               <button onClick={() => setShowChannelForm(!showChannelForm)} className="px-3 py-1.5 sm:py-2 bg-black border border-dashed border-nexus-border text-cyan-600 hover:text-cyan-400 hover:border-cyan-400 rounded transition-colors text-xs font-bold shrink-0">
                  + RECEPTOR
               </button>
             )}
          </div>
       </header>

       {/* Floating form for new channel */}
       {showChannelForm && (
         <div className="absolute top-[120px] left-0 w-full bg-cyan-950/90 backdrop-blur-md border-b border-cyan-500/50 p-3 z-30 flex justify-center shadow-2xl">
             <form onSubmit={handleCreateChannel} className="flex gap-2 w-full max-w-sm">
               <input type="text" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="NUEVO_CANAL" maxLength={16}
                 className="flex-1 bg-black border border-cyan-500/80 text-cyan-400 font-mono text-xs px-3 py-2 rounded focus:outline-none uppercase placeholder:text-cyan-900 shadow-inner" />
               <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-nexus-bg px-4 py-2 font-black text-xs rounded uppercase tracking-widest shadow-nexus-glow shrink-0">SETEAR</button>
             </form>
         </div>
       )}

       {/* Error Hologram */}
       <AnimatePresence>
         {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} 
               className="absolute top-[140px] left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-500 text-red-100 px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
              {errorMsg}
              <button onClick={() => setErrorMsg(null)} className="ml-2 hover:text-nexus-text"><X className="w-4 h-4" /></button>
            </motion.div>
         )}
       </AnimatePresence>

       <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col gap-5 sm:gap-6 relative z-10 scrollbar-hide">
         
         {!isJoined ? (
           <div className="flex flex-col items-center justify-center my-auto">
              <div className="w-24 h-24 bg-cyan-950/30 rounded-full flex items-center justify-center border border-nexus-border/50 shadow-nexus-glow mb-6">
                 <Shield className="w-10 h-10 text-cyan-600" />
              </div>
              <h3 className="text-xl font-black text-cyan-400 uppercase tracking-widest mb-3">{t('community.restricted')}</h3>
              <p className="text-sm font-mono text-cyan-600 uppercase tracking-widest mb-8 text-center px-4">{t('community.mustJoin')}</p>
              <button 
                onClick={handleJoin} 
                disabled={isJoining}
                className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-nexus-bg font-black uppercase text-sm tracking-widest rounded-[12px] shadow-nexus-glow transition-all"
              >
                {isJoining ? (t('community.processing')) : (t('community.join'))}
              </button>
           </div>
         ) : (
           <>
             {/* Welcome Hologram */}
             {filteredMessages.length === 0 && (
               <div className="flex flex-col items-center justify-center my-auto animate-pulse">
                  <div className="w-20 h-20 bg-cyan-950/30 rounded-full flex items-center justify-center border border-nexus-border/50 shadow-nexus-glow mb-4">
                     <Lock className="w-8 h-8 text-cyan-700" />
                  </div>
                  <p className="text-cyan-600 font-mono text-[10px] uppercase tracking-widest">{t("community.emptyTransmission")}</p>
               </div>
             )}
    
             {filteredMessages.map((msg, index) => {
             const parsed = parseMessageContent(msg.content);
             const isOwn = msg.user_id === session.user.id;
             const isAI = parsed.text?.startsWith('[NEXUS AI]');
             const displayText = isAI ? parsed.text.replace('[NEXUS AI]', '').trim() : parsed.text;
             const showAvatar = true; 
             const msgReactions = getRenderReactions(msg.id);

             return (
               <div key={msg.id} className={`flex w-full ${(isOwn && !isAI) ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[75%] ${(isOwn && !isAI) ? 'flex-row-reverse' : 'flex-row'}`}>
                     
                     {/* Cyber Avatar Bubble */}
                     <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-black border border-nexus-border rounded-[8px] flex items-center justify-center p-0.5 relative shadow-inner overflow-hidden mt-2">
                        {isAI ? (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-black text-indigo-400 flex items-center justify-center">
                             <Bot className="w-4 h-4 sm:w-5 sm:h-5 " />
                          </div>
                        ) : msg.profiles?.avatar_url ? (
                            <img src={msg.profiles.avatar_url} className="w-full h-full object-cover rounded-[5px] grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all"/>
                         ) : <span className="text-cyan-500 font-mono font-bold text-xs sm:text-sm">{(msg.profiles?.username)[0]?.toUpperCase()}</span>}
                     </div>

                     {/* Content Bubble HUD */}
                     <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className={`flex items-baseline gap-2 ${(isOwn && !isAI) ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
                           {isAI ? (
                             <span className="text-[9px] sm:text-[11px] font-black italic text-indigo-400 uppercase tracking-widest text-shadow-[0_0_5px_rgba(99,102,241,0.5)]">AI.SYS</span>
                           ) : (
                             <span className="text-[10px] sm:text-[12px] font-black text-cyan-100 tracking-wider">{(msg.profiles?.username).toUpperCase()}</span>
                           )}
                           <span className="text-[8px] sm:text-[9px] font-mono text-cyan-800 tracking-widest">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        
                        <div className={`relative px-3 py-2 sm:px-4 sm:py-3 border ${
                          isAI ? 'bg-indigo-950/20 border-indigo-500/20 rounded-b-xl rounded-tr-xl shadow-[0_4px_20px_rgba(99,102,241,0.05)]' :
                          (isOwn ? 'bg-cyan-950/30 border-cyan-500/20 rounded-b-xl rounded-tl-xl text-right shadow-nexus-glow' : 'bg-nexus-surface/80 border-nexus-border/40 rounded-b-xl rounded-tr-xl')
                        }`}>
                           {msg.deleted ? (
                             <p className="text-[11px] font-mono text-red-500/70 italic flex items-center justify-center gap-2">
                               <AlertTriangle className="w-3 h-3" /> DATOS PURGADOS
                             </p>
                           ) : (
                             <>
                               {displayText && (
                                 <div className={`text-[13px] sm:text-[14px] leading-relaxed ${isAI ? 'text-indigo-200' : 'text-nexus-text'} font-sans break-words whitespace-pre-wrap`}>{displayText}</div>
                               )}
                               
                               {parsed.image_url && (
                                 <div className="relative mt-3 inline-block">
                                   <img src={parsed.image_url} onClick={() => window.open(parsed.image_url||'', '_blank')} className="w-full max-w-[200px] sm:max-w-[280px] rounded-lg border border-nexus-border/50 hover:border-cyan-500/50 grayscale hover:grayscale-0 transition-all cursor-pointer shadow-lg" />
                                   <div className="absolute top-2 right-2 bg-nexus-overlay backdrop-blur border border-red-500/50 text-red-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(239,68,68,0.3)] pointer-events-none uppercase tracking-widest flex items-center gap-1">
                                     <Timer className="w-3 h-3" /> 7d
                                   </div>
                                 </div>
                               )}

                               {/* HUD Hover Options */}
                               {!msg.deleted && (
                                 <div className={`absolute top-2 ${(isOwn && !isAI) ? '-left-8' : '-right-8'} opacity-0 opacity-100 flex flex-col gap-1 transition-opacity`}>
                                    <button onClick={() => deleteMessage(msg.id)} className="w-6 h-6 bg-red-950/80 border border-red-900 rounded flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-nexus-text transition-colors" title="Borrar">
                                       <Trash2 className="w-3 h-3" />
                                    </button>
                                 </div>
                               )}
                             </>
                           )}
                           
                           {/* Rendered Reactions */}
                           {msgReactions.length > 0 && !msg.deleted && (
                             <div className={`flex gap-1.5 mt-2 flex-wrap ${(isOwn && !isAI) ? 'justify-end' : 'justify-start'}`}>
                               {msgReactions.map(([emoji, meta]: any) => (
                                 <button key={emoji} onClick={() => handleToggleReaction(msg.id, emoji)} className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${meta.active ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-nexus-glow' : 'bg-nexus-surface text-nexus-text-sec border border-nexus-border/50 hover:border-cyan-700'}`}>
                                    <span>{emoji}</span> <span>{meta.count}</span>
                                 </button>
                               ))}
                             </div>
                           )}
                        </div>
                        
                        {/* Quick react HUD (always visible minimal on mobile) */}
                        {!msg.deleted && (
                            <div className={`flex gap-1 mt-1 ${(isOwn && !isAI) ? 'justify-end' : 'justify-start'}`}>
                              {['👍', '🔥', '😆'].map(emoji => (
                                 <button key={emoji} onClick={() => handleToggleReaction(msg.id, emoji)} className="text-[12px] opacity-60 hover:opacity-100 hover:scale-110 active:scale-90 transition-all mr-1">{emoji}</button>
                              ))}
                           </div>
                        )}
                        
                     </div>
                  </div>
               </div>
             )
         })}
           </>
         )}
         <div ref={messagesEndRef} className="h-6" />
       </main>

       {/* Cyber Input Area */}
       {isJoined && (
         <div className="p-3 sm:p-5 shrink-0 relative bg-black border-t border-nexus-border/50 z-20 pb-safe">
             {chatImagePreviewUrl && (
               <div className="absolute bottom-full left-4 bg-nexus-card/80 backdrop-blur-md border border-nexus-border p-2 rounded-t-xl flex gap-3 items-center shadow-lg">
                  <img src={chatImagePreviewUrl} className="w-14 h-14 object-cover rounded-lg border border-nexus-border" />
                  <button onClick={() => {setChatImageFile(null); setChatImagePreviewUrl(null);}} className="w-6 h-6 bg-red-950 rounded-full flex items-center justify-center text-red-500 hover:text-red-300 transition-colors"><X className="w-3 h-3"/></button>
               </div>
             )}
  
             <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3 relative max-w-5xl mx-auto items-stretch">
                <input type="file" id="hud-file" className="hidden" accept="image/*" onChange={(e)=>{
                  if(e.target.files&&e.target.files[0]){
                    setChatImageFile(e.target.files[0]);
                    setChatImagePreviewUrl(URL.createObjectURL(e.target.files[0]));
                  }
                }} />
                <label htmlFor="hud-file" className="w-[45px] sm:w-[50px] bg-cyan-950/40 border border-nexus-border/80 text-cyan-500 flex justify-center items-center cursor-pointer hover:bg-cyan-900/80 hover:border-cyan-400 hover:text-cyan-400 transition-all rounded-[12px] shadow-inner shrink-0 group">
                   <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform"/>
                </label>
  
                <div className="flex-1 relative flex items-center">
                   <input 
                     type="text" 
                     value={newMessage} 
                     onChange={e=>setNewMessage(e.target.value)} 
                     placeholder="TRANSMITIR MENSAJE..." 
                     className="w-full h-full bg-nexus-surface border border-nexus-border/80 text-cyan-300 font-mono text-[11px] sm:text-xs px-4 focus:outline-none focus:border-cyan-500 focus:bg-nexus-card transition-all shadow-inner rounded-[12px] placeholder:text-cyan-900/80" 
                   />
                   <div className="absolute right-3 w-1.5 h-1.5 bg-cyan-700 rounded-full animate-pulse pointer-events-none"></div>
                </div>
                
                <button type="submit" disabled={(!newMessage.trim() && !chatImageFile) || isSending} className="w-[80px] sm:w-[120px] bg-cyan-500 text-nexus-bg font-black uppercase text-[10px] sm:text-xs hover:bg-cyan-400 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 transition-all rounded-[12px] disabled:opacity-30 disabled:hover:scale-100 disabled:pointer-events-none shadow-nexus-glow shrink-0">
                   <span className="hidden sm:inline">ENVIAR</span>
                   <Send className="w-4 h-4" />
                </button>
             </form>
         </div>
       )}
    </div>
  );

}

// ============================================================================
// CREATE MODAL
// ============================================================================

function CreateCommunityModal({ session, isAdmin, onClose, onSuccess }: any) {
  const { t } = useAppStore();
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
    <div className="fixed inset-0 z-[99999] bg-nexus-card backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 touch-none">
      <motion.div 
        initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
        className="bg-nexus-card sm:border border-nexus-border sm:rounded-3xl rounded-t-3xl w-full h-[90vh] sm:h-auto sm:max-w-md p-6 sm:p-8 relative shadow-2xl overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto sm:hidden mb-6"></div>
        <button onClick={onClose} className="absolute top-6 right-6 text-nexus-text-sec hover:text-nexus-text transition-colors bg-nexus-card rounded-full p-2" disabled={isCreating}>
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 rounded-2xl flex items-center justify-center mb-6">
           <Hash className="w-8 h-8 text-cyan-400" />
        </div>
        <h3 className="text-3xl font-black text-nexus-text italic tracking-tight mb-2">{t("hub.newCommunity")}</h3>
        <p className="text-nexus-text-sec mb-8 font-medium">{t("hub.startTopic")}</p>

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
               setCreateError(t("hub.reqLogo"));
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
                throw new Error(t("hub.upImageFail"));
              }
              
              const image_url = uploadRes.secure_url || uploadRes.url;
              
              const { data, error } = await supabase.from('communities').insert([{
                name, description: desc, category, creator_id: session.user.id, image_url
              }]).select().single();
              
              if (error) {
                setCreateError(error.message || t("hub.createFailName"));
              } else if (data) {
                onSuccess(data);
              }
            } catch (err: any) {
               setCreateError(err?.message || t("hub.unexpectFail"));
            } finally {
              setIsCreating(false);
            }
          }} 
          className="space-y-5"
        >
           {/* Upload Logo Section */}
           <div className="flex flex-col items-center mb-6">
              <label htmlFor="logo-upload" className="block text-[11px] font-bold text-nexus-text-sec uppercase tracking-widest mb-3 w-full text-left">{t("hub.commLogo")}</label>
              <div 
                className={`w-28 h-28 rounded-3xl border-2 border-dashed ${previewUrl ? 'border-cyan-500' : 'border-nexus-border hover:border-cyan-500/50'} flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden group`}
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-nexus-surface opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <ImageIcon className="w-8 h-8 text-nexus-text" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-nexus-text-sec group-hover:text-cyan-400 transition-colors">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t("hub.upload")}</span>
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
             <label className="block text-[11px] font-bold text-nexus-text-sec uppercase tracking-widest mb-2">{t("hub.commNameT")}</label>
             <input name="name" required disabled={isCreating} className="w-full bg-nexus-surface border-2 border-transparent focus:border-cyan-500/50 rounded-xl px-5 py-3.5 text-nexus-text focus:outline-none transition-all placeholder:text-gray-600 font-medium shadow-inner" placeholder={t("hub.commNameP")} />
           </div>
           <div>
             <label className="block text-[11px] font-bold text-nexus-text-sec uppercase tracking-widest mb-2">Acerca de</label>
             <textarea name="description" required disabled={isCreating} className="w-full bg-nexus-surface border-2 border-transparent focus:border-cyan-500/50 rounded-xl px-5 py-3.5 text-nexus-text min-h-[100px] resize-none focus:outline-none transition-all placeholder:text-gray-600 font-medium shadow-inner" placeholder="De qué se hablará en este espacio..." />
           </div>
           <div>
             <label className="block text-[11px] font-bold text-nexus-text-sec uppercase tracking-widest mb-2">Categoría Principal</label>
             <div className="relative">
               <select name="category" disabled={isCreating} className="w-full bg-nexus-surface border-2 border-transparent focus:border-cyan-500/50 rounded-xl px-5 py-3.5 text-nexus-text outline-none transition-all appearance-none font-medium shadow-inner">
                  <option value="Juegos">🎮 Juegos & Esports</option>
                  <option value="Tecnología">💻 Tecnología</option>
                  <option value="Desarrollo">👨‍💻 Desarrollo</option>
                  <option value="General">💬 General</option>
               </select>
             </div>
           </div>
           <div className="pt-6">
             <button type="submit" disabled={isCreating} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-nexus-text font-black rounded-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
               {isCreating ? <div className="w-5 h-5 border-2 border-nexus-border border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
               {isCreating ? 'CREANDO...' : 'CREAR COMUNIDAD'}
             </button>
           </div>
        </form>
      </motion.div>
    </div>
  );
}
