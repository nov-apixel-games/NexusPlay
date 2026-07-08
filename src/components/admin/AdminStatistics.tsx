import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { AppItem, UserItem } from '../../types';

interface AdminStatisticsProps {
  apps: AppItem[];
  users: UserItem[];
}

export default function AdminStatistics({ apps, users }: AdminStatisticsProps) {
  const { t } = useAppStore();

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
    <div className="space-y-8 animate-fade-in w-full">
      <header>
        <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-nexus-text">
          {t("admin.telemetry") || "Telemetría Avanzada (Real)"}
        </h3>
        <p className="text-red-400 text-sm md:text-base">
          {t("admin.telemetryDesc") || "Métricas, crecimiento y engagement extraídos directamente de la base de datos."}
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <div className="bg-nexus-card border border-red-900/20 p-6 md:p-8 rounded-3xl shadow-xl w-full">
           <h4 className="text-xl font-bold text-nexus-text mb-8">
             {t("admin.newUsers") || "Nuevos Usuarios (Últimos 7 días)"}
           </h4>
           <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                     <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0a0000', borderColor: '#1e3a8a', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} cursor={{ stroke: '#ffffff20' }} />
                  <Area type="monotone" dataKey="nuevos_usuarios" name="Usuarios" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-nexus-card border border-red-900/20 p-6 md:p-8 rounded-3xl shadow-xl w-full">
           <h4 className="text-xl font-bold text-nexus-text mb-8">
             {t("admin.newApps") || "Nuevas Aplicaciones (Últimos 7 días)"}
           </h4>
           <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0a0000', borderColor: '#7f1d1d', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} cursor={{ stroke: '#ffffff20' }} />
                  <Line type="monotone" dataKey="nuevas_apps" name="Apps" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#f87171' }} />
                </LineChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="bg-nexus-card border border-red-900/20 p-6 md:p-8 rounded-3xl shadow-xl">
         <h4 className="text-xl font-bold text-nexus-text mb-6">
           {t("admin.topApps") || "Top Entidades Más Descargadas (Real)"}
         </h4>
         <div className="space-y-4">
           {apps.filter(a => a.status === 'published' && parseInt(String(a.downloads || 0)) > 0).sort((a,b) => parseInt(String(b.downloads || 0)) - parseInt(String(a.downloads || 0))).slice(0, 3).map((app, i) => (
             <div key={app.id} className="flex items-center justify-between p-4 bg-nexus-surface border border-nexus-border rounded-2xl">
                <div className="flex items-center gap-4">
                   <div className="text-2xl font-black text-red-900/50 w-8 text-center">{i + 1}</div>
                   <img src={app.icon} alt={app.name} className="w-12 h-12 rounded-xl object-cover bg-black border border-nexus-border" />
                   <div>
                      <h5 className="font-bold text-nexus-text">{app.name}</h5>
                      <p className="text-xs text-nexus-text-sec">{app.developer}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="font-black text-lg text-nexus-text">{app.downloads || 0}</p>
                   <p className="text-xs text-nexus-text-sec uppercase tracking-widest">
                     {t("admin.realInstalls") || "Instalaciones Reales"}
                   </p>
                </div>
             </div>
           ))}
           {apps.filter(a => a.status === 'published' && parseInt(String(a.downloads || 0)) > 0).length === 0 && (
             <p className="text-nexus-text-sec text-sm text-center p-6 border border-nexus-border rounded-2xl bg-nexus-surface">
               Ninguna aplicación ha registrado descargas todavía.
             </p>
           )}
         </div>
      </div>
    </div>
  );
}
