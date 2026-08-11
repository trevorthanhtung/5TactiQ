import { app, BrowserWindow, protocol, net, shell } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.removeMenu(); // Remove default menu

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
      
      const filePath = path.join(__dirname, 'dist', decodedPath);
      return net.fetch(pathToFileURL(filePath).toString());
    });

    win.loadURL('app://-/');
    
    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
      require('fs').appendFileSync(path.join(__dirname, 'electron-log.txt'), `[${level}] ${message} at ${sourceId}:${line}\n`);
    });
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
