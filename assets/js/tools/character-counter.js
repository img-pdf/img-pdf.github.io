(function () {
  const input = document.getElementById("text-input");
  const withSpaces = document.getElementById("char-with-spaces");
  const withoutSpaces = document.getElementById("char-without-spaces");
  const byteCount = document.getElementById("byte-count");
  const limitRows = document.querySelectorAll("[data-limit]");

  function update() {
    const text = input.value;
    withSpaces.textContent = text.length;
    withoutSpaces.textContent = text.replace(/\s/g, "").length;
    byteCount.textContent = new TextEncoder().encode(text).length;

    limitRows.forEach(function (row) {
      const limit = parseInt(row.getAttribute("data-limit"), 10);
      const remaining = limit - text.length;
      const bar = row.querySelector(".limit-bar__fill");
      const label = row.querySelector(".limit-bar__label");
      const pct = Math.min(100, (text.length / limit) * 100);
      bar.style.width = pct + "%";
      bar.style.background = remaining < 0 ? "var(--danger)" : pct > 90 ? "var(--star)" : "var(--good)";
      label.textContent = remaining >= 0 ? remaining + " left" : Math.abs(remaining) + " over";
    });
  }

  input.addEventListener("input", update);
  update();
})();
