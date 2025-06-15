process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

const { app, BrowserWindow, globalShortcut, clipboard, ipcMain } = require('electron');
const path = require('path');
const robot = require('robotjs');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    show: false,
  });

  // Load Next.js dev server or production build
  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../out/index.html'));
  }

  win.once('ready-to-show', () => win.show());
}

// In-memory hotkey config
let hotkeyConfig = [];

function registerHotkeys() {
  globalShortcut.unregisterAll();
  if (!Array.isArray(hotkeyConfig)) return;
  console.log('[Electron Main] Registering hotkeys:', hotkeyConfig);
  hotkeyConfig.forEach(hotkey => {
    if (hotkey && hotkey.combination) {
      try {
        const success = globalShortcut.register(hotkey.combination, async () => {
          console.log(`[Electron Main] Hotkey triggered: ${hotkey.combination}`);
          // 1. Simulate Cmd+C (copy selection)
          robot.keyTap('c', process.platform === 'darwin' ? 'command' : 'control');
          // 2. Wait for clipboard to update
          await new Promise(res => setTimeout(res, 150));
          // 3. Read clipboard
          const selectedText = clipboard.readText();
          if (!selectedText || !win) return;
          // 4. Ask renderer to rephrase (async, via IPC)
          let rephrasedText;
          try {
            rephrasedText = await win.webContents.executeJavaScript(`window.rephraseFromMain && window.rephraseFromMain(${JSON.stringify(selectedText)})`);
          } catch (err) {
            console.error('Failed to get rephrased text from renderer:', err);
            return;
          }
          if (!rephrasedText) return;
          // 5. Write rephrased text to clipboard
          clipboard.writeText(rephrasedText);
          // 6. Simulate Cmd+V (paste)
          robot.keyTap('v', process.platform === 'darwin' ? 'command' : 'control');
        });
        if (!success) {
          console.error(`[Electron Main] Failed to register hotkey: ${hotkey.combination}`);
        } else {
          console.log(`[Electron Main] Registered hotkey: ${hotkey.combination}`);
        }
      } catch (e) {
        console.error('Failed to register hotkey:', hotkey.combination, e);
      }
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  registerHotkeys();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// IPC: Receive hotkey config from renderer
ipcMain.handle('set-hotkey-config', (event, config) => {
  console.log('[Electron Main] Received hotkey config from renderer:', config);
  hotkeyConfig = Array.isArray(config) ? config : [];
  registerHotkeys();
});
ipcMain.handle('get-hotkey-config', () => hotkeyConfig);

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC: Clipboard integration
ipcMain.handle('clipboard-read', () => clipboard.readText());
ipcMain.handle('clipboard-write', (event, text) => clipboard.writeText(text));
