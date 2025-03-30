import api from './axiosConfig';
import { localStorageService } from '../storage/localStorageService';
import { storeAuthData, clearAuthData, shouldRefreshSession } from '../auth/authUtils';
import { 
  API_URL, 
  FETCH_OPTIONS, 
  TIMEOUTS, 
  generateRequestId 
} from './apiConfig';

/**
 * Módulo de Autenticación de Usuarios
 * 
 * Este módulo gestiona las funciones principales de autenticación:
 * - Login/logout: Autenticación y cierre de sesión
 * - Validación de tokens: Verificar que la sesión actual es válida
 * - Renovación de tokens: Actualizar tokens expirados
 * - Gestión de perfil: Obtener y actualizar información del usuario
 */

/**
 * Realiza el login del usuario enviando las credenciales a la API.
 * @param {string} username - Email o nombre de usuario
 * @param {string} password - Contraseña
 * @param {string} [otp] - Código de autenticación de dos factores (si está habilitado)
 * @returns {Promise<Object>} Datos de la sesión incluyendo token de acceso
 */
export const login = async (username, password, otp) => {
  try {
    console.log('[API] Enviando login con credenciales:', { username, otpProvided: !!otp });
    
    // Bandera para evitar validación durante el proceso de login
    window.isLoggingIn = true;
    
    // Crear formdata para el backend
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    if (otp) {
      formData.append('totp', otp);
    }

    // Agregar ID de solicitud para seguimiento en logs
    const requestId = generateRequestId('login');
    formData.append('request_id', requestId);

    // Configurar un timeout para prevenir peticiones colgadas
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.login);

    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      credentials: FETCH_OPTIONS.credentials,
      signal: controller.signal,
      body: formData,
      headers: {
        'X-Request-ID': requestId
      }
    });
    
    clearTimeout(timeoutId);

    // Manejar errores con mensajes detallados
    if (!response.ok) {
      console.error(`[API] Login error: Status ${response.status}`);
      const errorText = await response.text();
      let errorMessage = 'Error de autenticación';
      
      // Map status codes to user-friendly messages
      if (response.status === 401) {
        errorMessage = 'Credenciales incorrectas. Por favor verifica tu email y contraseña.';
      } else if (response.status === 403) {
        errorMessage = 'Tu cuenta ha sido bloqueada. Por favor contacta a soporte.';
      } else if (response.status === 422) {
        errorMessage = 'El código OTP es inválido o ha expirado.';
      } else if (response.status === 429) {
        errorMessage = 'Demasiados intentos fallidos. Intenta nuevamente más tarde.';
      } else if (errorText) {
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          if (errorText.length < 100) {
            errorMessage = errorText;
          }
        }
      }
      
      window.isLoggingIn = false;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[API] Login response received:', {
      hasToken: !!data.token || !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      hasExp: !!data.exp
    });
    
    // Almacenar tokens usando función centralizada
    const tokensStored = storeAuthData(data);
    
    if (!tokensStored) {
      console.error('[API] Critical error: Tokens not saved to localStorage!');
      throw new Error('Error al guardar tokens de sesión. Por favor intenta nuevamente.');
    }
    
    return data;
  } catch (error) {
    console.error('[API] Login error:', error);
    window.isLoggingIn = false;
    
    // Add context to generic errors
    if (!error.message.includes('Credenciales') && 
        !error.message.includes('OTP') && 
        !error.message.includes('bloqueada') &&
        !error.message.includes('intentos') &&
        !error.message.includes('tokens')) {
      error.message = 'Error al intentar iniciar sesión. Por favor intenta nuevamente.';
    }
    throw error;
  }
};

/**
 * Valida el token de sesión almacenado para verificar que sigue siendo válido.
 * Si el token está próximo a expirar, intenta renovarlo primero.
 * 
 * @returns {Promise<Object>} Datos del usuario autenticado
 */
