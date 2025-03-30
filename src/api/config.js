/**
 * Configuración centralizada para APIs
 * Este archivo contiene todas las constantes y configuraciones 
 * necesarias para las llamadas API
 */

// Base URL para las APIs
export const API_URL = process.env.REACT_APP_API_URL || 'https://ia.agroup.app/api';

// Opciones comunes para fetch con credentials incluidas
export const FETCH_OPTIONS = {
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  },
  credentials: 'include' // Para enviar cookies en peticiones cross-origin
};

// Endpoints de API actualizados según los logs del backend
export const API_ENDPOINTS = {
  login: '/login',
  logout: '/logout',
  validate: '/validate',
  profile: '/profile',
  changePassword: '/change-password',
  changeEmail: '/change-email',
  // Más endpoints según sea necesario
};

// Timeouts para diferentes tipos de peticiones
export const TIMEOUTS = {
  default: 30000,         // 30 segundos para peticiones normales
  upload: 120000,         // 2 minutos para subidas
  download: 60000,        // 1 minuto para descargas
  tokenRefresh: 15000     // 15 segundos para renovación de token
};

// Proveedor de autenticación (direct o keycloak)
export const AUTH_OPTIONS = {
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

// Add configuration for required fields in Keycloak
export const KEYCLOAK_REQUIRED_ATTRIBUTES = [
  'gender',
  'phone_number'
];

// Add configuration for field mappings from React to Keycloak
export const FIELD_MAPPINGS = {
  phone: 'phone_number',
  birthdate: 'birth_date',
  createdBy: 'created_by'
};
