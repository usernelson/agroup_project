import React from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { emailValidation } from '../../utils/validation';
import { getAttributeValue } from '../../utils/keycloakAttributeHelper';

const Form = styled.form`
  width: 100%;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
  
  h4 {
    color: var(--text-color);
    font-size: 1.1rem;
    margin-bottom: 1rem;
    font-weight: 500;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-weight: 500;
  font-size: 0.95rem;
  
  &.required::after {
    content: '*';
    color: var(--error-color);
    margin-left: 4px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--background-alt-color);
  color: var(--text-color);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(145, 70, 255, 0.2);
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--background-alt-color);
  color: var(--text-color);
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1em;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(145, 70, 255, 0.2);
  }
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  
  input {
    margin-right: 0.5rem;
  }
  
  label {
    font-weight: 400;
    user-select: none;
  }
`;

const ErrorMessage = styled.p`
  color: var(--error-color);
  font-size: 0.85rem;
  margin-top: 0.5rem;
`;

const HelpText = styled.p`
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-top: 0.5rem;
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0;
  }
`;

const FormColumn = styled.div`
  flex: 1;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.primary {
    background: var(--gradient);
    color: white;
    border: none;
    box-shadow: var(--button-shadow);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px var(--hover-shadow);
    }
    
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }
  }
  
  &.secondary {
    background: transparent;
    color: var(--text-color);
    border: 1px solid var(--border-color);
    
    &:hover {
      background-color: var(--background-alt-color);
    }
  }
`;

