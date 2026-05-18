import { useState, useRef } from 'react';
import { 
  Upload, X, Check, Loader2, Package, Image as ImageIcon, Smartphone, 
  Info, ArrowRight, ArrowLeft, Trash2, Layout, Eye, ShieldCheck, 
  AlertCircle, ChevronRight, Share2, Globe, Sparkles, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadToCloudinary } from '../lib/cloudinary';

interface PublishingWizardProps {
  developerId: string;
  onSuccess: (app: any) => void;
  onCancel: () => void;
}

type Step = 'info' | 'resources' | 'apk' | 'config' | 'preview';

export default function PublishingWizard({ developerId, onSuccess, onCancel }: PublishingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [uiError, setUiError] = useState<string | null>(null);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    app_name: '',
    company_name: '',
    category: 'Juegos',
    version: '1.0.0',
    short_description: '',
    full_description: '',
    whats_new: '',
    tags: [] as string[],
    min_android: 'Android 8.0+',
    permissions: [] as string[]
  });

  const [files, setFiles] = useState<{
    apk: File | null;
    icon: File | null;
    iconUrl: string;
    iconPublicId: string;
    screenshots: { file: File | null; url: string; publicId: string; id: string }[];
  }>({
    apk: null,
    icon: null,
    iconUrl: '',
    iconPublicId: '',
    screenshots: []
  });

  const [apkInfo, setApkInfo] = useState<{
    size: string;
    name: string;
    uploadId?: string;
    releaseId?: number;
    downloadUrl?: string;
  } | null>(null);

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'info', label: 'Información', icon: Info },
    { id: 'resources', label: 'Recursos', icon: ImageIcon },
    { id: 'apk', label: 'APK', icon: Package },
    { id: 'config', label: 'Configuración', icon: ShieldCheck },
    { id: 'preview', label: 'Vista Previa', icon: Eye }
  ];

  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  // Image Upload Logic (Lazy - upload when added or on final publish?)
  // The user says "AL ENVIAR" (On Submit), but real previews need URLs.
  // I'll upload icon and screenshots as they are added for better "preview" feel.

  const uploadIcon = async (file: File) => {
    try {
      setUiError(null);
      setIsUploadingIcon(true);
      const cleanName = (formData.app_name || 'nexus-app').trim().replace(/[\s\W]+/g, '_');
      const res = await uploadToCloudinary(file, `NexusStore/${cleanName}/icon`);
      setFiles(prev => ({ ...prev, icon: file, iconUrl: res.secure_url, iconPublicId: res.public_id }));
    } catch (err: any) {
      setUiError("Error subiendo icono: " + err.message);
    } finally {
      setIsUploadingIcon(false);
    }
  };

  const uploadScreenshot = async (file: File) => {
    if (files.screenshots.length >= 5) return;
    setUiError(null);
    
    const tempId = Math.random().toString(36).substring(7);
    setFiles(prev => ({
      ...prev,
      screenshots: [...prev.screenshots, { file, url: URL.createObjectURL(file), publicId: '', id: tempId }]
    }));

    try {
      const cleanName = (formData.app_name || 'nexus-app').trim().replace(/[\s\W]+/g, '_');
      const res = await uploadToCloudinary(file, `NexusStore/${cleanName}/screenshots`);
      setFiles(prev => ({
        ...prev,
        screenshots: prev.screenshots.map(s => s.id === tempId ? { ...s, url: res.secure_url, publicId: res.public_id } : s)
      }));
    } catch (err: any) {
      setFiles(prev => ({ ...prev, screenshots: prev.screenshots.filter(s => s.id !== tempId) }));
      setUiError("Error subiendo captura: " + err.message);
    }
  };

  const removeScreenshot = async (id: string, publicId: string) => {
    if (publicId) {
      try {
        await fetch('/api/delete-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_id: publicId })
        });
      } catch (e) { console.warn("Failed to delete from Cloudinary:", e); }
    }
    setFiles(prev => ({ ...prev, screenshots: prev.screenshots.filter(s => s.id !== id) }));
  };

  const handleApkSelect = (file: File) => {
    setUiError(null);
    if (!file.name.toLowerCase().endsWith('.apk') && file.type !== 'application/vnd.android.package-archive') {
      setUiError("El archivo debe ser un .apk válido.");
      return;
    }
    setFiles(prev => ({ ...prev, apk: file }));
    setApkInfo({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    });
  };

  const handlePublish = async () => {
    setUiError(null);
    if (!files.apk) {
      setUiError("Falta el archivo APK.");
      return;
    }
    if (!files.iconUrl) {
      setUiError("Falta la imagen del icono.");
      return;
    }
    if (files.screenshots.length === 0) {
      setUiError("Falta subir algunas capturas de pantalla.");
      return;
    }

    setIsPublishing(true);
    setPublishProgress(0);
    setStatus('Iniciando publicación...');

    try {
      // 1. Get Presigned URL for Cloudflare R2
      setStatus('Preparando subida del APK...');
      setPublishProgress(10);
      const actualContentType = files.apk?.type || 'application/octet-stream';
      const presignedRes = await fetch('/api/upload-apk-presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: formData.app_name,
          version: formData.version,
          contentType: actualContentType
        })
      });

      if (!presignedRes.ok) {
        const errText = await presignedRes.text();
        let errMsg = "Error obteniendo URL de subida";
        try { errMsg = JSON.parse(errText).error || errMsg; } catch(e) {}
        throw new Error(errMsg);
      }

      const presignedData = await presignedRes.json();
      if (!presignedData.success) {
        throw new Error(presignedData.error || "Error al obtener presigned URL");
      }

      const uploadUrl = presignedData.presigned_url;
      const apkDownloadUrl = presignedData.public_url;

      setStatus('Subiendo APK a Cloudflare R2...');
      setPublishProgress(20);

      // 2. Upload APK directly to R2 using Presigned URL
      console.log("Uploading to:", uploadUrl.substring(0, 50) + "...");
      
      const uploadResOk = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', actualContentType);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 40;
            setPublishProgress(20 + percent); // Goes from 20 to 60
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(true);
          } else {
            console.error("XHR failed with status", xhr.status, xhr.responseText);
            if (xhr.status === 403) {
              reject(new Error("Error de Permisos (CORS o Token). 1. Revisa que tu Token de API de R2 tenga permisos de Escritura (Admin o Edit). 2. Asegúrate de haber guardado bien la política CORS en Cloudflare."));
            } else {
              reject(new Error(`Error subiendo el APK a R2. (Status: ${xhr.status}).`));
            }
          }
        };

        xhr.onerror = () => {
          console.error("XHR onerror triggered. Status:", xhr.status);
          reject(new Error("No se pudo conectar a Cloudflare R2 (Error de Red o CORS). Si el CORS ya está configurado, verifica que tu token de R2 tiene permisos de Escritura."));
        };

        xhr.send(files.apk);
      });

      if (!uploadResOk) {
        throw new Error("La subida del APK falló de forma inesperada.");
      }

      if (!apkDownloadUrl) throw new Error("No se pudo obtener la URL de descarga de R2");
      setPublishProgress(60);

      // 2. Register in Supabase
      setStatus('Finalizando y publicando en NexusPlay...');
      const registerRes = await fetch('/api/upload-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: formData.app_name,
          company_name: formData.company_name,
          version: formData.version,
          description: formData.short_description,
          full_description: formData.full_description,
          category: formData.category,
          icon_url: files.iconUrl,
          icon_public_id: files.iconPublicId,
          screenshots: files.screenshots.map(s => s.url),
          screenshots_public_ids: files.screenshots.map(s => s.publicId),
          download_url: apkDownloadUrl,
          size: apkInfo?.size,
          developer_id: developerId,
          whats_new: formData.whats_new,
          min_android: formData.min_android,
          tags: formData.tags
        })
      });

      if (!registerRes.ok) {
        const errText = await registerRes.text();
        let errMsg = "Error registrando metadata en Supabase";
        try { errMsg = JSON.parse(errText).error || errMsg; } catch(e) {}
        throw new Error(errMsg);
      }
      
      const finalizeResult = await registerRes.json();
      setPublishProgress(100);
      setStatus('¡Publicación completada!');

      setTimeout(() => {
        onSuccess(finalizeResult.app);
      }, 2000);

    } catch (err: any) {
      console.error("Publish Error:", err);
      setStatus("Error: " + err.message);
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#030712] overflow-hidden">
      {/* Header With Steps */}
      <div className="px-4 lg:px-8 pt-4 lg:pt-8 pb-4 border-b border-white/5 bg-black/20 shrink-0">
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-cyan-500 rounded-lg lg:rounded-xl flex items-center justify-center shrink-0">
              <Layout className="w-5 h-5 lg:w-6 lg:h-6 text-black" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg lg:text-2xl font-black text-white uppercase tracking-tighter truncate">
                Lanzamiento
              </h2>
              <p className="text-[8px] lg:text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">Panel Automatizado</p>
            </div>
          </div>
          
          <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-full transition-colors shrink-0">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex items-center justify-between max-w-2xl mx-auto relative px-2">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-0 w-full h-[1px] lg:h-[2px] bg-white/5 -translate-y-1/2 z-0" />
          
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > idx;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <button 
                  onClick={() => !isPublishing && steps.findIndex(s => s.id === step.id) <= steps.findIndex(s => s.id === currentStep) && setCurrentStep(step.id)}
                  className={`
                    w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-2xl flex items-center justify-center transition-all duration-300
                    ${isCompleted ? 'bg-cyan-500 text-black' : isActive ? 'bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-[#0f172a] text-gray-500 border border-white/5'}
                  `}
                >
                  {isCompleted ? <Check className="w-4 h-4 lg:w-6 lg:h-6" /> : <Icon className="w-4 h-4 lg:w-5 lg:h-5" />}
                </button>
                <span className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest hidden sm:block ${isActive ? 'text-white' : 'text-gray-600'}`}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {uiError && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-semibold">{uiError}</p>
              <button 
                onClick={() => setUiError(null)}
                className="p-1 hover:bg-red-500/20 rounded-lg transition-colors ml-auto shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {currentStep === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-xl font-black text-cyan-400 uppercase">Información de la App</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nombre del Proyecto</label>
                        <input 
                          type="text" 
                          placeholder="Nombre oficial de la aplicación"
                          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:border-cyan-500 outline-none text-white transition-all"
                          value={formData.app_name}
                          onChange={e => setFormData({...formData, app_name: e.target.value})}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Estudio / Compañía</label>
                        <input 
                          type="text" 
                          placeholder="Nombre de tu estudio de desarrollo"
                          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:border-cyan-500 outline-none text-white transition-all"
                          value={formData.company_name}
                          onChange={e => setFormData({...formData, company_name: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Categoría</label>
                          <select 
                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:border-cyan-500 outline-none text-white transition-all appearance-none"
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                          >
                            <option value="Juegos">Juegos</option>
                            <option value="Herramientas">Herramientas</option>
                            <option value="Social">Social</option>
                            <option value="Productividad">Productividad</option>
                            <option value="Multimedia">Multimedia</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Versión</label>
                          <input 
                            type="text" 
                            placeholder="Ej: 1.2.0"
                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:border-cyan-500 outline-none text-white transition-all"
                            value={formData.version}
                            onChange={e => setFormData({...formData, version: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-black text-cyan-400 uppercase">Descripciones</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Breve Resumen</label>
                        <input 
                          type="text" 
                          placeholder="Lo que verá el usuario en el listado principal"
                          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:border-cyan-500 outline-none text-white transition-all"
                          value={formData.short_description}
                          onChange={e => setFormData({...formData, short_description: e.target.value})}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Descripción Completa</label>
                        <textarea 
                          rows={6}
                          placeholder="Explica detalladamente las funciones principales de tu app..."
                          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:border-cyan-500 outline-none text-white transition-all resize-none"
                          value={formData.full_description}
                          onChange={e => setFormData({...formData, full_description: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'resources' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-black text-cyan-400 uppercase">Icono Principal</h3>
                      <p className="text-gray-500 text-xs">Aparecerá en el launcher y en la tienda. Recomendado 512x512 PNG/JPG.</p>
                      
                      <div className="relative group aspect-square w-48 mx-auto md:mx-0">
                        {isUploadingIcon ? (
                          <div className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                            <span className="text-[10px] font-black text-gray-500 uppercase">Subiendo...</span>
                          </div>
                        ) : !files.iconUrl ? (
                          <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:bg-white/5 hover:border-cyan-500/50 transition-all">
                            <Upload className="w-8 h-8 text-gray-600 mb-2" />
                            <span className="text-[10px] font-black text-gray-500 uppercase">Cargar Icono</span>
                            <input type="file" className="hidden" accept="image/*" onChange={e => {
                              if(e.target.files?.[0]) {
                                uploadIcon(e.target.files[0]);
                                e.target.value = ''; // Reset to allow re-upload
                              }
                            }} />
                          </label>
                        ) : (
                          <div className="relative w-full h-full">
                            <img src={files.iconUrl} alt="Icon" className="w-full h-full rounded-3xl object-cover shadow-2xl" />
                            <button 
                              onClick={() => setFiles(prev => ({ ...prev, icon: null, iconUrl: '', iconPublicId: '' }))}
                              className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-cyan-400 uppercase">Capturas de Pantalla</h3>
                        <span className="text-[10px] font-black text-gray-500">{files.screenshots.length}/5</span>
                      </div>
                      <p className="text-gray-500 text-xs mb-4">Sube entre 1 y 5 capturas que muestren la interfaz o gameplay real.</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {files.screenshots.map((ss) => (
                          <div key={ss.id} className="relative aspect-[9/16] group rounded-2xl overflow-hidden border border-white/5">
                            <img src={ss.url} alt="Screenshot" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={() => removeScreenshot(ss.id, ss.publicId)}
                                className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                            {!ss.publicId && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {files.screenshots.length < 5 && (
                          <label className="aspect-[9/16] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-cyan-500/50 transition-all text-gray-500">
                            <Plus className="w-8 h-8 mb-2" />
                            <span className="text-[10px] font-black uppercase">Añadir</span>
                            <input type="file" className="hidden" accept="image/*" onChange={e => {
                              if(e.target.files?.[0]) {
                                uploadScreenshot(e.target.files[0]);
                                e.target.value = '';
                              }
                            }} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'apk' && (
                <div className="space-y-6">
                  <h3 className="text-lg lg:text-xl font-black text-cyan-400 uppercase">Archivo de Instalación</h3>
                  
                  <div className="p-8 lg:p-12 border-2 border-dashed border-white/10 rounded-2xl lg:rounded-[3rem] bg-white/[0.02] flex flex-col items-center justify-center text-center gap-4 lg:gap-6 group hover:border-cyan-500/30 hover:bg-cyan-500/[0.02] transition-all">
                    {!files.apk ? (
                      <>
                        <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white/5 rounded-full flex items-center justify-center text-gray-500 group-hover:text-cyan-400 group-hover:scale-110 transition-all">
                          <Upload className="w-8 h-8 lg:w-12 lg:h-12" />
                        </div>
                        <div>
                          <p className="text-lg lg:text-xl font-black text-white uppercase tracking-tight">Archivo APK</p>
                          <p className="text-gray-500 text-[10px] lg:text-sm mt-1">Sube el ejecutable de tu aplicación</p>
                        </div>
                        <label className="w-full sm:w-auto px-8 py-3 lg:py-4 bg-white text-black font-black uppercase rounded-xl lg:rounded-2xl cursor-pointer hover:bg-cyan-400 transition-colors text-xs">
                          SUBIR APK
                          <input type="file" className="hidden" accept=".apk,application/vnd.android.package-archive" onChange={e => {
                            if(e.target.files?.[0]) {
                              handleApkSelect(e.target.files[0]);
                              e.target.value = '';
                            }
                          }} />
                        </label>
                      </>
                    ) : (
                      <div className="w-full flex items-center gap-4 lg:gap-6 p-4 lg:p-6 bg-white/5 rounded-2xl lg:rounded-[2rem] border border-white/10 animate-in fade-in zoom-in duration-300">
                        <div className="w-12 h-12 lg:w-20 lg:h-20 bg-orange-500/20 rounded-xl lg:rounded-2xl flex items-center justify-center text-orange-500 shrink-0">
                          <Package className="w-6 h-6 lg:w-10 lg:h-10" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h4 className="text-sm lg:text-xl font-black text-white truncate uppercase">{files.apk.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 lg:gap-4 mt-1 lg:mt-2">
                             <span className="text-[10px] lg:text-xs font-bold text-gray-500">{apkInfo?.size}</span>
                             <span className="text-[10px] lg:text-xs font-bold text-green-500 uppercase flex items-center gap-1">
                               <ShieldCheck className="w-3 h-3" /> OK
                             </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setFiles(prev => ({ ...prev, apk: null }))}
                          className="p-3 lg:p-4 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-xl lg:rounded-2xl transition-all"
                        >
                          <Trash2 className="w-5 h-5 lg:w-6 lg:h-6" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex gap-4">
                      <div className="shrink-0 w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white uppercase mb-1 tracking-wider">Alojamiento Escalable</p>
                        <p className="text-[10px] text-gray-500 font-medium">Usamos GitHub Releases para que tus descargas sean rápidas y sin límites en todo el mundo.</p>
                      </div>
                    </div>
                    <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex gap-4">
                      <div className="shrink-0 w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white uppercase mb-1 tracking-wider">Análisis Inteligente</p>
                        <p className="text-[10px] text-gray-500 font-medium">Nuestro backend procesa el APK en fragmentos seguros de 20MB para garantizar una subida robusta.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'config' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <h3 className="text-xl font-black text-cyan-400 uppercase">Compatibilidad</h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mínimo Android Requerido</label>
                          <select 
                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:border-cyan-500 outline-none text-white"
                            value={formData.min_android}
                            onChange={e => setFormData({...formData, min_android: e.target.value})}
                          >
                            <option value="Android 11+">Android 11.0 (R)</option>
                            <option value="Android 10+">Android 10.0 (Q)</option>
                            <option value="Android 9.0+">Android 9.0 (Pie)</option>
                            <option value="Android 8.0+">Android 8.0 (Oreo)</option>
                            <option value="Android 7.0+">Android 7.0 (Nougat)</option>
                          </select>
                        </div>

                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                           <h4 className="text-xs font-black text-white uppercase mb-4 tracking-widest">Permisos Detectados</h4>
                           <div className="space-y-3">
                              {[
                                { id: 'internet', label: 'Acceso a Internet', desc: 'android.permission.INTERNET' },
                                { id: 'storage', label: 'Almacenamiento Externo', desc: 'android.permission.WRITE_EXTERNAL_STORAGE' },
                                { id: 'notify', label: 'Notificaciones Push', desc: 'android.permission.POST_NOTIFICATIONS' }
                              ].map(perm => (
                                <div key={perm.id} className="flex items-start gap-4">
                                   <div className="w-5 h-5 rounded border border-cyan-500/50 bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                      <Check className="w-3 h-3" />
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-white uppercase tracking-wider">{perm.label}</p>
                                      <p className="text-[8px] text-gray-500 font-mono">{perm.desc}</p>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h3 className="text-xl font-black text-cyan-400 uppercase">Qué hay de nuevo</h3>
                      <div className="space-y-4">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cambios de la Versión {formData.version}</label>
                            <textarea 
                              rows={5}
                              placeholder="Ej: - Mejoras de rendimiento\n- Nueva interfaz oscura\n- Errores corregidos"
                              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:border-cyan-500 outline-none text-white transition-all resize-none"
                              value={formData.whats_new}
                              onChange={e => setFormData({...formData, whats_new: e.target.value})}
                            />
                         </div>

                         <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-2xl">
                            <ShieldCheck className="w-6 h-6 text-green-500" />
                            <div className="flex-1">
                               <p className="text-[10px] font-black text-white uppercase">Publicación Automática</p>
                               <p className="text-[9px] text-gray-500">Tu aplicación será publicada inmediatamente después de finalizar el proceso.</p>
                            </div>
                            <div className="w-12 h-6 bg-cyan-500 rounded-full relative p-1 cursor-pointer">
                               <div className="w-4 h-4 bg-black rounded-full absolute right-1" />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {currentStep === 'preview' && (
                <div className="space-y-8">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                     <h3 className="text-xl font-black text-cyan-400 uppercase">Vista previa</h3>
                     <p className="text-gray-500 text-[8px] lg:text-xs font-bold">ASÍ SE VERÁ TU APP EN NEXUS PLAY</p>
                   </div>

                   <div className="relative bg-[#0a0f1a] rounded-3xl lg:rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
                     <div className="p-6 lg:p-12 space-y-8 lg:space-y-12">
                        {/* App Header Preview */}
                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-start text-center lg:text-left">
                           <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-48 lg:h-48 rounded-2xl sm:rounded-[2.5rem] bg-white/5 p-1 bg-gradient-to-br from-cyan-500/20 to-transparent shrink-0">
                             <img src={files.iconUrl || 'https://via.placeholder.com/200'} className="w-full h-full rounded-2xl sm:rounded-[2.2rem] object-cover shadow-2xl" />
                           </div>
                           <div className="flex-1 space-y-4 w-full">
                             <div>
                               <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none">{formData.app_name || 'Nombre app'}</h1>
                               <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 lg:gap-4 mt-2 lg:mt-3">
                                  <span className="text-cyan-400 font-black uppercase text-[10px] sm:text-sm">{formData.company_name || 'Compañía'}</span>
                                  <div className="w-1 h-1 rounded-full bg-white/10" />
                                  <span className="text-gray-500 font-bold text-[10px] sm:text-sm uppercase">{formData.category}</span>
                               </div>
                             </div>

                             <div className="grid grid-cols-3 gap-2 lg:flex lg:flex-wrap lg:items-center lg:justify-start">
                               <div className="px-3 lg:px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                 <p className="text-[8px] lg:text-[10px] font-black text-gray-500 uppercase mb-0.5">Versión</p>
                                 <p className="text-[10px] lg:text-sm font-black text-white leading-none tracking-tight">{formData.version}</p>
                               </div>
                               <div className="px-3 lg:px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                 <p className="text-[8px] lg:text-[10px] font-black text-gray-500 uppercase mb-0.5">Size</p>
                                 <p className="text-[10px] lg:text-sm font-black text-white leading-none tracking-tight">{apkInfo?.size || '0 MB'}</p>
                               </div>
                               <div className="px-3 lg:px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                 <p className="text-[8px] lg:text-[10px] font-black text-gray-500 uppercase mb-0.5">Min</p>
                                 <p className="text-[10px] lg:text-sm font-black text-white leading-none tracking-tight">{formData.min_android.split(' ')[1] || '8.0'}</p>
                               </div>
                             </div>

                             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                                <button className="flex-1 px-8 py-4 lg:py-5 bg-white text-black font-black uppercase rounded-xl lg:rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)] text-xs lg:text-base">
                                  INSTALAR
                                </button>
                                <button className="p-4 lg:p-5 bg-white/5 rounded-xl lg:rounded-2xl text-white flex justify-center">
                                  <Share2 className="w-5 h-5 lg:w-6 lg:h-6" />
                                </button>
                             </div>
                           </div>
                        </div>

                        {/* Screenshots Preview */}
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Preview</h4>
                           <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 lg:mx-0 lg:px-0">
                             {files.screenshots.length > 0 ? files.screenshots.map((ss, idx) => (
                               <img key={idx} src={ss.url} className="h-64 sm:h-96 lg:h-[400px] rounded-2xl lg:rounded-3xl object-cover border border-white/5 shadow-xl shrink-0" />
                             )) : (
                               <div className="h-64 sm:h-96 w-44 sm:w-56 bg-white/5 rounded-2xl lg:rounded-3xl border border-dashed border-white/10 flex items-center justify-center text-gray-700 italic text-[10px] shrink-0">
                                 Sin capturas
                               </div>
                             )}
                           </div>
                        </div>

                        {/* Description Preview */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 pt-8 border-t border-white/5">
                           <div className="lg:col-span-2 space-y-4 lg:space-y-6">
                              <h4 className="text-2xl font-black text-white uppercase tracking-tight">Sobre esta aplicación</h4>
                              <p className="text-gray-400 text-lg leading-relaxed whitespace-pre-wrap">{formData.full_description || 'Descripción completa de la aplicación...'}</p>
                           </div>
                           <div className="space-y-8">
                              <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">Lo nuevo</h4>
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5 text-xs text-gray-400 leading-relaxed italic">
                                  {formData.whats_new || 'No hay notas de cambios para esta versión.'}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">Detalles</h4>
                                <div className="space-y-4">
                                  <div className="flex justify-between border-b border-white/5 pb-2">
                                     <span className="text-[10px] text-gray-500 font-bold uppercase">Actualizado</span>
                                     <span className="text-[10px] text-white font-black uppercase">Hoy</span>
                                  </div>
                                  <div className="flex justify-between border-b border-white/5 pb-2">
                                     <span className="text-[10px] text-gray-500 font-bold uppercase">Proveedor</span>
                                     <span className="text-[10px] text-white font-black uppercase">{formData.company_name}</span>
                                  </div>
                                </div>
                              </div>
                           </div>
                        </div>
                     </div>
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="px-4 lg:px-8 py-4 lg:py-6 border-t border-white/5 bg-black/40 backdrop-blur-xl shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
           <button 
             onClick={handleBack}
             disabled={currentStep === 'info' || isPublishing}
             className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-black text-[10px] uppercase transition-all rounded-xl ${currentStep === 'info' || isPublishing ? 'hidden' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
           >
             <ArrowLeft className="w-4 h-4" /> Anterior
           </button>
 
           <div className="flex-1 w-full flex flex-col items-center">
             {isPublishing && (
               <div className="w-full max-w-md space-y-2 mb-2 lg:mb-0">
                  <div className="flex justify-between text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    <span className="truncate max-w-[70%]">{status}</span>
                    <span>{publishProgress}%</span>
                  </div>
                  <div className="w-full h-1 lg:h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${publishProgress}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                    />
                  </div>
               </div>
             )}
           </div>
 
           {currentStep === 'preview' ? (
             <button 
               onClick={handlePublish}
               disabled={isPublishing}
               className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 lg:px-10 py-3 lg:py-4 bg-cyan-500 text-black font-black text-[10px] lg:text-sm uppercase rounded-xl lg:rounded-2xl shadow-xl shadow-cyan-500/20 active:scale-95 transition-all ${isPublishing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-400 hover:shadow-cyan-400/40'}`}
             >
               {isPublishing ? (
                 <> <Loader2 className="w-5 h-5 animate-spin" /> PROCESANDO...</>
               ) : (
                 <> <Share2 className="w-5 h-5" /> LANZAR APP</>
               )}
             </button>
           ) : (
             <button 
               onClick={handleNext}
               className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 lg:px-10 py-3 lg:py-4 bg-white text-black font-black text-[10px] lg:text-sm uppercase rounded-xl lg:rounded-2xl hover:bg-cyan-400 active:scale-95 transition-all shadow-xl shadow-white/5"
             >
               SIGUIENTE <ArrowRight className="w-5 h-5" />
             </button>
           )}
        </div>
      </div>
    </div>
  );
}
