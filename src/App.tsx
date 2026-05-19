/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import GoogleAdSense from './components/GoogleAdSense';
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
import { ContactView, LegalPage, HelpView, PrivacyPolicyView, TermsAndConditionsView, CookiePolicyView, AboutView } from './components/views/LegalViews';
import { GamesView, ExploreView, RankingView, ProfileView, DownloadsView, EventsView, AchievementsView, CollectionsView, SearchView } from './components/views/MainViews';
import { AppDetailView } from './components/views/AppDetailView';
import { SettingsView } from './components/views/SettingsView';
import NexusHub from './components/NexusHub';
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
  const [viewHistory, setViewHistory] = useState<string[]>(['home']);
  const [showDevPanel, setShowDevPanel] = useState(false);
  
  // Supabase Auth and User
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data fetching state
  const [apps, setApps] = useState<AppItem[]>([]);
  const [platformName, setPlatformName] = useState('NexusPlay');
  const [webLogo, setWebLogo] = useState('https://res.cloudinary.com/dpp9889/image/upload/v1/logos/nexus_logo.png');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Fetch Site Settings from Supabase
  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*').single();
      if (!error && data) {
        if (data.platform_name) setPlatformName(data.platform_name);
        if (data.logo_url) setWebLogo(data.logo_url);
        if (data.maintenance_mode !== undefined) setMaintenanceMode(data.maintenance_mode);
      } else {
        const localLogo = localStorage.getItem('nexus_web_logo');
        if (localLogo) setWebLogo(localLogo);
        const localMaintenance = localStorage.getItem('nexus_maintenance_mode') === 'true';
        if (localMaintenance) setMaintenanceMode(localMaintenance);
      }
    } catch (e) {
      console.warn("Settings fetch failed");
    }
  };
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
    apiKey: localStorage.getItem('nexus_ai_key') || import.meta.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-2.0-flash',
    endpoint: 'https://generativelanguage.googleapis.com'
  };
  const [aiConfig, setAiConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);

  const handleLogout = async () => {
    // 1. Limpieza total de estados locales
    setSession(null);
    setUserProfile(null);
    setActiveView('home');
    setShowDevPanel(false);
    setIsSidebarOpen(false);
    
    try {
      // 2. Notificar a Supabase
      await supabase.auth.signOut();
      
      // 3. Limpiar TODO el rastro local
      localStorage.clear();
      sessionStorage.clear();
      
      // Limpiar cookies vinculadas
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }

      console.log("Cierre de sesión profundo completado.");
    } catch (e) {
      console.warn("Error en proceso de logout:", e);
    }

    addToast('Sesión cerrada. Reiniciando...', 'success');

    // 4. Salto total fuera de la caché para permitir login limpio
    setTimeout(() => {
      // Redirección forzada con timestamp para romper cualquier estado de iframe/caché
      const baseUrl = window.location.origin + window.location.pathname;
      window.location.href = `${baseUrl}?v=${Date.now()}`;
    }, 400);
  };

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  useEffect(() => {
    // Aplicar logo web y favicon
    if (webLogo) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = webLogo;
    }

    const handleLogoUpdate = (e: any) => {
      if (e.detail) setWebLogo(e.detail);
    };
    window.addEventListener('nexusLogoUpdated', handleLogoUpdate);

    if (!isSupabaseConfigured) {
      addToast('Faltan configurar variables de entorno de Supabase.', 'error');
      return () => window.removeEventListener('nexusLogoUpdated', handleLogoUpdate);
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth event:", _event, !!session);
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email);
      } else {
        setUserProfile(null);
      }
    });

    fetchApps();

    const appsSubscription = supabase
      .channel('apps-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apps' }, payload => {
        if (payload.eventType === 'INSERT') {
          const newApp = mapDbAppToAppItem(payload.new);
          setApps(prev => [newApp, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedApp = mapDbAppToAppItem(payload.new);
          setApps(prev => prev.map(a => a.id === updatedApp.id ? updatedApp : a));
        } else if (payload.eventType === 'DELETE') {
          setApps(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(appsSubscription);
      window.removeEventListener('nexusLogoUpdated', handleLogoUpdate);
    };
  }, [webLogo]);

  const fetchUserProfile = async (userId: string, email?: string) => {
    try {
      const finalEmail = email || session?.user?.email || '';
      console.log("Intentando cargar perfil:", userId);

      // 1. Intentar obtener perfil existente
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (error) {
        console.warn("Error de red/permisos al cargar perfil:", error.message);
        setUserProfile({ id: userId, email: finalEmail, role: 'user', username: finalEmail.split('@')[0] || 'Usuario' });
        return;
      }

      if (!data) {
        console.log("Perfil no existe en DB. Creando...");
        const role = finalEmail === 'elmenorjn@gmail.com' ? 'admin' : 'user';
        const uniqueSuffix = userId.substring(0, 4);
        // Truncar username para evitar errores de longitud (máx 20 caracteres por seguridad)
        const baseName = (finalEmail.split('@')[0] || 'User').substring(0, 15);
        const username = `${baseName}_${uniqueSuffix}`;
        
        const { data: created, error: insErr } = await supabase.from('profiles').insert({
          id: userId,
          email: finalEmail,
          role,
          username
        }).select().single();

        if (!insErr && created) {
          setUserProfile(created);
        } else {
          console.error("No se pudo persistir el perfil:", insErr);
          // Fallback local
          setUserProfile({ id: userId, email: finalEmail, role, username });
        }
      } else {
        // Asegurar admin por email si es necesario
        if (data.email === 'elmenorjn@gmail.com' && data.role !== 'admin') {
          const { data: updated } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId).select().single();
          setUserProfile(updated || { ...data, role: 'admin' });
        } else {
          setUserProfile(data);
        }
        
        if (data.role === 'admin' || data.email === 'elmenorjn@gmail.com') {
          fetchAllData();
        }
      }
    } catch (e: any) {
      console.error("Fallo crítico en fetchUserProfile:", e);
    }
  };

  const mapDbAppToAppItem = (d: any): AppItem => ({
    id: d.id,
    name: d.app_name,
    developer: d.company_name,
    developerId: d.developer_id,
    description: d.description,
    category: d.category,
    size: d.size,
    version: d.version,
    version_code: d.version_code,
    changelog: d.changelog,
    previous_versions: d.previous_versions || [],
    icon: d.icon_url,
    iconPublicId: d.icon_public_id,
    screenshots: d.screenshots,
    screenshotsPublicIds: d.screenshots_public_ids,
    downloadUrl: d.download_url,
    status: d.status,
    featured: d.featured,
    rating: typeof d.rating === 'string' ? parseFloat(d.rating) : d.rating || 5.0,
    downloads: d.downloads,
    price: d.price,
    date: d.created_at
  });

  const fetchApps = async () => {
    const { data } = await supabase.from('apps').select('*').order('created_at', { ascending: false });
    if (data) {
      setApps(data.map(mapDbAppToAppItem));
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
        return;
      }
      setViewHistory(prev => [...prev, id]);
      setActiveView(id);
    } else if (id === 'dev-panel') {
      if (!session) {
        setShowAuthModal(true);
      } else {
        setDevPanelInitialTab('upload');
        setShowDevPanel(true);
      }
    } else {
      setViewHistory(prev => [...prev, id]);
      setActiveView(id);
    }
  };

  const handleAppClick = (app: AppItem) => {
    const nextView = `app/${app.id}`;
    setViewHistory(prev => [...prev, nextView]);
    setActiveView(nextView);
  };

  const handleBack = () => {
    if (viewHistory.length > 1) {
      const newHistory = [...viewHistory];
      newHistory.pop(); // Remove current view
      const prevView = newHistory[newHistory.length - 1];
      setViewHistory(newHistory);
      setActiveView(prevView);
    } else {
      setActiveView('home');
    }
  };

  const handleAddApp = async () => {
    addToast('¡Aplicación lanzada con éxito y en espera de revisión!', 'success');
    fetchApps();
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  const publishedApps = apps.filter(a => a.status === 'published');

  const ActiveViewContent = () => {
    if (activeView.startsWith('app/')) {
      const appId = activeView.split('/')[1];
      const app = apps.find(a => a.id === appId);
      if (app) {
         // Derive back label from history
         let backLabel = "Volver";
         if (viewHistory.length > 1) {
           const prev = viewHistory[viewHistory.length - 2];
           if (prev === 'search') backLabel = "Volver a Búsqueda";
           else if (prev === 'games') backLabel = "Volver a Juegos";
           else if (prev === 'explore') backLabel = "Volver a Explorar";
           else if (prev === 'downloads') backLabel = "Volver a Descargas";
           else if (prev === 'home') backLabel = "Volver al Inicio";
         }
         return <AppDetailView app={app} apps={publishedApps} onBack={handleBack} onAppClick={handleAppClick} backLabel={backLabel} />;
      }
    }

    switch (activeView) {
      case 'home':
        return (
          <>
            <Hero storeName={settings.storeName} slogan={settings.slogan} onAction={(action) => setActiveView(action)} />
            <CategorySection 
               onCategoryClick={(cat) => {
                 setSearchQuery(cat);
                 setActiveView('search');
               }} 
               onSeeAll={() => setActiveView('games')} 
            />
            <div className="max-w-7xl mx-auto px-6 w-full mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                  Apps Destacadas
                </h2>
              </div>
              <AppGrid apps={publishedApps.length > 0 ? (publishedApps.filter(a => a.featured).length > 0 ? publishedApps.filter(a => a.featured) : publishedApps.sort((a,b) => b.rating - a.rating).slice(0, 10)) : []} onAppClick={handleAppClick} />
            </div>
          </>
        );
      case 'games':
        return <GamesView apps={publishedApps} onAppClick={handleAppClick} />;
      case 'explore':
        return <ExploreView apps={publishedApps} onAppClick={handleAppClick} onAction={(action) => setActiveView(action)} />;
      case 'ranking':
        return <RankingView apps={publishedApps} onAppClick={handleAppClick} />;
      case 'search':
        return <SearchView apps={publishedApps} onAppClick={handleAppClick} onBack={() => setActiveView('home')} initialQuery={searchQuery} />;
      case 'nexus-hub':
        return <NexusHub session={session} userProfile={userProfile} onBack={() => setActiveView('home')} />;
      case 'admin-panel':
        return (
           <AdminPanel 
             onBack={() => setActiveView('home')} 
             userProfile={userProfile}
             apps={apps} 
             setApps={setApps} 
             devRequests={devRequests}
             setDevRequests={setDevRequests}
             aiConfig={aiConfig}
           />
        );
      case 'nexus-ai':
        return <NexusAIChat apps={publishedApps} apiKey={aiConfig.apiKey} onBack={() => setActiveView('home')} onAppClick={handleAppClick} />;
      case 'profile':
        return (
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
        );
      case 'settings':
        return <SettingsView onBack={() => setActiveView('home')} userProfile={userProfile} />;
      case 'favorites':
        return (
          <div className="pt-24 px-6 max-w-7xl mx-auto pb-16 min-h-[60vh]">
            <h1 className="text-3xl font-black flex items-center gap-3 mb-8"><Heart className="w-8 h-8 text-red-500" /> Mis Favoritos</h1>
            <AppGrid apps={publishedApps.filter((_:any, i:number) => i % 4 === 0).slice(0, 4)} onAppClick={handleAppClick} />
          </div>
        );
      case 'downloads':
        return <DownloadsView apps={publishedApps} onAppClick={handleAppClick} />;
      case 'events':
        return <EventsView apps={publishedApps} onAppClick={handleAppClick} />;
      case 'achievements':
        return <AchievementsView />;
      case 'collections':
        return <CollectionsView apps={publishedApps} onAppClick={handleAppClick} />;
      case 'contact':
        return <ContactView onBack={() => setActiveView('home')} />;
      case 'help':
        return <HelpView onBack={() => setActiveView('home')} />;
      case 'privacy':
        return <PrivacyPolicyView storeName={settings.storeName} onBack={() => setActiveView('home')} />;
      case 'terms':
        return <TermsAndConditionsView storeName={settings.storeName} onBack={() => setActiveView('home')} />;
      case 'cookies':
        return <CookiePolicyView storeName={settings.storeName} onBack={() => setActiveView('home')} />;
      case 'about':
        return <AboutView storeName={settings.storeName} onBack={() => setActiveView('home')} />;
      default:
        // Attempt to redirect if unknown view
        return (
          <div className="pt-32 px-6 min-h-[60vh] flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-black neon-text-gradient mb-4 uppercase tracking-tighter">404</h1>
            <p className="text-gray-400">Página no encontrada o en desarrollo.</p>
            <button 
              onClick={() => setActiveView('home')}
              className="mt-8 px-6 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-nexus-cyan/10 hover:text-nexus-cyan transition-all"
            >
              Volver al inicio
            </button>
          </div>
        );
    }
  };

  const isFullScreenView = activeView === 'nexus-ai' || activeView === 'admin-panel' || activeView === 'search' || activeView === 'nexus-hub';

  return (
    <div className="min-h-screen max-w-[100vw] overflow-x-hidden bg-nexus-bg text-white font-sans selection:bg-nexus-cyan/30 flex flex-col relative w-full">
      <GoogleAdSense />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={() => {
            setShowAuthModal(false);
            addToast('Sesión iniciada correctamente', 'success');
          }}
          onNavigate={(view) => {
            setShowAuthModal(false);
            setActiveView(view);
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

      {!showAuthModal && !isFullScreenView && (
        <Navbar 
          onMenuClick={() => setIsSidebarOpen(true)} 
          userProfile={userProfile} 
          session={session}
          onLoginClick={() => setShowAuthModal(true)} 
          onLogoutClick={handleLogout} 
          onSearchClick={() => setActiveView('search')}
          platformName={platformName}
          webLogo={webLogo}
        />
      )}
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onAction={handleAction}
        isAdmin={isAdmin}
        session={session}
        onLogout={handleLogout}
      />

      {isFullScreenView ? (
         <div className="flex-1 w-full h-screen">
            <ActiveViewContent />
         </div>
      ) : (
        <main className="max-w-7xl mx-auto flex-1 w-full relative z-10 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 w-full flex flex-col"
            >
              <ActiveViewContent />
            </motion.div>
          </AnimatePresence>
        </main>
      )}

      {!isFullScreenView && !activeView.startsWith('app/') && (
        <Footer onNavigate={handleAction} />
      )}

      {showDevPanel && session && (
        <DeveloperPanel 
          userId={session.user.id}
          userProfile={userProfile}
          onAddApp={handleAddApp} 
          onClose={() => setShowDevPanel(false)}
          publishedApps={apps.filter(a => a.developerId === session.user.id || a.developer === userProfile?.username)} 
        />
      )}

      {!showAuthModal && activeView !== 'nexus-ai' && activeView !== 'admin-panel' && activeView !== 'nexus-hub' && (
        <BottomNav activeView={activeView} onNavigate={handleAction} />
      )}
    </div>
  );
}
