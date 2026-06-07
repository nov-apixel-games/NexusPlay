import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { Database, Cloud, Zap, BarChart3 } from 'lucide-react';

export function SystemMetrics() {
    const [data, setData] = useState<any[]>([]);
    const [vercelAvailable, setVercelAvailable] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/system-stats');
                const json = await res.json();
                if (json.success) {
                    const memUsage = ((json.systemInfo.totalMem - json.systemInfo.freeMem) / json.systemInfo.totalMem) * 100;
                    
                    // Supabase and Cloudinary actual load proxy (using server mem for now as we don't have direct DB load from client)
                    // If we want real data, we show server memory for now. 
                    // Cloudinary bytes used:
                    const cUsageBytes = json.cloudinaryUsage?.storage?.usage || 0;
                    const cUsageMB = cUsageBytes / (1024 * 1024);

                    setData(prev => {
                        const newPoint = {
                            name: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                            serverMem: Math.round(memUsage),
                            cloudStorage: Math.round(cUsageMB)
                        };
                        const nextData = [...prev, newPoint];
                        if (nextData.length > 15) nextData.shift();
                        return nextData;
                    });
                }
            } catch (e) {
                console.error("Failed to fetch system stats", e);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica 1: System Memory & Cloudinary */}
            <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-nexus-card/80 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> Live Status
                    </div>
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                        <Database className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-nexus-text leading-none">Recursos del Servidor</h3>
                        <p className="text-xs text-red-200/40 mt-1">Memoria Servidor (%) & Almacenamiento Cloudinary (MB)</p>
                    </div>
                </div>

                <div className="h-64 mt-4 text-xs">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorSupabase" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorCloudinary" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="name" hide />
                                <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#120505', borderRadius: '12px', border: '1px solid rgba(220,38,38,0.2)', fontSize: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="serverMem" stroke="#ef4444" fillOpacity={1} fill="url(#colorSupabase)" name="Server Mem (%)" strokeWidth={3} />
                                <Area type="monotone" dataKey="cloudStorage" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCloudinary)" name="Cloud Storage (MB)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-nexus-text-sec">Cargando datos reales...</div>
                    )}
                </div>
            </div>

            {/* Gráfica 2: Vercel / Latencia */}
            <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-nexus-card/80 group">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-nexus-text leading-none">Vercel Performance</h3>
                        <p className="text-xs text-orange-200/40 mt-1">Edge Runtime & Latency Metrics</p>
                    </div>
                </div>

                <div className="h-64 mt-4 flex items-center justify-center border border-dashed border-nexus-border rounded-xl bg-nexus-surface">
                    <span className="text-nexus-text-sec font-medium">Sin datos disponibles</span>
                </div>
            </div>
        </div>
    );
}
