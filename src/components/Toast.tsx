import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto glass-panel border p-4 rounded-2xl flex items-center gap-3 shadow-lg ${
              t.type === 'success' ? 'border-green-500/30' :
              t.type === 'error' ? 'border-red-500/30' :
              'border-cyan-500/30'
            }`}
          >
            {t.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
            {t.type === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
            
            <span className="font-medium text-sm text-nexus-text pr-4">{t.message}</span>
            
            <button 
              onClick={() => removeToast(t.id)} 
              className="ml-auto hover:bg-nexus-card-hover p-1.5 rounded-full text-nexus-text-sec hover:text-nexus-text transition-colors"
            >
               <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
