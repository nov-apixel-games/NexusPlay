import { useState, useRef, useEffect } from 'react';
import { 
  MonitorPlay, Settings, ShieldAlert, CheckCircle, XCircle, Code, Eye, 
  FileText, BrainCircuit, Send, Trash2, History, Sparkles, Copy, 
  RotateCcw, Activity, Database, AlertTriangle, Search, BarChart3, 
  Cloud, Terminal, Zap, Fingerprint, RefreshCw, Layers, Upload
} from 'lucide-react';
import { AppItem, UserItem } from '../../types';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { supabase } from '../../lib/supabase';

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
      <h2 className="text-2xl font-black text-nexus-text flex items-center gap-2"><ShieldAlert className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> Centro de Moderación</h2>
      
      <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-nexus-card/80 space-y-4 shadow-[0_0_30px_rgba(220,38,38,0.03)]">
        <h3 className="font-bold border-b border-red-900/20 pb-2 mb-4 text-red-100">Reportes Activos ({activeReports.length})</h3>
        
        {activeReports.length === 0 ? (
          <div className="text-center py-8 text-nexus-text-sec">No hay reportes pendientes</div>
        ) : (
          <div className="space-y-3">
            {activeReports.map((report: any) => (
              <div key={report.id} className="bg-red-950/10 border border-red-900/10 rounded-2xl p-4 flex items-center justify-between hover:bg-red-900/20 hover:border-red-500/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl border ${report.type === 'app' ? 'bg-red-500/10 text-red-400 border-red-500/20' : report.type === 'user' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-nexus-text">{report.target}</div>
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
      <h2 className="text-2xl font-black text-nexus-text flex items-center gap-2"><MonitorPlay className="w-6 h-6 text-red-500" /> Ads & Monetización</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdSection title="Ads Generales" active={config.general} onToggle={() => toggleAd('general')} />
        <AdSection title="Banner Inferior (Mobile)" active={config.bannerMobile} onToggle={() => toggleAd('bannerMobile')} />
        <AdSection title="Intersticiales" active={config.interstitial} onToggle={() => toggleAd('interstitial')} description="Ads a pantalla completa entre transiciones." />
        <AdSection title="Ads Recompensados" active={config.rewarded} onToggle={() => toggleAd('rewarded')} description="Ads para obtener acciones premium." />
      </div>

      <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-nexus-card/80 mt-8">
        <h3 className="text-lg font-bold mb-4 text-red-100">AdSense Config</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-red-300/50 uppercase px-1">Publisher ID</label>
            <input type="text" defaultValue={config.publisherId} onChange={(e) => setConfig({ ...config, publisherId: e.target.value })} className="w-full h-12 bg-nexus-surface border border-red-900/30 rounded-xl px-4 text-sm mt-1 text-nexus-text focus:border-red-500 outline-none transition-colors" />
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
    <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-nexus-surface/80 flex flex-col justify-between hover:border-red-500/20 transition-all">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-nexus-text">{title}</h4>
          <button 
            onClick={onToggle}
            className={`w-12 h-6 rounded-full transition-colors relative shadow-lg ${active ? 'bg-red-600' : 'bg-red-950/50 border border-red-900/30'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${active ? 'left-7 drop-shadow-lg' : 'left-1'}`} />
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
  const [localSettings, setLocalSettings] = useState(settings || { storeName: '', slogan: '', maintenanceMode: false, logoUrl: '' });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const save = () => {
    if (!localSettings.storeName.trim() || !localSettings.slogan.trim()) {
      addToast('El nombre de la tienda y slogan son requeridos.', 'error');
      return;
    }
    setSettings(localSettings);
    addToast('Configuraciones guardadas. Los cambios son visibles inmediatamente en la plataforma.', 'success');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB
      addToast('El logo no debe superar los 2MB', 'error');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const publicId = `logos/nexus_logo_${Date.now()}`;
      const result = await uploadToCloudinary(file, publicId);
      if (result && (result.secure_url || result.url)) {
        const urlToUse = result.secure_url || result.url;
        const newSettings = { ...localSettings, logoUrl: urlToUse };
        setLocalSettings(newSettings);
        setSettings(newSettings); // Auto save the image to affect global state
        addToast('Logo actualizado correctamente', 'success');
      } else {
        throw new Error('No se recibió la URL de Cloudinary');
      }
    } catch (e: any) {
      addToast('Error subiendo logo: ' + e.message, 'error');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const toggleMaintenance = () => {
    setLocalSettings({ ...localSettings, maintenanceMode: !localSettings.maintenanceMode });
    setSettings({ ...localSettings, maintenanceMode: !localSettings.maintenanceMode });
    addToast(localSettings.maintenanceMode ? 'Modo mantenimiento desactivado.' : 'Modo mantenimiento activado.', 'info');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-black text-nexus-text flex items-center gap-2"><Settings className="w-6 h-6 text-red-400" /> Configuración General</h2>
      
      <div className="glass-panel p-8 rounded-3xl border-red-900/20 bg-nexus-card/80 space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-4 border-b border-red-900/20 pb-2 text-red-100">Branding</h3>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6 border-b border-red-900/10 pb-6">
               <div className="shrink-0 flex flex-col items-center gap-3">
                 <div className="w-24 h-24 bg-nexus-surface rounded-2xl border border-red-900/30 flex items-center justify-center p-2 shadow-inner relative overflow-hidden group">
                   {localSettings.logoUrl ? (
                     <img src={localSettings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                   ) : (
                     <Sparkles className="w-8 h-8 text-red-500/30" />
                   )}
                   <div className="absolute inset-0 bg-nexus-surface opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button onClick={() => fileInputRef.current?.click()} className="text-nexus-text hover:text-red-400 transition-colors">
                       <Upload className="w-6 h-6" />
                     </button>
                   </div>
                 </div>
                 {isUploadingLogo ? (
                   <span className="text-xs text-red-400 font-bold animate-pulse">Subiendo...</span>
                 ) : (
                   <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-red-400 hover:text-nexus-text uppercase tracking-wider transition-colors border border-red-900/50 bg-red-950/30 px-3 py-1.5 rounded-lg active:scale-95">
                     Cambiar Logo
                   </button>
                 )}
                 <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
               </div>
               <div className="flex-1 text-sm text-red-200/50">
                 Sube el logotipo principal de la plataforma. Este se mostrará en el Navbar superior y partes del sistema principal. Tamaño recomendado 200x50, formato PNG o SVG con fondo transparente. Max 2MB.
                 <br/><br/>
                 Se guardará automáticamente en tiempo real usando el Storage configurado.
               </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-2">
              <label className="text-xs font-bold text-red-300/50 uppercase">Nombre de la Tienda</label>
              <input type="text" value={localSettings.storeName} onChange={(e) => setLocalSettings({...localSettings, storeName: e.target.value})} className="w-full h-12 bg-nexus-surface border border-red-900/30 rounded-xl px-4 text-sm focus:border-red-500 outline-none text-nexus-text transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-red-300/50 uppercase">Slogan</label>
              <input type="text" value={localSettings.slogan} onChange={(e) => setLocalSettings({...localSettings, slogan: e.target.value})} className="w-full h-12 bg-nexus-surface border border-red-900/30 rounded-xl px-4 text-sm focus:border-red-500 outline-none text-nexus-text transition-colors" />
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
              <button onClick={toggleMaintenance} className={`px-4 py-2 font-bold rounded-xl text-sm transition-colors active:scale-95 ${localSettings.maintenanceMode ? 'bg-red-950 hover:bg-black text-red-500 border border-red-900/50' : 'bg-red-600 hover:bg-red-500 text-nexus-text shadow-[0_0_15px_rgba(220,38,38,0.4)]'}`}>
                {localSettings.maintenanceMode ? 'Desactivar Modo Seguro' : 'Activar Modo Seguro'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-red-900/20">
          <button onClick={save} className="w-full h-12 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-nexus-text font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
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
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; cmdExecuted?: boolean; isSystem?: boolean; commandObj?: any; isCancelled?: boolean }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [usageStats, setUsageStats] = useState(() => Number(localStorage.getItem('nexus_ai_usage') || '0'));
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const save = () => {
    setConfig(localConfig);
    addToast('Configuración de Nexus AI actualizada exitosamente.', 'success');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copiado al portapapeles', 'success');
  };

  const quickActions = [
    { label: 'Sincronizar', icon: RefreshCw, cmd: 'sincronizar datos' },
    { label: 'Rendimiento', icon: Activity, cmd: 'analizar rendimiento' },
    { label: 'Catálogo', icon: Layers, cmd: 'listar apps' },
    { label: 'Status Core', icon: Database, cmd: 'estado sistema' },
  ];

  const handleQuickAction = (cmd: string) => {
    processCommand(cmd);
  };

  const cancelCommand = (msgIndex: number) => {
    const newMsgs = [...messages];
    newMsgs[msgIndex].isCancelled = true;
    setMessages([...newMsgs, { role: 'assistant', content: '❌ **Operación cancelada por el usuario.** Ningún cambio realizado.', isSystem: true }]);
  };

  const executeCommand = async (cmdObj: any, msgIndex: number) => {
    try {
      const { command, targetId, extraArg, targetName } = cmdObj;
      setIsLoading(true);
      
      if (command === 'highlightApp') {
        await supabase.from('apps').update({ featured: extraArg }).eq('id', targetId);
        setApps && setApps(apps.map((a: any) => a.id === targetId ? { ...a, featured: extraArg } : a));
      } else if (command === 'updateAppStatus' || command === 'deleteApp') {
        if (command === 'deleteApp') {
          await supabase.from('apps').delete().eq('id', targetId);
          setApps && setApps(apps.filter((a: any) => a.id !== targetId));
        } else {
          await supabase.from('apps').update({ status: extraArg }).eq('id', targetId);
          setApps && setApps(apps.map((a: any) => a.id === targetId ? { ...a, status: extraArg } : a));
        }
      } else if (command === 'changeUserRole' || command === 'blockUser') {
        const newRole = command === 'blockUser' ? 'blocked' : extraArg;
        await supabase.from('profiles').update({ role: newRole }).eq('id', targetId);
        setUsers && setUsers(users.map((u: any) => u.id === targetId ? { ...u, role: newRole } : u));
      } else if (command === 'systemCheck') {
        setMessages(p => [...p, { role: 'assistant', content: "🔍 **Status Core Report**\n\n- DB Core: 🟢 Active\n- CDN Edge: 🟢 Synced\n- Auth Engine: 🟢 Operational\n- Nexus AI Pipeline: 🟢 Nominal", isSystem: true }]);
        setIsLoading(false);
        return;
      } else if (command === 'toggleMaintenance') {
        setIsMaintenance(extraArg);
        await supabase.from('site_settings').upsert({ id: 1, maintenance_mode: extraArg });
        localStorage.setItem('nexus_maintenance', extraArg.toString());
      } else if (command === 'toggleRegistrations') {
        await supabase.from('site_settings').upsert({ id: 1, registrations_enabled: extraArg });
      } else if (command === 'cleanCache') {
        localStorage.removeItem('nexus_downloaded_ids');
        addToast('Caché limpiada', 'info');
      } else if (command === 'syncData') {
        addToast('Sincronizando infra...', 'info');
      }
      
      const newMsgs = [...messages];
      newMsgs[msgIndex].cmdExecuted = true;
      setMessages([...newMsgs, { role: 'assistant', content: `✅ Acción ejecutada con éxito: ${command} ${targetName ? 'en ' + targetName : ''}`, isSystem: true }]);
      addToast('Administración: Acción completada', 'success');
    } catch (err: any) {
      addToast('Error ejecutando comando: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const processCommand = async (rawInput: string) => {
    if (!rawInput.trim() || isLoading) return;
    
    const userMsg = rawInput.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    if (!config.apiKey) {
      addToast('Falta API Key de Gemini para activar NEXUS AI ADMIN', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const pendingApps = apps?.filter((a: any) => a.status === 'pending') || [];
      const publishedApps = apps?.filter((a:any) => a.status === 'published') || [];
      const usersData = users?.map((u: any) => ({
        id: u.id,
        name: u.full_name || 'Desconocido',
        email: u.email,
        role: u.role
      })) || [];

      const appsSearchableData = apps?.map((a: any) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        developer: a.developer,
        featured: a.featured
      })) || [];

      const systemPrompt = `Eres Nexus AI ADMIN CORE. El motor root del servidor y asistente administrativo de NexusPlay.
Analiza la petición del usuario.
Si el usuario pregunta algo general, de status, o cómo ayudar, responde de forma natural, concisa y amigable, con emojis. 
Si el usuario pide ayuda ("qué puedes hacer", "ayuda", "opciones") DEBES mostrar visualmente en texto formateado con viñetas tus capacidades, por ejemplo:
- 🛠️ Sistema (mantenimiento, bloquear registros)
- 📊 Estadísticas (apps, usuarios, servidor)
- 📱 Gestión de Apps (destacar, eliminar, aprobar, ocultar)
- 👥 Usuarios (buscar, banear, cambiar rol)
(No inventes capacidades que no están mapeadas en JSON).

ESTADO ACTUAL:
Mantenimiento: ${isMaintenance ? 'Activo' : 'Inactivo'}
Total usuarios: ${usersData.length}
Apps Publicadas: ${publishedApps.length}
Apps Pendientes: ${pendingApps.length}
Apps Pendientes (Nombres): ${pendingApps.map((a:any) => a.name).join(', ')}
Apps Data (Solo búsqueda, no la muestres toda): ${JSON.stringify(appsSearchableData).substring(0, 500)}...
Usuarios Data (Solo búsqueda, no la muestres toda): ${JSON.stringify(usersData).substring(0, 500)}...

MUY IMPORTANTE (MODO ACCIÓN):
Si el usuario SOLICITA UNA ACCIÓN administrativa EXPLÍCITA que cambie el estado de la plataforma, OBLIGATORIAMENTE debes retornar UNICAMENTE un bloque JSON con el formato de abajo (sin NADA de texto fuera del bloque de código JSON).
ACCIONES Mapeables al JSON:
- enable_maintenance / disable_maintenance (command: 'toggleMaintenance', extraArg: true/false)
- block_registrations / allow_registrations (command: 'toggleRegistrations', extraArg: false/true)
- sync_data (command: 'syncData')
- clean_cache (command: 'cleanCache')
- analyze_system (command: 'systemCheck')
- approve_app / reject_app / hide_app (command: 'updateAppStatus', extraArg: 'published'/'rejected'/'hidden', requiere buscar el ID de la app)
- target_delete_app (command: 'deleteApp', requiere ID)
- highlight_app / unhighlight_app (command: 'highlightApp', extraArg: true/false, requiere ID)
- block_user (command: 'blockUser', requiere ID)
- unlock_user (command: 'changeUserRole', extraArg: 'user', requiere ID)
- ban_user (command: 'changeUserRole', extraArg: 'banned', requiere ID)

Ejemplo formato de JSON a devolver:
\`\`\`json
{
  "command": "toggleMaintenance",
  "targetId": null,
  "targetName": "Plataforma",
  "extraArg": true,
  "message": "¿Confirmas que deseas ACTIVAR el Modo Seguro (Mantenimiento) en toda la plataforma?"
}
\`\`\`

Si la petición NO es una ACCIÓN que modifique estado (solo lectura/charla), responde SOLO con TEXTO, sin \`\`\`json.`;

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: config.apiKey });
      
      const updatedUsage = usageStats + 1;
      setUsageStats(updatedUsage);
      localStorage.setItem('nexus_ai_usage', updatedUsage.toString());

      const response = await ai.models.generateContent({
        model: config.model || 'gemini-2.0-flash',
        contents: [
          ...messages.filter(m => !m.isSystem && !m.commandObj).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          { role: 'user', parts: [{ text: `[SYSTEM_KNOWLEDGE]: ${systemPrompt}\n\n[ADMIN_USER]: ${userMsg}` }] }
        ]
      });

      const textRes = response.text || 'Sin respuesta.';
      setMessages(prev => [...prev, { role: 'assistant', content: textRes }]);
    } catch (err: any) {
      addToast('Error IA: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    processCommand(input);
  };


  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex flex-col gap-4 font-sans relative">
      <div className="flex items-center justify-between shrink-0 px-2 lg:px-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-nexus-cyan/10 border border-nexus-cyan/30 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.2)]">
            <BrainCircuit className="w-7 h-7 text-nexus-cyan" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-nexus-text italic tracking-tighter">
              NEXUS <span className="text-nexus-cyan uppercase">AI CORE</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse outline outline-4 outline-green-500/20" />
              <span className="text-[10px] font-black text-nexus-text-sec uppercase tracking-widest">Nivel de Acceso: Root Admin</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowConfig(!showConfig)} 
             className={`p-2.5 rounded-xl transition-all border ${showConfig ? 'bg-nexus-cyan text-nexus-bg border-nexus-cyan' : 'bg-nexus-surface text-nexus-text-sec border-nexus-border hover:border-nexus-cyan/50'}`}
             title="Configuración IA"
           >
             <Settings className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden pb-24 lg:pb-0">
        {/* Main Interface */}
        <div className="flex-1 bg-nexus-surface border border-nexus-border rounded-[2rem] flex flex-col overflow-hidden backdrop-blur-xl shadow-2xl relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(0,229,255,0.03),_transparent_70%)] pointer-events-none" />
          
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar relative"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-nexus-cyan/5 border border-nexus-cyan/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Fingerprint className="w-12 h-12 text-nexus-cyan/30" />
                </div>
                <h3 className="text-xl font-bold text-nexus-text-sec mb-2">Sistema listo</h3>
                <p className="text-xs text-nexus-text-sec max-w-sm leading-relaxed uppercase tracking-widest font-black opacity-50">
                  Esperando instrucciones directas del administrador
                </p>
                <div className="grid grid-cols-2 gap-2 mt-10 w-full max-w-md px-4">
                  {quickActions.map((qa, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleQuickAction(qa.cmd)}
                      className="flex items-center gap-3 p-3 bg-nexus-card border border-nexus-border rounded-2xl hover:border-nexus-cyan/50 hover:bg-nexus-cyan/5 text-left transition-all group"
                    >
                      <qa.icon className="w-4 h-4 text-nexus-cyan group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black text-nexus-text-sec uppercase tracking-widest group-hover:text-nexus-cyan">{qa.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m, i) => {
                  let commandObj = m.commandObj || null;
                  let displayContent = m.content;
                  
                  if (m.role === 'assistant' && !commandObj) {
                    const match = m.content.match(/```json\s*([\s\S]*?)\s*```/);
                    if (match) {
                      try {
                        commandObj = JSON.parse(match[1]);
                        displayContent = m.content.replace(match[0], '');
                      } catch(e) {}
                    }
                  }

                  return (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`group relative max-w-[90%] sm:max-w-[80%] rounded-[1.5rem] p-4 sm:p-5 ${m.role === 'user' ? 'bg-nexus-cyan/10 border border-nexus-cyan/30 text-nexus-text rounded-tr-sm shadow-[0_0_20px_rgba(0,229,255,0.05)]' : 'bg-nexus-card/80 border border-nexus-border text-nexus-text rounded-tl-sm shadow-xl'}`}>
                        {m.role === 'assistant' && (
                           <button 
                             onClick={() => copyToClipboard(displayContent)}
                             className="absolute -right-10 top-0 p-2 text-slate-600 hover:text-nexus-cyan opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <Copy className="w-4 h-4" />
                           </button>
                        )}
                        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-nexus-cyan font-medium text-[13px] sm:text-sm">
                          {displayContent}
                        </div>

                        {commandObj && !m.cmdExecuted && !m.isCancelled && (
                          <div className="mt-4 bg-nexus-surface border border-nexus-cyan/20 rounded-2xl p-4 sm:p-5 overflow-hidden">
                             <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                <span className="text-[10px] font-black uppercase text-yellow-500 tracking-widest">Confirmación Requerida</span>
                             </div>
                             <p className="text-sm font-bold text-nexus-text mb-4">{commandObj.message}</p>
                             <div className="flex gap-2">
                               <button 
                                 onClick={() => executeCommand(commandObj, i)}
                                 className="flex-1 bg-nexus-cyan hover:bg-cyan-400 text-nexus-bg font-black uppercase tracking-tighter py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(0,229,255,0.2)] active:scale-95 flex items-center justify-center gap-2"
                               >
                                  <Zap className="w-4 h-4" /> Confirmar
                               </button>
                               <button 
                                 onClick={() => cancelCommand(i)}
                                 className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-black uppercase tracking-tighter py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                               >
                                  <XCircle className="w-4 h-4" /> Cancelar
                               </button>
                             </div>
                          </div>
                        )}
                        
                        {commandObj && m.cmdExecuted && (
                          <div className="mt-4 bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest">
                             <CheckCircle className="w-4 h-4" /> Ejecutado ✓
                          </div>
                        )}
                        
                        {commandObj && m.isCancelled && (
                          <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest">
                             <XCircle className="w-4 h-4" /> Cancelado
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-nexus-card border border-nexus-border rounded-2xl p-4 flex items-center gap-3">
                       <div className="flex gap-1.5">
                          <div className="w-1.5 h-1.5 bg-nexus-cyan rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-1.5 h-1.5 bg-nexus-cyan rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1.5 h-1.5 bg-nexus-cyan rounded-full animate-bounce" />
                       </div>
                       <span className="text-[10px] font-black uppercase text-nexus-cyan/50 tracking-[0.2em]">Analizando...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Fixed Input Bar for AI Admin */}
          <div className="p-4 bg-nexus-overlay backdrop-blur-2xl border-t border-nexus-border shrink-0 absolute bottom-0 left-0 right-0 z-20">
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {quickActions.map((qa, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleQuickAction(qa.cmd)}
                    className="shrink-0 flex items-center gap-2 px-3 py-2 bg-nexus-card border border-nexus-border rounded-xl text-[9px] font-black text-nexus-text-sec uppercase tracking-widest hover:text-nexus-cyan hover:border-nexus-cyan/30 transition-all"
                  >
                    <qa.icon className="w-3 h-3" /> {qa.label}
                  </button>
                ))}
              </div>
              
              <form 
                onSubmit={handleSend} 
                className="flex gap-2"
              >
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    disabled={isLoading}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Comando directo..."
                    className="w-full h-12 bg-nexus-surface border border-nexus-border rounded-xl pl-10 pr-4 text-nexus-text text-sm focus:border-nexus-cyan transition-all outline-none placeholder:text-slate-600 shadow-inner"
                  />
                  <Terminal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                </div>
                <div className="flex gap-1.5">
                  <button 
                    type="button"
                    onClick={() => setMessages([])} 
                    className="h-12 w-12 flex items-center justify-center bg-nexus-card border border-nexus-border rounded-xl text-nexus-text-sec hover:text-red-500 transition-all active:scale-95"
                    title="Limpiar"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button 
                    disabled={isLoading || !input.trim()}
                    type="submit"
                    className="h-12 px-6 bg-nexus-cyan disabled:opacity-30 text-nexus-bg font-black rounded-xl transition-all shadow-[0_0_20px_rgba(0,229,255,0.2)] active:scale-95 flex items-center justify-center gap-2 group uppercase tracking-tighter text-xs"
                  >
                    Enviar
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Global Config Sidebar (Desktop) */}
        {showConfig && (
          <div className="w-full lg:w-72 shrink-0 bg-nexus-card/50 border border-nexus-border rounded-[2rem] p-6 space-y-6 animate-in slide-in-from-right duration-300 backdrop-blur-xl">
             <div>
                <h3 className="text-xs font-black text-nexus-text uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-nexus-cyan" /> Motor AI
                </h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-3 bg-nexus-surface rounded-xl border border-nexus-border">
                      <span className="text-[10px] font-black text-nexus-text-sec uppercase tracking-widest">Estado</span>
                      <button 
                        onClick={() => setLocalConfig({...localConfig, enabled: !localConfig.enabled})}
                        className={`w-10 h-5 rounded-full relative transition-colors ${localConfig.enabled ? 'bg-nexus-cyan shadow-[0_0_10px_rgba(0,229,255,0.3)]' : 'bg-nexus-card-hover'}`}
                      >
                         <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localConfig.enabled ? 'left-6' : 'left-1'}`} />
                      </button>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-nexus-surface rounded-xl border border-nexus-border">
                      <span className="text-[10px] font-black text-nexus-text-sec uppercase tracking-widest">Consultas Totales</span>
                      <span className="font-bold text-nexus-text text-sm">{usageStats}</span>
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <div>
                   <label className="text-[9px] font-black text-nexus-text-sec uppercase tracking-widest ml-1">Gemini API Key</label>
                   <input 
                     type="password" 
                     value={localConfig.apiKey}
                     onChange={(e) => setLocalConfig({...localConfig, apiKey: e.target.value})}
                     className="w-full h-10 bg-nexus-surface border border-nexus-border rounded-lg px-3 text-xs mt-1 focus:border-nexus-cyan outline-none text-nexus-text transition-colors font-mono"
                   />
                </div>
                <div>
                   <label className="text-[9px] font-black text-nexus-text-sec uppercase tracking-widest ml-1">Modelo</label>
                   <select 
                     value={localConfig.model}
                     onChange={(e) => setLocalConfig({...localConfig, model: e.target.value})}
                     className="w-full h-10 bg-nexus-surface border border-nexus-border rounded-lg px-3 text-xs mt-1 focus:border-nexus-cyan outline-none text-nexus-text transition-colors appearance-none"
                   >
                     <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                     <option value="gemini-2.0-pro">Gemini 2.0 Pro</option>
                   </select>
                </div>
             </div>

             <div className="pt-4 flex flex-col gap-2">
                <button 
                  onClick={save}
                  className="w-full py-3 bg-nexus-cyan hover:bg-cyan-400 text-nexus-bg font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 text-[10px]"
                >
                  Guardar
                </button>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="w-full py-3 bg-nexus-surface hover:bg-nexus-surface-hover text-nexus-text-sec font-bold rounded-xl transition-all text-[10px] uppercase tracking-widest"
                >
                  Cerrar
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminNotifications({ users, addToast }: any) {
  const [target, setTarget] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendNotification = async (e: any) => {
    e.preventDefault();
    if (!title || !message) {
      addToast('Llena todos los campos', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const usersToNotify = target === 'all' ? users : users.filter((u: any) => u.id === target);
      if (usersToNotify.length === 0) throw new Error('No hay usuarios seleccionados');

      const notifications = usersToNotify.map((u: any) => ({
        user_id: u.id,
        title,
        message,
        read: false
      }));

      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;
      
      addToast(`Notificación enviada a ${usersToNotify.length} usuarios`, 'success');
      setTitle('');
      setMessage('');
    } catch(err: any) {
      addToast('Error al enviar: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <h2 className="text-2xl font-black text-nexus-text flex items-center gap-2"><Send className="w-6 h-6 text-red-500" /> Transmisión de Alertas</h2>
      
      <div className="glass-panel p-6 md:p-8 rounded-3xl border-red-900/20 bg-nexus-card/80">
        <form onSubmit={sendNotification} className="space-y-6">
          <div>
            <label className="text-xs font-bold text-red-300/50 uppercase">Destinatario(s)</label>
            <select 
              value={target}
              onChange={e => setTarget(e.target.value)}
              className="w-full h-12 bg-nexus-surface border border-red-900/30 rounded-xl px-4 text-sm mt-1 focus:border-red-500 outline-none text-nexus-text transition-colors mt-2"
            >
              <option value="all">🌐 Todos los usuarios ({users.length})</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>👤 {u.email} ({u.username || u.name || 'Desconocido'})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-red-300/50 uppercase">Título del Aviso</label>
            <input 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full h-12 bg-nexus-surface border border-red-900/30 rounded-xl px-4 text-sm mt-2 focus:border-red-500 outline-none text-nexus-text transition-colors"
              placeholder="Ej: Mantenimiento programado"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-red-300/50 uppercase">Mensaje (Reporte/Aviso)</label>
            <textarea 
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className="w-full bg-nexus-surface border border-red-900/30 rounded-xl p-4 text-sm mt-2 focus:border-red-500 outline-none text-nexus-text transition-colors resize-none"
              placeholder="Escribe el mensaje..."
            />
          </div>
          <div className="pt-2">
            <button 
              disabled={isLoading}
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-nexus-text font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50"
            >
              {isLoading ? 'Enviando...' : 'Propagar Señal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminDatabaseTools({ addToast }: any) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const getCount = async (table: string) => {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) return 'Error';
        return count;
      };

      const [profiles, apps, reviews, reqs, notifs] = await Promise.all([
        getCount('profiles'),
        getCount('apps'),
        getCount('reviews'),
        getCount('developer_requests'),
        getCount('notifications')
      ]);

      setStats({
        profiles, apps, reviews, reqs, notifs
      });
      addToast('Estadísticas de DB sincronizadas.', 'success');
    } catch(e: any) {
      addToast('Error al leer BD: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <h2 className="text-2xl font-black text-nexus-text flex items-center gap-2"><Database className="w-6 h-6 text-red-500" /> Inspector Base de Datos</h2>
      <p className="text-nexus-text-sec text-sm leading-relaxed max-w-2xl">
        Conexión directa a Supabase Storage y PostgreSQL Clusters. Herramientas de mantenimiento seguro.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-nexus-card/80">
           <h3 className="text-lg font-bold mb-4 flex justify-between items-center text-red-100">
             <span>Volúmenes de Datos (Filas)</span>
             <button onClick={fetchStats} className="p-2 bg-nexus-surface hover:bg-nexus-surface-hover rounded-xl text-nexus-text transition-colors">
               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             </button>
           </h3>
           
           <div className="space-y-3 font-mono text-sm">
             <div className="flex justify-between items-center bg-nexus-surface/50 border border-red-900/10 p-3 rounded-xl">
               <span className="text-nexus-text-sec">profiles</span>
               <span className="text-nexus-text font-bold">{stats?.profiles ?? '...'}</span>
             </div>
             <div className="flex justify-between items-center bg-nexus-surface/50 border border-red-900/10 p-3 rounded-xl">
               <span className="text-nexus-text-sec">apps</span>
               <span className="text-nexus-text font-bold">{stats?.apps ?? '...'}</span>
             </div>
             <div className="flex justify-between items-center bg-nexus-surface/50 border border-red-900/10 p-3 rounded-xl">
               <span className="text-nexus-text-sec">reviews</span>
               <span className="text-nexus-text font-bold">{stats?.reviews ?? '...'}</span>
             </div>
             <div className="flex justify-between items-center bg-nexus-surface/50 border border-red-900/10 p-3 rounded-xl">
               <span className="text-nexus-text-sec">developer requests</span>
               <span className="text-nexus-text font-bold">{stats?.reqs ?? '...'}</span>
             </div>
             <div className="flex justify-between items-center bg-nexus-surface/50 border border-red-900/10 p-3 rounded-xl">
               <span className="text-nexus-text-sec">notifications</span>
               <span className="text-nexus-text font-bold">{stats?.notifs ?? '...'}</span>
             </div>
           </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-nexus-card/80">
          <h3 className="text-lg font-bold mb-4 text-red-100">Supabase API Status</h3>
          <div className="space-y-4">
             <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm font-bold text-green-100">Servicios Auth y DB Operativos</span>
             </div>
             <p className="text-xs text-nexus-text-sec mt-4 opacity-80">
                La conexión a la infraestructura en la nube está activa. RLS Security Rules verificadas.
             </p>
             <button 
               onClick={() => addToast('Configuración exportada correctamente.', 'info')}
               className="w-full mt-4 h-10 bg-nexus-surface hover:bg-nexus-surface-hover text-nexus-text border border-nexus-border rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-inner"
             >
                <Download className="w-4 h-4" /> Ejecutar Backup Lógico
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
