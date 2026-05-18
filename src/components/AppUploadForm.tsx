import { useState } from 'react';
import { Upload, X, Check, Loader2, Package, Image as ImageIcon, Smartphone, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadToCloudinary } from '../lib/cloudinary';

interface AppUploadFormProps {
  onSuccess: (app: any) => void;
  onCancel: () => void;
  developerId: string;
}

export default function AppUploadForm({ onSuccess, onCancel, developerId }: AppUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  
  const [formData, setFormData] = useState({
    app_name: '',
    description: '',
    version: '1.0.0',
    company_name: '',
    category: 'Juegos'
  });

  const [files, setFiles] = useState<{
    apk: File | null;
    icon: File | null;
    screenshots: File[];
  }>({
    apk: null,
    icon: null,
    screenshots: []
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'apk' | 'icon' | 'screenshots') => {
    if (!e.target.files) return;
    
    if (type === 'screenshots') {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => ({ ...prev, screenshots: [...prev.screenshots, ...newFiles].slice(0, 8) }));
    } else {
      setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
    }
  };

  const removeFile = (type: 'apk' | 'icon' | 'screenshots', index?: number) => {
    if (type === 'screenshots' && index !== undefined) {
      setFiles(prev => ({ ...prev, screenshots: prev.screenshots.filter((_, i) => i !== index) }));
    } else {
      setFiles(prev => ({ ...prev, [type]: null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.apk || !files.icon) {
      alert("Por favor selecciona el APK y el Icono de la aplicación.");
      return;
    }

    setIsUploading(true);
    setStatus('Iniciando subida directa...');
    setUploadProgress(5);

    try {
      // 1. Upload Icon Directly
      const cleanAppName = formData.app_name.trim().replace(/\s+/g, '-');
      setStatus('Paso 1: Subiendo icono a la nube...');
      const iconUpload = await uploadToCloudinary(files.icon, `NexusStore/${cleanAppName}/icono`);
      setUploadProgress(15);

      // 2. Upload Screenshots Directly
      setStatus(`Paso 2: Subiendo capturas (0/${files.screenshots.length})...`);
      const screenshotUrls: string[] = [];
      const screenshotPublicIds: string[] = [];
      
      for (let i = 0; i < files.screenshots.length; i++) {
        setStatus(`Paso 2: Subiendo capturas (${i + 1}/${files.screenshots.length})...`);
        const ssUpload = await uploadToCloudinary(files.screenshots[i], `NexusStore/${cleanAppName}/screenshots`);
        screenshotUrls.push(ssUpload.secure_url);
        screenshotPublicIds.push(ssUpload.public_id);
        setUploadProgress(15 + Math.floor(((i + 1) / files.screenshots.length) * 15));
      }

      // 3. Prepare GitHub Release (Get Upload URL)
      setStatus('Paso 3: Preparando almacén para el APK...');
      const prepareResponse = await fetch('/api/github-release-prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: cleanAppName,
          version: formData.version,
          description: formData.description
        })
      });

      if (!prepareResponse.ok) {
        const errData = await prepareResponse.json();
        throw new Error(errData.error || "No se pudo preparar el lanzamiento en GitHub");
      }
      const { release_id } = await prepareResponse.json();
      setUploadProgress(35);

      // 4. CHUNKED UPLOAD TO SERVER (Server will assemble and proxy to GitHub)
      setStatus('Paso 4: Iniciando subida fragmentada del APK (Para archivos grandes)...');
      
      const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB chunks to stay safe under 32MB limit
      const currentFile = files.apk as File;
      const totalChunks = Math.ceil(currentFile.size / CHUNK_SIZE);
      const uploadId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      let apkDownloadUrl = '';

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, currentFile.size);
        const chunk = currentFile.slice(start, end);
        
        const chunkFormData = new FormData();
        chunkFormData.append('chunk', chunk, 'apk_chunk');
        chunkFormData.append('chunkIndex', i.toString());
        chunkFormData.append('totalChunks', totalChunks.toString());
        chunkFormData.append('uploadId', uploadId);
        chunkFormData.append('release_id', release_id.toString());
        chunkFormData.append('app_name', formData.app_name);
        chunkFormData.append('version', formData.version);

        setStatus(`Paso 4: Subiendo fragmento ${i + 1} de ${totalChunks}...`);
        
        const chunkResponse = await fetch('/api/github-upload-chunk', {
          method: 'POST',
          body: chunkFormData
        });

        if (!chunkResponse.ok) {
          const errData = await chunkResponse.json();
          throw new Error(errData.error || `Error en fragmento ${i + 1}`);
        }

        const chunkResult = await chunkResponse.json();
        
        // Update general progress (40% to 90% range)
        const progressPerChunk = 55 / totalChunks;
        setUploadProgress(35 + Math.floor((i + 1) * progressPerChunk));

        if (chunkResult.browser_download_url) {
          apkDownloadUrl = chunkResult.browser_download_url;
        }
      }

      if (!apkDownloadUrl) {
        throw new Error("No se recibió la URL de descarga al completar la subida");
      }
      setUploadProgress(90);

      // 5. Finalize with server (Supabase registration)
      setStatus('Paso 5: Registrando aplicación...');
      
      const finalizeResponse = await fetch('/api/upload-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: formData.app_name,
          description: formData.description,
          version: formData.version,
          company_name: formData.company_name,
          category: formData.category,
          developer_id: developerId,
          icon_url: iconUpload.secure_url,
          icon_public_id: iconUpload.public_id,
          screenshots: screenshotUrls,
          screenshots_public_ids: screenshotPublicIds,
          download_url: apkDownloadUrl,
          size: `${(files.apk.size / (1024 * 1024)).toFixed(2)} MB`
        })
      });

      if (!finalizeResponse.ok) {
        const text = await finalizeResponse.text();
        throw new Error(`Error al finalizar registro: ${text.substring(0, 100)}`);
      }
      
      const finalizeResult = await finalizeResponse.json();
      setUploadProgress(100);
      setStatus('¡Todo listo! Aplicación publicada exitosamente.');
      
      setTimeout(() => {
        onSuccess(finalizeResult.app);
      }, 1500);

    } catch (error: any) {
      console.error("Upload Error:", error);
      alert(error.message);
      setIsUploading(false);
      setStatus('');
    }
  };

  return (
    <div className="bg-transparent p-0">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Detalles de la Publicación</h1>
            <p className="text-gray-400 text-sm mt-1">Sube tu APK y nosotros nos encargamos del alojamiento global.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 space-y-4 bg-white/5">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-2 uppercase tracking-wider text-cyan-400 opacity-80"><Info className="w-4 h-4" /> Información General</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Nombre de la App</label>
                <input 
                  required
                  type="text" 
                  value={formData.app_name}
                  onChange={e => setFormData({...formData, app_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2.5 rounded-xl focus:border-cyan-500 outline-none text-white text-sm"
                  placeholder="Ej: Nexus Survival"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Compañía / Estudio</label>
                <input 
                  required
                  type="text" 
                  value={formData.company_name}
                  onChange={e => setFormData({...formData, company_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2.5 rounded-xl focus:border-cyan-500 outline-none text-white text-sm"
                  placeholder="Ej: Nov-Pixel Games"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Versión</label>
                <input 
                  required
                  type="text" 
                  value={formData.version}
                  onChange={e => setFormData({...formData, version: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2.5 rounded-xl focus:border-cyan-500 outline-none text-white text-sm"
                  placeholder="Ej: 1.0.0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Categoría</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2.5 rounded-xl focus:border-cyan-500 outline-none text-white text-sm"
                >
                  <option className="bg-nexus-bg" value="Juegos">Juegos</option>
                  <option className="bg-nexus-bg" value="Herramientas">Herramientas</option>
                  <option className="bg-nexus-bg" value="Productividad">Productividad</option>
                  <option className="bg-nexus-bg" value="Redes Sociales">Redes Sociales</option>
                  <option className="bg-nexus-bg" value="Entretenimiento">Entretenimiento</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Descripción</label>
              <textarea 
                required
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-white/5 border border-white/10 p-2.5 rounded-xl focus:border-cyan-500 outline-none text-white resize-none text-sm"
                placeholder="Describe tu aplicación..."
              />
            </div>
          </div>

          {/* Archivos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* APK */}
            <div className="glass-panel p-5 rounded-2xl border-white/5 space-y-4 bg-white/5">
              <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-wider text-orange-400 opacity-80"><Package className="w-4 h-4" /> Archivo APK</h3>
              {!files.apk ? (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors">
                  <Upload className="w-6 h-6 text-gray-500 mb-2" />
                  <span className="text-xs font-bold text-gray-400">Subir APK</span>
                  <input type="file" accept=".apk" onChange={e => handleFileChange(e, 'apk')} className="hidden" />
                </label>
              ) : (
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Package className="w-8 h-8 text-orange-500" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate max-w-[120px]">{files.apk.name}</p>
                      <p className="text-[8px] text-gray-500 uppercase">{(files.apk.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeFile('apk')} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Icono */}
            <div className="glass-panel p-5 rounded-2xl border-white/5 space-y-4 bg-white/5">
              <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-wider text-cyan-400 opacity-80"><Smartphone className="w-4 h-4" /> Icono</h3>
              {!files.icon ? (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors">
                  <ImageIcon className="w-6 h-6 text-gray-500 mb-2" />
                  <span className="text-xs font-bold text-gray-400">Subir Icono</span>
                  <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'icon')} className="hidden" />
                </label>
              ) : (
                <div className="flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <img src={URL.createObjectURL(files.icon)} className="w-10 h-10 rounded-lg object-cover" />
                    <p className="text-xs font-bold text-white truncate max-w-[120px]">{files.icon.name}</p>
                  </div>
                  <button type="button" onClick={() => removeFile('icon')} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Capturas de Pantalla */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 space-y-4 bg-white/5">
            <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-wider text-purple-400 opacity-80"><ImageIcon className="w-4 h-4" /> Capturas de Pantalla (Máx 8)</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {files.screenshots.map((file, idx) => (
                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10">
                   <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                   <button 
                    type="button"
                    onClick={() => removeFile('screenshots', idx)} 
                    className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-all"
                   >
                     <X className="w-2 h-2" />
                   </button>
                </div>
              ))}
              {files.screenshots.length < 8 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-cyan-500/50 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all text-gray-500 hover:text-cyan-400">
                  <Upload className="w-4 h-4" />
                  <input type="file" accept="image/*" multiple onChange={e => handleFileChange(e, 'screenshots')} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Progress and status message */}
          <AnimatePresence>
            {isUploading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl space-y-3"
              >
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-cyan-400">
                   <span className="flex items-center gap-2">
                     <Loader2 className="w-3 h-3 animate-spin" />
                     {status}
                   </span>
                   <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isUploading}
            className={`w-full py-4 rounded-xl font-black text-md transition-all flex items-center justify-center gap-3 ${isUploading ? 'bg-white/10 text-gray-500 cursor-not-allowed' : 'bg-cyan-500 text-black hover:bg-cyan-400 hover:scale-[1.01] shadow-xl shadow-cyan-500/20'}`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> PROCESANDO SUBIDA...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" /> PUBLICAR APLICACIÓN
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
