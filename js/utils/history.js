/**
 * Lumina Edit Pro - Non-destructive History Stack & Timeline Manager
 */

class HistoryManager {
  constructor(canvasEngine) {
    this.engine = canvasEngine;
    this.stack = [];
    this.currentIndex = -1;
    this.maxStates = 30;

    this.undoBtn = document.getElementById('undo-btn');
    this.redoBtn = document.getElementById('redo-btn');
    this.countLabel = document.getElementById('history-count');
    this.drawerList = document.getElementById('history-list');

    this.initListeners();
  }

  initListeners() {
    if (this.undoBtn) {
      this.undoBtn.addEventListener('click', () => this.undo());
    }
    if (this.redoBtn) {
      this.redoBtn.addEventListener('click', () => this.redo());
    }
  }

  pushState(actionLabel = 'Edit') {
    const snapshot = this.engine.getStateSnapshot();
    
    // Trim redo branch
    if (this.currentIndex < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.currentIndex + 1);
    }

    this.stack.push({
      label: actionLabel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      snapshot: snapshot
    });

    if (this.stack.length > this.maxStates) {
      this.stack.shift();
    } else {
      this.currentIndex++;
    }

    this.updateUI();
  }

  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.restoreCurrentIndex();
    }
  }

  redo() {
    if (this.currentIndex < this.stack.length - 1) {
      this.currentIndex++;
      this.restoreCurrentIndex();
    }
  }

  jumpToState(index) {
    if (index >= 0 && index < this.stack.length) {
      this.currentIndex = index;
      this.restoreCurrentIndex();
    }
  }

  restoreCurrentIndex() {
    const item = this.stack[this.currentIndex];
    if (item && item.snapshot) {
      this.engine.restoreStateSnapshot(item.snapshot);
      this.updateUI();
    }
  }

  updateUI() {
    if (this.undoBtn) this.undoBtn.disabled = (this.currentIndex <= 0);
    if (this.redoBtn) this.redoBtn.disabled = (this.currentIndex >= this.stack.length - 1);
    if (this.countLabel) this.countLabel.textContent = this.stack.length;

    // Update Drawer Timeline List
    if (this.drawerList) {
      this.drawerList.innerHTML = '';
      this.stack.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = `history-item ${idx === this.currentIndex ? 'active' : ''}`;
        div.innerHTML = `
          <span>${idx === 0 ? 'Original Image' : item.label}</span>
          <span style="opacity:0.6; font-size:10px;">${item.timestamp}</span>
        `;
        div.addEventListener('click', () => this.jumpToState(idx));
        this.drawerList.appendChild(div);
      });
    }
  }

  clearHistory() {
    this.stack = [];
    this.currentIndex = -1;
    this.updateUI();
  }
}

window.HistoryManager = HistoryManager;
