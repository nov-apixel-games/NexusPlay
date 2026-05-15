import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { Database, Cloud, Zap, BarChart3 } from 'lucide-react';

// Generador de datos con oscilación controlada para realismo
const generatePoint = (prev: any = { supabase: 40, cloudinary: 30, vercel: 20 }) => ({
    name: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    supabase: Math.max(10, Math.min(100, prev.supabase + (Math.random() * 10 - 5))),
    cloudinary: Math.max(10, Math.min(100, prev.cloudinary + (Math.random() * 12 - 6))),
    vercel: Math.max(5, Math.min(100, prev.vercel + (Math.random() * 8 - 4))),
});

const initialData = Array.from({ length: 15 }, (_, i) => ({
    name: `T-${15-i}`,
    supabase: 40 + Math.random() * 20,
    cloudinary: 30 + Math.random() * 20,
    vercel: 20 + Math.random() * 10,
}));

export function SystemMetrics() {
    const [data, setData] = useState(initialData);

    useEffect(() => {
        const interval = setInterval(() => {
            setData(prev => {
                const nextPoint = generatePoint(prev[prev.length - 1]);
                return [...prev.slice(1), nextPoint];
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica 1: Supabase y Cloudinary */}
            <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-[#120505]/50 relative overflow-hidden group">
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
                        <h3 className="text-lg font-bold text-white leading-none">Recursos de Database</h3>
                        <p className="text-xs text-red-200/40 mt-1">Supabase & Cloudinary Storage</p>
                    </div>
                </div>

                <div className="h-64 mt-4">
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
                            <Area type="monotone" dataKey="supabase" stroke="#ef4444" fillOpacity={1} fill="url(#colorSupabase)" name="Supabase Load (%)" strokeWidth={3} />
                            <Area type="monotone" dataKey="cloudinary" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCloudinary)" name="Cloudinary Ops (%)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Gráfica 2: Vercel / Latencia */}
            <div className="glass-panel p-6 rounded-3xl border-red-900/20 bg-[#120505]/50 group">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white leading-none">Vercel Performance</h3>
                        <p className="text-xs text-orange-200/40 mt-1">Edge Runtime & Latency Metrics</p>
                    </div>
                </div>

                <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#120505', borderRadius: '12px', border: '1px solid rgba(249,115,22,0.2)', fontSize: '12px' }}
                            />
                            <Line 
                                type="stepAfter" 
                                dataKey="vercel" 
                                stroke="#f97316" 
                                strokeWidth={3} 
                                dot={false} 
                                name="Edge Response (ms)"
                                animationDuration={300}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
