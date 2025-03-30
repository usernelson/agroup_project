import React from 'react';
import styled from 'styled-components';
import { getAttributeValue } from '../../utils/keycloakAttributeHelper';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
`;

const TableHead = styled.thead`
  background-color: var(--background-alt-color);
  
  th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    color: var(--text-color);
    border-bottom: 1px solid var(--border-color);
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid var(--border-color);
    transition: background-color 0.2s;
    
    &:hover {
      background-color: var(--background-alt-color);
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  td {
    padding: 0.75rem 1rem;
    color: var(--text-color);
    vertical-align: middle;
  }
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
  
  &:hover {
    background-color: var(--background-alt-color);
    transform: translateY(-2px);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  &.edit {
    color: var(--primary-color);
  }
  
  &.delete {
    color: var(--error-color);
  }
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  background-color: var(--background-alt-color);
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  
  &.active {
    background-color: rgba(46, 213, 115, 0.15);
    color: #2ecc71;
  }
  
  &.inactive {
    background-color: rgba(234, 84, 85, 0.15);
    color: #ea5455;
  }
  
  &.pending {
    background-color: rgba(255, 159, 67, 0.15);
    color: #ff9f43;
  }
`;

const UserList = ({ users, onEdit, onDelete, loading }) => {
  if (loading) {
    return <p>Cargando usuarios...</p>;
  }
  
  if (!users || users.length === 0) {
    return (
      <EmptyState>
        <p>No hay alumnos registrados en el sistema.</p>
        <p>Puedes crear nuevos alumnos utilizando el botón "Añadir Alumno".</p>
      </EmptyState>
    );
  }
  
  // Check if we're using mock data
  const isMockData = users.length > 0 && (users[0].id.startsWith('mock-') || users[0].id.startsWith('user-'));
  
  // Debug the users array
  console.log('[UserList] Users data:', users);

  return (
    <>
      {isMockData && (
        <p style={{
          color: '#92400e',
          fontSize: '0.9rem',
          marginBottom: '1rem',
          fontStyle: 'italic'
        }}>
          Los datos mostrados son ejemplos y no representan estudiantes reales.
        </p>
      )}
      
      <Table>
        <TableHead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Género</th>
            <th>ID de Profesor</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </TableHead>
        <TableBody>
          {users.map(user => (
            <tr key={user.id} style={user.id.startsWith('mock-') || user.id.startsWith('user-') ? {background: 'rgba(254, 243, 199, 0.2)'} : {}}>
              <td>{`${user.firstName || ''} ${user.lastName || ''}`}</td>
              <td>{user.email}</td>
              <td>{getAttributeValue(user, 'phone_number') || getAttributeValue(user, 'phone') || ''}</td>
              <td>{getAttributeValue(user, 'gender') || ''}</td>
              <td>{getAttributeValue(user, 'created_by') || getAttributeValue(user, 'createdBy') || ''}</td>
              <td>
                <StatusBadge className={user.enabled ? 'active' : 'inactive'}>
                  {user.enabled ? 'Activo' : 'Inactivo'}
                </StatusBadge>
              </td>
              <td>
                <ActionButtonGroup>
                  <ActionButton 
                    className="edit" 
                    onClick={() => onEdit(user)}
                    title="Editar usuario"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </ActionButton>
                  
                  <ActionButton 
                    className="delete" 
                    onClick={() => onDelete(user.id)}
                    title="Eliminar usuario"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </ActionButton>
                </ActionButtonGroup>
              </td>
            </tr>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default UserList;
