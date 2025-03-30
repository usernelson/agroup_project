import { useState, useEffect } from 'react';
import { localStorageService } from '../storage/localStorageService';

// Hook para manejar preferencias de usuario
export const useUserPreferences = () => {
  const [preferences, setPreferencesState] = useState(
    localStorageService.getUserPreferences()
  );
  
  const setPreferences = (newPrefs) => {
    const updatedPrefs = { ...preferences, ...newPrefs };
    setPreferencesState(updatedPrefs);
    localStorageService.setUserPreferences(updatedPrefs);
  };
  
  return [preferences, setPreferences];
};

// Hook para manejar historial de chat
export const useChatHistory = (userId) => {
  const [messages, setMessages] = useState(
    localStorageService.getChatHistory(userId)
  );
  
  // Guardar en localStorage cuando cambian los mensajes
  useEffect(() => {
    if (userId && messages.length > 0) {
      localStorageService.saveChatHistory(userId, messages);
    }
  }, [userId, messages]);
  
  return [messages, setMessages];
};

// Hook para estado de UI
export const useUIState = (initialState = {}) => {
  const [uiState, setUIStateInternal] = useState(() => {
    const savedState = localStorageService.getUIState();
    return { ...initialState, ...savedState };
  });
  
  const setUIState = (newState) => {
    const updatedState = typeof newState === 'function'
      ? newState(uiState)
      : { ...uiState, ...newState };
    
    setUIStateInternal(updatedState);
    localStorageService.saveUIState(updatedState);
  };
  
  return [uiState, setUIState];
};

/**
 * Custom hook for persistent state in localStorage
 *
 * @param {string} key - localStorage key
 * @param {any} initialValue - Default value if not in localStorage
 * @returns {[any, Function, Function]} - [value, setValue, removeValue]
 */
function useLocalStorage(key, initialValue) {
  // Get stored value or initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function
  const setValue = (value) => {
    try {
      // Allow value to be a function like React's setState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
        
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Dispatch storage event for cross-tab state
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: JSON.stringify(valueToStore),
        url: window.location.href
      }));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  // Remove value from localStorage
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  // Listen for changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (e) {
          console.error('Error parsing storage value:', e);
        }
      } else if (event.key === key && event.newValue === null) {
        // Item was removed
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
