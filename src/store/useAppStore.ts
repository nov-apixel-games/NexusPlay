import { create } from 'zustand';
import { translations, LanguageCode, TranslationKey } from '../i18n/translations';

export type ThemeType = 'dark' | 'light' | 'amoled' | 'auto';

interface AppStore {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey | string) => string;
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const applyTheme = (t: string) => {
  let activeTheme = t;
  if (t === 'auto') {
    activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', activeTheme);
;
;
  }
};

export const useAppStore = create<AppStore>((set, get) => ({
  language: (localStorage.getItem('nexus_language') as LanguageCode) || 'es',
  setLanguage: (lang) => {
    localStorage.setItem('nexus_language', lang);
    set((state) => ({ 
      language: lang,
      t: (key) => {
        const val = (translations[lang] as any)[key] || (translations['es'] as any)[key];
        if (!val && typeof window !== 'undefined') console.warn(`[i18n] Missing key: ${key}`);
        return val || undefined as any;
      }
    }));
  },
  t: (key) => {
    const lang = (localStorage.getItem('nexus_language') as LanguageCode) || 'es';
    const val = (translations[lang] as any)[key] || (translations['es'] as any)[key];
    if (!val && typeof window !== 'undefined') console.warn(`[i18n] Missing key: ${key}`);
    return val || undefined as any;
  },
  theme: (localStorage.getItem('nexus_theme') as ThemeType) || 'dark',
  setTheme: (theme: ThemeType) => {
    localStorage.setItem('nexus_theme', theme);
    applyTheme(theme);
    set({ theme });
  }
}));

// Apply initial theme
if (typeof window !== 'undefined') {
  const initialTheme = (localStorage.getItem('nexus_theme') as ThemeType) || 'dark';
  applyTheme(initialTheme);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = useAppStore.getState().theme;
    if (currentTheme === 'auto') {
      applyTheme('auto');
    }
  });
}

