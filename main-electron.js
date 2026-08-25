const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0f111a',
    title: 'Lumina Edit Pro - 100% Offline Photo Editor',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('index.html');

  // Set standard clean window menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        { label: 'Open Image', accelerator: 'CmdOrCtrl+O', click: () => { win.webContents.send('trigger-open'); } },
        { label: 'Export Photo', accelerator: 'CmdOrCtrl+S', click: () => { win.webContents.send('trigger-export'); } },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => { win.webContents.send('trigger-undo'); } },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', click: () => { win.webContents.send('trigger-redo'); } }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
