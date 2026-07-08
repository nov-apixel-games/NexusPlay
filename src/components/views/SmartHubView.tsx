import React, { useState, useMemo, lazy, Suspense } from 'react';
import { AnimatePresence } from 'motion/react';
import { 
  Bot, TrendingUp, Sparkles, Wand2, Zap,
  Calculator, QrCode, Clipboard, Trophy, Star, Coins
} from 'lucide-react';
import { AppItem } from '../../types';
import { useAppStore } from '../../store/useAppStore';

const NotesApp = lazy(() => import('./SmartTools').then(m => ({ default: m.NotesApp })));
const CalculatorApp = lazy(() => import('./SmartTools').then(m => ({ default: m.CalculatorApp })));
const QrApp = lazy(() => import('./SmartTools').then(m => ({ default: m.QrApp })));
const CurrencyApp = lazy(() => import('./SmartTools').then(m => ({ default: m.CurrencyApp })));

const parseDownloads = (dStr: string) => {
  if (!dStr) return 0;
  let n = parseFloat(dStr);
  if (dStr.toLowerCase().includes('m')) n *= 1000000;
  if (dStr.toLowerCase().includes('k')) n *= 1000;
  return isNaN(n) ? 0 : n;
};

interface SmartHubViewProps {
  onBack: () => void;
  apps: AppItem[];
  onAppClick: (app: AppItem) => void;
  userProfile?: any;
}

