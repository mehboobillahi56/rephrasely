process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

const { app, BrowserWindow, globalShortcut, clipboard, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

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
    // Try multiple possible paths for the built app
    const possiblePaths = [
      path.join(__dirname, '../out/index.html'),
      path.join(__dirname, '../dist/index.html'),
      path.join(__dirname, '../build/index.html'),
      path.join(__dirname, 'renderer/index.html'),
      path.join(process.resourcesPath, 'app', 'out', 'index.html'),
      path.join(process.resourcesPath, 'app.asar', 'out', 'index.html')
    ];
    
    let loaded = false;
    for (const htmlPath of possiblePaths) {
      try {
        if (require('fs').existsSync(htmlPath)) {
          console.log(`Loading from: ${htmlPath}`);
          win.loadFile(htmlPath);
          loaded = true;
          break;
        }
      } catch (err) {
        console.log(`Failed to load from ${htmlPath}:`, err.message);
      }
    }
    
    if (!loaded) {
      console.error('Could not find built app files. Available paths:');
      possiblePaths.forEach(p => {
        console.log(`  ${p} - exists: ${require('fs').existsSync(p)}`);
      });
      // Fallback: load a simple HTML page
      win.loadURL('data:text/html,<h1>Rephrasely</h1><p>App files not found. Please rebuild the app.</p>');
    }
  }

  win.once('ready-to-show', () => {
    win.show();
    // Open DevTools for debugging
    if (!app.isPackaged) {
      win.webContents.openDevTools();
    }
  });
}

// In-memory hotkey config
let hotkeyConfig = [];

function registerHotkeys() {
  // Clear existing hotkeys
  globalShortcut.unregisterAll();
  
  // Register a simple test hotkey first
  try {
    console.log('[Electron Main] Registering test hotkey: Ctrl+Shift+T');
    const testSuccess = globalShortcut.register('Ctrl+Shift+T', () => {
      console.log('[Electron Main] 🧪 TEST HOTKEY TRIGGERED: Ctrl+Shift+T 🧪');
    });
    if (testSuccess) {
      console.log('[Electron Main] ✅ Test hotkey registered successfully');
    } else {
      console.log('[Electron Main] ❌ Test hotkey registration failed');
    }
  } catch (e) {
    console.error('[Electron Main] Test hotkey registration error:', e);
  }
  
  if (!Array.isArray(hotkeyConfig)) return;
  console.log('[Electron Main] Registering hotkeys:', hotkeyConfig);
  hotkeyConfig.forEach(hotkey => {
    if (hotkey && hotkey.combination) {
      try {
        console.log(`[Electron Main] Attempting to register hotkey: ${hotkey.combination}`);
        const success = globalShortcut.register(hotkey.combination, async () => {
          console.log(`[Electron Main] ⚡ HOTKEY TRIGGERED: ${hotkey.combination} ⚡`);
          console.log(`[Electron Main] Time: ${new Date().toISOString()}`);
          
          // 1. Simulate Cmd+C (copy selection)
          let prevClipboard = clipboard.readText();
          try {
            if (process.platform === 'darwin') {
              // You can implement Mac logic here if needed
              console.warn('MacOS key simulation not implemented.');
            } else if (process.platform === 'win32') {
              exec('powershell -command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys(\'^c\')"');
            }
          } catch (err) {
            console.error('Failed to simulate copy:', err);
            return;
          }
          
          // 2. Wait for clipboard to update (poll until changed or timeout)
          let selectedText = prevClipboard;
          const start = Date.now();
          while (selectedText === prevClipboard && Date.now() - start < 1000) {
            await new Promise(res => setTimeout(res, 50));
            selectedText = clipboard.readText();
          }
          console.log('Selected text from clipboard:', selectedText);
          if (!selectedText || !win) return;
          // 4. Ask renderer to rephrase (async, via IPC)
          let rephrasedText;
          try {
            console.log('[Electron Main] Calling rephraseFromMain with text:', selectedText);
            rephrasedText = await win.webContents.executeJavaScript(`
              (async function() {
                if (typeof window.rephraseFromMain === 'function') {
                  console.log('[Renderer] rephraseFromMain function found, calling...');
                  return await window.rephraseFromMain(${JSON.stringify(selectedText)});
                } else {
                  console.error('[Renderer] rephraseFromMain function not found on window object');
                  console.log('[Renderer] Available window properties:', Object.keys(window).filter(k => k.includes('rephrase')));
                  return null;
                }
              })()
            `);
            console.log('[Electron Main] Rephrased text from renderer:', rephrasedText);
          } catch (err) {
            console.error('[Electron Main] Failed to get rephrased text from renderer:', err);
            return;
          }
          if (!rephrasedText) return;
          // 5. Write rephrased text to clipboard
          clipboard.writeText(rephrasedText);
          // 6. Simulate Cmd+V (paste)
          try {
            if (process.platform === 'darwin') {
              // You can implement Mac logic here if needed
              console.warn('MacOS key simulation not implemented.');
            } else if (process.platform === 'win32') {
              exec('powershell -command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys(\'^v\')"');
            }
          } catch (err) {
            console.error('Failed to simulate paste:', err);
          }
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
