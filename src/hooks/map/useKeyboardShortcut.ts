import { useEffect } from 'react';

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { ctrl?: boolean; meta?: boolean; preventDefault?: boolean } = {}
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMatch = e.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = options.ctrl ? e.ctrlKey || e.metaKey : true;
      const metaMatch = options.meta ? e.metaKey : true;

      if (keyMatch && ctrlMatch && metaMatch) {
        if (options.preventDefault !== false) e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, options.ctrl, options.meta, options.preventDefault]);
}
