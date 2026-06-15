import { useAppStore } from '../../store/useAppStore';
import { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Download, Smartphone, Trash2, ShieldAlert 
} from 'lucide-react';
import { AppItem, UserItem } from '../../types';
import { supabase, authFetch } from '../../lib/supabase';
import { SystemMetrics } from './SystemMetrics';

export function AdminDashboard({ apps, users }: { apps: AppItem[], users: UserItem[] }) {
  const [sysStats, setSysStats] = useState<any>(null);

  useEffect(() => {
    authFetch('/api/system-stats').then(res => res.json()).then(json => {
      if (json.success) setSysStats(json);
    }).catch(e => console.error(e));
  }, []);

  const totalDownloads = apps.reduce((acc, current) => acc + (current.download_count || 0), 0);
  const pendingApps = apps.filter(a => a.status === 'pending').length;
  const publishedApps = apps.filter(a => a.status !== 'pending' && a.status !== 'rejected').length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-nexus-text">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Smartphone} title="Apps Publicadas" value={publishedApps} color="text-red-500" />
        <MetricCard icon={Users} title="Usuarios" value={users.length} color="text-rose-400" />
        <MetricCard icon={Download} title="Descargas Totales" value={totalDownloads} color="text-red-400" />
        <MetricCard icon={ShieldAlert} title="Apps Pendientes" value={pendingApps} color="text-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-nexus-card/80">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-red-500" /> Monitoreo de Recursos en Tiempo Real</h3>
          <div className="mt-4 space-y-4">
               <ProgressBar label="CPU System" value={sysStats ? Math.round((sysStats.systemInfo.loadAvg[0] / sysStats.systemInfo.cpuCores) * 100) : 0} color="bg-red-500" />
               <ProgressBar label="RAM System" value={sysStats ? Math.round(((sysStats.systemInfo.totalMem - sysStats.systemInfo.freeMem) / sysStats.systemInfo.totalMem) * 100) : 0} color="bg-rose-500" />
               <ProgressBar label="Server IO (Aprox)" value={sysStats ? 15 : 0} color="bg-red-900" />
          </div>
          <p className="mt-6 text-xs text-center text-nexus-text-sec">Datos obtenidos de /api/system-stats (OS Module)</p>
        </div>

        <SystemMetrics />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, color }: any) {
  return (
    <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-nexus-card/80 flex items-center gap-4 hover:border-red-500/30 transition-colors shadow-[min(0px,0px)_0_0_red] hover:shadow-[0_0_15px_rgba(220,38,38,0.1)]">
      <div className={`p-4 rounded-2xl bg-red-950/50 border border-red-900/30 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-nexus-text-sec text-sm font-medium">{title}</h4>
        <div className={`text-2xl font-black ${color}`}>{value}</div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1 font-medium">
        <span className="text-nexus-text">{label}</span>
        <span className={value > 80 ? 'text-yellow-400' : 'text-nexus-text-sec'}>{value}%</span>
      </div>
      <div className="h-2 w-full bg-nexus-card rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function AdminUsers({ users, setUsers, addToast }: { users: any[], setUsers: (u: any[]) => void, addToast: any }) {
  const { t } = useAppStore();
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
    if (error) {
       addToast(`Error: ${error.message}`, 'error');
       return;
    }
    setUsers(users.map(u => u.id === id ? { ...u, status: newStatus as any } : u));
    addToast(newStatus === 'active' ? 'Usuario activado exitosamente.' : 'Usuario suspendido.', newStatus === 'active' ? 'success' : 'info');
  };

  const changeRole = async (id: string, role: string) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) {
       addToast(`Error al cambiar rol: ${error.message}`, 'error');
       return;
    }
    setUsers(users.map(u => u.id === id ? { ...u, role: role as 'user' | 'developer' | 'admin' } : u));
    addToast(`Rol de usuario actualizado a ${role}`, 'success');
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario completamente?")) return;
    
    // Attempt backend delete via API if available, or direct if RLS allows (unlikely to allow full auth delete directly from client without service key)
    try {
      const resp = await authFetch('/api/delete-account', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: id })
      });
      if (resp.ok) {
         setUsers(users.filter(u => u.id !== id));
         addToast("Usuario eliminado correctamente.", "success");
      } else {
         addToast("Error al eliminar cuenta auth.", "error");
      }
    } catch (err: any) {
      addToast(`Error: ${err.message}`, "error");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-nexus-text flex items-center gap-2"><Users className="w-6 h-6 text-red-500" /> Gestión de Usuarios</h2>
      
      <div className="glass-panel rounded-3xl overflow-hidden border-red-900/20 bg-nexus-card/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-red-950/30 text-red-200/60 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Registro / Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-900/20">
              {users.map(user => {
                const displayName = user.username || user.real_name || user.name || 'Desconocido';
                return (
                <tr key={user.id} className="hover:bg-red-900/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-nexus-text flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 shadow-[0_0_10px_rgba(220,38,38,0.3)] flex items-center justify-center text-xs text-nexus-text overflow-hidden shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span>{displayName} {user.real_name && user.real_name !== user.username ? <span className="text-nexus-text-sec font-normal ml-1">({user.real_name})</span> : ''}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-nexus-text-sec">{user.email || 'Sin email'}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={user.role || 'user'} 
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className="bg-nexus-surface border border-red-900/30 rounded-lg px-2 py-1 text-xs focus:border-red-500 outline-none hover:bg-red-900/20 text-red-100"
                    >
                      <option value="user">Usuario</option>
                      <option value="developer">Desarrollador</option>
                      <option value="editor">Editor</option>
                      <option value="moderator">Moderador</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-nexus-text-sec text-xs">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </span>
                      <span className={`px-2.5 py-0.5 w-max rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        (user.status || 'active') === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {(user.status || 'active') === 'active' ? 'Activo' : 'Suspendido'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                         onClick={() => toggleStatus(user.id, user.status || 'active')}
                         className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all active:scale-95 ${
                           (user.status || 'active') === 'active' ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                         }`}
                       >
                         {(user.status || 'active') === 'active' ? 'Suspender' : 'Activar'}
                       </button>
                       <button 
                         onClick={() => deleteUser(user.id)}
                         className="text-xs px-3 py-1.5 rounded-lg border border-red-900/30 text-red-500 font-bold transition-all hover:bg-red-500 hover:text-white"
                         title="Eliminar usuario"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="p-8 text-center text-nexus-text-sec font-medium">
               {t('admin.noUsers')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
