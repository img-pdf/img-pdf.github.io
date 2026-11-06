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
})();

