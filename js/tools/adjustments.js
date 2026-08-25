/**
 * Lumina Edit Pro - Adjustment Sliders & Controller
 */

class AdjustmentsTool {
  constructor(canvasEngine, historyManager) {
    this.engine = canvasEngine;
    this.history = historyManager;

    this.sliders = document.querySelectorAll('input[data-param]');
    this.resetBtn = document.getElementById('reset-adjust-btn');
    
    this.initListeners();
  }

  initListeners() {
    this.sliders.forEach(slider => {
      const param = slider.getAttribute('data-param');
      const numInput = document.getElementById(`num-${param}`);

      // Slider change event
      slider.addEventListener('input', (e) => {
        const val = e.target.value;
        if (numInput) numInput.value = val;
        this.engine.setAdjustment(param, val);
      });

      slider.addEventListener('change', () => {
        if (this.history) {
          this.history.pushState(`Adjust ${param}`);
        }
      });

      // Number input sync
      if (numInput) {
        numInput.addEventListener('input', (e) => {
          const val = Math.max(slider.min, Math.min(slider.max, e.target.value || 0));
          slider.value = val;
          this.engine.setAdjustment(param, val);
        });

        numInput.addEventListener('change', () => {
          if (this.history) {
            this.history.pushState(`Adjust ${param}`);
          }
        });
      }
    });

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.resetAll();
        if (this.history) this.history.pushState('Reset Adjustments');
      });
    }
  }

  syncUI() {
    const adj = this.engine.adjustments;
    this.sliders.forEach(slider => {
      const param = slider.getAttribute('data-param');
      if (param in adj) {
        const val = adj[param];
        slider.value = val;
        const numInput = document.getElementById(`num-${param}`);
        if (numInput) numInput.value = val;
      }
    });
  }

  resetAll() {
    this.engine.resetAdjustments();
    this.syncUI();
  }
}

window.AdjustmentsTool = AdjustmentsTool;
