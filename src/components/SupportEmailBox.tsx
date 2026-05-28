import React, { useState } from 'react';
import { Mail, Copy, CheckCircle, ExternalLink } from 'lucide-react';

export function SupportEmailBox({ category = 'Soporte NexusPlay' }: { category?: string }) {
  const [copied, setCopied] = useState(false);
  const email = 'support.nexusplay@gmail.com';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(category)}`;

  return (
    <div className="relative group w-full max-w-md mx-auto my-6">
      {/* Neon Glow bg */}
      <div className="absolute inset-0 bg-cyan-500/10 blur-[25px] rounded-[2rem] opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative p-5 glass-panel rounded-3xl border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row items-center gap-4 bg-[#0a0c16]/80 backdrop-blur-xl shadow-2xl">
        <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)]">
           <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM4 6l8 5 8-5H4zm16 12V8l-8 5-8-5v10h16z" />
           </svg>
        </div>
        
        <div className="flex-1 min-w-0 text-center sm:text-left">
           <p className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-1">Correo Oficial</p>
           <h4 className="text-[15px] sm:text-[17px] font-bold text-white truncate font-mono">{email}</h4>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
           <button 
             onClick={handleCopy} 
             className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/5 text-gray-400 hover:text-white transition-all active:scale-95"
             title="Copiar correo"
           >
             {copied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
           </button>
           
           <a 
             href={mailtoLink}
             target="_blank"
             rel="noreferrer"
             className="w-10 h-10 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 flex items-center justify-center border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition-all active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
             title="Abrir app de correo"
           >
             <ExternalLink className="w-5 h-5" />
           </a>
        </div>
      </div>
    </div>
  );
}
