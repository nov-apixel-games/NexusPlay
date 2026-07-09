import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  Smartphone, Search, Star, Download, Eye, EyeOff, Edit, Trash2, AlertTriangle, XCircle 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { deleteFromCloudinary, deleteFolderFromCloudinary } from '../../lib/cloudinary';
import { AppItem } from '../../types';

interface AdminAppsProps {
  apps: AppItem[];
  setApps: any;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  addLog?: (action: string, entity: string, details: string, status: 'success' | 'error' | 'info') => void;
}

export default function AdminApps({ apps, setApps, addToast, addLog }: AdminAppsProps) {
  const { t } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredAppsList = useMemo(() => {
    const term = debouncedSearchQuery.trim().toLowerCase();
    if (!term) return apps;
    const len = apps.length;
    const result: AppItem[] = [];
    for (let i = 0; i < len; i++) {
      const app = apps[i];
      if (
        app.name.toLowerCase().includes(term) ||
        app.id.toLowerCase().includes(term) ||
        (app.developer && app.developer.toLowerCase().includes(term))
      ) {
        result.push(app);
      }
    }
    return result;
  }, [apps, debouncedSearchQuery]);
  const [appToDelete, setAppToDelete] = useState<AppItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const logMessage = (action: string, entity: string, details: string, status: 'success' | 'error' | 'info') => {
    if (addLog) {
      addLog(action, entity, details, status);
    } else {
      console.log(`[LOG] [${action}] [${entity}] ${details} (${status})`);
    }
  };

  const handleAppStatus = async (id: string, status: 'published' | 'rejected') => {
    const { error } = await supabase.from('apps').update({ status }).eq('id', id);
    if (!error) {
      logMessage('ESTADO APP', id, `Estado cambiado a ${status}`, 'success');
      addToast(`Estado de la aplicación cambiado a ${status}`, 'success');
      setApps((prev: AppItem[]) => prev.map(a => a.id === id ? { ...a, status } : a));
    } else {
      logMessage('ESTADO APP', id, `Error: ${error.message}`, 'error');
      addToast(`Error al cambiar estado: ${error.message}`, 'error');
    }
  };

  const toggleFeatured = async (app: AppItem) => {
    const newFeatured = !app.featured;
    const { error } = await supabase.from('apps').update({ featured: newFeatured }).eq('id', app.id);
    if (error) {
       logMessage('DESTACAR APP', app.name, `Error: ${error.message}`, 'error');
       addToast(`Error al cambiar destacado: ${error.message}`, 'error');
    } else {
       logMessage('DESTACAR APP', app.name, `App marcada como featured=${newFeatured}`, 'success');
       addToast(newFeatured ? 'Aplicación destacada correctamente' : 'Destacado removido correctamente', 'success');
       setApps((prev: AppItem[]) => prev.map(a => a.id === app.id ? { ...a, featured: newFeatured } : a));
    }
  };

  const handleAppDeleteConfirm = async () => {
    if (!appToDelete) return;
    
    setIsDeleting(true);
    setDeleteError('');
    logMessage('ELIMINAR APP', appToDelete.name, `Iniciada secuencia de purga profunda...`, 'info');

    try {
      // Intentamos borrar la carpeta entera de Cloudinary generada para esta app
      let clFolder = true;
      const folderName = appToDelete.name.trim() || appToDelete.developer?.trim() || 'unknown_app';
      clFolder = await deleteFolderFromCloudinary(folderName);

      // Por si acaso, intentamos borrar los IDs individuales también para asegurar que no queden rastros antiguos
      let clIcon = true;
      if (appToDelete.iconPublicId) {
         clIcon = await deleteFromCloudinary(appToDelete.iconPublicId);
      }
      let clScreens = true;
      for (const pid of (appToDelete.screenshotsPublicIds || [])) {
         const sr = await deleteFromCloudinary(pid);
         if (!sr) clScreens = false;
      }

      const { error } = await supabase.from('apps').delete().eq('id', appToDelete.id);
      
      if (error) {
         throw new Error(`Fallo en BD: ${error.message}`);
      }

      logMessage('ELIMINAR APP', appToDelete.name, `Purgada. Cloudinary Icon: ${clIcon} Screens: ${clScreens}`, 'success');
      addToast(`Aplicación "${appToDelete.name}" eliminada correctamente`, 'success');

      setApps((prev: AppItem[]) => prev.filter(a => a.id !== appToDelete.id));
      setAppToDelete(null);
    } catch (e: any) {
      setDeleteError(e.message);
      logMessage('ELIMINAR APP', appToDelete.name, `Crash Crítico: ${e.message}`, 'error');
      addToast(`Fallo al purgar la app: ${e.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in w-full">
      {/* Modal PURGAR */}
      {appToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-nexus-bg/80 backdrop-blur-sm" onClick={() => !isDeleting && setAppToDelete(null)} />
          <div className="relative bg-nexus-card border border-red-500/30 p-8 rounded-3xl max-w-lg w-full shadow-[0_0_50px_rgba(220,38,38,0.2)] animate-fade-in z-50">
             <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-950/40 rounded-full flex items-center justify-center border border-red-900/50 shadow-[0_0_30px_rgba(220,38,38,0.4)]">
                   <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
             </div>
             <h3 className="text-2xl font-black text-center text-nexus-text mb-2 uppercase tracking-tighter">{t("admin.confirmPurge") || "Confirmar Purga"}</h3>
             <p className="text-nexus-text-sec text-center mb-6">¿Estás absolutamente seguro de que deseas obliterar la aplicación <span className="text-red-400 font-bold">"{appToDelete.name}"</span>? Esta acción es irreversible, eliminará los archivos binarios de visualización (Cloudinary) y borrará los registros cruzados en la base de datos maestra (Supabase).</p>
             
             {deleteError && (
               <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl mb-6 flex items-start gap-3">
                 <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                 <p className="text-red-300 text-sm font-mono break-words">{deleteError}</p>
               </div>
             )}

             <div className="flex gap-4">
                <button 
                  onClick={() => setAppToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl border border-nexus-border hover:bg-nexus-card font-bold text-nexus-text transition-colors disabled:opacity-50"
                >{t("admin.cancel") || "Cancelar"}</button>
                <button 
                  onClick={handleAppDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-nexus-text font-black shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  type="button" 
                >
                  {isDeleting ? <div className="w-5 h-5 border-2 border-nexus-border border-t-white rounded-full animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  {isDeleting ? (t('admin.purging') || 'Purgando...') : (t('admin.purgeApp') || 'PURGAR APP')}
                </button>
             </div>
          </div>
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 w-full lg:max-w-none">
        <div>
          <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-nexus-text">{t("admin.dirEntity") || "Directorio de Entidades"}</h3>
          <p className="text-red-400 text-sm md:text-base">{t("admin.controlMaster") || "Control maestro de software publicadas."}</p>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <input 
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder={t("admin.searchId") || "Identificador ID o Nombre..."}
            className="w-full bg-nexus-surface border border-red-900/30 text-nexus-text rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500 text-sm md:text-base"
          />
          <Search className="w-4 h-4 text-nexus-text-sec absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
      </header>

      <div className="space-y-4 w-full">
        {filteredAppsList.length === 0 && <p className="text-nexus-text-sec bg-nexus-surface/40 p-10 rounded-3xl border border-red-500/10 text-center">{t("admin.noResults") || "Sin resultados."}</p>}
        {filteredAppsList.map(app => (
          <div key={app.id} className={`bg-nexus-card/40 border ${app.featured ? 'border-amber-500/30' : 'border-red-500/10'} p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-red-500/30 transition-colors shadow-lg backdrop-blur-sm`}>
             <div className="flex items-center gap-5">
               <img src={app.icon} alt={app.name} className="w-16 h-16 rounded-2xl object-cover bg-nexus-bg border border-nexus-border shadow-md" referrerPolicy="no-referrer" />
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <h4 className="font-bold text-nexus-text text-lg leading-tight">{app.name}</h4>
                   {app.featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                 </div>
                 <p className="text-sm text-nexus-text-sec">{app.developer} <span className="mx-2 text-red-900/50">|</span> <span className={`font-bold ${app.status === 'pending' ? 'text-orange-500' : app.status === 'published' ? 'text-green-500' : 'text-red-500'}`}>{app.status.toUpperCase()}</span> <span className="mx-2 text-red-900/50">|</span> <Download className="w-3 h-3 inline mr-1" /> {app.downloads || 0}</p>
                 <p className="text-xs text-gray-600 mt-1 font-mono">ID: {app.id} • Creada: {app.date ? new Date(app.date).toLocaleDateString() : 'Desconocida'}</p>
               </div>
             </div>
             
             <div className="flex flex-wrap gap-2 shrink-0">
               {app.status === 'pending' && (
                 <>
                   <button onClick={() => handleAppStatus(app.id, 'published')} className="bg-green-950/30 border border-green-900/30 text-green-500 hover:bg-green-600 hover:text-nexus-text px-4 py-2 rounded-xl text-xs font-bold transition-all">{t("admin.approve") || "Aprobar"}</button>
                   <button onClick={() => handleAppStatus(app.id, 'rejected')} className="bg-orange-950/30 border border-orange-900/30 text-orange-500 hover:bg-orange-600 hover:text-nexus-text px-4 py-2 rounded-xl text-xs font-bold transition-all">{t("admin.reject") || "Rechazar"}</button>
                 </>
               )}
               {app.status === 'published' && (
                 <>
                   <button onClick={() => handleAppStatus(app.id, 'rejected')} className="bg-nexus-card text-nexus-text-sec border border-nexus-border hover:bg-nexus-card-hover hover:text-nexus-text px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1">
                     <EyeOff className="w-3 h-3" /> {t("admin.hide") || "Ocultar"}
                   </button>
                   <button onClick={() => toggleFeatured(app)} className={`${app.featured ? 'bg-amber-900/20 text-amber-500 border-amber-900/30 hover:bg-amber-900 hover:text-nexus-text' : 'bg-nexus-card text-amber-500/70 border-nexus-border hover:bg-amber-900/20 hover:text-amber-500'} border px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1`}>
                      <Star className="w-3 h-3" /> {app.featured ? (t('admin.norm') || 'Normalizar') : (t('admin.feat') || 'Destacar')}
                   </button>
                 </>
               )}
               <a href={`/app/${app.id}`} target="_blank" rel="noreferrer" className="bg-blue-950/30 border border-blue-900/30 text-blue-500 hover:bg-blue-600 hover:text-nexus-text px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {t("admin.view") || "Ver"}
               </a>
               <button onClick={() => alert("Función " + (t("admin.edit") || "Editar") + " en desarrollo")} className="bg-gray-950/30 border border-gray-900/30 text-nexus-text-sec hover:bg-gray-700 hover:text-nexus-text px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1">
                   <Edit className="w-3 h-3" /> Editar
                </button>
                <button onClick={() => setAppToDelete(app)} className="bg-red-950/30 border border-red-900/30 text-red-500 hover:bg-red-600 hover:text-nexus-text px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 group">
                 <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Purgar
               </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
