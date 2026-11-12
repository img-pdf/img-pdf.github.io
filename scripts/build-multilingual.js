/**
 * scripts/build-multilingual.js
 * Generates all canonical English (/en/...) and Brazilian Portuguese (/pt-br/...) pages
 * directly from the centralized translation dictionaries (src/i18n/).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BASE_URL, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../src/i18n/config.js';
import { ROUTE_DEFINITIONS, getAlternateUrls } from '../src/i18n/routing.js';
import en from '../src/i18n/translations/en.js';
import ptBr from '../src/i18n/translations/pt-br.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DICTS = {
  en,
  'pt-BR': ptBr
};

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Render Header with Language Selector
 */
function renderHeader(locale, activeNav = 'home') {
  const t = DICTS[locale];
  const isEn = locale === 'en';

  const homeLink = ROUTE_DEFINITIONS.home.urls[locale];
  const compressPdfLink = ROUTE_DEFINITIONS['compress-pdf'].urls[locale];
  const aboutLink = ROUTE_DEFINITIONS.about.urls[locale];
  const privacyLink = ROUTE_DEFINITIONS.privacy.urls[locale];
  const termsLink = ROUTE_DEFINITIONS.terms.urls[locale];
  const contactLink = ROUTE_DEFINITIONS.contact.urls[locale];

  const currentLangLabel = isEn ? 'English' : 'Português (Brasil)';

  return `
<header class="site-header">
  <div class="container site-header__bar">
    <a href="${homeLink}" class="brand"><span class="brand__mark">IMG</span> ImgPDF</a>
    <nav class="main-nav" aria-label="Primary">
      <a href="${homeLink}" class="${activeNav === 'home' ? 'is-active' : ''}">${t.nav.home}</a>
      <a href="${compressPdfLink}" class="${activeNav === 'compress-pdf' ? 'is-active' : ''}">${t.nav.compressPdf}</a>
      <a href="/image-tools/">${t.nav.imageTools}</a>
      <a href="/pdf-tools/">${t.nav.pdfTools}</a>
      <a href="/guides/">${t.nav.guides}</a>
      <a href="/blog/">${t.nav.blog}</a>
      <a href="${aboutLink}" class="${activeNav === 'about' ? 'is-active' : ''}">${t.nav.about}</a>
      <a href="${contactLink}" class="${activeNav === 'contact' ? 'is-active' : ''}">${t.nav.contact}</a>
    </nav>
    <div style="display:flex; align-items:center; gap:8px;">
      <!-- Language Selector Dropdown -->
      <div class="lang-selector">
        <button class="lang-btn" type="button" aria-expanded="false" aria-haspopup="true" aria-label="${t.langSelector.label}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span>${currentLangLabel}</span>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>
        <div class="lang-menu" role="menu">
          <a href="/en/" class="lang-option ${isEn ? 'is-active' : ''}" data-lang="en" role="menuitem">
            <span>English</span>
            ${isEn ? '<span class="check">✓</span>' : ''}
          </a>
          <a href="/pt-br/" class="lang-option ${!isEn ? 'is-active' : ''}" data-lang="pt-BR" role="menuitem">
            <span>Português (Brasil)</span>
            ${!isEn ? '<span class="check">✓</span>' : ''}
          </a>
        </div>
      </div>

      <!-- Theme Toggle -->
      <button class="theme-toggle" type="button" aria-label="${t.theme.switchToDark}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>${t.theme.toggle}</span>
      </button>

      <!-- Mobile Hamburger -->
      <button class="nav-toggle" id="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-panel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18" stroke-linecap="round"/></svg>
      </button>
    </div>
  </div>

  <!-- Mobile Drawer -->
  <nav class="mobile-panel" id="mobile-panel" aria-label="Mobile">
    <a href="${homeLink}">${t.nav.home}</a>
    <a href="${compressPdfLink}">${t.nav.compressPdf}</a>
    <a href="/image-tools/">${t.nav.imageTools}</a>
    <a href="/pdf-tools/">${t.nav.pdfTools}</a>
    <a href="/guides/">${t.nav.guides}</a>
    <a href="/blog/">${t.nav.blog}</a>
    <a href="${aboutLink}">${t.nav.about}</a>
    <a href="${contactLink}">${t.nav.contact}</a>
    <a href="${privacyLink}">${t.nav.privacy}</a>
    <a href="${termsLink}">${t.nav.terms}</a>
  </nav>
</header>
`;
}

