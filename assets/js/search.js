(function () {
  const input = document.getElementById("tool-search");
  const results = document.getElementById("tool-search-results");
  if (!input || !results || !window.IMGPDF_TOOLS) return;

  function render(list, query) {
    if (!query) {
      results.classList.remove("is-open");
      results.innerHTML = "";
      return;
    }
    if (list.length === 0) {
      results.innerHTML = '<div class="search-results__empty">No tool matches "' + escapeHtml(query) + '" yet.</div>';
      results.classList.add("is-open");
      return;
    }
    results.innerHTML = list
      .slice(0, 8)
      .map(function (tool) {
        if (!tool.url) {
          return (
            '<a href="#" class="is-disabled" aria-disabled="true" onclick="return false;">' +
            "<span>" + escapeHtml(tool.name) + "</span>" +
            '<span class="tag">soon</span>' +
            "</a>"
          );
        }
        return (
          '<a href="' + tool.url + '">' +
          "<span>" + escapeHtml(tool.name) + "</span>" +
          '<span class="tag">' + escapeHtml(tool.category) + "</span>" +
          "</a>"
        );
      })
      .join("");
    results.classList.add("is-open");
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  input.addEventListener("input", function () {
    const query = input.value.trim().toLowerCase();
    if (!query) return render([], "");
    const matches = window.IMGPDF_TOOLS.filter(function (tool) {
      return (
        tool.name.toLowerCase().includes(query) ||
        tool.keywords.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query)
      );
    });
    render(matches, query);
  });

  document.addEventListener("click", function (e) {
    if (!results.contains(e.target) && e.target !== input) {
      results.classList.remove("is-open");
    }
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      results.classList.remove("is-open");
      input.blur();
    }
  });
})();
