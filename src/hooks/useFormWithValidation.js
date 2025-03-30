import { useForm } from 'react-hook-form';
import { 
  emailValidation, 
  phoneValidation, 
  genderValidation, 
  nameValidation,
  birthdateValidation
} from '../utils/validation';

/**
 * Custom hook that combines React Hook Form with our validation rules
 * 
 * @param {Object} options - Configuration options
 * @param {Object} [options.defaultValues] - Default form values
 * @param {Object} [options.validationFields] - Fields to apply validation to
 * @param {boolean} [options.reValidateMode='onBlur'] - When to revalidate
 * @returns {Object} - React Hook Form methods with added utilities
 */
const useFormWithValidation = ({ 
  defaultValues = {}, 
  validationFields = {},
  ...options 
} = {}) => {
  // Standard validations map
  const standardValidations = {
    email: emailValidation,
    phone: phoneValidation,
    gender: genderValidation,
    firstName: nameValidation,
    lastName: nameValidation,
    birthdate: birthdateValidation
  };
  
  // Get field validations by combining standard with custom
  const getFieldValidation = (fieldName) => {
    // Use custom validation if provided
    if (validationFields[fieldName]) {
      return validationFields[fieldName];
    }
    
    // Fall back to standard validation if available
    return standardValidations[fieldName] || {};
  };
  
  // Initialize React Hook Form
  const formMethods = useForm({
    defaultValues,
    mode: 'onBlur',
    ...options
  });
  
  // Create a helper for registering fields with standard validation
  const registerWithValidation = (fieldName, extraValidation = {}) => {
    const validation = {
      ...getFieldValidation(fieldName),
      ...extraValidation
    };
    
    return formMethods.register(fieldName, validation);
  };
  
  return {
    ...formMethods,
    registerWithValidation
  };
};

export default useFormWithValidation;
