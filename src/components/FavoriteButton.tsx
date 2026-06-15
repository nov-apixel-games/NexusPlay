import React from 'react';
import { Heart } from 'lucide-react';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { motion, AnimatePresence } from 'motion/react';

interface FavoriteButtonProps {
  appId: string;
  className?: string;
}

export function FavoriteButton({ appId, className = '' }: FavoriteButtonProps) {
  const { favoriteIds, toggleFavorite } = useFavoritesStore();
  const isFavorite = favoriteIds.has(appId);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsAnimating(true);
    const success = await toggleFavorite(appId);
    setTimeout(() => setIsAnimating(false), 300);

    if (success) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: isFavorite ? 'Eliminado de favoritos' : 'Añadido a favoritos',
          type: 'success'
        }
      }));
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={`relative justify-center rounded-full p-2 bg-nexus-card/80 backdrop-blur-md border border-nexus-border/50 hover:bg-nexus-card-hover transition-colors overflow-hidden group z-30 ${className}`}
      title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
     type="button" >
      <AnimatePresence>
         {isAnimating && isFavorite && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-red-500/30 rounded-full"
            />
         )}
      </AnimatePresence>
      <motion.div
         animate={{ scale: isAnimating ? 1.3 : 1 }}
         transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Heart 
          className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
            isFavorite 
              ? 'fill-red-500 text-red-500 shadow-sm drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
              : 'text-white/80 group-hover:text-red-400 drop-shadow-md'
          }`} 
        />
      </motion.div>
    </button>
  );
}
