import { useState } from 'react';
import { MonitorPlay, Settings, ShieldAlert, CheckCircle, XCircle, Code, Eye, FileText, BrainCircuit } from 'lucide-react';
import { AppItem, UserItem } from '../../types';

export function AdminModeration({ reports, setReports, addToast }: any) {
  const resolve = (id: string) => {
    setReports(reports.map((r: any) => r.id === id ? { ...r, status: 'resolved' } : r));
    addToast('Reporte resuelto exitosamente.', 'success');
  };

  const remove = (id: string) => {
    setReports(reports.filter((r: any) => r.id !== id));
    addToast('Reporte eliminado.', 'info');
  };

  const activeReports = reports.filter((r: any) => r.status !== 'resolved');

  return (
    <div className="space-y-6 max-w-5xl">
      <h2 className="text-2xl font-black text-white flex items-center gap-2"><ShieldAlert className="w-6 h-6 text-red-500" /> Centro de Moderación</h2>
      
      <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4">
        <h3 className="font-bold border-b border-white/5 pb-2 mb-4">Reportes Activos ({activeReports.length})</h3>
        
        {activeReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay reportes pendientes</div>
        ) : (
          <div className="space-y-3">
            {activeReports.map((report: any) => (
              <div key={report.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${report.type === 'app' ? 'bg-cyan-500/20 text-cyan-400' : report.type === 'user' ? 'bg-purple-500/20 text-purple-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold">{report.target}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Razón: <span className="text-gray-300">{report.reason}</span> • Reportado por: {report.user}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => resolve(report.id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">Resolver</button>
                  <button onClick={() => remove(report.id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminDevs({ requests, setRequests, addToast, users, setUsers }: any) {
  const approve = (id: string, email: string) => {
    setRequests(requests.map((r: any) => r.id === id ? { ...r, status: 'approved' } : r));
    if (users && setUsers) {
      setUsers(users.map((u: any) => u.email === email ? { ...u, role: 'developer' } : u));
    }
    // TODO trigger internal notification
    addToast('Cuenta de desarrollador aprobada.', 'success');
  };

  const reject = (id: string) => {
    setRequests(requests.map((r: any) => r.id === id ? { ...r, status: 'rejected' } : r));
    addToast('Solicitud rechazada.', 'info');
  };

  const pendingRequests = requests.filter((r: any) => r.status === 'pending');

  return (
    <div className="space-y-6 max-w-5xl">
      <h2 className="text-2xl font-black text-white flex items-center gap-2"><Code className="w-6 h-6 text-cyan-400" /> Solicitudes de Desarrollador</h2>
      
      <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-4">
        <h3 className="font-bold border-b border-white/5 pb-2 mb-4">Cuentas Pendientes de Aprobación</h3>
        
        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay solicitudes pendientes</div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req: any) => (
              <div key={req.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold">{req.name} <span className="text-gray-400 text-xs">({req.company})</span></div>
                  <div className="text-xs text-gray-400">{req.email} • Exp: {req.experience} • Tipos: {req.appTypes}</div>
                  <div className="text-xs text-gray-500 mt-1 italic">"{req.message}"</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => approve(req.id, req.email)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                    <CheckCircle className="w-4 h-4" /> Aprobar
                  </button>
                  <button onClick={() => reject(req.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                    <XCircle className="w-4 h-4" /> Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminAds({ config, setConfig, addToast }: any) {
  const toggleAd = (key: string) => {
    setConfig({ ...config, [key]: !config[key] });
    addToast('Configuración publicitaria actualizada.', 'success');
  };

  const updateRate = (e: any) => {
    setConfig({ ...config, rateLimit: parseInt(e.target.value) });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-black text-white flex items-center gap-2"><MonitorPlay className="w-6 h-6 text-purple-400" /> Ads & Monetización</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdSection title="Ads Generales" active={config.general} onToggle={() => toggleAd('general')} />
        <AdSection title="Banner Inferior (Mobile)" active={config.bannerMobile} onToggle={() => toggleAd('bannerMobile')} />
        <AdSection title="Intersticiales" active={config.interstitial} onToggle={() => toggleAd('interstitial')} description="Ads a pantalla completa entre transiciones." />
        <AdSection title="Ads Recompensados" active={config.rewarded} onToggle={() => toggleAd('rewarded')} description="Ads para obtener acciones premium." />
      </div>

      <div className="glass-panel p-6 rounded-3xl border-white/5 mt-8">
        <h3 className="text-lg font-bold mb-4">AdSense Config</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase px-1">Publisher ID</label>
            <input type="text" defaultValue={config.publisherId} onChange={(e) => setConfig({ ...config, publisherId: e.target.value })} className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-sm mt-1 text-white focus:border-cyan-400 outline-none transition-colors" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase px-1">Global Ad Rate Limit</label>
            <input type="range" className="w-full mt-2 accent-purple-400" value={config.rateLimit} onChange={updateRate} />
            <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Menos Ads</span><span>{config.rateLimit}%</span><span>Más Ads</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdSection({ title, active, onToggle, description = "Modifica la visibilidad de estos anuncios en la app." }: any) {
  return (
    <div className="glass-panel p-6 rounded-3xl border-white/5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-white">{title}</h4>
          <button 
            onClick={onToggle}
            className={`w-12 h-6 rounded-full transition-colors relative ${active ? 'bg-purple-500' : 'bg-gray-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      </div>
      <div className="mt-4">
        <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-md ${active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {active ? 'Activado' : 'Desactivado'}
        </span>
      </div>
    </div>
  );
}

export function AdminSettings({ settings, setSettings, addToast }: any) {
  const [localSettings, setLocalSettings] = useState(settings || { storeName: '', slogan: '', maintenanceMode: false });

  const save = () => {
    if (!localSettings.storeName.trim() || !localSettings.slogan.trim()) {
      addToast('El nombre de la tienda y slogan son requeridos.', 'error');
      return;
    }
    setSettings(localSettings);
    addToast('Configuraciones guardadas. Los cambios son visibles inmediatamente en la plataforma.', 'success');
  };

  const toggleMaintenance = () => {
    setLocalSettings({ ...localSettings, maintenanceMode: !localSettings.maintenanceMode });
    setSettings({ ...localSettings, maintenanceMode: !localSettings.maintenanceMode });
    addToast(localSettings.maintenanceMode ? 'Modo mantenimiento desactivado.' : 'Modo mantenimiento activado.', 'info');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-black text-white flex items-center gap-2"><Settings className="w-6 h-6 text-gray-400" /> Configuración General</h2>
      
      <div className="glass-panel p-8 rounded-3xl border-white/5 space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-4 border-b border-white/5 pb-2">Branding</h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Nombre de la Tienda</label>
              <input type="text" value={localSettings.storeName} onChange={(e) => setLocalSettings({...localSettings, storeName: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 outline-none text-white transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Slogan</label>
              <input type="text" value={localSettings.slogan} onChange={(e) => setLocalSettings({...localSettings, slogan: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 outline-none text-white transition-colors" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4 border-b border-white/5 pb-2 mt-8">Mantenimiento</h3>
          <div className={`${localSettings.maintenanceMode ? 'bg-red-500/20 border-red-500/30' : 'bg-red-500/5 border-red-500/10'} border rounded-2xl p-4 flex items-start gap-4 transition-colors`}>
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <h4 className="font-bold text-red-400">Modo Mantenimiento {localSettings.maintenanceMode && '(Activo)'}</h4>
              <p className="text-sm text-gray-400 mt-1 mb-3">Si activas esto, nadie salvo los administradores podrán acceder a la plataforma.</p>
              <button onClick={toggleMaintenance} className={`px-4 py-2 font-bold rounded-xl text-sm transition-colors active:scale-95 ${localSettings.maintenanceMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                {localSettings.maintenanceMode ? 'Desactivar Modo Seguro' : 'Activar Modo Seguro'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-white/5">
          <button onClick={save} className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminAI({ config, setConfig, addToast }: any) {
  const [localConfig, setLocalConfig] = useState(config);
  const [showConfig, setShowConfig] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const save = () => {
    setConfig(localConfig);
    addToast('Configuración de Nexus AI actualizada exitosamente.', 'success');
  };

  const handleSend = async (e: any) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (!config.apiKey) {
      addToast('Falta la API Key en la configuración.', 'error');
      setShowConfig(true);
      return;
    }
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // dynamically import to avoid breaking layout
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: config.apiKey });
      const response = await ai.models.generateContent({
        model: config.model || 'gemini-2.5-flash',
        contents: [
          ...messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          { role: 'user', parts: [{ text: `Eres Nexus AI Admin. Solo debes sugerir mejoras, revisar UX, sugerir optimizaciones, pero nunca modificarás el código por mí directamente. Pregunta del administrador: ${userMsg}` }] }
        ]
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || 'Sin respuesta.' }]);
    } catch(err: any) {
      addToast('Error al procesar la IA: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-2xl font-black text-white flex items-center gap-2"><BrainCircuit className="w-6 h-6 text-cyan-400" /> Nexus AI Admin</h2>
        <button onClick={() => setShowConfig(!showConfig)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors">
          {showConfig ? 'Cerrar Configuración' : 'Configuración'}
        </button>
      </div>
      
      {showConfig && (
        <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-6 shrink-0">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold">Estado del Asistente</h3>
                <p className="text-xs text-gray-400 mt-1">Habilita la IA para los usuarios de la plataforma y administradores.</p>
              </div>
              <button onClick={() => setLocalConfig({...localConfig, enabled: !localConfig.enabled})} className={`w-14 h-7 rounded-full transition-colors relative ${localConfig.enabled ? 'bg-cyan-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${localConfig.enabled ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Clave de API</label>
              <input type="password" value={localConfig.apiKey} onChange={(e) => setLocalConfig({...localConfig, apiKey: e.target.value})} placeholder="AIzaSy..." className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 outline-none text-white transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Modelo a utilizar</label>
              <select value={localConfig.model} onChange={(e) => setLocalConfig({...localConfig, model: e.target.value})} className="w-full h-12 bg-black/50 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 outline-none text-white transition-colors appearance-none">
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-2.5-flash-8b">Gemini 2.5 Flash 8B</option>
              </select>
            </div>
          </div>
          <button onClick={save} className="px-6 py-3 bg-cyan-500 font-bold rounded-xl text-black">Cerrar y Guardar</button>
        </div>
      )}

      <div className="flex-1 glass-panel rounded-3xl border-white/5 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
              <BrainCircuit className="w-16 h-16 text-cyan-400 mb-2" />
              <p className="text-sm font-medium">Pregúntame por mejoras, UX o ideas de optimización.</p>
            </div>
          ) : (
             messages.map((m, i) => (
               <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[80%] rounded-2xl p-4 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-cyan-500/20 text-white' : 'bg-white/5 text-gray-300'}`}>
                   {m.content}
                 </div>
               </div>
             ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 rounded-2xl p-4 text-sm text-gray-400 animate-pulse">Analizando...</div>
            </div>
          )}
        </div>
        <form onSubmit={handleSend} className="p-4 border-t border-white/5 flex gap-2">
           <input type="text" disabled={isLoading} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ej: Sugiere mejoras para la UX de apps destacadas" className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 transition-colors" />
           <button disabled={isLoading} type="submit" className="px-6 h-12 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50">Enviar</button>
        </form>
      </div>
    </div>
  );
}
