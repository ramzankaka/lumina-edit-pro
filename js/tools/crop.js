/**
 * Lumina Edit Pro - Passport Photo Sizing & Interactive Crop Overlay
 */

class CropTool {
  constructor(canvasEngine, historyManager) {
    this.engine = canvasEngine;
    this.history = historyManager;

    this.overlay = document.getElementById('crop-overlay');
    this.cropBox = document.getElementById('crop-box');
    this.passportChips = document.querySelectorAll('[data-passport]');
    this.aspectChips = document.querySelectorAll('[data-ratio]');
    
    this.applyBtn = document.getElementById('apply-crop-btn');
    this.cancelBtn = document.getElementById('cancel-crop-btn');
    this.toggleGuideCheckbox = document.getElementById('toggle-face-guide');
    this.faceGuide = document.getElementById('passport-face-guide');

    // Custom Resize Controls
    this.customW = document.getElementById('custom-resize-w');
    this.customH = document.getElementById('custom-resize-h');
    this.customUnit = document.getElementById('custom-resize-unit');
    this.customDPI = document.getElementById('custom-resize-dpi');

    // Rotation & Flip
    this.rotateLeftBtn = document.getElementById('rotate-left-btn');
    this.rotateRightBtn = document.getElementById('rotate-right-btn');
    this.flipHBtn = document.getElementById('flip-h-btn');
    this.flipVBtn = document.getElementById('flip-v-btn');
    this.rotateFineSlider = document.getElementById('rotate-fine');
    this.rotateFineVal = document.getElementById('rotate-fine-val');

    this.currentMode = 'free'; // 'free', 'ratio', or 'passport'
    this.targetDimensions = { w: 600, h: 600 }; // Target pixel dimensions
    
    this.isDragging = false;
    this.activeHandle = null;
    this.dragStart = { x: 0, y: 0 };
    this.boxRect = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }; // normalized 0..1

