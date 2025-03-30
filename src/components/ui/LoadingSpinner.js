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
  height: ${props => props.$fullHeight ? '100vh' : 'auto'};
  margin: ${props => props.$compact ? '1rem 0' : '2rem 0'};
`;

const Spinner = styled.div`
  width: ${props => {
    if (props.$size === 'small') return '16px';
    if (props.$size === 'large') return '40px';
    return props.$size || '40px';
  }};
  height: ${props => {
    if (props.$size === 'small') return '16px';
    if (props.$size === 'large') return '40px';
    return props.$size || '40px';
  }};
  border: 4px solid var(--secondary-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: ${spin} ${props => props.$speed || '1s'} linear infinite;
`;

/**
 * Un componente de spinner de carga versátil y reutilizable
 * 
 * @param {string} size - Tamaño del spinner ('small', 'medium', 'large' o valor en px)
 * @param {boolean} fullHeight - Si el contenedor debe ocupar toda la altura de la pantalla
 * @param {boolean} compact - Reduce los márgenes para un diseño más compacto
 * @param {string} speed - Velocidad de la animación (ej. '0.8s')
 */
const LoadingSpinner = ({ size, fullHeight = false, compact = false, speed, ...rest }) => {
  return (
    <SpinnerContainer $fullHeight={fullHeight} $compact={compact} {...rest}>
      <Spinner $size={size} $speed={speed} />
    </SpinnerContainer>
  );
};

export default LoadingSpinner;
