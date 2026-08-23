(function () {
  const toggle = document.getElementById("nav-toggle");
  const panel = document.getElementById("mobile-panel");
  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      const isOpen = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // Mark the current section's nav link as active based on the URL path.
  const path = window.location.pathname;
  document.querySelectorAll("[data-nav-section]").forEach(function (link) {
    const section = link.getAttribute("data-nav-section");
    if (section !== "/" && path.startsWith(section)) {
      link.classList.add("is-active");
    } else if (section === "/" && path === "/") {
      link.classList.add("is-active");
    }
  });
})();
