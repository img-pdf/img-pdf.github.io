(function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const cropStageWrap = document.getElementById("crop-stage-wrap");
  const cropStage = document.getElementById("crop-stage");
  const stageImg = document.getElementById("stage-img");
  const cropBox = document.getElementById("crop-box");
  const ratioChips = document.querySelectorAll(".chip-option[data-ratio]");
  const cropBtn = document.getElementById("crop-btn");
  const changeBtn = document.getElementById("change-btn");
  const statusLine = document.getElementById("status-line");
  const resultPanel = document.getElementById("result-panel");
  const resultOriginal = document.getElementById("result-original");
  const resultCompressed = document.getElementById("result-compressed");
  const resultPreviewImg = document.getElementById("result-preview-img");
  const downloadLink = document.getElementById("download-link");

  let currentFile = null;
  let naturalWidth = 0, naturalHeight = 0;
  let ratio = null; // null = free
  let box = { x: 20, y: 20, w: 160, h: 160 };
  let dragMode = null; // 'move' | 'nw' | 'ne' | 'sw' | 'se'
  let dragStart = null;

  function setStatus(msg, isError) {
    statusLine.textContent = msg || "";
    statusLine.classList.toggle("is-error", !!isError);
  }
  function bytesToSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function handleFile(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      setStatus("Unsupported file type. Please choose a JPG, PNG, WebP or GIF image.", true);
      return;
    }
    currentFile = file;
    resultPanel.classList.remove("is-visible");
    setStatus("");

    const url = URL.createObjectURL(file);
    stageImg.onload = function () {
      naturalWidth = stageImg.naturalWidth;
      naturalHeight = stageImg.naturalHeight;
      dropzone.style.display = "none";
      cropStageWrap.style.display = "flex";
      cropBtn.disabled = false;
      changeBtn.style.display = "inline-flex";

      const rect = stageImg.getBoundingClientRect();
      const w = Math.min(rect.width, rect.height) * 0.6;
      box = { x: (rect.width - w) / 2, y: (rect.height - w) / 2, w: w, h: w };
      applyRatio();
      renderBox();
    };
    stageImg.src = url;
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
  dropzone.addEventListener("drop", function (e) { handleFile(e.dataTransfer.files[0]); });

  changeBtn.addEventListener("click", function () {
    fileInput.value = "";
    dropzone.style.display = "block";
    cropStageWrap.style.display = "none";
    changeBtn.style.display = "none";
    cropBtn.disabled = true;
    resultPanel.classList.remove("is-visible");
    currentFile = null;
  });

  ratioChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      ratioChips.forEach(function (c) { c.classList.remove("is-selected"); c.setAttribute("aria-pressed", "false"); });
      chip.classList.add("is-selected");
      chip.setAttribute("aria-pressed", "true");
      const val = chip.getAttribute("data-ratio");
      ratio = val === "free" ? null : val.split(":").map(Number).reduce((a, b) => a / b);
      applyRatio();
      renderBox();
    });
  });

  function applyRatio() {
    if (!ratio) return;
    box.h = box.w / ratio;
    clampBox();
  }

  function clampBox() {
    const rect = stageImg.getBoundingClientRect();
    box.w = Math.max(20, Math.min(box.w, rect.width));
    box.h = Math.max(20, Math.min(box.h, rect.height));
    box.x = Math.max(0, Math.min(box.x, rect.width - box.w));
    box.y = Math.max(0, Math.min(box.y, rect.height - box.h));
  }

  function renderBox() {
    cropBox.style.left = box.x + "px";
    cropBox.style.top = box.y + "px";
    cropBox.style.width = box.w + "px";
    cropBox.style.height = box.h + "px";
  }

  function pointerPos(e) {
    const rect = cropStage.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  }

  cropBox.addEventListener("pointerdown", function (e) {
    const handle = e.target.getAttribute("data-h");
    dragMode = handle || "move";
    dragStart = { pos: pointerPos(e), box: Object.assign({}, box) };
    cropBox.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  cropBox.addEventListener("pointermove", function (e) {
    if (!dragMode) return;
    const pos = pointerPos(e);
    const dx = pos.x - dragStart.pos.x;
    const dy = pos.y - dragStart.pos.y;
    const start = dragStart.box;
    const rect = stageImg.getBoundingClientRect();

    if (dragMode === "move") {
      box.x = Math.max(0, Math.min(start.x + dx, rect.width - box.w));
      box.y = Math.max(0, Math.min(start.y + dy, rect.height - box.h));
    } else {
      let newW = start.w, newH = start.h, newX = start.x, newY = start.y;
      if (dragMode === "se") { newW = start.w + dx; newH = ratio ? newW / ratio : start.h + dy; }
      if (dragMode === "sw") { newW = start.w - dx; newX = start.x + dx; newH = ratio ? newW / ratio : start.h + dy; }
      if (dragMode === "ne") { newW = start.w + dx; newH = ratio ? newW / ratio : start.h - dy; newY = ratio ? start.y + (start.h - newH) : start.y + dy; }
      if (dragMode === "nw") { newW = start.w - dx; newX = start.x + dx; newH = ratio ? newW / ratio : start.h - dy; newY = ratio ? start.y + (start.h - newH) : start.y + dy; }
      box.w = Math.max(20, newW);
      box.h = Math.max(20, newH);
      box.x = newX;
      box.y = newY;
    }
    clampBox();
    renderBox();
  });

  ["pointerup", "pointercancel"].forEach(function (evt) {
    cropBox.addEventListener(evt, function () { dragMode = null; });
  });

  cropBtn.addEventListener("click", function () {
    if (!currentFile) return;
    setStatus("Cropping…");
    cropBtn.disabled = true;

    const displayRect = stageImg.getBoundingClientRect();
    const scaleX = naturalWidth / displayRect.width;
    const scaleY = naturalHeight / displayRect.height;

    const sx = Math.round(box.x * scaleX);
    const sy = Math.round(box.y * scaleY);
    const sw = Math.round(box.w * scaleX);
    const sh = Math.round(box.h * scaleY);

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(stageImg, sx, sy, sw, sh, 0, 0, sw, sh);

    const mimeType = currentFile.type === "image/gif" ? "image/png" : currentFile.type;
    canvas.toBlob(function (blob) {
      cropBtn.disabled = false;
      if (!blob) { setStatus("Something went wrong cropping this image.", true); return; }

      resultOriginal.textContent = naturalWidth + " × " + naturalHeight;
      resultCompressed.textContent = sw + " × " + sh;
      const url = URL.createObjectURL(blob);
      resultPreviewImg.src = url;

      const ext = mimeType.split("/")[1].replace("jpeg", "jpg");
      const baseName = currentFile.name.replace(/\.[^.]+$/, "");
      downloadLink.href = url;
      downloadLink.download = baseName + "-cropped." + ext;

      resultPanel.classList.add("is-visible");
      setStatus("Done — cropped to " + sw + " × " + sh + ".");
      resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, mimeType, 0.92);
  });

  window.addEventListener("resize", function () {
    if (currentFile) clampBox(), renderBox();
  });
})();
