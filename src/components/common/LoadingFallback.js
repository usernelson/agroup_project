import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { opacity: 0.4; }
  50% { opacity: 0.8; }
  100% { opacity: 0.4; }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
  background: var(--background-color);
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid var(--background-alt-color);
  border-top: 5px solid var(--primary-color);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 1rem;
`;

const LoadingText = styled.p`
  font-size: 1rem;
  color: var(--text-color);
  margin: 0;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const LogoContainer = styled.div`
  font-size: 2rem;
  font-weight: bold;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 2rem;
  
  span {
    color: var(--text-color);
    -webkit-text-fill-color: var(--text-color);
  }
`;

const LoadingFallback = () => {
  return (
    <LoadingContainer>
      <LogoContainer>
        a<span>Teacher</span>
      </LogoContainer>
      <Spinner />
      <LoadingText>Cargando...</LoadingText>
    </LoadingContainer>
  );
};

export default LoadingFallback;