/**
 * Render Cal.com Dark Footer
 */
function renderFooter(locale) {
  const t = DICTS[locale];

  const homeLink = ROUTE_DEFINITIONS.home.urls[locale];
  const compressPdfLink = ROUTE_DEFINITIONS['compress-pdf'].urls[locale];
  const aboutLink = ROUTE_DEFINITIONS.about.urls[locale];
  const privacyLink = ROUTE_DEFINITIONS.privacy.urls[locale];
  const termsLink = ROUTE_DEFINITIONS.terms.urls[locale];
  const contactLink = ROUTE_DEFINITIONS.contact.urls[locale];

  return `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="${homeLink}" class="brand" style="margin-bottom:10px;"><span class="brand__mark">IMG</span> ImgPDF</a>
        <p>${t.site.footerSummary}</p>
      </div>
      <div>
        <h4>${t.nav.pdfTools}</h4>
        <ul>
          <li><a href="${compressPdfLink}">${t.nav.compressPdf}</a></li>
          <li><a href="/pdf-tools/pdf-to-image/">PDF to Image</a></li>
          <li><a href="/pdf-tools/jpg-to-pdf/">JPG to PDF</a></li>
          <li><a href="/pdf-tools/merge-pdf/">Merge PDF</a></li>
          <li><a href="/pdf-tools/split-pdf/">Split PDF</a></li>
        </ul>
      </div>
      <div>
        <h4>${t.nav.imageTools}</h4>
        <ul>
          <li><a href="/image-tools/image-compressor/">Image Compressor</a></li>
          <li><a href="/image-tools/image-resizer/">Image Resizer</a></li>
          <li><a href="/image-tools/image-cropper/">Image Cropper</a></li>
          <li><a href="/image-tools/image-converter/">Image Converter</a></li>
        </ul>
      </div>
      <div>
        <h4>${t.nav.guides} &amp; ${t.nav.blog}</h4>
        <ul>
          <li><a href="/blog/">ImgPDF Blog</a></li>
          <li><a href="/blog/pdf-guides/">PDF Guides</a></li>
          <li><a href="/blog/image-guides/">Image Guides</a></li>
          <li><a href="/guides/">All Guides</a></li>
        </ul>
      </div>
      <div>
        <h4>Trust &amp; Legal</h4>
        <ul>
          <li><a href="${aboutLink}">${t.nav.about}</a></li>
          <li><a href="${contactLink}">${t.nav.contact}</a></li>
          <li><a href="${privacyLink}">${t.nav.privacy}</a></li>
          <li><a href="${termsLink}">${t.nav.terms}</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>${t.site.copyright}</span>
      <span>${t.site.techBadge}</span>
    </div>
  </div>
</footer>
`;
}

/**
 * Render Head section with canonical and hreflang links
 */
