import { useAppStore } from '../../store/useAppStore';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, Trash2 } from 'lucide-react';
import { ToastType } from '../Toast';

export function AdminContactView({ addToast }: { addToast: (msg: string, type: ToastType) => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useAppStore();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      addToast('Error al cargar mensajes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ read: true })
        .eq('id', id);
      
      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === id ? {...m, read: true} : m));
      addToast('Mensaje marcado como leído', 'success');
    } catch (err) {
      addToast('Error al actualizar', 'error');
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== id));
      addToast('Mensaje eliminado', 'success');
    } catch (err) {
      addToast('Error al eliminar', 'error');
    }
  };

  if (loading) return <div className="text-nexus-text text-center py-20">{t('app.loading')}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-nexus-text mb-6">Mensajes Recibidos</h2>
      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`glass-panel p-6 rounded-2xl border ${msg.read ? 'border-nexus-border' : 'border-red-500/30'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-nexus-text text-lg">{msg.name} ({msg.email})</h3>
                <p className="text-cyan-400 text-sm font-medium">{msg.subject} - {msg.category}</p>
              </div>
              <div className="flex gap-2">
                {!msg.read && (
                  <button onClick={() => markAsRead(msg.id)} className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg"><Check className="w-5 h-5"/></button>
                )}
                <button onClick={() => deleteMessage(msg.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-5 h-5"/></button>
              </div>
            </div>
            <p className="text-nexus-text bg-nexus-card p-4 rounded-xl">{msg.message}</p>
            <p className="text-xs text-nexus-text-sec mt-4">{new Date(msg.created_at).toLocaleString()}</p>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center py-20 text-nexus-text-sec">No hay mensajes por ahora.</div>
        )}
      </div>
    </div>
  );
}
