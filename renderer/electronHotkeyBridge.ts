// Bridge for syncing hotkey config to Electron main process
export async function setElectronHotkeyConfig(config: any[]) {
  if (typeof window === 'undefined' || !window.electronAPI) return;
  await window.electronAPI.setHotkeyConfig(config);
}

export async function getElectronHotkeyConfig() {
  if (typeof window === 'undefined' || !window.electronAPI) return [];
  return await window.electronAPI.getHotkeyConfig();
}
