/**
 * Validaciones para formularios de la aplicación
 */

// Validación para correo electrónico
export const emailValidation = {
  required: "El correo electrónico es obligatorio",
  pattern: {
    value: /\S+@\S+\.\S+/,
    message: "El correo electrónico no es válido"
  }
};

// Validación para contraseña
export const passwordValidation = {
  required: "La contraseña es obligatoria",
  minLength: {
    value: 8,
    message: "La contraseña debe tener al menos 8 caracteres"
  },
  pattern: {
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    message: "La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales"
  }
};

// Reemplazamos la validación mfaValidation por otpValidation
export const otpValidation = {
  required: "Por favor ingresa el código OTP",
  minLength: {
    value: 6,
    message: "El código OTP debe tener al menos 6 caracteres"
  },
  maxLength: {
    value: 8,
    message: "El código OTP no puede tener más de 8 caracteres"
  },
  pattern: {
    value: /^[0-9a-zA-Z]+$/,
    message: "El código OTP solo puede contener números y letras"
  }
};

// Validación para nombre
export const nameValidation = {
  required: "El nombre es obligatorio",
  minLength: {
    value: 2,
    message: "El nombre debe tener al menos 2 caracteres"
  },
  maxLength: {
    value: 50,
    message: "El nombre no puede tener más de 50 caracteres"
  },
  pattern: {
    value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/,
    message: "El nombre contiene caracteres no válidos"
  }
};

/**
 * STANDARDIZED: Update validation rules for phone numbers to match Keycloak requirements
 */
export const phoneValidation = {
  required: 'El teléfono es obligatorio',
  pattern: {
    value: /^\+[0-9]{1,3}[0-9]{9,15}$/,
    message: 'Ingrese un número de teléfono válido con código de país (ej: +56994939713)'
  }
};

/**
 * STANDARDIZED: Update validation rules for gender to match Keycloak requirements
 */
export const genderValidation = {
  required: 'El género es obligatorio',
  validate: (value) => {
    const validOptions = ['Masculino', 'Femenino', 'No binario', 'Prefiero no especificar'];
    return validOptions.includes(value) || 'Seleccione una opción válida';
  }
};

// Update birthdate validation to allow optional but properly formatted dates
export const birthdateValidation = {
  pattern: {
    value: /^\d{4}-\d{2}-\d{2}$/,
    message: 'Formato de fecha inválido. Use AAAA-MM-DD'
  },
  validate: {
    notFuture: (value) => {
      if (!value) return true; // Optional field
      return new Date(value) <= new Date() || "La fecha no puede ser futura";
    },
    validAge: (value) => {
      if (!value) return true; // Optional field
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return (age >= 5 && age <= 120) || "La edad debe estar entre 5 y 120 años";
    }
  }
};

// Funciones de validación reutilizables
export const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword || "Las contraseñas no coinciden";
};

export const validateRequired = (value, fieldName = "Este campo") => {
  return !!value || `${fieldName} es obligatorio`;
};

// Exportar un objeto con todas las validaciones
const validations = {
  email: emailValidation,
  password: passwordValidation,
  otp: otpValidation,
  name: nameValidation,
  phone: phoneValidation,
  gender: genderValidation,
  birthdate: birthdateValidation,
  validatePasswordMatch,
  validateRequired
};

export default validations;