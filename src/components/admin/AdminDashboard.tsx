import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Download, Smartphone, ShieldAlert 
} from 'lucide-react';
import { AppItem, UserItem } from '../../types';
import { supabase } from '../../lib/supabase';
import { SystemMetrics } from './SystemMetrics';

interface AdminDashboardProps {
  apps: AppItem[];
  users: UserItem[];
}

export default function AdminDashboard({ apps, users }: AdminDashboardProps) {
  const [sysStats, setSysStats] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const token = session?.access_token;
      fetch('/api/system-stats', {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }).then(res => res.json()).then(json => {
        if (json.success) setSysStats(json);
      }).catch(e => console.error(e));
    });
  }, []);

  const totalDownloads = apps.reduce((acc, current) => acc + (current.download_count || 0), 0);
  const pendingApps = apps.filter(a => a.status === 'pending').length;
  const publishedApps = apps.filter(a => a.status !== 'pending' && a.status !== 'rejected').length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-nexus-text">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Smartphone} title="Apps Publicadas" value={publishedApps} color="text-red-500" />
        <MetricCard icon={Users} title="Usuarios" value={users.length} color="text-rose-400" />
        <MetricCard icon={Download} title="Descargas Totales" value={totalDownloads} color="text-red-400" />
        <MetricCard icon={ShieldAlert} title="Apps Pendientes" value={pendingApps} color="text-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-nexus-card/80">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-red-500" /> Monitoreo de Recursos en Tiempo Real
          </h3>
          <div className="mt-4 space-y-4">
               <ProgressBar label="CPU System" value={sysStats ? Math.round((sysStats.systemInfo.loadAvg[0] / sysStats.systemInfo.cpuCores) * 100) : 0} color="bg-red-500" />
               <ProgressBar label="RAM System" value={sysStats ? Math.round(((sysStats.systemInfo.totalMem - sysStats.systemInfo.freeMem) / sysStats.systemInfo.totalMem) * 100) : 0} color="bg-rose-500" />
               <ProgressBar label="Server IO (Aprox)" value={sysStats ? 15 : 0} color="bg-red-900" />
          </div>
          <p className="mt-6 text-xs text-center text-nexus-text-sec">Datos obtenidos de /api/system-stats (OS Module)</p>
        </div>

        <SystemMetrics />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, color }: any) {
  return (
    <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-nexus-card/80 flex items-center gap-4 hover:border-red-500/30 transition-colors shadow-[min(0px,0px)_0_0_red] hover:shadow-[0_0_15px_rgba(220,38,38,0.1)]">
      <div className={`p-4 rounded-2xl bg-red-950/50 border border-red-900/30 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-nexus-text-sec text-sm font-medium">{title}</h4>
        <div className={`text-2xl font-black ${color}`}>{value}</div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1 font-medium">
        <span className="text-nexus-text">{label}</span>
        <span className={value > 80 ? 'text-yellow-400' : 'text-nexus-text-sec'}>{value}%</span>
      </div>
      <div className="h-2 w-full bg-nexus-card rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
