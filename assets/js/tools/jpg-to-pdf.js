(function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const fileList = document.getElementById("file-list");
  const pageSizeChips = document.querySelectorAll(".chip-option[data-pagesize]");
  const createBtn = document.getElementById("create-btn");
  const statusLine = document.getElementById("status-line");
  const resultPanel = document.getElementById("result-panel");
  const resultOriginal = document.getElementById("result-original");
  const resultCompressed = document.getElementById("result-compressed");
  const resultSaved = document.getElementById("result-saved");
  const downloadLink = document.getElementById("download-link");

  let items = []; // { id, file, url }
  let pageSize = "fit";
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

  function renderList() {
    fileList.innerHTML = "";
    items.forEach(function (item, index) {
      const row = document.createElement("div");
      row.className = "file-chip";
      row.style.marginTop = "8px";
      row.innerHTML =
        '<img class="file-chip__thumb" src="' + item.url + '" alt="">' +
        '<div><div class="file-chip__name">' + (index + 1) + ". " + escapeHtml(item.file.name) + '</div>' +
        '<div class="file-chip__meta">' + bytesToSize(item.file.size) + '</div></div>' +
        '<div style="margin-left:auto; display:flex; gap:4px;">' +
        '<button type="button" class="file-chip__remove" data-move="up" data-id="' + item.id + '" aria-label="Move up">&uarr;</button>' +
        '<button type="button" class="file-chip__remove" data-move="down" data-id="' + item.id + '" aria-label="Move down">&darr;</button>' +
        '<button type="button" class="file-chip__remove" data-remove="' + item.id + '" aria-label="Remove">&times;</button>' +
        "</div>";
      fileList.appendChild(row);
    });
    createBtn.disabled = items.length === 0;
    resultPanel.classList.remove("is-visible");
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function addFiles(fileArr) {
    let rejected = 0;
    Array.from(fileArr).forEach(function (file) {
      if (!/^image\/(jpeg|png)$/.test(file.type)) { rejected++; return; }
      items.push({ id: ++idCounter, file: file, url: URL.createObjectURL(file) });
    });
    if (rejected > 0) setStatus(rejected + " file(s) skipped — only JPG and PNG are supported.", true);
    else setStatus("");
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
    const removeId = e.target.getAttribute("data-remove");
    const moveId = e.target.getAttribute("data-move");
    if (removeId) {
      items = items.filter(function (it) { return String(it.id) !== removeId; });
      renderList();
      return;
    }
    if (moveId) {
      const id = parseInt(e.target.getAttribute("data-id"), 10);
      const idx = items.findIndex(function (it) { return it.id === id; });
      const swapWith = moveId === "up" ? idx - 1 : idx + 1;
      if (swapWith >= 0 && swapWith < items.length) {
        const tmp = items[idx];
        items[idx] = items[swapWith];
        items[swapWith] = tmp;
        renderList();
      }
    }
  });

  pageSizeChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      pageSizeChips.forEach(function (c) { c.classList.remove("is-selected"); c.setAttribute("aria-pressed", "false"); });
      chip.classList.add("is-selected");
      chip.setAttribute("aria-pressed", "true");
      pageSize = chip.getAttribute("data-pagesize");
    });
  });

  function fileToArrayBuffer(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  function getImageDims(url) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.onload = function () { resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
      img.onerror = reject;
      img.src = url;
    });
  }

  createBtn.addEventListener("click", async function () {
    if (items.length === 0 || !window.PDFLib) {
      setStatus(!window.PDFLib ? "PDF engine failed to load — check your connection and retry." : "", true);
      return;
    }
    createBtn.disabled = true;
    setStatus("Building PDF…");

    try {
      const { PDFDocument } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();
      const A4 = [595.28, 841.89];
      const LETTER = [612, 792];
      let totalOriginal = 0;

      for (const item of items) {
        totalOriginal += item.file.size;
        const bytes = await fileToArrayBuffer(item.file);
        const dims = await getImageDims(item.url);
        const embedded = item.file.type === "image/png"
          ? await pdfDoc.embedPng(bytes)
          : await pdfDoc.embedJpg(bytes);

        if (pageSize === "fit") {
          const page = pdfDoc.addPage([dims.w, dims.h]);
          page.drawImage(embedded, { x: 0, y: 0, width: dims.w, height: dims.h });
        } else {
          const target = pageSize === "a4" ? A4 : LETTER;
          const page = pdfDoc.addPage(target);
          const margin = 24;
          const maxW = target[0] - margin * 2;
          const maxH = target[1] - margin * 2;
          const ratio = Math.min(maxW / dims.w, maxH / dims.h);
          const drawW = dims.w * ratio;
          const drawH = dims.h * ratio;
          page.drawImage(embedded, {
            x: (target[0] - drawW) / 2,
            y: (target[1] - drawH) / 2,
            width: drawW,
            height: drawH,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      resultOriginal.textContent = items.length + (items.length === 1 ? " image" : " images");
      resultCompressed.textContent = bytesToSize(blob.size);
      resultSaved.textContent = items.length + (items.length === 1 ? " page" : " pages");

      downloadLink.href = url;
      downloadLink.download = "images.pdf";
      resultPanel.classList.add("is-visible");
      setStatus("Done — PDF ready.");
      resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      setStatus("Couldn't build the PDF: " + err.message, true);
    } finally {
      createBtn.disabled = false;
    }
  });
})();
