(function () {
  const input = document.getElementById("json-input");
  const output = document.getElementById("json-output");
  const formatBtn = document.getElementById("format-btn");
  const minifyBtn = document.getElementById("minify-btn");
  const copyBtn = document.getElementById("copy-btn");
  const statusLine = document.getElementById("status-line");

  function setStatus(msg, isError) {
    statusLine.textContent = msg || "";
    statusLine.classList.toggle("is-error", !!isError);
  }

  function run(indent) {
    const raw = input.value.trim();
    if (!raw) { setStatus("Paste some JSON first.", true); return; }
    try {
      const parsed = JSON.parse(raw);
      output.value = indent === null ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
      setStatus(indent === null ? "Minified." : "Formatted.");
    } catch (err) {
      output.value = "";
      setStatus("Invalid JSON: " + err.message, true);
    }
  }

  formatBtn.addEventListener("click", function () { run(2); });
  minifyBtn.addEventListener("click", function () { run(null); });

  copyBtn.addEventListener("click", function () {
    if (!output.value) return;
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = "Copied!";
      setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
    });
  });
})();