export const validateToken = async () => {
  // Omitir validación si estamos en proceso de login
  if (window.isLoggingIn === true) {
    console.log("[API] Skipping token validation during login process");
    throw new Error("Login in progress");
  }

  console.log("[API] Validando token de sesión");
  
  // Verificar si tenemos un token en localStorage
  const token = localStorageService.getAuthToken();
  if (!token) {
    console.error("[API] No token found in localStorage");
    throw new Error("No authentication token found");
  }
  
  // Si el token está cerca de expirar, intentar renovarlo primero
  if (shouldRefreshSession()) {
    try {
      console.log("[API] Token próximo a expirar, renovando primero");
      await refreshToken();
      console.log("[API] Token renovado exitosamente, continuando con validación");
    } catch (refreshError) {
      console.warn("[API] Falló renovación del token, continuando con validación:", refreshError);
    }
  }
  
  try {
    // Configurar timeout para prevenir peticiones colgadas
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.default);
    
    // Generar ID de solicitud para seguimiento
    const requestId = generateRequestId('validate');
    
    const response = await fetch(`${API_URL}/validate`, {
      method: 'GET',
      credentials: FETCH_OPTIONS.credentials,
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': FETCH_OPTIONS.headers['Cache-Control'],
        'Pragma': FETCH_OPTIONS.headers['Pragma'],
        'X-Request-ID': requestId
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`[API] Token validation failed with status ${response.status}`);
      
      // Provide more specific error messages based on status code
      if (response.status === 401) {
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      } else if (response.status === 403) {
        throw new Error('No tienes permiso para acceder a esta funcionalidad.');
      }
      
      throw new Error(`Validation failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log("[API] Token validation successful:", data);
    
    // Actualizar tiempo de expiración en localStorage si se proporciona
    if (data.exp) {
      localStorageService.setSessionExpiry(data.exp);
    }
    
    return data;
  } catch (error) {
    console.error('[API] Token validation error:', error.message || error);
    
    // Si el error es por timeout o aborto, proporcionar un mensaje más claro
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      throw new Error('La validación del token excedió el tiempo de espera. Verifica tu conexión a internet.');
    }
    
    // If the error doesn't have a user-friendly message, add one
    if (!error.message.includes('sesión') && 
        !error.message.includes('permiso') && 
        !error.message.includes('tiempo de espera')) {
      error.message = 'Error al validar tu sesión. Por favor inicia sesión nuevamente.';
    }
    
    // Propagar el error para que AuthContext lo maneje
    throw error;
  }
};

/**
 * Intenta renovar el token de acceso usando el refresh token.
 * Esta función se encarga de evitar múltiples solicitudes simultáneas
 * de renovación utilizando banderas globales.
 * 
 * @returns {Promise<Object>} Nuevos tokens de sesión
 */
export const refreshToken = async () => {
  console.log("[API] Attempting to refresh token");
  
  // Verificar si ya tenemos una solicitud de renovación pendiente
  if (window.refreshingToken) {
    console.log("[API] Token refresh already in progress");
    return window.refreshingPromise;
  }
  
  try {
    // Establecer bandera indicando que estamos renovando
    window.refreshingToken = true;
    
    // Crear una promesa para retornar
    window.refreshingPromise = new Promise(async (resolve, reject) => {
      try {
        // Asegurar que estamos usando el refresh token más actualizado
        const refreshTokenValue = localStorageService.getRefreshToken();
        if (!refreshTokenValue) {
          console.error("[API] No refresh token available");
          throw new Error('No hay token de actualización disponible. Por favor inicia sesión nuevamente.');
        }
        
        // Configurar un timeout para prevenir peticiones colgadas
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.tokenRefresh);
        
        // Generar ID de solicitud para seguimiento
        const requestId = generateRequestId('refresh');
        
        const response = await fetch(`${API_URL}/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': FETCH_OPTIONS.headers['Content-Type'],
            'Cache-Control': FETCH_OPTIONS.headers['Cache-Control'],
            'Pragma': FETCH_OPTIONS.headers['Pragma'],
            'X-Request-ID': requestId
          },
          credentials: FETCH_OPTIONS.credentials,
          signal: controller.signal,
          body: JSON.stringify({
            refresh_token: refreshTokenValue
          })
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`[API] Token refresh failed with status ${response.status}`);
          
          // Clear tokens on 401 Unauthorized (invalid refresh token)
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          }
          
          throw new Error(`Error al renovar la sesión (${response.status})`);
        }
        
        const data = await response.json();
        console.log("[API] Token refresh successful");
        
        // Almacenar tokens usando la función centralizada
        const tokensStored = storeAuthData(data);
        
        if (!tokensStored) {
          console.error('[API] Error: Refreshed tokens not saved to localStorage!');
          throw new Error('Error al guardar tokens actualizados. Por favor inicia sesión nuevamente.');
        }
        
        resolve(data);
      } catch (error) {
        console.error('[API] Error refreshing token:', error);
        reject(error);
      } finally {
        // Limpiar banderas después de 500ms para prevenir múltiples intentos rápidos
        setTimeout(() => {
          window.refreshingToken = false;
          window.refreshingPromise = null;
        }, 500);
      }
    });
    
    return await window.refreshingPromise;
  } catch (error) {
    console.error('[API] Token refresh outer error:', error);
    
    // Clear refresh flags in case of error
    setTimeout(() => {
      window.refreshingToken = false;
      window.refreshingPromise = null;
    }, 500);
    
    throw error;
  }
};

