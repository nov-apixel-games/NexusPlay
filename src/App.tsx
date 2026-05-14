/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import CategorySection from './components/CategorySection';
import AppGrid from './components/AppGrid';
import BottomNav from './components/BottomNav';
import DeveloperPanel from './components/DeveloperPanel';
import { AppItem, UserItem, AIConfig, DevRequest } from './types';
import { DEMO_APPS, MOCK_USERS } from './data';
import AdminPanel from './components/AdminPanel';
import NexusAIChat from './components/NexusAIChat';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { ShieldAlert, Menu, Search, Bell, Heart } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Footer from './components/Footer';
import { ContactView, LegalPage, HelpView } from './components/views/LegalViews';
import { GamesView, ExploreView, RankingView, ProfileView, DownloadsView, EventsView, AchievementsView, CollectionsView } from './components/views/MainViews';

export const DEFAULT_SETTINGS = {
  storeName: 'NexusPlay',
  slogan: 'La plataforma digital de nueva generación',
  maintenanceMode: false,
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>('elmenorjn@gmail.com');
  
  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persistent States
  const [apps, setApps] = useLocalStorage<AppItem[]>('nexus_apps', DEMO_APPS);
  const [users, setUsers] = useLocalStorage<UserItem[]>('nexus_users', MOCK_USERS);
  const [settings, setSettings] = useLocalStorage('nexus_settings', DEFAULT_SETTINGS);
  const [devRequests, setDevRequests] = useLocalStorage<DevRequest[]>('nexus_dev_requests', []);

  const DEFAULT_AI_CONFIG: AIConfig = {
    enabled: false,
    apiKey: '',
    model: 'gemini-2.5-flash',
    endpoint: 'https://generativelanguage.googleapis.com'
  };
  const [aiConfig, setAiConfig] = useLocalStorage<AIConfig>('nexus_ai', DEFAULT_AI_CONFIG);

  const isAdmin = userEmail === 'elmenorjn@gmail.com';

  const addToast = (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Prevent scroll when sidebar or panel is open
  useEffect(() => {
    if (isSidebarOpen || showDevPanel) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isSidebarOpen, showDevPanel]);

  const handleAction = (id: string) => {
    if (id === 'dev-panel') {
      setShowDevPanel(true);
    } else {
      setActiveView(id);
    }
  };

  const handleAddApp = (newApp: AppItem) => {
    setApps([{ ...newApp, status: 'pending' }, ...apps]);
    addToast('App enviada a revisión correctamente.', 'success');
  };

  if (activeView === 'admin-panel' && isAdmin) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <AdminPanel 
          apps={apps} 
          setApps={setApps} 
          users={users}
          setUsers={setUsers}
          settings={settings}
          setSettings={setSettings}
          aiConfig={aiConfig}
          setAiConfig={setAiConfig}
          devRequests={devRequests}
          setDevRequests={setDevRequests}
          addToast={addToast}
          onExit={() => setActiveView('home')} 
        />
      </>
    );
  }

  if (settings.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-20 h-20 text-yellow-500 mb-6" />
        <h1 className="text-3xl font-black mb-4">Mantenimiento</h1>
        <p className="text-gray-400 max-w-md">
          {settings.storeName} está en mantenimiento actualmente. Estamos mejorando la plataforma de nueva generación.
        </p>
      </div>
    );
  }

  if (activeView === 'nexus-ai') {
    return (
      <AnimatePresence mode="wait">
        <NexusAIChat config={aiConfig} onReturn={() => setActiveView('home')} />
      </AnimatePresence>
    );
  }

  // Filter published apps for the store
  const publishedApps = apps.filter(a => a.status === 'published' || !a.status);

  return (
    <div className="min-h-screen bg-nexus-bg text-white font-sans selection:bg-nexus-cyan/30">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* Background Abstract Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-nexus-cyan/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-nexus-green/5 blur-[100px] rounded-full" />
        
        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-nexus-cyan rounded-full animate-pulse blur-[1px]" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-nexus-green rounded-full animate-pulse delay-700 blur-[1px]" />
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-nexus-cyan rounded-full animate-pulse delay-300 blur-[1px]" />
        <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-nexus-green/30 rounded-full animate-pulse delay-500 blur-[1px]" />

        {/* Simplified Geometric Pattern Simulation */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onAction={handleAction}
        isAdmin={isAdmin}
      />

      <main className="max-w-7xl mx-auto flex-1 w-full relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeView === 'home' ? (
              <>
                <Hero storeName={settings.storeName} slogan={settings.slogan} />
                <CategorySection />
                <AppGrid apps={publishedApps} />
              </>
            ) : activeView === 'games' ? (
              <GamesView apps={publishedApps} />
            ) : activeView === 'explore' ? (
              <ExploreView apps={publishedApps} />
            ) : activeView === 'ranking' ? (
              <RankingView apps={publishedApps} />
            ) : activeView === 'profile' ? (
              <ProfileView />
            ) : activeView === 'favorites' ? (
              <div className="pt-24 px-6 max-w-7xl mx-auto pb-16 min-h-[60vh]">
                <h1 className="text-3xl font-black flex items-center gap-3 mb-8"><Heart className="w-8 h-8 text-red-500" /> Mis Favoritos</h1>
                <AppGrid apps={publishedApps.slice(0,2)} />
              </div>
            ) : activeView === 'downloads' ? (
              <DownloadsView apps={publishedApps} />
            ) : activeView === 'events' ? (
              <EventsView />
            ) : activeView === 'achievements' ? (
              <AchievementsView />
            ) : activeView === 'collections' ? (
              <CollectionsView />
            ) : activeView === 'contact' ? (
              <ContactView />
            ) : activeView === 'help' ? (
              <HelpView />
            ) : activeView === 'privacy' ? (
              <LegalPage title="Política de Privacidad" lastUpdated="14 de Mayo, 2026">
                <p>En {settings.storeName}, valoramos tu privacidad. Esta política describe qué datos recopilamos...</p>
                <h3>Recopilación de Datos</h3>
                <p>Al utilizar nuestros servicios, recogemos el mínimo de información necesaria para proporcionarte la mejor experiencia.</p>
              </LegalPage>
            ) : activeView === 'terms' ? (
              <LegalPage title="Términos y Condiciones" lastUpdated="14 de Mayo, 2026">
                <p>Bienvenido a {settings.storeName}. Al continuar accediendo a la plataforma, aceptas adherirte a estos términos.</p>
                <h3>Uso de la Plataforma</h3>
                <p>Te comprometes a utilizar las aplicaciones aquí distribuidas bajo los términos de las respectivas licencias de terceros.</p>
              </LegalPage>
            ) : activeView === 'cookies' ? (
               <LegalPage title="Política de Cookies" lastUpdated="14 de Mayo, 2026">
                 <p>Utilizamos cookies esenciales para el correcto funcionamiento de autenticación y preferencias del sistema.</p>
               </LegalPage>
            ) : activeView === 'about' ? (
               <LegalPage title="Sobre Nosotros" lastUpdated="14 de Mayo, 2026">
                 <p>{settings.storeName} nace con la misión de redefinir la distribución digital brindando una curación impecable y una plataforma ultrarrápida.</p>
               </LegalPage>
            ) : (
              <div className="pt-32 px-6 min-h-[60vh] flex flex-col items-center justify-center text-center">
                <h1 className="text-4xl font-black neon-text-gradient mb-4 uppercase tracking-tighter">Vista: {activeView}</h1>
                <p className="text-gray-400">Esta sección está en desarrollo.</p>
                <button 
                  onClick={() => setActiveView('home')}
                  className="mt-8 px-6 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-nexus-cyan/10 hover:text-nexus-cyan transition-all"
                >
                  Volver al inicio
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer onNavigate={handleAction} />

      {showDevPanel && (
        <DeveloperPanel 
          userEmail={userEmail}
          devRequests={devRequests}
          setDevRequests={setDevRequests}
          onAddApp={handleAddApp} 
          onClose={() => setShowDevPanel(false)}
          publishedApps={apps.filter(a => a.developer === userEmail)}
          onUpdateApp={(updatedApp) => {
             setApps(apps.map(a => a.id === updatedApp.id ? updatedApp : a));
          }}
        />
      )}

      <BottomNav activeView={activeView} onNavigate={handleAction} />

      {/* PC Bottom Decor (Optional but looks cool) */}
      <footer className="hidden sm:flex border-t border-white/5 py-8 px-6 mt-12 items-center justify-between text-gray-500 text-xs">
        <div className="flex items-center gap-6">
          <span>© 2026 NexusPlay Corp.</span>
          <a href="#" className="hover:text-nexus-cyan transition-colors">Privacidad</a>
          <a href="#" className="hover:text-nexus-cyan transition-colors">Términos</a>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-nexus-green shadow-[0_0_5px_rgba(0,255,136,1)]" />
            Servidores Online
          </span>
        </div>
      </footer>
    </div>
  );
}
