import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Download, ShieldCheck, Share2, Info, CheckCircle2, AlertTriangle, MonitorPlay, Heart, History, User, Send, ThumbsUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppItem } from '../../types';
import AppGrid from '../AppGrid';
import { supabase } from '../../lib/supabase';

export function AppDetailView({ 
  app, 
  apps, 
  onBack,
  onAppClick,
  backLabel = "Volver"
}: { 
  app: AppItem; 
  apps: AppItem[]; 
  onBack: () => void;
  onAppClick?: (app: AppItem) => void;
  backLabel?: string;
}) {
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  
  const [realDownloads, setRealDownloads] = useState<string>(app.downloads || '0');
  const [reviewStats, setReviewStats] = useState({ average: 0, total: 0, distribution: {1:0, 2:0, 3:0, 4:0, 5:0} });
  const [hasReviewed, setHasReviewed] = useState(false);
  
  // Track download version
  const downloadedVersion = localStorage.getItem(`nexus_app_version_${app.id}`);
  const isUpdateAvailable = downloadedVersion && downloadedVersion !== app.version;
  const hasDownloaded = !!downloadedVersion;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User');
      }
    });

    fetchReviews();
  }, [app.id]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase.from('reviews').select('*').eq('app_id', app.id).order('created_at', { ascending: false });
      if (!error && data) {
        setReviews(data);
        
        let sum = 0;
        let dist: any = {1:0, 2:0, 3:0, 4:0, 5:0};
        let userHasReviewed = false;
        
        data.forEach(r => {
           sum += r.rating;
           dist[r.rating] = (dist[r.rating] || 0) + 1;
           // Check if current user has reviewed, but wait, `userId` might not be set yet if auth is slow. 
           // We will handle it by re-checking when userId changes.
        });
        
        setReviewStats({
          average: data.length > 0 ? (sum / data.length) : 0,
          total: data.length,
          distribution: dist
        });
      }
    } catch (e) {
      console.warn("Reviews table may not exist yet", e);
    }
  };

  useEffect(() => {
    if (userId) {
       setHasReviewed(reviews.some(r => r.user_id === userId));
    }
  }, [userId, reviews]);

  const incrementDownloads = async () => {
    try {
      let numericDownloads = 0;
      if (typeof app.downloads === 'number') {
         numericDownloads = app.downloads;
      } else if (typeof app.downloads === 'string') {
         numericDownloads = parseInt(app.downloads.replace(/[^0-9]/g, '')) || 0;
      }
      const newCount = numericDownloads + 1;
      setRealDownloads(newCount.toString());
      
      const { error } = await supabase.from('apps').update({ downloads: newCount.toString() }).eq('id', app.id);
      if (error) console.error("Error setting downloads:", error);
    } catch(err) {}
  };

  const submitReview = async () => {
    if (!userId) return;
    try {
      const { error } = await supabase.from('reviews').insert({
        app_id: app.id,
        user_id: userId,
        user_name: userName,
        rating: newRating,
        comment: newReview.trim()
      });
      if (!error) {
        setNewReview('');
        fetchReviews();
      } else {
        alert("Error al enviar comentario. Asegúrate de tener la tabla 'reviews' creada.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      await supabase.from('reviews').delete().eq('id', reviewId).eq('user_id', userId);
      fetchReviews();
    } catch (e) {
      console.error(e);
    }
  };

  // Parse rating Safely
  const ratingValue = typeof app.rating === 'string' ? parseFloat(app.rating) : app.rating;
  const safeRating = isNaN(ratingValue) ? 5.0 : ratingValue;

  const relatedApps = apps
    .filter(a => a.id !== app.id && a.category === app.category)
    .slice(0, 6);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-nexus-bg text-slate-100 flex flex-col relative overflow-hidden"
    >
      {/* Dynamic Hero Gradient Background */}
      <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-nexus-cyan/10 via-nexus-bg to-nexus-bg z-0"></div>
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[120%] bg-nexus-cyan/10 blur-[120px] rounded-full rotate-12"></div>
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[100%] bg-blue-600/10 blur-[100px] rounded-full -rotate-12"></div>
        {/* Animated grid overlay */}
        <div className="absolute inset-0 opacity-[0.05] [mask-image:linear-gradient(to_bottom,black_20%,transparent)]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-10 pt-6 sm:pt-12 pb-32 relative z-10">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <button 
            onClick={onBack}
            className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-nexus-cyan/10 border border-white/10 hover:border-nexus-cyan/30 rounded-2xl transition-all font-black text-xs uppercase tracking-widest group shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-nexus-cyan" />
            <span>{backLabel}</span>
          </button>
          
          <div className="flex items-center gap-3">
             <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-slate-400 hover:text-red-500">
               <Heart className="w-5 h-5" />
             </button>
             <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-slate-400 hover:text-nexus-cyan">
               <Share2 className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Header Left: Icon & Core Info */}
          <div className="lg:col-span-8 space-y-10">
            <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left">
              <div className="relative group shrink-0">
                <div className="absolute -inset-4 bg-nexus-cyan/20 blur-2xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <img 
                  src={app.icon} 
                  alt={app.name} 
                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[1.5rem] sm:rounded-[2rem] object-cover shadow-2xl border border-white/10 group-hover:scale-[1.02] transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                {app.status === 'published' && (
                  <div className="absolute -bottom-2 -right-2 bg-nexus-cyan p-2 rounded-xl shadow-xl border-4 border-nexus-bg">
                    <CheckCircle2 className="w-6 h-6 text-black" />
                  </div>
                )}
              </div>

              <div className="flex-1 pt-2 space-y-4">
                <div className="space-y-1">
                  <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-white drop-shadow-sm leading-none">{app.name}</h1>
                  <p className="text-xl sm:text-2xl font-bold text-nexus-cyan tracking-tight">{app.developer}</p>
                </div>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                  <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-slate-400">{app.category}</span>
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-xs font-black text-yellow-400 uppercase tracking-widest">
                    <Star className="w-3.5 h-3.5 fill-yellow-400" />
                    {reviewStats.total > 0 ? reviewStats.average.toFixed(1) : safeRating}
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-black text-slate-400 uppercase tracking-widest">
                    <Download className="w-3.5 h-3.5" />
                    {realDownloads}
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4 items-stretch">
                  {app.status === 'published' ? (
                    <a
                      href={app.downloadUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                         incrementDownloads();
                         localStorage.setItem(`nexus_app_version_${app.id}`, app.version || '1.0');
                      }}
                      className="group relative flex-1 sm:flex-initial"
                    >
                      <div className={`absolute -inset-1 ${isUpdateAvailable ? 'bg-green-500' : 'bg-nexus-cyan'} rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500`}></div>
                      <button className={`relative w-full sm:w-64 flex items-center justify-center gap-3 py-4 ${isUpdateAvailable ? 'bg-green-500 hover:bg-green-400' : 'bg-nexus-cyan hover:bg-cyan-400'} text-black rounded-2xl font-black text-lg transition-all active:scale-95 shadow-xl`}>
                        <Download className="w-6 h-6" />
                        {isUpdateAvailable ? 'ACTUALIZAR' : 'DESCARGAR'}
                      </button>
                    </a>
                  ) : (
                    <button className="flex-1 sm:flex-initial flex items-center justify-center gap-3 py-4 bg-slate-800/50 text-slate-500 rounded-2xl font-black text-lg cursor-not-allowed border border-white/5">
                      <MonitorPlay className="w-6 h-6" />
                      PRÓXIMAMENTE
                    </button>
                  )}
                  
                  <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-slate-400">
                    <ShieldCheck className="w-5 h-5 text-nexus-cyan" />
                    <div>
                      <p className="text-white">Nexus Protect</p>
                      <p className="opacity-60">Escaneado y seguro</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Screenshots Slider */}
            {app.screenshots && app.screenshots.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Vista Previa</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar snap-x snap-mandatory">
                  {app.screenshots.map((img, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="relative shrink-0 w-[85%] sm:w-[500px] h-64 sm:h-80 rounded-3xl overflow-hidden border border-white/10 shadow-2xl snap-center cursor-pointer group"
                      onClick={() => setSelectedImage(img)}
                    >
                      <img 
                        src={img} 
                        alt="Screenshot" 
                        className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Description Card */}
            <div className="premium-card p-8 sm:p-12 space-y-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <Info className="w-6 h-6 text-nexus-cyan" />
                  Información General
                </h3>
                {app.shortDescription && (
                  <p className="text-xl font-bold text-slate-300 leading-relaxed italic border-l-4 border-nexus-cyan pl-6 py-2">
                    {app.shortDescription}
                  </p>
                )}
                <div className={`relative transition-all duration-500 overflow-hidden ${showFullDesc ? '' : 'max-h-40'}`}>
                  <p className="text-slate-400 leading-relaxed whitespace-pre-wrap text-lg">
                    {app.description || 'Sin descripción detallada.'}
                  </p>
                  {!showFullDesc && (
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-900 to-transparent"></div>
                  )}
                </div>
                {!showFullDesc && (
                  <button 
                    onClick={() => setShowFullDesc(true)}
                    className="text-nexus-cyan font-black text-sm uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Leer más +
                  </button>
                )}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/5">
                <div className="space-y-1">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Tamaño</span>
                  <p className="text-white font-bold text-lg">{app.size || '78 MB'}</p>
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Versión</span>
                  <p className="text-white font-bold text-lg">{app.version || '1.0.0'}</p>
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Req. Min</span>
                  <p className="text-white font-bold text-lg">{app.compatibility || 'Android 8.0'}</p>
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Contenido</span>
                  <p className="text-white font-bold text-lg">+13</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Right: Ratings & Reviews */}
          <div className="lg:col-span-4 space-y-8">
            <div className="premium-card p-8 space-y-6">
              <h3 className="text-xl font-black text-white">Calificaciones</h3>
              <div className="flex items-center gap-6">
                <div className="text-center space-y-1">
                  <p className="text-5xl font-black text-white">{reviewStats.total > 0 ? reviewStats.average.toFixed(1) : safeRating}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{reviewStats.total} Reseñas</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5,4,3,2,1].map(star => {
                    const count = reviewStats.distribution[star] || 0;
                    const percent = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 w-2">{star}</span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            className="h-full bg-nexus-cyan"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Public Review */}
            <div className="premium-card p-8 space-y-6">
              <h3 className="text-xl font-black text-white italic">Opiniones Reales</h3>
              <div className="space-y-6 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                {reviews.map(rev => (
                  <div key={rev.id} className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-nexus-cyan flex items-center justify-center text-black font-black text-xs uppercase">
                          {rev.user_name?.[0]}
                        </div>
                        <span className="font-bold text-sm text-white">{rev.user_name}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${rev.rating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">{rev.comment}</p>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div className="text-center py-10 opacity-30">No hay reseñas para mostrar.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Apps Section */}
        {relatedApps.length > 0 && (
          <div className="mt-20 space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-white tracking-tighter">Apps Recomendadas</h2>
              <button className="text-nexus-cyan font-black text-xs uppercase tracking-widest border-b border-nexus-cyan/30 pb-1">Ver todas</button>
            </div>
            <AppGrid apps={relatedApps} onAppClick={onAppClick} />
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-20"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl w-full h-full flex items-center justify-center"
            >
              <img 
                src={selectedImage} 
                alt="Screenshot Full" 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl shadow-cyan-500/10" 
              />
              <button className="absolute top-0 right-0 p-4 text-white/50 hover:text-white transition-colors">
                <X className="w-8 h-8" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
