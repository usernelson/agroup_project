import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle keyboard shortcuts
 * 
 * @param {Object} shortcuts - Map of keys to handler functions
 * @param {boolean} [active=true] - Whether shortcuts are active
 * @param {boolean} [preventDefault=true] - Whether to prevent default behavior
 * @returns {void}
 */
const useKeyboardShortcut = (
  shortcuts,
  active = true,
  preventDefault = true
) => {
  const handlerRef = useRef(null);

  // Keep shortcut references up to date without triggering effect
  useEffect(() => {
    handlerRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const handlers = handlerRef.current || {};
      
      // Handle Shift+key or Ctrl+key combinations
      const prefix = 
        event.shiftKey ? 'shift+' : 
        event.ctrlKey ? 'ctrl+' : 
        event.altKey ? 'alt+' : 
        '';
      
      const fullKey = prefix + key;
      
      if (handlers[fullKey] || handlers[key]) {
        if (preventDefault) {
          event.preventDefault();
        }
        
        const handler = handlers[fullKey] || handlers[key];
        handler(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, preventDefault]);
};

export default useKeyboardShortcut;
