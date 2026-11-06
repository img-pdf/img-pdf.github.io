(function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const fileList = document.getElementById("file-list");
  const pageSizeChips = document.querySelectorAll(".chip-option[data-pagesize]");
  const orientationChips = document.querySelectorAll(".chip-option[data-orientation]");
  const marginChips = document.querySelectorAll(".chip-option[data-margin]");
  const createBtn = document.getElementById("create-btn");
  const clearBtn = document.getElementById("clear-btn");
  const statusLine = document.getElementById("status-line");
  const resultPanel = document.getElementById("result-panel");
  const resultOriginal = document.getElementById("result-original");
  const resultCompressed = document.getElementById("result-compressed");
  const resultSaved = document.getElementById("result-saved");
  const downloadLink = document.getElementById("download-link");

  let items = []; // { id, file, url }
  let pageSize = "fit";
  let pageOrientation = "auto";
  let pageMargin = 0; // points
  let idCounter = 0;

  function bytesToSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function setStatus(msg, isError) {
    statusLine.textContent = msg || "";
    statusLine.classList.toggle("is-error", !!isError);
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderList() {
    fileList.innerHTML = "";
    if (items.length === 0) {
      createBtn.disabled = true;
      if (clearBtn) clearBtn.style.display = "none";
      resultPanel.classList.remove("is-visible");
      return;
    }

    if (clearBtn) clearBtn.style.display = "inline-flex";
    createBtn.disabled = false;

    items.forEach(function (item, index) {
      const row = document.createElement("div");
      row.className = "file-chip";
      row.style.marginTop = "8px";
      row.innerHTML =
        '<img class="file-chip__thumb" src="' + item.url + '" alt="">' +
        '<div><div class="file-chip__name">Page ' + (index + 1) + ": " + escapeHtml(item.file.name) + '</div>' +
        '<div class="file-chip__meta">' + bytesToSize(item.file.size) + '</div></div>' +
        '<div style="margin-left:auto; display:flex; gap:4px;">' +
        '<button type="button" class="file-chip__remove" data-move="up" data-id="' + item.id + '" aria-label="Move page up" ' + (index === 0 ? 'disabled style="opacity:0.3;"' : '') + '>&uarr;</button>' +
        '<button type="button" class="file-chip__remove" data-move="down" data-id="' + item.id + '" aria-label="Move page down" ' + (index === items.length - 1 ? 'disabled style="opacity:0.3;"' : '') + '>&darr;</button>' +
        '<button type="button" class="file-chip__remove" data-remove="' + item.id + '" aria-label="Remove page">&times;</button>' +
        "</div>";
      fileList.appendChild(row);
    });
  }

  function addFiles(fileArr) {
    let rejected = 0;
    Array.from(fileArr).forEach(function (file) {
      if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) { rejected++; return; }
      items.push({ id: ++idCounter, file: file, url: URL.createObjectURL(file) });
    });
    if (rejected > 0) setStatus(rejected + " file(s) skipped — supports JPG, PNG, and WebP.", true);
    else setStatus(items.length + " image" + (items.length > 1 ? "s" : "") + " loaded. Ready to build PDF.");
    renderList();
  }

  dropzone.addEventListener("click", function () { fileInput.click(); });
  dropzone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener("change", function (e) { addFiles(e.target.files); fileInput.value = ""; });

  ["dragenter", "dragover"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.add("is-dragover"); });
  });
  ["dragleave", "drop"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.remove("is-dragover"); });
  });
  dropzone.addEventListener("drop", function (e) { addFiles(e.dataTransfer.files); });

  fileList.addEventListener("click", function (e) {
    const removeBtn = e.target.closest("[data-remove]");
    const moveBtn = e.target.closest("[data-move]");
    if (removeBtn) {
      const id = removeBtn.getAttribute("data-remove");
      items = items.filter(function (it) { return String(it.id) !== id; });
      renderList();
      return;
    }
    if (moveBtn) {
      const move = moveBtn.getAttribute("data-move");
      const id = parseInt(moveBtn.getAttribute("data-id"), 10);
      const idx = items.findIndex(function (it) { return it.id === id; });
      const swapWith = move === "up" ? idx - 1 : idx + 1;
      if (swapWith >= 0 && swapWith < items.length) {
        const tmp = items[idx];
        items[idx] = items[swapWith];
        items[swapWith] = tmp;
        renderList();
      }
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      items.forEach(function (it) { if (it.url) URL.revokeObjectURL(it.url); });
      items = [];
      renderList();
      setStatus("Queue cleared.");
    });
  }

  pageSizeChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      pageSizeChips.forEach(function (c) { c.classList.remove("is-selected"); c.setAttribute("aria-pressed", "false"); });
      chip.classList.add("is-selected");
      chip.setAttribute("aria-pressed", "true");
      pageSize = chip.getAttribute("data-pagesize");
    });
  });

  orientationChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      orientationChips.forEach(function (c) { c.classList.remove("is-selected"); c.setAttribute("aria-pressed", "false"); });
      chip.classList.add("is-selected");
      chip.setAttribute("aria-pressed", "true");
      pageOrientation = chip.getAttribute("data-orientation");
    });
  });

  marginChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      marginChips.forEach(function (c) { c.classList.remove("is-selected"); c.setAttribute("aria-pressed", "false"); });
      chip.classList.add("is-selected");
      chip.setAttribute("aria-pressed", "true");
      pageMargin = parseInt(chip.getAttribute("data-margin"), 10);
    });
  });

  function fileToUint8Array(file) {
    return new Promise(function (resolve, reject) {
      // If image is webp or gif, convert to png/jpg via canvas first for pdf-lib compatibility
      if (file.type === "image/webp" || file.type === "image/gif") {
        const img = new Image();
        const objUrl = URL.createObjectURL(file);
        img.onload = function () {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(function (blob) {
            URL.revokeObjectURL(objUrl);
            const reader = new FileReader();
            reader.onload = function () { resolve({ bytes: new Uint8Array(reader.result), type: "image/png", w: img.naturalWidth, h: img.naturalHeight }); };
            reader.onerror = reject;
            reader.readAsArrayBuffer(blob);
          }, "image/png");
        };
        img.onerror = reject;
        img.src = objUrl;
      } else {
        const img = new Image();
        const objUrl = URL.createObjectURL(file);
        img.onload = function () {
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          URL.revokeObjectURL(objUrl);
          const reader = new FileReader();
          reader.onload = function () {
            resolve({ bytes: new Uint8Array(reader.result), type: file.type, w: w, h: h });
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        };
        img.onerror = reject;
        img.src = objUrl;
      }
    });
  }

  createBtn.addEventListener("click", async function () {
    if (items.length === 0 || !window.PDFLib) {
      setStatus(!window.PDFLib ? "PDF generation engine failed to load. Please check network connection." : "", true);
      return;
    }
    createBtn.disabled = true;
    setStatus("Assembling PDF document…");

    try {
      const { PDFDocument } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();
      const A4 = [595.28, 841.89];
      const LETTER = [612, 792];
      let totalOriginal = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        totalOriginal += item.file.size;
        setStatus("Processing image " + (i + 1) + " of " + items.length + "…");

        const converted = await fileToUint8Array(item.file);
        const embedded = converted.type === "image/png"
          ? await pdfDoc.embedPng(converted.bytes)
          : await pdfDoc.embedJpg(converted.bytes);

        const dims = { w: converted.w, h: converted.h };

        if (pageSize === "fit") {
          const page = pdfDoc.addPage([dims.w, dims.h]);
          page.drawImage(embedded, { x: 0, y: 0, width: dims.w, height: dims.h });
        } else {
          let baseSize = pageSize === "a4" ? [...A4] : [...LETTER];
          const isLandscape = pageOrientation === "landscape" || (pageOrientation === "auto" && dims.w > dims.h);
          if (isLandscape && baseSize[0] < baseSize[1]) {
            baseSize = [baseSize[1], baseSize[0]];
          } else if (!isLandscape && baseSize[0] > baseSize[1]) {
            baseSize = [baseSize[1], baseSize[0]];
          }

          const page = pdfDoc.addPage(baseSize);
          const margin = pageMargin;
          const maxW = baseSize[0] - margin * 2;
          const maxH = baseSize[1] - margin * 2;
          const ratio = Math.min(maxW / dims.w, maxH / dims.h);
          const drawW = dims.w * ratio;
          const drawH = dims.h * ratio;

          page.drawImage(embedded, {
            x: (baseSize[0] - drawW) / 2,
            y: (baseSize[1] - drawH) / 2,
            width: drawW,
            height: drawH,
          });
        }
      }

      setStatus("Finalizing PDF compression…");
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      resultOriginal.textContent = items.length + (items.length === 1 ? " image" : " images");
      resultCompressed.textContent = bytesToSize(blob.size);
      resultSaved.textContent = items.length + (items.length === 1 ? " page" : " pages");

      downloadLink.href = url;
      downloadLink.download = "imgpdf-document.pdf";
      resultPanel.classList.add("is-visible");
      setStatus("Success! Your PDF is ready for download.");
      resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      console.error(err);
      setStatus("Error compiling PDF: " + err.message, true);
    } finally {
      createBtn.disabled = false;
    }
  });
})();
