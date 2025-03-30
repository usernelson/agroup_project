import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import userService from '../../api/userService';

// Estilos para la tabla
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  
  th, td {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border-color);
    text-align: left;
  }
  
  th {
    font-weight: 600;
    background-color: var(--background-alt-color);
  }
  
  tr:hover {
    background-color: var(--hover-background);
  }
  
  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
  }
`;

const ActionButton = styled.button`
  padding: 0.4rem 0.75rem;
  margin-right: 0.5rem;
  background: ${props => props.$danger ? 'var(--error-color)' : 'var(--primary-color)'};
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background: ${props => props.$danger ? 'var(--error-dark-color)' : 'var(--primary-dark-color)'};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SearchBar = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  
  input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md) 0 0 var(--radius-md);
    background: var(--input-background);
    color: var(--text-color);
  }
  
  button {
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    border: 1px solid var(--primary-color);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    cursor: pointer;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 1.5rem;
  
  button {
    padding: 0.5rem 0.75rem;
    background: var(--background-alt-color);
    border: 1px solid var(--border-color);
    cursor: pointer;
    
    &:first-child {
      border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    }
    
    &:last-child {
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &:hover:not(:disabled) {
      background: var(--hover-background);
    }
  }
  
  span {
    padding: 0 1rem;
    font-size: 0.9rem;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
  background-color: ${props => 
    props.$status === 'active' ? 'var(--success-light-color)' : 
    props.$status === 'inactive' ? 'var(--warning-light-color)' : 
    'var(--error-light-color)'};
  color: ${props => 
    props.$status === 'active' ? 'var(--success-color)' : 
    props.$status === 'inactive' ? 'var(--warning-color)' : 
    'var(--error-color)'};
`;

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Cargar la lista de estudiantes
  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // En producción, esto llamaría a la API real
      // Por ahora, usamos datos simulados para desarrollo
      
      if (process.env.NODE_ENV === 'development') {
        // Datos simulados para desarrollo
        setTimeout(() => {
          const mockStudents = generateMockStudents();
          setStudents(mockStudents);
          setTotalPages(Math.ceil(mockStudents.length / 10));
          setLoading(false);
        }, 1000);
      } else {
        // Código para producción
        const response = await userService.getAllUsers();
        // Filtrar solo estudiantes
        const studentData = response.filter(user => 
          user.role === 'alumno' || 
          (user.roles && user.roles.includes('alumno_client_role'))
        );
        setStudents(studentData);
        setTotalPages(Math.ceil(studentData.length / 10));
      }
    } catch (err) {
      console.error('Error al cargar estudiantes:', err);
      setError('Error al cargar la lista de estudiantes. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar datos al montar el componente
  useEffect(() => {
    loadStudents();
  }, []);
  
  // Función para generar datos simulados
  const generateMockStudents = () => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: `s-${i + 1}`,
      firstName: `Estudiante${i + 1}`,
      lastName: `Apellido${i + 1}`,
      email: `estudiante${i + 1}@example.com`,
      status: i % 5 === 0 ? 'inactive' : 'active',
      lastLogin: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
      createdAt: new Date(Date.now() - (i * 30 * 24 * 60 * 60 * 1000)).toISOString()
    }));
  };
  
  // Filtrar estudiantes por término de búsqueda
  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calcular estudiantes paginados
  const paginatedStudents = filteredStudents.slice((page - 1) * 10, page * 10);
  
  // Manejar búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Resetear a primera página al buscar
  };
  
  // Funciones para gestión de estudiantes (simuladas)
  const handleEditStudent = (studentId) => {
    alert(`Editar estudiante con ID: ${studentId}`);
    // En una aplicación real, esto abriría un modal de edición
  };
  
  const handleDeactivateStudent = (studentId) => {
    if (window.confirm('¿Está seguro que desea desactivar este estudiante?')) {
      setStudents(students.map(s => 
        s.id === studentId 
          ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } 
          : s
      ));
    }
  };
  
  // Formatear fecha
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };
  
  if (loading) {
    return <div>Cargando estudiantes...</div>;
  }
  
  if (error) {
    return <div>{error}</div>;
  }
  
  return (
    <div>
      <h2>Gestión de Alumnos</h2>
      
      <SearchBar>
        <input 
          type="text" 
          placeholder="Buscar por nombre o email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch}>Buscar</button>
      </SearchBar>
      
      {paginatedStudents.length === 0 ? (
        <p>No se encontraron estudiantes con los criterios de búsqueda.</p>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map(student => (
                <tr key={student.id}>
                  <td>{student.firstName} {student.lastName}</td>
                  <td>{student.email}</td>
                  <td>
                    <StatusBadge $status={student.status}>
                      {student.status === 'active' ? 'Activo' : 'Inactivo'}
                    </StatusBadge>
                  </td>
                  <td>{formatDate(student.lastLogin)}</td>
                  <td>
                    <ActionButton onClick={() => handleEditStudent(student.id)}>
                      Editar
                    </ActionButton>
                    <ActionButton 
                      $danger 
                      onClick={() => handleDeactivateStudent(student.id)}
                    >
                      {student.status === 'active' ? 'Desactivar' : 'Activar'}
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          <PaginationControls>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </button>
            <span>Página {page} de {Math.max(1, totalPages)}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Siguiente
            </button>
          </PaginationControls>
        </>
      )}
    </div>
  );
};

export default StudentManagement;
