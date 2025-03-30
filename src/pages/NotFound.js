import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background: ${props => props.$isDarkMode ? 
    'linear-gradient(135deg, #1a1625, #121016)' : 
    'linear-gradient(135deg, #f8f9ff, #f0f0ff)'};
`;

const NotFoundCode = styled.h1`
  font-size: 8rem;
  margin: 0;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    font-size: 6rem;
  }
  
  @media (max-width: 480px) {
    font-size: 4rem;
  }
`;

const NotFoundTitle = styled.h2`
  font-size: 2rem;
  margin: 1rem 0;
  color: var(--text-color);
  
  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const NotFoundDescription = styled.p`
  font-size: 1.1rem;
  color: var(--text-muted);
  max-width: 600px;
  margin: 0 auto 2rem;
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const BackButton = styled(Link)`
  padding: 0.75rem 1.5rem;
  background: var(--gradient);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(145, 70, 255, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(145, 70, 255, 0.4);
  }
`;

const NotFound = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <NotFoundContainer $isDarkMode={isDarkMode}>
      <NotFoundCode>404</NotFoundCode>
      <NotFoundTitle>Página no encontrada</NotFoundTitle>
      <NotFoundDescription>
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </NotFoundDescription>
      <BackButton to="/dashboard">Volver al Dashboard</BackButton>
    </NotFoundContainer>
  );
};

export default NotFound;
