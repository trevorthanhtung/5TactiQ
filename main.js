import { app, BrowserWindow, protocol, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true } }
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, process.env.VITE_DEV_SERVER_URL ? 'public' : 'dist', 'logo.png'),
    title: "5TactiQ",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.removeMenu(); // Remove default menu

  // Shortcut F12 or Ctrl+Shift+I to toggle DevTools
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      win.webContents.toggleDevTools();
    }
  });

  // Open OAuth / external links in system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Load from Vite dev server during dev, otherwise load the built HTML
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    protocol.handle('app', (request) => {
      let urlPath = new URL(request.url).pathname;
      let decodedPath = decodeURIComponent(urlPath);
      if (decodedPath.startsWith('/')) {
        decodedPath = decodedPath.substring(1);
      }
      if (!decodedPath) {
        decodedPath = 'index.html';
      }
      
      let filePath = path.join(__dirname, 'dist', decodedPath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(__dirname, 'dist', 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      const data = fs.readFileSync(filePath);

      return new Response(data, {
        headers: {
          'content-type': mimeType,
          'access-control-allow-origin': '*'
        }
      });
    });

    win.loadURL('app://-/');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
