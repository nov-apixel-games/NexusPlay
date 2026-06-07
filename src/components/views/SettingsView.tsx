import React, { useState, useEffect } from 'react';
import { User, Lock, CreditCard, Wifi, RefreshCw, Trash2, Bell, Palette, Globe, ChevronLeft, Save, Settings, Monitor, Download, Smartphone, Cpu, Gamepad2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { SupportEmailBox } from '../SupportEmailBox';
import { useAppStore } from '../../store/useAppStore';

interface SettingsViewProps {
  onBack: () => void;
  userProfile: any;
}

export function SettingsView({ onBack, userProfile }: SettingsViewProps) {
  const { theme, setTheme, language, setLanguage, t } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'interface' | 'notifications' | 'account' | 'privacy' | 'app' | 'games-hub' | 'nexus-ai' | 'pwa' | 'advanced'>('interface');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 1. Account State
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState(userProfile?.username || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [password, setPassword] = useState('');

  // 2. Downloads & Updates State
  const [networkPref, setNetworkPref] = useState(localStorage.getItem('nexus_network_pref') || 'any');
  const [autoUpdate, setAutoUpdate] = useState(localStorage.getItem('nexus_auto_update') === 'true');

  // 3. Privacy & Notifications State
  const [dealAlerts, setDealAlerts] = useState(localStorage.getItem('nexus_deal_alerts') === 'true');

  useEffect(() => {
    localStorage.setItem('nexus_network_pref', networkPref);
  }, [networkPref]);

  useEffect(() => {
    localStorage.setItem('nexus_auto_update', String(autoUpdate));
  }, [autoUpdate]);

  useEffect(() => {
    localStorage.setItem('nexus_deal_alerts', String(dealAlerts));
  }, [dealAlerts]);

  const handleSaveProfile = () => {
    if (!name.trim() || !email.trim()) {
      showToast('El nombre y correo no pueden estar vacíos.');
      return;
    }
    showToast('Datos de perfil guardados correctamente.');
  };

  const handleSavePassword = () => {
    if (password.length > 0 && password.length < 8) {
      showToast('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setPassword('');
    showToast('Contraseña actualizada correctamente.');
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('nexus_search_history');
    showToast('Historial de búsqueda eliminado.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="pt-24 px-4 sm:px-6 max-w-6xl mx-auto pb-16 min-h-[80vh]">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-nexus-bg px-6 py-3 rounded-full font-bold shadow-lg z-[110]">
          {toastMessage}
        </div>
      )}
      
      {/* Header */}
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
            <TabButton active={activeTab === 'app'} onClick={() => setActiveTab('app')} icon={Monitor} label="Aplicación" />
            <TabButton active={activeTab === 'games-hub'} onClick={() => setActiveTab('games-hub')} icon={Gamepad2} label="Games Hub" />
            <TabButton active={activeTab === 'nexus-ai'} onClick={() => setActiveTab('nexus-ai')} icon={Cpu} label="Nexus AI" />
            <TabButton active={activeTab === 'pwa'} onClick={() => setActiveTab('pwa')} icon={Smartphone} label="PWA / App" />
            <TabButton active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} icon={Settings} label="Avanzado y Soporte" />
          </div>

          <div className="flex-1 glass-panel border border-nexus-border rounded-3xl p-6 md:p-8 min-h-[600px]">
            {activeTab === 'account' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><User className="w-5 h-5 text-cyan-400" /> Editar Perfil</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col items-start gap-2">
                       <label className="block text-sm text-nexus-text-sec">Foto de Perfil</label>
                       <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center overflow-hidden">
                             {photo ? <img src={photo} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-cyan-400" />}
                          </div>
                          <label className="bg-nexus-card-hover hover:bg-nexus-card text-nexus-text font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors text-sm">
                             Cambiar Foto
                             <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                               if (e.target.files?.[0]) {
                                 setPhoto(URL.createObjectURL(e.target.files[0]));
                                 showToast('Foto cargada (simulada).');
                               }
                             }} />
                          </label>
                       </div>
                    </div>
                    <div>
                      <label className="block text-sm text-nexus-text-sec mb-1">Nombre</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-3 text-nexus-text focus:border-cyan-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-nexus-text-sec mb-1">Correo Electrónico</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-3 text-nexus-text focus:border-cyan-400 focus:outline-none" />
                    </div>
                    <button onClick={handleSaveProfile} className="bg-cyan-500 hover:bg-cyan-400 text-nexus-bg font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors">
                      <Save className="w-5 h-5" /> Guardar Perfil
                    </button>
                  </div>
                </div>
                <div className="h-px bg-nexus-surface-hover" />
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Lock className="w-5 h-5 text-cyan-400" /> Seguridad</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-nexus-text-sec mb-1">Nueva Contraseña (mín. 8 caracteres)</label>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-3 text-nexus-text focus:border-cyan-400 focus:outline-none" />
                    </div>
                    <button onClick={handleSavePassword} className="bg-nexus-surface-hover hover:bg-nexus-card text-nexus-text font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors">
                      <Lock className="w-5 h-5" /> Cambiar Contraseña
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'app' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Wifi className="w-5 h-5 text-cyan-400" /> Preferencia de Red</h3>
                  <p className="text-nexus-text-sec text-sm mb-4">Elige sobre qué red prefieres descargar e instalar contenido de las apps.</p>
                  <select value={networkPref} onChange={(e) => setNetworkPref(e.target.value)} className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-3 text-nexus-text focus:border-cyan-400 focus:outline-none">
                    <option value="any">Cualquier red</option>
                    <option value="wifi">Solo Wi-Fi</option>
                  </select>
                </div>
                <div className="h-px bg-nexus-surface-hover" />
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><RefreshCw className="w-5 h-5 text-cyan-400" /> Actualización Automática</h3>
                  <div className="flex items-center justify-between p-4 bg-nexus-card border border-nexus-border rounded-xl">
                    <div>
                      <h4 className="font-bold text-nexus-text">Mantener aplicaciones actualizadas</h4>
                      <p className="text-sm text-nexus-text-sec">Descarga e instala actualizaciones automáticamente en segundo plano.</p>
                    </div>
                    <ToggleSwitch isOn={autoUpdate} onToggle={() => setAutoUpdate(!autoUpdate)} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Trash2 className="w-5 h-5 text-red-500" /> Historial de Búsqueda</h3>
                  <p className="text-nexus-text-sec text-sm mb-4">Elimina las búsquedas recientes guardadas en este dispositivo.</p>
                  <button onClick={clearSearchHistory} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors border border-red-500/20">
                    <Trash2 className="w-5 h-5" /> Borrar Historial
                  </button>
                </div>
                <div className="h-px bg-nexus-card-hover" />
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Lock className="w-5 h-5 text-cyan-400" /> Telemetría</h3>
                  <div className="flex items-center justify-between p-4 bg-nexus-card border border-nexus-border rounded-xl">
                    <div>
                      <h4 className="font-bold text-nexus-text">Enviar datos de uso</h4>
                      <p className="text-sm text-nexus-text-sec">Permite recopilar datos anónimos para mejorar la plataforma.</p>
                    </div>
                    <ToggleSwitch isOn={false} onToggle={() => {}} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Bell className="w-5 h-5 text-cyan-400" /> Alertas de la Comunidad</h3>
                  <div className="flex items-center justify-between p-4 bg-nexus-card border border-nexus-border rounded-xl">
                    <div>
                      <h4 className="font-bold text-nexus-text">Mensajes y Respuestas</h4>
                      <p className="text-sm text-nexus-text-sec">Recibir alertas de la interacción en Nexus Hub.</p>
                    </div>
                    <ToggleSwitch isOn={true} onToggle={() => {}} />
                  </div>
                </div>
                <div className="h-px bg-nexus-card-hover" />
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Bell className="w-5 h-5 text-cyan-400" /> Alertas de Ofertas</h3>
                  <div className="flex items-center justify-between p-4 bg-nexus-card border border-nexus-border rounded-xl">
                    <div>
                      <h4 className="font-bold text-nexus-text">Recibir notificaciones</h4>
                      <p className="text-sm text-nexus-text-sec">Notificarme sobre descuentos, lanzamientos especiales y eventos.</p>
                    </div>
                    <ToggleSwitch isOn={dealAlerts} onToggle={() => setDealAlerts(!dealAlerts)} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'interface' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Palette className="w-5 h-5 text-cyan-400" /> Selector de Tema</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <button onClick={() => setTheme('dark')} className={`py-4 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-nexus-border bg-nexus-card text-nexus-text-sec hover:border-nexus-cyan/50'}`}>
                      <div className="w-6 h-6 rounded-full bg-nexus-card border border-nexus-border shadow-inner"></div>
                      <span className="font-bold text-sm">{t('theme.dark')}</span>
                    </button>
                    <button onClick={() => setTheme('light')} className={`py-4 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-nexus-border bg-nexus-card text-nexus-text-sec hover:border-nexus-cyan/50'}`}>
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-gray-300 shadow-sm"></div>
                      <span className="font-bold text-sm">{t('theme.light')}</span>
                    </button>
                    <button onClick={() => setTheme('amoled')} className={`py-4 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${theme === 'amoled' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-nexus-border bg-nexus-card text-nexus-text-sec hover:border-nexus-cyan/50'}`}>
                      <div className="w-6 h-6 rounded-full bg-black border border-nexus-border shadow-inner"></div>
                      <span className="font-bold text-sm">{t('theme.amoled') || 'AMOLED'}</span>
                    </button>
                    <button onClick={() => setTheme('auto')} className={`py-4 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${theme === 'auto' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-nexus-border bg-nexus-card text-nexus-text-sec hover:border-nexus-cyan/50'}`}>
                      <Monitor className="w-6 h-6" />
                      <span className="font-bold text-sm">{t('theme.auto')}</span>
                    </button>
                  </div>
                </div>
                <div className="h-px bg-nexus-card-hover" />
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Globe className="w-5 h-5 text-cyan-400" /> {t('nav.settings') || 'Idioma'}</h3>
                  <select value={language} onChange={(e) => setLanguage(e.target.value as any)} className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-3 text-nexus-text focus:border-cyan-400 focus:outline-none">
                    <option value="es">Español (Latinoamérica)</option>
                    <option value="en">English (US)</option>
                    <option value="pt">Português (Brasil)</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                  </select>
                </div>
              </div>
            )}

            {(activeTab === 'games-hub' || activeTab === 'nexus-ai' || activeTab === 'pwa') && (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in h-48">
                <AlertCircle className="w-12 h-12 text-nexus-text-sec mb-4" />
                <h3 className="text-xl font-bold text-nexus-text mb-2">Configuración Próximamente</h3>
                <p className="text-nexus-text-sec">Sección en proceso. Aquí podrás configurar parámetros exclusivos para {activeTab.replace('-', ' ').toUpperCase()}.</p>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-nexus-text"><Settings className="w-5 h-5 text-cyan-400" /> Información del Sistema</h3>
                  <div className="bg-nexus-surface border border-nexus-border rounded-xl p-4 space-y-2 text-sm text-nexus-text-sec">
                     <div className="flex justify-between"><span className="text-nexus-text-sec">Versión del Cliente</span><span className="font-mono text-cyan-400">v2.1.0-build.884</span></div>
                     <div className="flex justify-between"><span className="text-nexus-text-sec">Entorno</span><span className="font-mono text-green-400">PRODUCCIÓN</span></div>
                     <div className="flex justify-between"><span className="text-nexus-text-sec">Motor de Renderizado</span><span className="font-mono">React 18 + Vite</span></div>
                  </div>
                </div>

                <div className="h-px bg-nexus-card-hover" />

                <div className="flex flex-col">
                   <h3 className="text-xl font-bold text-nexus-text mb-2">Soporte Técnico Especializado</h3>
                   <p className="text-sm text-nexus-text-sec mb-6">Usa nuestro correo oficial para resolver problemas de cuenta o problemas avanzados.</p>
                   <SupportEmailBox category="Requerimiento Avanzado de Cuenta" />
                </div>
              </div>
            )}
          </div>
        </div>
    </motion.div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-bold ${active ? 'bg-cyan-500/10 text-cyan-400' : 'text-nexus-text-sec hover:bg-nexus-card hover:text-nexus-text'}`}>
      <Icon className="w-5 h-5" /> {label}
    </button>
  );
}

function ToggleSwitch({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`w-12 h-6 rounded-full relative transition-colors ${isOn ? 'bg-cyan-500' : 'bg-gray-600'}`}>
      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isOn ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

function DownloadIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
