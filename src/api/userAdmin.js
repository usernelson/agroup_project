import api from './axiosConfig';
import { 
  API_URL, 
  FETCH_OPTIONS, 
  generateRequestId,
  GENDER_MAPPING 
} from './config';

// Consolidar todas las funciones de administración de usuarios

export const getUsers = async () => {
  try {
    const response = await api.get('/admin/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Estandariza el formato de los valores de género para mantener
 * consistencia en la base de datos.
 * 
 * @param {string} gender - Valor de género sin procesar
 * @returns {string} - Valor de género estandarizado
 */
const formatGender = (gender) => {
  if (!gender) return 'No especificado';
  return GENDER_MAPPING[gender] || 'No especificado';
};

/**
 * Crea un nuevo usuario alumno con los datos proporcionados.
 * Esta función es usada por profesores para agregar nuevos alumnos al sistema.
 * 
 * @param {Object} userData - Objeto con campos para el usuario
 * @param {string} userData.firstName - Nombre del usuario
 * @param {string} userData.lastName - Apellido del usuario  
 * @param {string} userData.email - Correo electrónico (será usado como username)
 * @param {string} userData.gender - Género (Masculino, Femenino, No especificado)
 * @param {string} userData.birthdate - Fecha de nacimiento (YYYY-MM-DD)
 * @param {string} userData.phone_number - Teléfono con formato internacional
 * @param {string} userData.professor_id - ID del profesor que crea al alumno
 * @param {string} [userData.sala] - Grupo/sala del alumno
 * @param {string} [userData.role] - Rol asignado (por defecto "alumno")
 * @returns {Promise<Object>} Datos del usuario creado
 */
export const createUser = async (userData) => {
  try {
    // Procesar datos para asegurar formato correcto
    const processedData = {
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      email: userData.email || "",
      gender: formatGender(userData.gender),
      birthdate: userData.birthdate || "",
      phone_number: userData.phone_number || userData.phone || "",
      professor_id: userData.professor_id || null,
      created_by: userData.professor_id || null
    };
    
    // Incluir campos opcionales si existen
    if (userData.sala) processedData.sala = userData.sala;
    if (userData.role) processedData.role = userData.role;
    
    console.log("[API] Creating user with data:", processedData);
    
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      credentials: FETCH_OPTIONS.credentials,
      headers: { 
        "Content-Type": FETCH_OPTIONS.headers['Content-Type'],
        'X-Request-ID': generateRequestId('create_user')
      },
      body: JSON.stringify(processedData),
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`[API] Error creating user: ${response.status}`, responseText);
      
      // Mensajes de error específicos según el código de estado
      if (response.status === 401) {
        throw new Error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
      } else if (response.status === 403) {
        throw new Error("No tienes permisos para crear usuarios.");
      } else if (response.status === 409) {
        throw new Error("Ya existe un usuario con este correo electrónico.");
      }
      
      throw new Error(`Error al crear el usuario: ${response.status} - ${responseText}`);
    }
    
    // Intentar parsear como JSON si es posible
    try {
      return JSON.parse(responseText);
    } catch(e) {
      return { message: responseText };
    }
  } catch (error) {
    console.error("[API] createUser error:", error);
    throw error;
  }
};

/**
 * Edita un usuario existente actualizando los campos proporcionados.
 * Solo actualiza los campos que se incluyen en el objeto de actualizaciones.
 * 
 * @param {string} userId - ID del usuario a editar
 * @param {Object} updates - Campos a actualizar
 * @param {string} [updates.firstName] - Nuevo nombre
 * @param {string} [updates.lastName] - Nuevo apellido
 * @param {string} [updates.email] - Nuevo correo electrónico
 * @param {string} [updates.gender] - Nuevo género
 * @param {string} [updates.birthdate] - Nueva fecha de nacimiento
 * @param {string} [updates.phone_number] - Nuevo teléfono
 * @param {string} [updates.sala] - Nueva sala/grupo
 * @returns {Promise<Object>} Datos del usuario actualizado
 */
export const editUser = async (userId, updates) => {
  if (!userId) {
    throw new Error("ID de usuario no proporcionado");
  }
  
  try {
    // Procesar datos para asegurar formato correcto
    const processedUpdates = {
      firstName: updates.firstName || "",
      lastName: updates.lastName || "",
      email: updates.email || "",
      gender: formatGender(updates.gender || ""),
      birthdate: updates.birthdate || "",
      phone_number: updates.phone_number || updates.phone || "",
      sala: updates.sala || ""
    };
    
    // Incluir solo campos que realmente tienen valor
    const cleanUpdates = Object.entries(processedUpdates)
      .filter(([_, value]) => value !== "")
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    console.log(`[API] Updating user ${userId} with data:`, cleanUpdates);
    
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "PUT",
      credentials: FETCH_OPTIONS.credentials,
      headers: { 
        "Content-Type": FETCH_OPTIONS.headers['Content-Type'],
        'X-Request-ID': generateRequestId(`update_user_${userId}`)
      },
      body: JSON.stringify(cleanUpdates),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error updating user: ${response.status}`, errorText);
      
      // Mensajes de error específicos según el código de estado
      if (response.status === 401) {
        throw new Error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
      } else if (response.status === 403) {
        throw new Error("No tienes permisos para editar este usuario.");
      } else if (response.status === 404) {
        throw new Error("Usuario no encontrado.");
      } else if (response.status === 409) {
        throw new Error("Ya existe un usuario con este correo electrónico.");
      }
      
      throw new Error(`Error al editar el usuario: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[API] editUser error for ${userId}:`, error);
    throw error;
  }
};

/**
 * Elimina un usuario existente por ID.
 * Esta función marca al usuario como inactivo en el sistema.
 * 
 * @param {string} userId - ID del usuario a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "DELETE",
      credentials: FETCH_OPTIONS.credentials,
      headers: {
        'X-Request-ID': generateRequestId(`delete_user_${userId}`)
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error deleting user: ${response.status}`, errorText);
      
      // Mensajes de error específicos según el código de estado
      if (response.status === 401) {
        throw new Error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
      } else if (response.status === 403) {
        throw new Error("No tienes permisos para eliminar este usuario.");
      } else if (response.status === 404) {
        throw new Error("Usuario no encontrado.");
      }
      
      throw new Error(`Error al eliminar el usuario: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[API] deleteUser error for ${userId}:`, error);
    throw error;
  }
};

