import { useState } from 'react';
import { Smartphone, Check, X, Star, Trash2, Edit } from 'lucide-react';
import { AppItem } from '../../types';

export function AdminAppsList({ apps, setApps, addToast }: { apps: AppItem[], setApps: (a: AppItem[]) => void, addToast: any }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggleHighlight = (id: string) => {
    setApps(apps.map(a => a.id === id ? { ...a, isHighlighted: !a.isHighlighted } : a));
    addToast('Estado de destacado modificado.', 'success');
  };

  const deleteApp = (id: string) => {
    if(confirm("¿Seguro que deseas eliminar esta app?")) {
      setApps(apps.filter(a => a.id !== id));
      addToast('App eliminada.', 'info');
    }
  };

  const updateStatus = (id: string, status: 'published' | 'rejected') => {
    setApps(apps.map(a => a.id === id ? { ...a, status } : a));
    addToast(`App ${status === 'published' ? 'publicada' : 'rechazada'}.`, status === 'published' ? 'success' : 'error');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white flex items-center gap-2"><Smartphone className="w-6 h-6 text-cyan-400" /> Gestión de Apps</h2>
      
      <div className="glass-panel rounded-3xl overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-400 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Aplicación</th>
                <th className="px-6 py-4">Desarrollador</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Destacada</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={app.icon} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/10" referrerPolicy="no-referrer" />
                      <div>
                        <div className="font-bold text-white">{app.name}</div>
                        <div className="text-xs text-gray-500">{app.category} • {app.downloads}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-medium">{app.developer}</td>
                  <td className="px-6 py-4">
                    {app.status === 'pending' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Pendiente</span>
                    ) : app.status === 'rejected' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">Rechazada</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">Publicada</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleHighlight(app.id)}
                      className={`p-2 rounded-xl transition-colors ${app.isHighlighted ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-600 hover:bg-white/5 hover:text-white'}`}
                      title="Destacar App"
                    >
                      <Star className={`w-4 h-4 ${app.isHighlighted ? 'fill-yellow-400' : ''}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {app.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(app.id, 'published')} className="p-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20"><Check className="w-4 h-4" /></button>
                          <button onClick={() => updateStatus(app.id, 'rejected')} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"><X className="w-4 h-4" /></button>
                        </>
                      )}
                      <button className="p-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => deleteApp(app.id)} className="p-2 rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></button>
                    </div>
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
