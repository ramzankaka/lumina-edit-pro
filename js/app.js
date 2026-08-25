/**
 * Lumina Edit Pro - Main Application Controller
 */

class LuminaApp {
  constructor() {
    this.activeTab = 'adjust';
    this.zoomLevel = 1.0;
    this.panOffset = { x: 0, y: 0 };
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.isSpacePressed = false;

    this.initEngines();
    this.initUIListeners();
    this.initKeyboardShortcuts();
  }

  initEngines() {
    this.histogramEngine = new HistogramEngine('histogram-canvas');
    this.engine = new CanvasEngine('main-canvas');
    this.engine.histogramEngine = this.histogramEngine;

    this.history = new HistoryManager(this.engine);
    this.adjustmentsTool = new AdjustmentsTool(this.engine, this.history);
    this.filtersTool = new FilterPresetsTool(this.engine, this.history);
    this.cropTool = new CropTool(this.engine, this.history);
    this.annotationsTool = new AnnotationsTool(this.engine, this.history);
    this.exporter = new Exporter(this.engine);
  }

  initUIListeners() {
    // PWA Installation handling
    let deferredPrompt;
    const installBtn = document.getElementById('install-pwa-btn');
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (installBtn) installBtn.classList.remove('hidden');
    });

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null;
        installBtn.classList.add('hidden');
      });
    }

    // Image input file picker
    const fileInput = document.getElementById('image-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.loadFile(e.target.files[0]);
        }
      });
    }

    // Drag & Drop
    const dropzone = document.getElementById('dropzone');
    const viewport = document.getElementById('viewport');

    [dropzone, viewport].forEach(elem => {
      if (!elem) return;
      elem.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });
      elem.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
      elem.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.loadFile(e.dataTransfer.files[0]);
        }
      });
    });

    // Quick Sample Load
    const quickSample = document.getElementById('load-sample-quick');
    if (quickSample) {
      quickSample.addEventListener('click', () => this.loadSample('sunset'));
    }

    // Sample Menu items
    const sampleBtn = document.getElementById('sample-images-btn');
    const sampleMenu = document.getElementById('sample-menu');
    if (sampleBtn && sampleMenu) {
      sampleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sampleMenu.classList.toggle('show');
      });

      document.addEventListener('click', () => sampleMenu.classList.remove('show'));

      sampleMenu.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
          this.loadSample(item.dataset.sample);
        });
      });
    }

    // Left Navigation Tabs
    const tabs = document.querySelectorAll('.tool-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.switchTab(tab.dataset.tab);
      });
    });

    // Viewport Zoom controls
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomFitBtn = document.getElementById('zoom-fit-btn');

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.setZoom(this.zoomLevel + 0.15));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.setZoom(this.zoomLevel - 0.15));
    if (zoomFitBtn) zoomFitBtn.addEventListener('click', () => this.resetZoomFit());

    // Compare original press-and-hold
    const compareBtn = document.getElementById('compare-btn');
    if (compareBtn) {
      compareBtn.addEventListener('mousedown', () => {
        this.engine.originalHoldCompare = true;
        this.engine.render();
      });
      compareBtn.addEventListener('mouseup', () => {
        this.engine.originalHoldCompare = false;
        this.engine.render();
      });
      compareBtn.addEventListener('mouseleave', () => {
        this.engine.originalHoldCompare = false;
        this.engine.render();
      });
    }

    // Toggle Split Screen Compare
    const splitBtn = document.getElementById('toggle-split-btn');
    const divider = document.getElementById('compare-divider');
    if (splitBtn) {
      splitBtn.addEventListener('click', () => {
        this.engine.splitCompareActive = !this.engine.splitCompareActive;
        if (divider) divider.classList.toggle('hidden', !this.engine.splitCompareActive);
        this.engine.render();
      });
    }

    // Split Divider Dragging
    if (divider) {
      let isDraggingDivider = false;
      divider.addEventListener('mousedown', () => isDraggingDivider = true);
      window.addEventListener('mousemove', (e) => {
        if (!isDraggingDivider) return;
        const rect = this.engine.canvas.getBoundingClientRect();
        let pos = (e.clientX - rect.left) / rect.width;
        pos = Math.max(0.05, Math.min(0.95, pos));
        this.engine.splitPos = pos;
        divider.style.left = `${pos * 100}%`;
        this.engine.render();
      });
      window.addEventListener('mouseup', () => isDraggingDivider = false);
    }

    // Reset All edits
    const resetAllBtn = document.getElementById('reset-all-btn');
    if (resetAllBtn) {
      resetAllBtn.addEventListener('click', () => {
        if (confirm('Reset all edits back to original image?')) {
          this.engine.resetAdjustments();
          this.engine.clearTextLayers();
          this.engine.transform.reset();
          if (this.adjustmentsTool) this.adjustmentsTool.syncUI();
          this.history.pushState('Reset All Edits');
        }
      });
    }

    // History Drawer Toggle
    const historyBtn = document.getElementById('history-toggle-btn');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const historyDrawer = document.getElementById('history-drawer');

    if (historyBtn && historyDrawer) {
      historyBtn.addEventListener('click', () => historyDrawer.classList.toggle('hidden'));
    }
    if (closeHistoryBtn && historyDrawer) {
      closeHistoryBtn.addEventListener('click', () => historyDrawer.classList.add('hidden'));
    }

    // Mouse wheel zoom
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      this.setZoom(this.zoomLevel + delta);
    });
  }

  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Space key pan mode
      if (e.code === 'Space' && !this.isSpacePressed) {
        this.isSpacePressed = true;
        document.body.style.cursor = 'grab';
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) this.history.redo();
          else this.history.undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          this.history.redo();
        } else if (e.key === 's') {
          e.preventDefault();
          if (this.exporter) this.exporter.showModal();
        } else if (e.key === 'o') {
          e.preventDefault();
          document.getElementById('image-input').click();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.isSpacePressed = false;
        document.body.style.cursor = 'default';
      }
    });

    // Paste from clipboard
    window.addEventListener('paste', (e) => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          this.loadFile(blob);
          break;
        }
      }
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    
    // Toggle Panels
    const panels = document.querySelectorAll('.tab-panel');
    panels.forEach(p => p.classList.toggle('active', p.id === `panel-${tabId}`));

    // Crop mode activation
    if (tabId === 'crop') {
      this.cropTool.showOverlay();
    } else {
      this.cropTool.hideOverlay();
    }

    // Cursor for annotate mode
    if (tabId === 'annotate') {
      this.engine.canvas.style.cursor = 'crosshair';
    } else {
      this.engine.canvas.style.cursor = 'default';
    }
  }

  loadFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.onImageLoaded(img, file.name, file.size);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  loadSample(sampleType) {
    const img = SampleImagesGenerator.createSample(sampleType, 1600, 1000);
    img.onload = () => {
      this.onImageLoaded(img, `sample_${sampleType}.png`, 450 * 1024);
    };
  }

  onImageLoaded(imgElement, filename = 'Image', fileSize = 0) {
    // Hide Dropzone & show canvas
    document.getElementById('dropzone').classList.add('hidden');
    document.getElementById('canvas-container').classList.remove('hidden');
    document.getElementById('viewport-controls').classList.remove('hidden');

    this.engine.setImage(imgElement);
    this.history.clearHistory();
    this.history.pushState('Open Image');

    // Update EXIF Metadata
    const w = imgElement.naturalWidth || imgElement.width;
    const h = imgElement.naturalHeight || imgElement.height;
    const mp = ((w * h) / 1000000).toFixed(2);
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(w, h);
    const aspect = `${w / divisor}:${h / divisor}`;

    document.getElementById('info-filename').textContent = filename;
    document.getElementById('info-dimensions').textContent = `${w} x ${h} px`;
    document.getElementById('info-aspect').textContent = aspect.length > 10 ? `${(w/h).toFixed(2)}:1` : aspect;
    document.getElementById('info-mp').textContent = `${mp} MP`;
    document.getElementById('info-size').textContent = `${(fileSize / 1024).toFixed(1)} KB`;

    document.getElementById('status-text').textContent = 'Image Loaded';
    document.getElementById('status-dim').textContent = `${w} × ${h} px`;

    this.resetZoomFit();
  }

  setZoom(val) {
    this.zoomLevel = Math.max(0.1, Math.min(5.0, val));
    const container = document.getElementById('canvas-container');
    if (container) {
      container.style.transform = `scale(${this.zoomLevel}) translate(${this.panOffset.x}px, ${this.panOffset.y}px)`;
    }
    const zoomText = document.getElementById('zoom-level-text');
    if (zoomText) zoomText.textContent = `${Math.round(this.zoomLevel * 100)}%`;
  }

  resetZoomFit() {
    this.zoomLevel = 1.0;
    this.panOffset = { x: 0, y: 0 };
    this.setZoom(1.0);
  }
}

// Instantiate App
window.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new LuminaApp();
});
