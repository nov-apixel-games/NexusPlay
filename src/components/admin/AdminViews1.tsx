import { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Download, Zap, Smartphone, CheckCircle, 
  XCircle, Edit, Trash2, Star, ShieldAlert, BadgeCheck, Code 
} from 'lucide-react';
import { AppItem, UserItem } from '../../types';
import { supabase } from '../../lib/supabase';

export function AdminDashboard({ apps, users }: { apps: AppItem[], users: UserItem[] }) {
  const [cpu, setCpu] = useState(35);
  const [ram, setRam] = useState(62);
  const [io, setIo] = useState(25);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(prev => Math.min(100, Math.max(10, prev + (Math.random() * 20 - 10))));
      setRam(prev => Math.min(100, Math.max(20, prev + (Math.random() * 8 - 4))));
      setIo(prev => Math.min(100, Math.max(5, prev + (Math.random() * 30 - 15))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const totalDownloads = apps.reduce((acc, current) => {
    // Fake parsing of "100M+" etc to number
    const val = parseInt(current.downloads.replace(/[^0-9]/g, '')) || 0;
    return acc + val;
  }, 0);

  const pendingApps = apps.filter(a => a.status === 'pending').length;
  const publishedApps = apps.filter(a => a.status !== 'pending' && a.status !== 'rejected').length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Smartphone} title="Apps Publicadas" value={publishedApps} color="text-red-500" />
        <MetricCard icon={Users} title="Usuarios" value={users.length} color="text-rose-400" />
        <MetricCard icon={Download} title="Descargas Totales" value={`${totalDownloads}M+`} color="text-red-400" />
        <MetricCard icon={ShieldAlert} title="Apps Pendientes" value={pendingApps} color="text-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-[#120505]/50">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-red-500" /> Tráfico (Mock)</h3>
          <div className="flex items-end gap-2 h-48 mt-4">
            {[40, 70, 45, 90, 65, 120, 85].map((val, i) => (
              <div key={i} className="flex-1 bg-red-500/20 hover:bg-red-500/50 rounded-t-lg transition-all relative group" style={{ height: `${(val / 120) * 100}%` }}>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded">{val}k</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium">
            <span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-[#120505]/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse glow-red" /> Live DB / Vercel Edge
            </div>
          </div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-rose-500" /> Rendimiento del Sistema</h3>
          <div className="space-y-4">
            <ProgressBar label="CPU Usage" value={Math.round(cpu)} color="bg-red-500" />
            <ProgressBar label="RAM / Memory Reserve" value={Math.round(ram)} color="bg-rose-500" />
            <ProgressBar label="I/O & Latency" value={Math.round(io)} color="bg-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, color }: any) {
  return (
    <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-[#120505]/50 flex items-center gap-4 hover:border-red-500/30 transition-colors shadow-[min(0px,0px)_0_0_red] hover:shadow-[0_0_15px_rgba(220,38,38,0.1)]">
      <div className={`p-4 rounded-2xl bg-red-950/50 border border-red-900/30 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-gray-400 text-sm font-medium">{title}</h4>
        <div className={`text-2xl font-black ${color}`}>{value}</div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1 font-medium">
        <span className="text-gray-300">{label}</span>
        <span className={value > 80 ? 'text-yellow-400' : 'text-gray-400'}>{value}%</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function AdminUsers({ users, setUsers, addToast }: { users: UserItem[], setUsers: (u: UserItem[]) => void, addToast: any }) {
  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setUsers(users.map(u => u.id === id ? { ...u, status: newStatus as any } : u));
    addToast(newStatus === 'active' ? 'Usuario activado exitosamente.' : 'Usuario suspendido.', newStatus === 'active' ? 'success' : 'info');
  };

  const changeRole = async (id: string, role: string) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) {
       addToast(`Error al cambiar rol: ${error.message}`, 'error');
       return;
    }
    setUsers(users.map(u => u.id === id ? { ...u, role } : u));
    addToast(`Rol de usuario actualizado a ${role}`, 'success');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white flex items-center gap-2"><Users className="w-6 h-6 text-red-500" /> Gestión de Usuarios</h2>
      
      <div className="glass-panel rounded-3xl overflow-hidden border-red-900/20 bg-[#120505]/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-red-950/30 text-red-200/60 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-900/20">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-red-900/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 shadow-[0_0_10px_rgba(220,38,38,0.3)] flex items-center justify-center text-xs text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-gray-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={user.role} 
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className="bg-black/40 border border-red-900/30 rounded-lg px-2 py-1 text-xs focus:border-red-500 outline-none hover:bg-red-900/20 text-red-100"
                    >
                      <option value="user">Usuario</option>
                      <option value="developer">Desarrollador</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toggleStatus(user.id, user.status || 'active')}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all active:scale-95 ${
                        (user.status || 'active') === 'active' ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                      }`}
                    >
                      {(user.status || 'active') === 'active' ? 'Suspender' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
