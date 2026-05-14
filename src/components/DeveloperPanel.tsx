import { useState, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, CheckCircle, ShieldAlert, Send, Code, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AppItem, DevRequest } from '../types';
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../lib/cloudinary';

interface DeveloperPanelProps {
  userEmail: string | null;
  userId: string;
  userProfile: any;
  isApproved: boolean;
  devRequests: DevRequest[];
  setDevRequests: (reqs: DevRequest[]) => void;
  onAddApp: (app: AppItem) => void;
  onUpdateApp: (app: AppItem) => void;
  onClose: () => void;
  publishedApps: AppItem[];
  initialTab?: 'upload' | 'my-apps' | 'requirements';
  onRoleChange?: (role: string) => void;
}

export default function DeveloperPanel({ 
  userEmail, 
  userId, 
  userProfile, 
  isApproved, 
  devRequests, 
  setDevRequests, 
  onAddApp, 
  onUpdateApp, 
  onClose, 
  publishedApps,
  initialTab = 'upload',
  onRoleChange
}: DeveloperPanelProps) {
  const [reqData, setReqData] = useState({ company: '', teamDescription: '', experience: '', appTypes: '', links: '', message: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    company: userProfile?.username || '',
    description: '',
    category: 'Herramientas',
    size: '',
    version: '',
    icon: '',
    screenshot: '',
    screenshot2: '',
    changelog: '',
    downloadUrl: ''
  });

  const [publicIds, setPublicIds] = useState({
    icon: '',
    screenshot: '',
    screenshot2: ''
  });
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'my-apps' | 'requirements'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [currentRequest, setCurrentRequest] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      supabase.from('developer_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setCurrentRequest(data[0]);
          }
        });
    }
  }, [userId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'icon' | 'screenshot' | 'screenshot2') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      // Usamos el nombre de la app para la carpeta, o el usuario si no hay nombre aún
      const folderName = formData.name.trim() || userProfile?.username || 'unknown_app';
      
      const result = await uploadToCloudinary(file, folderName);
      
      setFormData(prev => ({ ...prev, [field]: result.url }));
      setPublicIds(prev => ({ ...prev, [field]: result.public_id }));
    } catch (error: any) {
      alert("Error al subir imagen: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleActivateAccount = async () => {
    if (!userId) return;
    
    setIsUploading(true);
    try {
      console.log("Activando cuenta para:", userId);
      
      const email = userEmail || userProfile?.email || '';
      if (!email) throw new Error("No se encontró el email del usuario.");
      
      // 1. Asegurar existencia de perfil y rol de developer
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!dbProfile) {
        // CREAR perfil si no existe
        const uniqueSuffix = userId.substring(0, 4);
        const baseUsername = email.split('@')[0] || 'User';
        const finalUsername = `${baseUsername}_${uniqueSuffix}`.substring(0, 20);
        
        const { error: insErr } = await supabase.from('profiles').insert({
          id: userId,
          username: finalUsername,
          email: email,
          role: 'developer'
        });
        if (insErr) throw insErr;
      } else {
        // ACTUALIZAR rol si ya existe
        const { error: updErr } = await supabase.from('profiles').update({
          role: 'developer'
        }).eq('id', userId);
        if (updErr) throw updErr;
      }

      // 2. Registro en developer_requests (Aseguramos nombre de tabla correcto)
      try {
        await supabase.from('developer_requests').upsert({ 
          user_id: userId, 
          full_name: userProfile?.username || email.split('@')[0],
          studio_name: 'Indie Studio',
          status: 'approved',
          experience: 'Actuación automática'
        }, { onConflict: 'user_id' });
      } catch (e) { 
        console.warn("Log error ignorado:", e); 
      }

      // 3. Notificar éxito
      onRoleChange?.('developer');
      setActiveTab('upload');
      setCurrentRequest({ status: 'approved' });
      
    } catch (err: any) {
      console.error("Error crítico en activación:", err);
      alert("Error al activar perfil: " + (err.message || "Vuelve a intentar"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isUploading) {
      alert("Espera a que las imágenes se suban a la nube...");
      return;
    }

    if (!formData.icon) {
      alert("El icono es obligatorio para que los usuarios reconozcan tu app.");
      return;
    }

    if (!formData.screenshot) {
      alert("Sube al menos una captura de pantalla para mostrar tu juego.");
      return;
    }

    const newApp: AppItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      developer: formData.company,
      description: formData.description + (formData.changelog ? `\n\n### Novedades\n${formData.changelog}` : ''),
      category: formData.category,
      size: formData.size || 'Desconocido',
      version: formData.version || '1.0.0',
      icon: formData.icon,
      iconPublicId: publicIds.icon,
      screenshots: [formData.screenshot, formData.screenshot2].filter(Boolean),
      screenshotsPublicIds: [publicIds.screenshot, publicIds.screenshot2].filter(Boolean),
      downloadUrl: formData.downloadUrl,
      status: 'published',
      rating: 5.0,
      downloads: '0',
      price: 'Gratis',
      date: new Date().toISOString()
    };
    
    onAddApp(newApp);
    setIsSuccess(true);
    
    setTimeout(() => {
      setIsSuccess(false);
      setFormData({
        name: '',
        company: userProfile?.username || '',
        description: '',
        category: 'Juegos',
        size: '',
        version: '',
        icon: '',
        screenshot: '',
        screenshot2: '',
        changelog: '',
        downloadUrl: ''
      });
      setActiveTab('my-apps');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-4xl bg-[#030712] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-cyan-400 uppercase tracking-tight">Panel Desarrollador</h2>
            <p className="text-gray-400 text-sm">Gestiona y publica tus apps</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 md:p-8 flex-1 custom-scrollbar bg-gradient-to-b from-transparent to-cyan-500/5">
          {!isApproved && currentRequest?.status !== 'approved' ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-8">
              <div className="relative">
                <div className="w-24 h-24 bg-cyan-500/10 rounded-[2rem] flex items-center justify-center text-cyan-400 animate-pulse shadow-[0_0_50px_rgba(34,211,238,0.1)]">
                  <Code className="w-12 h-12" />
                </div>
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1.5 rounded-full shadow-lg">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="max-w-md space-y-4">
                <h3 className="text-4xl font-black uppercase tracking-tight leading-none">ACTIVA TU PERFIL PROFESIONAL</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Para subir juegos a Pro Store necesitas habilitar tu cuenta de desarrollador. Es gratuito y tendrás acceso instantáneo.
                </p>
              </div>
              <button 
                onClick={handleActivateAccount}
                className="group relative px-12 py-5 bg-cyan-500 text-black font-black uppercase rounded-2xl overflow-hidden active:scale-95 transition-all shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:shadow-[0_0_60px_rgba(34,211,238,0.5)]"
              >
                <div className="relative z-10 flex items-center gap-3 text-lg">
                  EMPEZAR A PUBLICAR <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-4 mb-8 border-b border-white/5 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <button onClick={() => setActiveTab('upload')} className={`flex items-center gap-2 px-6 py-3 font-black text-sm uppercase transition-all rounded-t-xl ${activeTab === 'upload' ? 'text-cyan-400 bg-cyan-400/10 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>
                  <Send className="w-4 h-4" /> Publicar App
                </button>
                <button onClick={() => setActiveTab('my-apps')} className={`flex items-center gap-2 px-6 py-3 font-black text-sm uppercase transition-all rounded-t-xl ${activeTab === 'my-apps' ? 'text-cyan-400 bg-cyan-400/10 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>
                  <ImageIcon className="w-4 h-4" /> Mis Aplicaciones
                </button>
                <button onClick={() => setActiveTab('requirements')} className={`flex items-center gap-2 px-6 py-3 font-black text-sm uppercase transition-all rounded-t-xl ${activeTab === 'requirements' ? 'text-cyan-400 bg-cyan-400/10 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>
                  <ShieldAlert className="w-4 h-4" /> Normas & Estado
                </button>
              </div>

              {activeTab === 'requirements' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 max-w-2xl mx-auto py-4"
                >
                  <div className="bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-3xl">
                    <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-yellow-500"><ShieldAlert className="w-6 h-6" /> REQUISITOS OBLIGATORIOS</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        "Archivo .APK funcional",
                        "Icono (512x512px recomendado)",
                        "Links: Drive/Mega/MediaFire/DropBox",
                        "2-4 capturas de pantalla reales",
                        "Descripción clara y detallada",
                        "Sin virus ni contenido malicioso"
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-bold text-gray-300">
                          <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-nexus-cyan/10 border border-nexus-cyan/30 p-6 rounded-3xl space-y-4">
                    <h3 className="text-xl font-black flex items-center gap-2 text-nexus-cyan"><Code className="w-6 h-6" /> ESTADO & FIX</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${userId ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                          <span className="text-xs font-bold text-gray-300">Supabase Auth</span>
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase">{userId ? 'Conectado' : 'Desconectado'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${userProfile ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <span className="text-xs font-bold text-gray-300">Perfil DB</span>
                        </div>
                        <button 
                          onClick={() => window.location.reload()} 
                          className="text-[9px] text-nexus-cyan underline font-black uppercase"
                        >
                          {userProfile ? 'Sincronizado' : 'Reparar/Recargar'}
                        </button>
                      </div>

                      {!userProfile && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-2">
                          <p className="text-[10px] text-yellow-500 font-bold uppercase">Fix para Error de Sincronización:</p>
                          <p className="text-[9px] text-gray-300 leading-tight">
                            Si ves errores de permisos, ve a <span className="text-white font-bold">Supabase &gt; SQL Editor</span> y ejecuta:
                          </p>
                          <code className="block p-2 bg-black/60 rounded border border-white/10 text-[9px] text-nexus-cyan font-mono select-all">
                            ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
                          </code>
                        </div>
                      )}
                      
                      <div className="p-4 bg-nexus-cyan/5 border border-nexus-cyan/20 rounded-xl space-y-3">
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-black text-nexus-cyan uppercase">Configuración Cloudinary</span>
                           <div className="w-1.5 h-1.5 rounded-full bg-nexus-cyan animate-pulse" />
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[9px]">
                            <div className="flex flex-col gap-0.5 p-2 bg-black/40 rounded-lg border border-white/5">
                               <span className="text-gray-500 uppercase font-black text-[7px]">Cloud Name</span>
                               <span className="text-nexus-cyan font-mono font-bold">dnpnmhmht</span>
                            </div>
                            <div className="flex flex-col gap-0.5 p-2 bg-black/40 rounded-lg border border-white/5">
                               <span className="text-gray-500 uppercase font-black text-[7px]">Upload Preset</span>
                               <span className="text-nexus-cyan font-mono font-bold">Iconos y capturas</span>
                            </div>
                         </div>
                         
                         <div className="p-3 bg-nexus-cyan/10 border border-nexus-cyan/20 rounded-xl mt-3">
                            <p className="text-[9px] text-white font-black uppercase mb-1">Guía de Configuración:</p>
                            <div className="space-y-1.5 text-[8px] text-gray-400 leading-tight">
                               <p>
                                  <span className="text-nexus-cyan font-bold">1. Subida Directa:</span> 
                                  Se ha vuelto al método de subida directa que te funcionaba bien.
                               </p>
                               <p>
                                  <span className="text-nexus-cyan font-bold">2. Requisito:</span> 
                                  Asegúrate de que el preset <span className="text-white font-bold">"Iconos y capturas"</span> esté configurado como <span className="text-white">UNSIGNED</span> en tu panel de Cloudinary.
                               </p>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'my-apps' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {publishedApps.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-gray-500/10 rounded-full flex items-center justify-center text-gray-600 mb-6 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                      <h4 className="text-xl font-black text-gray-400 uppercase mb-2">Sin Publicaciones</h4>
                      <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">Aún no has compartido ninguna aplicación con la comunidad. ¡Empieza hoy mismo!</p>
                      <button 
                        onClick={() => setActiveTab('upload')} 
                        className="px-8 py-3 bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 rounded-xl font-black text-xs uppercase hover:bg-cyan-400/20 transition-all flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" /> Subir mi primera App
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {publishedApps.map(app => (
                        <div key={app.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img src={app.icon} alt={app.name} className="w-14 h-14 rounded-2xl object-cover shadow-xl" />
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#030712] shadow-lg ${app.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            </div>
                            <div>
                               <h4 className="font-black text-white text-lg tracking-tight leading-none mb-1">{app.name} <span className="text-xs text-gray-500 font-bold ml-2">v{app.version}</span></h4>
                               <div className="flex items-center gap-3">
                                 <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${app.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                   {app.status === 'published' ? 'Publicado' : 'Pendiente'}
                                 </span>
                                 <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-white/5 text-gray-500 rounded-full">{app.category}</span>
                               </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="text-right mr-4 hidden sm:block">
                               <p className="text-[10px] font-black text-gray-500 uppercase">Descargas</p>
                               <p className="text-white font-black">{app.downloads || '0'}</p>
                             </div>
                            <button 
                              onClick={() => onUpdateApp?.(app)}
                              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-cyan-400 transition-all opacity-0 group-hover:opacity-100"
                            >
                               <Code className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'upload' && (
                isSuccess ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center gap-4"
                  >
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 shadow-[0_0_40px_rgba(7ade80,0.3)]">
                      <CheckCircle className="w-14 h-14" />
                    </div>
                    <h3 className="text-3xl font-black uppercase">¡App Publicada!</h3>
                    <p className="text-gray-400 max-w-xs mx-auto">Tu aplicación ya está en vivo y disponible para toda la comunidad.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleAppSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                          <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                             <Code className="w-4 h-4" /> INFO BÁSICA
                          </h4>
                          <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Nombre de la App</label>
                              <input required type="text" placeholder="Ej: Mega Game APK" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-5 text-sm focus:border-cyan-400 transition-all outline-none" />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Compañía / Estudio</label>
                              <input required type="text" placeholder="Ej: Menor Studio" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-5 text-sm focus:border-cyan-400 transition-all outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Categoría</label>
                                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-5 text-sm focus:border-cyan-400 transition-all outline-none cursor-pointer">
                                  <option className="bg-[#030712]">Herramientas</option>
                                  <option className="bg-[#030712]">Juegos</option>
                                  <option className="bg-[#030712]">Social</option>
                                </select>
                              </div>
                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Peso (Ej: 100MB)</label>
                                <input required type="text" value={formData.size} onChange={(e) => setFormData({...formData, size: e.target.value})} className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-5 text-sm focus:border-cyan-400 transition-all outline-none" />
                              </div>
                            </div>
                          </div>
                        </section>
                      </div>

                      <div className="space-y-6">
                        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                          <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                             <ImageIcon className="w-4 h-4" /> MULTIMEDIA
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Icono</label>
                              <div className="relative group overflow-hidden h-32 bg-black/40 border border-white/10 rounded-2xl hover:border-cyan-400 transition-all shadow-inner">
                                {formData.icon ? (
                                  <div className="relative h-full flex flex-col items-center justify-center gap-2 p-2">
                                     <img src={formData.icon} alt="Icon preview" className="w-16 h-16 rounded-xl object-cover shadow-2xl" />
                                     <span className="text-[9px] font-black text-green-400 uppercase">Cargado</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
                                    <Upload className={`w-8 h-8 ${isUploading ? 'animate-bounce text-cyan-400' : ''}`} />
                                    <span className="text-[10px] font-black">SUBIR ICONO</span>
                                  </div>
                                )}
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'icon')} className="absolute inset-0 opacity-0 cursor-pointer" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Captura Principal</label>
                              <div className="relative group overflow-hidden h-32 bg-black/40 border border-white/10 rounded-2xl hover:border-cyan-400 transition-all">
                                {formData.screenshot ? (
                                  <img src={formData.screenshot} alt="Screen 1" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
                                    <ImageIcon className="w-8 h-8" />
                                    <span className="text-[10px] font-black">CAPTURAR</span>
                                  </div>
                                )}
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'screenshot')} className="absolute inset-0 opacity-0 cursor-pointer" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Link de Descarga</label>
                            <div className="relative">
                              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                              <input required type="url" placeholder="Paste link from Drive/Mega..." value={formData.downloadUrl} onChange={(e) => setFormData({...formData, downloadUrl: e.target.value})} className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl pl-12 pr-5 text-xs focus:border-cyan-400 transition-all outline-none" />
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Descripción de la Aplicación</label>
                        <textarea required placeholder="Escribe aquí los detalles, ventajas y funciones de tu aplicación..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-6 text-sm focus:border-cyan-400 transition-all outline-none resize-none"></textarea>
                      </div>
                      
                      <div className="pt-4 flex justify-center">
                        <button 
                          type="submit" 
                          disabled={isUploading}
                          className="w-full max-w-md h-16 bg-gradient-to-r from-cyan-500 to-blue-600 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-black font-black text-xl rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] flex items-center justify-center gap-3 uppercase tracking-tighter"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-8 h-8 animate-spin" />
                              PROCESANDO...
                            </>
                          ) : (
                            <>
                              LANZAR AHORA <Send className="w-6 h-6" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
