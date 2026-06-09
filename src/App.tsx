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
import AppGrid, { AppCard } from './components/AppGrid';
import BottomNav from './components/BottomNav';
import { lazy, Suspense } from 'react';
import { AppItem, UserItem, AIConfig, DevRequest } from './types';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { ShieldAlert, Heart, Menu, Search, Bell, DownloadCloud, UploadCloud } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Footer from './components/Footer';
import { ContactView, LegalPage, HelpView, PrivacyPolicyView, TermsAndConditionsView, CookiePolicyView, AboutView } from './components/views/LegalViews';
import { GamesView, ExploreView, RankingView, DownloadsView, EventsView, AchievementsView, CollectionsView, SearchView } from './components/views/MainViews';
import { ProfileView } from './components/views/ProfileView';
import { supabase, isSupabaseConfigured } from './lib/supabase';

import { ErrorBoundary } from './components/ErrorBoundary';

const NexusHub = lazy(() => import('./components/NexusHub'));
const DeveloperPanel = lazy(() => import('./components/DeveloperPanel'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const NexusAIChat = lazy(() => import('./components/NexusAIChat'));
const GamesHubView = lazy(() => import('./components/views/GamesHubView').then(m => ({ default: m.GamesHubView })));
const AppDetailView = lazy(() => import('./components/views/AppDetailView').then(m => ({ default: m.AppDetailView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const SmartHubView = lazy(() => import('./components/views/SmartHubView').then(m => ({ default: m.SmartHubView })));
import AuthModal from './components/AuthModal';
import OfflineFallback from './components/OfflineFallback';
import OfflineIndicator from './components/OfflineIndicator';

import { useAppStore } from './store/useAppStore';

export const DEFAULT_SETTINGS = {
  storeName: 'NexusPlay',
  slogan: 'La plataforma digital de nueva generación',
  maintenanceMode: false,
};

export default function App() {
  const { t } = useAppStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [viewHistory, setViewHistory] = useState<string[]>(['home']);
  const [showDevPanel, setShowDevPanel] = useState(false);
  
  // Supabase Auth and User
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Data fetching state
  const [apps, setApps] = useState<AppItem[]>([]);
  const [platformName, setPlatformName] = useState('NexusPlay');
  const [webLogo, setWebLogo] = useState('https://res.cloudinary.com/dpp9889/image/upload/v1/logos/nexus_logo.png');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const fetchSiteSettings = async () => {
    try {
      if (!navigator.onLine) throw new Error("Offline");
      
      const fetchPromise = supabase.from('site_settings').select('*').single();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000));
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (!error && data) {
        if (data.platform_name) {
          setPlatformName(data.platform_name);
          document.title = data.platform_name;
        }
        if (data.logo_url) setWebLogo(data.logo_url);
        if (data.maintenance_mode !== undefined) setMaintenanceMode(data.maintenance_mode);
      } else {
        throw new Error("No data or error");
      }
    } catch (e) {
      console.warn("Settings fetch failed, using local fallback");
      document.title = 'NexusPlay';
      const localLogo = localStorage.getItem('nexus_web_logo');
      if (localLogo) setWebLogo(localLogo);
      const localMaintenance = localStorage.getItem('nexus_maintenance_mode') === 'true';
      if (localMaintenance) setMaintenanceMode(localMaintenance);
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
    enabled: true,
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
    let fallbackTimeout: any;

    const runInit = async () => {
      try {
        if (isSupabaseConfigured) {
          await fetchSiteSettings();
        } else {
          document.title = 'NexusPlay';
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    runInit();

    // Verify session
    if (isSupabaseConfigured && navigator.onLine) {
      supabase.auth.getSession().then(({ data: { session: fetchedSession } }: any) => {
        console.log("[Auth] Session loaded at startup:", !!fetchedSession);
        setSession(fetchedSession);
        if (fetchedSession?.user) {
          fetchUserProfile(fetchedSession.user.id, fetchedSession.user.email).finally(() => {
            setIsInitializing(false);
          });
        } else {
          setIsInitializing(false);
        }
      }).catch(e => {
        console.warn("getSession error", e);
        setIsInitializing(false);
      });
    } else {
      if (!navigator.onLine) {
        try {
          const cachedSession = localStorage.getItem('supabase.auth.token');
          if (cachedSession) {
            const parsed = JSON.parse(cachedSession);
            if (parsed && parsed.currentSession) {
              setSession(parsed.currentSession);
              if (parsed.currentSession.user) {
                 fetchUserProfile(parsed.currentSession.user.id, parsed.currentSession.user.email);
              }
            }
          }
        } catch(e) {}
      }
      setIsInitializing(false);
    }

    fallbackTimeout = setTimeout(() => {
      console.warn("Recovery mode activated: Forcing app initialization");
      setIsInitializing(false);
      if (!navigator.onLine) setIsOffline(true);
    }, 4000);

    return () => clearTimeout(fallbackTimeout);
  }, [isSupabaseConfigured]);

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
      return () => {
        window.removeEventListener('nexusLogoUpdated', handleLogoUpdate);
      };
    }
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`[Diagnostic] Auth event: ${_event}, Session valid: ${!!session}`);
      
      switch (_event) {
        case 'SIGNED_IN':
          console.log("[Diagnostic] SIGNED_IN event triggered.");
          setSession(session);
          if (session?.user) {
            fetchUserProfile(session.user.id, session.user.email);
            setShowAuthModal(false);
            // Force re-render of user specific fields by clearing temporary data if needed
          }
          break;
        case 'SIGNED_OUT':
          console.log("[Diagnostic] SIGNED_OUT event triggered.");
          setSession(null);
          setUserProfile(null);
          break;
        case 'TOKEN_REFRESHED':
          console.log("[Diagnostic] TOKEN_REFRESHED event triggered.");
          setSession(session);
          break;
        default:
          setSession(session);
          if (session?.user && !userProfile) {
            fetchUserProfile(session.user.id, session.user.email);
          }
          break;
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
  }, [webLogo]); // Removed isInitializing from dependencies to avoid listener churn

  const fetchUserProfile = async (userId: string, email?: string) => {
    try {
      if (!navigator.onLine) {
        throw new Error("Offline fetch profile fallback");
      }
      
      const sessionResponse = await supabase.auth.getSession();
      const freshSession = sessionResponse.data.session;
      
      const currentSession = freshSession || session;
      const finalEmail = email || currentSession?.user?.email || '';
      console.log("Intentando cargar perfil:", userId);

      // 1. Intentar obtener perfil existente
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (error) {
        console.warn("Error de red/permisos al cargar perfil:", error.message);
        setUserProfile({ id: userId, email: finalEmail, role: 'user', username: finalEmail.split('@')[0] || 'Usuario' });
        return;
      }

      const userMetadata = currentSession?.user?.user_metadata || {};
      const metaName = userMetadata?.full_name || userMetadata?.name || '';
      const metaAvatar = userMetadata?.avatar_url || userMetadata?.picture || null;

      if (!data) {
        console.log("Perfil no existe en DB. Creando...");
        const role = finalEmail === 'elmenorjn@gmail.com' ? 'admin' : 'user';
        const uniqueSuffix = userId.substring(0, 4);

        // Truncar username para evitar errores de longitud (máx 20 caracteres por seguridad)
        const baseName = (metaName || finalEmail.split('@')[0] || 'User')
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 15);
        const username = `${baseName || 'User'}_${uniqueSuffix}`;
        
        let createdProfile = null;
        let finalErr = null;
        
        const tryUpsert = async (withAvatar: boolean) => {
          const payload: any = {
            id: userId,
            email: finalEmail,
            role,
            username,
            real_name: metaName || null
          };
          if (withAvatar) payload.avatar_url = metaAvatar || null;
          
          return await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select().single();
        };

        const { data: created, error: insErr } = await tryUpsert(true);
        createdProfile = created;
        finalErr = insErr;

        if (insErr && insErr.message && insErr.message.includes('schema cache')) {
           const { data: retryCreated, error: retryErr } = await tryUpsert(false);
           createdProfile = retryCreated;
           finalErr = retryErr;
        }

        if (!finalErr && createdProfile) {
          setUserProfile(createdProfile);
        } else {
          console.error("No se pudo persistir el perfil:", finalErr);
          // Fallback local
          setUserProfile({ id: userId, email: finalEmail, role, username, real_name: metaName || null, avatar_url: metaAvatar || null });
        }
      } else {
        // Asegurar admin por email si es necesario
        if (data.email === 'elmenorjn@gmail.com' && data.role !== 'admin') {
          const { data: updated } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId).select().single();
          setUserProfile(updated || { ...data, role: 'admin' });
        } else {
          // Si tiene datos nuevos de Google y no están seteados, actualizarlos opcionalmente
          let needsUpdate = false;
          const updates: any = {};
          if (metaName && !data.real_name) {
            updates.real_name = metaName;
            needsUpdate = true;
          }
          if (metaAvatar && !data.avatar_url) {
            updates.avatar_url = metaAvatar;
            needsUpdate = true;
          }

          if (needsUpdate) {
            let updErr: any = null;
            let updated: any = null;
            let attempts = 0;
            while (attempts < 3) {
              const res = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
              updErr = res.error;
              updated = res.data;
              
              if (!updErr) {
                break;
              }
              if (updErr.message && updErr.message.includes('schema cache')) {
                attempts++;
                console.warn(`[App Profile Autosync] Schema cache error. Retrying attempt ${attempts} in 600ms...`);
                await new Promise(r => setTimeout(r, 600));
              } else {
                break;
              }
            }

            if (updErr) {
              setUserProfile(data);
            } else {
              setUserProfile(updated || { ...data, ...updates });
            }
          } else {
            setUserProfile(data);
          }
        }
        
        if (data.role === 'admin' || data.email === 'elmenorjn@gmail.com') {
          fetchAllData();
        }
      }
    } catch (e: any) {
      console.error("Fallo crítico en fetchUserProfile:", e);
      // Fallback fallback to ensure we don't break the app offline
      setUserProfile({ id: userId, email: email || 'offline@nexus.play', role: 'user', username: (email || 'Usuario').split('@')[0] });
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
    date: d.created_at,
    updated_at: d.updated_at,
    download_count: d.download_count || 0,
    view_count: d.view_count || 0,
    favorites_count: d.favorites_count || 0,
    likes_count: d.likes_count || 0,
  });

  const fetchApps = async () => {
    try {
      if (!navigator.onLine) {
        throw new Error("Dispositivo sin conexión a internet");
      }
      
      const fetchPromise = supabase.from('apps').select('*').order('created_at', { ascending: false });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout de conexión al cargar juegos")), 8000));
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (!error && data) {
        setApps(data.map(mapDbAppToAppItem));
        localStorage.setItem('nexus_cached_apps', JSON.stringify(data));
      } else {
        throw new Error(error?.message || "Error al leer de Supabase");
      }
    } catch (e: any) {
      console.warn("[Offline Cache] No se pudo leer de Supabase. Cargando copia en caché...", e.message || e);
      const cached = localStorage.getItem('nexus_cached_apps');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setApps(parsed.map(mapDbAppToAppItem));
          // Prevenir Toasts múltiples molestos en el boot
          setTimeout(() => {
            addToast('Cargado catálogo de apps offline desde almacenamiento local', 'info');
          }, 500);
        } catch (parseError) {
          console.error("Error cargando caché local de la tienda", parseError);
        }
      }
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addToast('Conexión reestablecida. Volviendo al modo online.', 'success');
      fetchApps();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      addToast('Has perdido la conexión. Entrando en modo offline.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const renderActiveView = () => {
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
            
            {/* Categorías */}
            <CategorySection 
               onCategoryClick={(cat) => {
                 setSearchQuery(cat);
                 setActiveView('search');
               }} 
               onSeeAll={() => setActiveView('games')} 
            />
            
            {/* Destacados (Horizontal Scrolling Premium) */}
            <div className="max-w-7xl mx-auto px-6 w-full mb-16 relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-cyan-400 rounded-full shadow-nexus-glow"></div>
                  Destacados
                </h2>
              </div>
              <AppGrid apps={publishedApps.length > 0 ? (publishedApps.filter(a => a.featured).length > 0 ? publishedApps.filter(a => a.featured) : publishedApps.sort((a,b) => b.rating - a.rating).slice(0, 10)) : []} onAppClick={handleAppClick} />
            </div>

            {/* Novedades */}
            <div className="max-w-7xl mx-auto px-6 w-full mb-16 relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                  {t('home.news')}
                </h2>
                <button onClick={() => setActiveView('games')} className="text-emerald-400 text-[13px] font-black hover:text-emerald-300 transition-colors uppercase tracking-widest hidden sm:block">
                  {t('home.seeAll')}
                </button>
              </div>
              <div className="flex gap-5 sm:gap-6 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory no-scrollbar w-full relative flex-nowrap pl-6 -ml-6 pr-6">
                {publishedApps.length > 0 ? [...publishedApps].sort((a, b) => new Date(b.updated_at || b.date || 0).getTime() - new Date(a.updated_at || a.date || 0).getTime()).slice(0, 8).map(app => {
                  const isUpdate = app.updated_at && new Date(app.updated_at).getTime() > new Date(app.date || 0).getTime() + 86400000;
                  return (
                    <div key={app.id} className="snap-start shrink-0">
                      <div 
                        onClick={() => handleAppClick(app)}
                        className="flex flex-col overflow-hidden bg-nexus-card border border-nexus-border hover:border-emerald-500/40 rounded-[24px] cursor-pointer transition-all duration-300 shadow-md hover:shadow-[0_15px_40px_rgba(52,211,153,0.15)] w-[260px] sm:w-[320px] group"
                      >
                         <div className="h-[140px] relative overflow-hidden bg-nexus-surface">
                           {app.screenshots && app.screenshots.length > 0 ? (
                             <img src={app.screenshots[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                           ) : (
                             <img src={app.icon} className="w-full h-full object-cover blur-md group-hover:scale-110 transition-transform duration-700 opacity-40 group-hover:opacity-60" />
                           )}
                           <div className="absolute inset-0 bg-gradient-to-t from-nexus-bg to-transparent"></div>
                           <div className="absolute top-3 left-3 bg-nexus-surface backdrop-blur-md px-2 py-1 rounded-lg border border-nexus-border flex items-center gap-1.5 shadow-lg">
                             <div className={`w-2 h-2 rounded-full animate-pulse ${isUpdate ? 'bg-blue-400' : 'bg-emerald-400'}`}></div>
                             <span className={`text-[9px] font-black tracking-widest uppercase ${isUpdate ? 'text-blue-400' : 'text-emerald-400'}`}>
                               {isUpdate ? t('home.news.update') : t('home.news.new')}
                             </span>
                           </div>
                           <div className="absolute top-3 right-3 bg-nexus-surface/90 backdrop-blur-md px-2 py-1 rounded-lg border border-nexus-border flex items-center shadow-lg">
                             <span className="text-[9px] font-mono tracking-widest uppercase text-nexus-text-sec flex items-center gap-1">
                               v{app.version || '1.0'} 
                               <span className={(!app.version_code || app.version_code < 10) ? "text-emerald-400" : "text-blue-400"}>({app.version_code || 1})</span>
                               <span className="ml-1 opacity-70">
                                 {(!app.version_code || app.version_code < 10) ? 'Menor' : 'Mayor'}
                               </span>
                             </span>
                           </div>
                         </div>
                         <div className="p-4 sm:p-5 flex items-start gap-4 -mt-8 relative z-10">
                           <img src={app.icon} className="w-16 h-16 rounded-[16px] object-cover bg-nexus-surface border border-nexus-border group-hover:scale-105 transition-transform duration-500 shadow-md shrink-0" />
                           <div className="flex-1 min-w-0 pt-8">
                             <h3 className="font-black text-lg text-nexus-text truncate group-hover:text-emerald-400 transition-colors">{app.name}</h3>
                             <p className="text-xs text-nexus-text-sec truncate font-medium">{app.developer}</p>
                           </div>
                         </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-nexus-text-sec text-sm w-full text-center py-6">{t('home.news.empty')}</div>
                )}
              </div>
            </div>

            {/* Popular Grid Vertical -> Changed to Horizontal */}
            <div className="max-w-7xl mx-auto px-6 w-full mb-16 relative">
               <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                    Tendencias Globales
                 </h2>
                 <button onClick={() => setActiveView('games')} className="text-purple-400 text-[13px] font-black hover:text-purple-300 transition-colors uppercase tracking-widest hidden sm:block">
                   Explorar Catálogo
                 </button>
               </div>
               
               <div className="flex gap-5 sm:gap-6 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory no-scrollbar w-full relative flex-nowrap pl-6 -ml-6 pr-6">
                 {publishedApps.length > 0 ? publishedApps.sort((a,b) => parseInt(String(b.downloads).replace(/\D/g,'') || '0') - parseInt(String(a.downloads).replace(/\D/g,'') || '0')).slice(0, 8).map(app => (
                    <div key={app.id} className="snap-start shrink-0">
                      <div 
                        onClick={() => handleAppClick(app)}
                        className="flex flex-col overflow-hidden bg-nexus-card border border-nexus-border hover:border-purple-500/40 rounded-[24px] cursor-pointer transition-all duration-300 shadow-md hover:shadow-[0_15px_40px_rgba(168,85,247,0.15)] w-[260px] sm:w-[320px] group"
                      >
                         <div className="h-[140px] relative overflow-hidden bg-nexus-surface">
                           {app.screenshots && app.screenshots.length > 0 ? (
                             <img src={app.screenshots[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                           ) : (
                             <img src={app.icon} className="w-full h-full object-cover blur-md group-hover:scale-110 transition-transform duration-700 opacity-40 group-hover:opacity-60" />
                           )}
                           <div className="absolute inset-0 bg-gradient-to-t from-nexus-bg to-transparent"></div>
                           <div className="absolute top-3 right-3 bg-nexus-surface backdrop-blur-md px-2 py-1 rounded-lg border border-nexus-border flex items-center gap-1 shadow-lg">
                             <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                             <span className="text-[10px] font-black text-nexus-text tracking-widest uppercase">Hot</span>
                           </div>
                         </div>
                         <div className="p-4 sm:p-5 flex items-start gap-4 -mt-8 relative z-10">
                           <img src={app.icon} className="w-14 h-14 rounded-2xl shadow-lg border-2 border-nexus-border bg-nexus-card shrink-0" />
                           <div className="flex-1 min-w-0 pt-8">
                             <h3 className="font-black text-nexus-text text-[16px] truncate group-hover:text-purple-400 transition-colors">{app.name}</h3>
                             <p className="text-[12px] text-nexus-text-sec font-medium truncate mt-0.5">{app.developer}</p>
                           </div>
                         </div>
                      </div>
                    </div>
                 )) : (
                    <div className="py-10 text-center text-nexus-text-sec font-medium w-full">Cargando tendencias...</div>
                 )}
               </div>
            </div>
            
            {/* Nuevos Lanzamientos */}
            <div className="max-w-7xl mx-auto px-6 w-full mb-24">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    Nuevos Lanzamientos
                 </h2>
               </div>
               
               <div className="flex gap-5 sm:gap-6 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory no-scrollbar w-full relative flex-nowrap pl-6 -ml-6 pr-6">
                 {publishedApps.length > 0 ? publishedApps.slice(-8).reverse().map(app => (
                    <div key={app.id} className="snap-start shrink-0">
                      <div 
                        onClick={() => handleAppClick(app)}
                        className="flex flex-row items-center overflow-hidden bg-nexus-card border border-nexus-border hover:border-blue-500/40 rounded-[20px] cursor-pointer transition-all duration-300 shadow-md hover:shadow-[0_10px_30px_rgba(59,130,246,0.15)] group hover:bg-nexus-card p-4 w-[280px] sm:w-[340px]"
                      >
                         <img src={app.icon} className="w-16 h-16 rounded-[16px] object-cover bg-nexus-surface group-hover:scale-105 transition-transform duration-500 shadow-md shrink-0" />
                         <div className="ml-4 flex-1 min-w-0">
                            <h4 className="text-[15px] font-black text-nexus-text truncate group-hover:text-blue-400 transition-colors">{app.name}</h4>
                            <p className="text-[11px] font-bold tracking-widest uppercase text-blue-500/80 truncate mt-1">{app.category}</p>
                            <div className="flex items-center gap-2 mt-2">
                               <div className="flex items-center gap-1.5 opacity-80">
                                 <span className="text-[10px] text-nexus-text-sec font-black tracking-widest">{app.rating}</span>
                                 <span className="text-yellow-400 text-[10px]">★</span>
                               </div>
                               <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded-md border border-blue-500/20">Nuevo</span>
                            </div>
                         </div>
                      </div>
                    </div>
                 )) : null}
               </div>
            </div>
          </>
        );
      case 'games':
        return <GamesView apps={publishedApps} onAppClick={handleAppClick} />;
      case 'games-hub':
        return <GamesHubView onBack={() => setActiveView('home')} apps={publishedApps} session={session} userProfile={userProfile} />;
      case 'explore':
        return <ExploreView apps={publishedApps} onAppClick={handleAppClick} onAction={(action) => setActiveView(action)} />;
      case 'ranking':
        return <RankingView apps={publishedApps} onAppClick={handleAppClick} />;
      case 'search':
        return <SearchView apps={publishedApps} onAppClick={handleAppClick} onBack={() => setActiveView('home')} initialQuery={searchQuery} />;
      case 'nexus-hub':
        if (isOffline) {
          return (
            <OfflineFallback 
              onBack={() => setActiveView('home')} 
              onGoToGames={() => setActiveView('games-hub')} 
              title="Comunidades Desconectadas"
              description="La sala de chat Nexus Hub y los canales de la comunidad requieren conexión a internet en tiempo real para enviar y recibir mensajes. ¡Vuelve en cuanto recuperes señal!"
            />
          );
        }
        return <NexusHub session={session} userProfile={userProfile} onBack={() => setActiveView('home')} />;
      case 'admin-panel':
        if (isOffline) {
          return (
            <OfflineFallback 
              onBack={() => setActiveView('home')} 
              onGoToGames={() => setActiveView('games-hub')} 
              title="Panel de Administración Bloqueado"
              description="El panel de control administrativo y la aprobación de apps requieren sincronización directa con los servicios en la nube de Supabase."
            />
          );
        }
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
      case 'smart-hub':
         return <SmartHubView onBack={() => setActiveView('home')} apps={publishedApps} onAppClick={handleAppClick} userProfile={userProfile} />;
      case 'nexus-ai':
        if (isOffline) {
          return (
            <OfflineFallback 
              onBack={() => setActiveView('home')} 
              onGoToGames={() => setActiveView('games-hub')} 
              title="Asistente de IA Desconectado"
              description="Nexus AI requiere conexión a internet para procesar peticiones y generar respuestas a través del modelo de inteligencia artificial Google Gemini."
            />
          );
        }
        return <NexusAIChat apps={publishedApps} apiKey={aiConfig.apiKey} onBack={() => setActiveView('home')} onAppClick={handleAppClick} userProfile={userProfile} />;
      case 'profile':
        return (
          <ErrorBoundary>
            <ProfileView 
              session={session} 
              userProfile={userProfile} 
              onLoginClick={() => setShowAuthModal(true)} 
              onLogoutClick={() => { handleLogout(); }}
              onSettingsClick={() => setActiveView('settings')}
              onDeveloperAction={(action) => {
                if (action === 'activate') {
                  handleActivateDeveloper();
                } else if (action === 'open') {
                  setDevPanelInitialTab('upload');
                  setShowDevPanel(true);
                }
              }}
            />
          </ErrorBoundary>
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
        return <AchievementsView userProfile={userProfile} />;
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
            <p className="text-nexus-text-sec">Página no encontrada o en desarrollo.</p>
            <button 
              onClick={() => setActiveView('home')}
              className="mt-8 px-6 py-2 bg-nexus-card border border-nexus-border rounded-xl hover:bg-nexus-cyan/10 hover:text-nexus-cyan transition-all"
            >
              Volver al inicio
            </button>
          </div>
        );
    }
  };

  const isFullScreenView = activeView === 'nexus-ai' || activeView === 'admin-panel' || activeView === 'search' || activeView === 'nexus-hub' || activeView === 'games-hub';

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-nexus-card text-nexus-text flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center">
          {/* Pulsing and spinning neon loader */}
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-cyan-500/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute top-2 left-2 right-2 bottom-2 border-4 border-emerald-500/10 rounded-full"></div>
            <div className="absolute top-2 left-2 right-2 bottom-2 border-4 border-b-emerald-400 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]"></div>
          </div>
          <h2 className="text-sm font-bold tracking-widest text-cyan-400/85 animate-pulse uppercase">Cargando NexusPlay</h2>
          <p className="text-[10px] text-nexus-text-sec mt-2 font-mono uppercase tracking-widest">Sincronizando servicios</p>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-nexus-card text-nexus-text flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-nexus-card border border-nexus-border p-8 rounded-2xl shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 animate-bounce">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black mb-2 uppercase tracking-tight text-nexus-text">Supabase no configurado</h1>
          <p className="text-nexus-text-sec text-sm mb-6 leading-relaxed">
            La aplicación no se ha podido conectar a Supabase. 
            <br/><br/>
            Si estás en <strong>Vercel</strong>, debes ir a la configuración de tu proyecto: <br/>
            <span className="text-nexus-text">Settings &gt; Environment Variables</span><br/>
            y añadir <code className="bg-nexus-card-hover text-nexus-text font-bold px-1 py-0.5 rounded text-xs font-mono">VITE_SUPABASE_URL</code> y <code className="bg-nexus-card-hover text-nexus-text font-bold px-1 py-0.5 rounded text-xs font-mono">VITE_SUPABASE_ANON_KEY</code>.
            Luego, vuelve a hacer un deploy (Redeploy).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-[100vw] overflow-x-hidden bg-nexus-bg text-nexus-text font-sans selection:bg-nexus-cyan/30 flex flex-col relative w-full">
      <GoogleAdSense />
      <OfflineIndicator />
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
          onProfileClick={() => setActiveView('profile')}
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
        userProfile={userProfile}
        onLogout={handleLogout}
        webLogo={webLogo}
        platformName={platformName}
      />

      {isFullScreenView ? (
         <div className="flex-1 w-full h-screen">
            <Suspense fallback={<div className="flex w-full h-full items-center justify-center font-mono text-cyan-400 animate-pulse bg-nexus-card">Cargando Módulo...</div>}>
              {renderActiveView()}
            </Suspense>
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
              <Suspense fallback={<div className="flex h-[50vh] items-center justify-center font-mono text-cyan-400 animate-pulse">Cargando Sección...</div>}>
                {renderActiveView()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      )}

      {!isFullScreenView && !activeView.startsWith('app/') && (
        <Footer onNavigate={handleAction} />
      )}

      {showDevPanel && session && (
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-nexus-surface font-mono text-cyan-400 animate-pulse">Cargando Panel Dev...</div>}>
          <DeveloperPanel 
            userId={session.user.id}
            userProfile={userProfile}
            onAddApp={handleAddApp} 
            onClose={() => setShowDevPanel(false)}
            publishedApps={apps.filter(a => a.developerId === session.user.id || a.developer === userProfile?.username)} 
          />
        </Suspense>
      )}

      {!showAuthModal && activeView !== 'nexus-ai' && activeView !== 'admin-panel' && activeView !== 'nexus-hub' && (
        <BottomNav activeView={activeView} onNavigate={handleAction} />
      )}
    </div>
  );
}
