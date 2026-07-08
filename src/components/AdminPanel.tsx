import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Shield, Trash2, CheckCircle, XCircle, ChevronLeft, BarChart, 
  Smartphone, Users, Code, MessageSquare, List, Settings, BrainCircuit,
  Star, Activity, AlertTriangle, Search, Database, Menu, X,
  DollarSign, TrendingUp, Download, Eye, EyeOff, Edit, UploadCloud, Server,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { deleteFromCloudinary, deleteFolderFromCloudinary } from '../lib/cloudinary';
import { AppItem, DevRequest } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./admin/AdminUsers'));
const AdminApps = lazy(() => import('./admin/AdminApps'));
const AdminNotifications = lazy(() => import('./admin/AdminNotifications'));
const AdminStatistics = lazy(() => import('./admin/AdminStatistics'));
const AdminSettings = lazy(() => import('./admin/AdminViews2').then(m => ({ default: m.AdminSettings })));
const AdminAI = lazy(() => import('./admin/AdminViews2').then(m => ({ default: m.AdminAI })));
const AdminDatabaseTools = lazy(() => import('./admin/AdminViews2').then(m => ({ default: m.AdminDatabaseTools })));

import { useAppStore } from '../store/useAppStore';
const AdminSecurity = lazy(() => import('./admin/AdminSecurity').then(m => ({ default: m.AdminSecurity })));

interface AdminPanelProps {
  onBack: () => void;
  userProfile: any;
  apps: AppItem[];
  setApps: (u: any) => void;
  devRequests: DevRequest[];
  setDevRequests: (reqs: DevRequest[]) => void;
  aiConfig?: any;
}

