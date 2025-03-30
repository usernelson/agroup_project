import styled, { keyframes } from 'styled-components';

// Animation keyframes
export const shakeAnimation = keyframes`
  0%   { transform: translateX(0); }
  25%  { transform: translateX(-5px); }
  50%  { transform: translateX(5px); }
  75%  { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Common card container con props transientes ($)
export const Card = styled.div`
  background-color: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--card-shadow);
  padding: var(--space-lg);
  border: 1px solid var(--border-color);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--hover-shadow);
  }
`;

// Usar consistentemente props transientes ($)
export const Button = styled.button`
  padding: 0.5rem 1.5rem;
  margin-top: 0.5rem;
  background: ${props => props.$primary ? 'var(--gradient)' : 'transparent'};
  color: ${props => props.$primary ? 'white' : 'var(--text-color)'};
  border: ${props => props.$primary ? 'none' : '1px solid var(--border-color)'};
  border-radius: var(--radius-md);
  font-weight: 500;
  box-shadow: ${props => props.$primary ? '0 0 12px var(--hover-shadow)' : 'none'};
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.$primary ? 'var(--gradient)' : 'var(--gradient)'};
    color: white;
    box-shadow: 0 0 15px var(--button-shadow);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: none;
    animation: ${shakeAnimation} 0.4s ease;
  }
`;

// Usar variables CSS estándar para espaciado y bordes
export const Input = styled.input`
  font-size: 16px;
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--input-background);
  color: var(--input-text);
  transition: box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease;

  &::placeholder {
    opacity: 0.6;
    color: var(--text-color);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--hover-shadow);
    transform: scale(1.01);
  }
  
  &:disabled {
    opacity: 0.7;
  }
`;

// Consistencia con props transientes ($)
export const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${props => props.$isDarkMode ? 
    'rgba(0, 0, 0, 0.7)' : 
    'rgba(0, 0, 0, 0.5)'};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  animation: ${fadeIn} 0.3s ease;
`;

// Mensajes con variables CSS estándar
export const ErrorMessage = styled.p`
  color: var(--error-color);
  font-weight: bold;
  margin-bottom: var(--space-md);
  font-size: 0.875rem;
`;

export const SuccessMessage = styled.p`
  color: var(--success-color);
  font-weight: bold;
  margin-bottom: var(--space-md);
  font-size: 0.875rem;
`;

export const InfoMessage = styled.div`
  background-color: var(--background-alt-color);
  border-left: 3px solid var(--accent-color);
  padding: var(--space-sm) var(--space-md);
  margin: var(--space-md) 0;
  font-size: 0.875rem;
  color: var(--text-color);
  border-radius: var(--radius-sm);
`;

// Usar variables CSS para margen y espaciado
export const SectionTitle = styled.h3`
  color: var(--text-color);
  margin-bottom: var(--space-lg);
  font-weight: 600;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -8px;
    width: 50px;
    height: 3px;
    background: var(--gradient);
    border-radius: 3px;
  }
`;

// Export default consistente con los nombres de los componentes
export default {
  Card,
  Button,
  Input,
  ModalBackdrop,
  ErrorMessage,
  SuccessMessage,
  InfoMessage,
  SectionTitle,
  shakeAnimation,
  fadeIn
};
