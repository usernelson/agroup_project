import React, { useState, useEffect, forwardRef } from 'react';
import styled from 'styled-components';
import { useAuthSafe } from '../../utils/contextHelpers';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal, 1000);
`;

const ModalContainer = styled.div`
  background-color: var(--card-background);
  border-radius: var(--radius-lg, 8px);
  box-shadow: var(--shadow-lg, 0 10px 15px rgba(0, 0, 0, 0.2));
  padding: 1.5rem;
  width: 90%;
  max-width: 450px;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  
  svg {
    color: var(--warning-color, #FFC107);
    margin-right: 0.75rem;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
  }
  
  h3 {
    margin: 0;
    color: var(--text-color);
    font-size: 1.25rem;
  }
`;

const ModalContent = styled.div`
  margin-bottom: 1.5rem;
  
  p {
    color: var(--text-color);
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  
  .countdown {
    font-weight: 600;
    color: var(--error-color, #FA5252);
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md, 4px);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
`;

/**
 * Session Timeout Modal
 * 
 * Displays a warning when the user's session is about to expire,
 * giving them the option to extend their session or log out.
 * 
 * @param {Function} onExtend - Function to call when the user wants to extend their session
 * @param {Function} onLogout - Function to call when the user wants to log out
 */
const SessionTimeoutModal = forwardRef(({ isOpen, onRequestClose, onExtendSession, onLogout }, ref) => {
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds
  const [countdownInterval, setCountdownInterval] = useState(null);
  const auth = useAuthSafe();
  
  // Reset countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(5 * 60);
      
      // Start countdown
      const interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(interval);
            onLogout();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      setCountdownInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      // Clear interval when modal closes
      if (countdownInterval) {
        clearInterval(countdownInterval);
        setCountdownInterval(null);
      }
    }
  }, [isOpen, onLogout, countdownInterval]);
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // CRITICAL FIX: Add proper session extension functionality
  const handleExtendSession = async () => {
    try {
      // First try to use the callback if provided
      if (onExtendSession) {
        await onExtendSession();
      }
      
      // Then try to use auth context directly
      if (auth && typeof auth.refreshAuth === 'function') {
        console.log('[SessionTimeoutModal] Extending session via auth.refreshAuth()');
        await auth.refreshAuth();
      } else {
        console.log('[SessionTimeoutModal] Using fallback token refresh');
        // Fallback to direct fetch for token refresh
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await fetch('/api/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.token) {
              localStorage.setItem('token', data.token);
              if (data.refresh_token) {
                localStorage.setItem('refreshToken', data.refresh_token);
              }
            }
          }
        }
      }
      
      // Close the modal after successful refresh
      if (onRequestClose) {
        onRequestClose();
      }
      
      console.log('[SessionTimeoutModal] Session extended successfully');
    } catch (error) {
      console.error('[SessionTimeoutModal] Error extending session:', error);
      // Close anyway to prevent annoying the user
      if (onRequestClose) {
        onRequestClose();
      }
    }
  };

  if (!isOpen) return null;
  
  return (
    <ModalOverlay>
      <ModalContainer ref={ref}>
        <ModalHeader>
          <h2>Sesión a punto de expirar</h2>
        </ModalHeader>
        <ModalContent>
          <p>Tu sesión está a punto de expirar por inactividad. Serás desconectado en {formatTime(timeLeft)}.</p>
          <p>¿Deseas seguir conectado o cerrar sesión?</p>
        </ModalContent>
        <ModalFooter>
          <Button onClick={onLogout} $type="secondary">
            Cerrar Sesión
          </Button>
          <Button onClick={handleExtendSession} $type="primary">
            Seguir Conectado
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
});

// Add display name for debugging
SessionTimeoutModal.displayName = 'SessionTimeoutModal';

export default SessionTimeoutModal;
