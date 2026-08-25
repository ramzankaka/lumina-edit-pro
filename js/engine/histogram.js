/**
 * Lumina Edit Pro - RGB & Luminance Histogram Engine
 */

class HistogramEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
  }

  update(imageData) {
    if (!this.ctx || !imageData) return;

    const data = imageData.data;
    const length = data.length;

    // 256 bins for Red, Green, Blue, Luma
    const rHistogram = new Uint32Array(256);
    const gHistogram = new Uint32Array(256);
    const bHistogram = new Uint32Array(256);
    const lHistogram = new Uint32Array(256);

    // Sample every 4th pixel for speed optimization
    const step = 16; 
    for (let i = 0; i < length; i += step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

      rHistogram[r]++;
      gHistogram[g]++;
      bHistogram[b]++;
      lHistogram[luma]++;
    }

    // Find peak value for normalization
    let maxCount = 0;
    for (let i = 0; i < 256; i++) {
      if (rHistogram[i] > maxCount) maxCount = rHistogram[i];
      if (gHistogram[i] > maxCount) maxCount = gHistogram[i];
      if (bHistogram[i] > maxCount) maxCount = bHistogram[i];
    }

    // Draw Histogram Graph
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);
    this.ctx.globalCompositeOperation = 'screen';

    this.drawChannel(rHistogram, maxCount, width, height, 'rgba(239, 68, 68, 0.6)');
    this.drawChannel(gHistogram, maxCount, width, height, 'rgba(16, 185, 129, 0.6)');
    this.drawChannel(bHistogram, maxCount, width, height, 'rgba(56, 189, 248, 0.6)');
    this.drawChannel(lHistogram, maxCount, width, height, 'rgba(156, 163, 175, 0.3)');

    this.ctx.globalCompositeOperation = 'source-over';
  }

  drawChannel(histogram, maxCount, width, height, color) {
    if (maxCount === 0) return;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(0, height);

    const binWidth = width / 256;

    for (let i = 0; i < 256; i++) {
      const value = histogram[i];
      const barHeight = (value / maxCount) * (height * 0.9);
      const x = i * binWidth;
      const y = height - barHeight;

      this.ctx.lineTo(x, y);
    }

    this.ctx.lineTo(width, height);
    this.ctx.closePath();
    this.ctx.fill();
  }
}

window.HistogramEngine = HistogramEngine;
