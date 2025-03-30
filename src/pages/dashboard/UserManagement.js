import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAuthSafe } from '../../utils/contextHelpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Navigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import UserForm from '../../components/users/UserForm';
import UserList from '../../components/users/UserList';
import { getUserList, createUser, updateUser, deleteUser } from '../../api/userService';

// Match the styling from Profile component for consistency
const UserManagementContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
`;

const UserManagementCard = styled.div`
  background-color: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--card-shadow);
  padding: var(--space-lg);
  margin-top: 1.5rem;
  
  @media (max-width: 768px) {
    padding: var(--space-md);
  }
`;

const UserManagementSection = styled.div`
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

const ErrorMessage = styled.div`
  color: var(--error-color);
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: rgba(233, 76, 93, 0.1);
  border-radius: var(--radius-md);
  text-align: center;
`;

const SuccessMessage = styled.div`
  color: var(--success-color);
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: rgba(92, 219, 165, 0.1);
  border-radius: var(--radius-md);
  text-align: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
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

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
`;

const Tab = styled.button`
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid ${props => props.$active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.$active ? 'var(--primary-color)' : 'var(--text-color)'};
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    color: var(--primary-color);
    background-color: var(--background-alt-color);
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 1.5rem;
  
  input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--background-alt-color);
    color: var(--text-color);
    transition: all 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(145, 70, 255, 0.2);
    }
  }
`;

// Move styled components outside the component to fix dynamic creation warnings
const ApiErrorMessage = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background-color: rgba(255, 193, 7, 0.1);
  border-left: 4px solid #ffc107;
  border-radius: var(--radius-md);
  
  h4 {
    margin-top: 0;
    color: #d97706;
    font-size: 1rem;
    font-weight: 500;
  }
  
  p {
    margin-bottom: 0;
    color: var(--text-color);
  }
`;

const RetryButton = styled.button`
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #d97706;
  border-radius: 4px;
  color: #d97706;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 193, 7, 0.1);
  }
`;

const MockDataBanner = styled.div`
  background: #fef3c7;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #92400e;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-left: 4px solid #f59e0b;
  
  strong {
    margin-right: 0.5rem;
  }
`;

const DetailedErrorMessage = styled.div`
  color: var(--error-color);
  margin: 1rem 0;
  padding: 1rem;
  background-color: rgba(233, 76, 93, 0.1);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--error-color);
  
  h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: var(--error-color);
  }
  
  ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.5rem;
  }
  
  code {
    background-color: rgba(233, 76, 93, 0.2);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: monospace;
  }
`;

const AdminDiagnosticPanel = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background-color: rgb(247, 247, 247);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.85rem;
  line-height: 1.4;
  
  h4 {
    margin-top: 0;
    color: #333;
    font-size: 1rem;
  }
  
  pre {
    background-color: #f0f0f0;
    padding: 0.5rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 0.5rem 0;
  }
  
  .error-section {
    color: #d32f2f;
    font-weight: bold;
    margin-top: 0.5rem;
  }
  
  .solution-section {
    margin-top: 0.5rem;
    color: #388e3c;
  }
`;

/**
 * UserManagement Component - For professors to manage student accounts in Keycloak
 */