export default function AdminPanel({ onBack, userProfile, apps, setApps, devRequests, setDevRequests, aiConfig }: AdminPanelProps) {
  const { t } = useAppStore();
  const isAdmin = userProfile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-nexus-bg text-nexus-text flex items-center justify-center p-6">
        <div className="bg-nexus-surface rounded-2xl p-8 max-w-md w-full border border-red-500/30 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold font-display text-white mb-2">Acceso Denegado</h2>
          <p className="text-nexus-text-sec mb-6">No tienes los privilegios necesarios para acceder al panel de administración.</p>
          <button onClick={onBack} className="w-full bg-nexus-card hover:bg-nexus-surface text-white py-3 rounded-xl transition-colors border border-nexus-border">
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('dashboard');
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, pending: 0, approved: 0, msgs: 0, reviews: 0 });
  
  
  const [maintenance, setMaintenance] = useState(() => localStorage.getItem('nexus_maintenance') === 'true');
  const [logs, setLogs] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('nexus_admin_logs') || '[]'); } catch { return []; }
  });

  const [infraStats, setInfraStats] = useState({
    supabasePing: 0,
    cloudinaryPing: 0,
    isSupabaseUp: true,
    isCloudinaryUp: true,
  });
  const [nodeStats, setNodeStats] = useState<any>(null);
  const [cloudStats, setCloudStats] = useState<any>(null);

  const [aiCmd, setAiCmd] = useState('');
  const [aiOutput, setAiOutput] = useState<string[]>([
     'NEXUS AI (Admin Mode) - Inicializado.',
     'Esperando directivas de sistema...'
  ]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Toast System
  const [toasts, setToasts] = useState<any[]>([]);
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
    addLog('SISTEMA', 'Toast', message, type);
  };



  // AdSense y métricas reales
  const [adsConfig, setAdsConfig] = useState<any>({ publisherId: '', clientId: '', active: false });
  const [siteSettings, setSiteSettings] = useState({
    platform_name: 'NexusPlay',
    logo_url: 'https://res.cloudinary.com/dpp9889/image/upload/v1/logos/nexus_logo.png',
    maintenance_mode: false,
    registrations_enabled: true
  });

  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*').single();
      if (!error && data) {
        setSiteSettings(data);
        setMaintenance(data.maintenance_mode);
      }
    } catch (e) {
      console.warn("Could not fetch site settings from DB");
    }
  };

  const updateSiteSettings = async (updates: Partial<typeof siteSettings>) => {
    try {
      // Guardar local antes para visualización reactiva
      if (updates.maintenance_mode !== undefined) {
        localStorage.setItem('nexus_maintenance_mode', updates.maintenance_mode.toString());
        window.dispatchEvent(new CustomEvent('nexusMaintenanceUpdated', { detail: updates.maintenance_mode }));
      }
      if (updates.logo_url !== undefined) {
        localStorage.setItem('nexus_web_logo', updates.logo_url);
        window.dispatchEvent(new CustomEvent('nexusLogoUpdated', { detail: updates.logo_url }));
      }

      // Intentar actualizar la fila 1 en Supabase
      const { error } = await supabase.from('site_settings').upsert({ id: 1, ...siteSettings, ...updates });
      if (!error) {
        setSiteSettings(prev => ({ ...prev, ...updates }));
        addLog('SISTEMA', 'Configuración', 'Ajustes globales actualizados permanentemente en DB', 'success');
        addToast('Configuración guardada en Base de Datos correctamente', 'success');
      } else {
        throw error;
      }
    } catch (e: any) {
      addLog('SISTEMA', 'Configuración', `Error DB al guardar settings: ${e.message}`, 'error');
      addToast(`Error DB: La configuración solo se guardó localmente. Por favor revisa la base de datos: ${e.message}`, 'error');
      setSiteSettings(prev => ({ ...prev, ...updates }));
    }
  };

  useEffect(() => {
    fetchAdsConfig();
    fetchSiteSettings();
  }, []);

  const fetchAdsConfig = async () => {
    const { data, error } = await supabase.from('settings').select('value').eq('key', 'ads_config').single();
    if (data && data.value) {
      setAdsConfig(data.value);
    }
  };

  const saveAdsConfig = async () => {
    const { error } = await supabase.from('settings').upsert({ key: 'ads_config', value: adsConfig });
    if(error) {
       addLog('ADSENSE', 'Configuración', `Error guardando: ${error.message}`, 'error');
       alert("Error guardando configuración AdSense. ¿Existe la tabla 'settings'?");
    } else {
       addLog('ADSENSE', 'Configuración', `AdSense actualizado en BD. Activo: ${adsConfig.active}`, 'success');
    }
  };

  const checkInfra = async () => {
     try {
       const { data: { session } } = await supabase.auth.getSession();
       const token = session?.access_token;
       const res = await fetch('/api/system-stats', {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
       });
       const data = await res.json();
       if (data.success) {
         setNodeStats(data.systemInfo);
         setCloudStats(data.cloudinaryUsage);
       }
     } catch (e) {}

     const startSupa = Date.now();
     try {
       await supabase.from('apps').select('id').limit(1);
       setInfraStats(s => ({...s, supabasePing: Date.now() - startSupa, isSupabaseUp: true}));
     } catch (e) {
       setInfraStats(s => ({...s, isSupabaseUp: false}));
     }

     const startCloud = Date.now();
     try {
       await fetch('https://res.cloudinary.com', { mode: 'no-cors' });
       setInfraStats(s => ({...s, cloudinaryPing: Date.now() - startCloud, isCloudinaryUp: true}));
     } catch (e) {
       setInfraStats(s => ({...s, isCloudinaryUp: false}));
     }
  };

  useEffect(() => {
    if (activeTab === 'infra') {
      checkInfra();
      const interval = setInterval(checkInfra, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isAdmin) {
       fetchMessages();
       fetchUsers();
       fetchAllReviews();
    }
  }, [isAdmin]);

  const fetchAllReviews = async () => {
    try {
      const { data } = await supabase.from('reviews').select('*').limit(500).order('created_at', { ascending: false }).limit(500);
      if (data) setAllReviews(data);
    } catch(e) {}
  };

  useEffect(() => {
    calculateStats();
  }, [apps, users, messages, allReviews]);

  // Modo Mantenimiento
  useEffect(() => {
    let el = document.getElementById('nexus-maintenance-banner');
    if (maintenance) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'nexus-maintenance-banner';
        el.className = 'fixed top-0 left-0 w-full bg-red-600 text-nexus-text font-black text-center py-1.5 z-[9999] uppercase tracking-[0.3em] text-xs shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center justify-center gap-4 animate-pulse';
        el.textContent = ' MODO MANTENIMIENTO ACTIVO - SISTEMA BLOQUEADO';
        const svgInfo = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgInfo.setAttribute("width", "14");
        svgInfo.setAttribute("height", "14");
        svgInfo.setAttribute("viewBox", "0 0 24 24");
        svgInfo.setAttribute("fill", "none");
        svgInfo.setAttribute("stroke", "currentColor");
        svgInfo.setAttribute("stroke-width", "2");
        const pathLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathLine.setAttribute("d", "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z");
        const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line1.setAttribute("x1", "12"); line1.setAttribute("y1", "9"); line1.setAttribute("x2", "12"); line1.setAttribute("y2", "13");
        const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line2.setAttribute("x1", "12"); line2.setAttribute("y1", "17"); line2.setAttribute("x2", "12.01"); line2.setAttribute("y2", "17");
        svgInfo.appendChild(pathLine);
        svgInfo.appendChild(line1);
        svgInfo.appendChild(line2);
        el.insertBefore(svgInfo, el.firstChild);
        document.body.appendChild(el);
      }
    } else {
      if (el) el.remove();
    }
  }, [maintenance]);

  const addLog = (action: string, entity: string, details: string, status: 'success' | 'error' | 'info') => {
    const newLog = { id: Date.now(), timestamp: new Date().toISOString(), action, entity, details, status };
    setLogs(prev => {
       const updated = [newLog, ...prev].slice(0, 500);
       localStorage.setItem('nexus_admin_logs', JSON.stringify(updated));
       return updated;
    });
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from('contact_messages').select('*').limit(500).order('created_at', { ascending: false }).limit(500);
    if (data) setMessages(data);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').limit(500).order('created_at', { ascending: false }).limit(500);
    if (data) setUsers(data);
  };

  const calculateStats = () => {
    setStats({
      users: users.length,
      pending: apps.filter(a => a.status === 'pending').length,
      approved: apps.filter(a => a.status === 'published').length,
      msgs: messages.length,
      reviews: allReviews.length
    });
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-nexus-bg text-red-500 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
        <div className="bg-nexus-card/50 p-12 rounded-3xl border border-red-500/20 backdrop-blur-md flex flex-col items-center text-center shadow-[0_0_50px_rgba(220,38,38,0.1)]">
          <Shield className="w-20 h-20 mb-6 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          <h1 className="text-4xl font-black mb-4 tracking-widest uppercase text-nexus-text">{t("admin.denied") || "Acceso Denegado"}</h1>
          <p className="text-red-400 mb-8 max-w-md font-light text-lg">{t("admin.deniedDesc") || "Área clasificada. Se requiere nivel de autorización supremo para visualizar este contenido."}</p>
          <button onClick={onBack} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-nexus-text font-bold py-4 px-10 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95" type="button" >
            <ChevronLeft className="w-5 h-5" /> {t("admin.retreat") || "Retirarse"}
          </button>
        </div>
      </div>
    );
  }

  // --- ACCIONES BACKEND RESTRICCIONES ---

  // Gestión de Desarrolladores
  const handleDevRequest = async (req: DevRequest, approve: boolean) => {
    const status = approve ? 'approved' : 'rejected';
;

    const { error } = await supabase.from('developer_requests').update({ status }).eq('id', req.id);
    if (error) {
;
        addLog('SOLICITUD DEV', req.name, `Error BD: ${error.message}`, 'error');
        return;
    }
    
    if (approve) {
       const { error: rErr } = await supabase.from('profiles').update({ role: 'developer' }).eq('id', req.userId);
       if (rErr) {
;
          addLog('SOLICITUD DEV', req.name, `Solicitud aprobada pero falló cambiar rol: ${rErr.message}`, 'error');
       } else {
;
          addLog('SOLICITUD DEV', req.name, `Aprobada y rol actualizado.`, 'success');
          // Actualizar local
          setUsers(prev => prev.map(u => u.id === req.userId ? { ...u, role: 'developer' } : u));
       }
    } else {
       addLog('SOLICITUD DEV', req.name, `Rechazada.`, 'info');
    }

    setDevRequests(devRequests.map(r => r.id === req.id ? { ...r, status } : r));
  };

  const deleteAdminReview = async (reviewId: string) => {
    if (!window.confirm("¿Eliminar esta reseña permanentemente?")) return;
    try {
      await supabase.from('reviews').delete().eq('id', reviewId);
      setAllReviews(prev => prev.filter(r => r.id !== reviewId));
      addLog('MODERACIÓN', reviewId, 'Reseña eliminada por Admin', 'success');
    } catch(e: any) {
      addLog('MODERACIÓN', reviewId, `Error al eliminar: ${e.message}`, 'error');
    }
  };


  // UI y Render
  const menu = [
    { id: 'dashboard', label: t('admin.tabDash') || 'Dashboard', icon: BarChart },
    { id: 'apps', label: t('admin.tabApps') || 'Aplicaciones', icon: Smartphone },
    { id: 'users', label: t('admin.tabUsers') || 'Usuarios', icon: Users },
    { id: 'notifications', label: t('admin.tabNotifs') || 'Notificaciones', icon: MessageSquare },
    { id: 'devs', label: t('admin.tabDevReqs') || 'Peticiones Dev', icon: Code },
    { id: 'reviews', label: t('admin.tabReviews') || 'Reseñas y Moderación', icon: Star },
    { id: 'db_tools', label: t('admin.tabDb') || 'Base de Datos', icon: Database },
    { id: 'monetization', label: t('admin.tabMonetiz') || 'Monetización', icon: DollarSign },
    { id: 'analytics', label: t('admin.tabAnalytics') || 'Analytics', icon: TrendingUp },
    { id: 'infra', label: t('admin.tabInfra') || 'Infraestructura', icon: Activity },
    { id: 'messages', label: t('admin.tabMessages') || 'Reportes', icon: MessageSquare },
    { id: 'logs', label: t('admin.tabLogs') || 'Logs Sistema', icon: List },
    { id: 'ai', label: 'NEXUS AI', icon: BrainCircuit },
    { id: 'settings', label: t('admin.tabSettings') || 'Configuración', icon: Settings },
    { id: 'security', label: 'Seguridad del Panel', icon: ShieldAlert },
  ];

  // Helper chart data real
  const last7Days = Array.from({length: 7}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return {
      name: d.toLocaleDateString('es-ES', {weekday: 'short'}),
      dateStr,
      nuevos_usuarios: users.filter(u => u.created_at?.startsWith(dateStr)).length,
      nuevas_apps: apps.filter(a => a.date?.startsWith(dateStr)).length,
    };
  });

  return (
    <div className="fixed inset-0 z-[100] bg-nexus-bg flex text-nexus-text font-sans selection:bg-red-500/30">
      
      {/* Mobile Top Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-950 to-transparent z-40 flex items-center px-4 justify-between pointer-events-none">
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className="pointer-events-auto p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 shadow-[0_0_15px_rgba(220,38,38,0.2)] active:scale-95 transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-nexus-bg/80 backdrop-blur-sm z-[105] transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Oscuro */}
      <aside className={`fixed inset-y-0 left-0 z-[110] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} w-72 md:w-80 border-r border-nexus-border bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col shadow-lg shrink-0`}>
        <div className="p-6 md:p-8 border-b border-nexus-border bg-gradient-to-b from-slate-800/30 to-transparent flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-red-500 tracking-tighter drop-shadow-sm">NEXUS<span className="text-nexus-text">ADMIN</span></h2>
              <span className="text-[9px] md:text-[10px] text-red-400/80 uppercase tracking-[0.2em] font-black block">{t("admin.level5") || "Acceso Nivel 5"}</span>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-nexus-text-sec hover:text-nexus-text bg-nexus-card/50 hover:bg-nexus-card-hover rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-3 md:p-4 flex-1 space-y-1 overflow-y-auto custom-scrollbar">
           {menu.map(m => (
             <button 
               key={m.id}
               onClick={() => { setActiveTab(m.id); setIsMobileMenuOpen(false); }}
               className={`w-full flex items-center gap-3 md:gap-4 px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all text-sm md:text-sm ${
                 activeTab === m.id ? 'bg-gradient-to-r from-red-500/10 to-transparent text-red-400 border border-red-500/20 shadow-inner' : 'text-nexus-text-sec hover:bg-nexus-card/50 hover:text-nexus-text'
               }`}
             >
               <m.icon className={`w-5 h-5 shrink-0 ${activeTab === m.id ? 'text-red-500' : 'text-nexus-text-sec'}`} /> 
               {m.label}
             </button>
           ))}
        </div>
        <div className="p-4 md:p-6 border-t border-nexus-border bg-nexus-card/40">
           <button onClick={onBack} className="w-full flex items-center justify-center gap-3 bg-nexus-card/50 hover:bg-nexus-card-hover border border-nexus-border/50 text-nexus-text font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 group uppercase tracking-widest text-[10px] md:text-xs" type="button" >
             <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-nexus-text-sec" /> Retirarse
           </button>
        </div>
      </aside>

      {/* AREA DE TOASTS */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-fade-in flex items-center gap-3 min-w-[300px] ${
            t.type === 'success' ? 'bg-green-950/80 border-green-500/50 text-green-400' :
            t.type === 'error' ? 'bg-red-950/80 border-red-500/50 text-red-400' :
            'bg-blue-950/80 border-blue-500/50 text-blue-400'
          }`}>
            {t.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
             t.type === 'error' ? <XCircle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
            <span className="font-bold text-sm">{t.message}</span>
          </div>
        ))}
      </div>

      {/* AREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 p-4 pt-20 sm:p-6 md:p-12 custom-scrollbar relative w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-10 pb-20 w-full">
          <Suspense fallback={<div className="flex h-[300px] items-center justify-center font-mono text-red-500 animate-pulse">{t('app.loading') || 'Cargando módulo...'}</div>}>
           
           {/* DASHBOARD */}
           {activeTab === 'dashboard' && (
             <AdminDashboard apps={apps} users={users} />
           )}

           {/* APLICACIONES */}
            {activeTab === 'apps' && (
              <AdminApps apps={apps} setApps={setApps} addToast={addToast} addLog={addLog} />
            )}
           

           {/* MONETIZACIÓN */}
           {activeTab === 'monetization' && (
             <div className="space-y-8 animate-fade-in w-full">
                <header>
                  <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-nexus-text">{t("admin.monAds") || "Monetización y AdSense"}</h3>
                  <p className="text-red-400 text-sm md:text-base">{t("admin.monAdsDesc") || "Gestión real de anuncios y configuración de red publicitaria."}</p>
                </header>

                <div className="bg-nexus-card/40 border border-red-500/10 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl">
                   <h4 className="text-xl font-bold text-nexus-text mb-6">{t("admin.adsState") || "Estado de Configuración AdSense"}</h4>
                   
                   <div className="space-y-4 max-w-lg">
                      <div className="flex items-center gap-4 mb-6">
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input 
                            type="checkbox" 
                            checked={adsConfig.active} 
                            onChange={e => setAdsConfig({...adsConfig, active: e.target.checked})} 
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 outline-none border border-red-900/40"></div>
                        </label>
                        <span className={`font-bold ${adsConfig.active ? 'text-green-500' : 'text-nexus-text-sec'}`}>{adsConfig.active ? (t('admin.adsActive') || 'Monetización Activa') : (t('admin.adsPaused') || 'Monetización Pausada')}</span>
                      </div>

                      {adsConfig.active && (
                        <div className="space-y-4 animate-fade-in">
                          <div>
                            <label className="block text-nexus-text-sec text-sm mb-2 font-bold uppercase tracking-widest">Publisher ID</label>
                            <input value={adsConfig.publisherId} onChange={e => setAdsConfig({...adsConfig, publisherId: e.target.value})} type="text" className="w-full bg-nexus-surface border border-red-900/30 focus:border-red-500 rounded-xl px-4 py-3 text-nexus-text outline-none font-mono text-sm shadow-inner" placeholder="pub-xxxxxxxxxxxxxxxx" />
                          </div>
                          <div>
                            <label className="block text-nexus-text-sec text-sm mb-2 font-bold uppercase tracking-widest">Client ID</label>
                            <input value={adsConfig.clientId} onChange={e => setAdsConfig({...adsConfig, clientId: e.target.value})} type="text" className="w-full bg-nexus-surface border border-red-900/30 focus:border-red-500 rounded-xl px-4 py-3 text-nexus-text outline-none font-mono text-sm shadow-inner" placeholder="ca-app-pub-xxxxxxxxxxxxxxxx" />
                          </div>
                        </div>
                      )}
                      
                      <button onClick={saveAdsConfig} className="bg-red-900/50 hover:bg-red-600 text-nexus-text font-bold px-8 py-3 rounded-xl mt-6 border border-red-900/50 shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-all" type="button" >{t("admin.saveConfig") || "Guardar Configuración"}</button>
                   </div>
                </div>

                {!adsConfig.active ? (
                   <div className="p-10 border border-red-900/20 bg-red-950/10 rounded-3xl mt-6 text-center">
                     <DollarSign className="w-12 h-12 mx-auto mb-4 text-red-900/50" />
                     <p className="text-nexus-text-sec max-w-md mx-auto">{t("admin.notConfig") || "AdSense no configurado o inactivo. No..."}</p>
                   </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-nexus-surface/40 border border-green-500/20 p-6 md:p-8 rounded-3xl shadow-xl backdrop-blur-sm">
                      <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-2">{t("admin.pubIdSaved") || "Publisher ID Guardado"}</p>
                      <p className="text-xl font-mono text-nexus-text">{adsConfig.publisherId || 'Pendiente'}</p>
                    </div>
                    <div className="bg-nexus-card/40 border border-blue-500/20 p-6 md:p-8 rounded-3xl shadow-xl backdrop-blur-sm">
                      <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">{t("admin.adNetwork") || "Red de Anuncios"}</p>
                      <p className="text-xl font-black text-nexus-text">Google AdSense</p>
                    </div>
                  </div>
                )}
             </div>
           )}

           {/* ANALYTICS */}
           {activeTab === 'reviews' && (
             <div className="space-y-8 animate-fade-in w-full">
                <header>
                  <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-nexus-text">{t("admin.modCenter") || "Central de Moderación"}</h3>
                  <p className="text-red-400 text-sm md:text-base">{t("admin.modDesc") || "Control de calidad y bloqueo de reseñas y comentarios."}</p>
                </header>
                
                <div className="space-y-4 md:space-y-6">
                  {allReviews.length === 0 && <p className="text-nexus-text-sec bg-nexus-card/40 p-8 md:p-10 rounded-2xl md:rounded-3xl border border-red-500/10 text-center">{t("admin.noReviews") || "No hay reseñas publicadas en la plataforma."}</p>}
                  {allReviews.map(rev => {
                    // Match app name
                    const relatedApp = apps.find(a => a.id === rev.app_id);
                    return (
                      <div key={rev.id} className="bg-nexus-card/40 border border-red-500/10 p-5 md:p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-4 group hover:border-red-500/30 transition-colors backdrop-blur-sm">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                             <span className="text-sm font-bold text-nexus-text">{rev.user_name || 'Desconocido'}</span>
                             <span className="text-[10px] text-nexus-text-sec bg-nexus-card py-0.5 px-2 rounded border border-nexus-border uppercase tracking-widest">{relatedApp?.name || 'App Elimiada/Desconocida'}</span>
                             <span className="text-xs text-nexus-text-sec ml-auto">{new Date(rev.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-3">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm text-yellow-500 font-bold">{rev.rating}.0</span>
                          </div>
                          <p className="text-nexus-text text-sm leading-relaxed">{rev.comment}</p>
                        </div>
                        <div className="shrink-0 flex items-center justify-end sm:flex-col sm:justify-start">
                          <button onClick={() => deleteAdminReview(rev.id)} className="bg-red-950/30 border border-red-900/30 text-red-500 hover:bg-red-600 hover:text-nexus-text p-2 rounded-xl text-xs font-bold transition-all" title="Eliminar Reseña">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
           )}

           {/* ANALYTICS */}
           {activeTab === 'analytics' && (
             <AdminStatistics apps={apps} users={users} />
           )}

           {/* INFRAESTRUCTURA Y SISTEMA */}
           {activeTab === 'infra' && (
             <div className="space-y-8 animate-fade-in w-full">
                <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-nexus-text">{t("admin.sysInfra") || "Sistema e Infraestructura"}</h3>
                    <p className="text-red-400 text-sm md:text-base">Métricas en tiempo real de los servicios y dependencias.</p>
                  </div>
                  <button onClick={checkInfra} className="bg-red-950/30 hover:bg-red-900/60 border border-red-900/40 text-red-400 rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2" type="button" >
                    <Activity className="w-4 h-4" /> Refrescar Ping
                  </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* SUPABASE CARD */}
                  <div className={`p-6 md:p-8 rounded-3xl border ${infraStats.isSupabaseUp ? 'bg-nexus-card/40 border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]'} relative overflow-hidden group backdrop-blur-sm`}>
                     <div className="absolute top-6 right-6 flex items-center gap-2">
                        {infraStats.isSupabaseUp ? (
                          <span className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> Online</span>
                        ) : (
                          <span className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/> Offline / Error</span>
                        )}
                     </div>
                     <Database className={`w-12 h-12 mb-4 ${infraStats.isSupabaseUp ? 'text-green-500/80' : 'text-red-500'}`} />
                     <h4 className="text-2xl font-black text-nexus-text mb-2">{t("admin.db") || "Base de Datos"}</h4>
                     <p className="text-nexus-text-sec text-sm max-w-sm mb-6">Supabase PostgreSQL y funciones Serverless de autenticación.</p>
                     
                     <div className="grid grid-cols-2 gap-4 border-t border-nexus-border pt-6">
                       <div>
                         <p className="text-[10px] text-nexus-text-sec uppercase tracking-widest mb-1">Latencia DB (Ping)</p>
                         <p className="text-xl font-mono text-nexus-text">{infraStats.supabasePing} ms</p>
                       </div>
                       <div>
                         <p className="text-[10px] text-nexus-text-sec uppercase tracking-widest mb-1">Total Registros (Apps)</p>
                         <p className="text-xl font-mono text-nexus-text">{apps.length}</p>
                       </div>
                       <div>
                         <p className="text-[10px] text-nexus-text-sec uppercase tracking-widest mb-1">Usuarios Auth</p>
                         <p className="text-xl font-mono text-nexus-text">{users.length}</p>
                       </div>
                       <div>
                         <p className="text-[10px] text-nexus-text-sec uppercase tracking-widest mb-1">Solicitudes Dev</p>
                         <p className="text-xl font-mono text-nexus-text">{devRequests.length}</p>
                       </div>
                     </div>
                  </div>

                   {/* CLOUDINARY CARD */}
                  <div className={`p-6 md:p-8 rounded-3xl border ${infraStats.isCloudinaryUp ? 'bg-nexus-card/40 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]'} relative overflow-hidden group backdrop-blur-sm`}>
                     <div className="absolute top-6 right-6 flex items-center gap-2">
                        {infraStats.isCloudinaryUp ? (
                          <span className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/> Online</span>
                        ) : (
                          <span className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/> Offline / CORS</span>
                        )}
                     </div>
                     <UploadCloud className={`w-12 h-12 mb-4 ${infraStats.isCloudinaryUp ? 'text-blue-500/80' : 'text-red-500'}`} />
                     <h4 className="text-2xl font-black text-nexus-text mb-2">{t("admin.cdn") || "Almacenamiento CDN"}</h4>
                     <p className="text-nexus-text-sec text-sm max-w-sm mb-6">Cloudinary Media Delivery, transformación y persistencia binaria.</p>
                     
                     <div className="grid grid-cols-2 gap-4 border-t border-nexus-border pt-6">
                       <div>
                         <p className="text-[10px] text-nexus-text-sec uppercase tracking-widest mb-1">Latencia Envío (Ping)</p>
                         <p className="text-xl font-mono text-nexus-text">{infraStats.cloudinaryPing} ms</p>
                       </div>
                       <div>
                         <p className="text-[10px] text-nexus-text-sec uppercase tracking-widest mb-1">Iconos Indexados</p>
                         <p className="text-xl font-mono text-nexus-text">{apps.filter(x => x.iconPublicId).length}</p>
                       </div>
                       <div className="col-span-2 mt-2">
                         <div className="flex justify-between text-[10px] text-nexus-text-sec uppercase tracking-widest mb-2">
                           <span>Uso Storage CDN (Real)</span>
                           <span className="text-blue-400">{cloudStats?.storage?.usage !== undefined ? (cloudStats.storage.usage / 1024 / 1024).toFixed(2) + ' MB' : 'Calculando...'}</span>
                         </div>
                         <div className="w-full bg-nexus-surface rounded-full h-1.5 border border-nexus-border">
                           <div className={`h-1.5 rounded-full ${apps.length > 50 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, ((cloudStats?.storage?.usage || 0) / (100 * 1024 * 1024)) * 100)}%` }}></div>
                         </div>
                       </div>
                     </div>
                  </div>

                   {/* HOST SERVER CARD */}
                  {nodeStats && (
                  <div className={`p-6 md:p-8 rounded-3xl border bg-nexus-card/40 border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.1)] relative overflow-hidden group col-span-1 md:col-span-2 backdrop-blur-sm`}>
                     <Server className={`w-12 h-12 mb-4 text-purple-500/80`} />
                     <h4 className="text-2xl font-black text-nexus-text mb-2">Host Server (Vercel)</h4>
                     <p className="text-nexus-text-sec text-sm max-w-sm mb-6">Métricas en tiempo real del entorno anfitrión y uso de recursos.</p>
                     
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-nexus-border pt-6">
                       {nodeStats.vercelAvailable ? (
                         <>
                           <div>
                             <p className="text-[10px] text-nexus-text-sec uppercase tracking-widest mb-1">Uptime Nodo</p>
                             <p className="text-xl font-mono text-nexus-text">{Math.floor(nodeStats.processUptime / 60)} min</p>
                           </div>
                           <div>
                             <p className="text-[10px] text-nexus-text-sec uppercase tracking-widest mb-1">Plataforma</p>
                             <p className="text-xl font-mono text-nexus-text max-w-[120px] truncate">{nodeStats.osPlatform}</p>
                           </div>
                           <div>
                             <p className="text-[10px] text-nexus-text-sec uppercase tracking-widest mb-1">Total RAM</p>
                             <p className="text-xl font-mono text-nexus-text">{(nodeStats.totalMem / 1024 / 1024 / 1024).toFixed(2)} GB</p>
                           </div>
                           <div>
                             <p className="text-[10px] text-nexus-text-sec uppercase tracking-widest mb-1">RAM Libre</p>
                             <p className="text-xl font-mono text-nexus-text">{(nodeStats.freeMem / 1024 / 1024 / 1024).toFixed(2)} GB</p>
                           </div>
                         </>
                       ) : (
                         <div className="col-span-4 p-4 border border-nexus-border rounded-xl bg-nexus-surface text-center">
                            <p className="text-nexus-text-sec font-mono">Dato no disponible. API Token no configurado.</p>
                         </div>
                       )}
                     </div>
                     
                     {nodeStats.vercelAvailable && (
                       <div className="mt-6 border-t border-nexus-border pt-6">
                          <div className="flex justify-between text-[10px] text-nexus-text-sec uppercase tracking-widest mb-2">
                             <span>Uso CPU (Promedio Core)</span>
                             <span className="text-purple-400">{nodeStats.cpuCores} Cores Activos</span>
                          </div>
                          <div className="w-full bg-nexus-surface rounded-full h-1.5 border border-nexus-border overflow-hidden">
                             <div className={`h-1.5 rounded-full bg-purple-500`} style={{ width: `70%` }}></div>
                          </div>
                       </div>
                     )}
                  </div>
                  )}
                </div>

                {(!infraStats.isSupabaseUp || !infraStats.isCloudinaryUp) && (
                  <div className="p-6 bg-red-950/20 border border-red-500/50 rounded-2xl flex items-start gap-4">
                     <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
                     <div>
                       <h5 className="font-bold text-nexus-text text-lg mb-1">¡Alerta Crítica de Sistema!</h5>
                       <p className="text-red-300 text-sm font-mono leading-relaxed">
                         {!infraStats.isSupabaseUp && "ERROR 0xDB: Pérdida prolongada de conexión con la capa PostgreSQL de Supabase. Revisa las políticas o el límite de recursos mensuales. "}
                         {!infraStats.isCloudinaryUp && "ERROR 0xCD: Las comprobaciones de latencia contra los nodos de Cloudinary han fallado. Posibles bloqueos CORS o interrupciones de red general."}
                       </p>
                     </div>
                  </div>
                )}
             </div>
           )}

           {/* USUARIOS */}
           {activeTab === 'users' && (
             <AdminUsers users={users} setUsers={setUsers} addToast={addToast} />
           )}

           {/* NOTIFICACIONES */}
           {activeTab === 'notifications' && (
             <AdminNotifications users={users} addToast={addToast} />
           )}

           {/* BASE DE DATOS */}
           {activeTab === 'db_tools' && (
             <AdminDatabaseTools addToast={addToast} />
           )}

           {/* DESARROLLADORES */}
           {activeTab === 'devs' && (
             <div className="space-y-8 animate-fade-in">
                <header>
                  <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-nexus-text">{t("admin.devQueue") || "Cola de Credenciales Dev"}</h3>
                  <p className="text-red-400 text-sm md:text-base">Peticiones de acceso API y consola.</p>
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                   {devRequests.filter(r => r.status === 'pending').length === 0 && <p className="text-nexus-text-sec col-span-full">Sin peticiones nuevas.</p>}
                  {devRequests.filter(r => r.status === 'pending').map(req => (
                    <div key={req.id} className="bg-nexus-card/40 border border-red-500/10 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl flex flex-col h-full hover:border-red-500/30 transition-colors backdrop-blur-sm">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="font-bold text-nexus-text text-xl">{req.name}</h4>
                            <p className="text-sm font-bold text-red-500 mt-1 uppercase tracking-wider">{req.company}</p>
                            <p className="text-xs text-nexus-text-sec mt-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"/> Exp: {req.experience}</p>
                          </div>
                       </div>
                       <div className="flex-1">
                          <p className="text-sm text-nexus-text bg-nexus-surface p-5 rounded-2xl border border-nexus-border mb-6 leading-relaxed italic shadow-inner">"{req.message}"</p>
                       </div>
                       <div className="flex gap-4 mt-auto">
                         <button onClick={() => handleDevRequest(req, true)} className="flex-1 bg-red-600 hover:bg-red-500 text-nexus-text font-black py-4 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] flex justify-center items-center gap-2 active:scale-95 uppercase tracking-wider">
                           <CheckCircle className="w-5 h-5" /> Conceder
                         </button>
                         <button onClick={() => handleDevRequest(req, false)} className="flex-1 bg-red-950/20 hover:bg-red-900/40 border border-red-900/30 text-nexus-text font-bold py-4 rounded-xl text-sm transition-all flex justify-center items-center gap-2 active:scale-95 uppercase tracking-wider">
                           <XCircle className="w-5 h-5" /> Denegar
                         </button>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {/* MENSAJES */}
           {activeTab === 'messages' && (
             <div className="space-y-8 animate-fade-in">
                <header>
                  <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-nexus-text">{t("admin.extTrans") || "Transmisiones Externas"}</h3>
                  <p className="text-red-400 text-sm md:text-base">Buzón de comunicaciones y reportes.</p>
                </header>
                <div className="space-y-4 md:space-y-6">
                  {messages.length === 0 && <p className="text-nexus-text-sec bg-nexus-card/40 p-8 md:p-10 rounded-2xl md:rounded-3xl border border-red-500/10 text-center">Bandeja cifrada vacía.</p>}
                  {messages.map(msg => (
                    <div key={msg.id} className="bg-nexus-card/40 border border-red-500/10 p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-xl flex flex-col sm:flex-row gap-4 md:gap-6 group hover:border-red-500/30 transition-colors backdrop-blur-sm">
                       <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 bg-red-500/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-red-500/20 mt-1">
                          <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                       </div>
                       <div className="flex-1 w-full overflow-hidden">
                         <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                            <h4 className="font-bold text-nexus-text text-lg md:text-xl tracking-tight truncate">{msg.subject}</h4>
                            <span className="self-start sm:self-auto text-[10px] md:text-xs font-black text-nexus-text-sec bg-nexus-surface border border-nexus-border px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl uppercase tracking-widest whitespace-nowrap">{new Date(msg.created_at).toLocaleDateString()}</span>
                         </div>
                         <p className="text-xs md:text-sm font-bold text-red-400 mt-1 mb-3 md:mb-4 truncate">{msg.name} <span className="opacity-50 mx-1">|</span> {msg.email}</p>
                         <p className="text-sm md:text-base text-nexus-text leading-relaxed bg-nexus-surface p-4 md:p-6 rounded-xl md:rounded-2xl border border-nexus-border shadow-inner whitespace-pre-wrap word-break">{msg.message}</p>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {/* LOGS */}
           {activeTab === 'logs' && (
             <div className="space-y-8 animate-fade-in">
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-nexus-text">{t("admin.sysLogs") || "Registros del Sistema"}</h3>
                    <p className="text-red-400 text-sm md:text-base">Monitoreo absoluto de actividades críticas.</p>
                  </div>
                  <button onClick={() => { localStorage.removeItem('nexus_admin_logs'); setLogs([]); }} className="bg-nexus-card hover:bg-red-900/40 text-nexus-text-sec hover:text-nexus-text px-4 py-2 rounded-xl text-sm font-bold transition-all border border-transparent hover:border-red-900/30 flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
                    <Trash2 className="w-4 h-4"/> Limpiar Buffer
                  </button>
                 </header>
                <div className="bg-nexus-card/40 border border-red-500/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
                   <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full text-left text-sm text-nexus-text-sec">
                        <thead className="bg-nexus-surface text-xs uppercase font-black tracking-widest text-red-600 border-b border-red-900/20">
                          <tr>
                            <th className="px-6 py-5">{t("admin.logCol1") || "Timestamp"}</th>
                            <th className="px-6 py-5">{t("admin.logCol2") || "Categoría"}</th>
                            <th className="px-6 py-5">{t("admin.logCol3") || "Entidad"}</th>
                            <th className="px-6 py-5">{t("admin.logCol4") || "Detalle"}</th>
                            <th className="px-6 py-5">{t("admin.logCol5") || "Estado"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-900/10 font-mono">
                          {logs.map(log => (
                            <tr key={log.id} className="hover:bg-red-950/10 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-nexus-text font-bold">{log.action}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{log.entity}</td>
                              <td className="px-6 py-4 truncate max-w-xs" title={log.details}>{log.details}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 rounded border ${log.status === 'success' ? 'bg-green-950/30 text-green-500 border-green-900/30' : log.status === 'error' ? 'bg-red-950/30 text-red-500 border-red-900/30' : 'bg-blue-950/30 text-blue-500 border-blue-900/30'}`}>
                                  {log.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                     </table>
                     {logs.length === 0 && <div className="p-10 text-center text-gray-600">No hay registros generados en esta sesión.</div>}
                   </div>
                </div>
             </div>
           )}

           {/* SETTINGS */}
           {activeTab === 'security' && (
             <AdminSecurity addToast={addToast} />
           )}
           
           {activeTab === 'settings' && (
             <AdminSettings 
                settings={{ 
                  storeName: siteSettings.platform_name, 
                  slogan: 'NexusPlay Gaming Network', 
                  maintenanceMode: siteSettings.maintenance_mode,
                  registrationsEnabled: siteSettings.registrations_enabled,
                  logoUrl: siteSettings.logo_url
                }} 
                setSettings={async (newSetts: any) => {
                  await updateSiteSettings({
                    platform_name: newSetts.storeName,
                    maintenance_mode: newSetts.maintenanceMode,
                    registrations_enabled: newSetts.registrationsEnabled,
                    logo_url: newSetts.logoUrl
                  });
                }} 
                addToast={addToast} 
             />
           )}

           {/* AI ADMIN */}
           {activeTab === 'ai' && (
             <AdminAI 
               apps={apps} 
               setApps={setApps} 
               users={users} 
               setUsers={setUsers} 
               requests={devRequests} 
               setRequests={setDevRequests} 
               config={{
                  enabled: true,
                  apiKey: '',
                  model: 'gemini-2.5-flash'
               }}
               setConfig={(newConf: any) => {
;
               }}
               addToast={addToast} 
             />
           )}

          </Suspense>
        </div>
      </main>
    </div>
  );
}
