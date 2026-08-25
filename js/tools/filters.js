/**
 * Lumina Edit Pro - Creative Filter Presets Engine
 */

class FilterPresetsTool {
  constructor(canvasEngine, historyManager) {
    this.engine = canvasEngine;
    this.history = historyManager;
    this.gridContainer = document.getElementById('filter-presets-grid');
    this.intensitySlider = document.getElementById('filter-intensity');
    this.intensityLabel = document.getElementById('filter-intensity-val');
    this.clearBtn = document.getElementById('reset-filter-btn');

    this.presets = this.getPresetDefinitions();
    this.activePreset = 'none';

    this.initUI();
  }

  getPresetDefinitions() {
    return [
      { id: 'none', name: 'Original', adjustments: {} },
      { 
        id: 'cyberpunk', 
        name: 'Cyberpunk', 
        adjustments: { contrast: 25, saturation: 40, hueRotate: -20, tint: 25, sharpness: 20 }
      },
      { 
        id: 'vintage', 
        name: 'Vintage Film', 
        adjustments: { warmth: 30, contrast: -10, saturation: -20, vignette: 40, noise: 25 }
      },
      { 
        id: 'teal-orange', 
        name: 'Teal & Orange', 
        adjustments: { contrast: 30, warmth: 20, tint: -15, vibrance: 35, saturation: 15 }
      },
      { 
        id: 'dramatic-hdr', 
        name: 'Dramatic HDR', 
        adjustments: { contrast: 45, exposure: 10, vibrance: 50, sharpness: 40, clarity: 30 }
      },
      { 
        id: 'noir', 
        name: 'B&W Noir', 
        adjustments: { saturation: -100, contrast: 40, brightness: -5, vignette: 30 }
      },
      { 
        id: 'soft-pastel', 
        name: 'Soft Pastel', 
        adjustments: { brightness: 15, contrast: -20, saturation: 15, blur: 1, warmth: 10 }
      },
      { 
        id: 'warm-sunset', 
        name: 'Warm Sunset', 
        adjustments: { warmth: 45, tint: 10, brightness: 5, saturation: 25 }
      },
      { 
        id: 'cold-glacier', 
        name: 'Cold Glacier', 
        adjustments: { warmth: -40, tint: -10, contrast: 15, saturation: -10 }
      },
      { 
        id: 'duotone', 
        name: 'Duotone Neon', 
        adjustments: { saturation: 60, hueRotate: 90, contrast: 35 }
      }
    ];
  }

  initUI() {
    if (!this.gridContainer) return;

    this.gridContainer.innerHTML = '';
    this.presets.forEach(p => {
      const card = document.createElement('div');
      card.className = `filter-card ${p.id === 'none' ? 'active' : ''}`;
      card.dataset.preset = p.id;
      
      card.innerHTML = `
        <div class="filter-thumb filter-preview-${p.id}"></div>
        <span class="filter-name">${p.name}</span>
      `;

      card.addEventListener('click', () => this.applyPreset(p.id));
      this.gridContainer.appendChild(card);
    });

    if (this.intensitySlider) {
      this.intensitySlider.addEventListener('input', (e) => {
        const val = e.target.value;
        if (this.intensityLabel) this.intensityLabel.textContent = `${val}%`;
        this.engine.setPresetFilter(this.activePreset, val / 100);
      });

      this.intensitySlider.addEventListener('change', () => {
        if (this.history) this.history.pushState(`Filter Intensity ${this.intensitySlider.value}%`);
      });
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.applyPreset('none'));
    }
  }

  applyPreset(presetId) {
    const target = this.presets.find(p => p.id === presetId);
    if (!target) return;

    this.activePreset = presetId;

    // Update Card UI
    const cards = this.gridContainer.querySelectorAll('.filter-card');
    cards.forEach(c => c.classList.toggle('active', c.dataset.preset === presetId));

    // Reset current adjustments and apply filter values
    this.engine.resetAdjustments();

    if (presetId !== 'none') {
      const intensity = (this.intensitySlider ? this.intensitySlider.value : 100) / 100;
      Object.keys(target.adjustments).forEach(param => {
        const val = target.adjustments[param] * intensity;
        this.engine.setAdjustment(param, val);
      });
    }

    // Sync UI Sliders
    if (window.appInstance && window.appInstance.adjustmentsTool) {
      window.appInstance.adjustmentsTool.syncUI();
    }

    if (this.history) this.history.pushState(`Preset: ${target.name}`);
  }
}

window.FilterPresetsTool = FilterPresetsTool;
