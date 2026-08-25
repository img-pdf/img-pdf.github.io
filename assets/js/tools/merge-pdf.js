(function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const fileList = document.getElementById("file-list");
  const mergeBtn = document.getElementById("merge-btn");
  const statusLine = document.getElementById("status-line");
  const resultPanel = document.getElementById("result-panel");
  const resultOriginal = document.getElementById("result-original");
  const resultCompressed = document.getElementById("result-compressed");
  const resultSaved = document.getElementById("result-saved");
  const downloadLink = document.getElementById("download-link");

  let items = [];
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
    items.forEach(function (item, index) {
      const row = document.createElement("div");
      row.className = "file-chip";
      row.style.marginTop = "8px";
      row.innerHTML =
        '<div class="file-chip__thumb" style="display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:0.7rem;color:var(--muted);">PDF</div>' +
        '<div><div class="file-chip__name">' + (index + 1) + ". " + escapeHtml(item.file.name) + '</div>' +
        '<div class="file-chip__meta">' + bytesToSize(item.file.size) + '</div></div>' +
        '<div style="margin-left:auto; display:flex; gap:4px;">' +
        '<button type="button" class="file-chip__remove" data-move="up" data-id="' + item.id + '" aria-label="Move up">&uarr;</button>' +
        '<button type="button" class="file-chip__remove" data-move="down" data-id="' + item.id + '" aria-label="Move down">&darr;</button>' +
        '<button type="button" class="file-chip__remove" data-remove="' + item.id + '" aria-label="Remove">&times;</button>' +
        "</div>";
      fileList.appendChild(row);
    });
    mergeBtn.disabled = items.length < 2;
    resultPanel.classList.remove("is-visible");
  }

  function addFiles(fileArr) {
    let rejected = 0;
    Array.from(fileArr).forEach(function (file) {
      if (file.type !== "application/pdf") { rejected++; return; }
      items.push({ id: ++idCounter, file: file });
    });
    setStatus(rejected > 0 ? rejected + " file(s) skipped — only PDF files are supported." : "");
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
        const tmp = items[idx]; items[idx] = items[swapWith]; items[swapWith] = tmp;
        renderList();
      }
    }
  });

  function fileToArrayBuffer(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  mergeBtn.addEventListener("click", async function () {
    if (items.length < 2 || !window.PDFLib) {
      setStatus(!window.PDFLib ? "PDF engine failed to load — check your connection and retry." : "", true);
      return;
    }
    mergeBtn.disabled = true;
    setStatus("Merging…");

    try {
      const { PDFDocument } = window.PDFLib;
      const mergedPdf = await PDFDocument.create();
      let totalOriginal = 0;
      let totalPages = 0;

      for (const item of items) {
        totalOriginal += item.file.size;
        const bytes = await fileToArrayBuffer(item.file);
        const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pageIndices = srcDoc.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);
        copiedPages.forEach(function (page) { mergedPdf.addPage(page); });
        totalPages += pageIndices.length;
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      resultOriginal.textContent = items.length + " files";
      resultCompressed.textContent = bytesToSize(blob.size);
      resultSaved.textContent = totalPages + " pages";

      downloadLink.href = url;
      downloadLink.download = "merged.pdf";
      resultPanel.classList.add("is-visible");
      setStatus("Done — merged PDF ready.");
      resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      setStatus("Couldn't merge these PDFs: " + err.message, true);
    } finally {
      mergeBtn.disabled = false;
    }
  });
})();
