import React, { useContext } from "react";
import styled, { keyframes } from "styled-components";
import { AuthContext } from "../context/AuthContext";

// Animaciones para alertas visuales
const pulseAnimation = keyframes`
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
`;

const SessionIndicator = styled.div`
  display: flex;
  align-items: center;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: ${props => props.$warning ? "#ff4757" : "#333"};
  opacity: ${props => props.$visible ? "1" : "0"};
  transition: opacity 0.3s ease;
  
  /* Solo aplicar animación cuando hay poco tiempo restante */
  animation: ${props => props.$warning ? pulseAnimation : "none"} 2s infinite;
`;

const IconContainer = styled.span`
  margin-right: 5px;
  display: inline-flex;
`;

/**
 * Componente que muestra una advertencia cuando la sesión está próxima a expirar.
 * Evita mostrar "Sesión restante: 00:00" cuando no es necesario.
 */
const SessionTimer = () => {
  const { sessionTimeRemaining, sessionMessage } = useContext(AuthContext);
  
  // Solo mostrar el temporizador cuando hay un mensaje (sesión próxima a expirar)
  const shouldDisplay = !!sessionMessage;
  
  // Determinar si es una advertencia (menos de 5 minutos)
  const isWarning = sessionTimeRemaining && sessionTimeRemaining < 300;
  
  // Si no hay mensaje ni tiempo bajo, no mostramos nada
  if (!shouldDisplay) {
    return null;
  }
  
  return (
    <SessionIndicator $warning={isWarning} $visible={shouldDisplay}>
      <IconContainer>
        <i className="fas fa-clock"></i>
      </IconContainer>
      {sessionMessage}
    </SessionIndicator>
  );
};

export default SessionTimer;