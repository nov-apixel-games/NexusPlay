import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';
import { Send, CheckCircle, Mail, MessageSquare, Tag, User } from 'lucide-react';
import { motion } from 'motion/react';
import { SupportEmailBox } from '../SupportEmailBox';

export function PrivacyPolicyView({ storeName, onBack }: { storeName: string; onBack: () => void }) {
  const { t } = useAppStore();
  return (
    <LegalPage title={t("footer.privacy")} lastUpdated="15 de Mayo, 2026" onBack={onBack}>
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">1. Introducción</h2>
        <p>En {storeName}, la privacidad de nuestros usuarios y desarrolladores es nuestra prioridad. Esta Política de Privacidad explica cómo recopilamos, utilizamos, almacenamos y protegemos la información personal cuando utilizas nuestra plataforma digital.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">2. Datos Recopilados</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Información de Cuenta:</strong> Correo electrónico y nombre de usuario.</li>
          <li><strong>Perfil:</strong> Nombre real y datos de perfil adicionales (si se proporcionan).</li>
          <li><strong>Datos Técnicos:</strong> Información de autenticación (tokens de sesión).</li>
          <li><strong>Contenido Generado:</strong> Aplicaciones publicadas, iconos, capturas de pantalla, descripciones y datos técnicos de tus apps.</li>
          <li><strong>Actividad:</strong> Interacciones, descargas y navegación dentro de la plataforma.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">3. Infraestructura</h2>
        <p>Para asegurar la máxima seguridad y rendimiento, {storeName} utiliza infraestructura líder en la industria:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Supabase:</strong> Gestiona nuestra base de datos, autenticación de usuarios y lógica de backend en tiempo real.</li>
          <li><strong>Cloudinary:</strong> Gestiona de manera segura y eficiente la optimización, almacenamiento y entrega de todas las imágenes e iconos de la plataforma.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">4. Uso de los Datos</h2>
        <p>Utilizamos la información recopilada para:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Facilitar el acceso seguro a tu cuenta.</li>
          <li>Gestionar la publicación, moderación y distribución de aplicaciones.</li>
          <li>Mejorar el funcionamiento técnico de la plataforma.</li>
          <li>Comunicarnos contigo sobre actualizaciones de cuenta o problemas técnicos.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">5. Cookies y Sesiones</h2>
        <p>Utilizamos cookies técnicas y almacenamiento local exclusivamente para:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Mantener tu sesión activa de manera segura.</li>
          <li>Recordar tus preferencias dentro de la plataforma.</li>
          <li>Proporcionar una experiencia fluida al navegar.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">6. Seguridad y Protección</h2>
        <p>NexusPlay aplica medidas razonables de seguridad y buenas prácticas tecnológicas para proteger la información. <strong>{storeName} no comercializa ni vende datos personales.</strong></p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">7. Eliminación de Cuenta</h2>
        <p>Al solicitar la eliminación de tu cuenta, el acceso será revocado, los datos personales asociados serán eliminados de nuestros sistemas, y tus aplicaciones publicadas podrán ser retiradas de la plataforma.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">8. Tus Derechos</h2>
        <p>En cualquier momento tienes derecho a:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Solicitar la eliminación total de tu cuenta y los datos asociados.</li>
          <li>Actualizar o rectificar tu información.</li>
          <li>Contactar a nuestro soporte para resolver dudas.</li>
        </ul>
      </section>

      <section className="mb-8 p-6 bg-nexus-card rounded-2xl border border-nexus-border">
        <h2 className="text-xl font-bold text-nexus-text mb-2">Contacto de Privacidad</h2>
        <p>Para ejercer tus derechos o si tienes preguntas sobre esta política, contáctanos a través de nuestra sección de soporte en la plataforma o mediante los canales oficiales.</p>
      </section>
    </LegalPage>
  );
}

