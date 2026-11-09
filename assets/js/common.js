(function () {
  // Theme management: load saved or system preference
  function getPreferredTheme() {
    const saved = localStorage.getItem("imgpdf_theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      btn.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " mode");
      btn.innerHTML = theme === "dark"
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> <span>Light</span>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg> <span>Dark</span>';
    });
  }

  const currentTheme = getPreferredTheme();
  applyTheme(currentTheme);

  // Wire all theme toggles
  document.addEventListener("click", function (e) {
    const toggleBtn = e.target.closest(".theme-toggle");
    if (toggleBtn) {
      const active = document.documentElement.getAttribute("data-theme") || getPreferredTheme();
      const next = active === "dark" ? "light" : "dark";
      localStorage.setItem("imgpdf_theme", next);
      applyTheme(next);
    }
  });

  // Mobile navigation
  const toggle = document.getElementById("nav-toggle");
  const panel = document.getElementById("mobile-panel");
  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      const isOpen = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // Active section indicator
  const path = window.location.pathname;
  document.querySelectorAll("[data-nav-section]").forEach(function (link) {
    const section = link.getAttribute("data-nav-section");
    if (section !== "/" && path.startsWith(section)) {
      link.classList.add("is-active");
    } else if (section === "/" && (path === "/" || path === "/index.html")) {
      link.classList.add("is-active");
    }
  });

  // Global Share & Copy-Link Handler
  document.addEventListener("click", function (e) {
    const copyBtn = e.target.closest("[data-action='copy-link']");
    if (copyBtn) {
      e.preventDefault();
      const urlToCopy = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(urlToCopy).then(showToast).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }

      function fallbackCopy() {
        const input = document.createElement("input");
        input.value = urlToCopy;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        showToast();
      }

      function showToast() {
        let toast = document.querySelector(".copy-toast");
        if (!toast) {
          toast = document.createElement("div");
          toast.className = "copy-toast";
          toast.textContent = "Link copied to clipboard!";
          document.body.appendChild(toast);
        }
        toast.classList.add("is-visible");
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(function () {
          toast.classList.remove("is-visible");
        }, 2500);
      }
    }
  });

  // =========================================================================
  // Google Tag Manager & GA4 DataLayer Integration
  // =========================================================================
  window.dataLayer = window.dataLayer || [];

  // Safe telemetry pusher with strict privacy guard
  // NEVER sends personal data, uploaded file contents, or raw filenames
  function trackImgPdfEvent(eventName, params) {
    if (!eventName || typeof eventName !== "string") return;
    const safeParams = {};
    if (params && typeof params === "object") {
      for (const key of Object.keys(params)) {
        // Exclude any keys that might hold filenames, file content, emails, or personal data
        if (/filename|file_name|filepath|file_content|email|password|token|secret/i.test(key)) {
          continue;
        }
        safeParams[key] = params[key];
      }
    }
    window.dataLayer.push(Object.assign({ event: eventName }, safeParams));
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, safeParams);
    }
  }
  window.trackImgPdfEvent = trackImgPdfEvent;

  // Determine page type and category context
  function getPageContext() {
    const p = window.location.pathname;
    let pageType = "general";
    let category = "general";

    if (p === "/" || p === "/index.html") {
      pageType = "home";
      category = "home";
    } else if (p.startsWith("/blog/")) {
      if (p === "/blog/" || p === "/blog/index.html") {
        pageType = "blog_home";
        category = "blog";
      } else if (p.includes("/pdf-guides/")) {
        pageType = "blog_category";
        category = "pdf-guides";
      } else if (p.includes("/image-guides/")) {
        pageType = "blog_category";
        category = "image-guides";
      } else if (p.includes("/document-guides/")) {
        pageType = "blog_category";
        category = "document-guides";
      } else {
        pageType = "blog_article";
        category = "blog";
      }
    } else if (p.startsWith("/guides/")) {
      pageType = (p === "/guides/" || p === "/guides/index.html") ? "guides_home" : "guide_article";
      category = "guides";
    } else if (p.startsWith("/image-tools/")) {
      pageType = p.replace(/\/$/, "").endsWith("image-tools") ? "category_hub" : "tool_page";
      category = "image-tools";
    } else if (p.startsWith("/pdf-tools/")) {
      pageType = p.replace(/\/$/, "").endsWith("pdf-tools") ? "category_hub" : "tool_page";
      category = "pdf-tools";
    } else if (p.startsWith("/utilities/")) {
      pageType = p.replace(/\/$/, "").endsWith("utilities") ? "category_hub" : "tool_page";
      category = "utilities";
    } else if (p.startsWith("/developer-tools/")) {
      pageType = p.replace(/\/$/, "").endsWith("developer-tools") ? "category_hub" : "tool_page";
      category = "developer-tools";
    } else if (p.startsWith("/text-tools/")) {
      pageType = p.replace(/\/$/, "").endsWith("text-tools") ? "category_hub" : "tool_page";
      category = "text-tools";
    } else if (p.startsWith("/privacy/") || p.startsWith("/terms/") || p.startsWith("/about/") || p.startsWith("/contact/")) {
      pageType = "company_legal";
      category = "info";
    } else if (p.includes("404")) {
      pageType = "error_404";
      category = "error";
    }

    return { pageType: pageType, category: category };
  }

  const pageCtx = getPageContext();

  // Push page context to dataLayer for GA4 / GTM
  window.dataLayer.push({
    event: "page_meta",
    page_type: pageCtx.pageType,
    page_category: pageCtx.category,
    page_path: window.location.pathname,
    page_title: document.title,
    processing_mode: "client_side_local"
  });

  // Track tool_open if on a tool page
  if (pageCtx.pageType === "tool_page") {
    const h1 = document.querySelector("h1");
    const toolTitle = h1 ? h1.textContent.trim().split("—")[0].trim() : document.title.split("—")[0].trim();
    trackImgPdfEvent("tool_open", {
      tool_name: toolTitle,
      tool_category: pageCtx.category,
      page_path: window.location.pathname
    });
  }

  // Track file_upload (safe aggregated counts and MIME types only, NO filenames or contents)
  let lastUploadTime = 0;
  function handleSafeFileUpload(fileList) {
    if (!fileList || fileList.length === 0) return;
    const now = Date.now();
    if (now - lastUploadTime < 800) return; // Debounce rapid triggers
    lastUploadTime = now;

    let totalBytes = 0;
    const typesSet = new Set();
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      totalBytes += (f.size || 0);
      if (f.type) {
        typesSet.add(f.type);
      } else {
        const ext = (f.name || "").split(".").pop();
        typesSet.add(ext ? "." + ext.toLowerCase() : "unknown");
      }
    }
    const h1 = document.querySelector("h1");
    const toolTitle = h1 ? h1.textContent.trim().split("—")[0].trim() : (pageCtx.category || "tool");
    const sizeMb = (totalBytes / (1024 * 1024)).toFixed(2);

    trackImgPdfEvent("file_upload", {
      tool_name: toolTitle,
      tool_category: pageCtx.category,
      file_count: fileList.length,
      file_types: Array.from(typesSet).join(", "),
      total_size_mb: sizeMb
    });
  }

  document.addEventListener("change", function (e) {
    if (e.target && e.target.type === "file" && e.target.files && e.target.files.length > 0) {
      handleSafeFileUpload(e.target.files);
    }
  });

  document.addEventListener("drop", function (e) {
    const dropzone = e.target.closest(".dropzone, #dropzone, .upload-box");
    if (dropzone && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSafeFileUpload(e.dataTransfer.files);
    }
  });

  // Track tool_complete on download and copy interactions
  let lastCompleteTime = 0;
  document.addEventListener("click", function (e) {
    const downloadBtn = e.target.closest("#download-btn, #download-all-btn, [data-action='download'], .tool-download-btn");
    const copyBtn = e.target.closest("#copy-btn, #copy-password-btn, #copy-hash-btn, #copy-output-btn, #copy-json-btn, [data-action='copy-output']");

    if (downloadBtn || copyBtn) {
      const now = Date.now();
      if (now - lastCompleteTime < 1000) return; // Prevent duplicate rapid clicks
      lastCompleteTime = now;

      const action = downloadBtn ? "download" : "copy";
      const h1 = document.querySelector("h1");
      const toolTitle = h1 ? h1.textContent.trim().split("—")[0].trim() : (pageCtx.category || "tool");

      trackImgPdfEvent("tool_complete", {
        tool_name: toolTitle,
        tool_category: pageCtx.category,
        action_type: action
      });
    }
  });

  // Track article_related_tool_click
  document.addEventListener("click", function (e) {
    const link = e.target.closest("a[href]");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    const isTool = href.startsWith("/image-tools/") || href.startsWith("/pdf-tools/") || href.startsWith("/utilities/") || href.startsWith("/developer-tools/") || href.startsWith("/text-tools/");
    const isHub = href.endsWith("-tools/") || href === "/utilities/";
    const isArticle = window.location.pathname.startsWith("/blog/") || window.location.pathname.startsWith("/guides/");

    if (isArticle && isTool && !isHub) {
      trackImgPdfEvent("article_related_tool_click", {
        tool_url: href,
        article_title: document.title.split("—")[0].trim(),
        article_path: window.location.pathname
      });
    }
  });

  // Track blog_category_click
  document.addEventListener("click", function (e) {
    const pill = e.target.closest(".filter-pill");
    if (pill) {
      const cat = pill.getAttribute("data-filter") || pill.textContent.trim();
      trackImgPdfEvent("blog_category_click", {
        category_name: cat,
        source: "filter_pills"
      });
      return;
    }
    const catLink = e.target.closest("a[href*='/blog/']");
    if (catLink) {
      const href = catLink.getAttribute("href") || "";
      if (href === "/blog/pdf-guides/" || href === "/blog/image-guides/" || href === "/blog/document-guides/") {
        trackImgPdfEvent("blog_category_click", {
          category_name: href.replace("/blog/", "").replace(/\//g, ""),
          source: "category_link"
        });
      }
    }
  });

  // Track blog_search (debounced)
  const blogSearch = document.getElementById("blog-search-input");
  if (blogSearch) {
    let searchDebounceTimer = null;
    let lastQueryTracked = "";
    blogSearch.addEventListener("input", function () {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(function () {
        const query = (blogSearch.value || "").trim();
        if (query.length >= 2 && query !== lastQueryTracked) {
          lastQueryTracked = query;
          const visibleArticles = document.querySelectorAll("#blog-article-grid .article-card:not([style*='display: none'])");
          trackImgPdfEvent("blog_search", {
            search_term: query,
            results_count: visibleArticles.length
          });
        }
      }, 800);
    });
  }
})();