/**
 * Cierra la sesión del usuario, eliminando tokens locales e 
 * invalidando la sesión en el servidor.
 * 
 * @returns {Promise<void>}
 */
export const logout = async () => {
  console.log("[API] Logout function called");
  
  // Establecer bandera para prevenir múltiples llamadas de logout
  if (window.loggingOut) {
    console.log("[API] Already logging out, skipping request");
    return;
  }
  
  window.loggingOut = true;
  
  // Obtener el token actual para la solicitud de logout
  const currentToken = localStorageService.getAuthToken();
  
  // Limpiar TODOS los datos de autenticación inmediatamente usando función centralizada
  clearAuthData();
  
  try {
    // Omitir logout en servidor si no hay token (nada que invalidar)
    if (!currentToken) {
      console.log("[API] No token present, skipping server logout request");
      return;
    }
    
    // Enviar solicitud de logout al servidor
    const logoutPromise = fetch(`${API_URL}/logout`, {
      method: 'POST',
      credentials: FETCH_OPTIONS.credentials,
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Cache-Control': FETCH_OPTIONS.headers['Cache-Control'],
        'Pragma': FETCH_OPTIONS.headers['Pragma'],
        'X-Request-ID': generateRequestId('logout')
      }
    });
    
    // Establecer un timeout en caso de que el servidor no responda
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Logout request timed out')), TIMEOUTS.logout)
    );
    
    // Esperar a la primera de estas promesas que se resuelva/rechace
    await Promise.race([logoutPromise, timeoutPromise])
      .catch(error => {
        console.warn("[API] Logout server request failed, proceeding anyway:", error);
      });
      
    console.log("[API] Logout process completed");
  } catch (error) {
    console.error('[API] Logout client-side error:', error);
  } finally {
    // Cualquier redirección es manejada por el llamador de esta función
    setTimeout(() => {
      window.loggingOut = false;
    }, 500);
  }
};

/**
 * Obtiene la información de perfil del usuario desde la API.
 * 
 * @returns {Promise<Object>} Datos del perfil del usuario
 */
export const getProfile = async () => {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    
    // Mejora los mensajes de error basados en el código de estado
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      } else if (error.response.status === 403) {
        throw new Error('No tienes permiso para acceder a esta información.');
      } else if (error.response.status === 404) {
        throw new Error('No se encontró tu perfil de usuario.');
      }
    }
    
    throw new Error('Error al cargar tu perfil. Por favor intenta nuevamente.');
  }
};

