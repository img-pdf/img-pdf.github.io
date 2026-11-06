(function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const batchList = document.getElementById("batch-list");
  const formatChips = document.querySelectorAll(".chip-option[data-format]");
  const qualitySlider = document.getElementById("quality");
  const qualityValue = document.getElementById("quality-value");
  const qualityRow = document.getElementById("quality-row");
  const convertBtn = document.getElementById("convert-btn");
  const downloadAllBtn = document.getElementById("download-all-btn");
  const clearAllBtn = document.getElementById("clear-all-btn");
  const statusLine = document.getElementById("status-line");
  const resultPanel = document.getElementById("result-panel");
  const resultOriginal = document.getElementById("result-original");
  const resultConverted = document.getElementById("result-converted");
  const resultCount = document.getElementById("result-count");

  let files = [];
  let selectedFormat = "webp";
  let idCounter = 0;

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

  function addFiles(newFiles) {
    if (!newFiles || newFiles.length === 0) return;
    let addedCount = 0;
    Array.from(newFiles).forEach(function (f) {
      if (!/^image\/(jpeg|png|webp|gif|svg\+xml)$/i.test(f.type) && !/\.(jpe?g|png|webp|gif)$/i.test(f.name)) return;
      files.push({
        id: ++idCounter,
        file: f,
        url: URL.createObjectURL(f),
        originalSize: f.size,
        name: f.name,
        convertedBlob: null,
        convertedUrl: null,
        convertedSize: null
      });
      addedCount++;
    });

    if (addedCount === 0) {
      setStatus("No valid image files detected. Please provide JPG, PNG, WebP, or GIF files.", true);
      return;
    }

    setStatus(files.length + " image" + (files.length > 1 ? "s" : "") + " loaded. Ready to convert to " + selectedFormat.toUpperCase() + ".");
    convertBtn.disabled = false;
    clearAllBtn.style.display = "inline-flex";
    renderBatchList();
  }

  function renderBatchList() {
    if (files.length === 0) {
      batchList.innerHTML = "";
      batchList.style.display = "none";
      convertBtn.disabled = true;
      downloadAllBtn.style.display = "none";
      clearAllBtn.style.display = "none";
      resultPanel.classList.remove("is-visible");
      return;
    }

    batchList.style.display = "block";
    batchList.innerHTML = files.map(function (item, idx) {
      const statusBadge = item.convertedBlob
        ? '<span class="tag tag--good">Converted</span>'
        : '<span class="tag">Pending</span>';

      const downloadBtn = item.convertedUrl
        ? '<a href="' + item.convertedUrl + '" download="' + escapeHtml(item.outputName || item.name) + '" class="mini-btn" style="color:var(--good);font-weight:600;">Download ' + escapeHtml(selectedFormat.toUpperCase()) + '</a>'
        : '';

      const sizeInfo = item.convertedSize
        ? bytesToSize(item.originalSize) + " &rarr; " + bytesToSize(item.convertedSize)
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
            downloadBtn +
            '<button type="button" class="file-chip__remove remove-item-btn" data-id="' + item.id + '" aria-label="Remove">&times;</button>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

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

  batchList.addEventListener("click", function (e) {
    const removeBtn = e.target.closest(".remove-item-btn");
    if (removeBtn) {
      const id = parseInt(removeBtn.getAttribute("data-id"), 10);
      const idx = files.findIndex(function (it) { return it.id === id; });
      if (idx !== -1) {
        if (files[idx].url) URL.revokeObjectURL(files[idx].url);
        if (files[idx].convertedUrl) URL.revokeObjectURL(files[idx].convertedUrl);
        files.splice(idx, 1);
        renderBatchList();
        updateSummaryStats();
      }
    }
  });

  clearAllBtn.addEventListener("click", function () {
    files.forEach(function (it) {
      if (it.url) URL.revokeObjectURL(it.url);
      if (it.convertedUrl) URL.revokeObjectURL(it.convertedUrl);
    });
    files = [];
    renderBatchList();
    updateSummaryStats();
    setStatus("Queue cleared.");
  });

  formatChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      formatChips.forEach(function (c) { c.classList.remove("is-selected"); c.setAttribute("aria-pressed", "false"); });
      chip.classList.add("is-selected");
      chip.setAttribute("aria-pressed", "true");
      selectedFormat = chip.getAttribute("data-format");
      qualityRow.style.display = selectedFormat === "png" ? "none" : "flex";
      setStatus("Target format changed to " + selectedFormat.toUpperCase() + ". Click Convert when ready.");
    });
  });

  qualitySlider.addEventListener("input", function () {
    qualityValue.textContent = qualitySlider.value + "%";
  });

  function convertSingleFile(item, format, quality) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");

        const mime = format === "png" ? "image/png" : (format === "webp" ? "image/webp" : "image/jpeg");
        if (mime === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          function (blob) {
            if (!blob) {
              reject(new Error("Conversion failed for " + item.name));
              return;
            }
            const ext = format === "jpeg" ? "jpg" : format;
            const base = item.name.replace(/\.[^.]+$/, "");
            const outName = base + "." + ext;
            const url = URL.createObjectURL(blob);

            item.convertedBlob = blob;
            item.convertedUrl = url;
            item.convertedSize = blob.size;
            item.outputName = outName;
            resolve(item);
          },
          mime,
          mime === "image/png" ? undefined : quality
        );
      };
      img.onerror = function () {
        reject(new Error("Unable to load " + item.name));
      };
      img.src = item.url;
    });
  }

  function updateSummaryStats() {
    const processed = files.filter(function (it) { return it.convertedBlob; });
    if (processed.length === 0) {
      resultPanel.classList.remove("is-visible");
      return;
    }
    const origTotal = processed.reduce(function (sum, it) { return sum + it.originalSize; }, 0);
    const convTotal = processed.reduce(function (sum, it) { return sum + it.convertedSize; }, 0);

    resultOriginal.textContent = bytesToSize(origTotal);
    resultConverted.textContent = bytesToSize(convTotal);
    resultCount.textContent = processed.length + " file" + (processed.length > 1 ? "s" : "");
    resultPanel.classList.add("is-visible");
    downloadAllBtn.style.display = processed.length > 1 ? "inline-flex" : "none";
  }

  convertBtn.addEventListener("click", async function () {
    if (files.length === 0) return;
    convertBtn.disabled = true;
    const quality = parseInt(qualitySlider.value, 10) / 100;

    setStatus("Converting 0 of " + files.length + "…");
    let completed = 0;
    let hasError = false;

    for (let i = 0; i < files.length; i++) {
      try {
        await convertSingleFile(files[i], selectedFormat, quality);
        completed++;
        setStatus("Converted " + completed + " of " + files.length + "…");
        renderBatchList();
      } catch (err) {
        hasError = true;
        console.error(err);
      }
    }

    convertBtn.disabled = false;
    renderBatchList();
    updateSummaryStats();

    if (hasError) {
      setStatus("Conversion finished with some errors.", true);
    } else {
      setStatus("All images successfully converted to " + selectedFormat.toUpperCase() + "!");
    }
  });

  downloadAllBtn.addEventListener("click", function () {
    const processed = files.filter(function (it) { return it.convertedUrl; });
    if (processed.length === 0) return;

    processed.forEach(function (item, idx) {
      setTimeout(function () {
        const link = document.createElement("a");
        link.href = item.convertedUrl;
        link.download = item.outputName || item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 250);
    });
  });
})();