export function TermsAndConditionsView({ storeName, onBack }: { storeName: string; onBack: () => void }) {
  const { t } = useAppStore();
  return (
    <LegalPage title={t("footer.terms")} lastUpdated="15 de Mayo, 2026" onBack={onBack}>
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">1. Aceptación de los Términos</h2>
        <p>Al crear una cuenta en {storeName} o acceder a nuestra plataforma, aceptas de manera expresa y vinculante estos Términos y Condiciones. Si no estás de acuerdo con ellos, no utilices nuestros servicios.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">2. Registro de Cuenta</h2>
        <p>Al registrarte, declaras que la información proporcionada es veraz, completa y actual. Es tu responsabilidad mantener la confidencialidad de tu cuenta. Queda estrictamente prohibida la suplantación de identidad de otros usuarios o desarrolladores.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">3. Publicación de Aplicaciones</h2>
        <p>Como desarrollador, garantizas que tus aplicaciones:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Son archivos .APK válidos, seguros y libres de malware.</li>
          <li>No infringen derechos de autor, marcas registradas ni propiedad intelectual de terceros.</li>
          <li>No contienen contenido ilegal, ofensivo o prohibido por nuestras políticas de seguridad.</li>
          <li>Utilizan únicamente enlaces de descarga externos seguros (ej. MediaFire, Mega, o plataformas similares autorizadas).</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">4. Moderación y Contenido</h2>
        <p>{storeName} se reserva el derecho de revisar, moderar, suspender o retirar contenido que incumpla estas políticas. Podemos suspender cuentas o revocar privilegios de desarrollador en caso de actividad sospechosa o violaciones graves.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">5. Seguridad de Aplicaciones</h2>
        <p>NexusPlay podrá rechazar, suspender o eliminar cualquier aplicación que contenga malware, virus, spyware, archivos dañinos, prácticas engañosas, enlaces fraudulentos, contenido ilegal o que represente un riesgo para los usuarios. NexusPlay puede suspender o eliminar cuentas reincidentes.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">6. Responsabilidad</h2>
        <p>{storeName} actúa únicamente como una plataforma intermediaria. No garantizamos el funcionamiento, disponibilidad o seguridad de las aplicaciones subidas por los desarrolladores. Cada desarrollador asume la responsabilidad legal total por su contenido.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">7. Propiedad Intelectual</h2>
        <p>Los desarrolladores conservan todos los derechos de propiedad intelectual sobre sus aplicaciones. Sin embargo, al publicar en {storeName}, otorgas el permiso para que distribuya tu contenido a los usuarios según la naturaleza de nuestra plataforma.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">8. Suspensión</h2>
        <p>Nos reservamos el derecho de restringir o eliminar el acceso a usuarios o desarrolladores que abusen de la plataforma o incumplan estos términos, cuando la gravedad de la infracción lo justifique.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">9. Edad Mínima</h2>
        <p>Al crear una cuenta, el usuario declara tener al menos 13 años de edad o contar con la debida autorización de su responsable legal.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">10. Modificaciones</h2>
        <p>Estos términos pueden ser actualizados periodicamente. Te notificaremos sobre cambios significativos, y tu uso continuado de {storeName} implicará la aceptación de los nuevos términos.</p>
      </section>

      <section className="mb-8 p-6 bg-nexus-card rounded-2xl border border-nexus-border">
        <h2 className="text-xl font-bold text-nexus-text mb-2">Contacto Legal</h2>
        <p>Si tienes alguna consulta sobre nuestros términos, por favor contáctanos a través del canal oficial de soporte en la plataforma.</p>
      </section>
    </LegalPage>
  );
}