const UserForm = ({ onSubmit, initialData, isEditing, onCancel, loading }) => {
  // Debug initialData to find correct field mappings
  console.log('[UserForm] Initial data:', initialData);
  
  // Extract attributes using our helper function
  const phoneValue = getAttributeValue(initialData, 'phone_number') || 
                    getAttributeValue(initialData, 'phone');
  
  const genderValue = getAttributeValue(initialData, 'gender');
  const birthDateValue = getAttributeValue(initialData, 'birthdate') || 
                         getAttributeValue(initialData, 'birth_date');
  const createdByValue = getAttributeValue(initialData, 'createdBy') || 
                         getAttributeValue(initialData, 'created_by');
  
  // Log extracted values for debugging
  console.log('[UserForm] Extracted values:', { 
    phone: phoneValue, 
    gender: genderValue,
    birthDate: birthDateValue,
    createdBy: createdByValue
  });
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      phone: phoneValue || '',
      gender: genderValue || '',
      birthdate: birthDateValue || '',
      createdBy: createdByValue || '',
      enabled: initialData?.enabled !== false, 
      temporaryPassword: !isEditing,
      password: '',
      confirmPassword: '',
    }
  });
  
  const temporaryPassword = watch('temporaryPassword');
  
  // Form submission handler
  const onFormSubmit = (data) => {
    // Skip password validation for editing if not changing password
    if (isEditing && !data.password) {
      delete data.password;
      delete data.confirmPassword;
    }
    
    // CRITICAL FIX: Ensure created_by is preserved when editing
    if (isEditing && initialData) {
      // Store with the correct key for backend (created_by)
      data.created_by = createdByValue;
      console.log('[UserForm] Preserved created_by value:', createdByValue);
    }
    
    // For temporary password, generate a random one if not provided
    if (data.temporaryPassword && !data.password) {
      data.password = generateRandomPassword();
    }
    
    // Convert attribute field keys for consistency
    const standardizedData = {
      ...data,
      // Ensure these fields exist with consistent names
      phone_number: data.phone,
      birth_date: data.birthdate
    };
    
    // Log the final data before submitting
    console.log('[UserForm] Submitting data:', standardizedData);
    
    // Validation happens in userService now via validateKeycloakUser
    onSubmit(standardizedData);
  };
  
  // Generate a random password for temporary passwords
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
  
  return (
    <Form onSubmit={handleSubmit(onFormSubmit)}>
      <FormSection>
        <h4>Información del Alumno</h4>
        
        <FormRow>
          <FormColumn>
            <FormGroup>
              <Label className="required">Nombre</Label>
              <Input 
                type="text" 
                placeholder="Nombre del alumno"
                disabled={loading}
                {...register('firstName', { 
                  required: 'El nombre es obligatorio'
                })}
              />
              {errors.firstName && <ErrorMessage>{errors.firstName.message}</ErrorMessage>}
            </FormGroup>
          </FormColumn>
          
          <FormColumn>
            <FormGroup>
              <Label className="required">Apellido</Label>
              <Input 
                type="text" 
                placeholder="Apellido del alumno"
                disabled={loading}
                {...register('lastName', { 
                  required: 'El apellido es obligatorio'
                })}
              />
              {errors.lastName && <ErrorMessage>{errors.lastName.message}</ErrorMessage>}
            </FormGroup>
          </FormColumn>
        </FormRow>
        
        <FormGroup>
          <Label className="required">Email</Label>
          <Input 
            type="email" 
            placeholder="email@ejemplo.com"
            disabled={loading || isEditing} // Email can't be edited after creation
            {...register('email', emailValidation)}
          />
          {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
          {isEditing && <HelpText>El email no puede ser modificado después de la creación.</HelpText>}
        </FormGroup>
        
        <FormRow>
          <FormColumn>
            <FormGroup>
              {/* FIXED: Mark phone as required */}
              <Label className="required">Teléfono</Label>
              <Input 
                type="tel" 
                placeholder="+56 9 1234 5678"
                disabled={loading}
                {...register('phone', { 
                  required: 'El teléfono es obligatorio',
                  pattern: {
                    value: /^\+?[0-9\s()-]{8,}$/,
                    message: 'Formato válido: +56993928855'
                  }
                })}
              />
              {errors.phone && <ErrorMessage>{errors.phone.message}</ErrorMessage>}
              <HelpText>Formato requerido: +56993928855 (con código de país)</HelpText>
            </FormGroup>
          </FormColumn>
          
          <FormColumn>
            <FormGroup>
              {/* FIXED: Mark gender as required */}
              <Label className="required">Género</Label>
              <Select 
                disabled={loading}
                {...register('gender', { 
                  required: 'El género es obligatorio' 
                })}
              >
                <option value="">Seleccionar género</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="No binario">No binario</option>
                <option value="Prefiero no especificar">Prefiero no especificar</option>
              </Select>
              {errors.gender && <ErrorMessage>{errors.gender.message}</ErrorMessage>}
            </FormGroup>
          </FormColumn>
        </FormRow>

        {/* ADDED: New field for birth date */}
        <FormGroup>
          <Label>Fecha de nacimiento</Label>
          <Input 
            type="date" 
            disabled={loading}
            {...register('birthdate')}
          />
          <HelpText>Formato: AAAA-MM-DD</HelpText>
        </FormGroup>

        {/* ADD: Display created_by as read-only field when editing */}
        {isEditing && (
          <FormGroup>
            <Label>ID de Profesor</Label>
            <Input 
              type="text"
              value={createdByValue}
              disabled={true}
              readOnly={true}
            />
            <HelpText>Este campo indica qué profesor creó la cuenta y no se puede modificar.</HelpText>
            <input 
              type="hidden" 
              {...register('createdBy')}
            />
          </FormGroup>
        )}
      </FormSection>
      
      <FormSection>
        <h4>Configuración de la Cuenta</h4>
        
        <FormGroup>
          <Checkbox>
            <input 
              type="checkbox" 
              id="enabled"
              disabled={loading}
              {...register('enabled')}
            />
            <label htmlFor="enabled">Cuenta activa</label>
          </Checkbox>
          <HelpText>Las cuentas inactivas no pueden iniciar sesión en el sistema.</HelpText>
        </FormGroup>
        
        {!isEditing && (
          <FormGroup>
            <Checkbox>
              <input 
                type="checkbox" 
                id="temporaryPassword"
                disabled={loading}
                {...register('temporaryPassword')}
              />
              <label htmlFor="temporaryPassword">Generar contraseña temporal</label>
            </Checkbox>
            <HelpText>El alumno será obligado a cambiar su contraseña en el primer inicio de sesión.</HelpText>
          </FormGroup>
        )}
        
        {(!temporaryPassword || isEditing) && (
          <>
            <FormGroup>
              <Label className={isEditing ? '' : 'required'}>Contraseña</Label>
              <Input 
                type="password" 
                placeholder={isEditing ? "Dejar en blanco para mantener la contraseña actual" : "Contraseña"}
                disabled={loading}
                {...register('password', { 
                  required: isEditing ? false : 'La contraseña es obligatoria',
                  minLength: {
                    value: 8,
                    message: 'La contraseña debe tener al menos 8 caracteres'
                  }
                })}
              />
              {errors.password && <ErrorMessage>{errors.password.message}</ErrorMessage>}
              {isEditing && <HelpText>Deja en blanco para mantener la contraseña actual.</HelpText>}
            </FormGroup>
            
            <FormGroup>
              <Label className={isEditing ? '' : 'required'}>Confirmar Contraseña</Label>
              <Input 
                type="password" 
                placeholder="Repetir contraseña"
                disabled={loading}
                {...register('confirmPassword', { 
                  required: isEditing ? false : 'Por favor confirma la contraseña',
                  validate: (value) => {
                    if (!isEditing || watch('password')) {
                      return value === watch('password') || 'Las contraseñas no coinciden';
                    }
                    return true;
                  }
                })}
              />
              {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword.message}</ErrorMessage>}
            </FormGroup>
          </>
        )}
        
        {temporaryPassword && !isEditing && (
          <HelpText>
            Se generará una contraseña segura aleatoria que se enviará al alumno por correo electrónico.
          </HelpText>
        )}
      </FormSection>
      
      <ButtonGroup>
        <Button 
          type="button" 
          className="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="primary"
          disabled={loading}
        >
          {loading ? 'Guardando...' : isEditing ? 'Actualizar Alumno' : 'Crear Alumno'}
        </Button>
      </ButtonGroup>
    </Form>
  );
};

export default UserForm;
