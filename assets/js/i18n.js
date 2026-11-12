/**
 * ImgPDF Client-Side Internationalization & Language Switcher
 * Provides URL-preserving language navigation between English and Brazilian Portuguese.
 */

(function () {
  'use strict';

  var ROUTE_MAP = [
    {
      id: 'home',
      aliases: ['/', '/index.html', '/en/', '/en/index.html', '/pt-br/', '/pt-br/index.html'],
      urls: { en: '/en/', 'pt-BR': '/pt-br/' }
    },
    {
      id: 'compress-pdf',
      aliases: ['/en/compress-pdf/', '/en/compress-pdf/index.html', '/pt-br/comprimir-pdf/', '/pt-br/comprimir-pdf/index.html', '/pdf-tools/compress-pdf/', '/pdf-tools/compress-pdf/index.html'],
      urls: { en: '/en/compress-pdf/', 'pt-BR': '/pt-br/comprimir-pdf/' }
    },
    {
      id: 'about',
      aliases: ['/about/', '/about/index.html', '/en/about/', '/en/about/index.html', '/pt-br/sobre/', '/pt-br/sobre/index.html'],
      urls: { en: '/en/about/', 'pt-BR': '/pt-br/sobre/' }
    },
    {
      id: 'privacy',
      aliases: ['/privacy/', '/privacy/index.html', '/privacy-policy/', '/en/privacy-policy/', '/en/privacy-policy/index.html', '/pt-br/politica-de-privacidade/', '/pt-br/politica-de-privacidade/index.html'],
      urls: { en: '/en/privacy-policy/', 'pt-BR': '/pt-br/politica-de-privacidade/' }
    },
    {
      id: 'terms',
      aliases: ['/terms/', '/terms/index.html', '/terms-of-service/', '/en/terms/', '/en/terms/index.html', '/pt-br/termos/', '/pt-br/termos/index.html'],
      urls: { en: '/en/terms/', 'pt-BR': '/pt-br/termos/' }
    },
    {
      id: 'contact',
      aliases: ['/contact/', '/contact/index.html', '/en/contact/', '/en/contact/index.html', '/pt-br/contato/', '/pt-br/contato/index.html'],
      urls: { en: '/en/contact/', 'pt-BR': '/pt-br/contato/' }
    }
  ];

  function normalize(path) {
    if (!path) return '/';
    var p = path.split('?')[0].split('#')[0];
    if (p.charAt(0) !== '/') p = '/' + p;
    if (p.charAt(p.length - 1) !== '/' && p.indexOf('.') === -1) p = p + '/';
    return p;
  }

  function getCurrentLocale() {
    var p = normalize(window.location.pathname);
    if (p.indexOf('/pt-br/') === 0 || p === '/pt-br/') {
      return 'pt-BR';
    }
    return 'en';
  }

  function getEquivalentUrl(targetLocale) {
    var cur = normalize(window.location.pathname);

    for (var i = 0; i < ROUTE_MAP.length; i++) {
      var item = ROUTE_MAP[i];
      for (var j = 0; j < item.aliases.length; j++) {
        if (normalize(item.aliases[j]) === cur) {
          return item.urls[targetLocale] || (targetLocale === 'pt-BR' ? '/pt-br/' : '/en/');
        }
      }
    }

    // Default fallback to target language homepage if no direct equivalent route
    return targetLocale === 'pt-BR' ? '/pt-br/' : '/en/';
  }

  function initLanguageSelector() {
    var currentLocale = getCurrentLocale();
    var selectors = document.querySelectorAll('.lang-selector');

    selectors.forEach(function (container) {
      var btn = container.querySelector('.lang-btn');
      var menu = container.querySelector('.lang-menu');
      if (!btn || !menu) return;

      // Update equivalent target links dynamically based on current page
      var enOption = menu.querySelector('[data-lang="en"]');
      var ptOption = menu.querySelector('[data-lang="pt-BR"]');

      if (enOption) {
        enOption.setAttribute('href', getEquivalentUrl('en'));
        if (currentLocale === 'en') {
          enOption.classList.add('is-active');
          if (!enOption.querySelector('.check')) {
            enOption.innerHTML += '<span class="check">✓</span>';
          }
        }
      }

      if (ptOption) {
        ptOption.setAttribute('href', getEquivalentUrl('pt-BR'));
        if (currentLocale === 'pt-BR') {
          ptOption.classList.add('is-active');
          if (!ptOption.querySelector('.check')) {
            ptOption.innerHTML += '<span class="check">✓</span>';
          }
        }
      }

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