export function CookiePolicyView({ storeName, onBack }: { storeName: string; onBack: () => void }) {
  const { t } = useAppStore();
  return (
    <LegalPage title={t("footer.cookies")} lastUpdated="15 de Mayo, 2026" onBack={onBack}>
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">1. Introducción</h2>
        <p>En {storeName}, utilizamos cookies y tecnologías similares para mejorar tu experiencia, garantizar la seguridad y asegurar el correcto funcionamiento de nuestra plataforma. Esta política explica qué son, cómo las usamos y qué control tienes sobre ellas.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">2. Tipos de Cookies y Tecnologías</h2>
        
        <h3 className="text-xl font-semibold text-nexus-text mb-2 mt-4 underline">Cookies Esenciales</h3>
        <p className="mb-2">Son indispensables para el funcionamiento básico del sitio. Permiten:</p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li>Iniciar y mantener sesiones de usuario de forma segura.</li>
          <li>Autenticar tu identidad durante la navegación.</li>
          <li>Proteger tu cuenta contra accesos no autorizados.</li>
        </ul>

        <h3 className="text-xl font-semibold text-nexus-text mb-2 mt-4 underline">Cookies Funcionales</h3>
        <p className="mb-2">Ayudan a mejorar la navegación y personalización mediante:</p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li>Recordar preferencias del sistema.</li>
          <li>Ajustes visuales y de interfaz seleccionados.</li>
          <li>Experiencia personalizada en la plataforma.</li>
        </ul>
        
        <h3 className="text-xl font-semibold text-nexus-text mb-2 mt-4 underline">Almacenamiento Local (LocalStorage)</h3>
        <p className="mb-4">Utilizamos mecanismos de almacenamiento del navegador para persistir temporalmente información crítica como estados de sesión, preferencias de usuario y datos necesarios para optimizar el rendimiento de la plataforma sin saturar la red.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">3. Servicios Externos e Infraestructura</h2>
        <p>{storeName} utiliza infraestructura líder en la industria. Estos servicios pueden utilizar tecnologías técnicas necesarias para su correcto funcionamiento:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Supabase:</strong> Gestiona la autenticación, seguridad de sesión y persistencia de datos necesarios para tu cuenta.</li>
          <li><strong>Cloudinary:</strong> Gestiona la entrega y optimización de activos visuales, asegurando el rendimiento de las imágenes de la plataforma.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">4. Control del Usuario</h2>
        <p>Puedes gestionar el uso de cookies y almacenamiento externo a través de la configuración de tu navegador. Tienes la opción de:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Borrar cookies o datos del sitio en cualquier momento.</li>
          <li>Cerrar sesión para invalidar cookies de autenticación.</li>
          <li>Configurar tu navegador para bloquear ciertas tecnologías.</li>
        </ul>
        <p className="mt-4 text-sm text-nexus-text-sec"><strong>Nota:</strong> Algunas funciones esenciales de {storeName}, como el inicio de sesión o la visualización de datos personalizados, podrían verse afectadas si desactivas estas tecnologías.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">5. Modificaciones</h2>
        <p>{storeName} podrá actualizar esta Política de Cookies cuando sea necesario para adaptarla a cambios técnicos o normativos.</p>
      </section>

      <section className="mb-8 p-6 bg-nexus-card rounded-2xl border border-nexus-border">
        <h2 className="text-xl font-bold text-nexus-text mb-2">Contacto</h2>
        <p>Si tienes alguna consulta adicional sobre cómo utilizamos cookies, por favor contactanos:</p>
        <SupportEmailBox category="Dudas Cookies/Privacidad" />
      </section>
    </LegalPage>
  );
}

