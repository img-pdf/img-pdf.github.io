(function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const fileChip = document.getElementById("file-chip");
  const fileThumb = document.getElementById("file-chip-thumb");
  const fileName = document.getElementById("file-chip-name");
  const fileMeta = document.getElementById("file-chip-meta");
  const removeBtn = document.getElementById("file-chip-remove");
  const widthInput = document.getElementById("width-input");
  const heightInput = document.getElementById("height-input");
  const lockRatio = document.getElementById("lock-ratio");
  const resizeBtn = document.getElementById("resize-btn");
  const statusLine = document.getElementById("status-line");
  const resultPanel = document.getElementById("result-panel");
  const resultOriginal = document.getElementById("result-original");
  const resultCompressed = document.getElementById("result-compressed");
  const resultSaved = document.getElementById("result-saved");
  const resultPreviewImg = document.getElementById("result-preview-img");
  const downloadLink = document.getElementById("download-link");

  let currentFile = null;
  let naturalWidth = 0;
  let naturalHeight = 0;
  let aspectRatio = 1;

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
    const probe = new Image();
    probe.onload = function () {
      naturalWidth = probe.naturalWidth;
      naturalHeight = probe.naturalHeight;
      aspectRatio = naturalWidth / naturalHeight;
      widthInput.value = naturalWidth;
      heightInput.value = naturalHeight;
    };
    probe.src = url;

    fileThumb.src = url;
    fileName.textContent = file.name;
    fileMeta.textContent = bytesToSize(file.size) + " · " + file.type.replace("image/", "").toUpperCase();
    fileChip.style.display = "flex";
    dropzone.style.display = "none";
    resizeBtn.disabled = false;
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
    handleFile(e.dataTransfer.files[0]);
  });

  removeBtn.addEventListener("click", function () {
    currentFile = null;
    fileInput.value = "";
    fileChip.style.display = "none";
    dropzone.style.display = "block";
    resizeBtn.disabled = true;
    resetResult();
    setStatus("");
  });

  widthInput.addEventListener("input", function () {
    if (lockRatio.checked && aspectRatio) {
      const w = parseInt(widthInput.value, 10);
      if (w > 0) heightInput.value = Math.round(w / aspectRatio);
    }
  });
  heightInput.addEventListener("input", function () {
    if (lockRatio.checked && aspectRatio) {
      const h = parseInt(heightInput.value, 10);
      if (h > 0) widthInput.value = Math.round(h * aspectRatio);
    }
  });

  resizeBtn.addEventListener("click", function () {
    if (!currentFile) return;
    const targetWidth = parseInt(widthInput.value, 10);
    const targetHeight = parseInt(heightInput.value, 10);
    if (!targetWidth || !targetHeight || targetWidth < 1 || targetHeight < 1) {
      setStatus("Enter a valid width and height.", true);
      return;
    }

    setStatus("Resizing…");
    resizeBtn.disabled = true;

    const img = new Image();
    const objectUrl = URL.createObjectURL(currentFile);

    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      const mimeType = currentFile.type === "image/gif" ? "image/png" : currentFile.type;
      if (mimeType === "image/jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        function (blob) {
          URL.revokeObjectURL(objectUrl);
          resizeBtn.disabled = false;

          if (!blob) {
            setStatus("Something went wrong resizing this image.", true);
            return;
          }

          const savedPct = Math.round((1 - blob.size / currentFile.size) * 100);
          resultOriginal.textContent = naturalWidth + " × " + naturalHeight;
          resultCompressed.textContent = targetWidth + " × " + targetHeight;
          resultSaved.textContent = (savedPct > 0 ? savedPct + "%" : bytesToSize(blob.size));

          const resultUrl = URL.createObjectURL(blob);
          resultPreviewImg.src = resultUrl;

          const ext = mimeType.split("/")[1].replace("jpeg", "jpg");
          const baseName = currentFile.name.replace(/\.[^.]+$/, "");
          downloadLink.href = resultUrl;
          downloadLink.download = baseName + "-resized." + ext;

          resultPanel.classList.add("is-visible");
          setStatus("Done — resized to " + targetWidth + " × " + targetHeight + ".");
          resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        },
        mimeType,
        0.92
      );
    };

    img.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      resizeBtn.disabled = false;
      setStatus("Couldn't read that image. Try a different file.", true);
    };

    img.src = objectUrl;
  });
})();
