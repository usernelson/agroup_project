import api from './axiosConfig';

/**
 * User Administration Module
 * 
 * This file provides functions for managing users (students) via the custom API
 * that connects to Keycloak in the backend.
 */

// Base API URL (ensure this is correct for your environment)
const API_URL = process.env.REACT_APP_API_URL || 'https://ia.agroup.app/api';

/**
 * Get all users (students) from the API
 * 
 * @param {number} retryCount - Number of retry attempts (internal use)
 * @returns {Promise<Object>} List of users and error info
 */
export const getUsers = async (retryCount = 0) => {
  try {
    console.log('[UserAdmin] Fetching users from API');
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      console.log('[UserAdmin] Starting fetch request to /users');
      
      const response = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Log exact server response for debugging
      const responseText = await response.text();
      console.log(`[UserAdmin] Server response (${response.status}):`, responseText);
      
      // Check for the specific error pattern from logs
      const isAdminTokenError = response.status === 500 && 
                               responseText.includes('401 Unauthorized');
      
      if (isAdminTokenError) {
        console.log('[UserAdmin] Detected admin token error pattern');
        return { 
          users: [], 
          errorType: 'admin_token',
          errorMessage: 'Error de autenticación en el servidor. El token de administrador ha expirado.'
        };
      }
      
      // If server returns regular 500, try alternative approach
      if (response.status === 500) {
        console.log('[UserAdmin] Server returned 500, trying alternative approach');
        
        // If still failing after retries, return empty array with server error
        if (retryCount >= 2) {
          console.log('[UserAdmin] Multiple 500 errors, returning empty array as fallback');
          return { 
            users: [], 
            errorType: 'server_error',
            errorMessage: 'Error en el servidor. Por favor intenta más tarde o contacta al administrador.'
          };
        }
        
        // Try again with a slight delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await getUsers(retryCount + 1);
      }
      
      if (!response.ok) {
        return { 
          users: [], 
          errorType: 'api_error',
          errorMessage: `Error ${response.status}: ${response.statusText}`
        };
      }
      
      try {
        // Try to parse response as JSON
        const data = JSON.parse(responseText);
        console.log('[UserAdmin] Successfully fetched users:', Array.isArray(data) ? data.length : 'Non-array response');
        return { users: data, errorType: null, errorMessage: null };
      } catch (parseError) {
        console.error('[UserAdmin] Error parsing response:', parseError);
        return { 
          users: [], 
          errorType: 'parse_error',
          errorMessage: 'Error al procesar la respuesta del servidor.'
        };
      }
    } catch (fetchError) {
      console.error('[UserAdmin] Fetch error:', fetchError);
      
      // If this is not the last retry, try again
      if (retryCount < 2) {
        console.log(`[UserAdmin] Retrying (${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await getUsers(retryCount + 1);
      }
      
      return { 
        users: [], 
        errorType: 'network_error',
        errorMessage: 'Error de red. Verifica tu conexión a internet.' 
      };
    }
  } catch (error) {
    console.error('[UserAdmin] Error fetching users:', error);
    
    return { 
      users: [], 
      errorType: 'unknown_error',
      errorMessage: error.message || 'Error desconocido al obtener usuarios.'
    };
  }
};

/**
 * Create a new user
 * 
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Create request payload with simplified structure
    const userPayload = {
      email: userData.email,
      username: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: userData.password,
      enabled: true,
      emailVerified: false,
      // Add these directly in payload root rather than in attributes
      gender: userData.gender || 'No especificado',
      phone_number: userData.phone || '',
      birth_date: userData.birthdate || '',
    };
    
    console.log('[UserAdmin] Creating user:', userPayload.email);
    console.log('[UserAdmin] User payload:', JSON.stringify(userPayload));
    
    // Try with a simplified approach first - direct fetch
    const rawResponse = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userPayload)
    });
    
    // Log the full response for debugging
    const responseText = await rawResponse.text();
    console.log(`[UserAdmin] Raw server response (${rawResponse.status}):`, responseText);
    
    if (!rawResponse.ok) {
      // If we get a 405 (Method Not Allowed) or other error, try another endpoint format
      if (rawResponse.status === 405 || rawResponse.status === 404) {
        console.log('[UserAdmin] Trying alternative endpoint format');
        // Try alternative url format
        const altResponse = await fetch(`${API_URL}/user`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userPayload)
        });
        
        if (!altResponse.ok) {
          throw new Error(`Error al crear usuario (${altResponse.status})`);
        }
        
        const altResponseText = await altResponse.text();
        try {
          return JSON.parse(altResponseText);
        } catch (e) {
          return { id: Date.now().toString(), ...userPayload };
        }
      }
      
      throw new Error(`Error al crear usuario (${rawResponse.status})`);
    }
    
    // Try to parse the success response
    try {
      const data = JSON.parse(responseText);
      console.log('[UserAdmin] User created successfully:', data);
      return data;
    } catch (e) {
      // If we can't parse as JSON but the request was successful
      // Return a synthetic response with the data we know
      console.log('[UserAdmin] User created successfully but response not JSON, creating synthetic response');
      return { 
        id: Date.now().toString(), 
        ...userPayload
      };
    }
  } catch (error) {
    console.error('[UserAdmin] Error creating user:', error);
    throw error;
  }
};

/**
 * Update an existing user
 * 
 * @param {string} userId - User ID to update
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (userId, userData) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    // Similarly for update, provide the attributes directly
    const updateData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      // Pass the values directly, not in attributes
      gender: userData.gender || 'No especificado',
      birth_date: userData.birthdate || '',
      phone_number: userData.phone || ''
    };
    
    console.log('[UserAdmin] Updating user:', userId);
    console.log('[UserAdmin] Update payload:', JSON.stringify(updateData));
    
    // Use fetch for better debugging
    const rawResponse = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    // Log the full response
    const responseText = await rawResponse.text();
    console.log(`[UserAdmin] Raw update response (${rawResponse.status}):`, responseText);
    
    if (!rawResponse.ok) {
      // Handle error response
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.errors) {
          const errorMessages = errorData.errors.map(e => 
            `${e.field}: ${e.errorMessage}`
          ).join(', ');
          throw new Error(`Datos inválidos: ${errorMessages}`);
        } else if (errorData.error || errorData.message) {
          throw new Error(errorData.error || errorData.message);
        }
      } catch (e) {
        throw new Error(`Error al actualizar usuario (${rawResponse.status}: ${rawResponse.statusText})`);
      }
    }
    
    // Try to parse the success response
    try {
      const data = JSON.parse(responseText);
      console.log('[UserAdmin] User updated successfully:', data);
      return data;
    } catch (e) {
      console.log('[UserAdmin] User updated successfully (non-JSON response)');
      return { success: true, message: responseText };
    }
  } catch (error) {
    console.error('[UserAdmin] Error updating user:', error);
    
    if (error.message.includes('Datos inválidos') || 
        error.message.includes('Error al actualizar usuario')) {
      throw error;
    }
    
    // Handle errors
    if (error.response) {
      console.error('[UserAdmin] Server response:', error.response.data);
      
      if (error.response.status === 404) {
        throw new Error('Usuario no encontrado');
      } else if (error.response.status === 403) {
        throw new Error('No tienes permisos para actualizar usuarios');
      } else if (error.response.status === 400) {
        // Try to extract and display the specific validation errors
        if (error.response.data && error.response.data.errors) {
          const errorMessages = error.response.data.errors.map(e => 
            `${e.field}: ${e.errorMessage}`
          ).join(', ');
          throw new Error(`Datos inválidos: ${errorMessages}`);
        } else {
          throw new Error('Datos de usuario inválidos. Verifica la información proporcionada');
        }
      }
    }
    
    throw new Error('Error al actualizar el usuario. Por favor intenta nuevamente.');
  }
};

/**
 * Delete a user
 * 
 * @param {string} userId - User ID to delete
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    console.log('[UserAdmin] Deleting user:', userId);
    
    await api.delete(`${API_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('[UserAdmin] User deleted successfully');
  } catch (error) {
    console.error('[UserAdmin] Error deleting user:', error);
    
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('Usuario no encontrado');
      } else if (error.response.status === 403) {
        throw new Error('No tienes permisos para eliminar usuarios');
      }
    }
    
    throw new Error('Error al eliminar el usuario');
  }
};

/**
 * Reset user password
 * 
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const resetPassword = async (userId, newPassword) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    console.log('[UserAdmin] Resetting password for user:', userId);
    
    await api.post(`${API_URL}/users/${userId}/reset-password`, {
      password: newPassword
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[UserAdmin] Password reset successfully');
  } catch (error) {
    console.error('[UserAdmin] Error resetting password:', error);
    
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('Usuario no encontrado');
      } else if (error.response.status === 403) {
        throw new Error('No tienes permisos para restablecer la contraseña');
      } else if (error.response.status === 400) {
        throw new Error('La contraseña no cumple con los requisitos de seguridad');
      }
    }
    
    throw new Error('Error al restablecer la contraseña');
  }
};

// Export all functions as a single object for easier imports
export default {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword
};
