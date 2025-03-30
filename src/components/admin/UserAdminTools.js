import React from 'react';
import styled from 'styled-components';
import { Button } from '../common/UIComponents';

const ToolsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  flex: 1;
  gap: 0.5rem;
  
  input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    min-width: 250px;
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

/**
 * Componente de herramientas administrativas para la gestión de usuarios
 */
const UserAdminTools = ({ 
  onAddUser, 
  onSearch, 
  onRefresh, 
  searchValue, 
  setSearchValue 
}) => {
  return (
    <ToolsContainer>
      <SearchContainer>
        <input
          type="text"
          placeholder="Buscar usuarios..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
        <Button $primary onClick={onSearch}>
          Buscar
        </Button>
      </SearchContainer>
      
      <div>
        <Button $primary onClick={onAddUser}>
          Añadir Usuario
        </Button>
        <Button onClick={onRefresh} style={{ marginLeft: '0.5rem' }}>
          Actualizar
        </Button>
      </div>
    </ToolsContainer>
  );
};

export default UserAdminTools;