function renderHead({ locale, routeId, title, description, canonicalUrl, schemaJson }) {
  const alternates = getAlternateUrls(routeId);
  const hreflangHtml = alternates
    .map(a => `<link rel="alternate" hreflang="${a.hreflang}" href="${a.href}">`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<script>
(function(){try{var f=window.fetch;Object.defineProperty(window,"fetch",{get:function(){return f},set:function(v){f=v},configurable:true,enumerable:true});if(typeof Window!=="undefined"&&Window.prototype){Object.defineProperty(Window.prototype,"fetch",{get:function(){return f},set:function(v){f=v},configurable:true,enumerable:true})}}catch(e){}})();
</script>
<!-- Google Tag Manager -->
<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-MH56QT6Z"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
</script>
<!-- End Google Tag Manager -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonicalUrl}">
<meta name="robots" content="index, follow">

<!-- International Hreflang Annotations -->
${hreflangHtml}

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:site_name" content="ImgPDF">
<meta property="og:image" content="https://img-pdf.github.io/assets/img/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">

<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/style.css">
<link rel="stylesheet" href="/assets/css/tool.css">

${schemaJson ? `<script type="application/ld+json">\n${JSON.stringify(schemaJson, null, 2)}\n</script>` : ''}
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MH56QT6Z"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
`;
}

/**
 * 1. Build Homepage for a locale
 */
function buildHomePage(locale) {
  const t = DICTS[locale];
  const routeId = 'home';
  const urlPath = ROUTE_DEFINITIONS.home.urls[locale];
  const canonicalUrl = `${BASE_URL}${urlPath}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ImgPDF',
    url: canonicalUrl,
    description: t.home.metaDesc,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };

  const html = `${renderHead({
    locale,
    routeId,
    title: t.home.metaTitle,
    description: t.home.metaDesc,
    canonicalUrl,
    schemaJson: schema
  })}
${renderHeader(locale, 'home')}

<main>
  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <div class="hero__status">
        <span>${t.home.statusBadge}</span>
      </div>
      <h1>${t.home.h1}</h1>
      <p class="hero__lede">${t.home.lede}</p>

      <div class="hero-cta-group">
        <a href="#popular-tools" class="btn btn--primary">${t.home.exploreBtn}</a>
        <a href="${locale === 'en' ? '/en/compress-pdf/' : '/pt-br/comprimir-pdf/'}" class="btn btn--secondary">${t.nav.compressPdf}</a>
      </div>

      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3" stroke-linecap="round"/></svg>
        <input type="text" id="tool-search" placeholder="${t.common.searchPlaceholder}" autocomplete="off" aria-label="${t.common.searchPlaceholder}">
        <div class="search-results" id="tool-search-results" role="listbox"></div>
      </div>

      <!-- Cal.com Product UI Mockup Card -->
      <div class="hero-mockup">
        <div class="hero-mockup__header">
          <div class="hero-mockup__dots">
            <span class="hero-mockup__dot"></span>
            <span class="hero-mockup__dot"></span>
            <span class="hero-mockup__dot"></span>
          </div>
          <span class="hero-mockup__title">${t.home.mockup.title}</span>
          <span class="tag tag--good" style="font-size:11px;">${t.home.mockup.badge}</span>
        </div>
        <div class="hero-mockup__body">
          <a href="${locale === 'en' ? '/en/compress-pdf/' : '/pt-br/comprimir-pdf/'}" class="hero-mockup__dropzone">
            <span class="hero-mockup__drop-icon">📦</span>
            <span class="hero-mockup__drop-text">${t.home.mockup.dropText}</span>
            <span class="hero-mockup__drop-sub">${t.home.mockup.dropSub}</span>
          </a>
          <div class="hero-mockup__controls">
            <div class="hero-mockup__row">
              <span class="hero-mockup__label">${t.home.mockup.qualityLabel}</span>
              <span class="hero-mockup__val">${t.home.mockup.qualityVal}</span>
            </div>
            <div class="hero-mockup__slider-wrap">
              <div class="hero-mockup__slider-fill"></div>
              <div class="hero-mockup__slider-thumb"></div>
            </div>
            <div class="hero-mockup__row">
              <span class="hero-mockup__label">${t.home.mockup.formatLabel}</span>
              <div class="hero-mockup__pills">
                <span class="hero-mockup__pill hero-mockup__pill--active">PDF</span>
                <span class="hero-mockup__pill">JPG</span>
                <span class="hero-mockup__pill">PNG</span>
              </div>
            </div>
            <div class="hero-mockup__result">
              <span>${t.home.mockup.savedText}</span>
              <span class="hero-mockup__stat">✓ ${t.common.ready}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="hero__badges">
        <span class="tag tag--good">${t.home.badges.clientSide}</span>
        <span class="tag tag--good">${t.home.badges.noUploads}</span>
        <span class="tag tag--good">${t.home.badges.noAccount}</span>
        <span class="tag tag--good">${t.home.badges.responsive}</span>
      </div>
    </div>
  </section>

  <!-- How It Works Section -->
  <section class="section section--alt">
    <div class="container">
      <div class="section__head">
        <div>
          <span class="section__eyebrow">${t.home.workflow.eyebrow}</span>
          <h2>${t.home.workflow.title}</h2>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
        <div style="background: var(--canvas); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 28px 24px;">
          <div style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; color: var(--muted); margin-bottom: 12px; letter-spacing: 0.05em;">01</div>
          <h3 style="font-size: 1.15rem; margin-bottom: 8px;">${t.home.workflow.step1Title}</h3>
          <p style="color: var(--muted); font-size: 0.92rem; margin: 0; line-height: 1.55;">${t.home.workflow.step1Desc}</p>
        </div>
        <div style="background: var(--canvas); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 28px 24px;">
          <div style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; color: var(--muted); margin-bottom: 12px; letter-spacing: 0.05em;">02</div>
          <h3 style="font-size: 1.15rem; margin-bottom: 8px;">${t.home.workflow.step2Title}</h3>
          <p style="color: var(--muted); font-size: 0.92rem; margin: 0; line-height: 1.55;">${t.home.workflow.step2Desc}</p>
        </div>
        <div style="background: var(--canvas); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 28px 24px;">
          <div style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; color: var(--muted); margin-bottom: 12px; letter-spacing: 0.05em;">03</div>
          <h3 style="font-size: 1.15rem; margin-bottom: 8px;">${t.home.workflow.step3Title}</h3>
          <p style="color: var(--muted); font-size: 0.92rem; margin: 0; line-height: 1.55;">${t.home.workflow.step3Desc}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Popular Featured Tools -->
  <section class="section" id="popular-tools">
    <div class="container">
      <div class="section__head">
        <div>
          <span class="section__eyebrow">${t.home.popular.eyebrow}</span>
          <h2>${t.home.popular.title}</h2>
        </div>
        <span style="font-family:var(--font-mono); font-size:0.82rem; color:var(--muted);">${t.home.popular.note}</span>
      </div>
      <div class="tool-grid">
        <a class="tool-card" href="${locale === 'en' ? '/en/compress-pdf/' : '/pt-br/comprimir-pdf/'}">
          <div class="tool-card__icon">📦</div>
          <div>
            <div class="tool-card__name">${t.home.popular.compressPdfName}</div>
            <div class="tool-card__desc">${t.home.popular.compressPdfDesc}</div>
          </div>
        </a>
        <a class="tool-card" href="/image-tools/image-compressor/">
          <div class="tool-card__icon">🗜️</div>
          <div>
            <div class="tool-card__name">${t.home.popular.imageCompressorName}</div>
            <div class="tool-card__desc">${t.home.popular.imageCompressorDesc}</div>
          </div>
        </a>
        <a class="tool-card" href="/pdf-tools/pdf-to-image/">
          <div class="tool-card__icon">🖼️</div>
          <div>
            <div class="tool-card__name">${t.home.popular.pdfToImageName}</div>
            <div class="tool-card__desc">${t.home.popular.pdfToImageDesc}</div>
          </div>
        </a>
        <a class="tool-card" href="/pdf-tools/merge-pdf/">
          <div class="tool-card__icon">📑</div>
          <div>
            <div class="tool-card__name">${t.home.popular.mergePdfName}</div>
            <div class="tool-card__desc">${t.home.popular.mergePdfDesc}</div>
          </div>
        </a>
        <a class="tool-card" href="/pdf-tools/split-pdf/">
          <div class="tool-card__icon">✂️</div>
          <div>
            <div class="tool-card__name">${t.home.popular.splitPdfName}</div>
            <div class="tool-card__desc">${t.home.popular.splitPdfDesc}</div>
          </div>
        </a>
        <a class="tool-card" href="/pdf-tools/jpg-to-pdf/">
          <div class="tool-card__icon">📄</div>
          <div>
            <div class="tool-card__name">${t.home.popular.jpgToPdfName}</div>
            <div class="tool-card__desc">${t.home.popular.jpgToPdfDesc}</div>
          </div>
        </a>
        <a class="tool-card" href="/image-tools/image-converter/">
          <div class="tool-card__icon">🔁</div>
          <div>
            <div class="tool-card__name">${t.home.popular.imageConverterName}</div>
            <div class="tool-card__desc">${t.home.popular.imageConverterDesc}</div>
          </div>
        </a>
        <a class="tool-card" href="/image-tools/image-resizer/">
          <div class="tool-card__icon">↔️</div>
          <div>
            <div class="tool-card__name">${t.home.popular.imageResizerName}</div>
            <div class="tool-card__desc">${t.home.popular.imageResizerDesc}</div>
          </div>
        </a>
      </div>
    </div>
  </section>

  <!-- Trust & Architecture Breakdown -->
  <section class="section section--alt">
    <div class="container">
      <div class="section__head">
        <div>
          <span class="section__eyebrow">${t.home.why.eyebrow}</span>
          <h2>${t.home.why.title}</h2>
        </div>
      </div>
      <div class="why-grid">
        <div class="why-grid__item">
          <div class="why-grid__icon">🔒</div>
          <h3>${t.home.why.item1Title}</h3>
          <p>${t.home.why.item1Desc}</p>
        </div>
        <div class="why-grid__item">
          <div class="why-grid__icon">⚡</div>
          <h3>${t.home.why.item2Title}</h3>
          <p>${t.home.why.item2Desc}</p>
        </div>
        <div class="why-grid__item">
          <div class="why-grid__icon">🏷️</div>
          <h3>${t.home.why.item3Title}</h3>
          <p>${t.home.why.item3Desc}</p>
        </div>
        <div class="why-grid__item">
          <div class="why-grid__icon">📱</div>
          <h3>${t.home.why.item4Title}</h3>
          <p>${t.home.why.item4Desc}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQs -->
  <section class="section">
    <div class="container prose" style="max-width:760px;">
      <h2>${t.home.faq.title}</h2>
      <div class="faq">
        <details class="faq-item">
          <summary>${t.home.faq.q1}</summary>
          <p>${t.home.faq.a1}</p>
        </details>
        <details class="faq-item">
          <summary>${t.home.faq.q2}</summary>
          <p>${t.home.faq.a2}</p>
        </details>
        <details class="faq-item">
          <summary>${t.home.faq.q3}</summary>
          <p>${t.home.faq.a3}</p>
        </details>
        <details class="faq-item">
          <summary>${t.home.faq.q4}</summary>
          <p>${t.home.faq.a4}</p>
        </details>
      </div>
    </div>
  </section>
</main>

${renderFooter(locale)}

<script src="/assets/js/common.js"></script>
<script src="/assets/js/i18n.js"></script>
<script src="/assets/js/tools-data.js"></script>
<script src="/assets/js/search.js"></script>
</body>
</html>
`;

  const targetDir = path.join(ROOT_DIR, locale === 'en' ? 'en' : 'pt-br');
  ensureDirSync(targetDir);
  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
  console.log(`✔ Generated ${locale === 'en' ? '/en/' : '/pt-br/'} homepage.`);
}

