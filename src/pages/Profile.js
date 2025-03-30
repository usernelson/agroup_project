import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../contexts/AuthContext';
import authService from '../api/authService';
import StudentManagement from '../components/users/StudentManagement';

// Componentes estilizados
const ProfileContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  background-color: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const ProfileAvatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: 600;
  margin-right: 2rem;
  
  @media (max-width: 768px) {
    margin-right: 0;
    margin-bottom: 1rem;
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
  
  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 1.8rem;
  }
  
  p {
    margin: 0;
    color: var(--text-muted);
  }
`;

const ProfileTabs = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
`;

const TabButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${props => props.$active ? 'var(--background-alt-color)' : 'transparent'};
  border: none;
  border-bottom: 3px solid ${props => props.$active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.$active ? 'var(--text-color)' : 'var(--text-muted)'};
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: var(--background-alt-color);
    color: var(--text-color);
  }
`;

const FormSection = styled.section`
  margin-bottom: 2rem;
  
  h2 {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-alt-color);
  }
`;

const FormRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 0 -0.75rem 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FormGroup = styled.div`
  flex: 1;
  min-width: 240px;
  padding: 0 0.75rem;
  margin-bottom: 1rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  input, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--input-background);
    color: var(--text-color);
    font-size: 1rem;
    transition: border-color 0.2s;
    
    &:focus {
      border-color: var(--primary-color);
      outline: none;
    }
    
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
  
  .error {
    color: var(--error-color);
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${props => props.$primary ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.$primary ? 'white' : 'var(--text-color)'};
  border: 1px solid ${props => props.$primary ? 'var(--primary-color)' : 'var(--border-color)'};
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: ${props => props.$primary ? '0.75rem' : '0'};
  
  &:hover {
    background: ${props => props.$primary ? 'var(--primary-dark-color)' : 'var(--background-alt-color)'};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    margin: 0.5rem 0;
    width: 100%;
  }
`;

const Alert = styled.div`
  padding: 0.75rem 1.25rem;
  margin-bottom: 1.5rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background-color: ${props => 
    props.$type === 'success' ? 'var(--success-light-color)' : 
    props.$type === 'error' ? 'var(--error-light-color)' : 
    'var(--info-light-color)'};
  color: ${props => 
    props.$type === 'success' ? 'var(--success-color)' : 
    props.$type === 'error' ? 'var(--error-color)' : 
    'var(--info-color)'};
  border-color: ${props => 
    props.$type === 'success' ? 'var(--success-color)' : 
    props.$type === 'error' ? 'var(--error-color)' : 
    'var(--info-color)'};
`;

// Componente principal
const Profile = () => {
  // Usar React.useContext directamente en lugar del hook
  const auth = React.useContext(AuthContext);
  const userProfile = auth?.userProfile || {};
  const userRole = auth?.userRole || 'alumno';
  const isAuthenticated = auth?.isAuthenticated || false;
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Formulario de información personal
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    birthdate: ''
  });
  
  // Estado para formulario de cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Estado para validación
  const [errors, setErrors] = useState({});
  
  // Cargar datos del perfil
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || userProfile.given_name || '',
        lastName: userProfile.lastName || userProfile.family_name || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        gender: userProfile.gender || '',
        birthdate: userProfile.birthdate || ''
      });
    }
  }, [userProfile]);
  
  // Redireccionar si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Función para manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpiar error específico al cambiar valor
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // Función para manejar cambios en el formulario de contraseña
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });
    
    // Limpiar error específico al cambiar valor
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // Validar formulario de información personal
  const validatePersonalForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (formData.phoneNumber && !/^\+?[0-9\s-]{7,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Número de teléfono inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validar formulario de cambio de contraseña
  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Guardar cambios en información personal
  const handleSavePersonal = async () => {
    if (!validatePersonalForm()) {
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      // Llamar al servicio de actualización de perfil
      await authService.updateProfile(formData);
      
      setMessage({
        type: 'success',
        text: 'Perfil actualizado correctamente'
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Error al actualizar el perfil'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Cambiar contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      // Llamar al servicio de cambio de contraseña
      await authService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      setMessage({
        type: 'success',
        text: 'Contraseña cambiada correctamente'
      });
      
      // Limpiar formulario
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Error al cambiar la contraseña'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Obtener iniciales del usuario para el avatar
  const getInitials = () => {
    if (!userProfile) return 'U';
    const firstName = userProfile.firstName || userProfile.given_name || '';
    const lastName = userProfile.lastName || userProfile.family_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  // Determinar si el usuario es profesor
  const isTeacher = userRole === 'profesor';
  
  return (
    <ProfileContainer>
      <ProfileHeader>
        <ProfileAvatar>{getInitials()}</ProfileAvatar>
        <ProfileInfo>
          <h1>{formData.firstName} {formData.lastName}</h1>
          <p>{userRole === 'profesor' ? 'Profesor' : 'Alumno'}</p>
          <p>{formData.email}</p>
        </ProfileInfo>
      </ProfileHeader>
      
      {message && (
        <Alert $type={message.type}>
          {message.text}
        </Alert>
      )}
      
      <ProfileTabs>
        <TabButton 
          $active={activeTab === 'personal'} 
          onClick={() => setActiveTab('personal')}
        >
          Información Personal
        </TabButton>
        <TabButton 
          $active={activeTab === 'security'} 
          onClick={() => setActiveTab('security')}
        >
          Seguridad
        </TabButton>
        {isTeacher && (
          <TabButton 
            $active={activeTab === 'students'} 
            onClick={() => setActiveTab('students')}
          >
            Gestión de Alumnos
          </TabButton>
        )}
      </ProfileTabs>
      
      {activeTab === 'personal' && (
        <FormSection>
          <h2>Información Personal</h2>
          
          <FormRow>
            <FormGroup>
              <label htmlFor="firstName">Nombre</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!isEditing}
              />
              {errors.firstName && <div className="error">{errors.firstName}</div>}
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="lastName">Apellido</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!isEditing}
              />
              {errors.lastName && <div className="error">{errors.lastName}</div>}
            </FormGroup>
          </FormRow>
          
          <FormRow>
            <FormGroup>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
              />
              {errors.email && <div className="error">{errors.email}</div>}
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="phoneNumber">Teléfono</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="+56912345678"
              />
              {errors.phoneNumber && <div className="error">{errors.phoneNumber}</div>}
            </FormGroup>
          </FormRow>
          
          <FormRow>
            <FormGroup>
              <label htmlFor="gender">Género</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={!isEditing}
              >
                <option value="">Seleccionar</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="No especificado">No especificado</option>
              </select>
              {errors.gender && <div className="error">{errors.gender}</div>}
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="birthdate">Fecha de Nacimiento</label>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                disabled={!isEditing}
              />
              {errors.birthdate && <div className="error">{errors.birthdate}</div>}
            </FormGroup>
          </FormRow>
          
          <ButtonContainer>
            {isEditing ? (
              <>
                <Button onClick={() => setIsEditing(false)}>Cancelar</Button>
                <Button 
                  $primary 
                  onClick={handleSavePersonal}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </>
            ) : (
              <Button $primary onClick={() => setIsEditing(true)}>
                Editar Perfil
              </Button>
            )}
          </ButtonContainer>
        </FormSection>
      )}
      
      {activeTab === 'security' && (
        <FormSection>
          <h2>Cambiar Contraseña</h2>
          
          <FormRow>
            <FormGroup>
              <label htmlFor="currentPassword">Contraseña Actual</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
              />
              {errors.currentPassword && <div className="error">{errors.currentPassword}</div>}
            </FormGroup>
          </FormRow>
          
          <FormRow>
            <FormGroup>
              <label htmlFor="newPassword">Nueva Contraseña</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
              />
              {errors.newPassword && <div className="error">{errors.newPassword}</div>}
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
              />
              {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
            </FormGroup>
          </FormRow>
          
          <ButtonContainer>
            <Button $primary onClick={handleChangePassword} disabled={loading}>
              {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </ButtonContainer>
        </FormSection>
      )}
      
      {activeTab === 'students' && isTeacher && (
        <StudentManagement />
      )}
    </ProfileContainer>
  );
};

export default Profile;
