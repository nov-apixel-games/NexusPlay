import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, Upload, Users, Settings, LogOut, 
  ChevronRight, ArrowRight, ArrowLeft, Star, Download, Sparkles, ShieldCheck,
  AlertCircle, MessageSquare, Activity, Plus, Smartphone, Globe,
  RefreshCw, Trash2, Edit, ExternalLink, Search, Filter, Check, Menu, X as CloseIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import PublishingWizard from './PublishingWizard';

interface DeveloperConsoleProps {
  userId: string;
  userProfile: any;
  onClose: () => void;
  onAddApp: (app: any) => void;
  publishedApps: any[];
}

type Tab = 'dashboard' | 'apps' | 'publish' | 'analytics' | 'settings';

export default function DeveloperConsole({ userId, userProfile, onClose, onAddApp, publishedApps: initialApps }: DeveloperConsoleProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apps, setApps] = useState(initialApps);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDownloads: 0,
    avgRating: 0,
    appCount: 0
  });

  useEffect(() => {
    fetchDeveloperData();
  }, [userId]);

  const fetchDeveloperData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .eq('developer_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setApps(data);
        // Calculate stats
        const downloads = data.reduce((acc, app) => acc + (parseInt(app.downloads) || 0), 0);
        const ratings = data.filter(app => app.rating).map(app => parseFloat(app.rating));
        const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 5.0;
        
        setStats({
          totalDownloads: downloads,
          avgRating: parseFloat(avg.toFixed(1)),
          appCount: data.length
        });
      }
    } catch (e) {
      console.error("Error fetching dev data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Consola Principal', icon: LayoutDashboard },
    { id: 'apps', label: 'Mis Aplicaciones', icon: Package },
    { id: 'publish', label: 'Publicar Nueva App', icon: Upload, highlight: true },
    { id: 'analytics', label: 'Estadísticas', icon: Activity },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const handleAppPublished = (newApp: any) => {
    setApps([newApp, ...apps]);
    onAddApp(newApp);
    setActiveTab('apps');
    fetchDeveloperData();
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-nexus-card overflow-hidden animate-in fade-in duration-500">
      {/* MOBILE SIDEBAR OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-nexus-surface backdrop-blur-sm z-[110] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-[120] w-80 border-r border-nexus-border flex flex-col bg-nexus-surface backdrop-blur-xl transition-transform duration-300 lg:relative lg:translate-x-0 lg:bg-nexus-surface
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 pb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-nexus-glow">
               <Smartphone className="w-6 h-6 text-nexus-bg" />
            </div>
            <div>
              <h1 className="text-xl font-black text-nexus-text tracking-tighter uppercase leading-none">Nexus Console</h1>
              <p className="text-[8px] font-black text-nexus-text/40 tracking-[0.3em] uppercase mt-1">SISTEMA MULTI-NODAL</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 lg:hidden">
            <CloseIcon className="w-6 h-6 text-nexus-text-sec" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as Tab)}
                className={`
                   w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group relative
                   ${isActive ? 'bg-white text-nexus-bg font-black' : 'text-nexus-text-sec hover:text-nexus-text hover:bg-nexus-card'}
                   ${item.highlight && !isActive ? 'border border-cyan-500/30 bg-cyan-500/5 text-cyan-400' : ''}
                `}
              >
                {isActive && (
                  <motion.div layoutId="active-indicator" className="absolute left-2 w-1.5 h-6 bg-cyan-500 rounded-full" />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'text-nexus-bg' : item.highlight ? 'text-cyan-400' : 'text-nexus-text-sec group-hover:text-nexus-text'}`} />
                <span className="text-xs uppercase tracking-widest leading-none">{item.label}</span>
                {item.highlight && !isActive && (
                  <div className="absolute right-4 w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="bg-nexus-card/50 rounded-3xl p-6 border border-nexus-border space-y-4">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-nexus-card-hover ring-2 ring-cyan-500/30">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} alt="Avatar" />
                </div>
                <div className="min-w-0">
                   <p className="text-xs font-black text-nexus-text truncate uppercase tracking-tight">{userProfile?.username || 'Desarrollador'}</p>
                   <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">{userProfile?.role}</p>
                </div>
             </div>
             <button onClick={onClose} className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-nexus-text transition-all text-[10px] font-black uppercase tracking-widest">
               <LogOut className="w-4 h-4" /> Cerrar Sesión
             </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
         {activeTab === 'publish' ? (
           <PublishingWizard 
             developerId={userId} 
             onSuccess={handleAppPublished} 
             onCancel={() => setActiveTab('dashboard')} 
           />
         ) : (
           <>
              {/* Top Bar */}
              <div className="h-20 shrink-0 border-b border-nexus-border flex items-center justify-between px-4 lg:px-12 bg-nexus-surface">
                <div className="flex items-center gap-3 lg:gap-4">
                  <button onClick={onClose} className="p-2 hover:bg-nexus-card rounded-xl hidden lg:flex items-center justify-center text-nexus-text-sec hover:text-nexus-text transition-colors">
                     <ArrowLeft className="w-6 h-6" />
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-nexus-card rounded-xl lg:hidden flex items-center justify-center text-nexus-text-sec hover:text-nexus-text transition-colors">
                     <ArrowLeft className="w-6 h-6" />
                  </button>
                  <button onClick={() => setIsSidebarOpen(true)} className="p-2 lg:hidden hover:bg-nexus-card rounded-xl">
                    <Menu className="w-6 h-6 text-nexus-text" />
                  </button>
                  <h2 className="text-xl lg:text-2xl font-black text-nexus-text uppercase tracking-tighter truncate">
                    {menuItems.find(m => m.id === activeTab)?.label}
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                   <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-nexus-card rounded-full border border-nexus-border">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-nexus-text-sec uppercase tracking-widest">Online</span>
                   </div>
                   <button onClick={() => setActiveTab('publish')} className="p-2.5 bg-white text-nexus-bg hover:bg-cyan-500 rounded-xl transition-colors">
                     <Plus className="w-6 h-6" />
                   </button>
                </div>
              </div>

              {/* View Content */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-12 custom-scrollbar">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-6xl mx-auto"
                  >
                    {activeTab === 'dashboard' && (
                      <div className="space-y-8 lg:space-y-12">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                          {[
                            { label: 'Aplicaciones', value: stats.appCount, icon: Package, color: 'text-cyan-400', bg: 'bg-cyan-500/5' },
                            { label: 'Descargas Totales', value: stats.totalDownloads, icon: Download, color: 'text-purple-400', bg: 'bg-purple-500/5' },
                            { label: 'Rating', value: stats.avgRating, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/5' },
                          ].map((stat, idx) => (
                            <div key={idx} className={`${stat.bg} p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-nexus-border space-y-4 hover:border-nexus-border transition-all hover:translate-y-[-4px]`}>
                               <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl ${stat.bg} border border-nexus-border flex items-center justify-center ${stat.color}`}>
                                 <stat.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                               </div>
                               <div>
                                 <p className="text-[10px] font-black text-nexus-text-sec uppercase tracking-widest mb-1">{stat.label}</p>
                                 <p className="text-3xl lg:text-4xl font-black text-nexus-text tracking-tighter leading-none">{stat.value}</p>
                               </div>
                            </div>
                          ))}
                        </div>

                        {/* Recent Activity / Quick Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                           <div className="lg:col-span-2 space-y-6">
                              <div className="flex items-center justify-between">
                                 <h3 className="text-xl font-black text-nexus-text uppercase tracking-tighter">Últimos Lanzamientos</h3>
                                 <button onClick={() => setActiveTab('apps')} className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                                   Ver todo <ArrowRight className="w-4 h-4" />
                                 </button>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-4">
                                {apps.slice(0, 3).map((app) => (
                                  <div key={app.id} className="p-4 lg:p-6 bg-nexus-card/50 border border-nexus-border rounded-3xl flex items-center gap-4 lg:gap-6 hover:bg-nexus-card/50 transition-all">
                                     <img src={app.icon_url} className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl object-cover shrink-0" />
                                     <div className="flex-1 min-w-0">
                                        <h4 className="text-base lg:text-lg font-black text-nexus-text truncate uppercase tracking-tight">{app.app_name}</h4>
                                        <p className="text-[10px] lg:text-xs text-nexus-text-sec flex items-center gap-2">
                                           <span className="uppercase font-bold">{app.category}</span>
                                           <span className="w-1 h-1 rounded-full bg-gray-700" />
                                           <span>v{app.version}</span>
                                        </p>
                                     </div>
                                     <div className="text-right flex items-center gap-3 lg:gap-6 shrink-0">
                                        <div className="hidden sm:block">
                                           <p className="text-[10px] lg:text-xs font-black text-nexus-text whitespace-nowrap">{app.downloads} Descargas</p>
                                           <div className="flex items-center gap-1 text-yellow-500 mt-1 pointer-events-none">
                                              <Star className="w-3 h-3 fill-current" />
                                              <span className="text-[10px] font-black uppercase text-nexus-text-sec">{app.rating}</span>
                                           </div>
                                        </div>
                                        <button className="p-2 lg:p-3 bg-nexus-card hover:bg-white text-nexus-text hover:text-nexus-bg rounded-xl transition-all">
                                           <ExternalLink className="w-4 h-4 lg:w-5 lg:h-5" />
                                        </button>
                                     </div>
                                  </div>
                                ))}
                                {apps.length === 0 && (
                                  <div className="p-12 bg-nexus-card/50 border border-dashed border-nexus-border rounded-3xl text-center">
                                     <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                                     <p className="text-nexus-text-sec font-bold uppercase text-xs">No hay aplicaciones publicadas aún.</p>
                                     <button onClick={() => setActiveTab('publish')} className="mt-4 text-cyan-400 font-black uppercase text-[10px] hover:underline">Comenzar ahora</button>
                                  </div>
                                )}
                              </div>
                           </div>

                           <div className="space-y-6">
                              <h3 className="text-xl font-black text-nexus-text uppercase tracking-tighter">Cuenta Developer</h3>
                              <div className="p-6 lg:p-8 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-[2rem] lg:rounded-[2.5rem] space-y-6">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center text-nexus-bg">
                                       <ShieldCheck className="w-7 h-7" />
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-black text-nexus-text uppercase tracking-widest">Nivel</p>
                                       <p className="text-lg font-black text-cyan-400 uppercase tracking-tighter">Premium</p>
                                    </div>
                                 </div>
                                 <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                       <span className="text-nexus-text-sec">Reputación</span>
                                       <span className="text-nexus-text">Excelente</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-nexus-card-hover rounded-full overflow-hidden">
                                       <div className="w-[90%] h-full bg-cyan-500 shadow-nexus-glow" />
                                    </div>
                                 </div>
                                 <ul className="space-y-3 pt-4 border-t border-nexus-border">
                                    <li className="flex items-center gap-3 text-[10px] font-bold text-nexus-text-sec">
                                       <Check className="w-4 h-4 text-cyan-500" /> API KEY ACTIVA
                                    </li>
                                    <li className="flex items-center gap-3 text-[10px] font-bold text-nexus-text-sec">
                                       <Check className="w-4 h-4 text-cyan-500" /> ILIMITADO
                                    </li>
                                    <li className="flex items-center gap-3 text-[10px] font-bold text-nexus-text-sec">
                                       <Check className="w-4 h-4 text-cyan-500" /> SOPORTE VÍP
                                    </li>
                                 </ul>
                              </div>
                              
                              <div className="p-4 lg:p-6 bg-nexus-card rounded-3xl border border-nexus-border flex items-center justify-between">
                                 <div>
                                    <p className="text-[10px] font-black text-nexus-text-sec uppercase tracking-widest mb-1">Feedback</p>
                                    <p className="text-xs lg:text-sm font-black text-nexus-text">24 Comentarios</p>
                                 </div>
                                 <div className="relative">
                                    <MessageSquare className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400" />
                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-500 rounded-full border-2 border-black" />
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'apps' && (
                       <div className="space-y-8">
                          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                             <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-nexus-text-sec" />
                                <input 
                                  placeholder="BUSCAR APP..." 
                                  className="w-full bg-nexus-surface border border-nexus-border p-3 lg:p-4 pl-12 rounded-2xl focus:border-cyan-500 outline-none uppercase font-black text-[10px] lg:text-xs tracking-widest"
                                />
                             </div>
                             <div className="flex gap-2">
                                <button className="flex-1 lg:flex-none px-4 lg:px-6 py-3 lg:py-4 bg-nexus-card border border-nexus-border rounded-2xl flex items-center justify-center gap-2 hover:bg-nexus-card-hover transition-all">
                                   <Filter className="w-4 h-4 lg:w-5 lg:h-5" />
                                   <span className="text-[10px] font-black uppercase">Filtrar</span>
                                </button>
                                <button onClick={() => setActiveTab('publish')} className="flex-[2] lg:flex-none px-6 lg:px-8 py-3 lg:py-4 bg-white text-nexus-bg rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3 hover:bg-cyan-500 transition-all whitespace-nowrap">
                                   <Plus className="w-4 h-4 lg:w-5 lg:h-5" /> PUBLICAR
                                </button>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                            {apps.map(app => (
                              <div key={app.id} className="p-6 lg:p-8 bg-nexus-card/50 border border-nexus-border rounded-[2rem] lg:rounded-[2.5rem] group hover:border-nexus-border transition-all relative overflow-hidden">
                                 <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
                                 
                                 <div className="flex items-start justify-between relative z-10">
                                    <img src={app.icon_url} className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl lg:rounded-3xl object-cover shadow-2xl" />
                                    <div className="flex gap-2">
                                       <button className="p-2 lg:p-3 bg-nexus-card hover:bg-cyan-500 hover:text-nexus-bg rounded-xl transition-all">
                                          <Edit className="w-4 h-4 lg:w-5 lg:h-5" />
                                       </button>
                                       <button className="p-2 lg:p-3 bg-nexus-card hover:bg-red-500 text-nexus-text rounded-xl transition-all">
                                          <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                                       </button>
                                    </div>
                                 </div>

                                 <div className="mt-6 lg:mt-8 space-y-4 relative z-10">
                                    <div>
                                       <h3 className="text-xl lg:text-2xl font-black text-nexus-text uppercase tracking-tighter truncate">{app.app_name}</h3>
                                       <p className="text-[10px] font-black text-nexus-text-sec uppercase tracking-widest mt-1">v{app.version} • {app.category}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2 lg:gap-4 py-4 lg:py-6 border-y border-nexus-border">
                                       <div>
                                          <p className="text-[8px] lg:text-[10px] font-black text-nexus-text-sec uppercase mb-1">Downloads</p>
                                          <p className="text-base lg:text-lg font-black text-nexus-text">{app.downloads}</p>
                                       </div>
                                       <div>
                                          <p className="text-[8px] lg:text-[10px] font-black text-nexus-text-sec uppercase mb-1">Rating</p>
                                          <div className="flex items-center gap-1">
                                             <Star className="w-3 h-3 lg:w-4 lg:h-4 text-yellow-500 fill-current" />
                                             <p className="text-base lg:text-lg font-black text-nexus-text">{app.rating}</p>
                                          </div>
                                       </div>
                                       <div>
                                          <p className="text-[8px] lg:text-[10px] font-black text-nexus-text-sec uppercase mb-1">Status</p>
                                          <span className="text-[8px] lg:text-[9px] font-black text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full uppercase truncate block">Publicado</span>
                                       </div>
                                    </div>

                                    <button className="w-full py-4 bg-nexus-card hover:bg-white text-nexus-text-sec hover:text-nexus-bg rounded-2xl font-black uppercase text-[9px] lg:text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                                       GESTIONAR <ChevronRight className="w-4 h-4" />
                                    </button>
                                 </div>
                              </div>
                            ))}
                            {apps.length === 0 && (
                              <div className="col-span-full py-12 lg:py-24 text-center">
                                 <Plus className="w-12 h-12 lg:w-16 lg:h-16 text-gray-800 mx-auto mb-6" />
                                 <h3 className="text-xl lg:text-2xl font-black text-gray-600 uppercase">Sin Actividad</h3>
                                 <p className="text-xs text-nexus-text-sec max-w-sm mx-auto mt-2 px-4">No has publicado ninguna aplicación todavía. Comienza subiendo tu primer APK.</p>
                              </div>
                            )}
                          </div>
                       </div>
                    )}

                    {(activeTab === 'analytics' || activeTab === 'settings') && (
                       <div className="py-12 lg:py-24 flex flex-col items-center justify-center text-center space-y-4 px-4">
                          <Activity className="w-16 h-16 lg:w-20 lg:h-20 text-gray-800 mb-4 animate-pulse" />
                          <h3 className="text-2xl lg:text-3xl font-black uppercase text-gray-700 leading-tight">Módulo en Desarrollo</h3>
                          <p className="text-xs lg:text-sm text-nexus-text-sec max-w-md">Estamos integrando el nuevo sistema de analíticas en tiempo real. Esta sección estará disponible en la próxima actualización.</p>
                       </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
           </>
         )}
      </main>
    </div>
  );
}
