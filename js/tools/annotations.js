/**
 * Lumina Edit Pro - Freehand Brush Drawing & Text Layer Tool
 */

class AnnotationsTool {
  constructor(canvasEngine, historyManager) {
    this.engine = canvasEngine;
    this.history = historyManager;

    // Brush Controls
    this.brushMode = 'draw'; // 'draw' or 'erase'
    this.brushColor = '#8b5cf6';
    this.brushSize = 12;
    this.brushOpacity = 1.0;

    this.isDrawing = false;
    this.lastPoint = null;

    // UI elements
    this.drawModeBtn = document.getElementById('brush-mode-draw');
    this.eraseModeBtn = document.getElementById('brush-mode-erase');
    this.colorPicker = document.getElementById('brush-color-picker');
    this.presetDots = document.querySelectorAll('.color-dot');
    this.sizeSlider = document.getElementById('brush-size');
    this.sizeVal = document.getElementById('brush-size-val');
    this.opacitySlider = document.getElementById('brush-opacity');
    this.opacityVal = document.getElementById('brush-opacity-val');
    this.clearBtn = document.getElementById('clear-drawings-btn');

    // Text controls
    this.textInput = document.getElementById('text-input-content');
    this.textFont = document.getElementById('text-font');
    this.textSize = document.getElementById('text-size');
    this.textSizeVal = document.getElementById('text-size-val');
    this.textColor = document.getElementById('text-color');
    this.textBold = document.getElementById('text-bold');
    this.textShadow = document.getElementById('text-shadow');
    this.addTextBtn = document.getElementById('add-text-btn');

    this.initListeners();
  }

  initListeners() {
    // Mode toggles
    if (this.drawModeBtn) {
      this.drawModeBtn.addEventListener('click', () => {
        this.brushMode = 'draw';
        this.drawModeBtn.classList.add('active');
        if (this.eraseModeBtn) this.eraseModeBtn.classList.remove('active');
      });
    }

    if (this.eraseModeBtn) {
      this.eraseModeBtn.addEventListener('click', () => {
        this.brushMode = 'erase';
        this.eraseModeBtn.classList.add('active');
        if (this.drawModeBtn) this.drawModeBtn.classList.remove('active');
      });
    }

    // Colors
    if (this.colorPicker) {
      this.colorPicker.addEventListener('input', (e) => this.brushColor = e.target.value);
    }

    this.presetDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const color = dot.dataset.color;
        this.brushColor = color;
        if (this.colorPicker) this.colorPicker.value = color;
      });
    });

    // Sliders
    if (this.sizeSlider) {
      this.sizeSlider.addEventListener('input', (e) => {
        this.brushSize = parseInt(e.target.value, 10);
        if (this.sizeVal) this.sizeVal.textContent = `${this.brushSize}px`;
      });
    }

    if (this.opacitySlider) {
      this.opacitySlider.addEventListener('input', (e) => {
        this.brushOpacity = parseInt(e.target.value, 10) / 100;
        if (this.opacityVal) this.opacityVal.textContent = `${e.target.value}%`;
      });
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        const ctx = this.engine.annotationCtx;
        ctx.clearRect(0, 0, this.engine.annotationCanvas.width, this.engine.annotationCanvas.height);
        this.engine.clearTextLayers();
        if (this.history) this.history.pushState('Clear Annotations');
      });
    }

    // Text controls
    if (this.textSize) {
      this.textSize.addEventListener('input', (e) => {
        if (this.textSizeVal) this.textSizeVal.textContent = `${e.target.value}px`;
      });
    }

    if (this.addTextBtn) {
      this.addTextBtn.addEventListener('click', () => this.addTextLayer());
    }

    // Canvas Pointer Drawing listeners
    const mainCanvas = this.engine.canvas;
    if (mainCanvas) {
      mainCanvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
      mainCanvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
      mainCanvas.addEventListener('mouseup', () => this.onPointerUp());
      mainCanvas.addEventListener('mouseleave', () => this.onPointerUp());
    }
  }

  getCanvasCoords(e) {
    const rect = this.engine.canvas.getBoundingClientRect();
    const scaleX = this.engine.canvas.width / rect.width;
    const scaleY = this.engine.canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  onPointerDown(e) {
    if (!window.appInstance || window.appInstance.activeTab !== 'annotate') return;
    
    this.isDrawing = true;
    this.lastPoint = this.getCanvasCoords(e);
  }

  onPointerMove(e) {
    if (!this.isDrawing || !window.appInstance || window.appInstance.activeTab !== 'annotate') return;

    const currentPoint = this.getCanvasCoords(e);
    const ctx = this.engine.annotationCtx;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = this.brushSize;

    if (this.brushMode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = this.brushColor;
      ctx.globalAlpha = this.brushOpacity;
    }

    ctx.beginPath();
    ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();
    ctx.restore();

    this.lastPoint = currentPoint;
    this.engine.render();
  }

  onPointerUp() {
    if (this.isDrawing) {
      this.isDrawing = false;
      if (this.history) this.history.pushState('Draw Stroke');
    }
  }

  addTextLayer() {
    const content = this.textInput ? this.textInput.value.trim() : 'Lumina Edit';
    if (!content) return;

    const textObj = {
      text: content,
      font: this.textFont ? this.textFont.value : 'Inter, sans-serif',
      size: this.textSize ? parseInt(this.textSize.value, 10) : 48,
      color: this.textColor ? this.textColor.value : '#ffffff',
      bold: this.textBold ? this.textBold.checked : true,
      shadow: this.textShadow ? this.textShadow.checked : true,
      x: this.engine.canvas.width / 2,
      y: this.engine.canvas.height / 2
    };

    this.engine.addTextLayer(textObj);
    if (this.history) this.history.pushState(`Add Text: "${content.substring(0, 12)}..."`);
  }
}

window.AnnotationsTool = AnnotationsTool;
