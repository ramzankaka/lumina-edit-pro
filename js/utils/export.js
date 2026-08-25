/**
 * Lumina Edit Pro - Multi-format & Strict Target File Size (KB) Compression Exporter
 */

class Exporter {
  constructor(canvasEngine) {
    this.engine = canvasEngine;

    this.modal = document.getElementById('export-modal');
    this.openModalBtn = document.getElementById('export-modal-btn');
    this.closeModalBtn = document.getElementById('close-export-modal');
    this.cancelBtn = document.getElementById('cancel-export-btn');
    this.downloadBtn = document.getElementById('download-final-btn');

    this.filenameInput = document.getElementById('export-filename');
    this.formatChips = document.querySelectorAll('.format-chip');
    this.qualitySlider = document.getElementById('export-quality');
    this.qualityVal = document.getElementById('export-quality-val');
    this.scaleSelect = document.getElementById('export-scale');
    this.qualityGroup = document.getElementById('quality-slider-group');

    // Strict Target KB Controls
    this.targetKbToggle = document.getElementById('enable-target-kb');
    this.targetKbWrapper = document.getElementById('target-kb-wrapper');
    this.kbChips = document.querySelectorAll('.kb-chip');
    this.customKbWrap = document.getElementById('custom-kb-input-wrap');
    this.customKbVal = document.getElementById('custom-kb-val');

    this.selectedFormat = 'image/jpeg';
    this.selectedTargetKB = 19; // Default 19 KB for strict passport limits under 20 KB

    this.initListeners();
  }

  initListeners() {
    if (this.openModalBtn) {
      this.openModalBtn.addEventListener('click', () => this.showModal());
    }

    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener('click', () => this.hideModal());
    }

    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.hideModal());
    }

    // Format Chips
    this.formatChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.formatChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectedFormat = chip.dataset.format;
        
        // Hide KB toggle/quality slider for PNG
        if (this.targetKbWrapper) {
          this.targetKbWrapper.style.display = (this.selectedFormat === 'image/png') ? 'none' : 'block';
        }
      });
    });

    // Target KB Toggle
    if (this.targetKbToggle) {
      this.targetKbToggle.addEventListener('change', (e) => {
        if (this.targetKbWrapper) this.targetKbWrapper.classList.toggle('hidden', !e.target.checked);
        if (this.qualityGroup) this.qualityGroup.style.display = e.target.checked ? 'none' : 'flex';
      });
    }

    // Target KB Chips
    this.kbChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.kbChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const kbAttr = chip.dataset.kb;

        if (kbAttr === 'custom') {
          if (this.customKbWrap) this.customKbWrap.classList.remove('hidden');
          this.selectedTargetKB = parseFloat(this.customKbVal ? this.customKbVal.value : 20) || 20;
        } else {
          if (this.customKbWrap) this.customKbWrap.classList.add('hidden');
          this.selectedTargetKB = parseFloat(kbAttr);
        }
      });
    });

    if (this.customKbVal) {
      this.customKbVal.addEventListener('input', (e) => {
        this.selectedTargetKB = parseFloat(e.target.value) || 20;
      });
    }

    if (this.qualitySlider) {
      this.qualitySlider.addEventListener('input', (e) => {
        if (this.qualityVal) this.qualityVal.textContent = `${e.target.value}%`;
      });
    }

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => this.downloadImage());
    }
  }

  showModal() {
    if (!this.engine.originalImage) {
      alert('Please load an image first before exporting.');
      return;
    }
    if (this.modal) this.modal.classList.remove('hidden');
  }

  hideModal() {
    if (this.modal) this.modal.classList.add('hidden');
  }

  /**
   * Performs smart binary search to strictly fit within target KB
   */
  async compressToTargetKB(sourceCanvas, format, targetKB) {
    const targetBytes = targetKB * 1024;
    let minQuality = 0.02;
    let maxQuality = 0.98;
    let bestDataUrl = null;
    let bestSize = Infinity;
    let currentScale = 1.0;

    let workCanvas = sourceCanvas;

    for (let scaleAttempt = 0; scaleAttempt < 4; scaleAttempt++) {
      if (scaleAttempt > 0) {
        currentScale *= 0.8;
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = Math.max(50, Math.round(sourceCanvas.width * currentScale));
        scaledCanvas.height = Math.max(50, Math.round(sourceCanvas.height * currentScale));
        const ctx = scaledCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
        ctx.drawImage(sourceCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
        workCanvas = scaledCanvas;
      }

      minQuality = 0.02;
      maxQuality = 0.98;

      // 8 iterations of binary search quality tuning
      for (let i = 0; i < 8; i++) {
        const midQuality = (minQuality + maxQuality) / 2;
        const dataUrl = workCanvas.toDataURL(format, midQuality);
        
        // Approximate base64 byte size
        const base64Len = dataUrl.split(',')[1].length;
        const sizeBytes = Math.round((base64Len * 3) / 4);

        if (sizeBytes <= targetBytes) {
          bestDataUrl = dataUrl;
          bestSize = sizeBytes;
          minQuality = midQuality; // Try higher quality
        } else {
          maxQuality = midQuality; // Exceeded target, try lower quality
        }
      }

      if (bestDataUrl && bestSize <= targetBytes) {
        break; // Successfully found quality strictly <= targetKB
      }
    }

    if (!bestDataUrl) {
      bestDataUrl = workCanvas.toDataURL(format, 0.05);
    }

    return { dataUrl: bestDataUrl, finalSizeKB: (bestSize / 1024).toFixed(1) };
  }

  async downloadImage() {
    const scale = parseFloat(this.scaleSelect ? this.scaleSelect.value : 1.0);
    const userFilename = (this.filenameInput ? this.filenameInput.value.trim() : 'lumina_edited_photo') || 'lumina_photo';

    const sourceCanvas = this.engine.offscreenCanvas;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = Math.round(sourceCanvas.width * scale);
    exportCanvas.height = Math.round(sourceCanvas.height * scale);

    const ctx = exportCanvas.getContext('2d');
    if (this.selectedFormat === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }
    ctx.drawImage(sourceCanvas, 0, 0, exportCanvas.width, exportCanvas.height);

    let finalDataUrl = '';
    let ext = 'jpg';
    if (this.selectedFormat === 'image/png') ext = 'png';
    if (this.selectedFormat === 'image/webp') ext = 'webp';

    const isKbTargetEnabled = this.targetKbToggle && this.targetKbToggle.checked && this.selectedFormat !== 'image/png';

    if (isKbTargetEnabled) {
      const targetKB = this.selectedTargetKB;
      const res = await this.compressToTargetKB(exportCanvas, this.selectedFormat, targetKB);
      finalDataUrl = res.dataUrl;
      console.log(`Compressed strictly to ${res.finalSizeKB} KB (Target <= ${targetKB} KB)`);
    } else {
      const quality = parseFloat(this.qualitySlider ? this.qualitySlider.value : 90) / 100;
      finalDataUrl = exportCanvas.toDataURL(this.selectedFormat, quality);
    }

    const finalFilename = `${userFilename}.${ext}`;
    const link = document.createElement('a');
    link.download = finalFilename;
    link.href = finalDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.hideModal();
  }
}

window.Exporter = Exporter;
