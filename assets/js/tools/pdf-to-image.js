/**
 * pdf-to-image.js
 * Client-side PDF to JPG / PNG Converter using local PDF.js and JSZip.
 * 100% in-browser processing with zero server uploads.
 */

(function () {
  'use strict';

  // Configure PDF.js worker to use local bundle
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/js/vendor/pdf.worker.min.js';
  }

  // DOM Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const toolControls = document.getElementById('tool-controls');
  const fileDetails = document.getElementById('file-details');
  const fileNameDisplay = document.getElementById('file-name-display');
  const fileMetaDisplay = document.getElementById('file-meta-display');
  const removeFileBtn = document.getElementById('remove-file-btn');

  const formatRadios = document.querySelectorAll('input[name="output-format"]');
  const qualityContainer = document.getElementById('quality-container');
  const qualitySlider = document.getElementById('quality-slider');
  const qualityValue = document.getElementById('quality-value');
  const scaleSelect = document.getElementById('scale-select');

  const selectAllBtn = document.getElementById('select-all-btn');
  const deselectAllBtn = document.getElementById('deselect-all-btn');
  const selectedCountDisplay = document.getElementById('selected-count-display');

  const progressWrap = document.getElementById('progress-wrap');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');

  const downloadZipBtn = document.getElementById('download-zip-btn');
  const pagesContainer = document.getElementById('pages-container');
  const statusMessage = document.getElementById('status-message');

  // Application State
  let currentDoc = null;
  let pdfArrayBuffer = null;
  let currentFileBaseName = 'document';
  let totalPages = 0;
  let selectedPages = new Set();
  let renderedCanvases = new Map(); // pageNum -> HTMLCanvasElement
  let isConverting = false;

  // Format bytes helper
  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  }

  // Safe error display
  function showError(msg) {
    if (!statusMessage) return;
    statusMessage.textContent = msg;
    statusMessage.className = 'status-line is-error';
    statusMessage.style.display = 'block';
  }

  function clearError() {
    if (!statusMessage) return;
    statusMessage.textContent = '';
    statusMessage.style.display = 'none';
  }

  function setStatus(msg) {
    if (!statusMessage) return;
    statusMessage.textContent = msg;
    statusMessage.className = 'status-line';
    statusMessage.style.display = 'block';
  }

  // Update selection UI count
  function updateSelectionCount() {
    if (selectedCountDisplay) {
      selectedCountDisplay.textContent = `${selectedPages.size} of ${totalPages} page${totalPages === 1 ? '' : 's'} selected`;
    }
    if (downloadZipBtn) {
      downloadZipBtn.disabled = selectedPages.size === 0 || isConverting;
    }
  }

  // Clean memory on reset
  function resetTool() {
    currentDoc = null;
    pdfArrayBuffer = null;
    currentFileBaseName = 'document';
    totalPages = 0;
    selectedPages.clear();
    isConverting = false;

    // Clear canvases
    renderedCanvases.forEach(canvas => {
      canvas.width = 0;
      canvas.height = 0;
    });
    renderedCanvases.clear();

    if (fileInput) fileInput.value = '';
    if (pagesContainer) pagesContainer.innerHTML = '';
    if (toolControls) toolControls.style.display = 'none';
    if (fileDetails) fileDetails.style.display = 'none';
    if (progressWrap) progressWrap.style.display = 'none';
    if (dropzone) dropzone.style.display = 'block';
    clearError();
  }

  // Load and parse PDF file
  async function handleFile(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showError('Please select a valid PDF document (.pdf format).');
      return;
    }

    clearError();
    setStatus('Loading PDF document in memory...');

    // Extract clean base filename
    currentFileBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'converted_pdf';

    // Telemetry: file upload (no filename or content)
    if (typeof window.trackImgPdfEvent === 'function') {
      window.trackImgPdfEvent('file_upload', {
        tool_name: 'PDF to Image',
        tool_category: 'PDF Tools',
        file_count: 1,
        file_types: 'application/pdf',
        total_size_mb: (file.size / (1024 * 1024)).toFixed(2)
      });
    }

    try {
      pdfArrayBuffer = await file.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: pdfArrayBuffer,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true
      });

      currentDoc = await loadingTask.promise;
      totalPages = currentDoc.numPages;

      if (totalPages === 0) {
        showError('The uploaded PDF contains no pages.');
        return;
      }

      // Display file details
      if (fileNameDisplay) fileNameDisplay.textContent = file.name;
      if (fileMetaDisplay) fileMetaDisplay.textContent = `${totalPages} page${totalPages === 1 ? '' : 's'} · ${formatBytes(file.size)}`;

      if (dropzone) dropzone.style.display = 'none';
      if (fileDetails) fileDetails.style.display = 'flex';
      if (toolControls) toolControls.style.display = 'block';

      // Select all pages by default
      selectedPages = new Set();
      for (let i = 1; i <= totalPages; i++) {
        selectedPages.add(i);
      }
      updateSelectionCount();

      // Render page previews
      await renderAllPagePreviews();
      clearError();
    } catch (err) {
      console.error('[PDF to Image] Error parsing PDF:', err);
      if (err.name === 'PasswordException') {
        showError('This PDF document is password-protected. Please remove the password or decrypt it before converting.');
      } else {
        showError('Unable to open this PDF document. The file may be damaged or using an unsupported PDF specification.');
      }
      resetTool();
    }
  }

  // Render thumbnail cards for all pages with async yield
  async function renderAllPagePreviews() {
    if (!currentDoc || !pagesContainer) return;

    pagesContainer.innerHTML = '';
    renderedCanvases.clear();

    const scale = parseFloat(scaleSelect ? scaleSelect.value : '1.5') || 1.5;

    // Create cards skeleton first
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const card = document.createElement('div');
      card.className = 'pdf-page-card';
      card.id = `page-card-${pageNum}`;

      const header = document.createElement('div');
      header.className = 'pdf-page-card__header';

      const label = document.createElement('label');
      label.className = 'pdf-page-card__label';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = selectedPages.has(pageNum);
      checkbox.dataset.page = pageNum;
      checkbox.setAttribute('aria-label', `Select page ${pageNum}`);

      checkbox.addEventListener('change', function () {
        if (this.checked) {
          selectedPages.add(pageNum);
          card.classList.remove('is-deselected');
        } else {
          selectedPages.delete(pageNum);
          card.classList.add('is-deselected');
        }
        updateSelectionCount();
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` Page ${pageNum}`));
      header.appendChild(label);

      const previewWrap = document.createElement('div');
      previewWrap.className = 'pdf-page-card__preview';
      previewWrap.id = `preview-wrap-${pageNum}`;

      const placeholder = document.createElement('div');
      placeholder.className = 'pdf-page-card__loading';
      placeholder.textContent = `Rendering page ${pageNum}...`;
      previewWrap.appendChild(placeholder);

      const actions = document.createElement('div');
      actions.className = 'pdf-page-card__actions';

      const singleDownloadBtn = document.createElement('button');
      singleDownloadBtn.type = 'button';
      singleDownloadBtn.className = 'btn btn--outline btn--sm';
      singleDownloadBtn.id = `dl-btn-${pageNum}`;
      singleDownloadBtn.textContent = 'Save Image';
      singleDownloadBtn.disabled = true;

      singleDownloadBtn.addEventListener('click', () => downloadSinglePage(pageNum));

      actions.appendChild(singleDownloadBtn);

      card.appendChild(header);
      card.appendChild(previewWrap);
      card.appendChild(actions);

      pagesContainer.appendChild(card);
    }

    // Render pages sequentially to avoid browser UI thread lock
    if (progressWrap) progressWrap.style.display = 'block';

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pct = Math.round((pageNum / totalPages) * 100);
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressText) progressText.textContent = `Rendering previews: Page ${pageNum} of ${totalPages} (${pct}%)`;

      try {
        const page = await currentDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d', { alpha: false });

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        await page.render(renderContext).promise;

        renderedCanvases.set(pageNum, canvas);

        const wrap = document.getElementById(`preview-wrap-${pageNum}`);
        if (wrap) {
          wrap.innerHTML = '';
          const displayImg = document.createElement('img');
          displayImg.src = canvas.toDataURL('image/jpeg', 0.8);
          displayImg.alt = `Page ${pageNum} preview`;
          displayImg.className = 'pdf-page-card__img';
          wrap.appendChild(displayImg);
        }

        const dlBtn = document.getElementById(`dl-btn-${pageNum}`);
        if (dlBtn) dlBtn.disabled = false;
      } catch (renderErr) {
        console.warn(`[PDF to Image] Warning rendering preview for page ${pageNum}:`, renderErr);
        const wrap = document.getElementById(`preview-wrap-${pageNum}`);
        if (wrap) {
          wrap.innerHTML = '<span class="status-error">Preview unavailable</span>';
        }
      }

      // Small tick yield to keep UI responsive
      await new Promise(r => setTimeout(r, 10));
    }

    if (progressWrap) progressWrap.style.display = 'none';
  }

  // Convert canvas to Blob based on current user options
  async function canvasToBlob(canvas) {
    const format = document.querySelector('input[name="output-format"]:checked')?.value || 'jpeg';
    const quality = parseFloat(qualitySlider ? qualitySlider.value : '85') / 100;
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const qValue = format === 'png' ? undefined : quality;

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), mimeType, qValue);
    });
  }

  // Trigger browser download of blob
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // Download a single page image
  async function downloadSinglePage(pageNum) {
    const canvas = renderedCanvases.get(pageNum);
    if (!canvas) {
      showError(`Page ${pageNum} has not been rendered yet.`);
      return;
    }

    const format = document.querySelector('input[name="output-format"]:checked')?.value || 'jpeg';
    const ext = format === 'png' ? 'png' : 'jpg';
    const filename = `${currentFileBaseName}_page_${pageNum}.${ext}`;

    const blob = await canvasToBlob(canvas);
    if (blob) {
      triggerDownload(blob, filename);

      if (typeof window.trackImgPdfEvent === 'function') {
        window.trackImgPdfEvent('tool_complete', {
          tool_name: 'PDF to Image',
          tool_category: 'PDF Tools',
          action_type: 'single_download',
          format: ext
        });
      }
    }
  }

  // Download all selected pages packed as a ZIP archive
  async function downloadZip() {
    if (selectedPages.size === 0 || isConverting) return;
    if (typeof JSZip === 'undefined') {
      showError('ZIP compression library is loading. Please try again in a moment.');
      return;
    }

    isConverting = true;
    if (downloadZipBtn) downloadZipBtn.disabled = true;
    if (progressWrap) progressWrap.style.display = 'block';

    const format = document.querySelector('input[name="output-format"]:checked')?.value || 'jpeg';
    const ext = format === 'png' ? 'png' : 'jpg';
    const zip = new JSZip();

    const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
    let processed = 0;

    for (const pageNum of sortedPages) {
      processed++;
      const pct = Math.round((processed / sortedPages.length) * 80);
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressText) progressText.textContent = `Processing page ${processed} of ${sortedPages.length}...`;

      let canvas = renderedCanvases.get(pageNum);

      // If not rendered yet, render on demand
      if (!canvas && currentDoc) {
        try {
          const page = await currentDoc.getPage(pageNum);
          const scale = parseFloat(scaleSelect ? scaleSelect.value : '1.5') || 1.5;
          const viewport = page.getViewport({ scale: scale });
          canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d', { alpha: false });
          await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        } catch (e) {
          console.warn(`Failed to render page ${pageNum} for ZIP:`, e);
        }
      }

      if (canvas) {
        const blob = await canvasToBlob(canvas);
        if (blob) {
          const filename = `${currentFileBaseName}_page_${String(pageNum).padStart(3, '0')}.${ext}`;
          zip.file(filename, blob);
        }
      }

      await new Promise(r => setTimeout(r, 5));
    }

    if (progressText) progressText.textContent = 'Compressing into ZIP archive...';
    if (progressBar) progressBar.style.width = '90%';

    try {
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      }, metadata => {
        const zipPct = 80 + Math.round(metadata.percent * 0.2);
        if (progressBar) progressBar.style.width = `${zipPct}%`;
      });

      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = 'ZIP download ready!';

      triggerDownload(zipBlob, `${currentFileBaseName}_images.zip`);

      if (typeof window.trackImgPdfEvent === 'function') {
        window.trackImgPdfEvent('tool_complete', {
          tool_name: 'PDF to Image',
          tool_category: 'PDF Tools',
          action_type: 'zip_download',
          pages_count: sortedPages.length,
          format: ext
        });
      }
    } catch (zipErr) {
      console.error('[PDF to Image] ZIP creation failed:', zipErr);
      showError('Failed to generate ZIP file. Please try downloading pages individually.');
    } finally {
      isConverting = false;
      if (downloadZipBtn) downloadZipBtn.disabled = selectedPages.size === 0;
      setTimeout(() => {
        if (progressWrap) progressWrap.style.display = 'none';
      }, 2000);
    }
  }

  // Attach DOM Listeners
  if (fileInput) {
    fileInput.addEventListener('change', e => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });
  }

  if (dropzone) {
    dropzone.addEventListener('click', () => fileInput && fileInput.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('is-dragover');
      });
    });

    dropzone.addEventListener('drop', e => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files[0]) {
        handleFile(dt.files[0]);
      }
    });
  }

  if (removeFileBtn) {
    removeFileBtn.addEventListener('click', resetTool);
  }

  // Format selection change (JPG vs PNG)
  formatRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const format = document.querySelector('input[name="output-format"]:checked')?.value;
      if (qualityContainer) {
        qualityContainer.style.display = format === 'jpeg' ? 'block' : 'none';
      }
    });
  });

  // Quality slider change
  if (qualitySlider && qualityValue) {
    qualitySlider.addEventListener('input', () => {
      qualityValue.textContent = `${qualitySlider.value}%`;
    });
  }

  // Scale / DPI change triggers re-render if PDF is loaded
  if (scaleSelect) {
    scaleSelect.addEventListener('change', () => {
      if (currentDoc) {
        renderAllPagePreviews();
      }
    });
  }

  // Select all / deselect all
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      selectedPages = new Set();
      for (let i = 1; i <= totalPages; i++) selectedPages.add(i);
      document.querySelectorAll('#pages-container input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
        const card = cb.closest('.pdf-page-card');
        if (card) card.classList.remove('is-deselected');
      });
      updateSelectionCount();
    });
  }

  if (deselectAllBtn) {
    deselectAllBtn.addEventListener('click', () => {
      selectedPages.clear();
      document.querySelectorAll('#pages-container input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        const card = cb.closest('.pdf-page-card');
        if (card) card.classList.add('is-deselected');
      });
      updateSelectionCount();
    });
  }

  // Download ZIP
  if (downloadZipBtn) {
    downloadZipBtn.addEventListener('click', downloadZip);
  }

})();