export function AboutView({ storeName, onBack }: { storeName: string; onBack: () => void }) {
  const { t } = useAppStore();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pt-28 px-6 max-w-5xl mx-auto pb-24"
    >
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-nexus-text-sec hover:text-cyan-400 transition-colors"
       type="button" >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {t('contact.back')}
      </button>
      <div className="text-center mb-20">
        <h1 className="text-5xl md:text-6xl font-black text-nexus-text mb-6 tracking-tighter">Sobre {storeName}</h1>
        <p className="text-xl md:text-2xl text-nexus-text-sec max-w-3xl mx-auto font-light leading-relaxed">
          La plataforma moderna para descubrir, compartir y publicar aplicaciones Android con una experiencia curada y ultrarrápida.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <section className="bg-nexus-card p-10 rounded-3xl border border-nexus-border shadow-2xl relative overflow-hidden group hover:border-cyan-500/20 transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-2xl font-bold text-nexus-text mb-4">¿Quiénes somos?</h2>
            <p className="text-nexus-text-sec leading-relaxed text-lg">
                {storeName} es una plataforma digital independiente enfocada en ofrecer un espacio innovador para usuarios y desarrolladores. Buscamos redefinir la distribución digital con tecnología de vanguardia, cercanía y una experiencia de usuario distinguida.
            </p>
        </section>
        
        <section className="bg-nexus-card p-10 rounded-3xl border border-nexus-border shadow-2xl relative overflow-hidden group hover:border-nexus-green/20 transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-nexus-green to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-2xl font-bold text-nexus-text mb-4">Nuestra Misión</h2>
            <p className="text-nexus-text-sec leading-relaxed text-lg">
                Facilitar el descubrimiento de aplicaciones, apoyar a desarrolladores emergentes y crear una experiencia moderna, rápida y segura para nuestra comunidad.
            </p>
        </section>
      </div>

      <section className="bg-gradient-to-br from-nexus-bg to-nexus-bg p-12 rounded-3xl border border-nexus-border/30 mb-20 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-nexus-cyan/5 blur-3xl rounded-full" />
        <h2 className="text-3xl font-bold text-nexus-text mb-6 relative z-10">Nuestra Visión</h2>
        <p className="text-xl text-nexus-text leading-relaxed max-w-4xl mx-auto font-light relative z-10">
            Convertirnos en una plataforma reconocida donde desarrolladores puedan brillar compartiendo sus creaciones y usuarios de todo el mundo descubran nuevas experiencias digitales.
        </p>
      </section>

      <section className="mb-20">
        <h2 className="text-3xl lg:text-4xl font-black text-nexus-text mb-10 text-center tracking-tight">¿Qué ofrecemos?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
                { title: 'Publicación Segura', desc: 'Sube tus creaciones de forma sencilla en una infraestructura confiable.' },
                { title: 'Búsqueda Inteligente', desc: 'Encuentra lo que necesitas al instante con nuestro algoritmo optimizado.' },
                { title: 'Herramientas Dev', desc: 'Potente panel de control con métricas y gestión simplificada.' },
                { title: 'Auditoría Continua', desc: 'Sistema de revisión y moderación para mantener la calidad.' },
                { title: 'Diseño Premium', desc: 'Una interfaz fluida, oscura y sin distracciones indeseadas.' },
                { title: 'Integración IA', desc: 'Experiencia potenciada con el poder de modelos generativos.' },
            ].map((item, idx) => (
                <div key={idx} className="bg-nexus-card p-8 rounded-2xl border border-nexus-border hover:border-cyan-500/30 hover:bg-nexus-card-hover transition-all group">
                    <h3 className="font-bold text-nexus-text mb-3 text-lg group-hover:text-cyan-400 transition-colors">{item.title}</h3>
                    <p className="text-sm text-nexus-text-sec leading-relaxed">{item.desc}</p>
                </div>
            ))}
        </div>
      </section>

      <div className="text-center p-12 bg-cyan-950/20 rounded-3xl border border-nexus-border/30 shadow-nexus-glow mb-12">
        <h2 className="text-2xl font-bold text-nexus-text mb-4">El Futuro de {storeName}</h2>
        <p className="text-lg text-nexus-text leading-relaxed max-w-2xl mx-auto">
            Estamos creando algo más grande. Un ecosistema donde creativos y usuarios construyen juntos el siguiente paso de la distribución digital. ¡Gracias por ser parte de este viaje!
        </p>
      </div>

      <div className="flex flex-col items-center border-t border-nexus-border pt-10">
         <h2 className="text-2xl font-bold text-nexus-text mb-2">¿Quieres saber más?</h2>
         <p className="text-nexus-text-sec mb-6">Estamos aquí para responder tus dudas</p>
         <SupportEmailBox category="Contacto Web" />
      </div>

    </motion.div>
  );
}

