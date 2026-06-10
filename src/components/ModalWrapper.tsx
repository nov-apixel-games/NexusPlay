import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface ModalWrapperProps {
  children: React.ReactNode;
  onClose: () => void;
  fullScreen?: boolean;
}

export function ModalWrapper({ children, onClose, fullScreen }: ModalWrapperProps) {
  useBodyScrollLock(true);

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center sm:p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-hidden pointer-events-auto overscroll-none"
      onClick={onClose}
    >
       <motion.div 
         initial={{ opacity: 0, y: "100%", scale: fullScreen ? 1 : 0.95 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         exit={{ opacity: 0, y: "100%", scale: fullScreen ? 1 : 0.95 }}
         transition={{ type: "spring", damping: 25, stiffness: 200 }}
         onClick={(e) => e.stopPropagation()}
         className={`relative w-full ${fullScreen ? 'h-full sm:rounded-[2rem]' : 'max-h-[95vh] sm:h-auto rounded-t-[2rem] sm:rounded-[2rem] max-w-7xl'} bg-nexus-bg border border-nexus-border shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden m-0`}
       >
          <div className="absolute top-4 right-4 z-[100]">
             <button 
               onClick={onClose} 
               className="p-3 sm:p-2 bg-nexus-card/90 sm:bg-nexus-card/50 hover:bg-red-500 rounded-full hover:text-white transition-colors shadow-lg border border-nexus-border backdrop-blur-xl"
             >
               <X className="w-6 h-6 sm:w-5 sm:h-5" />
             </button>
          </div>
          
          <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar overscroll-contain pb-6">
            {children}
          </div>
       </motion.div>
    </div>
  );
}
