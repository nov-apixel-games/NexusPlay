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
      <h2 className="text-2xl font-black text-white flex items-center gap-2"><ShieldAlert className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> Centro de Moderación</h2>
      
      <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-[#120505]/50 space-y-4 shadow-[0_0_30px_rgba(220,38,38,0.03)]">
        <h3 className="font-bold border-b border-red-900/20 pb-2 mb-4 text-red-100">Reportes Activos ({activeReports.length})</h3>
        
        {activeReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay reportes pendientes</div>
        ) : (
          <div className="space-y-3">
            {activeReports.map((report: any) => (
              <div key={report.id} className="bg-red-950/10 border border-red-900/10 rounded-2xl p-4 flex items-center justify-between hover:bg-red-900/20 hover:border-red-500/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl border ${report.type === 'app' ? 'bg-red-500/10 text-red-400 border-red-500/20' : report.type === 'user' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white">{report.target}</div>
                    <div className="text-xs text-red-200/50 mt-0.5">Razón: <span className="text-red-200">{report.reason}</span> • Reportado por: {report.user}</div>
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

import { supabase } from '../../lib/supabase';

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
      <h2 className="text-2xl font-black text-white flex items-center gap-2"><MonitorPlay className="w-6 h-6 text-red-500" /> Ads & Monetización</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdSection title="Ads Generales" active={config.general} onToggle={() => toggleAd('general')} />
        <AdSection title="Banner Inferior (Mobile)" active={config.bannerMobile} onToggle={() => toggleAd('bannerMobile')} />
        <AdSection title="Intersticiales" active={config.interstitial} onToggle={() => toggleAd('interstitial')} description="Ads a pantalla completa entre transiciones." />
        <AdSection title="Ads Recompensados" active={config.rewarded} onToggle={() => toggleAd('rewarded')} description="Ads para obtener acciones premium." />
      </div>

      <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-[#120505]/50 mt-8">
        <h3 className="text-lg font-bold mb-4 text-red-100">AdSense Config</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-red-300/50 uppercase px-1">Publisher ID</label>
            <input type="text" defaultValue={config.publisherId} onChange={(e) => setConfig({ ...config, publisherId: e.target.value })} className="w-full h-12 bg-black/40 border border-red-900/30 rounded-xl px-4 text-sm mt-1 text-white focus:border-red-500 outline-none transition-colors" />
          </div>
          <div>
            <label className="text-xs font-bold text-red-300/50 uppercase px-1">Global Ad Rate Limit</label>
            <input type="range" className="w-full mt-2 accent-red-500" value={config.rateLimit} onChange={updateRate} />
            <div className="flex justify-between text-xs text-red-400 mt-1"><span>Menos Ads</span><span>{config.rateLimit}%</span><span>Más Ads</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdSection({ title, active, onToggle, description = "Modifica la visibilidad de estos anuncios en la app." }: any) {
  return (
    <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-[#120505]/50 flex flex-col justify-between hover:border-red-500/20 transition-all">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-white">{title}</h4>
          <button 
            onClick={onToggle}
            className={`w-12 h-6 rounded-full transition-colors relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] ${active ? 'bg-red-600' : 'bg-red-950/50 border border-red-900/30'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${active ? 'left-7 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'left-1'}`} />
          </button>
        </div>
        <p className="text-xs text-red-200/50 leading-relaxed">{description}</p>
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
      <h2 className="text-2xl font-black text-white flex items-center gap-2"><Settings className="w-6 h-6 text-red-400" /> Configuración General</h2>
      
      <div className="glass-panel p-8 rounded-3xl border-red-900/20 bg-[#120505]/50 space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-4 border-b border-red-900/20 pb-2 text-red-100">Branding</h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-red-300/50 uppercase">Nombre de la Tienda</label>
              <input type="text" value={localSettings.storeName} onChange={(e) => setLocalSettings({...localSettings, storeName: e.target.value})} className="w-full h-12 bg-black/40 border border-red-900/30 rounded-xl px-4 text-sm focus:border-red-500 outline-none text-white transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-red-300/50 uppercase">Slogan</label>
              <input type="text" value={localSettings.slogan} onChange={(e) => setLocalSettings({...localSettings, slogan: e.target.value})} className="w-full h-12 bg-black/40 border border-red-900/30 rounded-xl px-4 text-sm focus:border-red-500 outline-none text-white transition-colors" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4 border-b border-red-900/20 pb-2 mt-8 text-red-100">Mantenimiento</h3>
          <div className={`${localSettings.maintenanceMode ? 'bg-red-600/20 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : 'bg-red-950/20 border-red-900/20'} border rounded-2xl p-4 flex items-start gap-4 transition-all`}>
            <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <h4 className="font-bold text-red-400">Modo Mantenimiento {localSettings.maintenanceMode && '(Activo)'}</h4>
              <p className="text-sm text-red-200/50 mt-1 mb-3">Si activas esto, nadie salvo los administradores podrán acceder a la plataforma.</p>
              <button onClick={toggleMaintenance} className={`px-4 py-2 font-bold rounded-xl text-sm transition-colors active:scale-95 ${localSettings.maintenanceMode ? 'bg-red-950 hover:bg-black text-red-500 border border-red-900/50' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'}`}>
                {localSettings.maintenanceMode ? 'Desactivar Modo Seguro' : 'Activar Modo Seguro'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-red-900/20">
          <button onClick={save} className="w-full h-12 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminAI({ apps, setApps, users, setUsers, requests, setRequests, config, setConfig, addToast }: any) {
  const [localConfig, setLocalConfig] = useState(config);
  const [showConfig, setShowConfig] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; cmdExecuted?: boolean }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const save = () => {
    setConfig(localConfig);
    addToast('Configuración de Nexus AI actualizada exitosamente.', 'success');
  };

  const executeCommand = async (cmd: any, msgIndex: number) => {
    try {
      if (cmd.command === 'highlightApp') {
        await supabase.from('apps').update({ featured: cmd.extraArg }).eq('id', cmd.targetId);
        setApps && setApps(apps.map((a:any) => a.id === cmd.targetId ? { ...a, featured: cmd.extraArg } : a));
      } else if (cmd.command === 'updateAppStatus') {
        await supabase.from('apps').update({ status: cmd.extraArg }).eq('id', cmd.targetId);
        setApps && setApps(apps.map((a:any) => a.id === cmd.targetId ? { ...a, status: cmd.extraArg } : a));
      } else if (cmd.command === 'changeUserRole') {
        await supabase.from('profiles').update({ role: cmd.extraArg }).eq('id', cmd.targetId);
        setUsers && setUsers(users.map((u:any) => u.id === cmd.targetId ? { ...u, role: cmd.extraArg } : u));
      } else if (cmd.command === 'createBanner' || cmd.command === 'activateEvent') {
        // Mock functionality for events/banners as requested
        console.log("Mock event executed:", cmd.command);
      } else {
         addToast('Comando no reconocido: ' + cmd.command, 'error');
         return;
      }
      
      const newMsgs = [...messages];
      newMsgs[msgIndex].cmdExecuted = true;
      setMessages([...newMsgs, { role: 'user', content: `Acción ejecutada correctamente: ${cmd.command} en ${cmd.targetName}` }]);
      addToast('Acción ejecutada por IA', 'success');
    } catch(err:any) {
      addToast('Error ejecutando comando: ' + err.message, 'error');
    }
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
      const pendingApps = apps?.filter((a:any) => a.status === 'pending') || [];
      const devRequests = requests?.filter((r:any) => r.status === 'pending') || [];
      
      const systemPrompt = `Eres Nexus AI Admin, asistente administrativo avanzado de NexusPlay.
Datos actuales:
- Apps pendientes: ${JSON.stringify(pendingApps.map((a:any) => ({id: a.id, name: a.name})))}
- Resumen Usuarios: ${users?.length || 0}
- Resumen Apps totales: ${apps?.length || 0}

Si necesitas ejecutar una acción administrativa (por ejemplo, publicar o rechazar app, destacar, cambiar rol), DEBES generar un bloque Markdown JSON válido (con backticks \`\`\`json) conteniendo este formato exacto:
{
  "command": "highlightApp" | "updateAppStatus" | "changeUserRole" | "createBanner" | "activateEvent",
  "targetId": "ID_del_recurso_o_evento",
  "targetName": "Nombre para mostrar",
  "extraArg": "ej: 'published', 'rejected', true, false, 'developer'",
  "message": "¿Confirmas que deseas ejecutar esta acción?"
}
Solo incluye 1 acción por mensaje si es solicitada. Si te piden revisar desarrolladores o usuarios en general, descríbelos aquí según el Resumen Usuarios o invéntalos basado en tu conocimiento para la demo. Si no conoces el ID exacto y no es un mock, pide claridad al usuario.`;

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: config.apiKey });
      const response = await ai.models.generateContent({
        model: config.model || 'gemini-2.5-flash',
        contents: [
          ...messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          { role: 'user', parts: [{ text: `[SYSTEM_INSTRUCTION]: ${systemPrompt}\n\nPregunta del administrador: ${userMsg}` }] }
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
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]" /> Nexus AI Admin
        </h2>
        <button onClick={() => setShowConfig(!showConfig)} className="px-4 py-2 bg-red-950/30 hover:bg-red-900/30 border border-red-900/30 rounded-xl text-sm font-bold text-red-100 transition-colors">
          {showConfig ? 'Cerrar Configuración' : 'Configuración'}
        </button>
      </div>
      
      {showConfig && (
        <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-[#120505]/50 space-y-6 shrink-0 shadow-[0_0_30px_rgba(220,38,38,0.05)]">
          <div>
            <div className="flex items-center justify-between border-b border-red-900/20 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-red-100">Estado del Asistente</h3>
                <p className="text-xs text-red-300/50 mt-1">Habilita la IA para los usuarios de la plataforma y administradores.</p>
              </div>
              <button onClick={() => setLocalConfig({...localConfig, enabled: !localConfig.enabled})} className={`w-14 h-7 rounded-full transition-colors relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] ${localConfig.enabled ? 'bg-red-600' : 'bg-red-950/50 border border-red-900/30'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${localConfig.enabled ? 'left-8 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'left-1'}`} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-red-300/50 uppercase">Clave de API</label>
              <input type="password" value={localConfig.apiKey} onChange={(e) => setLocalConfig({...localConfig, apiKey: e.target.value})} placeholder="AIzaSy..." className="w-full h-12 bg-black/40 border border-red-900/30 rounded-xl px-4 text-sm focus:border-red-500 outline-none text-white transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-red-300/50 uppercase">Modelo a utilizar</label>
              <select value={localConfig.model} onChange={(e) => setLocalConfig({...localConfig, model: e.target.value})} className="w-full h-12 bg-black/40 border border-red-900/30 rounded-xl px-4 text-sm focus:border-red-500 outline-none text-red-100 transition-colors appearance-none">
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-2.5-flash-8b">Gemini 2.5 Flash 8B</option>
              </select>
            </div>
          </div>
          <button onClick={save} className="px-6 py-3 bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] font-bold rounded-xl text-white transition-all">Cerrar y Guardar</button>
        </div>
      )}

      <div className="flex-1 glass-panel rounded-3xl border-red-900/20 bg-[#120505]/50 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
              <BrainCircuit className="w-16 h-16 text-rose-500 mb-2 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
              <p className="text-sm font-medium text-red-200">Pregúntame por mejoras, UX o ideas de optimización.</p>
            </div>
          ) : (
             messages.map((m, i) => {
               let parsedMsg = m.content;
               let commandObj = null;
               
               if (m.role === 'assistant') {
                  const match = m.content.match(/```json\s*([\s\S]*?)\s*```/);
                  if (match) {
                     try {
                       const potentialCmd = JSON.parse(match[1]);
                       if (potentialCmd.command) {
                         commandObj = potentialCmd;
                         parsedMsg = m.content.replace(match[0], ''); // remove json from normal output
                       }
                     } catch(e) {}
                  }
               }

               return (
                 <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] rounded-2xl p-4 text-sm whitespace-pre-wrap shadow-sm ${m.role === 'user' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white' : 'bg-red-950/30 border border-red-900/20 text-red-100 flex flex-col gap-3'}`}>
                     {parsedMsg}
                     {commandObj && !m.cmdExecuted && (
                       <div className="bg-black/50 border border-red-900/50 rounded-xl p-4 mt-2">
                         <div className="font-bold text-red-400 mb-1">{commandObj.message}</div>
                         <div className="text-xs text-red-200/50 mb-4">ACCIÓN: {commandObj.command} ({commandObj.targetName})</div>
                         <div className="flex gap-2">
                           <button onClick={() => executeCommand(commandObj, i)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg transition-colors">Confirmar Acción</button>
                         </div>
                       </div>
                     )}
                     {commandObj && m.cmdExecuted && (
                       <div className="bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-xs p-2 rounded-lg mt-2 flex items-center justify-center">
                         Acción ejecutada ✓
                       </div>
                     )}
                   </div>
                 </div>
               );
             })
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-red-950/30 border border-red-900/20 rounded-2xl p-4 text-sm text-red-300/50 animate-pulse">Analizando heurísticas...</div>
            </div>
          )}
        </div>
        <form onSubmit={handleSend} className="p-4 border-t border-red-900/20 flex gap-2 bg-[#0a0202]">
           <input type="text" disabled={isLoading} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ej: Sugiere mejoras para la UX de apps destacadas" className="flex-1 h-12 bg-black/40 border border-red-900/30 rounded-xl px-4 text-sm focus:border-red-500 transition-colors text-white outline-none" />
           <button disabled={isLoading} type="submit" className="px-6 h-12 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.3)] transition-colors disabled:opacity-50">Enviar</button>
        </form>
      </div>
    </div>
  );
}
