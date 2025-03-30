/**
 * Configuración centralizada para todos los servicios de API
 * 
 * Este archivo centraliza todas las configuraciones relacionadas con
 * las APIs para facilitar cambios y mantener consistencia.
 */

// URL base de la API principal
export const API_URL = process.env.REACT_APP_API_URL || 'https://ia.agroup.app/api';

// Consolidar opciones de autenticación
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ia.agroup.app/api';

// Usar un solo método de autenticación
export const AUTH_METHOD = 'direct'; // 'direct' o 'keycloak'

// Opciones de autenticación
export const AUTH_OPTIONS = {
  directAuth: {
    // Rutas corregidas según los logs del backend
    loginEndpoint: '/login',
    logoutEndpoint: '/logout',
    validateEndpoint: '/validate',
    profileEndpoint: '/profile',
    changePasswordEndpoint: '/change-password',
    // Otras rutas según sea necesario
  },
  keycloak: {
    url: process.env.REACT_APP_KEYCLOAK_URL,
    realm: process.env.REACT_APP_KEYCLOAK_REALM,
    clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID
  }
};

// Configuración para Keycloak
export const KEYCLOAK_CONFIG = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'https://auth.agroup.app/auth',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'IAssistant',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'web-client'
};

// Opciones globales para peticiones fetch
export const FETCH_OPTIONS = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
};

// Tiempos de espera (en milisegundos)
export const TIMEOUTS = {
  default: 15000,
  login: 20000,
  logout: 5000,
  tokenRefresh: 10000
};

// Opciones de solicitudes de autenticación
export const AUTH_PREFERENCES = {
  // Tiempo en minutos antes de que expire la sesión para refrescar el token
  refreshBeforeExpiry: 5,
  // Proveedor de autenticación (direct o keycloak)
  provider: process.env.REACT_APP_AUTH_PROVIDER || 'direct'
};

// Mapeo de valores para género (para mantener consistencia)
export const GENDER_MAPPING = {
  'masculino': 'Masculino',
  'femenino': 'Femenino',
  'no especificado': 'No especificado',
  'no especificar': 'No especificado',
  'male': 'Masculino',
  'female': 'Femenino',
  'unspecified': 'No especificado',
  // Versiones ya capitalizadas (se pasan directamente)
  'Masculino': 'Masculino',
  'Femenino': 'Femenino',
  'No especificado': 'No especificado'
};

// Generador de IDs de solicitud únicos para seguimiento en logs
export const generateRequestId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};
