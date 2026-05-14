import { useState } from 'react';
import { Send, CheckCircle, Mail, MessageSquare, Tag } from 'lucide-react';
import { motion } from 'motion/react';

export function ContactView() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus('idle'), 4000);
    }, 1500);
  };

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white mb-4">Contacto</h1>
        <p className="text-gray-400 max-w-lg mx-auto">
          ¿Tienes alguna duda, problema o sugerencia? Envíanos un mensaje y te responderemos lo antes posible.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-3xl border-white/5">
        {status === 'success' ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Mensaje Enviado!</h2>
            <p className="text-gray-400">Gracias por contactarnos. Te responderemos al correo proporcionado.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-400">Nombre</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-colors" placeholder="Tu nombre" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-400 flex items-center gap-2"><Mail className="w-4 h-4"/> Correo Electrónico</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-colors" placeholder="tu@correo.com" />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-400 flex items-center gap-2"><Tag className="w-4 h-4"/> Asunto</label>
              <select required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-cyan-400 transition-colors appearance-none cursor-pointer">
                <option value="" disabled className="text-gray-500 bg-black">Selecciona un asunto...</option>
                <option value="Soporte Técnico" className="bg-black">Soporte Técnico</option>
                <option value="Facturación" className="bg-black">Facturación</option>
                <option value="Reportar Bug" className="bg-black">Reportar Bug</option>
                <option value="Sugerencia" className="bg-black">Sugerencia</option>
                <option value="Business" className="bg-black">Negocios / Publicidad</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-400 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Mensaje</label>
              <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="min-h-[150px] bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-colors resize-none" placeholder="Escribe tu mensaje aquí..."></textarea>
            </div>

            <button disabled={status === 'sending'} type="submit" className="w-full h-14 bg-cyan-500 text-black font-black uppercase tracking-wider rounded-xl hover:bg-cyan-400 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {status === 'sending' ? (
                <>Enviando... <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /></>
              ) : (
                <>Enviar Mensaje <Send className="w-5 h-5" /></>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function LegalPage({ title, lastUpdated, children }: any) {
  return (
    <div className="pt-28 px-6 max-w-3xl mx-auto pb-16">
      <h1 className="text-4xl font-black text-white mb-2">{title}</h1>
      <p className="text-sm text-gray-400 font-medium mb-10">Última actualización: {lastUpdated}</p>
      <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-cyan-400 max-w-none">
        {children}
      </div>
    </div>
  );
}

export function HelpView() {
  const faqs = [
    { q: '¿Cómo descargo una aplicación?', a: 'Busca la aplicación que deseas, entra a su página de detalles y presiona el botón "Obtener" o "Instalar".' },
    { q: '¿Es seguro usar NexusPlay?', a: 'Absolutamente. Todas las aplicaciones pasan por un estricto proceso de revisión antes de ser publicadas en nuestra tienda.' },
    { q: '¿Cómo puedo publicar mi propia app?', a: 'Puedes solicitar una cuenta de desarrollador desde el perfil. Una vez aprobada, podrás acceder al Panel de Desarrollador.' },
  ];

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white mb-4">Centro de Ayuda</h1>
        <p className="text-gray-400">Encuentra respuestas a las preguntas más frecuentes.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-2xl border-white/5">
            <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
            <p className="text-gray-400 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