    this.initEvents();
  }

  initEvents() {
    // Passport Preset Chips
    this.passportChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.passportChips.forEach(c => c.classList.remove('active'));
        this.aspectChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectPassportPreset(chip.dataset.passport);
      });
    });

    // Aspect Ratio chips
    this.aspectChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.aspectChips.forEach(c => c.classList.remove('active'));
        this.passportChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectAspectRatio(chip.dataset.ratio);
      });
    });

    // Face Guide Toggle
    if (this.toggleGuideCheckbox) {
      this.toggleGuideCheckbox.addEventListener('change', (e) => {
        if (this.faceGuide) this.faceGuide.classList.toggle('hidden', !e.target.checked);
      });
    }

    // Rotation & Flip buttons
    if (this.rotateLeftBtn) {
      this.rotateLeftBtn.addEventListener('click', () => {
        this.engine.transform.rotateLeft();
        this.engine.render();
        if (this.history) this.history.pushState('Rotate -90°');
      });
    }

    if (this.rotateRightBtn) {
      this.rotateRightBtn.addEventListener('click', () => {
        this.engine.transform.rotateRight();
        this.engine.render();
        if (this.history) this.history.pushState('Rotate +90°');
      });
    }

    if (this.flipHBtn) {
      this.flipHBtn.addEventListener('click', () => {
        this.engine.transform.toggleFlipH();
        this.engine.render();
        if (this.history) this.history.pushState('Flip Horizontal');
      });
    }

    if (this.flipVBtn) {
      this.flipVBtn.addEventListener('click', () => {
        this.engine.transform.toggleFlipV();
        this.engine.render();
        if (this.history) this.history.pushState('Flip Vertical');
      });
    }

    if (this.rotateFineSlider) {
      this.rotateFineSlider.addEventListener('input', (e) => {
        const angle = e.target.value;
        if (this.rotateFineVal) this.rotateFineVal.textContent = `${angle}°`;
        this.engine.transform.setFineRotation(angle);
        this.engine.render();
      });

      this.rotateFineSlider.addEventListener('change', () => {
        if (this.history) this.history.pushState(`Straighten ${this.rotateFineSlider.value}°`);
      });
    }

    // Apply & Cancel
    if (this.applyBtn) {
      this.applyBtn.addEventListener('click', () => this.executeCropAndResize());
    }

    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.hideOverlay());
    }

    // Mouse & Touch Dragging for handles
    const startDrag = (clientX, clientY, target) => {
      if (target.classList.contains('crop-handle')) {
        this.activeHandle = target.dataset.handle;
      } else {
        this.activeHandle = 'move';
      }
      this.isDragging = true;
      this.dragStart = { x: clientX, y: clientY };
    };

    const moveDrag = (clientX, clientY) => {
      if (!this.isDragging || !this.overlay) return;
      const parent = this.engine.canvas.getBoundingClientRect();
      if (!parent.width || !parent.height) return;

      const dx = (clientX - this.dragStart.x) / parent.width;
      const dy = (clientY - this.dragStart.y) / parent.height;
      this.dragStart = { x: clientX, y: clientY };

      let { x, y, w, h } = this.boxRect;

      if (this.activeHandle === 'move') {
        x = Math.max(0, Math.min(1 - w, x + dx));
        y = Math.max(0, Math.min(1 - h, y + dy));
      } else if (this.activeHandle === 'se') {
        w = Math.max(0.05, Math.min(1 - x, w + dx));
        h = Math.max(0.05, Math.min(1 - y, h + dy));
      } else if (this.activeHandle === 'nw') {
        const newX = Math.max(0, Math.min(x + w - 0.05, x + dx));
        const newY = Math.max(0, Math.min(y + h - 0.05, y + dy));
        w += (x - newX);
        h += (y - newY);
        x = newX;
        y = newY;
      }

      this.boxRect = { x, y, w, h };
      this.updateCropBoxDOM();
    };

    const endDrag = () => {
      this.isDragging = false;
      this.activeHandle = null;
    };

    if (this.cropBox) {
      this.cropBox.addEventListener('mousedown', (e) => {
        startDrag(e.clientX, e.clientY, e.target);
        e.stopPropagation();
      });

      this.cropBox.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          startDrag(e.touches[0].clientX, e.touches[0].clientY, e.target);
          e.stopPropagation();
        }
      });
    }

    window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    });

    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
  }

  selectPassportPreset(preset) {
    let wPx = 600;
    let hPx = 600;

    if (preset === 'us') {
      // 2x2 inch @ 300 DPI = 600x600 px
      wPx = 600; hPx = 600;
    } else if (preset === 'uk') {
      // 35x45 mm @ 300 DPI = 413x531 px
      wPx = 413; hPx = 531;
    } else if (preset === 'ca') {
      // 50x70 mm @ 300 DPI = 591x827 px
      wPx = 591; hPx = 827;
    } else if (preset === 'stamp') {
      // 2x2.5 inch @ 300 DPI = 600x750 px
      wPx = 600; hPx = 750;
    }

    this.targetDimensions = { w: wPx, h: hPx };

    if (this.customW) this.customW.value = wPx;
    if (this.customH) this.customH.value = hPx;
    if (this.customUnit) this.customUnit.value = 'px';
    if (this.customDPI) this.customDPI.value = '300';

    if (this.faceGuide && this.toggleGuideCheckbox && this.toggleGuideCheckbox.checked) {
      this.faceGuide.classList.remove('hidden');
    }

    this.setBoxRatio(wPx / hPx);
  }

  selectAspectRatio(ratio) {
    if (this.faceGuide) this.faceGuide.classList.add('hidden');
    if (ratio === 'free') return;

    const parts = ratio.split(':');
    if (parts.length === 2) {
      this.setBoxRatio(parseFloat(parts[0]) / parseFloat(parts[1]));
    }
  }

  setBoxRatio(targetRatio) {
    const canvasW = this.engine.canvas.width;
    const canvasH = this.engine.canvas.height;
    const canvasRatio = canvasW / canvasH;

    let w = 0.75;
    let h = (w * canvasRatio) / targetRatio;

    if (h > 0.75) {
      h = 0.75;
      w = (h * targetRatio) / canvasRatio;
    }

    this.boxRect = {
      x: (1 - w) / 2,
      y: (1 - h) / 2,
      w: w,
      h: h
    };
    this.updateCropBoxDOM();
  }

  showOverlay() {
    if (!this.overlay || !this.engine.canvas) return;
    this.overlay.classList.remove('hidden');
    this.updateCropBoxDOM();
  }

  hideOverlay() {
    if (this.overlay) this.overlay.classList.add('hidden');
  }

  updateCropBoxDOM() {
    const parent = this.engine.canvas.getBoundingClientRect();
    if (!parent.width || !parent.height) return;

    this.cropBox.style.left = `${this.boxRect.x * 100}%`;
    this.cropBox.style.top = `${this.boxRect.y * 100}%`;
    this.cropBox.style.width = `${this.boxRect.w * 100}%`;
    this.cropBox.style.height = `${this.boxRect.h * 100}%`;
  }

  executeCropAndResize() {
    const { x, y, w, h } = this.boxRect;
    const sourceCanvas = this.engine.canvas;
    const cropX = Math.round(x * sourceCanvas.width);
    const cropY = Math.round(y * sourceCanvas.height);
    const cropW = Math.round(w * sourceCanvas.width);
    const cropH = Math.round(h * sourceCanvas.height);

    if (cropW <= 0 || cropH <= 0) return;

    // Determine target pixel dimensions (custom or crop box size)
    let targetW = parseInt(this.customW ? this.customW.value : cropW, 10) || cropW;
    let targetH = parseInt(this.customH ? this.customH.value : cropH, 10) || cropH;
    const unit = this.customUnit ? this.customUnit.value : 'px';
    const dpi = parseInt(this.customDPI ? this.customDPI.value : 300, 10);

    // Convert mm/inch to pixels if needed
    if (unit === 'mm') {
      targetW = Math.round((targetW / 25.4) * dpi);
      targetH = Math.round((targetH / 25.4) * dpi);
    } else if (unit === 'in') {
      targetW = Math.round(targetW * dpi);
      targetH = Math.round(targetH * dpi);
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetW;
    tempCanvas.height = targetH;
    const tempCtx = tempCanvas.getContext('2d');

    // High quality scaling
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(this.engine.offscreenCanvas, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

    const croppedImg = new Image();
    croppedImg.onload = () => {
      this.engine.setImage(croppedImg);
      this.hideOverlay();
      if (this.history) this.history.pushState(`Passport Crop (${targetW}x${targetH}px)`);
    };
    croppedImg.src = tempCanvas.toDataURL('image/png');
  }
}

window.CropTool = CropTool;
