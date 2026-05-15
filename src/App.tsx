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
import { ContactView, LegalPage, HelpView, PrivacyPolicyView, TermsAndConditionsView, CookiePolicyView, AboutView } from './components/views/LegalViews';
import { GamesView, ExploreView, RankingView, ProfileView, DownloadsView, EventsView, AchievementsView, CollectionsView, SearchView } from './components/views/MainViews';
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
    // Aplicar logo web si existe
    const webLogo = localStorage.getItem('nexus_web_logo');
    if (webLogo) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = webLogo;
    }

    if (!isSupabaseConfigured) {
      addToast('Faltan configurar variables de entorno de Supabase.', 'error');
      return;
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
    };
  }, []);

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
    if (!session?.user) {
      addToast('Debes iniciar sesión para publicar.', 'error');
      return;
    }
    
    try {
      console.log("Intentando publicar app:", newApp.name);
      
      // ASEGURAR PERFIL ANTES DE PUBLICAR (SOLUCIÓN DEFINITIVA 23503)
      try {
        const uId = session.user.id;
        const uEmail = session.user.email || '';
        
        console.log("Verificando integridad de perfil en DB para:", uId);
        
        const suffix = uId.substring(0, 4);
        const base = (uEmail.split('@')[0] || 'User').substring(0, 15);
        const finalRole = (uEmail === 'elmenorjn@gmail.com') ? 'admin' : (userProfile?.role || 'developer');

        // Intentar asegurar el perfil con reintento simple
        const { error: syncErr } = await supabase.from('profiles').upsert({
          id: uId,
          username: `${base}_${suffix}`,
          email: uEmail,
          role: finalRole
        }, { onConflict: 'id' });
        
        if (syncErr) {
          console.error("Fallo crítico de registro de perfil:", syncErr);
          
          if (syncErr.code === '42501') {
            addToast("⚠️ ERROR DE PRIVACIDAD: Supabase bloquea el registro. SOLUCIÓN: Ve a SQL Editor y ejecuta: ALTER TABLE profiles DISABLE ROW LEVEL SECURITY; ALTER TABLE apps DISABLE ROW LEVEL SECURITY; ALTER TABLE stats DISABLE ROW LEVEL SECURITY;", "error");
          } else {
            addToast(`Error de Vínculo (${syncErr.code}): ${syncErr.message}`, "error");
          }
        }
        
        console.log("Perfil asegurado correctamente con rol:", finalRole);
      } catch (err) {
        console.warn("Error no controlado en orquestación de perfil:", err);
      }

      const appData: any = {
        developer_id: session.user.id,
        app_name: newApp.name,
        company_name: newApp.developer || userProfile?.username || 'Indie Dev',
        description: newApp.description || '',
        category: newApp.category || 'Juegos',
        size: newApp.size || 'Desconocido',
        version: newApp.version || '1.0.0',
        icon_url: newApp.icon,
        icon_public_id: newApp.iconPublicId,
        screenshots: newApp.screenshots || [],
        screenshots_public_ids: newApp.screenshotsPublicIds || [],
        download_url: newApp.downloadUrl || '',
        status: 'published',
        rating: 5.0,
        downloads: '0',
        price: 'Gratis',
        featured: false
      };

      console.log("Datos a insertar en apps:", appData);
      const { data, error } = await supabase.from('apps').insert([appData]).select();

      if (error) {
        console.error("Error Detallado Supabase (apps insert):", error);
        let msg = `Error (${error.code}): ${error.message}`;
        
        if (error.code === '42501') {
          msg = 'Error de Seguridad: No tienes permisos de escritura (RLS).';
        } else if (error.code === '23503') {
          msg = 'Error de Referencia: Tu cuenta no está vinculada correctamente. Intenta cerrar sesión y volver a entrar.';
        }
        
        addToast(msg, 'error');
      } else {
        console.log("App publicada con éxito:", data);
        addToast('¡Aplicación lanzada con éxito!', 'success');
        fetchApps(); // Refrescar lista
      }
    } catch (err: any) {
      console.error("Error inesperado en handleAddApp:", err);
      addToast('Error inesperado: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  const publishedApps = apps.filter(a => a.status === 'published');

  const ActiveViewContent = () => {
    switch (activeView) {
      case 'home':
        return (
          <>
            <Hero storeName={settings.storeName} slogan={settings.slogan} />
            <CategorySection />
            <AppGrid apps={publishedApps} />
          </>
        );
      case 'games':
        return <GamesView apps={publishedApps} />;
      case 'explore':
        return <ExploreView apps={publishedApps} />;
      case 'ranking':
        return <RankingView apps={publishedApps} />;
      case 'search':
        return <SearchView apps={publishedApps} />;
      case 'admin-panel':
        return (
           <AdminPanel 
             onBack={() => setActiveView('home')} 
             userProfile={userProfile}
             apps={apps} 
             setApps={setApps} 
             devRequests={devRequests}
             setDevRequests={setDevRequests}
           />
        );
      case 'nexus-ai':
        return <NexusAIChat apiKey={aiConfig.apiKey} onBack={() => setActiveView('home')} />;
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
      case 'favorites':
        return (
          <div className="pt-24 px-6 max-w-7xl mx-auto pb-16 min-h-[60vh]">
            <h1 className="text-3xl font-black flex items-center gap-3 mb-8"><Heart className="w-8 h-8 text-red-500" /> Mis Favoritos</h1>
            <AppGrid apps={publishedApps.slice(0,2)} />
          </div>
        );
      case 'downloads':
        return <DownloadsView apps={publishedApps} />;
      case 'events':
        return <EventsView />;
      case 'achievements':
        return <AchievementsView />;
      case 'collections':
        return <CollectionsView />;
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

  const isFullScreenView = activeView === 'nexus-ai' || activeView === 'admin-panel';

  return (
    <div className="min-h-screen bg-nexus-bg text-white font-sans selection:bg-nexus-cyan/30 flex flex-col">
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

      {!isFullScreenView && (
        <Footer onNavigate={handleAction} />
      )}

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
          publishedApps={apps.filter(a => a.developerId === session.user.id || a.developer === userProfile?.username)} 
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

      {!showAuthModal && activeView !== 'nexus-ai' && activeView !== 'admin-panel' && (
        <BottomNav activeView={activeView} onNavigate={handleAction} />
      )}
    </div>
  );
}
