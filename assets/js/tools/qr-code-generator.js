(function () {
  const textInput = document.getElementById("qr-text");
  const generateBtn = document.getElementById("generate-btn");
  const preview = document.getElementById("qr-preview");
  const downloadLink = document.getElementById("download-link");
  const sizeSelect = document.getElementById("qr-size");
  const statusLine = document.getElementById("status-line");

  function setStatus(msg, isError) {
    statusLine.textContent = msg || "";
    statusLine.classList.toggle("is-error", !!isError);
  }

  function render() {
    const text = textInput.value.trim();
    preview.innerHTML = "";
    downloadLink.style.display = "none";

    if (!text) { setStatus(""); return; }
    if (!window.QRCode) { setStatus("QR engine failed to load — check your connection and retry.", true); return; }

    const size = parseInt(sizeSelect.value, 10);
    const holder = document.createElement("div");
    preview.appendChild(holder);

    new QRCode(holder, {
      text: text,
      width: size,
      height: size,
      correctLevel: QRCode.CorrectLevel.M,
    });

    setStatus("");
    setTimeout(function () {
      const img = holder.querySelector("img") || holder.querySelector("canvas");
      if (img) {
        const url = img.tagName === "CANVAS" ? img.toDataURL("image/png") : img.src;
        downloadLink.href = url;
        downloadLink.download = "qr-code.png";
        downloadLink.style.display = "inline-flex";
      }
    }, 60);
  }

  generateBtn.addEventListener("click", render);
  textInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") render();
  });
  sizeSelect.addEventListener("change", function () {
    if (textInput.value.trim()) render();
  });
})();
