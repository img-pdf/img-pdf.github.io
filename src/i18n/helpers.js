/**
 * ImgPDF Internationalization Helpers
 */

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, BASE_URL } from './config.js';
import { ROUTE_DEFINITIONS, getRouteByPath, getAlternateUrls, normalizePath } from './routing.js';
import enTranslations from './translations/en.js';
import ptBrTranslations from './translations/pt-br.js';

const TRANSLATION_MAP = {
  en: enTranslations,
  'pt-BR': ptBrTranslations
};

/**
 * Get active translation dictionary
 */
export function getTranslations(locale) {
  return TRANSLATION_MAP[locale] || TRANSLATION_MAP[DEFAULT_LOCALE];
}

/**
 * Detect locale from URL path
 */
export function getLocaleFromPath(pathname) {
  const norm = normalizePath(pathname);
  if (norm.startsWith('/pt-br/') || norm === '/pt-br') {
    return 'pt-BR';
  }
  if (norm.startsWith('/en/') || norm === '/en') {
    return 'en';
  }
  return DEFAULT_LOCALE;
}

/**
 * Translation function with dot-notation and variable interpolation
 * e.g. t('compressPdf.statusDone', 'pt-BR')
 */
export function t(key, locale = DEFAULT_LOCALE, params = {}) {
  const dict = getTranslations(locale);
  const fallbackDict = getTranslations(DEFAULT_LOCALE);

  function resolve(obj, pathStr) {
    if (!obj || typeof obj !== 'object') return undefined;
    const parts = pathStr.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur[p] === undefined) return undefined;
      cur = cur[p];
    }
    return cur;
  }

  let text = resolve(dict, key);
  if (text === undefined) {
    text = resolve(fallbackDict, key);
  }

  // If still missing, return a safe human-readable fallback (never bare key to visitor)
  if (text === undefined) {
    const lastPart = key.split('.').pop();
    text = lastPart.replace(/([A-Z])/g, ' $1').trim();
  }

  if (typeof text === 'string' && params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
  }

  return text;
}

/**
 * Generate HTML <link rel="alternate" hreflang="..." href="..."> tags
 */
export function renderHreflangTags(routeId) {
  const alternates = getAlternateUrls(routeId);
  return alternates
    .map(alt => `  <link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}">`)
    .join('\n');
}

/**
 * Generate canonical tag for a given path
 */
export function renderCanonicalTag(pathname) {
  const clean = normalizePath(pathname);
  const url = `${BASE_URL}${clean === '/' ? '/' : clean}`;
  return `  <link rel="canonical" href="${url}">`;
}
