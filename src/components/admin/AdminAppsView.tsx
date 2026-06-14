import { useState } from 'react';
import { Smartphone, Check, X, Star, Trash2, Edit, Loader2 } from 'lucide-react';
import { AppItem } from '../../types';
import { supabase } from '../../lib/supabase';
import { deleteFromCloudinary } from '../../lib/cloudinary';

export function AdminAppsList({ apps, setApps, addToast }: { apps: AppItem[], setApps: (updater: AppItem[] | ((prev: AppItem[]) => AppItem[])) => void, addToast: any }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const toggleHighlight = async (id: string) => {
    const app = apps.find(a => a.id === id);
    if (!app) return;
    
    const { error } = await supabase.from('apps').update({ featured: !app.featured }).eq('id', id);
    if (error) {
      addToast('Error al modificar estado.', 'error');
      return;
    }
    setApps(apps.map(a => a.id === id ? { ...a, featured: !a.featured } : a));
    addToast('Estado de destacado modificado.', 'success');
  };

  const deleteApp = async (id: string) => {
    // REGLA DE ORO DE DEBUGGING
;
    
    const app = apps.find(a => a.id === id);
    if (!app) {
      console.error(">>> [ELIMINAR] ERROR: App no encontrada en el array de apps.");
      addToast('Error: Aplicación no encontrada.', 'error');
      return;
    }

;

    // Confirmación nativa (si falla en el iframe, lo sabremos)
    const confirmText = `¿Seguro que quieres eliminar "${app.name}"?\n\nESTO BORRARÁ TODO (Base de datos y Cloudinary).`;
    
    try {
      if (!window.confirm(confirmText)) {
;
        return;
      }
    } catch (confirmErr) {
      console.warn(">>> [ELIMINAR] El navegador bloqueó window.confirm, procediendo de todos modos por seguridad de acción.");
    }

;
    setIsDeleting(id);

    try {
      // 1. CLOUDINARY
;
      if (app.iconPublicId) {
;
        const success = await deleteFromCloudinary(app.iconPublicId);
        if (!success) throw new Error(`Fallo al borrar icono: ${app.iconPublicId}`);
      }

      if (app.screenshotsPublicIds && app.screenshotsPublicIds.length > 0) {
;
        for (const pid of app.screenshotsPublicIds) {
          const success = await deleteFromCloudinary(pid);
          if (!success) throw new Error(`Fallo al borrar screenshot: ${pid}`);
        }
      }
;

      // 2. SUPABASE
;
      const { error: dbError } = await supabase
        .from('apps')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error(">>> [ELIMINAR] Error Supabase:", dbError);
        throw new Error(`Error en Base de Datos: ${dbError.message} (${dbError.code})`);
      }
;

      // 3. ACTUALIZAR UI
;
      setApps(prev => prev.filter(a => a.id !== id));
      addToast(`La aplicación "${app.name}" fue eliminada.`, 'success');
;
    } catch (error: any) {
      console.error(">>> [ELIMINAR] FALLO CRÍTICO:", error);
      addToast(error.message || 'Error al eliminar.', 'error');
      alert("ERROR AL ELIMINAR: " + (error.message || "Desconocido"));
    } finally {
      setIsDeleting(null);
    }
  };

  const updateStatus = async (id: string, status: 'published' | 'rejected') => {
    const { error } = await supabase.from('apps').update({ status }).eq('id', id);
    if (error) {
       addToast('Error al actualizar estado.', 'error');
       return;
    }
    setApps(apps.map(a => a.id === id ? { ...a, status } : a));
    addToast(`App ${status === 'published' ? 'publicada' : 'rechazada'}.`, status === 'published' ? 'success' : 'error');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-nexus-text flex items-center gap-2">
        <Smartphone className="w-6 h-6 text-red-500" /> Gestión de Apps
      </h2>
      
      <div className="glass-panel rounded-3xl overflow-hidden border-red-900/20 bg-nexus-card/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-red-950/30 text-red-200/60 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Aplicación</th>
                <th className="px-6 py-4">Desarrollador</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Destacada</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-900/20 text-red-50">
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-red-900/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={app.icon} alt="" className="w-10 h-10 rounded-lg object-cover bg-red-900/20 border border-red-900/20" referrerPolicy="no-referrer" />
                      <div>
                        <div className="font-bold text-nexus-text">{app.name}</div>
                        <div className="text-xs text-red-200/50">{app.category} • {app.downloads}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-red-200/70 font-medium">{app.developer}</td>
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
                      className={`p-2 rounded-xl transition-colors ${app.featured ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-600 hover:bg-nexus-card hover:text-nexus-text'}`}
                      title="Destacar App"
                    >
                      <Star className={`w-4 h-4 ${app.featured ? 'fill-yellow-400' : ''}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {app.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(app.id, 'published')} className="p-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 shadow-sm"><Check className="w-4 h-4" /></button>
                          <button onClick={() => updateStatus(app.id, 'rejected')} className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-sm"><X className="w-4 h-4" /></button>
                        </>
                      )}
                      <button className="p-2 rounded-xl bg-red-950/30 border border-red-900/20 text-red-200 hover:bg-red-900/30 hover:text-nexus-text transition-colors"><Edit className="w-4 h-4" /></button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          alert("CLICK FUNCIONA");
;
                          deleteApp(app.id);
                        }}
                        disabled={isDeleting === app.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-nexus-text hover:bg-black font-black uppercase text-xs transition-all active:scale-95 shadow-lg disabled:opacity-50 border-2 border-nexus-border"
                      >
                        {isDeleting === app.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            <span>Eliminar</span>
                          </>
                        )}
                      </button>
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