/**
 * 2. Build Compress PDF Tool for a locale
 */
function buildCompressPdfPage(locale) {
  const t = DICTS[locale];
  const routeId = 'compress-pdf';
  const urlPath = ROUTE_DEFINITIONS['compress-pdf'].urls[locale];
  const canonicalUrl = `${BASE_URL}${urlPath}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: t.compressPdf.h1,
    url: canonicalUrl,
    description: t.compressPdf.metaDesc,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };

  const html = `${renderHead({
    locale,
    routeId,
    title: t.compressPdf.metaTitle,
    description: t.compressPdf.metaDesc,
    canonicalUrl,
    schemaJson: schema
  })}
${renderHeader(locale, 'compress-pdf')}

<main>
  <div class="container tool-header">
    <p class="breadcrumb">
      <a href="${locale === 'en' ? '/en/' : '/pt-br/'}">${t.nav.home}</a>
      <span class="breadcrumb__sep">/</span>
      <a href="/pdf-tools/">${t.nav.pdfTools}</a>
      <span class="breadcrumb__sep">/</span>
      ${t.compressPdf.breadcrumb}
    </p>
    <h1>${t.compressPdf.h1}</h1>
    <p>${t.compressPdf.lede}</p>
  </div>

  <div class="container">
    <div class="tool-panel">
      <!-- File dropzone -->
      <div class="dropzone" id="dropzone" tabindex="0" role="button" aria-label="${t.compressPdf.dropzoneTitle}">
        <div class="dropzone__icon">📦</div>
        <div class="dropzone__title">${t.compressPdf.dropzoneTitle}</div>
        <p class="dropzone__hint">${t.compressPdf.dropzoneHint}</p>
        <button class="btn btn--primary" type="button" onclick="document.getElementById('file-input').click()">${t.compressPdf.dropzoneBtn}</button>
        <p class="dropzone__hint" style="margin-top:16px;">${t.compressPdf.dropzoneSub}</p>
        <input type="file" id="file-input" accept="application/pdf,.pdf" aria-label="${t.compressPdf.dropzoneBtn}">
      </div>

      <!-- File Details Chip -->
      <div id="file-details" class="file-chip" style="display:none; margin-bottom: 20px;">
        <div style="font-size: 1.8rem;">📄</div>
        <div>
          <div class="file-chip__name" id="file-name-display">document.pdf</div>
          <div class="file-chip__meta" id="file-meta-display">0 pages · 0 KB</div>
        </div>
        <button class="file-chip__remove" id="remove-file-btn" type="button" aria-label="${t.common.removeFile}">&times;</button>
      </div>

      <div class="controls">
        <div class="control-row">
          <div class="control-row__label">
            <span>${t.compressPdf.levelLabel}: <strong id="quality-value">72%</strong></span>
            <span>Presets:</span>
          </div>
          <div class="preset-group">
            <button type="button" class="preset-btn" data-preset="extreme">${t.compressPdf.presets.extreme}</button>
            <button type="button" class="preset-btn is-active" data-preset="recommended">${t.compressPdf.presets.recommended}</button>
            <button type="button" class="preset-btn" data-preset="highQuality">${t.compressPdf.presets.highQuality}</button>
            <button type="button" class="preset-btn" data-preset="custom">${t.compressPdf.presets.custom}</button>
          </div>
          <input type="range" id="quality-slider" min="10" max="95" value="72" aria-label="${t.compressPdf.qualitySliderLabel}">
        </div>
      </div>

      <div class="tool-actions">
        <button class="btn btn--primary" id="compress-btn" disabled>${t.compressPdf.compressActionBtn}</button>
        <button class="btn btn--ghost" id="reset-btn">${t.compressPdf.resetBtn}</button>
      </div>

      <div class="progress-container" id="progress-wrap" style="display:none;">
        <div class="progress-bar-fill" id="progress-bar"></div>
        <div id="progress-text" style="font-family:var(--font-mono); font-size:0.78rem; color:var(--muted); margin-top:6px;"></div>
      </div>

      <p class="status-line" id="status-line"></p>

      <!-- Result Panel -->
      <div class="result-panel" id="result-panel">
        <div class="result-stats">
          <div class="result-stat">
            <div class="result-stat__label">${t.compressPdf.statOriginal}</div>
            <div class="result-stat__value" id="result-original">—</div>
          </div>
          <div class="result-stat">
            <div class="result-stat__label">${t.compressPdf.statCompressed}</div>
            <div class="result-stat__value" id="result-compressed">—</div>
          </div>
          <div class="result-stat result-stat--good">
            <div class="result-stat__label">${t.compressPdf.statSaved}</div>
            <div class="result-stat__value" id="result-saved">—</div>
          </div>
        </div>

        <div style="text-align:center; margin-top:20px;">
          <button class="btn btn--primary" id="download-btn" style="height:44px; padding:0 24px;">${t.compressPdf.downloadBtn}</button>
        </div>
      </div>
    </div>

    <!-- Privacy Trust Notice -->
    <div class="privacy-note">
      <span class="icon">🔒</span>
      <div>
        <strong>${t.common.clientSideNotice}</strong>
        ${t.compressPdf.featuresTitle}
      </div>
    </div>

    <!-- How It Works & Steps -->
    <div class="prose" style="margin-top:40px;">
      <h2>${t.compressPdf.howItWorksTitle}</h2>
      <ol>
        <li><strong>01.</strong> ${t.compressPdf.step1}</li>
        <li><strong>02.</strong> ${t.compressPdf.step2}</li>
        <li><strong>03.</strong> ${t.compressPdf.step3}</li>
      </ol>

      <h2>${t.compressPdf.featuresTitle}</h2>
      <div class="why-grid" style="margin-top:20px;">
        <div class="why-grid__item">
          <h3>${t.compressPdf.feat1Title}</h3>
          <p>${t.compressPdf.feat1Desc}</p>
        </div>
        <div class="why-grid__item">
          <h3>${t.compressPdf.feat2Title}</h3>
          <p>${t.compressPdf.feat2Desc}</p>
        </div>
        <div class="why-grid__item">
          <h3>${t.compressPdf.feat3Title}</h3>
          <p>${t.compressPdf.feat3Desc}</p>
        </div>
      </div>

      <h2>${t.compressPdf.faqTitle}</h2>
      <div class="faq">
        <details class="faq-item">
          <summary>${t.compressPdf.q1}</summary>
          <p>${t.compressPdf.a1}</p>
        </details>
        <details class="faq-item">
          <summary>${t.compressPdf.q2}</summary>
          <p>${t.compressPdf.a2}</p>
        </details>
      </div>
    </div>
  </div>
</main>

${renderFooter(locale)}

<script src="/assets/js/common.js"></script>
<script src="/assets/js/i18n.js"></script>
<script src="/assets/js/vendor/pdf.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
<script src="/assets/js/tools/compress-pdf.js"></script>
</body>
</html>
`;

  const targetDir = path.join(ROOT_DIR, locale === 'en' ? 'en/compress-pdf' : 'pt-br/comprimir-pdf');
  ensureDirSync(targetDir);
  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
  console.log(`✔ Generated ${locale === 'en' ? '/en/compress-pdf/' : '/pt-br/comprimir-pdf/'} tool page.`);
}

/**
 * 3. Build About Page for a locale
 */
function buildAboutPage(locale) {
  const t = DICTS[locale];
  const routeId = 'about';
  const urlPath = ROUTE_DEFINITIONS.about.urls[locale];
  const canonicalUrl = `${BASE_URL}${urlPath}`;

  const html = `${renderHead({
    locale,
    routeId,
    title: t.about.metaTitle,
    description: t.about.metaDesc,
    canonicalUrl
  })}
${renderHeader(locale, 'about')}

<main class="container prose" style="max-width:800px; padding:48px 24px;">
  <h1>${t.about.h1}</h1>
  <p class="hero__lede" style="margin-left:0; text-align:left;">${t.about.lede}</p>

  <h2>${t.about.missionTitle}</h2>
  <p>${t.about.missionDesc}</p>

  <h2>${t.about.localTitle}</h2>
  <p>${t.about.localDesc}</p>

  <h2>${t.about.valuesTitle}</h2>
  <ul>
    <li>${t.about.v1}</li>
    <li>${t.about.v2}</li>
    <li>${t.about.v3}</li>
  </ul>
</main>

${renderFooter(locale)}
<script src="/assets/js/common.js"></script>
<script src="/assets/js/i18n.js"></script>
</body>
</html>
`;

  const targetDir = path.join(ROOT_DIR, locale === 'en' ? 'en/about' : 'pt-br/sobre');
  ensureDirSync(targetDir);
  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
  console.log(`✔ Generated ${locale === 'en' ? '/en/about/' : '/pt-br/sobre/'} page.`);
}

/**
 * 4. Build Privacy Policy Page for a locale
 */
function buildPrivacyPage(locale) {
  const t = DICTS[locale];
  const routeId = 'privacy';
  const urlPath = ROUTE_DEFINITIONS.privacy.urls[locale];
  const canonicalUrl = `${BASE_URL}${urlPath}`;

  const html = `${renderHead({
    locale,
    routeId,
    title: t.privacy.metaTitle,
    description: t.privacy.metaDesc,
    canonicalUrl
  })}
${renderHeader(locale, 'privacy')}

<main class="container prose" style="max-width:800px; padding:48px 24px;">
  <h1>${t.privacy.h1}</h1>
  <p class="hero__lede" style="margin-left:0; text-align:left;">${t.privacy.lede}</p>
  <p style="font-family:var(--font-mono); font-size:0.8rem; color:var(--muted);">${t.privacy.effectiveDate}</p>

  <h2>${t.privacy.section1Title}</h2>
  <p>${t.privacy.section1Text}</p>

  <h2>${t.privacy.section2Title}</h2>
  <p>${t.privacy.section2Text}</p>

  <h2>${t.privacy.section3Title}</h2>
  <p>${t.privacy.section3Text}</p>

  <h2>${t.privacy.section4Title}</h2>
  <p>${t.privacy.section4Text}</p>
</main>

${renderFooter(locale)}
<script src="/assets/js/common.js"></script>
<script src="/assets/js/i18n.js"></script>
</body>
</html>
`;

  const targetDir = path.join(ROOT_DIR, locale === 'en' ? 'en/privacy-policy' : 'pt-br/politica-de-privacidade');
  ensureDirSync(targetDir);
  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
  console.log(`✔ Generated ${locale === 'en' ? '/en/privacy-policy/' : '/pt-br/politica-de-privacidade/'} page.`);
}

/**
 * 5. Build Terms of Service Page for a locale
 */
function buildTermsPage(locale) {
  const t = DICTS[locale];
  const routeId = 'terms';
  const urlPath = ROUTE_DEFINITIONS.terms.urls[locale];
  const canonicalUrl = `${BASE_URL}${urlPath}`;

  const html = `${renderHead({
    locale,
    routeId,
    title: t.terms.metaTitle,
    description: t.terms.metaDesc,
    canonicalUrl
  })}
${renderHeader(locale, 'terms')}

<main class="container prose" style="max-width:800px; padding:48px 24px;">
  <h1>${t.terms.h1}</h1>
  <p class="hero__lede" style="margin-left:0; text-align:left;">${t.terms.lede}</p>
  <p style="font-family:var(--font-mono); font-size:0.8rem; color:var(--muted);">${t.terms.effectiveDate}</p>

  <h2>${t.terms.section1Title}</h2>
  <p>${t.terms.section1Text}</p>

  <h2>${t.terms.section2Title}</h2>
  <p>${t.terms.section2Text}</p>

  <h2>${t.terms.section3Title}</h2>
  <p>${t.terms.section3Text}</p>

  <h2>${t.terms.section4Title}</h2>
  <p>${t.terms.section4Text}</p>

  <h2>${t.terms.section5Title}</h2>
  <p>${t.terms.section5Text}</p>
</main>

${renderFooter(locale)}
<script src="/assets/js/common.js"></script>
<script src="/assets/js/i18n.js"></script>
</body>
</html>
`;

  const targetDir = path.join(ROOT_DIR, locale === 'en' ? 'en/terms' : 'pt-br/termos');
  ensureDirSync(targetDir);
  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
  console.log(`✔ Generated ${locale === 'en' ? '/en/terms/' : '/pt-br/termos/'} page.`);
}

/**
 * 6. Build Contact Page for a locale
 */
function buildContactPage(locale) {
  const t = DICTS[locale];
  const routeId = 'contact';
  const urlPath = ROUTE_DEFINITIONS.contact.urls[locale];
  const canonicalUrl = `${BASE_URL}${urlPath}`;

  const html = `${renderHead({
    locale,
    routeId,
    title: t.contact.metaTitle,
    description: t.contact.metaDesc,
    canonicalUrl
  })}
${renderHeader(locale, 'contact')}

<main class="container prose" style="max-width:800px; padding:48px 24px;">
  <h1>${t.contact.h1}</h1>
  <p class="hero__lede" style="margin-left:0; text-align:left;">${t.contact.lede}</p>

  <h2>${t.contact.channelsTitle}</h2>
  <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); padding:24px; margin:20px 0;">
    <h3 style="margin-top:0;">${t.contact.emailLabel}</h3>
    <p style="font-family:var(--font-mono); font-size:1.05rem;"><a href="mailto:${t.contact.emailValue}">${t.contact.emailValue}</a></p>
    <h3>${t.contact.githubLabel}</h3>
    <p><a href="https://github.com/img-pdf/img-pdf.github.io" target="_blank" rel="noopener">${t.contact.githubDesc} &rarr;</a></p>
  </div>

  <h2>${t.contact.feedbackTitle}</h2>
  <p>${t.contact.feedbackDesc}</p>
</main>

${renderFooter(locale)}
<script src="/assets/js/common.js"></script>
<script src="/assets/js/i18n.js"></script>
</body>
</html>
`;

  const targetDir = path.join(ROOT_DIR, locale === 'en' ? 'en/contact' : 'pt-br/contato');
  ensureDirSync(targetDir);
  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
  console.log(`✔ Generated ${locale === 'en' ? '/en/contact/' : '/pt-br/contato/'} page.`);
}

/**
 * Main generator execution
 */
export function buildAll() {
  console.log('--- Building Multilingual (en & pt-BR) ImgPDF Platform ---');

  for (const locale of ['en', 'pt-BR']) {
    buildHomePage(locale);
    buildCompressPdfPage(locale);
    buildAboutPage(locale);
    buildPrivacyPage(locale);
    buildTermsPage(locale);
    buildContactPage(locale);
  }

  console.log('--- Multilingual Pages Generation Complete ---');
}

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('build-multilingual.js')) {
  buildAll();
}
