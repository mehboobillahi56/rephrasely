const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onGlobalHotkey: (callback) => ipcRenderer.on('global-hotkey', (event, data) => callback(data)),
  readClipboard: () => ipcRenderer.invoke('clipboard-read'),
  writeClipboard: (text) => ipcRenderer.invoke('clipboard-write', text),
  setHotkeyConfig: (config) => ipcRenderer.invoke('set-hotkey-config', config),
  getHotkeyConfig: () => ipcRenderer.invoke('get-hotkey-config'),
});
