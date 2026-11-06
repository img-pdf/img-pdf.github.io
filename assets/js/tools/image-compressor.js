(function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const batchList = document.getElementById("batch-list");
  const qualitySlider = document.getElementById("quality");
  const qualityValue = document.getElementById("quality-value");
  const maxWidthInput = document.getElementById("max-width");
  const formatChips = document.querySelectorAll(".chip-option[data-format]");
  const presetBtns = document.querySelectorAll(".preset-btn[data-quality]");
  const compressBtn = document.getElementById("compress-btn");
  const downloadAllBtn = document.getElementById("download-all-btn");
  const clearAllBtn = document.getElementById("clear-all-btn");
  const statusLine = document.getElementById("status-line");
  const resultPanel = document.getElementById("result-panel");
  const resultOriginal = document.getElementById("result-original");
  const resultCompressed = document.getElementById("result-compressed");
  const resultSaved = document.getElementById("result-saved");
  const comparisonWrap = document.getElementById("comparison-wrap");
  const compOriginalImg = document.getElementById("comp-original-img");
  const compCompressedImg = document.getElementById("comp-compressed-img");
  const compOverlay = document.getElementById("comp-overlay");
  const compHandle = document.getElementById("comp-handle");
  const compContainer = document.getElementById("comp-container");

  let files = []; // [{ id, file, url, originalSize, compressedBlob, compressedUrl, compressedSize, savedPct, name, ext }]
  let selectedFormat = "auto";
  let idCounter = 0;
  let isDraggingHandle = false;

  function bytesToSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function setStatus(msg, isError) {
    statusLine.textContent = msg || "";
    statusLine.classList.toggle("is-error", !!isError);
  }

  function targetMimeType(originalType) {
    if (selectedFormat === "jpeg") return "image/jpeg";
    if (selectedFormat === "png") return "image/png";
    if (selectedFormat === "webp") return "image/webp";
    if (originalType === "image/png" || originalType === "image/webp") return originalType;
    return "image/jpeg";
  }

  function addFiles(newFiles) {
    if (!newFiles || newFiles.length === 0) return;
    let addedCount = 0;
    Array.from(newFiles).forEach(function (f) {
      if (!/^image\/(jpeg|png|webp|gif)$/i.test(f.type)) return;
      files.push({
        id: ++idCounter,
        file: f,
        url: URL.createObjectURL(f),
        originalSize: f.size,
        name: f.name,
        compressedBlob: null,
        compressedUrl: null,
        compressedSize: null,
        savedPct: null
      });
      addedCount++;
    });

    if (addedCount === 0) {
      setStatus("No valid images selected. Please choose JPG, PNG, WebP, or GIF files.", true);
      return;
    }

    setStatus(files.length + " image" + (files.length > 1 ? "s" : "") + " loaded. Adjust settings and click Compress.");
    compressBtn.disabled = false;
    clearAllBtn.style.display = "inline-flex";
    renderBatchList();
  }

  function renderBatchList() {
    if (files.length === 0) {
      batchList.innerHTML = "";
      batchList.style.display = "none";
      compressBtn.disabled = true;
      downloadAllBtn.style.display = "none";
      clearAllBtn.style.display = "none";
      resultPanel.classList.remove("is-visible");
      comparisonWrap.style.display = "none";
      return;
    }

    batchList.style.display = "block";
    batchList.innerHTML = files.map(function (item, idx) {
      const statusBadge = item.compressedBlob
        ? '<span class="tag tag--good">Saved ' + item.savedPct + '%</span>'
        : '<span class="tag">Ready</span>';

      const downloadBtn = item.compressedUrl
        ? '<a href="' + item.compressedUrl + '" download="' + escapeHtml(item.outputName || item.name) + '" class="mini-btn" style="color:var(--good);font-weight:600;">Download</a>'
        : '';

      const viewBtn = item.compressedUrl
        ? '<button type="button" class="mini-btn view-comp-btn" data-id="' + item.id + '">Compare</button>'
        : '';

      const sizeInfo = item.compressedSize
        ? bytesToSize(item.originalSize) + " &rarr; " + bytesToSize(item.compressedSize)
        : bytesToSize(item.originalSize);

      return (
        '<div class="batch-item" data-id="' + item.id + '">' +
          '<img class="batch-item__thumb" src="' + item.url + '" alt="">' +
          '<div class="batch-item__info">' +
            '<div class="batch-item__name">' + (idx + 1) + ". " + escapeHtml(item.name) + '</div>' +
            '<div class="batch-item__meta">' + sizeInfo + '</div>' +
          '</div>' +
          '<div class="batch-item__status">' + statusBadge + '</div>' +
          '<div class="batch-item__actions">' +
            viewBtn +
            downloadBtn +
            '<button type="button" class="file-chip__remove remove-item-btn" data-id="' + item.id + '" aria-label="Remove">&times;</button>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  // Handle drag and drop
  dropzone.addEventListener("click", function () { fileInput.click(); });
  dropzone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener("change", function (e) {
    addFiles(e.target.files);
    fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.add("is-dragover"); });
  });
  ["dragleave", "drop"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.remove("is-dragover"); });
  });
  dropzone.addEventListener("drop", function (e) {
    addFiles(e.dataTransfer.files);
  });

  // Batch list actions
  batchList.addEventListener("click", function (e) {
    const removeBtn = e.target.closest(".remove-item-btn");
    if (removeBtn) {
      const id = parseInt(removeBtn.getAttribute("data-id"), 10);
      const idx = files.findIndex(function (it) { return it.id === id; });
      if (idx !== -1) {
        if (files[idx].url) URL.revokeObjectURL(files[idx].url);
        if (files[idx].compressedUrl) URL.revokeObjectURL(files[idx].compressedUrl);
        files.splice(idx, 1);
        renderBatchList();
        updateSummaryStats();
      }
      return;
    }

    const viewBtn = e.target.closest(".view-comp-btn");
    if (viewBtn) {
      const id = parseInt(viewBtn.getAttribute("data-id"), 10);
      const item = files.find(function (it) { return it.id === id; });
      if (item && item.compressedUrl) {
        showComparison(item);
      }
    }
  });

  clearAllBtn.addEventListener("click", function () {
    files.forEach(function (it) {
      if (it.url) URL.revokeObjectURL(it.url);
      if (it.compressedUrl) URL.revokeObjectURL(it.compressedUrl);
    });
    files = [];
    renderBatchList();
    updateSummaryStats();
    setStatus("Queue cleared.");
  });

  // Quality & Presets
  qualitySlider.addEventListener("input", function () {
    qualityValue.textContent = qualitySlider.value + "%";
    presetBtns.forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-quality") === qualitySlider.value);
    });
  });

  presetBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      presetBtns.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      const q = btn.getAttribute("data-quality");
      qualitySlider.value = q;
      qualityValue.textContent = q + "%";
    });
  });

  formatChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      formatChips.forEach(function (c) { c.classList.remove("is-selected"); c.setAttribute("aria-pressed", "false"); });
      chip.classList.add("is-selected");
      chip.setAttribute("aria-pressed", "true");
      selectedFormat = chip.getAttribute("data-format");
    });
  });

  function compressSingleFile(item, quality, maxWidth, format) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.onload = function () {
        let targetW = img.naturalWidth;
        let targetH = img.naturalHeight;
        if (maxWidth && maxWidth > 0 && maxWidth < targetW) {
          const ratio = maxWidth / targetW;
          targetW = maxWidth;
          targetH = Math.round(targetH * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");

        const mime = targetMimeType(item.file.type);
        if (mime === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, targetW, targetH);
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, targetW, targetH);

        canvas.toBlob(
          function (blob) {
            if (!blob) {
              reject(new Error("Compression failed for " + item.name));
              return;
            }
            const ext = mime.split("/")[1].replace("jpeg", "jpg");
            const base = item.name.replace(/\.[^.]+$/, "");
            const outName = base + "-compressed." + ext;
            const url = URL.createObjectURL(blob);
            const savedPct = Math.max(0, Math.round((1 - blob.size / item.originalSize) * 100));

            item.compressedBlob = blob;
            item.compressedUrl = url;
            item.compressedSize = blob.size;
            item.savedPct = savedPct;
            item.outputName = outName;
            resolve(item);
          },
          mime,
          mime === "image/png" ? undefined : quality
        );
      };
      img.onerror = function () {
        reject(new Error("Unable to read " + item.name));
      };
      img.src = item.url;
    });
  }

  function updateSummaryStats() {
    const processed = files.filter(function (it) { return it.compressedBlob; });
    if (processed.length === 0) {
      resultPanel.classList.remove("is-visible");
      return;
    }
    const origTotal = processed.reduce(function (sum, it) { return sum + it.originalSize; }, 0);
    const compTotal = processed.reduce(function (sum, it) { return sum + it.compressedSize; }, 0);
    const totalSavedPct = Math.max(0, Math.round((1 - compTotal / origTotal) * 100));

    resultOriginal.textContent = bytesToSize(origTotal);
    resultCompressed.textContent = bytesToSize(compTotal);
    resultSaved.textContent = totalSavedPct + "% (" + bytesToSize(Math.max(0, origTotal - compTotal)) + ")";
    resultPanel.classList.add("is-visible");
    downloadAllBtn.style.display = processed.length > 1 ? "inline-flex" : "none";
  }

  function showComparison(item) {
    if (!item || !item.compressedUrl) return;
    compOriginalImg.src = item.url;
    compCompressedImg.src = item.compressedUrl;
    comparisonWrap.style.display = "block";
    setSliderPosition(50);
    comparisonWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function setSliderPosition(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    compOverlay.style.width = clamped + "%";
    compHandle.style.left = clamped + "%";
  }

  // Interactive Before/After slider dragging
  function handleSliderMove(clientX) {
    const rect = compContainer.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setSliderPosition(pct);
  }

  compContainer.addEventListener("pointerdown", function (e) {
    isDraggingHandle = true;
    handleSliderMove(e.clientX);
    compContainer.setPointerCapture(e.pointerId);
  });
  compContainer.addEventListener("pointermove", function (e) {
    if (isDraggingHandle) {
      handleSliderMove(e.clientX);
    }
  });
  compContainer.addEventListener("pointerup", function (e) {
    isDraggingHandle = false;
    compContainer.releasePointerCapture(e.pointerId);
  });
  compContainer.addEventListener("pointercancel", function () {
    isDraggingHandle = false;
  });

  // Run Compression
  compressBtn.addEventListener("click", async function () {
    if (files.length === 0) return;
    compressBtn.disabled = true;
    const quality = parseInt(qualitySlider.value, 10) / 100;
    const maxWidth = parseInt(maxWidthInput.value, 10);

    setStatus("Processing 0 of " + files.length + "…");

    let completed = 0;
    let hasError = false;

    for (let i = 0; i < files.length; i++) {
      try {
        await compressSingleFile(files[i], quality, maxWidth, selectedFormat);
        completed++;
        setStatus("Processing " + completed + " of " + files.length + "…");
        renderBatchList();
      } catch (err) {
        hasError = true;
        console.error(err);
      }
    }

    compressBtn.disabled = false;
    renderBatchList();
    updateSummaryStats();

    const firstSuccess = files.find(function (it) { return it.compressedBlob; });
    if (firstSuccess) {
      showComparison(firstSuccess);
    }

    if (hasError) {
      setStatus("Finished with some warnings. Check file statuses above.", true);
    } else {
      setStatus("Compression complete! Saved locally in your browser.");
    }
  });

  // Batch download
  downloadAllBtn.addEventListener("click", function () {
    const processed = files.filter(function (it) { return it.compressedUrl; });
    if (processed.length === 0) return;

    processed.forEach(function (item, idx) {
      setTimeout(function () {
        const link = document.createElement("a");
        link.href = item.compressedUrl;
        link.download = item.outputName || item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 250);
    });
  });
})();
