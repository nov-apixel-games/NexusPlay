import { useAppStore } from '../store/useAppStore';
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
  const { t } = useAppStore();
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
      alert(t("upload.errorSelectAPK"));
      return;
    }

    setIsUploading(true);
    setStatus(t("upload.step1"));
    setUploadProgress(5);

    try {
      // 1. Upload Icon Directly
      const cleanAppName = formData.app_name.trim().replace(/\s+/g, '-');
      setStatus(t("upload.step1"));
      const iconUpload = await uploadToCloudinary(files.icon, `NexusStore/${cleanAppName}/icono`);
      setUploadProgress(15);

      // 2. Upload Screenshots Directly
      setStatus(`${t("upload.step2")} (0/${files.screenshots.length})...`);
      const screenshotUrls: string[] = [];
      const screenshotPublicIds: string[] = [];
      
      for (let i = 0; i < files.screenshots.length; i++) {
        setStatus(`${t("upload.step2")} (${i + 1}/${files.screenshots.length})...`);
        const ssUpload = await uploadToCloudinary(files.screenshots[i], `NexusStore/${cleanAppName}/screenshots`);
        screenshotUrls.push(ssUpload.secure_url);
        screenshotPublicIds.push(ssUpload.public_id);
        setUploadProgress(15 + Math.floor(((i + 1) / files.screenshots.length) * 15));
      }

      // 3. Prepare GitHub Release (Get Upload URL)
      setStatus(t("upload.step3"));
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
        throw new Error(errData.error || t("upload.errorStep3"));
      }
      const { release_id } = await prepareResponse.json();
      setUploadProgress(35);

      // 4. CHUNKED UPLOAD TO SERVER (Server will assemble and proxy to GitHub)
      setStatus(t("upload.step4"));
      
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

        setStatus(`${t("upload.step4Chunk")} ${i + 1} de ${totalChunks}...`);
        
        const chunkResponse = await fetch('/api/github-upload-chunk', {
          method: 'POST',
          body: chunkFormData
        });

        if (!chunkResponse.ok) {
          const errData = await chunkResponse.json();
          throw new Error(errData.error || `${t("upload.errorChunk")} ${i + 1}`);
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
        throw new Error(t("upload.errorNoUrl"));
      }
      setUploadProgress(90);

      // 5. Finalize with server (Supabase registration)
      setStatus(t("upload.step5"));
      
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
        throw new Error(`${t("upload.errorFinal")}: ${text.substring(0, 100)}`);
      }
      
      const finalizeResult = await finalizeResponse.json();
      setUploadProgress(100);
      setStatus(t("upload.success"));
      
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
            <h1 className="text-2xl font-black text-nexus-text">{t("upload.detailsTitle")}</h1>
            <p className="text-nexus-text-sec text-sm mt-1">{t("upload.detailsDesc")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="glass-panel p-5 rounded-2xl border-nexus-border space-y-4 bg-nexus-card">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-2 uppercase tracking-wider text-cyan-400 opacity-80"><Info className="w-4 h-4" /> Información General</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-nexus-text-sec uppercase ml-1">{t("upload.appName")}</label>
                <input 
                  required
                  type="text" 
                  value={formData.app_name}
                  onChange={e => setFormData({...formData, app_name: e.target.value})}
                  className="w-full bg-nexus-surface border border-nexus-border p-2.5 rounded-xl focus:border-cyan-500 outline-none text-nexus-text text-sm"
                  placeholder="Ej: Nexus Survival"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-nexus-text-sec uppercase ml-1">{t("upload.company")}</label>
                <input 
                  required
                  type="text" 
                  value={formData.company_name}
                  onChange={e => setFormData({...formData, company_name: e.target.value})}
                  className="w-full bg-nexus-surface border border-nexus-border p-2.5 rounded-xl focus:border-cyan-500 outline-none text-nexus-text text-sm"
                  placeholder="Ej: Nov-Pixel Games"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-nexus-text-sec uppercase ml-1">{t("app.version")}</label>
                <input 
                  required
                  type="text" 
                  value={formData.version}
                  onChange={e => setFormData({...formData, version: e.target.value})}
                  className="w-full bg-nexus-surface border border-nexus-border p-2.5 rounded-xl focus:border-cyan-500 outline-none text-nexus-text text-sm"
                  placeholder="Ej: 1.0.0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-nexus-text-sec uppercase ml-1">{t("upload.category")}</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-nexus-surface border border-nexus-border p-2.5 rounded-xl focus:border-cyan-500 outline-none text-nexus-text text-sm"
                >
                  <option className="bg-nexus-bg" value="Juegos">{t('nav.games')}</option>
                  <option className="bg-nexus-bg" value="Herramientas">{t("uploadtools.tools")}</option>
                  <option className="bg-nexus-bg" value="Productividad">{t("uploadtools.prod")}</option>
                  <option className="bg-nexus-bg" value="Redes Sociales">{t("uploadtools.social")}</option>
                  <option className="bg-nexus-bg" value="Entretenimiento">{t("uploadtools.ent")}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-nexus-text-sec uppercase ml-1">{t("upload.description")}</label>
              <textarea 
                required
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-nexus-surface border border-nexus-border p-2.5 rounded-xl focus:border-cyan-500 outline-none text-nexus-text resize-none text-sm"
                placeholder="Describe tu aplicación..."
              />
            </div>
          </div>

          {/* Archivos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* APK */}
            <div className="glass-panel p-5 rounded-2xl border-nexus-border space-y-4 bg-nexus-card">
              <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-wider text-orange-400 opacity-80"><Package className="w-4 h-4" /> {t("upload.apkFile")}</h3>
              {!files.apk ? (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-nexus-border rounded-2xl cursor-pointer hover:bg-nexus-card transition-colors">
                  <Upload className="w-6 h-6 text-nexus-text-sec mb-2" />
                  <span className="text-xs font-bold text-nexus-text-sec">{t("upload.uploadApk")}</span>
                  <input type="file" accept=".apk" onChange={e => handleFileChange(e, 'apk')} className="hidden" />
                </label>
              ) : (
                <div className="flex items-center justify-between p-3 bg-nexus-surface border border-nexus-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <Package className="w-8 h-8 text-orange-500" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-nexus-text truncate max-w-[120px]">{files.apk.name}</p>
                      <p className="text-[8px] text-nexus-text-sec uppercase">{(files.apk.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeFile('apk')} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Icono */}
            <div className="glass-panel p-5 rounded-2xl border-nexus-border space-y-4 bg-nexus-card">
              <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-wider text-cyan-400 opacity-80"><Smartphone className="w-4 h-4" /> {t("upload.iconStr")}</h3>
              {!files.icon ? (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-nexus-border rounded-2xl cursor-pointer hover:bg-nexus-card transition-colors">
                  <ImageIcon className="w-6 h-6 text-nexus-text-sec mb-2" />
                  <span className="text-xs font-bold text-nexus-text-sec">{t("upload.uploadIcon")}</span>
                  <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'icon')} className="hidden" />
                </label>
              ) : (
                <div className="flex items-center justify-between p-2 bg-nexus-surface border border-nexus-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <img src={URL.createObjectURL(files.icon)} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <p className="text-xs font-bold text-nexus-text truncate max-w-[120px]">{files.icon.name}</p>
                  </div>
                  <button type="button" onClick={() => removeFile('icon')} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Capturas de Pantalla */}
          <div className="glass-panel p-5 rounded-2xl border-nexus-border space-y-4 bg-nexus-card">
            <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-wider text-purple-400 opacity-80"><ImageIcon className="w-4 h-4" /> {t("upload.screenshotsMax")}</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {files.screenshots.map((file, idx) => (
                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-nexus-card border border-nexus-border">
                   <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                   <button 
                    type="button"
                    onClick={() => removeFile('screenshots', idx)} 
                    className="absolute top-1 right-1 p-1 bg-nexus-surface hover:bg-red-500/80 text-nexus-text rounded opacity-0 group-hover:opacity-100 transition-all"
                   >
                     <X className="w-2 h-2" />
                   </button>
                </div>
              ))}
              {files.screenshots.length < 8 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-nexus-border hover:border-cyan-500/50 flex flex-col items-center justify-center cursor-pointer hover:bg-nexus-card transition-all text-nexus-text-sec hover:text-cyan-400">
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
                <div className="w-full h-1.5 bg-nexus-surface rounded-full overflow-hidden">
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
            className={`w-full py-4 rounded-xl font-black text-md transition-all flex items-center justify-center gap-3 ${isUploading ? 'bg-nexus-card-hover text-nexus-text-sec cursor-not-allowed' : 'bg-cyan-500 text-nexus-bg hover:bg-cyan-400 hover:scale-[1.01] shadow-xl shadow-cyan-500/20'}`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> {t("upload.processing")}
              </>
            ) : (
              <>
                <Check className="w-5 h-5" /> {t("upload.publishBtn")}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
