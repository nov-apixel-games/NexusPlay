import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Smartphone, ShieldAlert, Users, Code, MonitorPlay, 
  Settings, LogOut, Search, Bell, Menu, X, BrainCircuit 
} from 'lucide-react';
import { AppItem, UserItem, AIConfig } from '../types';
import { AdminDashboard, AdminUsers } from './admin/AdminViews1';
import { AdminAds, AdminSettings, AdminModeration, AdminAI } from './admin/AdminViews2';
import { AdminAppsList } from './admin/AdminAppsView';
import { motion, AnimatePresence } from 'motion/react';
import { ToastType } from './Toast';

export const DEFAULT_ADS = {
  general: true,
  bannerMobile: false,
  interstitial: true,
  rewarded: false,
  publisherId: 'pub-XXXX',
  rateLimit: 50
};

interface AdminPanelProps {
  apps: AppItem[];
  setApps: (a: AppItem[]) => void;
  users: UserItem[];
  setUsers: (u: UserItem[]) => void;
  settings: any;
  setSettings: (s: any) => void;
  aiConfig: AIConfig;
  setAiConfig: (c: AIConfig) => void;
  devRequests: any[];
  setDevRequests: (reqs: any[]) => void;
  addToast: (msg: string, type: ToastType) => void;
  onExit: () => void;
}

const ADMIN_MENU = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'apps', label: 'Gestión Apps', icon: Smartphone },
  { id: 'moderation', label: 'Moderación', icon: ShieldAlert },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'ads', label: 'Monetización', icon: MonitorPlay },
  { id: 'ai', label: 'Nexus AI Admin', icon: BrainCircuit },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

export default function AdminPanel({ apps, setApps, users, setUsers, settings, setSettings, aiConfig, setAiConfig, devRequests, setDevRequests, addToast, onExit }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // In a real app we'd fetch these from Supabase
  const [adsConfig, setAdsConfig] = useState(DEFAULT_ADS);
  const [reports, setReports] = useState([]);

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <AdminDashboard apps={apps} users={users} />;
      case 'apps': return <AdminAppsList apps={apps} setApps={setApps} addToast={addToast} />;
      case 'users': return <AdminUsers users={users} setUsers={setUsers} addToast={addToast} />;
      case 'moderation': return <AdminModeration reports={reports} setReports={setReports} addToast={addToast} />;
      case 'ads': return <AdminAds config={adsConfig} setConfig={setAdsConfig} addToast={addToast} />;
      case 'ai': return <AdminAI apps={apps} setApps={setApps} users={users} setUsers={setUsers} requests={devRequests} setRequests={setDevRequests} config={aiConfig} setConfig={setAiConfig} addToast={addToast} />;
      case 'settings': return <AdminSettings settings={settings} setSettings={setSettings} addToast={addToast} />;
      default: 
        return (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <ShieldAlert className="w-16 h-16 text-yellow-500 mb-6" />
            <h2 className="text-2xl font-bold mb-2">Sección en Construcción</h2>
            <p className="text-gray-400">Esta sección ({activeTab}) se activará pronto.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0202] flex overflow-hidden font-sans selection:bg-red-500/30">
      <div className="w-72 bg-[#120505] border-r border-red-900/20 flex-col hidden lg:flex">
        <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
          <div className="font-black text-xl text-white tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(220,38,38,0.5)]">AD</div>
            Nexus<span className="text-red-500">Admin</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
          {ADMIN_MENU.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-red-500/10 text-red-500 font-bold border border-red-500/20 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-white/5 shrink-0">
          <button 
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-all font-bold"
          >
            <LogOut className="w-5 h-5" />
            Salir del Panel
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0202] relative">
        <header className="h-16 glass-panel border-b border-red-900/20 flex items-center justify-between px-4 lg:px-8 shrink-0 relative z-10 bg-[#0a0202]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="font-black text-lg text-white tracking-tight">Nexus<span className="text-red-500">Admin</span></div>
          </div>
          
          <div className="hidden lg:flex flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Buscar en el panel..." className="w-full h-10 bg-red-950/20 border border-red-900/30 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-red-500/50 transition-colors text-white" />
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#030712]"></span>
            </button>
            <div className="h-8 pl-1 pr-3 rounded-full bg-red-950/30 border border-red-900/30 flex items-center gap-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/5 mix-blend-overlay"></div>
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(220,38,38,0.5)] z-10">
                AD
              </div>
              <span className="text-xs font-bold text-red-100 hidden sm:block z-10">Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full max-w-7xl mx-auto"
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-72 bg-[#120505] z-[120] border-r border-red-900/30 flex flex-col lg:hidden shadow-[20px_0_50px_rgba(220,38,38,0.05)]"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-red-900/20 shrink-0">
                <div className="font-black text-xl text-white tracking-tighter">Nexus<span className="text-red-500">Admin</span></div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-400">
                   <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {ADMIN_MENU.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === item.id 
                        ? 'bg-red-500/10 text-red-500 font-bold border border-red-500/20 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-white/5 shrink-0">
                <button 
                  onClick={onExit}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-all font-bold"
                >
                  <LogOut className="w-5 h-5" />
                  Salir
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