export function ContactView({ onBack }: { onBack: () => void }) {
  const { t } = useAppStore();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', category: 'Soporte Técnico', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{ ...formData, created_at: new Date().toISOString(), read: false }]);
      if (error) throw error;
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', category: 'Soporte Técnico', message: '' });
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      alert(t('contact.form.error') + (err as Error).message);
      setStatus('idle');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pt-28 px-6 max-w-4xl mx-auto pb-24"
    >
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-nexus-text-sec hover:text-cyan-400 transition-colors"
       type="button" >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {t('contact.back')}
      </button>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-nexus-text mb-4 tracking-tight">{t('contact.title')}</h1>
        <p className="text-lg text-nexus-text-sec max-w-lg mx-auto font-light">{t('contact.subtitle')}</p>
      </div>

      <div className="bg-nexus-card p-8 md:p-12 rounded-3xl border border-nexus-border shadow-2xl">
        {status === 'success' ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-3xl font-black text-nexus-text mb-2">{t('contact.success.title')}</h2>
            <p className="text-nexus-text-sec text-lg">{t('contact.success.desc')}</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-nexus-text-sec flex items-center gap-2"><User className="w-4 h-4 text-cyan-500"/> {t('contact.form.name')}</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 bg-nexus-surface border border-nexus-border rounded-xl px-4 text-nexus-text focus:outline-none focus:border-cyan-400 focus:bg-nexus-surface-hover transition-all font-medium" placeholder={t('contact.form.namePlaceholder')} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-nexus-text-sec flex items-center gap-2"><Mail className="w-4 h-4 text-cyan-500"/> {t('contact.form.email')}</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-14 bg-nexus-surface border border-nexus-border rounded-xl px-4 text-nexus-text focus:outline-none focus:border-cyan-400 focus:bg-nexus-surface-hover transition-all font-medium" placeholder={t('contact.form.emailPlaceholder')} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-nexus-text-sec flex items-center gap-2"><Tag className="w-4 h-4 text-cyan-500"/> {t('contact.form.subject')}</label>
                <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="h-14 bg-nexus-surface border border-nexus-border rounded-xl px-4 text-nexus-text focus:outline-none focus:border-cyan-400 focus:bg-nexus-surface-hover transition-all font-medium" placeholder={t('contact.form.subjectPlaceholder')} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-nexus-text-sec flex items-center gap-2"><Tag className="w-4 h-4 text-cyan-500"/> {t('contact.form.category')}</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="h-14 bg-nexus-surface border border-nexus-border rounded-xl px-4 text-nexus-text focus:outline-none focus:border-cyan-400 transition-all appearance-none cursor-pointer font-medium">
                  <option value="Soporte Técnico" className="bg-black">{t('contact.cat.support')}</option>
                  <option value="Problemas de cuenta" className="bg-black">{t('contact.cat.account')}</option>
                  <option value="Desarrolladores" className="bg-black">{t('contact.cat.devs')}</option>
                  <option value="Reportar aplicación" className="bg-black">{t('contact.cat.report')}</option>
                  <option value="Sugerencias" className="bg-black">{t('contact.cat.ideas')}</option>
                  <option value="Otro" className="bg-black">{t('contact.cat.other')}</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-nexus-text-sec flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cyan-500"/> {t('contact.form.message')}</label>
              <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="min-h-[160px] bg-nexus-surface border border-nexus-border rounded-xl p-4 text-nexus-text focus:outline-none focus:border-cyan-400 focus:bg-nexus-surface-hover transition-all resize-none font-medium" placeholder={t('contact.form.messagePlaceholder')}></textarea>
            </div>

            <button disabled={status === 'sending'} type="submit" className="w-full h-14 mt-4 bg-cyan-600 text-nexus-text font-black uppercase tracking-wider rounded-xl hover:bg-cyan-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {status === 'sending' ? (
                <>{t('contact.form.sending')} <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /></>
              ) : (
                <>{t('contact.form.send')} <Send className="w-5 h-5" /></>
              )}
            </button>
          </form>
        )}
      </div>

      <div className="mt-12">
        <div className="text-center mb-6">
           <h3 className="font-bold text-nexus-text mb-2 text-xl">{t('contact.preferDirect')}</h3>
           <p className="text-sm text-nexus-text-sec font-medium">{t('contact.emailHelp')}</p>
        </div>
        <SupportEmailBox category="Soporte Técnico Formulario" />
      </div>
      <p className="text-center text-nexus-text-sec mt-8 text-sm font-medium tracking-wide uppercase">{t('contact.responseTime')}</p>
    </motion.div>
  );
}

