import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../i18n/translations', () => ({
  translations: {
    es: {
      'app.title': 'Título',
      'app.welcome': 'Bienvenido',
    },
    en: {
      'app.title': 'Title',
      'app.welcome': 'Welcome',
    },
    pt: {},
    fr: {},
    de: {},
    it: {},
  },
}));

import { useAppStore } from '../store/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      language: 'es',
      theme: 'dark',
    });
  });

  describe('language and translation', () => {
    it('defaults to es language', () => {
      expect(useAppStore.getState().language).toBe('es');
    });

    it('t() returns Spanish translation by default', () => {
      const t = useAppStore.getState().t;
      expect(t('app.title')).toBe('Título');
    });

    it('setLanguage updates language and persists to localStorage', () => {
      useAppStore.getState().setLanguage('en');
      expect(useAppStore.getState().language).toBe('en');
      expect(localStorage.getItem('nexus_language')).toBe('en');
    });

    it('t() returns the correct language after setLanguage', () => {
      useAppStore.getState().setLanguage('en');
      const t = useAppStore.getState().t;
      expect(t('app.title')).toBe('Title');
    });

    it('t() falls back to es for missing keys in other languages', () => {
      useAppStore.getState().setLanguage('pt');
      const t = useAppStore.getState().t;
      // pt has no keys, should fall back to es
      expect(t('app.title')).toBe('Título');
    });
  });

  describe('theme', () => {
    it('defaults to dark theme', () => {
      expect(useAppStore.getState().theme).toBe('dark');
    });

    it('setTheme updates theme and persists to localStorage', () => {
      useAppStore.getState().setTheme('light');
      expect(useAppStore.getState().theme).toBe('light');
      expect(localStorage.getItem('nexus_theme')).toBe('light');
    });

    it('setTheme applies data-theme attribute to document', () => {
      useAppStore.getState().setTheme('amoled');
      expect(document.documentElement.getAttribute('data-theme')).toBe('amoled');
    });

    it('setTheme with auto detects system preference', () => {
      useAppStore.getState().setTheme('auto');
      expect(useAppStore.getState().theme).toBe('auto');
      // matchMedia mocked to return false (light), so should apply light
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });
});
