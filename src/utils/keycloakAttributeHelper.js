/**
 * Keycloak Attribute Helper
 * 
 * Utility functions to standardize handling of Keycloak user attributes between
 * frontend display format and the format required by Keycloak API
 */

/**
 * Extracts an attribute value from a user object, handling different formats
 * @param {Object} user - User object from API or local state
 * @param {string} attributeName - Name of the attribute to extract
 * @param {string} [defaultValue=''] - Default value if attribute not found
 * @returns {string} - The attribute value
 */
export const getAttributeValue = (user, attributeName, defaultValue = '') => {
  if (!user) return defaultValue;
  
  // Try direct property access first
  if (user[attributeName] !== undefined && user[attributeName] !== null) {
    return user[attributeName];
  }
  
  // Then check attributes object in different formats
  if (user.attributes) {
    const attrValue = user.attributes[attributeName];
    
    // Handle array format (Keycloak API format)
    if (Array.isArray(attrValue)) {
      return attrValue[0] || defaultValue;
    }
    
    // Handle string format (our normalized format)
    if (attrValue !== undefined && attrValue !== null) {
      return attrValue;
    }
  }
  
  // Check common alternative property names
  const alternatives = {
    'phone': ['phone_number', 'phoneNumber'],
    'phone_number': ['phone', 'phoneNumber'],
    'gender': ['género'],
    'birthdate': ['birth_date', 'birthDate', 'fecha_nacimiento'],
    'birth_date': ['birthdate', 'birthDate', 'fecha_nacimiento'],
    'created_by': ['createdBy', 'professorId', 'professor_id'],
    'createdBy': ['created_by', 'professorId', 'professor_id']
  };
  
  // Check alternatives if available for this attribute
  if (alternatives[attributeName]) {
    for (const alt of alternatives[attributeName]) {
      // Direct property
      if (user[alt] !== undefined && user[alt] !== null) {
        return user[alt];
      }
      
      // In attributes
      if (user.attributes && user.attributes[alt] !== undefined) {
        const altValue = user.attributes[alt];
        if (Array.isArray(altValue)) {
          return altValue[0] || defaultValue;
        }
        return altValue || defaultValue;
      }
    }
  }
  
  return defaultValue;
};

/**
 * Converts user data for display in the frontend
 * @param {Object} user - User data from Keycloak API
 * @returns {Object} - Normalized user data for frontend
 */
export const normalizeUserForDisplay = (user) => {
  if (!user) return {};
  
  return {
    ...user,
    // Extract common attributes to top level for easy access in components
    phone: getAttributeValue(user, 'phone_number'),
    gender: getAttributeValue(user, 'gender'),
    birthdate: getAttributeValue(user, 'birth_date'),
    createdBy: getAttributeValue(user, 'created_by')
  };
};

/**
 * STANDARDIZED: Format user data according to Keycloak's exact requirements
 * @param {Object} userData - User data from frontend forms
 * @returns {Object} - User data formatted for Keycloak API
 */
export const formatUserForKeycloak = (userData) => {
  // Basic user fields
  const keycloakData = {
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email,
    enabled: userData.enabled !== false,
    // Keycloak requires all attributes to be arrays of strings
    attributes: {
      // REQUIRED fields (always included)
      phone_number: [userData.phone || userData.phone_number || ''],
      gender: [userData.gender || ''],
      // OPTIONAL fields (only included if they have values)
      birth_date: userData.birthdate || userData.birth_date ? 
                  [userData.birthdate || userData.birth_date] : undefined
    }
  };
  
  // Only include created_by if it exists
  if (userData.created_by || userData.createdBy) {
    keycloakData.attributes.created_by = [userData.created_by || userData.createdBy];
  }
  
  // Add password if provided
  if (userData.password) {
    keycloakData.credentials = [
      {
        type: 'password',
        value: userData.password,
        temporary: userData.temporaryPassword === true
      }
    ];
  }
  
  // Clean up undefined attributes
  Object.keys(keycloakData.attributes).forEach(key => {
    if (keycloakData.attributes[key] === undefined) {
      delete keycloakData.attributes[key];
    }
  });
  
  return keycloakData;
};

/**
 * STANDARDIZED: Validates if user data contains all required Keycloak attributes
 * @param {Object} userData - User data to validate
 * @returns {Object} - Validation result {valid: boolean, errors: string[]}
 */
export const validateKeycloakUser = (userData) => {
  const errors = [];
  
  // Validate all required fields
  if (!userData.firstName || userData.firstName.trim() === '') {
    errors.push('El nombre es obligatorio');
  }
  
  if (!userData.lastName || userData.lastName.trim() === '') {
    errors.push('El apellido es obligatorio');
  }
  
  if (!userData.email || userData.email.trim() === '') {
    errors.push('El email es obligatorio');
  }
  
  // CRITICAL: Validate required Keycloak attributes
  if (!userData.gender) {
    errors.push('El género es obligatorio para Keycloak');
  }
  
  const phone = userData.phone || userData.phone_number || 
                (userData.attributes && userData.attributes.phone_number);
  
  if (!phone) {
    errors.push('El teléfono es obligatorio para Keycloak');
  }
  
  // Phone format validation
  if (phone && !phone.match(/^\+[0-9]{1,3}[0-9]{9,15}$/)) {
    errors.push('El formato del teléfono debe ser: +56XXXXXXXXX');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  getAttributeValue,
  normalizeUserForDisplay,
  formatUserForKeycloak,
  validateKeycloakUser
};
