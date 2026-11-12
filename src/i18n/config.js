/**
 * ImgPDF Internationalization Configuration
 * Scalable configuration supporting English (default), Brazilian Portuguese,
 * and architected for future languages (es, hi, de, fr, ja, it, id).
 */

export const SUPPORTED_LOCALES = {
  en: {
    code: 'en',
    locale: 'en',
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    urlPrefix: '/en',
    isDefault: true,
    published: true,
    flag: '🇺🇸'
  },
  'pt-BR': {
    code: 'pt-BR',
    locale: 'pt-BR',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    dir: 'ltr',
    urlPrefix: '/pt-br',
    isDefault: false,
    published: true,
    flag: '🇧🇷'
  },
  // Future planned language extensions
  es: {
    code: 'es',
    locale: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    dir: 'ltr',
    urlPrefix: '/es',
    isDefault: false,
    published: false,
    flag: '🇪🇸'
  },
  hi: {
    code: 'hi',
    locale: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    dir: 'ltr',
    urlPrefix: '/hi',
    isDefault: false,
    published: false,
    flag: '🇮🇳'
  },
  de: {
    code: 'de',
    locale: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    dir: 'ltr',
    urlPrefix: '/de',
    isDefault: false,
    published: false,
    flag: '🇩🇪'
  },
  fr: {
    code: 'fr',
    locale: 'fr',
    name: 'French',
    nativeName: 'Français',
    dir: 'ltr',
    urlPrefix: '/fr',
    isDefault: false,
    published: false,
    flag: '🇫🇷'
  },
  ja: {
    code: 'ja',
    locale: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    dir: 'ltr',
    urlPrefix: '/ja',
    isDefault: false,
    published: false,
    flag: '🇯🇵'
  },
  it: {
    code: 'it',
    locale: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    dir: 'ltr',
    urlPrefix: '/it',
    isDefault: false,
    published: false,
    flag: '🇮🇹'
  },
  id: {
    code: 'id',
    locale: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    dir: 'ltr',
    urlPrefix: '/id',
    isDefault: false,
    published: false,
    flag: '🇮🇩'
  }
};

export const DEFAULT_LOCALE = 'en';
export const BASE_URL = 'https://img-pdf.github.io';

export function getActiveLocales() {
  return Object.values(SUPPORTED_LOCALES).filter(loc => loc.published);
}
