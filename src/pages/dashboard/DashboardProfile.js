import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { useAuthSafe } from '../../utils/contextHelpers';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { nameValidation, phoneValidation, genderValidation, birthdateValidation } from '../../utils/validation';
import authService from '../../api/authService';
// CRITICAL FIX: Add import for getAttributeValue
import { getAttributeValue } from '../../utils/keycloakAttributeHelper';

// Styled components for profile page
const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
`;

const ProfileCard = styled.div`
  background-color: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--card-shadow);
  padding: var(--space-lg);
  margin-top: 1.5rem;
  
  @media (max-width: 768px) {
    padding: var(--space-md);
  }
`;

const ProfileSection = styled.div`
  margin-bottom: 2rem;
  
  h3 {
    color: var(--text-color);
    font-size: 1.25rem;
    margin-bottom: 1rem;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -6px;
      width: 40px;
      height: 3px;
      background: var(--gradient);
      border-radius: 3px;
    }
  }
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const FormGroup = styled.div`
  flex: 1;
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: ${props => props.disabled ? 'var(--background-color)' : 'var(--background-alt-color)'};
  color: var(--text-color);
  
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
  border-radius: var(--radius-md);
  background-color: var(--background-alt-color);
  color: var(--text-color);
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(145, 70, 255, 0.2);
  }
`;

const InputError = styled.p`
  color: var(--error-color);
  font-size: 0.85rem;
  margin-top: 0.5rem;
`;

const HelpText = styled.p`
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-top: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  
  @media (max-width: 768px) {
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
  
  ${props => props.$primary && `
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
  `}
  
  ${props => !props.$primary && `
    background: transparent;
    color: var(--text-color);
    border: 1px solid var(--border-color);
    
    &:hover {
      background-color: var(--background-alt-color);
    }
  `}
`;

const ErrorMessage = styled.div`
  color: var(--error-color);
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: rgba(233, 76, 93, 0.1);
  border-radius: var(--radius-md);
  text-align: center;
`;

// Enhanced success message container with icon
const SuccessMessage = styled.div`
  color: var(--success-color);
  margin: 1rem 0;
  padding: 1rem;
  background-color: rgba(92, 219, 165, 0.1);
  border-radius: var(--radius-md);
  text-align: left;
  display: flex;
  align-items: flex-start;
  
  svg {
    min-width: 24px;
    height: 24px;
    margin-right: 0.75rem;
    margin-top: 2px;
  }
  
  div {
    flex: 1;
  }
  
  p {
    margin: 0 0 0.5rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .note {
    font-size: 0.85rem;
    opacity: 0.8;
  }
`;

const SectionHeader = styled.h3`
  color: var(--text-color);
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -6px;
    width: 40px;
    height: 3px;
    background: var(--gradient);
    border-radius: 3px;
  }
`;

/**
 * DashboardProfile Component
 * Allows users to view and update their profile information
 */
