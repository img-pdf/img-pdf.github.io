(function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const fileChip = document.getElementById("file-chip");
  const fileName = document.getElementById("file-chip-name");
  const fileMeta = document.getElementById("file-chip-meta");
  const removeBtn = document.getElementById("file-chip-remove");
  const splitBtn = document.getElementById("split-btn");
  const statusLine = document.getElementById("status-line");
  const pageRangeInput = document.getElementById("page-range");
  const splitModeChips = document.querySelectorAll(".chip-option[data-mode]");
  const rangeRow = document.getElementById("range-row");
  const resultPanel = document.getElementById("result-panel");
  const resultStats = document.getElementById("result-stats");
  const resultDownloads = document.getElementById("result-downloads");

  let currentFile = null;
  let pdfDoc = null;
  let totalPages = 0;
  let splitMode = "range"; // "range" or "all"

  function bytesToSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function setStatus(msg, isError) {
    statusLine.textContent = msg || "";
    statusLine.classList.toggle("is-error", !!isError);
  }

  function reset() {
    currentFile = null;
    pdfDoc = null;
    totalPages = 0;
    fileInput.value = "";
    fileChip.style.display = "none";
    dropzone.style.display = "block";
    splitBtn.disabled = true;
    resultPanel.classList.remove("is-visible");
    setStatus("");
  }

  async function handleFile(file) {
    if (!file || file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setStatus("Please select a valid PDF file.", true);
      return;
    }

    if (!window.PDFLib) {
      setStatus("PDF library is loading, please try again in a moment.", true);
      return;
    }

    setStatus("Reading PDF structure…");
    try {
      const buffer = await file.arrayBuffer();
      pdfDoc = await window.PDFLib.PDFDocument.load(buffer);
      totalPages = pdfDoc.getPageCount();
      currentFile = file;

      fileName.textContent = file.name;
      fileMeta.textContent = bytesToSize(file.size) + " · " + totalPages + " page" + (totalPages > 1 ? "s" : "");
      fileChip.style.display = "flex";
      dropzone.style.display = "none";
      splitBtn.disabled = false;
      pageRangeInput.placeholder = "e.g. 1-" + Math.min(3, totalPages) + ", " + totalPages;
      setStatus("PDF loaded successfully (" + totalPages + " pages). Ready to split.");
    } catch (err) {
      console.error(err);
      setStatus("Could not load PDF. It may be password-protected or corrupted.", true);
    }
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

  removeBtn.addEventListener("click", reset);

  splitModeChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      splitModeChips.forEach(function (c) { c.classList.remove("is-selected"); c.setAttribute("aria-pressed", "false"); });
      chip.classList.add("is-selected");
      chip.setAttribute("aria-pressed", "true");
      splitMode = chip.getAttribute("data-mode");
      rangeRow.style.display = splitMode === "all" ? "none" : "flex";
    });
  });

  function parsePageRange(rangeStr, maxPages) {
    const pages = new Set();
    const parts = rangeStr.split(",");
    for (let part of parts) {
      part = part.trim();
      if (!part) continue;
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start < 1 || end > maxPages || start > end) {
          throw new Error("Invalid range segment: " + part);
        }
        for (let i = start; i <= end; i++) {
          pages.add(i - 1);
        }
      } else {
        const p = parseInt(part, 10);
        if (isNaN(p) || p < 1 || p > maxPages) {
          throw new Error("Page number " + part + " is out of bounds (1 to " + maxPages + ")");
        }
        pages.add(p - 1);
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  }

  splitBtn.addEventListener("click", async function () {
    if (!pdfDoc || !currentFile) return;
    splitBtn.disabled = true;
    setStatus("Extracting pages…");
    resultDownloads.innerHTML = "";

    try {
      const { PDFDocument } = window.PDFLib;
      const baseName = currentFile.name.replace(/\.[^.]+$/, "");

      if (splitMode === "range") {
        const rangeText = pageRangeInput.value.trim() || ("1-" + totalPages);
        const indices = parsePageRange(rangeText, totalPages);

        if (indices.length === 0) {
          throw new Error("Please specify at least one valid page to extract.");
        }

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, indices);
        copiedPages.forEach(function (page) { newPdf.addPage(page); });

        const bytes = await newPdf.save();
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        resultStats.innerHTML =
          '<div class="result-stat"><div class="result-stat__label">Pages Extracted</div><div class="result-stat__value">' + indices.length + '</div></div>' +
          '<div class="result-stat"><div class="result-stat__label">New File Size</div><div class="result-stat__value">' + bytesToSize(blob.size) + '</div></div>';

        resultDownloads.innerHTML =
          '<a href="' + url + '" download="' + baseName + '-extracted.pdf" class="btn btn--primary">Download Extracted PDF (' + indices.length + ' Pages)</a>';

        resultPanel.classList.add("is-visible");
        setStatus("Success! Page extraction complete.");
      } else {
        // Split every page
        resultStats.innerHTML =
          '<div class="result-stat"><div class="result-stat__label">Total Split Files</div><div class="result-stat__value">' + totalPages + '</div></div>';

        const downloadLinks = [];
        for (let i = 0; i < totalPages; i++) {
          setStatus("Generating page " + (i + 1) + " of " + totalPages + "…");
          const singleDoc = await PDFDocument.create();
          const [copiedPage] = await singleDoc.copyPages(pdfDoc, [i]);
          singleDoc.addPage(copiedPage);
          const bytes = await singleDoc.save();
          const blob = new Blob([bytes], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);

          downloadLinks.push(
            '<div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--surface); border:1px solid var(--border); border-radius:6px; margin-bottom:6px;">' +
              '<span><strong>Page ' + (i + 1) + '</strong> (' + bytesToSize(blob.size) + ')</span>' +
              '<a href="' + url + '" download="' + baseName + '-page-' + (i + 1) + '.pdf" class="mini-btn" style="color:var(--accent); font-weight:600;">Download</a>' +
            '</div>'
          );
        }

        resultDownloads.innerHTML =
          '<div style="max-height:300px; overflow-y:auto; margin-bottom:12px;">' + downloadLinks.join("") + '</div>' +
          '<button type="button" class="btn btn--ghost" id="download-all-pages-btn">Download All ' + totalPages + ' Pages</button>';

        resultPanel.classList.add("is-visible");
        setStatus("Split all " + totalPages + " pages successfully.");

        document.getElementById("download-all-pages-btn").addEventListener("click", function () {
          const links = resultDownloads.querySelectorAll("a[download]");
          links.forEach(function (l, idx) {
            setTimeout(function () { l.click(); }, idx * 250);
          });
        });
      }

      resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      console.error(err);
      setStatus("Split failed: " + err.message, true);
    } finally {
      splitBtn.disabled = false;
    }
  });
})();
