import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface FavoritesStore {
  favoriteIds: Set<string>;
  initialized: boolean;
  currentUserId: string | null;
  fetchFavorites: (userId: string) => Promise<void>;
  toggleFavorite: (appId: string) => Promise<boolean>;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favoriteIds: new Set<string>(),
  initialized: false,
  currentUserId: null,

  fetchFavorites: async (userId: string) => {
    if (!userId) return;
    set({ currentUserId: userId });
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('app_id')
        .eq('user_id', userId);
        
      if (error) {
        console.error('[Favorites] Supabase error fetching favorites:', error.message);
        return;
      }
      if (data) {
        set({ favoriteIds: new Set(data.map(d => d.app_id)), initialized: true });
      }
    } catch (e) {
      console.error('Error fetching favorites:', e);
    }
  },

  toggleFavorite: async (appId: string) => {
    const { currentUserId, favoriteIds } = get();
    
    if (!currentUserId) {
      window.dispatchEvent(new CustomEvent('require-login'));
      return false;
    }
    
    const isFavorite = favoriteIds.has(appId);
    
    // Optimistic update
    const newFavorites = new Set(favoriteIds);
    if (isFavorite) {
      newFavorites.delete(appId);
    } else {
      newFavorites.add(appId);
    }
    set({ favoriteIds: newFavorites });

    try {
      if (isFavorite) {
        // Remove favorite
        await supabase
          .from('user_favorites')
          .delete()
          .match({ user_id: currentUserId, app_id: appId });
      } else {
        // Add favorite
        await supabase
          .from('user_favorites')
          .insert({ user_id: currentUserId, app_id: appId });
      }
      return true; // Success
    } catch (e) {
      console.error('Error toggling favorite:', e);
      // Revert on failure
      set({ favoriteIds });
      return false; // Error
    }
  },

  clearFavorites: () => set({ favoriteIds: new Set(), initialized: false, currentUserId: null })
}));
