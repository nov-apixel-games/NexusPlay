import { 
  ShieldCheck, FileText, Cookie, Info, Mail, HelpCircle, Heart, Phone
} from 'lucide-react';
import { SupportEmailBox } from './SupportEmailBox';

export default function Footer({ onNavigate }: { onNavigate: (view: string) => void }) {
  return (
    <footer className="w-full bg-[#030712] border-t border-white/5 pt-16 pb-32 sm:pb-8 mt-20 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white tracking-tighter">Nexus<span className="text-cyan-400">Play</span></h3>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              La plataforma premium de nueva generación para descubrir y descargar aplicaciones y juegos seleccionados con calidad garantizada.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => onNavigate('privacy')} className="text-sm text-gray-400 hover:text-cyan-400 flex items-center gap-2 transition-colors">
                  <ShieldCheck className="w-4 h-4" /> Política de Privacidad
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="text-sm text-gray-400 hover:text-cyan-400 flex items-center gap-2 transition-colors">
                  <FileText className="w-4 h-4" /> Términos y Condiciones
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('cookies')} className="text-sm text-gray-400 hover:text-cyan-400 flex items-center gap-2 transition-colors">
                  <Cookie className="w-4 h-4" /> Política de Cookies
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white mb-4">Empresa</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => onNavigate('about')} className="text-sm text-gray-400 hover:text-cyan-400 flex items-center gap-2 transition-colors">
                  <Info className="w-4 h-4" /> Sobre Nosotros
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="text-sm text-gray-400 hover:text-cyan-400 flex items-center gap-2 transition-colors">
                  <Mail className="w-4 h-4" /> Contacto
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('help')} className="text-sm text-gray-400 hover:text-cyan-400 flex items-center gap-2 transition-colors">
                  <HelpCircle className="w-4 h-4" /> Centro de Ayuda
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white mb-4">Nexus AI</h4>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Impulsado por motores de inteligencia artificial.
            </p>
            <button onClick={() => onNavigate('nexus-ai')} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/20 transition-all">
              Probar Nexus AI
            </button>
          </div>
        </div>

        <div className="pt-8 mb-8">
           <h4 className="font-bold text-white text-center mb-4">¿Necesitas ayuda?</h4>
           <div className="max-w-md mx-auto">
             <SupportEmailBox category="Contacto Sitio" />
           </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © 2026 NexusPlay Inc. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            Hecho con <Heart className="w-3 h-3 text-red-500" /> para la comunidad
          </div>
        </div>
      </div>
    </footer>
  );
}
