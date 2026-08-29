(function () {
  const input = document.getElementById("hash-input");
  const generateBtn = document.getElementById("generate-btn");
  const results = document.getElementById("hash-results");
  const statusLine = document.getElementById("status-line");

  const ALGOS = [
    { label: "SHA-1", subtle: "SHA-1" },
    { label: "SHA-256", subtle: "SHA-256" },
    { label: "SHA-384", subtle: "SHA-384" },
    { label: "SHA-512", subtle: "SHA-512" },
  ];

  function setStatus(msg, isError) {
    statusLine.textContent = msg || "";
    statusLine.classList.toggle("is-error", !!isError);
  }

  function bufToHex(buf) {
    return Array.from(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  async function run() {
    const text = input.value;
    if (!text) {
      setStatus("Type or paste some text first.", true);
      results.innerHTML = "";
      return;
    }
    setStatus("Hashing…");
    const data = new TextEncoder().encode(text);
    const rows = [];
    for (const algo of ALGOS) {
      const digest = await crypto.subtle.digest(algo.subtle, data);
      rows.push({ label: algo.label, hex: bufToHex(digest) });
    }
    results.innerHTML = rows.map(function (r) {
      return (
        '<div class="hash-row">' +
        '<div class="hash-row__label">' + r.label + '</div>' +
        '<div class="output-box"><span class="output-box__text">' + r.hex + '</span>' +
        '<button class="output-box__copy" type="button" data-copy="' + r.hex + '">Copy</button></div>' +
        "</div>"
      );
    }).join("");
    setStatus("");
  }

  results.addEventListener("click", function (e) {
    const val = e.target.getAttribute("data-copy");
    if (!val) return;
    navigator.clipboard.writeText(val).then(function () {
      e.target.textContent = "Copied!";
      e.target.classList.add("is-copied");
      setTimeout(function () { e.target.textContent = "Copy"; e.target.classList.remove("is-copied"); }, 1200);
    });
  });

  generateBtn.addEventListener("click", run);
  input.addEventListener("input", run);
})();
