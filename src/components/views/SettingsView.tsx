import React, { useState, useEffect } from 'react';
import { User, Lock, CreditCard, Wifi, RefreshCw, Trash2, Bell, Palette, Globe, ChevronLeft, Save } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsViewProps {
  onBack: () => void;
  userProfile: any;
}

export function SettingsView({ onBack, userProfile }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'downloads' | 'privacy' | 'interface'>('account');
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

  // 4. Interface State
  const [theme, setTheme] = useState(localStorage.getItem('nexus_theme') || 'dark');
  const [language, setLanguage] = useState(localStorage.getItem('nexus_language') || 'es');

  useEffect(() => {
    localStorage.setItem('nexus_network_pref', networkPref);
  }, [networkPref]);

  useEffect(() => {
    localStorage.setItem('nexus_auto_update', String(autoUpdate));
  }, [autoUpdate]);

  useEffect(() => {
    localStorage.setItem('nexus_deal_alerts', String(dealAlerts));
  }, [dealAlerts]);

  useEffect(() => {
    localStorage.setItem('nexus_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('nexus_language', language);
  }, [language]);

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

  const addPaymentMethod = () => {
    showToast('Método de pago (simulado) registrado.');
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-50 bg-[#0a0b14]/95 backdrop-blur-xl overflow-y-auto">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black px-6 py-3 rounded-full font-bold shadow-lg z-[60]">
          {toastMessage}
        </div>
      )}
      <div className="max-w-4xl mx-auto p-6 pt-12">
        <button onClick={onBack} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-bold mb-8 transition-colors">
          <ChevronLeft className="w-5 h-5" /> Volver al Perfil
        </button>
        <h1 className="text-3xl font-black mb-8 text-white">Configuración</h1>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 flex flex-col gap-2">
            <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={User} label="Gestión de Cuenta" />
            <TabButton active={activeTab === 'downloads'} onClick={() => setActiveTab('downloads')} icon={DownloadIcon} label="Descargas y Actualizaciones" />
            <TabButton active={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')} icon={Bell} label="Privacidad y Notificaciones" />
            <TabButton active={activeTab === 'interface'} onClick={() => setActiveTab('interface')} icon={Palette} label="Preferencias de Interfaz" />
          </div>

          <div className="flex-1 glass-panel border border-white/5 rounded-3xl p-6 md:p-8">
            {activeTab === 'account' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-white"><User className="w-5 h-5 text-cyan-400" /> Editar Perfil</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col items-start gap-2">
                       <label className="block text-sm text-gray-400">Foto de Perfil</label>
                       <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center overflow-hidden">
                             {photo ? <img src={photo} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-cyan-400" />}
                          </div>
                          <label className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors text-sm">
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
                      <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Correo Electrónico</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none" />
                    </div>
                    <button onClick={handleSaveProfile} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors">
                      <Save className="w-5 h-5" /> Guardar Perfil
                    </button>
                  </div>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-white"><Lock className="w-5 h-5 text-cyan-400" /> Seguridad</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Nueva Contraseña (mín. 8 caracteres)</label>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none" />
                    </div>
                    <button onClick={handleSavePassword} className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors">
                      <Lock className="w-5 h-5" /> Cambiar Contraseña
                    </button>
                  </div>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-white"><CreditCard className="w-5 h-5 text-cyan-400" /> Métodos de Pago</h3>
                  <button onClick={addPaymentMethod} className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors">
                    <CreditCard className="w-5 h-5" /> Registrar tarjeta simulada
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'downloads' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-white"><Wifi className="w-5 h-5 text-cyan-400" /> Preferencia de Red</h3>
                  <p className="text-gray-400 text-sm mb-4">Elige sobre qué red prefieres descargar e instalar contenido.</p>
                  <select value={networkPref} onChange={(e) => setNetworkPref(e.target.value)} className="w-full bg-[#0a0b14] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none">
                    <option value="any">Cualquier red</option>
                    <option value="wifi">Solo Wi-Fi</option>
                  </select>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-white"><RefreshCw className="w-5 h-5 text-cyan-400" /> Actualización Automática</h3>
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div>
                      <h4 className="font-bold text-white">Mantener aplicaciones actualizadas</h4>
                      <p className="text-sm text-gray-400">Descarga e instala las actualizaciones automáticamente en segundo plano.</p>
                    </div>
                    <ToggleSwitch isOn={autoUpdate} onToggle={() => setAutoUpdate(!autoUpdate)} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-white"><Trash2 className="w-5 h-5 text-red-500" /> Historial de Búsqueda</h3>
                  <p className="text-gray-400 text-sm mb-4">Elimina las búsquedas recientes guardadas en este dispositivo.</p>
                  <button onClick={clearSearchHistory} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors border border-red-500/20">
                    <Trash2 className="w-5 h-5" /> Borrar Historial
                  </button>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-white"><Bell className="w-5 h-5 text-cyan-400" /> Alertas de Ofertas</h3>
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div>
                      <h4 className="font-bold text-white">Recibir notificaciones</h4>
                      <p className="text-sm text-gray-400">Notificarme sobre descuentos, lanzamientos especiales y eventos.</p>
                    </div>
                    <ToggleSwitch isOn={dealAlerts} onToggle={() => setDealAlerts(!dealAlerts)} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'interface' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-white"><Palette className="w-5 h-5 text-cyan-400" /> Selector de Tema</h3>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setTheme('dark')} className={`flex-1 py-4 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}>
                      <div className="w-6 h-6 rounded-full bg-black border border-white/20"></div>
                      <span className="font-bold">Oscuro</span>
                    </button>
                    <button onClick={() => setTheme('light')} className={`flex-1 py-4 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}>
                      <div className="w-6 h-6 rounded-full bg-white border border-gray-300"></div>
                      <span className="font-bold">Claro</span>
                    </button>
                  </div>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-white"><Globe className="w-5 h-5 text-cyan-400" /> Idioma</h3>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-[#0a0b14] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 focus:outline-none">
                    <option value="es">Español (Latinoamérica)</option>
                    <option value="en">English (US)</option>
                    <option value="pt">Português (Brasil)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-bold ${active ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
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
