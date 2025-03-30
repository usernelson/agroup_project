import axios from 'axios';
import { API_URL } from './config';

// Crear una instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos de timeout por defecto
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Agregar interceptor para incluir el token en todas las peticiones
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Agregar interceptor para manejar errores de respuesta
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Para evitar bucles infinitos, solo intentar refrescar el token una vez
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Marcar esta petición como procesada para evitar loops
      originalRequest._retry = true;
      
      try {
        // Obtener el refreshToken del almacenamiento local
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          console.log('[API] Intentando renovar token');
          
          // Llamar al endpoint de renovación de token
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          // Si se obtuvo un nuevo token, actualizar localStorage y reintentar
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            
            if (response.data.refresh_token) {
              localStorage.setItem('refreshToken', response.data.refresh_token);
            }
            
            // Actualizar cabecera y reintentar la petición original
            originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (error) {
        console.error('[API] Error al renovar token:', error);
        
        // Si falla la renovación, limpiar tokens y redirigir al login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Redirigir al login con mensaje de error
        window.location.href = '/login?error=' + encodeURIComponent('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }
    }
    
    // Mejorar mensajes de error
    if (error.response) {
      switch (error.response.status) {
        case 400:
          error.userMessage = 'Datos incorrectos. Por favor revisa la información.';
          break;
        case 403:
          error.userMessage = 'No tienes permisos para realizar esta acción.';
          break;
        case 404:
          error.userMessage = 'El recurso solicitado no existe.';
          break;
        case 500:
          error.userMessage = 'Error en el servidor. Intenta más tarde.';
          break;
        default:
          error.userMessage = `Error ${error.response.status}: ${error.response.statusText}`;
      }
    } else if (error.request) {
      error.userMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    } else {
      error.userMessage = 'Ocurrió un error inesperado. Por favor intenta nuevamente.';
    }
    
    return Promise.reject(error);
  }
);

export default api;
