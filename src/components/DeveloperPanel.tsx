import { useState } from 'react';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, CheckCircle, ShieldAlert, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { AppItem, DevRequest } from '../types';

interface DeveloperPanelProps {
  userEmail: string | null;
  devRequests: DevRequest[];
  setDevRequests: (reqs: DevRequest[]) => void;
  onAddApp: (app: AppItem) => void;
  onUpdateApp: (app: AppItem) => void;
  onClose: () => void;
  publishedApps: AppItem[];
}

export default function DeveloperPanel({ userEmail, devRequests, setDevRequests, onAddApp, onUpdateApp, onClose, publishedApps }: DeveloperPanelProps) {
  const [reqData, setReqData] = useState({ name: '', company: '', experience: '', appTypes: '', message: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    description: '',
    category: 'Herramientas',
    size: '',
    version: '',
    icon: '',
    screenshot: '',
    downloadUrl: ''
  });
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'my-apps' | 'requirements'>('upload');

  const currentRequest = devRequests.find(r => r.email === userEmail);
  const isApproved = currentRequest?.status === 'approved' || userEmail === 'elmenorjn@gmail.com'; // admin is always approved

  const handleRequestAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;
    
    const newReq: DevRequest = {
      id: Math.random().toString(36).substr(2, 9),
      userId: userEmail,
      name: reqData.name,
      email: userEmail,
      company: reqData.company,
      experience: reqData.experience,
      appTypes: reqData.appTypes,
      message: reqData.message,
      status: 'pending',
      date: new Date().toISOString()
    };
    
    setDevRequests([newReq, ...devRequests]);
  };

  const handleAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.downloadUrl.toLowerCase().endsWith('.apk') && !formData.downloadUrl.includes('drive.google.com') && !formData.downloadUrl.includes('mega.nz') && !formData.downloadUrl.includes('mediafire.com')) {
      alert("Solo se aceptan archivos .APK válidos o links de Mega, MediaFire, Google Drive.");
      return;
    }

    const newApp: AppItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      developer: formData.company,
      description: formData.description,
      category: formData.category,
      size: formData.size,
      version: formData.version,
      icon: formData.icon || 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=128&h=128&fit=crop',
      screenshots: [formData.screenshot],
      downloadUrl: formData.downloadUrl,
      status: 'pending',
      rating: 5.0,
      downloads: '0',
      price: 'Gratis',
      date: new Date().toISOString()
    };
    
    onAddApp(newApp);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
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

        <div className="overflow-y-auto p-6 md:p-8 flex-1 custom-scrollbar">
          {!isApproved ? (
            currentRequest ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold">Solicitud en Revisión</h3>
                <p className="text-gray-400 max-w-sm">
                  Tu solicitud ha sido enviada y está siendo revisada por nuestro equipo. Recibirás una notificación cuando sea aprobada.
                </p>
              </div>
            ) : (
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Solicita Acceso</h3>
                  <p className="text-gray-400 text-sm">
                    Para publicar en NexusPlay debes solicitar acceso como desarrollador. Nuestro equipo revisará tu solicitud. Cuando sea aprobada recibirás una notificación.
                  </p>
                </div>
                <form onSubmit={handleRequestAccess} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="text" placeholder="Nombre completo" value={reqData.name} onChange={e => setReqData({...reqData, name: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 transition-colors" />
                    <input required type="text" placeholder="Nombre de tu estudio/compañía" value={reqData.company} onChange={e => setReqData({...reqData, company: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 transition-colors" />
                  </div>
                  <input required type="text" placeholder="Experiencia previa (ej: 3 años)" value={reqData.experience} onChange={e => setReqData({...reqData, experience: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 transition-colors" />
                  <input required type="text" placeholder="Qué tipo de apps publicarás?" value={reqData.appTypes} onChange={e => setReqData({...reqData, appTypes: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 transition-colors" />
                  <textarea required placeholder="Mensaje adicional sobre ti o tu equipo" value={reqData.message} onChange={e => setReqData({...reqData, message: e.target.value})} className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-cyan-400 transition-colors resize-none"></textarea>
                  <button type="submit" className="w-full h-14 bg-cyan-500 text-black font-black uppercase rounded-xl hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2">
                    Enviar Solicitud <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            )
          ) : (
            <>
              <div className="flex gap-4 mb-8 border-b border-white/5 pb-4">
                <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 font-bold transition-colors ${activeTab === 'upload' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500'}`}>Subir App</button>
                <button onClick={() => setActiveTab('my-apps')} className={`px-4 py-2 font-bold transition-colors ${activeTab === 'my-apps' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500'}`}>Mis Publicaciones</button>
                <button onClick={() => setActiveTab('requirements')} className={`px-4 py-2 font-bold transition-colors ${activeTab === 'requirements' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500'}`}>Requisitos</button>
              </div>

              {activeTab === 'requirements' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Requisitos para Publicar</h3>
                  <ul className="list-disc pl-5 space-y-2 text-gray-300">
                    <li>Archivo <strong>.APK funcional</strong> (o enlace directo de descarga).</li>
                    <li><strong>Icono obligatorio</strong> en buena resolución.</li>
                    <li>Mínimo <strong>2 capturas de pantalla</strong> del funcionamiento.</li>
                    <li><strong>Descripción clara</strong> y sin engaños.</li>
                    <li><strong>Peso real</strong> de la aplicación.</li>
                    <li>Link de descarga válido (Mega, MediaFire, Google Drive, Dropbox permitidos).</li>
                    <li>Ausencia de malware o contenido malicioso.</li>
                  </ul>
                </div>
              )}

              {activeTab === 'my-apps' && (
                <div className="space-y-4">
                  {publishedApps.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">Aún no has publicado ninguna aplicación.</p>
                  ) : (
                    publishedApps.map(app => (
                      <div key={app.id} className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <img src={app.icon} alt={app.name} className="w-12 h-12 rounded-lg" />
                           <div>
                             <h4 className="font-bold text-white">{app.name} <span className="text-xs text-gray-500 font-normal">v{app.version}</span></h4>
                             <p className="text-xs text-gray-400">Estado: <span className={app.status === 'published' ? 'text-green-400' : app.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}>{app.status === 'published' ? 'Aprobada' : app.status === 'rejected' ? 'Rechazada' : 'En Revisión'}</span></p>
                           </div>
                        </div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold text-gray-300 transition-colors">Editar</button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'upload' && (
                isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 shadow-[0_0_30px_rgba(7ade80,0.2)]">
                      <CheckCircle className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-bold">¡Aplicación Enviada!</h3>
                    <p className="text-gray-500">Tu app está en revisión. Te notificaremos cuando sea aprobada.</p>
                  </div>
                ) : (
                  <form onSubmit={handleAppSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase px-1">Nombre de la App</label>
                        <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 transition-all font-medium" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase px-1">Compañía / Estudio</label>
                        <input required type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 transition-all font-medium" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase px-1">Categoría</label>
                          <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 transition-all cursor-pointer">
                            <option className="bg-[#030712]">Herramientas</option>
                            <option className="bg-[#030712]">Juegos</option>
                            <option className="bg-[#030712]">Música</option>
                            <option className="bg-[#030712]">Social</option>
                            <option className="bg-[#030712]">Productividad</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase px-1">Peso (Ej: 45MB)</label>
                          <input required type="text" value={formData.size} onChange={(e) => setFormData({...formData, size: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 transition-all font-medium" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase px-1">Descripción</label>
                        <textarea required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-cyan-400 transition-all resize-none"></textarea>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase px-1">Versión</label>
                          <input required type="text" value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 transition-all font-medium" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase px-1"><ImageIcon className="inline w-3 h-3"/> Icono URL</label>
                          <input required type="url" value={formData.icon} onChange={(e) => setFormData({...formData, icon: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 transition-all font-medium" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase px-1"><Upload className="inline w-3 h-3"/> Capturas (URL 1)</label>
                        <input required type="url" value={formData.screenshot} onChange={(e) => setFormData({...formData, screenshot: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 transition-all font-medium" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase px-1"><LinkIcon className="inline w-3 h-3"/> Link de descarga (Mega/Drive)</label>
                        <input required type="url" value={formData.downloadUrl} onChange={(e) => setFormData({...formData, downloadUrl: e.target.value})} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-cyan-400 transition-all font-medium" />
                        <p className="text-[10px] text-yellow-500 px-1">Solo admitimos archivos .apk y enlaces de dominios válidos.</p>
                      </div>

                      <div className="pt-4">
                        <button type="submit" className="w-full h-14 bg-cyan-500 text-black font-black text-lg rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)]">PUBLICAR AHORA</button>
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
