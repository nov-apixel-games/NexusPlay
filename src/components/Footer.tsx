import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { 
  ShieldCheck, FileText, Cookie, Info, Mail, HelpCircle, Heart
} from 'lucide-react';
import { SupportEmailBox } from './SupportEmailBox';
import { DiscordCommunityBox } from './DiscordCommunityBox';

const Footer = React.memo(function Footer({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { t } = useAppStore();
  return (
    <footer className="w-full bg-nexus-card border-t border-nexus-border pt-16 pb-32 sm:pb-8 mt-20 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <div className="space-y-4">
            <h3 className="text-xl font-black text-nexus-text tracking-tighter">Nexus<span className="text-cyan-400">Play</span></h3>
            <p className="text-sm text-nexus-text-sec leading-relaxed max-w-xs">
              {t("footer.heroText")}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-nexus-text mb-4">{t("footer.legal")}</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => onNavigate('privacy')} className="text-sm text-nexus-text-sec hover:text-cyan-400 flex items-center gap-2 transition-colors">
                  <ShieldCheck className="w-4 h-4" /> {t("footer.privacy")}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="text-sm text-nexus-text-sec hover:text-cyan-400 flex items-center gap-2 transition-colors">
                  <FileText className="w-4 h-4" /> {t("footer.terms")}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('cookies')} className="text-sm text-nexus-text-sec hover:text-cyan-400 flex items-center gap-2 transition-colors">
                  <Cookie className="w-4 h-4" /> {t("footer.cookies")}
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-nexus-text mb-4">{t("footer.company")}</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => onNavigate('about')} className="text-sm text-nexus-text-sec hover:text-cyan-400 flex items-center gap-2 transition-colors">
                  <Info className="w-4 h-4" /> {t("footer.about")}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="text-sm text-nexus-text-sec hover:text-cyan-400 flex items-center gap-2 transition-colors">
                  <Mail className="w-4 h-4" /> {t("footer.contact")}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('help')} className="text-sm text-nexus-text-sec hover:text-cyan-400 flex items-center gap-2 transition-colors">
                  <HelpCircle className="w-4 h-4" /> {t("footer.helpCenter")}
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-nexus-text mb-4">{t('nav.ai')}</h4>
            <p className="text-sm text-nexus-text-sec leading-relaxed mb-4">
              {t("footer.aiPowered")}
            </p>
            <button onClick={() => onNavigate('nexus-ai')} className="px-4 py-2 bg-nexus-card border border-nexus-border rounded-xl text-sm font-semibold hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/20 transition-all">
              {t("footer.tryAI")}
            </button>
          </div>
        </div>

        <div className="pt-8 mb-8">
           <h4 className="font-bold text-nexus-text text-center mb-4">{t("footer.needHelp")}</h4>
           <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-stretch justify-center gap-4 px-4 w-full">
             <div className="w-full flex-1">
               <SupportEmailBox category="Contacto Sitio" />
             </div>
             <div className="w-full flex-1">
               <DiscordCommunityBox />
             </div>
           </div>
        </div>

        <div className="pt-8 border-t border-nexus-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-nexus-text-sec">
            © 2026 NexusPlay Inc. {t("footer.allRights")}
          </p>
          <div className="flex items-center gap-2 text-xs text-nexus-text-sec">
            {t("footer.madeWith")} <Heart className="w-3 h-3 text-red-500" /> {t("footer.forCommunity")}
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
