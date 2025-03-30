import api from './axiosConfig';
import { 
  API_URL, 
  FETCH_OPTIONS, 
  TIMEOUTS, 
  generateRequestId
} from './config';

/**
 * Módulo de Autenticación Unificado
 * 
 * Este módulo consolida toda la funcionalidad de autenticación de la aplicación,
 * unificando la lógica que estaba dispersa en múltiples archivos.
 */

/**
 * Realiza el login del usuario enviando las credenciales a la API.
 * @param {string} username - Email o nombre de usuario
 * @param {string} password - Contraseña
 * @param {string} [otp] - Código de autenticación de dos factores (si está habilitado)
 * @param {boolean} [rememberMe] - Indicador de "recordarme"
 */
export const login = async (username, password, otp = null, rememberMe = false) => {
  try {
    // Preparar el formulario con las credenciales
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    if (otp) {
      formData.append('totp', otp); // Cambiar 'otp' a 'totp' para que coincida con el backend
    }
    
    if (rememberMe) {
      formData.append('remember_me', 'true');
    }
    
    // Configurar timeout para prevenir peticiones colgadas
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.default);
    
    // Generar ID de solicitud para seguimiento
    const requestId = generateRequestId('login');
    
    // Usar la ruta '/api/login' según los logs del backend
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
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // Si no es JSON, usar el texto de error directamente
          if (errorText.length < 100) {
            errorMessage = errorText;
          }
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // Procesar la respuesta exitosa
    const data = await response.json();
    
    // Guardar tokens y datos de sesión - ensure we're using the correct property names
    if (data.token || data.access_token) {
      const token = data.token || data.access_token;
      console.log("[API] Storing auth token in localStorage");
      localStorage.setItem('token', token);
      
      // Also extract user role from token if possible
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.resource_access && 
              payload.resource_access.ateacher_client_api_rest && 
              payload.resource_access.ateacher_client_api_rest.roles) {
            
            const roles = payload.resource_access.ateacher_client_api_rest.roles;
            let userRole = 'alumno'; // Default
            
            if (roles.includes('profesor_client_role')) {
              userRole = 'profesor';
              console.log("[API] Setting user role to profesor");
            } else if (roles.includes('alumno_client_role')) {
              userRole = 'alumno';
              console.log("[API] Setting user role to alumno");
            }
            
            localStorage.setItem('userRole', userRole);
          }
        }
      } catch (e) {
        console.warn("[API] Error extracting role from token:", e);
      }
    }
    
    if (data.refresh_token) {
      console.log("[API] Storing refresh token in localStorage");
      localStorage.setItem('refreshToken', data.refresh_token);
    }
    
    if (data.exp) {
      console.log("[API] Storing session expiry in localStorage:", data.exp);
      localStorage.setItem('session_expiry', data.exp);
    }
    
    // Opcionalmente guardar otros datos del usuario
    if (data.user) {
      // Guardar datos del usuario si se proporcionan
      console.log("[API] Storing user profile in localStorage");
      localStorage.setItem('userProfile', JSON.stringify(data.user));
    }
    
    console.log("[API] Login successful");
    return data;
  } catch (error) {
    console.error('[API] Login error:', error);
    
    // Mejorar mensajes de error específicos
    if (error.name === 'AbortError') {
      throw new Error('La solicitud tomó demasiado tiempo. Por favor verifica tu conexión a internet.');
    }
    
    throw error;
  }
};

