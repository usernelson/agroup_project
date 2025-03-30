import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { getUsers } from '../../api/userService';
import UserAdminTools from '../../components/admin/UserAdminTools';

const UsersContainer = styled.div`
  padding: 1rem;
  width: 100%;
`;

const UsersCard = styled.div`
  background-color: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-lg);
  margin-top: 1rem;
  width: 100%;
`;

const UsersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }
  
  th {
    font-weight: 600;
    background-color: var(--background-alt-color);
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    
    th, td {
      padding: 0.75rem;
    }
  }
`;

const UserStatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background-color: ${props => props.$active ? 'var(--success-color)' : 'var(--error-color)'};
  color: white;
`;

const ErrorMessage = styled.div`
  background-color: rgba(var(--error-color-rgb), 0.1);
  color: var(--error-color);
  padding: 1rem;
  border-radius: var(--radius-md);
  margin: 1rem 0;
  text-align: center;
`;

const ActionButton = styled.button`
  background-color: ${props => props.$danger ? 'var(--error-color)' : 'var(--primary-color)'};
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-right: 0.5rem;
  font-size: 0.875rem;
  
  &:hover {
    opacity: 0.9;
  }
`;

// Usuarios de ejemplo para usar cuando la API no devuelve datos
const EXAMPLE_USERS = [
  {
    id: "1",
    firstName: "Carlos",
    lastName: "Rodríguez",
    email: "carlos@ejemplo.com",
    role: "estudiante",
    active: true
  },
  {
    id: "2",
    firstName: "Ana",
    lastName: "González",
    email: "ana@ejemplo.com",
    role: "estudiante",
    active: true
  },
  {
    id: "3",
    firstName: "Miguel",
    lastName: "Sánchez",
    email: "miguel@ejemplo.com",
    role: "profesor",
    active: true
  }
];

// Función para determinar si un usuario tiene el rol de profesor
const isTeacherRole = (role) => {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return normalizedRole === 'profesor' || 
         normalizedRole === 'teacher' || 
         normalizedRole === 'admin';
};

const DashboardUsers = () => {
  const { userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Verificar que el rol sea profesor, de forma flexible
  const isTeacher = isTeacherRole(userRole);

  useEffect(() => {
    // Solo cargar usuarios si es profesor
    if (!isTeacher) {
      setLoading(false);
      return;
    }
    
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Intentar obtener usuarios de la API
        const data = await getUsers();
        
        // Si la API no devuelve datos o la lista está vacía, usar ejemplos
        if (!data || data.length === 0) {
          console.log('Usando datos de ejemplo para usuarios');
          setUsers(EXAMPLE_USERS);
        } else {
          setUsers(data);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        // Usar datos de ejemplo en caso de error
        console.log('Error al cargar usuarios, usando datos de ejemplo');
        setUsers(EXAMPLE_USERS);
        setError("Usando datos de ejemplo. La conexión a la API falló.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isTeacher]);

  // Si no es profesor, mostrar mensaje de acceso denegado
  if (!isTeacher) {
    return (
      <UsersContainer>
        <PageHeader title="Gestión de Usuarios" />
        <ErrorMessage>
          No tienes permisos para acceder a esta sección. Solo los profesores pueden gestionar usuarios.
        </ErrorMessage>
      </UsersContainer>
    );
  }

  if (loading) {
    return (
      <UsersContainer>
        <PageHeader title="Gestión de Usuarios" />
        <LoadingSpinner />
      </UsersContainer>
    );
  }

  return (
    <UsersContainer>
      <PageHeader title="Gestión de Usuarios" />
      
      {error && (
        <ErrorMessage>{error}</ErrorMessage>
      )}
      
      <UsersCard>
        <p>Esta es una versión básica de la gestión de usuarios. Pronto contará con todas las funcionalidades.</p>
        
        <UsersTable>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id || user._id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.role === 'profesor' ? 'Profesor' : 'Estudiante'}</td>
                <td>
                  <UserStatusBadge $active={user.active !== false}>
                    {user.active !== false ? 'Activo' : 'Inactivo'}
                  </UserStatusBadge>
                </td>
                <td>
                  <ActionButton>
                    Editar
                  </ActionButton>
                  <ActionButton $danger>
                    Desactivar
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </UsersTable>
        
        {/* Componente de herramientas de administración */}
        <UserAdminTools />
      </UsersCard>
    </UsersContainer>
  );
};

export default DashboardUsers;
