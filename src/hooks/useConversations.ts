import { useState, useEffect } from 'react';
import { AppItem } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  recommendedApps?: AppItem[];
  isError?: boolean;
  errorDetails?: any;
  createdAt?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  isPinned?: boolean;
}

export function useConversations(userId: string) {
  const getStorageKey = () => `nexus_ai_conversations_${userId}`;
  
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    async function loadFromDB() {
      if (!isSupabaseConfigured || userId === 'anonymous') return;
      try {
        console.log(`[Diagnostic] Iniciando carga de conversaciones desde Supabase para userId: ${userId}`);
        const { data, error } = await supabase
          .from('ai_conversations')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error(`[Diagnostic] Supabase load error (ai_conversations):`, error.message, error.details || '');
          throw error;
        }

        if (data && data.length > 0) {
          console.log(`[Diagnostic] Conversaciones cargadas desde DB: ${data.length}`);
          const mapped = data.map(d => ({
            id: d.id,
            userId: d.user_id,
            title: d.title,
            createdAt: new Date(d.created_at).getTime(),
            updatedAt: new Date(d.updated_at).getTime(),
            messages: d.messages || [],
            isPinned: d.is_pinned || false
          }));
          setConversations(mapped);
          
          if (!currentId && mapped.length > 0) {
            setCurrentId(mapped[0].id);
          }
        }
      } catch (err: any) {
        console.warn("[Diagnostic] Fallo al cargar historial remoto. Usando localStorage.");
      }
    }
    loadFromDB();
  }, [userId]);

  useEffect(() => {
    if (!currentId && conversations.length > 0) {
      setCurrentId(conversations[0].id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(getStorageKey(), JSON.stringify(conversations));
  }, [conversations, userId]);

  const syncToDB = async (conv: Conversation) => {
    if (!isSupabaseConfigured || userId === 'anonymous') return;
    try {
      console.log(`[Diagnostic] Sincronizando historial a Supabase (conv ID: ${conv.id})`);
      const payload = {
        id: conv.id,
        user_id: conv.userId,
        title: conv.title,
        created_at: new Date(conv.createdAt).toISOString(),
        updated_at: new Date(conv.updatedAt).toISOString(),
        messages: conv.messages,
        is_pinned: conv.isPinned || false
      };
      
      const { error } = await supabase.from('ai_conversations').upsert(payload);
      if (error) {
         console.error(`[Diagnostic] Error syncing to DB (ai_conversations):`, error.message, error.details || '');
      } else {
         console.log(`[Diagnostic] Historial guardado correctamente en Supabase.`);
      }
    } catch (e) {
      console.error("[Diagnostic] Error crítico en syncToDB:", e);
    } // No throw to prevent blocking
  };

  const currentConversation = conversations.find(c => c.id === currentId);

  const startNew = () => {
    setCurrentId(null);
  };

  const addMessage = (message: Message) => {
    let updatedConv: Conversation | null = null;
    if (!currentId) {
      const newId = crypto.randomUUID();
      const newConv: Conversation = {
        id: newId,
        userId,
        title: message.text.substring(0, 40) + (message.text.length > 40 ? '...' : ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [message]
      };
      setConversations(prev => [newConv, ...prev]);
      setCurrentId(newId);
      updatedConv = newConv;
    } else {
      setConversations(prev => prev.map(c => {
        if (c.id === currentId) {
          updatedConv = {
            ...c,
            messages: [...c.messages, message],
            updatedAt: Date.now()
          };
          return updatedConv;
        }
        return c;
      }));
    }
    
    if (updatedConv) {
       syncToDB(updatedConv);
       console.log(`[Diagnostic] Mensaje añadido al historial: ${message.role} (${message.id})`);
    }
  };

  const deleteConversation = async (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentId === id) setCurrentId(null);
    if (isSupabaseConfigured && userId !== 'anonymous') {
       const { error } = await supabase.from('ai_conversations').delete().eq('id', id);
       if (error) console.error("[Diagnostic] Error deleting from DB", error);
    }
  };

  const renameConversation = (id: string, newTitle: string) => {
    const updated = conversations.map(c => c.id === id ? { ...c, title: newTitle } : c);
    setConversations(updated);
    const conv = updated.find(c => c.id === id);
    if (conv) syncToDB(conv);
  };

  const togglePin = (id: string) => {
    const updated = conversations.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c);
    setConversations(updated);
    const conv = updated.find(c => c.id === id);
    if (conv) syncToDB(conv);
  };

  return {
    conversations,
    currentId,
    currentConversation,
    setCurrentId,
    startNew,
    addMessage,
    deleteConversation,
    renameConversation,
    togglePin
  };
}
