/**
 * ImgPDF Route Mapping & Hreflang Engine
 * Defines canonical route equivalents across:
 * English (en), Español (es), 日本語 (ja), Français (fr),
 * Deutsch (de), Português (pt-BR), 한국어 (ko), Italiano (it).
 */

import { BASE_URL } from './config.js';

export const ROUTE_DEFINITIONS = {
  home: {
    id: 'home',
    urls: {
      en: '/en/',
      es: '/es/',
      ja: '/ja/',
      fr: '/fr/',
      de: '/de/',
      'pt-BR': '/pt-br/',
      ko: '/ko/',
      it: '/it/'
    },
    xDefault: '/'
  },
  'compress-pdf': {
    id: 'compress-pdf',
    urls: {
      en: '/en/compress-pdf/',
      es: '/es/comprimir-pdf/',
      ja: '/ja/compress-pdf/',
      fr: '/fr/compresser-pdf/',
      de: '/de/pdf-komprimieren/',
      'pt-BR': '/pt-br/comprimir-pdf/',
      ko: '/ko/compress-pdf/',
      it: '/it/comprimi-pdf/'
    },
    xDefault: '/en/compress-pdf/'
  },
  about: {
    id: 'about',
    urls: {
      en: '/en/about/',
      es: '/es/sobre/',
      ja: '/ja/about/',
      fr: '/fr/a-propos/',
      de: '/de/ueber-uns/',
      'pt-BR': '/pt-br/sobre/',
      ko: '/ko/about/',
      it: '/it/chi-siamo/'
    },
    xDefault: '/about/'
  },
  privacy: {
    id: 'privacy',
    urls: {
      en: '/en/privacy-policy/',
      es: '/es/politica-de-privacidad/',
      ja: '/ja/privacy-policy/',
      fr: '/fr/politique-de-confidentialite/',
      de: '/de/datenschutz/',
      'pt-BR': '/pt-br/politica-de-privacidade/',
      ko: '/ko/privacy-policy/',
      it: '/it/informativa-privacy/'
    },
    xDefault: '/privacy/'
  },
  terms: {
    id: 'terms',
    urls: {
      en: '/en/terms/',
      es: '/es/terminos/',
      ja: '/ja/terms/',
      fr: '/fr/conditions/',
      de: '/de/agb/',
      'pt-BR': '/pt-br/termos/',
      ko: '/ko/terms/',
      it: '/it/termini/'
    },
    xDefault: '/terms/'
  },
  contact: {
    id: 'contact',
    urls: {
      en: '/en/contact/',
      es: '/es/contacto/',
      ja: '/ja/contact/',
      fr: '/fr/contact/',
      de: '/de/kontakt/',
      'pt-BR': '/pt-br/contato/',
      ko: '/ko/contact/',
      it: '/it/contatti/'
    },
    xDefault: '/contact/'
  }
};

/**
 * Clean path string to ensure trailing slash uniformity
 */
export function normalizePath(pathname) {
  if (!pathname) return '/';
  let p = pathname.split('?')[0].split('#')[0];
  if (!p.startsWith('/')) p = '/' + p;
  if (!p.endsWith('/') && !p.includes('.')) p = p + '/';
  return p;
}

/**
 * Match a URL pathname to its logical route ID
 */
export function getRouteByPath(pathname) {
  const norm = normalizePath(pathname);

  // Exact root matches
  if (norm === '/' || norm === '/index.html') return ROUTE_DEFINITIONS.home;

  for (const route of Object.values(ROUTE_DEFINITIONS)) {
    if (route.xDefault && normalizePath(route.xDefault) === norm) {
      return route;
    }
    for (const [locale, routePath] of Object.entries(route.urls)) {
      if (normalizePath(routePath) === norm) {
        return route;
      }
    }
  }

  // Legacy aliases
  if (norm === '/about/') return ROUTE_DEFINITIONS.about;
  if (norm === '/privacy/' || norm === '/privacy-policy/') return ROUTE_DEFINITIONS.privacy;
  if (norm === '/terms/' || norm === '/terms-of-service/') return ROUTE_DEFINITIONS.terms;
  if (norm === '/contact/') return ROUTE_DEFINITIONS.contact;
  if (norm === '/pdf-tools/compress-pdf/') return ROUTE_DEFINITIONS['compress-pdf'];

  return null;
}

/**
 * Return absolute hreflang alternate URLs for a given route ID
 */
export function getAlternateUrls(routeId) {
  const route = typeof routeId === 'string' ? ROUTE_DEFINITIONS[routeId] : routeId;
  if (!route) return [];

  const alternates = [];

  for (const [locale, pathStr] of Object.entries(route.urls)) {
    alternates.push({
      hreflang: locale,
      href: `${BASE_URL}${pathStr}`
    });
  }

  // x-default fallback
  const xDefaultTarget = route.xDefault
    ? `${BASE_URL}${route.xDefault.startsWith('/') ? route.xDefault : '/' + route.xDefault}`
    : `${BASE_URL}${route.urls.en || '/'}`;

  alternates.push({
    hreflang: 'x-default',
    href: xDefaultTarget
  });

  return alternates;
}

/**
 * Determine equivalent URL when switching language from a current pathname
 */
export function getEquivalentUrl(currentPath, targetLocale) {
  const route = getRouteByPath(currentPath);
  if (route && route.urls[targetLocale]) {
    return route.urls[targetLocale];
  }

  // Fallback to the target language homepage
  const targetPrefixMap = {
    en: '/en/',
    es: '/es/',
    ja: '/ja/',
    fr: '/fr/',
    de: '/de/',
    'pt-BR': '/pt-br/',
    ko: '/ko/',
    it: '/it/'
  };
  return targetPrefixMap[targetLocale] || '/en/';
}

/**
 * Returns all active published routes for sitemap and build generators
 */
export function getAllPublishedRoutes() {
  const list = [];
  for (const route of Object.values(ROUTE_DEFINITIONS)) {
    for (const [locale, pathStr] of Object.entries(route.urls)) {
      list.push({
        routeId: route.id,
        locale,
        path: pathStr,
        url: `${BASE_URL}${pathStr}`,
        alternates: getAlternateUrls(route.id)
      });
    }
  }
  return list;
}