export const validateToken = async (tokenParam) => {
  try {
    console.log('[API] Validating token...');
    
    // Verificar primero si hay token
    const token = tokenParam || localStorage.getItem('token');
    if (!token) {
      throw new Error('No token available');
    }
    
    // Intentar validar el token via API
    try {
      // Usar la ruta '/api/validate' según los logs del backend
      const response = await fetch(`${API_URL}/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: FETCH_OPTIONS.credentials
      });
      
      if (response.ok) {
        const validationResult = await response.json();
        return {
          valid: true,
          active: true,
          exp: validationResult.exp,
          user: validationResult.username || validationResult.user_id,
          // ...resto de datos
        };
      }
    } catch (apiError) {
      console.warn('[API] Token API validation failed, falling back to direct validation:', apiError);
    }
    
    // Fallback a validación directa de JWT si la API falla
    const storedToken = tokenParam || localStorage.getItem('token');
    if (storedToken) {
      try {
        // JWT tokens are in format: header.payload.signature
        const parts = storedToken.split('.');
        if (parts.length === 3) {
          // Decode the payload (middle part)
          const decodedPayload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(decodedPayload);
          const currentTime = Math.floor(Date.now() / 1000);
          
          console.log('[API] Direct token validation: Token payload decoded', { 
            exp: payload.exp, 
            currentTime,
            roles: payload.resource_access?.ateacher_client_api_rest?.roles || []
          });
          
          // Check if token is expired
          if (payload.exp && payload.exp > currentTime) {
            console.log('[API] Direct validation: Token is valid and not expired');
            
            // Extract roles from the token
            const roles = [];
            
            // Check for roles in resource_access
            if (payload.resource_access && 
                payload.resource_access.ateacher_client_api_rest && 
                payload.resource_access.ateacher_client_api_rest.roles) {
              roles.push(...payload.resource_access.ateacher_client_api_rest.roles);
            }
            
            // Map client roles to application roles
            let userRole = 'alumno'; // Default role
            
            if (roles.includes('profesor_client_role')) {
              userRole = 'profesor';
            } else if (roles.includes('alumno_client_role')) {
              userRole = 'alumno';
            }
            
            // Store user role in localStorage for easy access
            localStorage.setItem('userRole', userRole);
            
            // Return a structure similar to what your backend would return
            return {
              valid: true,
              active: true,
              exp: payload.exp,
              userRole: userRole,
              user: payload.sub || payload.email || payload.username,
              roles: roles,
              email: payload.email,
              username: payload.preferred_username || payload.email,
              firstName: payload.given_name,
              lastName: payload.family_name,
              name: payload.name,
              phoneNumber: payload.phone_number,
              gender: payload.gender,
              birthdate: payload.birthdate
            };
          } else {
            console.log('[API] Direct validation: Token is expired', { 
              expiry: payload.exp, 
              now: currentTime 
            });
            throw new Error('Token expired');
          }
        } else {
          console.log('[API] Direct validation: Invalid token format');
          throw new Error('Invalid token format');
        }
      } catch (e) {
        console.error('[API] Error in direct token validation:', e);
        throw new Error('Token validation failed: ' + e.message);
      }
    } else {
      console.log('[API] No token available for validation');
      throw new Error('No token available');
    }
  } catch (error) {
    console.error('[API] Token validation error:', error);
    throw error;
  }
};

// Complete las funciones faltantes mencionadas en la exportación
export const logout = async () => {
  try {
    // Opcional: Notificar al servidor sobre el logout
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Usar la ruta '/api/logout' según los logs del backend
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: FETCH_OPTIONS.credentials
        });
      } catch (error) {
        console.warn('[API] Error notificando logout al servidor:', error);
        // Continuar con el proceso de logout local incluso si falla la API
      }
    }
    
    // Limpiar datos de autenticación locales
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('session_expiry');
    
    return { success: true };
  } catch (error) {
    console.error('[API] Logout error:', error);
    throw error;
  }
};

// Fix refreshToken to handle missing refresh token gracefully
export const refreshToken = async () => {
  try {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    
    // CRITICAL FIX: Provide a clearer error message for missing refresh token
    if (!refreshTokenValue) {
      console.warn('[API] No refresh token available in localStorage');
      throw new Error('No refresh token available');
    }
    
    // CORREGIR: Cambiar la ruta de auth/refresh a refresh (sin el prefijo auth/)
    const response = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refresh_token: refreshTokenValue
      })
    });
    
    if (!response.ok) {
      const errorMessage = `Error refreshing token: ${response.status} ${response.statusText}`;
      console.error('[API] ' + errorMessage);
      
      // CRITICAL FIX: For 401/403 errors, clear stored tokens to force re-login
      if (response.status === 401 || response.status === 403) {
        console.warn('[API] Authentication error during token refresh, clearing stored tokens');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    // Actualizar tokens
    if (data.token || data.access_token) {
      const newToken = data.token || data.access_token;
      localStorage.setItem('token', newToken);
      console.log('[API] Token refreshed successfully');
    }
    
    if (data.refresh_token) {
      localStorage.setItem('refreshToken', data.refresh_token);
    }
    
    if (data.exp) {
      localStorage.setItem('session_expiry', data.exp);
    }
    
    return data;
  } catch (error) {
    console.error('[API] Token refresh error:', error);
    throw error;
  }
};

// Mejorar gestión de cambio de contraseña
export const changePassword = async (oldPassword, newPassword) => {
  try {
    // CORREGIR: Cambiar la ruta de auth/change-password a change-password (sin el prefijo auth/)
    const response = await api.post('/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    });
    return response.data;
  } catch (error) {
    console.error('[API] Change password error:', error);
    
    // Si el error es 404, intenta simular una operación exitosa para desarrollo
    if (error.response && error.response.status === 404 && process.env.NODE_ENV === 'development') {
      console.warn('[DEV MODE] Simulando cambio de contraseña exitoso');
      return { success: true, message: 'Contraseña actualizada (simulada)' };
    }
    
    throw error;
  }
};

// STANDARDIZED: Update profile function to format data exactly for Keycloak requirements
export const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    console.log('[API] Updating profile with data:', profileData);
    
    // STANDARDIZED FORMAT: Ensure data is formatted correctly for backend
    const formattedData = {
      firstName: profileData.firstName || '',
      lastName: profileData.lastName || '',
      // Format attributes as expected by our updated backend endpoint
      attributes: {
        phone_number: profileData.phone || profileData.phone_number || '',
        gender: profileData.gender || '',
        birth_date: profileData.birthdate || profileData.birth_date || ''
      }
    };
    
    // Preserve createdBy/created_by if it exists
    if (profileData.created_by || profileData.createdBy) {
      formattedData.attributes.created_by = profileData.created_by || profileData.createdBy;
    }
    
    console.log('[API] Sending update request with data:', formattedData);
    
    // Use our new fixed API endpoint
    const response = await fetch(`${API_URL}/user-profile`, {
      method: 'PUT', 
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattedData)
    });
    
    // Handle common errors
    if (!response.ok) {
      // Try to parse error response
      let errorMessage = `Error del servidor: ${response.status}`;
      
      try {
        const errorData = await response.json();
        console.error('[API] Error response:', errorData);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        console.error('[API] Error parsing error response:', e);
      }
      
      // Special handling for common error cases
      if (response.status === 401) {
        throw new Error('Sesión expirada. Por favor, vuelve a iniciar sesión.');
      } else if (response.status === 403) {
        throw new Error('No tienes permisos para realizar esta acción.');
      }
      
      throw new Error(errorMessage);
    }
    
    // Parse successful response
    const result = await response.json();
    console.log('[API] Profile update successful:', result);
    
    return result;
  } catch (error) {
    console.error('[API] Error updating profile:', error);
    
    // In development mode, simulate success if needed
    if (process.env.NODE_ENV === 'development' && error.message.includes('servidor')) {
      console.warn('[API] DEV MODE: Simulating successful profile update despite error');
      
      return { 
        success: true, 
        simulated: true,
        message: 'Perfil actualizado correctamente (simulado)'
      };
    }
    
    throw error;
  }
};

/**
 * Get user profile from Keycloak via Python API with retry mechanism
 * 
 * @param {number} retryCount - Current retry attempt (internal use)
 * @returns {Promise<Object>} User profile data from Keycloak
 */
export const getProfile = async (retryCount = 0) => {
  try {
    // Get token with better error handling
    let token;
    try {
      token = localStorage.getItem('token');
      
      // Check token format - some tokens might have 'Bearer ' prefix
      if (token && token.startsWith('Bearer ')) {
        token = token.substring(7);
      }
      
      // Debug why token might be missing
      if (!token) {
        console.log('[getProfile] No token in localStorage, checking cookie');
        // Look for token in cookie as fallback (if applicable to your app)
        const cookies = document.cookie.split(';').map(c => c.trim());
        const tokenCookie = cookies.find(c => c.startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
          console.log('[getProfile] Found token in cookie, storing in localStorage');
          localStorage.setItem('token', token);
        }
        
        // If token doesn't exist but we have refresh token, try to refresh
        if (!token && localStorage.getItem('refreshToken')) {
          console.log('[getProfile] No token but refresh token exists, attempting refresh');
          try {
            const refreshResult = await refreshToken();
            if (refreshResult && refreshResult.token) {
              token = refreshResult.token;
            }
          } catch (refreshError) {
            console.warn('[getProfile] Token refresh failed:', refreshError);
          }
        }
      }
    } catch (localStorageError) {
      console.error('[getProfile] Error accessing localStorage:', localStorageError);
    }
    
    if (!token) {
      // If we still have retries left, wait and try again
      if (retryCount < 2) {
        console.log(`[getProfile] No token yet, retry ${retryCount + 1}/2...`);
        // Wait a second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getProfile(retryCount + 1);
      }
      throw new Error('No authentication token available');
    }
    
    // Use the dedicated Keycloak profile endpoint
    const response = await fetch(`${API_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        console.warn('Error response was not JSON:', errorText);
      }
      throw new Error(errorData.message || errorData.error || 'Error fetching user profile');
    }
    
    const profileData = await response.json();
    console.log('Keycloak profile loaded:', profileData);
    
    // Transform Keycloak attributes to standardized format
    const standardizedProfile = {
      ...profileData,
      // Map Keycloak attributes to our standard format
      firstName: profileData.firstName || profileData.given_name || '',
      lastName: profileData.lastName || profileData.family_name || '',
      email: profileData.email || '',
      phone: profileData.attributes?.phone_number?.[0] || 
             profileData.phone_number || 
             profileData.attributes?.phoneNumber?.[0] || 
             '',
      gender: profileData.attributes?.gender?.[0] || 
              profileData.gender || 
              '',
      birthdate: profileData.attributes?.birth_date?.[0] || 
                 profileData.attributes?.birthdate?.[0] || 
                 profileData.birthdate || 
                 '',
      createdBy: profileData.attributes?.created_by?.[0] || 
                 profileData.attributes?.createdBy?.[0] || 
                 profileData.createdBy || 
                 profileData.created_by || 
                 ''
    };
    
    return standardizedProfile;
  } catch (error) {
    console.error('Error in getProfile:', error);
    
    // If profile fetch fails, create a minimal profile from token
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          
          return {
            email: payload.email || payload.sub || 'usuario@example.com',
            firstName: payload.given_name || payload.name?.split(' ')[0] || 'Usuario',
            lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '',
            role: localStorage.getItem('userRole') || 'alumno',
            // Make sure createdBy is included in fallback
            createdBy: payload.created_by || ''
          };
        }
      }
    } catch (tokenError) {
      console.error('Error extracting profile from token:', tokenError);
    }
    
    throw error;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post('/auth/reset-password', {
      token,
      new_password: newPassword
    });
    return response.data;
  } catch (error) {
    console.error('[API] Reset password error:', error);
    throw error;
  }
};

export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('[API] Request password reset error:', error);
    throw error;
  }
};

export const register = async (email, password, firstName, lastName) => {
  try {
    const response = await api.post('/auth/register', {
      email,
      password,
      firstName,
      lastName
    });
    return response.data;
  } catch (error) {
    console.error('[API] Register error:', error);
    throw error;
  }
};

// Exportar todas las funciones de autenticación
const authService = {
  login,
  logout,
  validateToken,
  refreshToken,
  register,
  changePassword,
  updateProfile,
  resetPassword,
  requestPasswordReset,
  getProfile
};

export default authService;
