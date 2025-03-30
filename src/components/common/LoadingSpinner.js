import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  /* Using $fullScreen as a transient prop (won't be passed to DOM) */
  height: ${props => props.$fullScreen ? '100vh' : '100%'};
  padding: 2rem;
`;

const SpinnerElement = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid var(--background-alt-color, #f0f0f0);
  border-top: 4px solid var(--primary-color, #9146FF);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

// Change prop name from fullScreen to $fullScreen
const LoadingSpinner = ({ $fullScreen = false }) => {
  return (
    <SpinnerContainer $fullScreen={$fullScreen}>
      <SpinnerElement />
    </SpinnerContainer>
  );
};

export default LoadingSpinner;
