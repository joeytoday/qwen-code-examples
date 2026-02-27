'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutAction {
  key: string;
  ctrlOrMeta: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutAction[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlOrMeta ? isCtrlOrMeta : !isCtrlOrMeta;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

        if (keyMatch && ctrlMatch && shiftMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function getShortcutLabel(key: string, ctrlOrMeta: boolean, shift?: boolean): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
  const parts: string[] = [];

  if (ctrlOrMeta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  parts.push(key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}
