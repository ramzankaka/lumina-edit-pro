/**
 * Lumina Edit Pro - Core Canvas Image Filter Engine
 */

class CanvasEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d', { willReadFrequently: true }) : null;
    
    this.originalImage = null; // HTMLImageElement
    this.transform = new TransformEngine();
    
    // Offscreen Canvas for non-destructive pipeline rendering
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });

    // Annotation Layer Canvas
    this.annotationCanvas = document.createElement('canvas');
    this.annotationCtx = this.annotationCanvas.getContext('2d');

    // Default Adjustments Parameters
    this.adjustments = this.getDefaultAdjustments();

    // Preset Filter
    this.currentPreset = 'none';
    this.presetIntensity = 1.0;

    // Split Screen Compare Mode
    this.splitCompareActive = false;
    this.splitPos = 0.5; // 0..1 ratio
    this.originalHoldCompare = false;

    // Histogram engine reference
    this.histogramEngine = null;

    // Text Layers Stack
    this.textLayers = [];
  }

  getDefaultAdjustments() {
    return {
      brightness: 0,
      contrast: 0,
      exposure: 0,
      saturation: 0,
      vibrance: 0,
      warmth: 0,
      tint: 0,
      hueRotate: 0,
      sharpness: 0,
      blur: 0,
      vignette: 0,
      noise: 0
    };
  }

  setImage(imageElement) {
    this.originalImage = imageElement;
    this.canvas.width = imageElement.naturalWidth || imageElement.width;
    this.canvas.height = imageElement.naturalHeight || imageElement.height;
    
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;

    this.annotationCanvas.width = this.canvas.width;
    this.annotationCanvas.height = this.canvas.height;
    this.annotationCtx.clearRect(0, 0, this.annotationCanvas.width, this.annotationCanvas.height);

    this.textLayers = [];
    this.render();
  }

  setAdjustment(param, value) {
    if (param in this.adjustments) {
      this.adjustments[param] = parseFloat(value);
      this.render();
    }
  }

  resetAdjustments() {
    this.adjustments = this.getDefaultAdjustments();
    this.render();
  }

  setPresetFilter(presetName, intensity = 1.0) {
    this.currentPreset = presetName;
    this.presetIntensity = parseFloat(intensity);
    this.render();
  }

  /**
   * Main non-destructive Render Pipeline
   */
  render() {
    if (!this.originalImage || !this.ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    // If hold-compare is active, draw raw original image
    if (this.originalHoldCompare) {
      this.ctx.clearRect(0, 0, w, h);
      this.ctx.drawImage(this.originalImage, 0, 0, w, h);
      return;
    }

    // 1. Draw base image onto Offscreen Canvas with CSS filter string
    const cssFilterString = this.buildCSSFilterString();
    
    this.offscreenCtx.clearRect(0, 0, w, h);
    this.offscreenCtx.save();
    
    // Apply transform matrix (rotation, flip)
    this.transform.applyTransform(this.offscreenCtx, w, h);
    this.offscreenCtx.filter = cssFilterString;
    this.offscreenCtx.drawImage(this.originalImage, 0, 0, w, h);
    this.offscreenCtx.restore();

    // 2. Perform direct pixel-level math filters (Warmth/Tint, Sharpening, Noise, Vignette)
    let imgData = this.offscreenCtx.getImageData(0, 0, w, h);
    
    if (this.adjustments.warmth !== 0 || this.adjustments.tint !== 0 || this.adjustments.vibrance !== 0) {
      this.applyColorToneMath(imgData);
    }

    if (this.adjustments.sharpness > 0) {
      imgData = this.applySharpenKernel(imgData, this.adjustments.sharpness / 100);
    }

    if (this.adjustments.noise > 0) {
      this.applyNoiseGrain(imgData, this.adjustments.noise);
    }

    this.offscreenCtx.putImageData(imgData, 0, 0);

    if (this.adjustments.vignette > 0) {
      this.applyVignetteOverlay(this.offscreenCtx, w, h, this.adjustments.vignette);
    }

    // 3. Draw Annotations Layer
    this.offscreenCtx.drawImage(this.annotationCanvas, 0, 0);

    // 4. Draw Text Layers
    this.drawTextLayers(this.offscreenCtx);

    // 5. Render final offscreen image onto Main Display Canvas
    this.ctx.clearRect(0, 0, w, h);

    if (this.splitCompareActive) {
      // Draw edited half
      const splitX = w * this.splitPos;
      
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(0, 0, splitX, h);
      this.ctx.clip();
      this.ctx.drawImage(this.originalImage, 0, 0, w, h);
      this.ctx.restore();

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(splitX, 0, w - splitX, h);
      this.ctx.clip();
      this.ctx.drawImage(this.offscreenCanvas, 0, 0, w, h);
      this.ctx.restore();
    } else {
      this.ctx.drawImage(this.offscreenCanvas, 0, 0, w, h);
    }

    // 6. Update RGB Histogram if connected
    if (this.histogramEngine) {
      const histData = this.offscreenCtx.getImageData(0, 0, w, h);
      this.histogramEngine.update(histData);
    }
  }

  buildCSSFilterString() {
    const adj = this.adjustments;
    let filters = [];

    // Brightness (-100 to 100 -> 0% to 200%)
    const brightVal = 100 + adj.brightness + adj.exposure * 0.8;
    filters.push(`brightness(${Math.max(0, brightVal)}%)`);

    // Contrast (-100 to 100 -> 0% to 200%)
    const contrastVal = 100 + adj.contrast;
    filters.push(`contrast(${Math.max(0, contrastVal)}%)`);

    // Saturation (-100 to 100 -> 0% to 200%)
    const satVal = 100 + adj.saturation;
    filters.push(`saturate(${Math.max(0, satVal)}%)`);

    // Hue Rotate (-180 to 180 deg)
    if (adj.hueRotate !== 0) {
      filters.push(`hue-rotate(${adj.hueRotate}deg)`);
    }

    // Blur (0 to 50px)
    if (adj.blur > 0) {
      filters.push(`blur(${adj.blur}px)`);
    }

    return filters.join(' ');
  }

  applyColorToneMath(imageData) {
    const data = imageData.data;
    const warmth = this.adjustments.warmth * 0.4; // -40 to +40 R/B shift
    const tint = this.adjustments.tint * 0.4;     // -40 to +40 G shift
    const vibrance = this.adjustments.vibrance / 100; // -1 to +1

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Warmth & Tint
      if (warmth !== 0) {
        r += warmth;
        b -= warmth;
      }
      if (tint !== 0) {
        g += tint;
      }

      // Vibrance (selectively boosts muted colors)
      if (vibrance !== 0) {
        const max = Math.max(r, g, b);
        const avg = (r + g + b) / 3;
        const amt = ((Math.abs(max - avg) * 2 / 255) * vibrance) * 128;
        if (max === r) r += amt;
        if (max === g) g += amt;
        if (max === b) b += amt;
      }

      data[i]     = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }
  }

  applySharpenKernel(imageData, strength) {
    const w = imageData.width;
    const h = imageData.height;
    const src = imageData.data;
    const output = this.offscreenCtx.createImageData(w, h);
    const dst = output.data;

    // Convolution 3x3 sharpen matrix
    //  0  -1   0
    // -1   5  -1
    //  0  -1   0
    const mix = strength;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;

        for (let c = 0; c < 3; c++) {
          const center = src[idx + c];
          const top    = src[((y - 1) * w + x) * 4 + c];
          const bottom = src[((y + 1) * w + x) * 4 + c];
          const left   = src[(y * w + (x - 1)) * 4 + c];
          const right  = src[(y * w + (x + 1)) * 4 + c];

          const sharpened = center * 5 - (top + bottom + left + right);
          dst[idx + c] = Math.min(255, Math.max(0, center + (sharpened - center) * mix));
        }
        dst[idx + 3] = src[idx + 3];
      }
    }
    return output;
  }

  applyNoiseGrain(imageData, amount) {
    const data = imageData.data;
    const factor = (amount / 100) * 35;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * factor;
      data[i]     = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
  }

  applyVignetteOverlay(ctx, w, h, amount) {
    const radius = Math.max(w, h) * 0.7;
    const grad = ctx.createRadialGradient(w / 2, h / 2, radius * 0.3, w / 2, h / 2, radius);
    
    const alpha = (amount / 100) * 0.85;
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${alpha})`);

    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  drawTextLayers(ctx) {
    this.textLayers.forEach(layer => {
      ctx.save();
      ctx.font = `${layer.bold ? 'bold' : 'normal'} ${layer.size}px ${layer.font}`;
      ctx.fillStyle = layer.color;
      ctx.textAlign = 'center';

      if (layer.shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;
      }

      ctx.fillText(layer.text, layer.x, layer.y);
      ctx.restore();
    });
  }

  addTextLayer(textObj) {
    this.textLayers.push(textObj);
    this.render();
  }

  clearTextLayers() {
    this.textLayers = [];
    this.render();
  }

  getStateSnapshot() {
    return {
      adjustments: { ...this.adjustments },
      preset: this.currentPreset,
      presetIntensity: this.presetIntensity,
      transform: this.transform.getState(),
      textLayers: JSON.parse(JSON.stringify(this.textLayers))
    };
  }

  restoreStateSnapshot(snapshot) {
    if (!snapshot) return;
    this.adjustments = { ...snapshot.adjustments };
    this.currentPreset = snapshot.preset || 'none';
    this.presetIntensity = snapshot.presetIntensity || 1.0;
    this.transform.setState(snapshot.transform);
    this.textLayers = JSON.parse(JSON.stringify(snapshot.textLayers || []));
    this.render();
  }
}

window.CanvasEngine = CanvasEngine;
