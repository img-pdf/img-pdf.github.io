(function () {
  const countInput = document.getElementById("count");
  const generateBtn = document.getElementById("generate-btn");
  const copyAllBtn = document.getElementById("copy-all-btn");
  const list = document.getElementById("uuid-list");

  function uuidv4() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    // Fallback for older browsers without crypto.randomUUID
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
  }

  function render() {
    const count = Math.min(50, Math.max(1, parseInt(countInput.value, 10) || 1));
    countInput.value = count;
    list.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const row = document.createElement("div");
      row.className = "uuid-row";
      const id = uuidv4();
      row.innerHTML = '<span class="uuid-row__text">' + id + '</span><button class="mini-btn" type="button" data-copy="' + id + '">Copy</button>';
      list.appendChild(row);
    }
  }

  list.addEventListener("click", function (e) {
    const val = e.target.getAttribute("data-copy");
    if (!val) return;
    navigator.clipboard.writeText(val).then(function () {
      e.target.textContent = "Copied!";
      setTimeout(function () { e.target.textContent = "Copy"; }, 1200);
    });
  });

  copyAllBtn.addEventListener("click", function () {
    const all = Array.from(list.querySelectorAll(".uuid-row__text")).map(function (el) { return el.textContent; }).join("\n");
    navigator.clipboard.writeText(all).then(function () {
      copyAllBtn.textContent = "Copied all!";
      setTimeout(function () { copyAllBtn.textContent = "Copy All"; }, 1500);
    });
  });

  generateBtn.addEventListener("click", render);
  render();
})();
