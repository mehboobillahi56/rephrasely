export {}; // Ensures this file is a module

declare global {
  interface Window {
    electronAPI?: {
      onGlobalHotkey: (callback: (data: { combination: string }) => void) => void;
      readClipboard: () => Promise<string>;
      writeClipboard: (text: string) => Promise<void>;
      setHotkeyConfig: (config: any[]) => Promise<void>;
      getHotkeyConfig: () => Promise<any[]>;
    };
  }
}
