import re

with open('src/components/admin/AdminViews2.tsx', 'r') as f:
    content = f.read()

# Add group_id to notifications insert
component_regex = re.compile(r'export function AdminNotifications.*?^\s*\}\s*;\s*return \(.*?^\}\n', re.MULTILINE | re.DOTALL)

# Let's find the exact block using string matching to be safe
start_idx = content.find('export function AdminNotifications({ users, addToast }: any) {')
end_idx = content.find('export function AdminDatabaseTools', start_idx)

if start_idx != -1 and end_idx != -1:
    original = content[start_idx:end_idx]
    
    new_component = """export function AdminNotifications({ users, addToast }: any) {
  const [target, setTarget] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchActiveAlerts();
    
    const channel = supabase.channel('admin_alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchActiveAlerts();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchActiveAlerts = async () => {
    // Only get notifications that haven't expired and have a group_id
    // We group them by group_id on the client for simplicity since distinct/group by is limited in basic PostgREST
    const { data, error } = await supabase
      .from('notifications')
      .select('group_id, title, message, created_at, expires_at')
      .not('group_id', 'is', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
      
    if (data && !error) {
      // Group by group_id
      const map = new Map();
      data.forEach(n => {
        if (!map.has(n.group_id)) {
          map.set(n.group_id, n);
        }
      });
      setActiveAlerts(Array.from(map.values()));
    }
  };

  const sendNotification = async (e: any) => {
    e.preventDefault();
    if (!title || !message) {
      addToast('Llena todos los campos', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const usersToNotify = target === 'all' ? users : users.filter((u: any) => u.id === target);
      if (usersToNotify.length === 0) throw new Error('No hay usuarios seleccionados');
      
      const groupId = crypto.randomUUID(); // Identificador único de grupo
      
      const notifications = usersToNotify.map((u: any) => ({
        user_id: u.id,
        title,
        message,
        read: false,
        group_id: groupId
      }));
      
      // Let the database default the expires_at field (24 hours)
      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;
      
      addToast(`Notificación (Grupo) enviada a ${usersToNotify.length} usuarios`, 'success');
      setTitle('');
      setMessage('');
      fetchActiveAlerts();
    } catch(err: any) {
      addToast('Error al enviar: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteAlert = async (groupId: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('group_id', groupId);
      if (error) throw error;
      addToast('Alerta global eliminada', 'success');
      fetchActiveAlerts();
    } catch(err: any) {
      addToast('Error al eliminar: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <h2 className="text-2xl font-black text-nexus-text flex items-center gap-2"><Send className="w-6 h-6 text-red-500" /> Transmisión de Alertas</h2>
      
      <div className="glass-panel p-6 md:p-8 rounded-3xl border-red-900/20 bg-nexus-card/80">
        <form onSubmit={sendNotification} className="space-y-6">
          <div>
            <label className="text-xs font-bold text-red-300/50 uppercase">Destinatario(s)</label>
            <select 
              value={target}
              onChange={e => setTarget(e.target.value)}
              className="w-full h-12 bg-nexus-surface border border-red-900/30 rounded-xl px-4 text-sm mt-1 focus:border-red-500 outline-none text-nexus-text transition-colors mt-2"
            >
              <option value="all">🌐 Todos los usuarios ({users.length})</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>👤 {u.email} ({u.username || u.name || 'Desconocido'})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-red-300/50 uppercase">Título del Aviso</label>
            <input 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full h-12 bg-nexus-surface border border-red-900/30 rounded-xl px-4 text-sm mt-2 focus:border-red-500 outline-none text-nexus-text transition-colors"
              placeholder="Ej: Mantenimiento programado"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-red-300/50 uppercase">Mensaje (Reporte/Aviso)</label>
            <textarea 
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className="w-full bg-nexus-surface border border-red-900/30 rounded-xl p-4 text-sm mt-2 focus:border-red-500 outline-none text-nexus-text transition-colors resize-none"
              placeholder="Escribe el mensaje..."
            />
          </div>
          <div className="pt-2">
            <button 
              disabled={isLoading}
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-nexus-text font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50"
            >
              {isLoading ? 'Enviando...' : 'Propagar Señal'}
            </button>
          </div>
        </form>
      </div>

      {activeAlerts.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-nexus-card/80 mt-6">
          <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Alertas Activas (Expiran en 24h)
          </h3>
          <div className="space-y-4">
            {activeAlerts.map(alert => (
              <div key={alert.group_id} className="bg-nexus-surface p-4 rounded-xl border border-red-900/30 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-nexus-text">{alert.title}</h4>
                  <p className="text-xs text-nexus-text-sec mt-1 line-clamp-1">{alert.message}</p>
                  <p className="text-xs text-red-400/80 mt-2">
                    Expira: {new Date(alert.expires_at).toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => deleteAlert(alert.group_id)}
                  className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                  title="Eliminar Alerta Global"
                >
                  <Trash className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
"""
    
    with open('src/components/admin/AdminViews2.tsx', 'w') as out:
        out.write(content.replace(original, new_component))
        print("Patched successfully")
else:
    print("Could not find start or end")