const UserManagement = () => {
  // Use the same auth helper as Profile
  const auth = useAuthSafe();
  const userRole = auth?.userRole || 'alumno';
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const dataLoadedRef = useRef(false);
  const [apiError, setApiError] = useState(null); // Added state for API-specific errors
  const [useMockData, setUseMockData] = useState(false); // Track if we're using mock data
  const [retryCount, setRetryCount] = useState(0);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  // Normalize role consistently
  const normalizedRole = userRole ? userRole.toLowerCase() : '';
  const isTeacher = normalizedRole === 'profesor';
  
  // Load users data
  useEffect(() => {
    // Skip if already loaded
    if (dataLoadedRef.current && !retryCount) return;
    
    let isMounted = true;
    
    const loadUsers = async () => {
      // Only proceed if user is a teacher
      if (!isTeacher) {
        if (isMounted) setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        setApiError(null);
        
        // Fetch users from API
        const response = await getUserList();
        
        if (isMounted) {
          // Check if this is mock data by looking at the first ID
          const isMockData = response.length > 0 && response[0].id.startsWith('user-');
          setUseMockData(isMockData);
          
          // Filter to only show students, not professors
          const studentUsers = response.filter(user => 
            user.role === 'alumno' || 
            user.role === 'student' || 
            (user.roles && user.roles.includes('alumno_client_role'))
          );
          
          setUsers(studentUsers);
          setFilteredUsers(studentUsers);
          setLoading(false);
          dataLoadedRef.current = true;
          
          // If using mock data, show a warning to the user
          if (isMockData) {
            setApiError('La aplicación está usando datos de ejemplo debido a un problema de conexión con el servidor de Keycloak.');
          } else {
            // Clear any previous API error if we successfully got real data
            setApiError(null);
          }
        }
      } catch (err) {
        console.error('[UserManagement] Error loading users:', err);
        if (isMounted) {
          setError('No se pudieron cargar los usuarios. Por favor, intenta de nuevo.');
          
          // Only set API error for specific backend issues
          if (err.message && (
              err.message.includes('401') || 
              err.message.includes('403') || 
              err.message.includes('500') ||
              err.message.includes('token') ||
              err.message.includes('permisos')
          )) {
            setApiError(
              'Error de conexión con Keycloak: ' + 
              (err.message.includes('No se pudo obtener usuarios') 
                ? 'El servicio de administración de usuarios no está disponible.' 
                : err.message)
            );
          }
          
          setLoading(false);
        }
      }
    };
    
    loadUsers();
    
    return () => {
      isMounted = false;
    };
  }, [isTeacher, retryCount]);
  
  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = users.filter(user => 
      (user.firstName && user.firstName.toLowerCase().includes(searchTermLower)) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTermLower)) ||
      (user.email && user.email.toLowerCase().includes(searchTermLower))
    );
    
    setFilteredUsers(filtered);
  }, [searchTerm, users]);
  
  // Enhanced error display
  const DetailedErrorMessage = styled.div`
    color: var(--error-color);
    margin: 1rem 0;
    padding: 1rem;
    background-color: rgba(233, 76, 93, 0.1);
    border-radius: var(--radius-md);
    border-left: 4px solid var(--error-color);
    
    h4 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      color: var(--error-color);
    }
    
    ul {
      margin: 0.5rem 0 0 0;
      padding-left: 1.5rem;
    }
    
    code {
      background-color: rgba(233, 76, 93, 0.2);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: monospace;
    }
  `;
  
  // Handle form submission for creating or updating a user
  const handleUserFormSubmit = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Debug what we're submitting
      console.log('[UserManagement] Submitting user data:', userData);
      
      // ADDED: Cleaning & validation of fields before submission
      // Clean and validate input data
      userData.firstName = (userData.firstName || '').trim();
      userData.lastName = (userData.lastName || '').trim();
      userData.phone = (userData.phone || '').trim();
      userData.gender = userData.gender || '';
      userData.birthdate = (userData.birthdate || '').trim();
      
      // Enhanced validation with better error messages
      if (!userData.firstName) {
        setError('El nombre es un campo obligatorio');
        setLoading(false);
        return;
      }
      
      if (!userData.lastName) {
        setError('El apellido es un campo obligatorio');
        setLoading(false);
        return;
      }
      
      if (!userData.gender) {
        setError('El género es un campo obligatorio para Keycloak');
        setLoading(false);
        return;
      }

      if (!userData.phone && !userData.phone_number) {
        setError('El teléfono es un campo obligatorio para Keycloak');
        setLoading(false);
        return;
      }
      
      if (isEditing && selectedUser) {
        // Get the creator ID from all possible sources
        const createdByValue = selectedUser.createdBy || 
                            selectedUser.created_by || 
                            (selectedUser.attributes?.created_by) || 
                            '';
        
        console.log('[UserManagement] Using created_by value:', createdByValue);
        userData.created_by = createdByValue;
        
        try {
          // ADDED: Better retry mechanism with clear error messages
          let updateAttempts = 0;
          let updatedUser = null;
          
          while (updateAttempts < 2 && !updatedUser) {
            updateAttempts++;
            try {
              console.log(`[UserManagement] Update attempt ${updateAttempts}`);
              updatedUser = await updateUser(selectedUser.id, userData);
            } catch (attemptError) {
              console.error(`[UserManagement] Attempt ${updateAttempts} failed:`, attemptError);
              if (updateAttempts >= 2) throw attemptError;
              // Wait briefly before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          if (updatedUser) {
            console.log('[UserManagement] User updated successfully:', updatedUser);
            
            // Update the user in our local state
            setUsers(prevUsers => 
              prevUsers.map(user => 
                user.id === selectedUser.id 
                  ? { 
                      ...user, 
                      firstName: userData.firstName,
                      lastName: userData.lastName,
                      enabled: userData.enabled,
                      // Update attribute references too
                      phone: userData.phone,
                      gender: userData.gender,
                      birthdate: userData.birthdate,
                      createdBy: userData.created_by,
                      // Keep the original attributes structure with our updates
                      attributes: {
                        ...user.attributes,
                        phone_number: userData.phone || user.attributes?.phone_number || '',
                        gender: userData.gender || user.attributes?.gender || '',
                        birth_date: userData.birthdate || user.attributes?.birth_date || '',
                        created_by: userData.created_by || user.attributes?.created_by || ''
                      }
                    } 
                  : user
              )
            );
            
            setSuccess('Usuario actualizado correctamente');
            
            // Return to list view
            setActiveTab('list');
            setIsEditing(false);
            setSelectedUser(null);
          } else {
            throw new Error('No se recibió respuesta del servidor');
          }
        } catch (updateError) {
          setError(updateError.message || 'Error al actualizar usuario');
          console.error('[UserManagement] Update error:', updateError);
          return;
        }
      } else {
        // For new users, set created_by to the current user's ID
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              userData.created_by = payload.sub;
            }
          }
        } catch (e) {
          console.warn('[UserManagement] Error getting creator ID:', e);
        }
        
        try {
          const newUser = await createUser(userData);
          
          // Add new user to the list - ensure it's in the format we expect
          const formattedUser = {
            ...newUser,
            // Flatten some attributes for convenience
            phone: newUser.attributes?.phone_number || newUser.phone || '',
            gender: newUser.attributes?.gender || newUser.gender || '',
            birthdate: newUser.attributes?.birth_date || newUser.birthdate || '',
            createdBy: newUser.attributes?.created_by || newUser.createdBy || ''
          };
          
          setUsers(prevUsers => [...prevUsers, formattedUser]);
          setSuccess('Usuario creado correctamente');
        } catch (createError) {
          setError(createError.message || 'Error al crear usuario');
          setLoading(false);
          return;
        }
      }
      
      // Return to list view
      setActiveTab('list');
      setIsEditing(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('[UserManagement] Error saving user:', err);
      setError(err.message || 'Error al guardar usuario. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await deleteUser(userId);
      
      // Remove user from the list
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      setSuccess('Usuario eliminado correctamente');
    } catch (err) {
      console.error('[UserManagement] Error deleting user:', err);
      setError(err.message || 'Error al eliminar usuario. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle user edit with updated attribute handling
  const handleEditUser = (user) => {
    console.log('[UserManagement] Full user data for editing:', user);
    
    // Make a deep copy to avoid modifying the original
    const userToEdit = JSON.parse(JSON.stringify(user));
    
    // Normalize attributes for the form based on how they appear in logs
    const normalizedUser = {
      ...userToEdit,
      phone: user.phone || 
             user.phone_number || 
             (user.attributes?.phone_number) || 
             '',
             
      gender: user.gender || 
              (user.attributes?.gender) || 
              '',
              
      birthdate: user.birthdate || 
                user.birth_date || 
                (user.attributes?.birth_date) || 
                '',
                  
      createdBy: user.createdBy || 
                user.created_by || 
                (user.attributes?.created_by) || 
                ''
    };
    
    // Debug what we're sending to the form
    console.log('[UserManagement] Normalized user for form:', normalizedUser);
    
    setSelectedUser(normalizedUser);
    setIsEditing(true);
    setActiveTab('create');
  };

  // Handle reloading users
  const handleReload = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      dataLoadedRef.current = false; // Allow reloading data
      
      const response = await getUserList();
      
      // Filter to only show students
      const studentUsers = response.filter(user => 
        user.role === 'alumno' || 
        user.role === 'student' || 
        (user.roles && user.roles.includes('alumno_client_role'))
      );
      
      setUsers(studentUsers);
      setFilteredUsers(studentUsers);
      setSuccess('Lista de usuarios actualizada');
    } catch (err) {
      console.error('[UserManagement] Error reloading users:', err);
      setError('No se pudieron recargar los usuarios. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle retrying connection to backend
  const handleRetryConnection = () => {
    setRetryCount(prev => prev + 1);
    setApiError(null);
    setError(null);
    setSuccess("Intentando conectar con el servidor...");
  };

  // Handle showing backend diagnostics
  const toggleDiagnostics = () => {
    setShowDiagnostics(!showDiagnostics);
  };
  
  // Create diagnostics content with backend information
  const renderDiagnostics = () => {
    return (
      <AdminDiagnosticPanel>
        <h4>Diagnóstico técnico (para administradores)</h4>
        <div className="error-section">Error detectado: No se pueden obtener usuarios de Keycloak</div>
        <pre>
          {`ERROR: HTTP 401 Unauthorized
Causa: El backend no tiene acceso administrativo válido a Keycloak.
Impacto: Se muestran datos de ejemplo en lugar de datos reales.`}
        </pre>
        
        <div className="solution-section">Solución recomendada:</div>
        <pre>
          {`1. Verificar credenciales administrativas en el backend
2. Asegurar que el token de administrador no esté caducado
3. Revisar configuración de clientes en Keycloak
4. Verificar roles administrativos en usuario de servicio`}
        </pre>
        
        <p style={{marginTop: '1rem', fontSize: '0.8rem', color: '#666'}}>
          Esta información es para el equipo técnico.
        </p>
      </AdminDiagnosticPanel>
    );
  };

  // Immediately redirect non-professors
  if (!isTeacher) {
    console.log('[UserManagement] Access denied - redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  if (loading && !users.length) {
    return (
      <UserManagementContainer>
        <PageHeader title="Gestión de Alumnos" />
        <LoadingSpinner />
      </UserManagementContainer>
    );
  }
  
  return (
    <UserManagementContainer>
      <PageHeader 
        title="Gestión de Alumnos" 
        subtitle="Administra las cuentas de estudiantes en el sistema"
      />
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      {/* API Error Warning Box - Enhanced with retry */}
      {apiError && (
        <ApiErrorMessage>
          <h4>Aviso: Acceso limitado</h4>
          <p>{apiError}</p>
          <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
            <RetryButton onClick={handleRetryConnection}>
              Reintentar conexión
            </RetryButton>
            
            <RetryButton onClick={toggleDiagnostics} style={{
              background: showDiagnostics ? 'rgba(255, 193, 7, 0.2)' : 'transparent' 
            }}>
              {showDiagnostics ? 'Ocultar diagnóstico' : 'Mostrar diagnóstico'}
            </RetryButton>
          </div>
        </ApiErrorMessage>
      )}
      
      {/* Show diagnostics panel if enabled */}
      {showDiagnostics && apiError && renderDiagnostics()}
      
      <UserManagementCard>
        {/* Mock data warning banner - Enhanced with icon and clarity */}
        {useMockData && (
          <MockDataBanner>
            <div>
              <strong>⚠️ Datos de demostración:</strong> Estás viendo datos de EJEMPLO que no corresponden a estudiantes reales. 
              Las operaciones que realices no quedarán guardadas en el servidor.
            </div>
            <RetryButton onClick={handleRetryConnection}>
              Reconectar
            </RetryButton>
          </MockDataBanner>
        )}
        
        {activeTab === 'list' ? (
          <>
            <SearchContainer>
              <input 
                type="text" 
                placeholder="Buscar alumnos por nombre o email..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>
            
            <UserList 
              users={filteredUsers} 
              onEdit={handleEditUser} 
              onDelete={handleDeleteUser} 
              loading={loading}
            />
            
            <ButtonGroup>
              <Button 
                className="primary"
                onClick={() => {
                  setActiveTab('create');
                  setIsEditing(false);
                  setSelectedUser(null);
                }}
              >
                Añadir Alumno
              </Button>
              
              <Button 
                className="secondary"
                onClick={handleReload}
                disabled={loading}
              >
                {loading ? 'Actualizando...' : 'Actualizar Lista'}
              </Button>
            </ButtonGroup>
          </>
        ) : (
          <UserForm 
            onSubmit={handleUserFormSubmit} 
            initialData={selectedUser} 
            isEditing={isEditing}
            onCancel={() => {
              setActiveTab('list');
              setIsEditing(false);
              setSelectedUser(null);
            }}
            loading={loading}
          />
        )}
      </UserManagementCard>
    </UserManagementContainer>
  );
};

export default UserManagement;
