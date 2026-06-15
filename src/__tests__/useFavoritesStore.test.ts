import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockFrom = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
  isSupabaseConfigured: true,
}));

import { useFavoritesStore } from '../store/useFavoritesStore';

describe('useFavoritesStore', () => {
  beforeEach(() => {
    useFavoritesStore.setState({
      favoriteIds: new Set<string>(),
      initialized: false,
      currentUserId: null,
    });
    mockFrom.mockReset();
  });

  describe('clearFavorites', () => {
    it('resets all state', () => {
      useFavoritesStore.setState({
        favoriteIds: new Set(['a', 'b']),
        initialized: true,
        currentUserId: 'user-1',
      });

      useFavoritesStore.getState().clearFavorites();
      const state = useFavoritesStore.getState();
      expect(state.favoriteIds.size).toBe(0);
      expect(state.initialized).toBe(false);
      expect(state.currentUserId).toBeNull();
    });
  });

  describe('fetchFavorites', () => {
    it('does nothing with empty userId', async () => {
      await useFavoritesStore.getState().fetchFavorites('');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('fetches and sets favorites from supabase', async () => {
      mockFrom.mockReturnValue({
        select: () => ({
          eq: vi.fn().mockResolvedValue({
            data: [{ app_id: 'app-1' }, { app_id: 'app-2' }],
            error: null,
          }),
        }),
      });

      await useFavoritesStore.getState().fetchFavorites('user-1');
      const state = useFavoritesStore.getState();
      expect(state.favoriteIds.has('app-1')).toBe(true);
      expect(state.favoriteIds.has('app-2')).toBe(true);
      expect(state.initialized).toBe(true);
      expect(state.currentUserId).toBe('user-1');
    });

    it('handles supabase error gracefully', async () => {
      mockFrom.mockReturnValue({
        select: () => ({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Network error' },
          }),
        }),
      });

      await useFavoritesStore.getState().fetchFavorites('user-1');
      expect(useFavoritesStore.getState().initialized).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('dispatches require-login event when no user is logged in', async () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      const result = await useFavoritesStore.getState().toggleFavorite('app-1');
      expect(result).toBe(false);
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'require-login' })
      );
      dispatchSpy.mockRestore();
    });

    it('adds a favorite optimistically then calls supabase insert', async () => {
      useFavoritesStore.setState({
        currentUserId: 'user-1',
        favoriteIds: new Set<string>(),
      });

      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      const result = await useFavoritesStore.getState().toggleFavorite('app-1');
      expect(result).toBe(true);
      expect(useFavoritesStore.getState().favoriteIds.has('app-1')).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('user_favorites');
    });

    it('removes a favorite optimistically then calls supabase delete', async () => {
      useFavoritesStore.setState({
        currentUserId: 'user-1',
        favoriteIds: new Set(['app-1']),
      });

      mockFrom.mockReturnValue({
        delete: () => ({
          match: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await useFavoritesStore.getState().toggleFavorite('app-1');
      expect(result).toBe(true);
      expect(useFavoritesStore.getState().favoriteIds.has('app-1')).toBe(false);
    });

    it('reverts optimistic update on supabase failure', async () => {
      useFavoritesStore.setState({
        currentUserId: 'user-1',
        favoriteIds: new Set<string>(),
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFrom.mockReturnValue({
        insert: vi.fn().mockRejectedValue(new Error('DB error')),
      });

      const result = await useFavoritesStore.getState().toggleFavorite('app-1');
      expect(result).toBe(false);
      // Reverted
      expect(useFavoritesStore.getState().favoriteIds.has('app-1')).toBe(false);
      consoleSpy.mockRestore();
    });
  });
});
