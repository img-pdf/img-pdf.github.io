(function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const fileChip = document.getElementById("file-chip");
  const fileThumb = document.getElementById("file-chip-thumb");
  const fileName = document.getElementById("file-chip-name");
  const fileMeta = document.getElementById("file-chip-meta");
  const removeBtn = document.getElementById("file-chip-remove");
  const qualitySlider = document.getElementById("quality");
  const qualityValue = document.getElementById("quality-value");
  const maxWidthInput = document.getElementById("max-width");
  const formatChips = document.querySelectorAll(".chip-option[data-format]");
  const compressBtn = document.getElementById("compress-btn");
  const statusLine = document.getElementById("status-line");
  const resultPanel = document.getElementById("result-panel");
  const resultOriginal = document.getElementById("result-original");
  const resultCompressed = document.getElementById("result-compressed");
  const resultSaved = document.getElementById("result-saved");
  const resultPreviewImg = document.getElementById("result-preview-img");
  const downloadLink = document.getElementById("download-link");

  let currentFile = null;
  let selectedFormat = "auto";

  function bytesToSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function setStatus(msg, isError) {
    statusLine.textContent = msg || "";
    statusLine.classList.toggle("is-error", !!isError);
  }

  function resetResult() {
    resultPanel.classList.remove("is-visible");
  }

  function handleFile(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      setStatus("Unsupported file type. Please choose a JPG, PNG, WebP or GIF image.", true);
      return;
    }
    currentFile = file;
    resetResult();
    setStatus("");

    const url = URL.createObjectURL(file);
    fileThumb.src = url;
    fileName.textContent = file.name;
    fileMeta.textContent = bytesToSize(file.size) + " · " + file.type.replace("image/", "").toUpperCase();
    fileChip.style.display = "flex";
    dropzone.style.display = "none";
    compressBtn.disabled = false;
  }

  dropzone.addEventListener("click", function () { fileInput.click(); });
  dropzone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener("change", function (e) { handleFile(e.target.files[0]); });

  ["dragenter", "dragover"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.add("is-dragover"); });
  });
  ["dragleave", "drop"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.remove("is-dragover"); });
  });
  dropzone.addEventListener("drop", function (e) {
    const file = e.dataTransfer.files[0];
    handleFile(file);
  });

  removeBtn.addEventListener("click", function () {
    currentFile = null;
    fileInput.value = "";
    fileChip.style.display = "none";
    dropzone.style.display = "block";
    compressBtn.disabled = true;
    resetResult();
    setStatus("");
  });

  qualitySlider.addEventListener("input", function () {
    qualityValue.textContent = qualitySlider.value + "%";
  });

  formatChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      formatChips.forEach(function (c) { c.classList.remove("is-selected"); c.setAttribute("aria-pressed", "false"); });
      chip.classList.add("is-selected");
      chip.setAttribute("aria-pressed", "true");
      selectedFormat = chip.getAttribute("data-format");
    });
  });

  function targetMimeType(originalType) {
    if (selectedFormat === "jpeg") return "image/jpeg";
    if (selectedFormat === "png") return "image/png";
    if (selectedFormat === "webp") return "image/webp";
    // auto: keep original where sensible, otherwise fall back to jpeg
    if (originalType === "image/png" || originalType === "image/webp") return originalType;
    return "image/jpeg";
  }

  compressBtn.addEventListener("click", function () {
    if (!currentFile) return;
    setStatus("Reading image…");
    compressBtn.disabled = true;

    const img = new Image();
    const objectUrl = URL.createObjectURL(currentFile);

    img.onload = function () {
      let targetWidth = img.naturalWidth;
      let targetHeight = img.naturalHeight;
      const maxWidth = parseInt(maxWidthInput.value, 10);
      if (maxWidth && maxWidth > 0 && maxWidth < targetWidth) {
        const ratio = maxWidth / targetWidth;
        targetWidth = maxWidth;
        targetHeight = Math.round(targetHeight * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      // Flatten transparency onto white when exporting to JPEG (JPEG has no alpha channel).
      const mimeType = targetMimeType(currentFile.type);
      if (mimeType === "image/jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const quality = parseInt(qualitySlider.value, 10) / 100;
      setStatus("Compressing…");

      canvas.toBlob(
        function (blob) {
          URL.revokeObjectURL(objectUrl);
          compressBtn.disabled = false;

          if (!blob) {
            setStatus("Something went wrong compressing this image. Try a different format.", true);
            return;
          }

          const savedPct = Math.max(0, Math.round((1 - blob.size / currentFile.size) * 100));
          resultOriginal.textContent = bytesToSize(currentFile.size);
          resultCompressed.textContent = bytesToSize(blob.size);
          resultSaved.textContent = savedPct + "%";

          const resultUrl = URL.createObjectURL(blob);
          resultPreviewImg.src = resultUrl;

          const ext = mimeType.split("/")[1].replace("jpeg", "jpg");
          const baseName = currentFile.name.replace(/\.[^.]+$/, "");
          downloadLink.href = resultUrl;
          downloadLink.download = baseName + "-compressed." + ext;

          resultPanel.classList.add("is-visible");
          setStatus(blob.size < currentFile.size ? "Done — smaller than the original." : "Done — this format/quality didn't shrink it further, try a lower quality.");
          resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        },
        mimeType,
        mimeType === "image/png" ? undefined : quality
      );
    };

    img.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      compressBtn.disabled = false;
      setStatus("Couldn't read that image. Try a different file.", true);
    };

    img.src = objectUrl;
  });
})();
