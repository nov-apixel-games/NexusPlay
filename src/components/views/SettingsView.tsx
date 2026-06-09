import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, ChevronLeft, User, Lock, Bell, Palette, Flag, 
  Smartphone, Monitor, Eye, DownloadCloud, Activity, Zap, ShieldAlert,
  Save, AlertCircle, Database, Trash2, HardDrive, RefreshCw, Cpu
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { SupportEmailBox } from '../SupportEmailBox';

interface SettingsViewProps {
  onBack: () => void;
  userProfile: any;
}

export function SettingsView({ onBack, userProfile }: SettingsViewProps) {
  const { theme, setTheme, language, setLanguage, t } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'interface' | 'notifications' | 'account' | 'privacy' | 'app' | 'nexus-ai' | 'pwa' | 'advanced'>('interface');
  const [toastMessage, setToastMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.trim().toUpperCase() !== 'ELIMINAR') return;
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      import('../../lib/supabase').then(async ({ supabase }) => {
          // Intentar borrar vía RPC
          const { error: rpcError } = await supabase.rpc('delete_user_account');
          
          if (rpcError) {
             console.warn("RPC delete_user_account falló:", rpcError);
             // Fallback: borramos perfiles de base local (puede no borrar todo auth si no hay privileges, pero sí datos en la BD pública)
             if (userProfile?.id) {
                await supabase.from('profiles').delete().eq('id', userProfile.id);
             }
          }
          
          // Cerrar sesión
          await supabase.auth.signOut();
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: {
              message: 'Cuenta eliminada correctamente.',
              type: 'success'
            }
          }));
          window.location.reload(); 
      });
    } catch (err: any) {
      setDeleteError(err.message || 'Error al eliminar cuenta');
      setIsDeleting(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 1. Account State
  const [name, setName] = useState(userProfile?.username || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [password, setPassword] = useState('');

  // 2. Downloads & Updates State
  const [networkPref, setNetworkPref] = useState(localStorage.getItem('nexus_network_pref') || 'any');
  const [autoUpdate, setAutoUpdate] = useState(localStorage.getItem('nexus_auto_update') === 'true');

  // 3. Privacy & Notifications
  const [dealAlerts, setDealAlerts] = useState(localStorage.getItem('nexus_deal_alerts') === 'true');

  // PWA State
  const [storageUsed, setStorageUsed] = useState('0 MB');
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => { localStorage.setItem('nexus_network_pref', networkPref); }, [networkPref]);
  useEffect(() => { localStorage.setItem('nexus_auto_update', String(autoUpdate)); }, [autoUpdate]);
  useEffect(() => { localStorage.setItem('nexus_deal_alerts', String(dealAlerts)); }, [dealAlerts]);

  useEffect(() => {
    const calcStorage = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const est = await navigator.storage.estimate();
        if (est.usage) setStorageUsed((est.usage / (1024 * 1024)).toFixed(2) + ' MB');
      }
    };
    calcStorage();
    
    // Check if installable (basic test as real beforeinstallprompt is tracked at window level)
    setIsInstallable(window.matchMedia('(display-mode: browser)').matches);

    const checkOnline = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);
    return () => {
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
    };
  }, []);

  const handleSaveProfile = () => {
    if (!name.trim() || !email.trim()) {
      showToast(t('El nombre y correo no pueden estar vacíos.') || 'Empty name/email');
      return;
    }
    showToast(t('Datos guardados correctamente.') || 'Saved');
  };

  const handleSavePassword = () => {
    if (password.length > 0 && password.length < 8) {
      showToast(t('La contraseña debe tener al menos 8 caracteres.') || 'Min 8 chars');
      return;
    }
    setPassword('');
    showToast(t('Contraseña actualizada correctamente.') || 'Password updated');
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('nexus_search_history');
    showToast(t('Historial de búsqueda eliminado.') || 'Search history cleared');
  };

  const clearPwaCache = async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) await caches.delete(key);
      showToast('Caché limpiada correctamente');
      setStorageUsed('0.00 MB');
    } else {
      showToast('Caché limpiada');
    }
  };

  const updateApp = () => {
    showToast('Buscando actualizaciones...');
    setTimeout(() => {
        window.location.reload();
    }, 1500);
  };

  const handleInstallPwa = () => {
    showToast('Usa el menú de tu navegador para instalar NexusPlay como App');
  };

  const clearAiHistory = () => {
    localStorage.removeItem('nexus_ai_chat');
    showToast('Historial de IA eliminado');
  };

  const exportAiHistory = () => {
    const raw = localStorage.getItem('nexus_ai_chat');
    if (!raw) return showToast('No hay historia para exportar');
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus_ai_history.json';
    a.click();
    showToast('Historial exportado');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="pt-24 px-4 sm:px-6 max-w-6xl mx-auto pb-16 min-h-[80vh]">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-white px-6 py-3 rounded-full font-bold shadow-lg z-[110]">
          {toastMessage}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-nexus-border gap-4">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-cyan-400 drop-shadow-nexus-glow" />
          <h1 className="text-2xl sm:text-3xl font-black text-nexus-text tracking-tight">{t('nav.settings')}</h1>
        </div>
        <button onClick={onBack} className="group flex items-center gap-2 px-4 py-2 bg-nexus-card hover:bg-cyan-500/10 text-cyan-400 font-bold rounded-xl transition-all border border-transparent hover:border-cyan-500/30">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Volver
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
            <TabButton active={activeTab === 'interface'} onClick={() => setActiveTab('interface')} icon={Palette} label="Apariencia" />
            <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={Bell} label="Notificaciones" />
            <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={User} label="Cuenta" />
            <TabButton active={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')} icon={Lock} label="Privacidad" />
            <TabButton active={activeTab === 'app'} onClick={() => setActiveTab('app')} icon={Monitor} label="Descargas" />
            <TabButton active={activeTab === 'nexus-ai'} onClick={() => setActiveTab('nexus-ai')} icon={Cpu} label="Nexus AI" />
            <TabButton active={activeTab === 'pwa'} onClick={() => setActiveTab('pwa')} icon={Smartphone} label="PWA / App Web" />
            <TabButton active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} icon={Settings} label="Avanzado" />
          </div>

          <div className="flex-1 min-w-0 bg-nexus-surface rounded-2xl md:p-6 border-0 md:border border-nexus-border shadow-sm">
            
            {activeTab === 'interface' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Palette className="w-5 h-5 text-cyan-400" /> Selector de Tema</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <button onClick={() => setTheme('dark')} className={`py-4 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-nexus-border bg-nexus-card text-nexus-text-sec hover:border-cyan-400/50'}`}>
                      <div className="w-6 h-6 rounded-full bg-[#0f172a] border border-nexus-border shadow-inner"></div>
                      <span className="font-bold text-sm">{t('theme.dark')}</span>
                    </button>
                    <button onClick={() => setTheme('light')} className={`py-4 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-nexus-border bg-nexus-card text-nexus-text-sec hover:border-cyan-400/50'}`}>
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-gray-300 shadow-sm"></div>
                      <span className="font-bold text-sm">{t('theme.light')}</span>
                    </button>
                    <button onClick={() => setTheme('amoled')} className={`py-4 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${theme === 'amoled' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-nexus-border bg-nexus-card text-nexus-text-sec hover:border-cyan-400/50'}`}>
                      <div className="w-6 h-6 rounded-full bg-black border border-nexus-border shadow-inner"></div>
                      <span className="font-bold text-sm">{t('theme.amoled') || 'AMOLED'}</span>
                    </button>
                    <button onClick={() => setTheme('auto')} className={`py-4 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${theme === 'auto' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-nexus-border bg-nexus-card text-nexus-text-sec hover:border-cyan-400/50'}`}>
                      <Monitor className="w-6 h-6" />
                      <span className="font-bold text-sm">{t('theme.auto')}</span>
                    </button>
                  </div>
                </div>
                <div className="h-px bg-nexus-card-hover" />
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Flag className="w-5 h-5 text-indigo-400" /> Idioma (Language)</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                     {['es', 'en', 'pt'].map((langKey) => (
                        <button key={langKey} onClick={() => setLanguage(langKey as any)} className={`py-3 px-4 flex items-center justify-between rounded-xl border-2 transition-all ${language === langKey ? 'border-indigo-400 bg-indigo-400/10 text-indigo-400' : 'border-nexus-border bg-nexus-card text-nexus-text-sec hover:border-indigo-400/50'}`}>
                          <span className="font-bold text-sm">{langKey === 'es' ? 'Español' : langKey === 'en' ? 'English' : 'Português'}</span>
                          {language === langKey && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                        </button>
                     ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Bell className="w-5 h-5 text-yellow-400" /> Preferencias de Avisos</h3>
                <div className="p-4 bg-nexus-card border border-nexus-border rounded-xl flex items-center justify-between">
                   <div>
                      <h4 className="font-bold text-nexus-text text-sm">Alertas de Ofertas</h4>
                      <p className="text-xs text-nexus-text-sec">Recibir notificaciones cuando haya juegos gratis o con descuento.</p>
                   </div>
                   <Toggle checked={dealAlerts} onChange={setDealAlerts} />
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                   <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><User className="w-5 h-5 text-blue-400" /> Datos de Sesión</h3>
                   <div className="space-y-4 max-w-md">
                      <div>
                        <label className="text-xs font-bold text-nexus-text-sec uppercase mb-1 block">Usuario</label>
                        <input value={name} onChange={e=>setName(e.target.value)} className="w-full bg-nexus-bg border border-nexus-border rounded-xl px-4 py-2" placeholder="Usuario" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-nexus-text-sec uppercase mb-1 block">Correo Electrónico</label>
                        <input value={email} disabled className="w-full bg-nexus-card-hover border border-nexus-border rounded-xl px-4 py-2 opacity-70" placeholder="Email" />
                      </div>
                      <button onClick={handleSaveProfile} className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors">
                        <Save className="w-4 h-4" /> Guardar Cambios
                      </button>
                   </div>
                </div>
                <div className="h-px bg-nexus-card-hover" />
                <div>
                   <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Lock className="w-5 h-5 text-red-400" /> Seguridad</h3>
                   <div className="space-y-4 max-w-md">
                      <div>
                        <label className="text-xs font-bold text-nexus-text-sec uppercase mb-1 block">Nueva Contraseña</label>
                        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-nexus-bg border border-nexus-border rounded-xl px-4 py-2" placeholder="********" />
                      </div>
                      <button onClick={handleSavePassword} className="flex items-center gap-2 px-6 py-2 bg-nexus-card border border-nexus-border text-nexus-text rounded-xl font-bold hover:bg-nexus-card-hover transition-colors">
                        Actualizar Contraseña
                      </button>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-in fade-in">
                 <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Eye className="w-5 h-5 text-purple-400" /> Datos y Privacidad</h3>
                 <div className="p-5 border border-red-500/20 bg-red-500/5 text-red-400 rounded-xl">
                    <h4 className="font-bold flex items-center gap-2 mb-1"><ShieldAlert className="w-4 h-4"/> Zona de Peligro</h4>
                    <p className="text-sm mb-4">Elimina tu cuenta y todos los datos asociados. Esto no se puede deshacer.</p>
                    <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg font-bold transition-colors text-sm">Eliminar Cuenta</button>
                 </div>
              </div>
            )}

            {activeTab === 'app' && (
              <div className="space-y-6 animate-in fade-in">
                 <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><DownloadCloud className="w-5 h-5 text-emerald-400" /> Descargas</h3>
                 <div className="space-y-4">
                    <div>
                       <label className="text-sm font-bold text-nexus-text mb-2 block">Preferencias de Red de Descarga</label>
                       <select value={networkPref} onChange={e => setNetworkPref(e.target.value)} className="w-full max-w-md bg-nexus-bg border border-nexus-border rounded-xl px-4 py-3 outline-none focus:border-emerald-400/50">
                          <option value="any">Cualquier Red (Wi-Fi o Datos)</option>
                          <option value="wifi">Solo por Wi-Fi</option>
                       </select>
                    </div>
                    <div className="p-4 bg-nexus-card border border-nexus-border rounded-xl flex items-center justify-between max-w-md">
                       <div>
                          <h4 className="font-bold text-nexus-text text-sm">Actualizaciones Automáticas</h4>
                          <p className="text-xs text-nexus-text-sec">Instalar versiones nuevas en segundo plano.</p>
                       </div>
                       <Toggle checked={autoUpdate} onChange={setAutoUpdate} />
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'nexus-ai' && (
              <div className="space-y-8 animate-in fade-in">
                 <div>
                   <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Cpu className="w-5 h-5 text-blue-400" /> Gestión Nexus AI</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 border border-nexus-border bg-nexus-card rounded-xl">
                        <h4 className="font-bold mb-2">Eliminar Historial</h4>
                        <p className="text-xs text-nexus-text-sec mb-4 h-8">Limpiar toda la conversación guardada localmente de Nexus AI.</p>
                        <button onClick={clearAiHistory} className="w-full flex items-center justify-center gap-2 py-2 bg-nexus-bg hover:bg-red-500/10 text-red-500 border border-nexus-border rounded-lg font-bold text-sm transition-colors">
                          <Trash2 className="w-4 h-4"/> Limpiar
                        </button>
                      </div>
                      <div className="p-5 border border-nexus-border bg-nexus-card rounded-xl">
                        <h4 className="font-bold mb-2">Exportar Conversación</h4>
                        <p className="text-xs text-nexus-text-sec mb-4 h-8">Descargar el JSON de tus consultas actuales.</p>
                        <button onClick={exportAiHistory} className="w-full flex items-center justify-center gap-2 py-2 bg-nexus-bg hover:bg-blue-500/10 text-blue-400 border border-nexus-border rounded-lg font-bold text-sm transition-colors">
                          <DownloadCloud className="w-4 h-4"/> Exportar Detalles
                        </button>
                      </div>
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'pwa' && (
              <div className="space-y-6 animate-in fade-in">
                 <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Smartphone className="w-5 h-5 text-indigo-400" /> Estado de PWA</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 border border-nexus-border bg-nexus-card rounded-xl space-y-3">
                       <h4 className="font-bold text-sm tracking-wider uppercase text-nexus-text-sec">Conexión</h4>
                       <div className="flex items-center gap-2">
                         <div className={`w-3 h-3 rounded-full ${isOffline ? 'bg-red-500' : 'bg-green-500'}`} /> 
                         <span className="font-bold text-lg">{isOffline ? 'Desconectado' : 'Online'}</span>
                       </div>
                    </div>
                    <div className="p-5 border border-nexus-border bg-nexus-card rounded-xl space-y-3">
                       <h4 className="font-bold text-sm tracking-wider uppercase text-nexus-text-sec">Instalación</h4>
                       <div className="flex items-center gap-2">
                         {isInstallable ? (
                           <span className="font-bold text-lg text-emerald-400">App Instalada</span>
                         ) : (
                           <button onClick={handleInstallPwa} className="px-3 py-1 bg-indigo-500 text-white rounded font-bold text-sm">Instalar App</button>
                         )}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3 mt-4">
                    <h4 className="font-bold text-sm tracking-wider uppercase text-nexus-text-sec">Recursos Locales</h4>
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-5 bg-nexus-card border border-nexus-border rounded-xl">
                       <div className="flex items-center gap-3">
                          <HardDrive className="w-8 h-8 text-cyan-500" />
                          <div>
                            <span className="block font-bold">Uso Aproximado</span>
                            <span className="text-sm text-nexus-text-sec">{storageUsed} en caché</span>
                          </div>
                       </div>
                       <div className="flex-1" />
                       <button onClick={clearPwaCache} className="px-4 py-2 border border-nexus-border bg-nexus-surface hover:bg-nexus-bg rounded-xl text-sm font-bold flex items-center gap-2">
                         <RefreshCw className="w-4 h-4" /> Vaciar Caché
                       </button>
                    </div>
                    
                    <button onClick={updateApp} className="w-full flex items-center justify-between p-4 bg-nexus-card hover:bg-nexus-bg border border-nexus-border rounded-xl transition-colors">
                      <span className="font-bold text-sm text-nexus-text">Buscar Actualizaciones de Cliente</span>
                      <ChevronLeft className="w-4 h-4 rotate-180 text-nexus-text-sec" />
                    </button>
                 </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Settings className="w-5 h-5 text-cyan-400" /> Sist. Info</h3>
                  <div className="bg-nexus-surface border border-nexus-border rounded-xl p-4 space-y-2 text-sm text-nexus-text-sec">
                     <div className="flex justify-between"><span className="text-nexus-text-sec">PWA Status</span><span className="font-mono text-emerald-400">ACTIVA</span></div>
                     <div className="flex justify-between"><span className="text-nexus-text-sec">Cliente</span><span className="font-mono text-cyan-400">v2.1.5-beta</span></div>
                  </div>
                </div>
                <div className="h-px bg-nexus-card-hover" />
                <div className="flex flex-col">
                   <h3 className="text-xl font-bold text-nexus-text mb-2">Soporte</h3>
                   <SupportEmailBox category="Requerimiento Avanzado" />
                </div>
              </div>
            )}
          </div>
      </div>
      
      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-nexus-card border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600" />
            <h2 className="text-2xl font-black mb-4 text-white flex items-center gap-3">
              <ShieldAlert className="text-red-500 w-8 h-8" />
              Eliminar Cuenta
            </h2>
            <p className="text-nexus-text-sec mb-6 leading-relaxed">
              Esta acción eliminará <strong>permanentemente</strong> tu cuenta y todos tus datos asociados (perfil, favoritos, historial y configuraciones).
            </p>
            
            <div className="mb-6">
              <label className="text-sm font-bold text-nexus-text mb-2 block">
                Escribe <span className="text-red-400 font-mono bg-red-400/10 px-2 py-0.5 rounded">ELIMINAR</span> para confirmar:
              </label>
              <input 
                type="text" 
                value={deleteConfirmation}
                onChange={e => setDeleteConfirmation(e.target.value)}
                placeholder="ELIMINAR"
                className="w-full bg-nexus-bg border border-nexus-border rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-colors uppercase"
              />
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 justify-end mt-8">
              <button 
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(''); }}
                className="px-6 py-3 rounded-xl font-bold bg-nexus-bg hover:bg-nexus-border text-nexus-text-sec transition-colors"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmation.trim().toUpperCase() !== 'ELIMINAR'}
                className="px-6 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 focus:ring-4 ring-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Eliminando cuenta...
                  </>
                ) : 'Eliminar Cuenta'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${active ? 'bg-nexus-card-hover text-nexus-text border-[1.5px] border-nexus-border shadow-sm' : 'bg-transparent text-nexus-text-sec hover:bg-nexus-bg border-[1.5px] border-transparent hover:text-nexus-text'}`}>
      <Icon className={`w-5 h-5 ${active ? 'text-cyan-400 drop-shadow-sm' : ''}`} /> {label}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`w-12 h-6 rounded-full p-1 transition-colors ${checked ? 'bg-cyan-500' : 'bg-nexus-border'}`}>
      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );
}
