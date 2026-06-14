import { describe, it, expect } from 'vitest';
import { translations } from '../i18n/translations';
import type { LanguageCode } from '../i18n/translations';

const SUPPORTED_LANGUAGES: LanguageCode[] = ['es', 'en', 'pt', 'fr', 'de', 'it'];

describe('i18n/translations', () => {
  it('exports translations for all supported languages', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(translations).toHaveProperty(lang);
      expect(typeof translations[lang]).toBe('object');
    }
  });

  it('Spanish (es) is the primary language with the most keys', () => {
    const esKeys = Object.keys(translations.es);
    expect(esKeys.length).toBeGreaterThan(0);

    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang === 'es') continue;
      const langKeys = Object.keys(translations[lang]);
      expect(esKeys.length).toBeGreaterThanOrEqual(langKeys.length);
    }
  });

  it('all translation values are strings', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const entries = Object.entries(translations[lang]);
      for (const [key, value] of entries) {
        expect(typeof value).toBe('string');
      }
    }
  });

  it('no translation value is empty string', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const entries = Object.entries(translations[lang]);
      for (const [key, value] of entries) {
        expect((value as string).trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('all non-es languages have keys that exist in es', () => {
    const esKeys = new Set(Object.keys(translations.es));
    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang === 'es') continue;
      const langKeys = Object.keys(translations[lang]);
      for (const key of langKeys) {
        expect(esKeys.has(key)).toBe(true);
      }
    }
  });

  it('English (en) has a reasonable number of translations', () => {
    const enKeys = Object.keys(translations.en);
    const esKeys = Object.keys(translations.es);
    // en should have at least 50% of es keys
    expect(enKeys.length).toBeGreaterThan(esKeys.length * 0.5);
  });

  it('translation keys follow a consistent naming pattern', () => {
    const esKeys = Object.keys(translations.es);
    for (const key of esKeys) {
      // Keys use dots as separators and may include accented characters (Spanish)
      expect(key).toMatch(/^[\p{L}\p{N}._]+$/u);
    }
  });

  it('admin-related keys start with "admin."', () => {
    const esKeys = Object.keys(translations.es);
    const adminKeys = esKeys.filter(k => k.startsWith('admin.'));
    expect(adminKeys.length).toBeGreaterThan(0);
  });
});
