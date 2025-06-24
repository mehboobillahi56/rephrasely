export interface ElectronAPI {
  onGlobalHotkey: (callback: (data: any) => void) => void;
  readClipboard: () => Promise<string>;
  writeClipboard: (text: string) => Promise<void>;
  setHotkeyConfig: (config: any[]) => Promise<void>;
  getHotkeyConfig: () => Promise<any[]>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
