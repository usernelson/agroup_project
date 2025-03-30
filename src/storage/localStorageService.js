/**
 * Servicio para gestionar el almacenamiento local de manera segura
 * Proporciona métodos para leer, escribir y eliminar datos
 * con manejo de errores y conversión automática entre JSON y tipos nativos.
 */

// Claves utilizadas en el almacenamiento
const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER_PROFILE: 'userProfile',
  SESSION_EXPIRY: 'session_expiry',
  USER_PREFS: 'userPreferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  CHAT_HISTORY: 'chatHistory',
  LAST_ROUTE: 'lastRoute',
  UI_STATE: 'uiState'
};

export const localStorageService = {
  /**
   * Almacena datos de forma segura
   * @private
   * @param {string} key - Clave para guardar
   * @param {any} value - Valor a guardar (se convierte a string si no lo es)
   * @returns {boolean} - Éxito de la operación
   */
  _secureSet: (key, value) => {
    try {
      // Si es null, eliminar la clave
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
        return true;
      }
      
      // Convertir a string si no lo es
      const valueToStore = typeof value === 'string' 
        ? value 
        : JSON.stringify(value);
      
      localStorage.setItem(key, valueToStore);
      return true;
    } catch (error) {
      console.error(`Error storing ${key} in localStorage:`, error);
      return false;
    }
  },
  
  /**
   * Recupera datos almacenados
   * @private
   * @param {string} key - Clave a recuperar
   * @returns {any} - Valor almacenado, null si no existe
   */
  _secureGet: (key) => {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;
      
      // Intentar parsear como JSON si es posible
      try {
        return JSON.parse(value);
      } catch (e) {
        // Si no es JSON, devolver como string
        return value;
      }
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return null;
    }
  },
  
  // Funciones para token de autenticación
  setAuthToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        
        // Also parse and store user role from token if available
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            
            // Extract roles from the token
            let userRole = 'alumno'; // Default role
            
            if (payload.resource_access && 
                payload.resource_access.ateacher_client_api_rest && 
                payload.resource_access.ateacher_client_api_rest.roles) {
              
              const roles = payload.resource_access.ateacher_client_api_rest.roles;
              
              if (roles.includes('profesor_client_role')) {
                userRole = 'profesor';
              } else if (roles.includes('alumno_client_role')) {
                userRole = 'alumno';
              }
              
              // Store user role
              localStorage.setItem('userRole', userRole);
            }
          }
        } catch (e) {
          console.warn('[Storage] Error extracting role from token:', e);
        }
      }
      return true;
    } catch (error) {
      console.error(`Error storing auth token:`, error);
      return false;
    }
  },
  
  getAuthToken: () => {
    return localStorageService._secureGet(STORAGE_KEYS.AUTH_TOKEN);
  },
  
  clearAuthToken: () => {
    return localStorageService._secureSet(STORAGE_KEYS.AUTH_TOKEN, null);
  },
  
  // Funciones para refresh token
  setRefreshToken: (token) => {
    return localStorageService._secureSet(STORAGE_KEYS.REFRESH_TOKEN, token);
  },
  
  getRefreshToken: () => {
    return localStorageService._secureGet(STORAGE_KEYS.REFRESH_TOKEN);
  },
  
  // Funciones para perfil de usuario
  setUserProfile: (profile) => {
    return localStorageService._secureSet(STORAGE_KEYS.USER_PROFILE, profile);
  },
  
  getUserProfile: () => {
    return localStorageService._secureGet(STORAGE_KEYS.USER_PROFILE);
  },
  
  // Funciones para tiempo de expiración de sesión
  setSessionExpiry: (expiryTime) => {
    return localStorageService._secureSet(STORAGE_KEYS.SESSION_EXPIRY, expiryTime);
  },
  
  getSessionExpiry: () => {
    return localStorageService._secureGet(STORAGE_KEYS.SESSION_EXPIRY);
  },
  
  // Verificar si el token ha expirado
  isTokenExpired: () => {
    const expiry = localStorageService.getSessionExpiry();
    if (!expiry) return true;
    
    // Añadir un buffer de 5 segundos para el tiempo de procesamiento
    return (Date.now() / 1000) > (parseInt(expiry, 10) - 5);
  },
  
  // Funciones para preferencias de usuario
  setUserPreferences: (preferences) => {
    return localStorageService._secureSet(STORAGE_KEYS.USER_PREFS, preferences);
  },
  
  getUserPreferences: () => {
    return localStorageService._secureGet(STORAGE_KEYS.USER_PREFS) || {};
  },
  
  // Tema de la interfaz
  setTheme: (theme) => {
    return localStorageService._secureSet(STORAGE_KEYS.THEME, theme);
  },
  
  getTheme: () => {
    return localStorageService._secureGet(STORAGE_KEYS.THEME) || 'light';
  },
  
  // Preferencia de idioma
  setLanguage: (language) => {
    return localStorageService._secureSet(STORAGE_KEYS.LANGUAGE, language);
  },
  
  getLanguage: () => {
    return localStorageService._secureGet(STORAGE_KEYS.LANGUAGE) || 'es';
  },
  
  // Limpiar todos los datos de autenticación
  clearAuthData: () => {
    localStorageService.clearAuthToken();
    localStorageService._secureSet(STORAGE_KEYS.REFRESH_TOKEN, null);
    localStorageService._secureSet(STORAGE_KEYS.SESSION_EXPIRY, null);
    return true;
  },
  
  // Limpiar todos los datos de usuario incluyendo preferencias
  clearUserData: () => {
    localStorageService.clearAuthData();
    localStorageService._secureSet(STORAGE_KEYS.USER_PROFILE, null);
    return true;
  },

  // User role
  getUserRole: () => localStorage.getItem('userRole'),
  setUserRole: (role) => localStorage.setItem('userRole', role),
  
  // Removing chat history functions
};

export default localStorageService;
