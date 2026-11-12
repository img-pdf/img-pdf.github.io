/**
 * ImgPDF Route Mapping & Hreflang Engine
 * Defines canonical route equivalents across English and Brazilian Portuguese.
 */

import { BASE_URL, DEFAULT_LOCALE } from './config.js';

export const ROUTE_DEFINITIONS = {
  home: {
    id: 'home',
    urls: {
      en: '/en/',
      'pt-BR': '/pt-br/'
    },
    xDefault: '/'
  },
  'compress-pdf': {
    id: 'compress-pdf',
    urls: {
      en: '/en/compress-pdf/',
      'pt-BR': '/pt-br/comprimir-pdf/'
    },
    xDefault: '/en/compress-pdf/'
  },
  about: {
    id: 'about',
    urls: {
      en: '/en/about/',
      'pt-BR': '/pt-br/sobre/'
    },
    xDefault: '/about/'
  },
  privacy: {
    id: 'privacy',
    urls: {
      en: '/en/privacy-policy/',
      'pt-BR': '/pt-br/politica-de-privacidade/'
    },
    xDefault: '/privacy/'
  },
  terms: {
    id: 'terms',
    urls: {
      en: '/en/terms/',
      'pt-BR': '/pt-br/termos/'
    },
    xDefault: '/terms/'
  },
  contact: {
    id: 'contact',
    urls: {
      en: '/en/contact/',
      'pt-BR': '/pt-br/contato/'
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

  // Alias support for legacy or alternative paths
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

  // English alternate
  if (route.urls.en) {
    alternates.push({
      hreflang: 'en',
      href: `${BASE_URL}${route.urls.en}`
    });
  }

  // Brazilian Portuguese alternate
  if (route.urls['pt-BR']) {
    alternates.push({
      hreflang: 'pt-BR',
      href: `${BASE_URL}${route.urls['pt-BR']}`
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
  if (targetLocale === 'pt-BR') {
    return '/pt-br/';
  }
  return '/en/';
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
