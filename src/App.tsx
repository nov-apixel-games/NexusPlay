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
import AdminPanel from './components/AdminPanel';
import NexusAIChat from './components/NexusAIChat';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { ShieldAlert, Heart, Menu, Search, Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Footer from './components/Footer';
import { ContactView, LegalPage, HelpView } from './components/views/LegalViews';
import { GamesView, ExploreView, RankingView, ProfileView, DownloadsView, EventsView, AchievementsView, CollectionsView } from './components/views/MainViews';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import AuthModal from './components/AuthModal';

export const DEFAULT_SETTINGS = {
  storeName: 'NexusPlay',
  slogan: 'La plataforma digital de nueva generación',
  maintenanceMode: false,
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [showDevPanel, setShowDevPanel] = useState(false);
  
  // Supabase Auth and User
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Data fetching state
  const [apps, setApps] = useState<AppItem[]>([]);
  const [devRequests, setDevRequests] = useState<DevRequest[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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

  const DEFAULT_AI_CONFIG: AIConfig = {
    enabled: false,
    apiKey: '',
    model: 'gemini-2.5-flash',
    endpoint: 'https://generativelanguage.googleapis.com'
  };
  const [aiConfig, setAiConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);

  const handleLogout = async () => {
    console.log("Cerrando sesión");
    
    // UI feedback inmediato
    setSession(null);
    setUserProfile(null);
    setActiveView('home');
    setShowDevPanel(false);
    setIsSidebarOpen(false);
    addToast('Sesión cerrada correctamente', 'success');

    try {
      await supabase.auth.signOut();
      console.log("logout success");
    } catch (e) {
      console.error("Logout error", e);
    }
    
    // Clear all local storage manually to prevent lingering sessions
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    // Limpiar estado profundo
    setDevRequests([]);
    setUsers([]);

    // Refrescar estado global para limpiar completamente la sesión de la interfaz
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      addToast('Faltan configurar variables de entorno de Supabase.', 'error');
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    fetchApps();

    const appsSubscription = supabase
      .channel('apps-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apps' }, payload => {
        if (payload.eventType === 'INSERT') {
          setApps(prev => [payload.new as any, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setApps(prev => prev.map(a => a.id === payload.new.id ? payload.new as any : a));
        } else if (payload.eventType === 'DELETE') {
          setApps(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(appsSubscription);
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout')), 5000));
      
      let { data, error } = await Promise.race([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        timeoutPromise
      ]) as any;
      
      // Create profile if it doesn't exist
      if (!data && (!error || error.code === 'PGRST116')) { // handle row not found
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          const email = authData.user.email || '';
          const role = email === 'elmenorjn@gmail.com' ? 'admin' : 'user';
          const username = email.split('@')[0] || 'User';
          const newProfile = { id: userId, email, role, username, created_at: new Date().toISOString() };
          
          const { data: insertedData, error: insertError } = await Promise.race([
            supabase.from('profiles').insert([newProfile]).select().single(),
            timeoutPromise
          ]) as any;
          
          if (insertedData) {
            data = insertedData;
            console.log("LOGIN 3 profile created");
          } else if (insertError) {
            console.error("Error creating profile:", insertError);
            // Fallback just to allow frontend session
            data = newProfile; 
            console.log("LOGIN 3 profile created (fallback)");
          }
        }
      } else if (error) {
         console.warn("fetchUserProfile error (possibly timeout):", error);
         // Fallback profile if there's a network error or timeout
         data = { id: userId, email: session?.user?.email || '', role: 'user', username: 'User' };
         console.log("LOGIN 3 profile found (fallback due to error)");
      } else {
        console.log("LOGIN 3 profile found");
        // Force admin for the specific user
        if (data && data.email === 'elmenorjn@gmail.com' && data.role !== 'admin') {
          const { error: updateError } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
          if (!updateError) {
             data.role = 'admin';
          }
        }
      }

      if (data) {
        if (data.email === 'elmenorjn@gmail.com' && data.role !== 'admin') {
          const { data: updatedData, error: updateError } = await Promise.race([
            supabase.from('profiles').update({ role: 'admin' }).eq('id', userId).select().single(),
            timeoutPromise
          ]) as any;
          if (updatedData) {
            setUserProfile(updatedData);
            console.log("LOGIN 4 role assigned");
            console.log("LOGIN 5 redirect ready");
            fetchAllData();
            return;
          } else {
             console.error("Could not update role in DB:", updateError);
             // Force admin on frontend if DB update fails
             data.role = 'admin';
          }
        }
        
        setUserProfile(data);
        console.log("LOGIN 4 role assigned");
        console.log("LOGIN 5 redirect ready");
        if (data.role === 'admin') {
          fetchAllData();
        }
      }
    } catch (e: any) {
      console.warn("fetchUserProfile caught error:", e.message);
      // Fallback
      setUserProfile({ id: userId, email: session?.user?.email || '', role: 'user', username: 'User' });
    }
  };

  const fetchApps = async () => {
    const { data } = await supabase.from('apps').select('*').order('created_at', { ascending: false });
    if (data) {
      // Map properties from DB to internal AppItem if needed.
      // Assumes DB fields match AppItem fields mostly except snake_case vs camelCase.
      const mappedApps = data.map(d => ({
        id: d.id,
        name: d.app_name,
        company: d.company_name, // fallback for developer
        developer: d.company_name,
        description: d.description,
        category: d.category,
        size: d.size,
        version: d.version,
        icon: d.icon_url,
        screenshots: d.screenshots,
        downloadUrl: d.download_url,
        status: d.status,
        featured: d.featured,
        rating: typeof d.rating === 'string' ? parseFloat(d.rating) : d.rating || 5.0,
        downloads: d.downloads,
        price: d.price,
        date: d.created_at
      }));
      setApps(mappedApps);
    }
  };

  const fetchAllData = async () => {
    const [reqs, usrs] = await Promise.all([
      supabase.from('developer_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*')
    ]);
    if (reqs.data) {
      const mappedDevReqs = reqs.data.map(d => ({
        id: d.id,
        userId: d.user_id,
        name: d.full_name,
        email: d.user_id, // Replace mapped email as we don't have it joined easily
        company: d.studio_name,
        experience: d.experience,
        appTypes: d.app_type,
        message: d.message,
        status: d.status,
        date: d.created_at
      }));
      setDevRequests(mappedDevReqs);
    }
    if (usrs.data) {
      setUsers(usrs.data.map(u => ({
        id: u.id,
        email: u.email,
        name: u.username || u.email,
        role: u.role,
        status: 'active',
        joinedAt: u.created_at
      })));
    }
  };

  const isAdmin = userProfile?.role === 'admin';
  const isDeveloper = userProfile?.role === 'developer' || isAdmin;

  useEffect(() => {
    if (isSidebarOpen || showDevPanel || showAuthModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isSidebarOpen, showDevPanel, showAuthModal]);

  const [devPanelInitialTab, setDevPanelInitialTab] = useState<'upload' | 'my-apps' | 'requirements'>('upload');

  const handleActivateDeveloper = async () => {
    if (!session || !userProfile?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'developer' })
        .eq('id', userProfile.id);

      if (error) throw error;

      setUserProfile((prev: any) => prev ? { ...prev, role: 'developer' } : prev);
      addToast("¡Felicidades! Ahora eres desarrollador. Ya puedes subir tus juegos.", 'success');
      
      // Open panel directly in upload view
      setDevPanelInitialTab('upload');
      setShowDevPanel(true);
    } catch (error: any) {
      addToast("Error al activar cuenta: " + error.message, 'error');
    }
  };

  const handleAction = (id: string) => {
    if (id === 'admin-panel') {
      if (!isAdmin) {
        addToast('Acceso restringido. Requiere permisos de administrador.', 'error');
        setActiveView('home');
        return;
      }
      setActiveView(id);
    } else if (id === 'dev-panel') {
      if (!session) {
        setShowAuthModal(true);
      } else {
        setDevPanelInitialTab('upload');
        setShowDevPanel(true);
      }
    } else {
      setActiveView(id);
    }
  };

  const handleAddApp = async (newApp: AppItem) => {
    if (!session?.user) return;
    const { error } = await supabase.from('apps').insert({
      developer_id: session.user.id,
      app_name: newApp.name,
      company_name: newApp.developer,
      description: newApp.description || '',
      category: newApp.category,
      size: newApp.size || '0MB',
      version: newApp.version || '1.0.0',
      icon_url: newApp.icon,
      screenshots: newApp.screenshots || [],
      download_url: newApp.downloadUrl || '',
      status: 'pending'
    });
    if (error) {
      addToast('Error al publicar: ' + error.message, 'error');
    } else {
      addToast('App enviada a revisión correctamente.', 'success');
      // The realtime subscription will update the state
    }
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
  const publishedApps = apps.filter(a => a.status === 'published');

  return (
    <div className="min-h-screen bg-nexus-bg text-white font-sans selection:bg-nexus-cyan/30">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={() => {
            setShowAuthModal(false);
            addToast('Sesión iniciada correctamente', 'success');
          }} 
        />
      )}
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

      {!showAuthModal && (
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} userProfile={userProfile} onLoginClick={() => setShowAuthModal(true)} onLogoutClick={handleLogout} />
      )}
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onAction={handleAction}
        isAdmin={isAdmin}
        session={session}
        onLogout={handleLogout}
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
              <ProfileView 
                session={session} 
                userProfile={userProfile} 
                onLoginClick={() => setShowAuthModal(true)} 
                onDeveloperAction={(action) => {
                  if (action === 'activate') {
                    handleActivateDeveloper();
                  } else if (action === 'open') {
                    setDevPanelInitialTab('upload');
                    setShowDevPanel(true);
                  }
                }}
              />
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

      {showDevPanel && session && (
        <DeveloperPanel 
          userEmail={session.user.email}
          userId={session.user.id}
          userProfile={userProfile}
          isApproved={isDeveloper}
          devRequests={devRequests}
          setDevRequests={setDevRequests}
          onAddApp={handleAddApp} 
          onClose={() => setShowDevPanel(false)}
          publishedApps={apps.filter(a => a.developer === session.user.id || a.company === userProfile?.username)} 
          initialTab={devPanelInitialTab}
          onRoleChange={(newRole) => {
            setUserProfile((prev: any) => prev ? { ...prev, role: newRole } : prev);
            addToast(`¡Bienvenido! Ahora eres ${newRole === 'developer' ? 'desarrollador' : newRole}.`, 'success');
          }}
          onUpdateApp={(updatedApp) => {
             // Let Supabase realtime handle local state update
          }}
        />
      )}

      {!showAuthModal && (
        <BottomNav activeView={activeView} onNavigate={handleAction} />
      )}

      <footer className="hidden sm:flex border-t border-white/5 py-8 px-6 mt-12 items-center justify-between text-gray-500 text-xs">
        <div className="flex items-center gap-6">
           <span>© 2026 {settings.storeName} Corp.</span>
           <button onClick={() => setActiveView('privacy')} className="hover:text-cyan-400 transition-colors">Privacidad</button>
           <button onClick={() => setActiveView('terms')} className="hover:text-cyan-400 transition-colors">Términos</button>
        </div>
        <div className="flex items-center gap-4">
           <span className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-nexus-green shadow-[0_0_5px_rgba(0,255,136,1)]" />
             Conectado a Supabase
           </span>
        </div>
      </footer>
    </div>
  );
}
