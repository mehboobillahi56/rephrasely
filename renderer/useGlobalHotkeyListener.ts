import { useEffect } from 'react';

export function useGlobalHotkeyListener(onHotkey: (combination: string) => void) {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;
    const handler = (data: { combination: string }) => {
      onHotkey(data.combination);
    };
    window.electronAPI.onGlobalHotkey(handler);
    return () => {
      // No off/unsubscribe API in this preload, so this is a no-op for now.
    };
  }, [onHotkey]);
}