export function SmartHubView({ onBack, apps, onAppClick, userProfile }: SmartHubViewProps) {
  const t = useAppStore(state => state.t);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Trending content
  const trendingApps = useMemo(() => {
    return [...apps].sort((a, b) => parseDownloads(b.downloads) - parseDownloads(a.downloads)).slice(0, 4);
  }, [apps]);

  const featuredAIApps = useMemo(() => {
    return apps.filter(a => a.category?.toLowerCase() === 'ia' || a.category?.toLowerCase() === 'ai' || a.name.toLowerCase().includes('ai ')).slice(0, 3);
  }, [apps]);
  
  const news = [
    { id: 1, title: 'El auge de la IA en móviles', excerpt: 'Las apps potenciadas con IA rompen récord de descargas este trimestre.', date: 'Hoy' },
    { id: 2, title: 'Rediseño de interfaces', excerpt: 'Nuevas tendencias minimalistas para 2026.', date: 'Ayer' },
    { id: 3, title: 'Optimiza tu Android', excerpt: '5 consejos esenciales que la IA te recomienda.', date: 'Hace 2 días' }
  ];

  const tools = [
    { id: 'calc', name: t('smart.calc') || 'Calculadora', icon: Calculator, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'notes', name: t('smart.notes') || 'Bloc Notas', icon: Clipboard, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { id: 'qr', name: t('smart.qr') || 'Código QR', icon: QrCode, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'currency', name: t('smart.converter') || 'Conversor', icon: Coins, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  return (
    <div className="pb-24 pt-4 px-4 min-h-screen bg-nexus-bg">
      <AnimatePresence>
        {activeTool === 'calc' && (
          <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center font-mono text-blue-400 animate-pulse">Cargando Calculadora...</div>}>
            <CalculatorApp onClose={() => setActiveTool(null)} />
          </Suspense>
        )}
        {activeTool === 'notes' && (
          <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center font-mono text-amber-400 animate-pulse">Cargando Notas...</div>}>
            <NotesApp onClose={() => setActiveTool(null)} />
          </Suspense>
        )}
        {activeTool === 'qr' && (
          <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center font-mono text-purple-400 animate-pulse">Cargando Código QR...</div>}>
            <QrApp onClose={() => setActiveTool(null)} />
          </Suspense>
        )}
        {activeTool === 'currency' && (
          <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center font-mono text-emerald-400 animate-pulse">Cargando Conversor...</div>}>
            <CurrencyApp onClose={() => setActiveTool(null)} />
          </Suspense>
        )}
      </AnimatePresence>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
             <Bot className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-nexus-text">{t("smart.hubTitle") || "Centro Inteligente"}</h1>
            <p className="text-sm text-nexus-text-sec">{t("smart.hubDesc") || "Tu espacio personalizado y utilidades"}</p>
          </div>
        </div>

        {/* Recomendaciones Personales */}
        <section className="bg-nexus-card border border-nexus-border rounded-2xl p-5 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-[100px] pointer-events-none rounded-full" />
           <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                 <Wand2 className="w-5 h-5 text-fuchsia-400" />
                 <h2 className="text-lg font-bold text-nexus-text">{t("smart.recommended") || "Recomendado para ti"}</h2>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
             {apps.length > 0 ? apps.slice(0, 3).map(app => (
                <div key={app.id} onClick={() => onAppClick(app)} className="bg-nexus-bg border border-nexus-border hover:border-blue-500/30 transition-colors rounded-xl p-3 flex items-center gap-3 cursor-pointer">
                   <img src={app.icon} alt={app.name} className="w-12 h-12 rounded-xl object-cover" />
                   <div>
                     <h3 className="font-semibold text-nexus-text text-sm line-clamp-1">{app.name}</h3>
                     <p className="text-xs text-nexus-text-sec flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {app.rating || '4.5'} • {app.category}
                     </p>
                   </div>
                </div>
             )) : (
               <div className="col-span-1 md:col-span-3 text-center py-6 text-nexus-text-sec text-sm">
                 Sin datos disponibles
               </div>
             )}
           </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Herramientas Rápidas */}
          <section className="col-span-1 lg:col-span-2">
             <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-nexus-text">{t("smart.quickTools") || "Herramientas Rápidas"}</h2>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               {tools.map(tool => (
                  <button key={tool.id} onClick={() => setActiveTool(tool.id)} className="bg-nexus-card border border-nexus-border hover:bg-nexus-card-hover hover:-translate-y-1 transition-all rounded-xl p-4 flex justify-center items-center flex-col gap-3 group">
                     <div className={`p-3 rounded-xl ${tool.bg} ${tool.color} group-hover:scale-110 transition-transform`}>
                        <tool.icon className="w-6 h-6" />
                     </div>
                     <span className="text-sm font-medium text-nexus-text">{tool.name}</span>
                  </button>
               ))}
             </div>

             {/* Tendencias en la comunidad */}
             <div className="flex items-center gap-2 mt-8 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-nexus-text">Tendencias de la Comunidad</h2>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trendingApps.slice(0, 4).map((app, i) => (
                  <div key={app.id} onClick={() => onAppClick(app)} className="bg-nexus-card border border-nexus-border rounded-xl p-3 flex items-center gap-3 cursor-pointer group">
                    <div className="text-lg font-bold text-nexus-text-sec opacity-50 w-6 text-center">{i + 1}</div>
                    <img src={app.icon} alt={app.name} className="w-10 h-10 rounded-lg group-hover:scale-105 transition-transform" />
                    <div className="flex-1 min-w-0">
                       <h3 className="font-semibold text-nexus-text text-sm line-clamp-1">{app.name}</h3>
                       <p className="text-xs text-nexus-text-sec">{app.downloads || 'Populares'}</p>
                    </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Sidebar Modules */}
          <section className="space-y-6">
            {/* Descubre Algo Nuevo */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/5 hover:from-indigo-500/15 hover:to-blue-500/10 transition-colors border border-indigo-500/20 rounded-2xl p-5">
               <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-nexus-text">Descubre Hoy</h3>
               </div>
               {apps[10] && (
                 <div onClick={() => onAppClick(apps[10])} className="cursor-pointer">
                    <img src={apps[10].icon} alt="" className="w-full h-32 object-cover rounded-xl mb-3 border border-nexus-border" />
                    <h4 className="font-bold text-nexus-text mb-1">{apps[10].name}</h4>
                    <p className="text-xs text-nexus-text-sec line-clamp-2">Nuestra IA analizó esta aplicación y cree que te encantará por su utilidad.</p>
                 </div>
               )}
            </div>

            {/* Logros (Si está logueado) o Estadísticas */}
            <div className="bg-nexus-card border border-nexus-border rounded-2xl p-5">
               <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-bold text-nexus-text">Tu Actividad</h3>
                  </div>
               </div>

               {userProfile ? (
                 <div className="space-y-4">
                    <div className="text-center py-4 text-nexus-text-sec text-sm">
                       Sin datos de actividad disponibles
                    </div>
                 </div>
               ) : (
                 <div className="text-center py-4">
                    <p className="text-sm text-nexus-text-sec mb-3">Inicia sesión para ganar experiencia, insignias y guardar tus estadísticas.</p>
                 </div>
               )}
            </div>

            {/* AI News / Resumen - Disabled to eliminate fake data 
            <div className="bg-nexus-card border border-nexus-border rounded-2xl p-5">
               <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-rose-400" />
                  <h3 className="font-bold text-nexus-text">Tech News (IA)</h3>
               </div>
               <div className="space-y-3">
                 <div className="col-span-1 md:col-span-3 text-center py-6 text-nexus-text-sec text-sm">
                     Sin datos disponibles
                 </div>
               </div>
            </div>
            */}
          </section>
        </div>
        
      </div>
    </div>
  );
}