const DashboardProfile = () => {
  const auth = useAuthSafe();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  
  // Initialize react-hook-form for profile form
  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors } 
  } = useForm();
  
  // Initialize react-hook-form for password form separately
  const { 
    register: registerPassword, 
    handleSubmit: handleSubmitPassword, 
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword
  } = useForm();
  
  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        
        // Get user profile from auth context
        if (auth?.userProfile) {
          // Extract attributes consistently
          const phoneValue = getAttributeValue(auth.userProfile, 'phone_number') || '';
          const genderValue = getAttributeValue(auth.userProfile, 'gender') || '';
          const birthDateValue = getAttributeValue(auth.userProfile, 'birth_date') || '';
          const createdByValue = getAttributeValue(auth.userProfile, 'created_by') || '';
          
          // STANDARDIZED: Set exactly the fields required by Keycloak
          const profileData = {
            firstName: auth.userProfile.firstName || '',
            lastName: auth.userProfile.lastName || '',
            email: auth.userProfile.email || '',
            phone: phoneValue,
            gender: genderValue,
            birthdate: birthDateValue,
            createdBy: createdByValue
          };
          
          console.log('[Profile] Extracted standardized profile:', profileData);
          
          setUserProfile(profileData);
          reset(profileData);
        } else {
          // If not in context, try to get from localStorage as fallback
          try {
            const storedProfile = localStorage.getItem('userProfile');
            if (storedProfile) {
              const parsedProfile = JSON.parse(storedProfile);
              setUserProfile(parsedProfile);
              reset({
                firstName: parsedProfile.firstName || '',
                lastName: parsedProfile.lastName || '',
                email: parsedProfile.email || '',
                phone: parsedProfile.phone || '',
                gender: parsedProfile.gender || '',
                birthdate: parsedProfile.birthdate || ''
              });
            }
          } catch (e) {
            console.warn('[Profile] Error loading from localStorage:', e);
          }
        }
      } catch (error) {
        console.error('[Profile] Error loading user profile:', error);
        setErrorMessage('No se pudo cargar tu perfil. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserProfile();
  }, [auth?.userProfile, reset]);
  
  // Handle saving profile form with better error handling for auth refresh
  const handleSaveProfile = async (formData) => {
    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      console.log('[Profile] Saving profile data:', formData);
      
      // CRITICAL FIX: Ensure ID field matches current user's ID
      try {
        // Get current user ID from token
        const token = localStorage.getItem('token');
        if (token) {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            // Set ID to ensure we're only updating our own profile
            formData.id = payload.sub;
          }
        }
      } catch (e) {
        console.warn('[Profile] Error getting user ID from token:', e);
      }
      
      // Call API to update profile
      let response;
      try {
        if (auth && typeof auth.updateProfile === 'function') {
          response = await auth.updateProfile(formData);
        } else {
          console.log('[Profile] Using direct API call for profile update');
          response = await authService.updateProfile(formData);
        }
        
        console.log('[Profile] Update response:', response);
        
        // Update local profile state
        setUserProfile(prev => ({
          ...prev,
          ...formData
        }));
        
        // Update localStorage profile if it exists
        try {
          const storedProfile = localStorage.getItem('userProfile');
          if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile);
            localStorage.setItem('userProfile', JSON.stringify({
              ...parsedProfile,
              ...formData
            }));
          }
        } catch (e) {
          console.warn('[Profile] Error updating localStorage profile:', e);
        }
        
        // ENHANCEMENT: Display appropriate success message with special handling for 404 or simulated updates
        if (response && response.keycloakPermissionIssue) {
          setSuccessMessage(
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <div>
                <p><strong>Tu información se ha guardado localmente</strong></p>
                <p className="note">
                  Nota: Debido a restricciones del servidor Keycloak, los cambios solo se guardan en tu sesión actual.
                  Contacta al administrador para actualizaciones permanentes.
                </p>
              </div>
            </div>
          );
        } else if (response && response.simulated) {
          // Check if it's a 404 simulation specifically
          const is404 = response.message && response.message.includes('endpoint no existe');
          
          setSuccessMessage(
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <div>
                <p><strong>Perfil actualizado en modo de desarrollo</strong></p>
                <p className="note">
                  {is404 
                    ? 'El API endpoint para actualizar perfiles no está disponible en el servidor. Los cambios son solo locales.'
                    : 'Los cambios son visibles en esta sesión pero no se han guardado en el servidor.'
                  }
                </p>
              </div>
            </div>
          );
        } else {
          setSuccessMessage(
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <div>
                <p><strong>Perfil actualizado correctamente</strong></p>
              </div>
            </div>
          );
        }
        
        // CRITICAL FIX: Handle refresh token missing more gracefully
        try {
          // Refresh auth context if available
          if (auth && typeof auth.refreshAuth === 'function') {
            const refreshResult = await auth.refreshAuth();
            
            // If refresh failed due to missing token, just continue
            if (refreshResult && refreshResult.refreshed === false) {
              console.log('[Profile] Auth refresh skipped:', refreshResult.reason);
              // This is not a critical error, so we continue
            }
          }
        } catch (refreshError) {
          // Log but don't show error to user since profile update was successful
          console.warn('[Profile] Error refreshing auth after profile update:', refreshError);
          // Still consider this a successful update since the profile was updated
        }
      } catch (apiError) {
        console.error('[Profile] API error updating profile:', apiError);
        throw new Error(apiError.message || 'Error al comunicarse con el servidor');
      }
    } catch (error) {
      console.error('[Profile] Error updating profile:', error);
      
      // ENHANCEMENT: Special error message for Keycloak permission issues
      if (error.message && error.message.includes('permiso')) {
        setErrorMessage(
          <div>
            <p>{error.message}</p>
            <p style={{fontSize: '0.9em', marginTop: '0.5rem'}}>
              Los usuarios regulares no pueden actualizar sus perfiles directamente en Keycloak.
              Contacta al administrador del sistema para realizar cambios en tu perfil.
            </p>
          </div>
        );
      } else {
        setErrorMessage(error.message || 'No se pudo actualizar el perfil. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle password change
  const handleChangePassword = async (data) => {
    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      // Check if passwords match
      if (data.newPassword !== data.confirmPassword) {
        setErrorMessage('Las contraseñas no coinciden');
        setIsSaving(false);
        return;
      }
      
      // Call API to change password
      try {
        if (auth && typeof auth.changePassword === 'function') {
          await auth.changePassword(data.currentPassword, data.newPassword);
        } else {
          await authService.changePassword(data.currentPassword, data.newPassword);
        }
        
        setSuccessMessage('Contraseña actualizada correctamente');
        resetPassword(); // Reset password form
      } catch (apiError) {
        console.error('[Profile] API error changing password:', apiError);
        throw new Error(apiError.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('[Profile] Error changing password:', error);
      setErrorMessage(error.message || 'No se pudo actualizar la contraseña. Por favor, verifica tu contraseña actual.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading spinner while data is loading
  if (loading) {
    return (
      <ProfileContainer>
        <PageHeader 
          title="Mi Perfil" 
          subtitle="Administra tu información personal y contraseña"
        />
        <LoadingSpinner />
      </ProfileContainer>
    );
  }
  
  return (
    <ProfileContainer>
      <PageHeader 
        title="Mi Perfil" 
        subtitle="Administra tu información personal y contraseña"
      />
      
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
      
      <ProfileCard>
        <ProfileSection>
          <SectionHeader>Información Personal</SectionHeader>
          
          <form onSubmit={handleSubmit(handleSaveProfile)}>
            <FormRow>
              <FormGroup>
                <Label>Nombre</Label>
                <Input 
                  {...register('firstName', nameValidation)}
                  disabled={isSaving}
                />
                {errors.firstName && (
                  <InputError>{errors.firstName.message}</InputError>
                )}
              </FormGroup>
              
              <FormGroup>
                <Label>Apellido</Label>
                <Input 
                  {...register('lastName', nameValidation)}
                  disabled={isSaving}
                />
                {errors.lastName && (
                  <InputError>{errors.lastName.message}</InputError>
                )}
              </FormGroup>
            </FormRow>
            
            <FormGroup>
              <Label>Email</Label>
              <Input 
                {...register('email')}
                disabled={true} // Email can't be changed
              />
              <HelpText>El email no puede ser modificado.</HelpText>
            </FormGroup>
            
            <FormRow>
              <FormGroup>
                {/* CRITICAL: Mark required fields with asterisk */}
                <Label className="required">Teléfono *</Label>
                <Input 
                  {...register('phone', phoneValidation)}
                  disabled={isSaving}
                  placeholder="+56993928855"
                />
                {errors.phone && (
                  <InputError>{errors.phone.message}</InputError>
                )}
                <HelpText>Incluyendo el código de país, ej: +56993928855</HelpText>
              </FormGroup>
              
              <FormGroup>
                {/* CRITICAL: Mark required fields with asterisk */}
                <Label className="required">Género *</Label>
                <Select 
                  {...register('gender', genderValidation)}
                  disabled={isSaving}
                >
                  <option value="">Selecciona un género</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="No binario">No binario</option>
                  <option value="Prefiero no especificar">Prefiero no especificar</option>
                </Select>
                {errors.gender && (
                  <InputError>{errors.gender.message}</InputError>
                )}
              </FormGroup>
            </FormRow>
            
            <FormGroup>
              <Label>Fecha de nacimiento</Label>
              <Input 
                type="date"
                {...register('birthdate', birthdateValidation)}
                disabled={isSaving}
              />
              {errors.birthdate && (
                <InputError>{errors.birthdate.message}</InputError>
              )}
              <HelpText>Formato: AAAA-MM-DD</HelpText>
            </FormGroup>
            
            {/* Display created_by field if it exists (non-editable) */}
            {userProfile?.createdBy && (
              <FormGroup>
                <Label>Creado por</Label>
                <Input 
                  value={userProfile.createdBy}
                  disabled={true}
                  readOnly={true}
                />
                <HelpText>ID que identifica al profesor que creó esta cuenta.</HelpText>
              </FormGroup>
            )}
            
            <ButtonGroup>
              <Button 
                type="submit" 
                $primary
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </ButtonGroup>
          </form>
        </ProfileSection>
      </ProfileCard>
      
      <ProfileCard>
        <ProfileSection>
          <SectionHeader>Cambiar Contraseña</SectionHeader>
          
          <form onSubmit={handleSubmitPassword(handleChangePassword)}>
            <FormGroup>
              <Label>Contraseña actual</Label>
              <Input 
                type="password"
                {...registerPassword('currentPassword', { 
                  required: 'Ingresa tu contraseña actual' 
                })}
                disabled={isSaving}
              />
              {passwordErrors.currentPassword && (
                <InputError>{passwordErrors.currentPassword.message}</InputError>
              )}
            </FormGroup>
            
            <FormRow>
              <FormGroup>
                <Label>Nueva contraseña</Label>
                <Input 
                  type="password"
                  {...registerPassword('newPassword', { 
                    required: 'Ingresa tu nueva contraseña',
                    minLength: {
                      value: 8,
                      message: 'La contraseña debe tener al menos 8 caracteres'
                    }
                  })}
                  disabled={isSaving}
                />
                {passwordErrors.newPassword && (
                  <InputError>{passwordErrors.newPassword.message}</InputError>
                )}
              </FormGroup>
              
              <FormGroup>
                <Label>Confirmar nueva contraseña</Label>
                <Input 
                  type="password"
                  {...registerPassword('confirmPassword', { 
                    required: 'Confirma tu nueva contraseña',
                    validate: (value) => 
                      value === watchPassword('newPassword') || 'Las contraseñas no coinciden'
                  })}
                  disabled={isSaving}
                />
                {passwordErrors.confirmPassword && (
                  <InputError>{passwordErrors.confirmPassword.message}</InputError>
                )}
              </FormGroup>
            </FormRow>
            
            <ButtonGroup>
              <Button 
                type="submit" 
                $primary
                disabled={isSaving}
              >
                {isSaving ? 'Actualizando...' : 'Cambiar contraseña'}
              </Button>
            </ButtonGroup>
          </form>
        </ProfileSection>
      </ProfileCard>
    </ProfileContainer>
  );
};

export default DashboardProfile;
