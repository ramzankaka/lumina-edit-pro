/**
 * Lumina Edit Pro - Image Transformation Engine
 */

class TransformEngine {
  constructor() {
    this.rotation = 0; // Degrees: 0, 90, 180, 270
    this.fineRotation = 0; // -45 to +45 degrees
    this.flipH = false;
    this.flipV = false;
    this.cropRect = null; // { x, y, width, height } relative to image dimensions (0..1 normalized)
  }

  reset() {
    this.rotation = 0;
    this.fineRotation = 0;
    this.flipH = false;
    this.flipV = false;
    this.cropRect = null;
  }

  rotateRight() {
    this.rotation = (this.rotation + 90) % 360;
  }

  rotateLeft() {
    this.rotation = (this.rotation - 90 + 360) % 360;
  }

  setFineRotation(angle) {
    this.fineRotation = parseFloat(angle) || 0;
  }

  toggleFlipH() {
    this.flipH = !this.flipH;
  }

  toggleFlipV() {
    this.flipV = !this.flipV;
  }

  setCrop(xNorm, yNorm, wNorm, hNorm) {
    this.cropRect = {
      x: Math.max(0, Math.min(1, xNorm)),
      y: Math.max(0, Math.min(1, yNorm)),
      width: Math.max(0.01, Math.min(1, wNorm)),
      height: Math.max(0.01, Math.min(1, hNorm))
    };
  }

  clearCrop() {
    this.cropRect = null;
  }

  /**
   * Applies transformations to canvas context before drawing image
   */
  applyTransform(ctx, width, height) {
    const totalRotation = (this.rotation + this.fineRotation) * (Math.PI / 180);
    
    ctx.translate(width / 2, height / 2);
    ctx.rotate(totalRotation);
    ctx.scale(this.flipH ? -1 : 1, this.flipV ? -1 : 1);
    ctx.translate(-width / 2, -height / 2);
  }

  getState() {
    return {
      rotation: this.rotation,
      fineRotation: this.fineRotation,
      flipH: this.flipH,
      flipV: this.flipV,
      cropRect: this.cropRect ? { ...this.cropRect } : null
    };
  }

  setState(state) {
    if (!state) return;
    this.rotation = state.rotation || 0;
    this.fineRotation = state.fineRotation || 0;
    this.flipH = !!state.flipH;
    this.flipV = !!state.flipV;
    this.cropRect = state.cropRect ? { ...state.cropRect } : null;
  }
}

window.TransformEngine = TransformEngine;
