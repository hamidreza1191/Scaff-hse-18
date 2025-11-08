// electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = process.env.VITE_DEV_SERVER_URL || process.env.ELECTRON_START_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    // Dev mode: load Vite dev server (started by npm script)
    const devUrl = process.env.VITE_DEV_SERVER_URL || process.env.ELECTRON_START_URL || 'http://localhost:5173/';
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Prod mode: load the Vite build output from /dist
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    win.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
