import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { handleLogout } from '../../auth/authUtils';

// Style that can be customized through props
const LogoutButtonContainer = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.$background || 'transparent'};
  color: ${props => props.$color || 'var(--text-color)'};
  border: ${props => props.$border || 'none'};
  padding: ${props => props.$padding || '0.75rem 1rem'};
  border-radius: ${props => props.$borderRadius || '8px'};
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  transition: all 0.3s ease;
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
  text-align: ${props => props.$textAlign || 'left'};
  
  &:hover {
    background: ${props => props.$hoverBackground || 'var(--background-alt-color)'};
    color: ${props => props.$hoverColor || 'var(--error-color)'};
    transform: ${props => props.$hoverTransform || 'translateX(5px)'};
  }
  
  &:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  svg {
    width: ${props => props.$iconSize || '20px'};
    height: ${props => props.$iconSize || '20px'};
    color: ${props => props.$iconColor || 'var(--error-color)'};
    stroke-width: ${props => props.$strokeWidth || '2.2'};
    flex-shrink: 0;
  }
`;

/**
 * Reusable logout button component with improved accessibility
 * 
 * @param {Object} props - Component props
 * @param {String} props.text - Button text (defaults to "Cerrar Sesión")
 * @param {Function} props.onClick - Optional callback after logout initiated
 * @param {Object} props.styles - Optional styling overrides
 * @param {Boolean} props.disabled - Whether the button is disabled
 */
const LogoutButton = ({ 
  text = "Cerrar Sesión", 
  onClick,
  styles = {},
  disabled = false,
  ...props 
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Memoize the click handler to prevent unnecessary re-renders
  const handleClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't proceed if disabled
    if (disabled) return;
    
    // Close parent dropdown/menu if applicable
    if (onClick) onClick();
    
    // Use centralized logout handler
    await handleLogout(logout, navigate);
  }, [logout, navigate, onClick, disabled]);
  
  return (
    <LogoutButtonContainer 
      onClick={handleClick}
      role="menuitem"
      aria-label="Cerrar sesión"
      type="button"
      disabled={disabled}
      {...styles}
      {...props}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      <span>{text}</span>
    </LogoutButtonContainer>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(LogoutButton);
