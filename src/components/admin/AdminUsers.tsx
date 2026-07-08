import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Users, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminUsersProps {
  users: any[];
  setUsers: (users: any[]) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function AdminUsers({ users, setUsers, addToast }: AdminUsersProps) {
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
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
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
      <h2 className="text-2xl font-black text-nexus-text flex items-center gap-2">
        <Users className="w-6 h-6 text-red-500" /> Gestión de Usuarios
      </h2>
      
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
                        <span>
                          {displayName} {user.real_name && user.real_name !== user.username ? <span className="text-nexus-text-sec font-normal ml-1">({user.real_name})</span> : ''}
                        </span>
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
                );
              })}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="p-8 text-center text-nexus-text-sec font-medium">
               {t('admin.noUsers') || 'No hay usuarios registrados'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
