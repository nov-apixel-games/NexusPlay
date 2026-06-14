import React from 'react';
import { useAppStore } from '../store/useAppStore';

export function DiscordCommunityBox() {
  const { t } = useAppStore();
  const discordLink = 'https://discord.gg/4bupZb5qq';

  return (
    <div className="relative group w-full h-full max-w-md mx-auto mb-6 lg:my-6">
      {/* Neon Glow bg */}
      <div className="absolute inset-0 bg-violet-600/20 blur-[25px] rounded-[2rem] opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative p-5 glass-panel rounded-3xl border border-nexus-border hover:border-nexus-border/40 transition-all flex flex-col sm:flex-row items-center gap-4 bg-nexus-card/80 backdrop-blur-xl shadow-2xl h-full">
        <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-nexus-bg to-nexus-bg flex items-center justify-center shadow-[0_0_20px_rgba(88,101,242,0.4)]">
           <svg className="w-8 h-8 text-nexus-text mt-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
           </svg>
        </div>
        
        <div className="flex-1 min-w-0 text-center sm:text-left">
           <p className="text-xs font-black text-[#5865F2] uppercase tracking-widest mb-1">{t('contact.discordCommunity')}</p>
           <h4 className="text-[13px] sm:text-[14px] text-nexus-text-sec truncate mb-1">{t('contact.discordDesc')}</h4>
           <h4 className="text-[14px] font-bold text-nexus-text truncate font-mono">discord.gg/4bupZb5qq</h4>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0 justify-center">
           <a 
             href={discordLink}
             target="_blank"
             rel="noreferrer"
             className="px-6 h-10 w-full sm:w-auto rounded-xl bg-nexus-card/80 hover:bg-nexus-card/80 flex items-center justify-center border border-nexus-border/30 text-[#5865F2] hover:text-[#7f8afe] font-bold text-sm transition-all active:scale-95 shadow-[0_0_15px_rgba(88,101,242,0.2)]"
           >
             {t('contact.join')}
           </a>
        </div>
      </div>
    </div>
  );
}