/**
 * Registra un nuevo usuario en el sistema.
 * Esta función es usada por el formulario de registro público.
 * 
 * @param {Object} userData - Datos del nuevo usuario
 * @param {string} userData.email - Correo electrónico
 * @param {string} userData.password - Contraseña  
 * @param {string} userData.firstName - Nombre
 * @param {string} userData.lastName - Apellido
 * @param {string} [userData.gender] - Género (opcional)
 * @param {string} [userData.birthdate] - Fecha de nacimiento (opcional)
 * @param {string} [userData.phone_number] - Teléfono (opcional)
 * @param {string} [userData.role] - Rol (opcional, predeterminado "alumno")
 * @param {string} [userData.sala] - Sala/grupo (opcional)
 * @returns {Promise<Object>} Datos del usuario registrado
 */
export const register = async (userData) => {
  try {
    // Validar campos obligatorios
    const requiredFields = ['email', 'password', 'firstName', 'lastName'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        throw new Error(`El campo ${field} es obligatorio para el registro`);
      }
    }
    
    console.log("[API] Registering new user:", { 
      email: userData.email, 
      firstName: userData.firstName,
      lastName: userData.lastName,
      hasPassword: !!userData.password
    });
    
    const response = await api.post('/register', {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      // Campos opcionales
      gender: userData.gender ? formatGender(userData.gender) : undefined,
      birthdate: userData.birthdate || undefined,
      phone_number: userData.phone_number || userData.phone || undefined,
      role: userData.role || undefined,
      sala: userData.sala || undefined
    });
    
    console.log("[API] Registration successful");
    return response.data;
  } catch (error) {
    console.error("[API] Registration error:", error);
    
    // Manejar y relanzar error más amigable
    if (error.response) {
      if (error.response.status === 409) {
        throw new Error("Este correo ya está registrado");
      }
      throw new Error(error.response.data?.error || "Error al registrar usuario");
    }
    throw error.message ? error : new Error("No se pudo conectar al servidor");
  }
};

/**
 * Busca usuarios según criterios específicos.
 * Permite filtrar la lista de usuarios por email, nombre, rol, etc.
 * 
 * @param {Object} criteria - Criterios de búsqueda 
 * @param {string} [criteria.email] - Filtrar por email
 * @param {string} [criteria.name] - Filtrar por nombre o apellido
 * @param {string} [criteria.role] - Filtrar por rol
 * @param {string} [criteria.sala] - Filtrar por sala/grupo
 * @returns {Promise<Array>} Lista de usuarios que coinciden con los criterios
 */
export const searchUsers = async (criteria = {}) => {
  try {
    // Construir query string a partir de criterios
    const queryParams = new URLSearchParams();
    Object.entries(criteria).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `${API_URL}/users/search?${queryString}` : `${API_URL}/users`;
    
    const response = await fetch(endpoint, {
      method: "GET",
      credentials: FETCH_OPTIONS.credentials,
      headers: {
        'Cache-Control': FETCH_OPTIONS.headers['Cache-Control'],
        'X-Request-ID': generateRequestId('search_users')
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error searching users: ${response.status}`, errorText);
      
      // Mensajes de error específicos según el código de estado
      if (response.status === 401) {
        throw new Error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
      } else if (response.status === 403) {
        throw new Error("No tienes permisos para buscar usuarios.");
      }
      
      throw new Error("Error al buscar usuarios");
    }
    
    return await response.json();
  } catch (error) {
    console.error("[API] searchUsers error:", error);
    throw error;
  }
};

// Export all functions as a single object for easier imports
const userAdminAPI = {
  getUsers,
  createUser,
  editUser,
  deleteUser,
  register,
  searchUsers,
};

export default userAdminAPI; // Assign to a variable before exporting
