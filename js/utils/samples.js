/**
 * Lumina Edit Pro - Offline Sample Images Generator
 */

class SampleImagesGenerator {
  static createSample(type = 'sunset', width = 1600, height = 1000) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (type === 'sunset') {
      // Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
      skyGrad.addColorStop(0, '#1e1b4b');
      skyGrad.addColorStop(0.3, '#7c2d12');
      skyGrad.addColorStop(0.6, '#ea580c');
      skyGrad.addColorStop(0.85, '#f59e0b');
      skyGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Sun
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 40;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.55, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Mountain Range 1 (Distant)
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.65);
      ctx.lineTo(width * 0.2, height * 0.45);
      ctx.lineTo(width * 0.45, height * 0.58);
      ctx.lineTo(width * 0.7, height * 0.42);
      ctx.lineTo(width, height * 0.62);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Mountain Range 2 (Foreground Silhouette)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.72);
      ctx.lineTo(width * 0.3, height * 0.55);
      ctx.lineTo(width * 0.6, height * 0.75);
      ctx.lineTo(width * 0.85, height * 0.52);
      ctx.lineTo(width, height * 0.7);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();
    } else if (type === 'cyberpunk') {
      // Dark Neon Background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Grid perspective lines
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4;
      const horizonY = height * 0.5;
      for (let x = -width; x <= width * 2; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(width * 0.5, horizonY);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let y = horizonY; y < height; y += (y - horizonY) * 0.2 + 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // Synthwave Sun
      const sunGrad = ctx.createLinearGradient(0, horizonY - 200, 0, horizonY + 50);
      sunGrad.addColorStop(0, '#f43f5e');
      sunGrad.addColorStop(1, '#fbbf24');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(width * 0.5, horizonY - 20, 160, Math.PI, 0);
      ctx.fill();

      // City Skyline Silhouettes
      ctx.fillStyle = '#0f172a';
      for (let x = 0; x < width; x += 60) {
        const bHeight = Math.random() * 220 + 80;
        const bWidth = Math.random() * 40 + 50;
        ctx.fillRect(x, horizonY - bHeight, bWidth, bHeight);

        // Neon window dots
        ctx.fillStyle = (x % 120 === 0) ? '#ec4899' : '#06b6d4';
        for (let wy = horizonY - bHeight + 15; wy < horizonY - 10; wy += 20) {
          if (Math.random() > 0.4) ctx.fillRect(x + 10, wy, 8, 8);
        }
        ctx.fillStyle = '#0f172a';
      }
    } else if (type === 'portrait') {
      // Golden Hour Soft Gradient
      const grad = ctx.createRadialGradient(width * 0.4, height * 0.4, 100, width * 0.5, height * 0.5, 900);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.4, '#f97316');
      grad.addColorStop(0.8, '#be185d');
      grad.addColorStop(1, '#31103f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Artistic Silhouette Profile
      ctx.fillStyle = '#090a0f';
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.4, 140, 0, Math.PI * 2);
      ctx.fill();
      
      // Shoulders
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.85, 260, 200, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Abstract Neon Fluid
      const grad1 = ctx.createLinearGradient(0, 0, width, height);
      grad1.addColorStop(0, '#8b5cf6');
      grad1.addColorStop(0.5, '#ec4899');
      grad1.addColorStop(1, '#06b6d4');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Swirling Orbs
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 250 + 50, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    return img;
  }
}

window.SampleImagesGenerator = SampleImagesGenerator;
