/**
 * compress-pdf.js
 * Client-Side PDF Compression Engine using PDF.js and PDF-Lib.
 * 100% in-browser processing with zero server file transfers.
 * Multilingual aware (supports English & Brazilian Portuguese).
 */

(function () {
  'use strict';

  // Configure PDF.js worker
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/js/vendor/pdf.worker.min.js';
  }

  function getCurrentLang() {
    if (window.ImgPdfI18n && typeof window.ImgPdfI18n.getLocale === 'function') {
      return window.ImgPdfI18n.getLocale();
    }
    const p = window.location.pathname;
    if (p.startsWith('/pt-br/')) return 'pt-BR';
    if (p.startsWith('/es/')) return 'es';
    if (p.startsWith('/ja/')) return 'ja';
    if (p.startsWith('/fr/')) return 'fr';
    if (p.startsWith('/de/')) return 'de';
    if (p.startsWith('/ko/')) return 'ko';
    if (p.startsWith('/it/')) return 'it';
    return 'en';
  }

  const MSG = {
    en: {
      selectPdf: 'Please select a valid PDF file (.pdf).',
      passwordProtected: 'This PDF is password-protected. Please unlock it before compressing.',
      corruptError: 'Failed to parse the PDF document. The file may be damaged or incomplete.',
      processingPage: 'Compressing page {{current}} of {{total}}...',
      compiling: 'Optimizing and compiling final PDF stream...',
      ready: 'Compression complete! Ready to download.',
      saved: 'Saved {{percent}}% ({{orig}} → {{comp}})'
    },
    es: {
      selectPdf: 'Por favor, selecciona un archivo PDF válido (.pdf).',
      passwordProtected: 'Este PDF está protegido por contraseña. Desbloquéalo antes de comprimir.',
      corruptError: 'Error al procesar el PDF. El archivo puede estar dañado o incompleto.',
      processingPage: 'Comprimiendo página {{current}} de {{total}}...',
      compiling: 'Optimizando y generando el archivo PDF final...',
      ready: '¡Compresión completada! Listo para descargar.',
      saved: 'Ahorro del {{percent}}% ({{orig}} → {{comp}})'
    },
    ja: {
      selectPdf: '有効なPDFファイル（.pdf）を選択してください。',
      passwordProtected: 'このPDFはパスワードで保護されています。圧縮前に解除してください。',
      corruptError: 'PDFドキュメントの解析に失敗しました。ファイルが破損している可能性があります。',
      processingPage: 'ページ {{current}} / {{total}} を圧縮中...',
      compiling: '最適化と最終PDFストリームを生成中...',
      ready: '圧縮完了！すぐにダウンロードできます。',
      saved: '{{percent}}% 削減 ({{orig}} → {{comp}})'
    },
    fr: {
      selectPdf: 'Veuillez sélectionner un fichier PDF valide (.pdf).',
      passwordProtected: 'Ce PDF est protégé par mot de passe. Veuillez le déverrouiller avant la compression.',
      corruptError: 'Impossible d\'analyser le document PDF. Le fichier est peut-être corrompu ou incomplet.',
      processingPage: 'Compression de la page {{current}} sur {{total}}...',
      compiling: 'Optimisation et compilation du flux PDF final...',
      ready: 'Compression terminée ! Prêt pour le téléchargement.',
      saved: 'Économie de {{percent}}% ({{orig}} → {{comp}})'
    },
    de: {
      selectPdf: 'Bitte wählen Sie eine gültige PDF-Datei (.pdf) aus.',
      passwordProtected: 'Diese PDF-Datei ist passwortgeschützt. Bitte entsperren Sie sie vor der Komprimierung.',
      corruptError: 'PDF konnte nicht gelesen werden. Die Datei ist möglicherweise beschädigt.',
      processingPage: 'Seite {{current}} von {{total}} wird komprimiert...',
      compiling: 'Optimierung und Erstellung der fertigen PDF-Datei...',
      ready: 'Komprimierung abgeschlossen! Bereit zum Download.',
      saved: '{{percent}}% gespart ({{orig}} → {{comp}})'
    },
    'pt-BR': {
      selectPdf: 'Por favor, selecione um arquivo PDF válido (.pdf).',
      passwordProtected: 'Este PDF está protegido por senha. Remova a senha antes de comprimir.',
      corruptError: 'Falha ao processar o PDF. O arquivo pode estar corrompido ou incompleto.',
      processingPage: 'Comprimindo página {{current}} de {{total}}...',
      compiling: 'Otimizando e gerando arquivo PDF final...',
      ready: 'Compressão concluída com sucesso! Pronto para download.',
      saved: 'Economia de {{percent}}% ({{orig}} → {{comp}})'
    },
    ko: {
      selectPdf: '올바른 PDF 파일(.pdf)을 선택해 주세요.',
      passwordProtected: '암호로 보호된 PDF입니다. 압축하기 전에 암호를 해제해 주세요.',
      corruptError: 'PDF 문서를 분석하지 못했습니다. 파일이 손상되었을 수 있습니다.',
      processingPage: '{{total}}페이지 중 {{current}}페이지 압축 중...',
      compiling: '최종 PDF 스트림을 최적화 및 생성하는 중...',
      ready: '압축 완료! 즉시 다운로드 가능합니다.',
      saved: '{{percent}}% 용량 절약 ({{orig}} → {{comp}})'
    },
    it: {
      selectPdf: 'Seleziona un file PDF valido (.pdf).',
      passwordProtected: 'Questo PDF è protetto da password. Rimuovi la password prima di comprimere.',
      corruptError: 'Impossibile analizzare il file PDF. Il documento potrebbe essere danneggiato.',
      processingPage: 'Compressione pagina {{current}} di {{total}}...',
      compiling: 'Ottimizzazione e creazione del file PDF finale...',
      ready: 'Compressione completata! Pronto per il download.',
      saved: 'Risparmio del {{percent}}% ({{orig}} → {{comp}})'
    }
  };

  function getMsg(key, params) {
    const lang = getCurrentLang();
    let text = (MSG[lang] && MSG[lang][key]) || MSG.en[key] || '';
    if (params) {
      for (const k in params) {
        text = text.replace(new RegExp('{{' + k + '}}', 'g'), params[k]);
      }
    }
    return text;
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  }

  // DOM Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const fileDetails = document.getElementById('file-details');
  const fileNameDisplay = document.getElementById('file-name-display');
  const fileMetaDisplay = document.getElementById('file-meta-display');
  const removeFileBtn = document.getElementById('remove-file-btn');

  const presetBtns = document.querySelectorAll('.preset-btn[data-preset]');
  const qualitySlider = document.getElementById('quality-slider');
  const qualityValue = document.getElementById('quality-value');

  const compressBtn = document.getElementById('compress-btn');
  const downloadBtn = document.getElementById('download-btn');
  const resetBtn = document.getElementById('reset-btn');

  const progressWrap = document.getElementById('progress-wrap');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const statusLine = document.getElementById('status-line');

  const resultPanel = document.getElementById('result-panel');
  const resultOriginal = document.getElementById('result-original');
  const resultCompressed = document.getElementById('result-compressed');
  const resultSaved = document.getElementById('result-saved');

  // Application State
  let currentFile = null;
  let currentArrayBuffer = null;
  let pdfDocProxy = null;
  let totalPages = 0;
  let originalSizeBytes = 0;
  let compressedBlob = null;
  let compressedUrl = null;
  let isCompressing = false;

  // Compression presets mapping
  // scale multiplier & JPEG quality
  const PRESET_CONFIGS = {
    extreme: { scale: 0.85, quality: 0.50 },
    recommended: { scale: 1.0, quality: 0.72 },
    highQuality: { scale: 1.25, quality: 0.85 },
    custom: { scale: 1.0, quality: 0.72 }
  };

  let activePreset = 'recommended';
  let activeQuality = 72;

  // Preset button handling
  presetBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      presetBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      activePreset = btn.getAttribute('data-preset');

      if (PRESET_CONFIGS[activePreset]) {
        activeQuality = Math.round(PRESET_CONFIGS[activePreset].quality * 100);
        if (qualitySlider) qualitySlider.value = activeQuality;
        if (qualityValue) qualityValue.textContent = activeQuality + '%';
      }
    });
  });

  if (qualitySlider) {
    qualitySlider.addEventListener('input', function () {
      activeQuality = parseInt(this.value, 10);
      if (qualityValue) qualityValue.textContent = activeQuality + '%';
      // Mark as custom preset
      presetBtns.forEach(function (b) {
        if (b.getAttribute('data-preset') === 'custom') {
          b.classList.add('is-active');
        } else {
          b.classList.remove('is-active');
        }
      });
      activePreset = 'custom';
    });
  }

  // File loading
  async function loadPdfFile(file) {
    if (!file) return;

    if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showError(getMsg('selectPdf'));
      return;
    }

    resetState();
    currentFile = file;
    originalSizeBytes = file.size;

    if (fileNameDisplay) fileNameDisplay.textContent = file.name;
    if (fileMetaDisplay) fileMetaDisplay.textContent = formatBytes(file.size);

    showStatus(isPortuguese() ? 'Carregando documento...' : 'Loading document...');

    try {
      currentArrayBuffer = await file.arrayBuffer();

      // Parse with PDF.js to check integrity and count pages
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(currentArrayBuffer.slice(0)) });
      pdfDocProxy = await loadingTask.promise;
      totalPages = pdfDocProxy.numPages;

      const pagesWord = isPortuguese() ? 'páginas' : (totalPages === 1 ? 'page' : 'pages');
      if (fileMetaDisplay) {
        fileMetaDisplay.textContent = totalPages + ' ' + pagesWord + ' · ' + formatBytes(file.size);
      }

      if (dropzone) dropzone.style.display = 'none';
      if (fileDetails) fileDetails.style.display = 'flex';
      if (compressBtn) compressBtn.disabled = false;

      clearError();
      showStatus('');
    } catch (err) {
      console.error('PDF Load Error:', err);
      if (err.name === 'PasswordException') {
        showError(getMsg('passwordProtected'));
      } else {
        showError(getMsg('corruptError'));
      }
    }
  }

  // Execution: compress PDF pages client-side
  async function runCompression() {
    if (!currentArrayBuffer || !pdfDocProxy || isCompressing) return;

    isCompressing = true;
    if (compressBtn) compressBtn.disabled = true;
    if (progressWrap) progressWrap.style.display = 'block';
    if (resultPanel) resultPanel.classList.remove('is-visible');
    clearError();

    const config = PRESET_CONFIGS[activePreset] || PRESET_CONFIGS.recommended;
    const jpegQuality = activeQuality / 100;
    const baseScale = config.scale || 1.0;

    try {
      // Create fresh output PDF using PDF-Lib
      if (typeof PDFLib === 'undefined') {
        throw new Error('PDFLib library not loaded');
      }

      const outPdfDoc = await PDFLib.PDFDocument.create();

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const percent = Math.round(((pageNum - 1) / totalPages) * 90);
        updateProgress(percent, getMsg('processingPage', { current: pageNum, total: totalPages }));

        // Render page with PDF.js to offscreen canvas
        const page = await pdfDocProxy.getPage(pageNum);
        const viewport = page.getViewport({ scale: baseScale * 1.5 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d', { alpha: false });

        // Fill white canvas background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;

        // Convert canvas image to compressed JPEG Uint8Array
        const blob = await new Promise(function (resolve) {
          canvas.toBlob(resolve, 'image/jpeg', jpegQuality);
        });

        const imageBytes = new Uint8Array(await blob.arrayBuffer());
        const embeddedImage = await outPdfDoc.embedJpg(imageBytes);

        // Add page with original aspect ratio dimensions
        const origViewport = page.getViewport({ scale: 1.0 });
        const newPage = outPdfDoc.addPage([origViewport.width, origViewport.height]);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height
        });
      }

      updateProgress(95, getMsg('compiling'));

      // Save compressed PDF bytes
      const compressedPdfBytes = await outPdfDoc.save({ useObjectStreams: true });
      compressedBlob = new Blob([compressedPdfBytes], { type: 'application/pdf' });

      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
      compressedUrl = URL.createObjectURL(compressedBlob);

      updateProgress(100, getMsg('ready'));

      // Compute statistics
      const compressedSizeBytes = compressedBlob.size;
      const savedBytes = Math.max(0, originalSizeBytes - compressedSizeBytes);
      const savedPercent = Math.max(0, Math.round((savedBytes / originalSizeBytes) * 100));

      if (resultOriginal) resultOriginal.textContent = formatBytes(originalSizeBytes);
      if (resultCompressed) resultCompressed.textContent = formatBytes(compressedSizeBytes);
      if (resultSaved) {
        resultSaved.textContent = (compressedSizeBytes < originalSizeBytes ? '-' : '+') + savedPercent + '%';
      }

      if (downloadBtn) {
        const baseName = (currentFile ? currentFile.name : 'document').replace(/\.pdf$/i, '');
        downloadBtn.onclick = function () {
          const a = document.createElement('a');
          a.href = compressedUrl;
          a.download = baseName + '-compressed.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        };
      }

      if (resultPanel) resultPanel.classList.add('is-visible');
      showStatus(getMsg('ready'));
    } catch (err) {
      console.error('Compression Error:', err);
      showError(err.message || getMsg('corruptError'));
    } finally {
      isCompressing = false;
      if (compressBtn) compressBtn.disabled = false;
    }
  }

  function updateProgress(percent, text) {
    if (progressBar) progressBar.style.width = percent + '%';
    if (progressText) progressText.textContent = text || percent + '%';
  }

  function showStatus(msg) {
    if (statusLine) {
      statusLine.textContent = msg;
      statusLine.classList.remove('is-error');
    }
  }

  function showError(msg) {
    if (statusLine) {
      statusLine.textContent = msg;
      statusLine.classList.add('is-error');
    }
    if (progressWrap) progressWrap.style.display = 'none';
  }

  function clearError() {
    if (statusLine) {
      statusLine.textContent = '';
      statusLine.classList.remove('is-error');
    }
  }

  function resetState() {
    if (compressedUrl) {
      URL.revokeObjectURL(compressedUrl);
      compressedUrl = null;
    }
    compressedBlob = null;
    currentFile = null;
    currentArrayBuffer = null;
    pdfDocProxy = null;
    totalPages = 0;
    originalSizeBytes = 0;
    isCompressing = false;

    if (dropzone) dropzone.style.display = 'block';
    if (fileDetails) fileDetails.style.display = 'none';
    if (compressBtn) compressBtn.disabled = true;
    if (progressWrap) progressWrap.style.display = 'none';
    if (resultPanel) resultPanel.classList.remove('is-visible');
    clearError();
  }

  // Event Listeners
  if (fileInput) {
    fileInput.addEventListener('change', function (e) {
      if (e.target.files && e.target.files.length > 0) {
        loadPdfFile(e.target.files[0]);
      }
    });
  }

  if (dropzone) {
    ['dragenter', 'dragover'].forEach(function (eventName) {
      dropzone.addEventListener(eventName, function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(function (eventName) {
      dropzone.addEventListener(eventName, function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('is-dragover');
      });
    });

    dropzone.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        loadPdfFile(e.dataTransfer.files[0]);
      }
    });

    dropzone.addEventListener('click', function () {
      if (fileInput) fileInput.click();
    });

    dropzone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (fileInput) fileInput.click();
      }
    });
  }

  if (removeFileBtn) {
    removeFileBtn.addEventListener('click', function () {
      resetState();
      if (fileInput) fileInput.value = '';
    });
  }

  if (compressBtn) {
    compressBtn.addEventListener('click', runCompression);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      resetState();
      if (fileInput) fileInput.value = '';
    });
  }
})();
