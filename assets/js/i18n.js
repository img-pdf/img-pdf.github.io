/**
 * ImgPDF Client-Side Internationalization & Language Switcher
 * Provides URL-preserving language navigation between English and Brazilian Portuguese.
 */

(function () {
  'use strict';

  var ROUTE_MAP = [
    {
      id: 'home',
      aliases: ['/', '/index.html', '/en/', '/en/index.html', '/es/', '/es/index.html', '/ja/', '/ja/index.html', '/fr/', '/fr/index.html', '/de/', '/de/index.html', '/pt-br/', '/pt-br/index.html', '/ko/', '/ko/index.html', '/it/', '/it/index.html'],
      urls: {
        en: '/en/',
        es: '/es/',
        ja: '/ja/',
        fr: '/fr/',
        de: '/de/',
        'pt-BR': '/pt-br/',
        ko: '/ko/',
        it: '/it/'
      }
    },
    {
      id: 'compress-pdf',
      aliases: [
        '/en/compress-pdf/', '/en/compress-pdf/index.html',
        '/es/comprimir-pdf/', '/es/comprimir-pdf/index.html',
        '/ja/compress-pdf/', '/ja/compress-pdf/index.html',
        '/fr/compresser-pdf/', '/fr/compresser-pdf/index.html',
        '/de/pdf-komprimieren/', '/de/pdf-komprimieren/index.html',
        '/pt-br/comprimir-pdf/', '/pt-br/comprimir-pdf/index.html',
        '/ko/compress-pdf/', '/ko/compress-pdf/index.html',
        '/it/comprimi-pdf/', '/it/comprimi-pdf/index.html',
        '/pdf-tools/compress-pdf/', '/pdf-tools/compress-pdf/index.html'
      ],
      urls: {
        en: '/en/compress-pdf/',
        es: '/es/comprimir-pdf/',
        ja: '/ja/compress-pdf/',
        fr: '/fr/compresser-pdf/',
        de: '/de/pdf-komprimieren/',
        'pt-BR': '/pt-br/comprimir-pdf/',
        ko: '/ko/compress-pdf/',
        it: '/it/comprimi-pdf/'
      }
    },
    {
      id: 'about',
      aliases: [
        '/about/', '/about/index.html',
        '/en/about/', '/en/about/index.html',
        '/es/sobre/', '/es/sobre/index.html',
        '/ja/about/', '/ja/about/index.html',
        '/fr/a-propos/', '/fr/a-propos/index.html',
        '/de/ueber-uns/', '/de/ueber-uns/index.html',
        '/pt-br/sobre/', '/pt-br/sobre/index.html',
        '/ko/about/', '/ko/about/index.html',
        '/it/chi-siamo/', '/it/chi-siamo/index.html'
      ],
      urls: {
        en: '/en/about/',
        es: '/es/sobre/',
        ja: '/ja/about/',
        fr: '/fr/a-propos/',
        de: '/de/ueber-uns/',
        'pt-BR': '/pt-br/sobre/',
        ko: '/ko/about/',
        it: '/it/chi-siamo/'
      }
    },
    {
      id: 'privacy',
      aliases: [
        '/privacy/', '/privacy/index.html', '/privacy-policy/',
        '/en/privacy-policy/', '/en/privacy-policy/index.html',
        '/es/politica-de-privacidad/', '/es/politica-de-privacidad/index.html',
        '/ja/privacy-policy/', '/ja/privacy-policy/index.html',
        '/fr/politique-de-confidentialite/', '/fr/politique-de-confidentialite/index.html',
        '/de/datenschutz/', '/de/datenschutz/index.html',
        '/pt-br/politica-de-privacidade/', '/pt-br/politica-de-privacidade/index.html',
        '/ko/privacy-policy/', '/ko/privacy-policy/index.html',
        '/it/informativa-privacy/', '/it/informativa-privacy/index.html'
      ],
      urls: {
        en: '/en/privacy-policy/',
        es: '/es/politica-de-privacidad/',
        ja: '/ja/privacy-policy/',
        fr: '/fr/politique-de-confidentialite/',
        de: '/de/datenschutz/',
        'pt-BR': '/pt-br/politica-de-privacidade/',
        ko: '/ko/privacy-policy/',
        it: '/it/informativa-privacy/'
      }
    },
    {
      id: 'terms',
      aliases: [
        '/terms/', '/terms/index.html', '/terms-of-service/',
        '/en/terms/', '/en/terms/index.html',
        '/es/terminos/', '/es/terminos/index.html',
        '/ja/terms/', '/ja/terms/index.html',
        '/fr/conditions/', '/fr/conditions/index.html',
        '/de/agb/', '/de/agb/index.html',
        '/pt-br/termos/', '/pt-br/termos/index.html',
        '/ko/terms/', '/ko/terms/index.html',
        '/it/termini/', '/it/termini/index.html'
      ],
      urls: {
        en: '/en/terms/',
        es: '/es/terminos/',
        ja: '/ja/terms/',
        fr: '/fr/conditions/',
        de: '/de/agb/',
        'pt-BR': '/pt-br/termos/',
        ko: '/ko/terms/',
        it: '/it/termini/'
      }
    },
    {
      id: 'contact',
      aliases: [
        '/contact/', '/contact/index.html',
        '/en/contact/', '/en/contact/index.html',
        '/es/contacto/', '/es/contacto/index.html',
        '/ja/contact/', '/ja/contact/index.html',
        '/fr/contact/', '/fr/contact/index.html',
        '/de/kontakt/', '/de/kontakt/index.html',
        '/pt-br/contato/', '/pt-br/contato/index.html',
        '/ko/contact/', '/ko/contact/index.html',
        '/it/contatti/', '/it/contatti/index.html'
      ],
      urls: {
        en: '/en/contact/',
        es: '/es/contacto/',
        ja: '/ja/contact/',
        fr: '/fr/contact/',
        de: '/de/kontakt/',
        'pt-BR': '/pt-br/contato/',
        ko: '/ko/contact/',
        it: '/it/contatti/'
      }
    }
  ];

  var NATIVE_NAMES = {
    en: 'English',
    es: 'Español',
    ja: '日本語',
    fr: 'Français',
    de: 'Deutsch',
    'pt-BR': 'Português',
    ko: '한국어',
    it: 'Italiano'
  };

  var FALLBACK_PREFIX = {
    en: '/en/',
    es: '/es/',
    ja: '/ja/',
    fr: '/fr/',
    de: '/de/',
    'pt-BR': '/pt-br/',
    ko: '/ko/',
    it: '/it/'
  };

  function normalize(path) {
    if (!path) return '/';
    var p = path.split('?')[0].split('#')[0];
    if (p.charAt(0) !== '/') p = '/' + p;
    if (p.charAt(p.length - 1) !== '/' && p.indexOf('.') === -1) p = p + '/';
    return p;
  }

  function getCurrentLocale() {
    var p = normalize(window.location.pathname);
    if (p.indexOf('/pt-br/') === 0 || p === '/pt-br/') return 'pt-BR';
    if (p.indexOf('/es/') === 0 || p === '/es/') return 'es';
    if (p.indexOf('/ja/') === 0 || p === '/ja/') return 'ja';
    if (p.indexOf('/fr/') === 0 || p === '/fr/') return 'fr';
    if (p.indexOf('/de/') === 0 || p === '/de/') return 'de';
    if (p.indexOf('/ko/') === 0 || p === '/ko/') return 'ko';
    if (p.indexOf('/it/') === 0 || p === '/it/') return 'it';
    if (p.indexOf('/en/') === 0 || p === '/en/') return 'en';
    return 'en';
  }

  function getEquivalentUrl(targetLocale) {
    var cur = normalize(window.location.pathname);

    for (var i = 0; i < ROUTE_MAP.length; i++) {
      var item = ROUTE_MAP[i];
      for (var j = 0; j < item.aliases.length; j++) {
        if (normalize(item.aliases[j]) === cur) {
          return item.urls[targetLocale] || FALLBACK_PREFIX[targetLocale] || '/en/';
        }
      }
    }

    return FALLBACK_PREFIX[targetLocale] || '/en/';
  }

  function initLanguageSelector() {
    var currentLocale = getCurrentLocale();
    var selectors = document.querySelectorAll('.lang-selector');

    selectors.forEach(function (container) {
      var btn = container.querySelector('.lang-btn');
      var menu = container.querySelector('.lang-menu');
      if (!btn || !menu) return;

      // Update button label if native name is known
      var labelSpan = btn.querySelector('span');
      if (labelSpan && NATIVE_NAMES[currentLocale]) {
        labelSpan.textContent = NATIVE_NAMES[currentLocale];
      }

      // Update equivalent target links dynamically based on current page
      var options = menu.querySelectorAll('.lang-option[data-lang]');
      options.forEach(function (option) {
        var lang = option.getAttribute('data-lang');
        if (lang) {
          option.setAttribute('href', getEquivalentUrl(lang));
          if (lang === currentLocale) {
            option.classList.add('is-active');
            if (!option.querySelector('.check')) {
              option.innerHTML += '<span class="check">✓</span>';
            }
          } else {
            option.classList.remove('is-active');
            var chk = option.querySelector('.check');
            if (chk) chk.remove();
          }
        }
      });

      // Toggle dropdown open/close
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var isOpen = menu.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });

      // Handle keyboard navigation
      container.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) {
          menu.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
          btn.focus();
        }
      });
    });

    // Close on outside clicks
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.lang-selector')) {
        document.querySelectorAll('.lang-menu.is-open').forEach(function (m) {
          m.classList.remove('is-open');
          var p = m.closest('.lang-selector');
          if (p) {
            var b = p.querySelector('.lang-btn');
            if (b) b.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });
  }

  // Save locale on option click
  document.addEventListener('click', function (e) {
    var option = e.target.closest('.lang-option');
    if (option) {
      var chosenLang = option.getAttribute('data-lang');
      if (chosenLang) {
        try {
          localStorage.setItem('imgpdf_locale', chosenLang);
        } catch (err) {}
      }
    }
  });

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSelector);
  } else {
    initLanguageSelector();
  }

  // Public API
  window.ImgPdfI18n = {
    getLocale: getCurrentLocale,
    getEquivalentUrl: getEquivalentUrl
  };
})();