/**
 * Solicita el cambio de contraseña del usuario actual.
 *
 * @param {string} newPassword - La nueva contraseña que se desea establecer
 * @returns {Promise<Object>} Respuesta de la API con resultado de la operación
 */
export const changePassword = async (newPassword) => {
  try {
    const response = await fetch(`${API_URL}/change-password`, {
      method: "POST",
      credentials: FETCH_OPTIONS.credentials,
      headers: { 
        "Content-Type": FETCH_OPTIONS.headers['Content-Type'],
        'X-Request-ID': generateRequestId('change_password')
      },
      body: JSON.stringify({ new_password: newPassword }),
    });
    
    if (!response.ok) {
      const status = response.status;
      if (status === 401) {
        throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
      } else if (status === 400) {
        const data = await response.json();
        throw new Error(data.message || "La contraseña no cumple con los requisitos de seguridad.");
      }
      throw new Error("Error al cambiar la contraseña");
    }
    
    return await response.json();
  } catch (error) {
    console.error('[API] Change password error:', error);
    throw error.message ? error : new Error("Error al cambiar la contraseña");
  }
};

/**
 * Solicita el cambio del correo electrónico del usuario actual.
 *
 * @param {string} newEmail - El nuevo correo electrónico a establecer
 * @returns {Promise<Object>} Respuesta de la API con resultado de la operación
 */
export const changeEmail = async (newEmail) => {
  try {
    const response = await fetch(`${API_URL}/change-email`, {
      method: "POST",
      credentials: FETCH_OPTIONS.credentials,
      headers: { 
        "Content-Type": FETCH_OPTIONS.headers['Content-Type'],
        'X-Request-ID': generateRequestId('change_email')
      },
      body: JSON.stringify({ new_email: newEmail }),
    });
    
    if (!response.ok) {
      const status = response.status;
      if (status === 401) {
        throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
      } else if (status === 409) {
        throw new Error("Este correo electrónico ya está en uso.");
      } else if (status === 400) {
        const data = await response.json();
        throw new Error(data.message || "El correo electrónico no es válido.");
      }
      throw new Error("Error al cambiar el correo electrónico");
    }
    
    return await response.json();
  } catch (error) {
    console.error('[API] Change email error:', error);
    throw error.message ? error : new Error("Error al cambiar el correo electrónico");
  }
};

/**
 * Actualiza el perfil del usuario actual con los datos proporcionados.
 *
 * @param {string} gender - Género del usuario ("masculino", "femenino", "no especificar")
 * @param {string} birthDate - Fecha de nacimiento (formato YYYY-MM-DD)
 * @param {string} phoneNumber - Número de teléfono en formato internacional (+56...)
 * @param {string} sala - Sala/grupo del usuario
 * @returns {Promise<Object>} Respuesta de la API con resultado de la operación
 */
export const updateProfile = async (gender, birthDate, phoneNumber, sala) => {
  try {
    const response = await fetch(`${API_URL}/update-profile`, {
      method: "POST",
      credentials: FETCH_OPTIONS.credentials,
      headers: { 
        "Content-Type": FETCH_OPTIONS.headers['Content-Type'],
        'X-Request-ID': generateRequestId('update_profile')
      },
      body: JSON.stringify({
        gender,
        birth_date: birthDate,
        phone_number: phoneNumber,
        sala: sala
      }),
    });
    
    if (!response.ok) {
      const status = response.status;
      if (status === 401) {
        throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
      } else if (status === 400) {
        const data = await response.json();
        throw new Error(data.message || "Error en los datos proporcionados.");
      }
      throw new Error("Error al actualizar el perfil del usuario");
    }
    
    return await response.json();
  } catch (error) {
    console.error('[API] Update profile error:', error);
    throw error.message ? error : new Error("Error al actualizar el perfil del usuario");
  }
};

// Nota: Las funciones de gestión de usuarios se han movido a userAdmin.js
// Para compatibilidad con versiones anteriores, re-exportamos desde allí
export { 
  getUsers, 
  createUser, 
  editUser, 
  deleteUser,
  register
} from './userAdmin';