export function LegalPage({ title, lastUpdated, children, onBack }: any) {
  const { t } = useAppStore();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pt-28 px-6 max-w-4xl mx-auto pb-24"
    >
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-nexus-text-sec hover:text-cyan-400 transition-colors"
       type="button" >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {t('contact.back')}
      </button>
      <div className="border-b border-nexus-border pb-8 mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-nexus-text tracking-tight mb-4">{title}</h1>
        <p className="text-sm font-medium text-cyan-400/80 uppercase tracking-widest">{t('legal.lastUpdate')} {lastUpdated}</p>
      </div>
      <div className="prose prose-invert prose-p:text-nexus-text prose-headings:text-nexus-text prose-a:text-cyan-400 prose-li:text-nexus-text prose-strong:text-nexus-text max-w-none text-base md:text-lg">
        {children}
      </div>
    </motion.div>
  );
}

export function HelpView({ onBack }: { onBack: () => void }) {
  const { t } = useAppStore();
  const faqs = [
    { q: '¿Cómo descargo una aplicación?', a: 'Busca la aplicación que deseas, entra a su página de detalles y presiona el botón "Obtener" o "Instalar".' },
    { q: '¿Es seguro usar NexusPlay?', a: 'Absolutamente. Todas las aplicaciones pasan por un estricto proceso de revisión antes de ser publicadas en nuestra tienda.' },
    { q: '¿Cómo puedo publicar mi propia app?', a: 'Puedes solicitar una cuenta de desarrollador desde el perfil. Una vez aprobada, podrás acceder al Panel de Desarrollador.' },
    { q: 'Tengo problemas al instalar', a: 'Asegúrate de permitir la instalación desde fuentes desconocidas en tu dispositivo si descargas el APK directamente.' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pt-28 px-6 max-w-4xl mx-auto pb-24"
    >
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-nexus-text-sec hover:text-cyan-400 transition-colors"
       type="button" >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {t('contact.back')}
      </button>
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-nexus-text mb-4 tracking-tight">Centro de Ayuda</h1>
        <p className="text-lg text-nexus-text-sec max-w-lg mx-auto font-light">Encuentra respuestas a las preguntas más frecuentes sobre la plataforma.</p>
      </div>

      <div className="space-y-6">
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-nexus-surface p-8 rounded-3xl border border-nexus-border shadow-xl hover:border-cyan-500/20 transition-all group">
            <h3 className="text-xl font-bold text-nexus-text mb-3 group-hover:text-cyan-400 transition-colors flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-900/30 text-cyan-500 text-sm">{idx + 1}</span>
              {faq.q}
            </h3>
            <p className="text-nexus-text-sec leading-relaxed text-lg pl-11">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 border-t border-nexus-border pt-12 flex flex-col items-center">
         <h2 className="text-2xl font-bold text-nexus-text mb-2">¿Asistencia adicional?</h2>
         <p className="text-nexus-text-sec mb-6 text-center max-w-md">Si no encontraste la respuesta a tu problema en el centro de ayuda, contáctanos directamente de forma oficial.</p>
         <SupportEmailBox category="Requerimiento de Soporte" />
      </div>
    </motion.div>
  );
}
