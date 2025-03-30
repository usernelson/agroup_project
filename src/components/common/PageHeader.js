import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

/**
 * Componente de encabezado de página reutilizable con navegación
 * Proporciona consistencia a través de toda la aplicación
 */
const PageHeader = ({ 
  title, 
  subtitle, 
  showBackButton = false, 
  backTo = '', 
  actions = null,
  children
}) => {
  const navigate = useNavigate();
  
  const handleBackClick = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1); // Navegar a la página anterior en el historial
    }
  };
  
  return (
    <HeaderContainer>
      <HeaderLeft>
        {showBackButton && (
          <BackButton onClick={handleBackClick}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span className="back-text">Volver</span>
          </BackButton>
        )}
        <TitleContainer>
          <Title>{title}</Title>
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </TitleContainer>
        {children}
      </HeaderLeft>
      
      {actions && <HeaderActions>{actions}</HeaderActions>}
    </HeaderContainer>
  );
};

const HeaderContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: var(--text-muted);
  margin: 0;
  font-size: 1rem;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-color);
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  &:hover {
    background-color: var(--background-alt-color);
    transform: translateX(-3px);
  }
  
  @media (max-width: 480px) {
    .back-text {
      display: none;
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: var(--space-md);
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-end;
  }
  
  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
  }
`;

export default PageHeader;
