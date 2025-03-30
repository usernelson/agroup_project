import React, { useState, useEffect, useRef } from 'react';
import { useForm } from "react-hook-form";
import styled, { keyframes, css, createGlobalStyle } from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import Captcha from "../../components/ui/Captcha";
import { emailValidation } from "../../utils/validation";
// CRITICAL FIX: Use useAuthSafe instead of direct context import
import { useAuthSafe } from '../../utils/contextHelpers';
import { useTheme } from '../../context/ThemeContext';
import { login as apiLogin } from '../../api/authService'; // Import direct API function as fallback
import { safeLocationNavigate } from '../../utils/navigationUtils';

// Add custom font import for more modern typography
const FontImport = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
`;

// Animación de sacudida para el formulario
const shakeAnimation = keyframes`
  0%   { transform: translateX(0); }
  25%  { transform: translateX(-5px); }
  50%  { transform: translateX(5px); }
  75%  { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

// Spinner para el botón y estado de carga
const Spinner = styled.div`
  border: 4px solid var(--secondary-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
  
  @keyframes spin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Add success animation keyframes
const checkmarkAnimation = keyframes`
  0% {
    stroke-dashoffset: 100;
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    transform: scale(1);
    opacity: 1;
  }
`;

const circleFillAnimation = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Add a success animation component
const SuccessAnimation = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;

  svg {
    width: 80px;
    height: 80px;
  }

  .checkmark-circle {
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    stroke-width: 2;
    stroke-miterlimit: 10;
    stroke: var(--success-color);
    fill: none;
    animation: ${checkmarkAnimation} 0.8s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }

  .checkmark-circle-fill {
    fill: rgba(16, 185, 129, 0.1);
    animation: ${circleFillAnimation} 0.8s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }

  .checkmark-check {
    transform-origin: 50% 50%;
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    stroke: var(--success-color);
    stroke-width: 3;
    animation: ${checkmarkAnimation} 0.8s cubic-bezier(0.65, 0, 0.45, 1) 0.3s forwards;
  }

  p {
    margin-top: 1rem;
    color: var(--success-color);
    font-weight: 500;
  }
`;

// Enhanced login container with improved background
const LoginContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${props => props.$isDarkMode ? 
    'linear-gradient(135deg, #1a1625, #121016)' : 
    'linear-gradient(135deg, #f8f9ff, #f0f0ff)'};
  font-family: 'Poppins', sans-serif;
  
  @media (max-width: 768px) {
    flex-direction: column-reverse;
  }
`;

// Sección del formulario - primero en móviles, segundo en escritorio
const LoginFormSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    min-height: 80vh;
    order: 1;
    align-items: flex-start;
    padding-bottom: 3rem;
  }
  
  @media (max-width: 480px) {
    padding: 1rem;
    min-height: 85vh;
    padding-bottom: 2rem;
  }
`;

// Improved form styling
const LoginForm = styled.form`
  width: 100%;
  max-width: 420px;
  background-color: ${props => props.$isDarkMode ? 
    'var(--card-background)' : 
    'var(--card-background)'};
  border-radius: 20px; // More rounded corners
  box-shadow: 0 10px 40px ${props => props.$isDarkMode ? 
    'rgba(0, 0, 0, 0.3)' : 
    'rgba(145, 70, 255, 0.15)'};
  padding: 2.5rem; // More padding
  text-align: center;
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
  border: 1px solid ${props => props.$isDarkMode ? 
    'rgba(99, 80, 158, 0.3)' : 
    'rgba(255, 255, 255, 0.8)'};
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px ${props => props.$isDarkMode ? 
      'rgba(0, 0, 0, 0.4)' : 
      'rgba(145, 70, 255, 0.2)'};
  }
  
  ${props => props.$isSubmitting && css`
    transform: scale(0.98);
    opacity: 0.8;
  `}
  
  ${props => props.$hasError && css`
    animation: ${shakeAnimation} 0.5s ease;
  `}
  
  @media (max-width: 768px) {
    max-width: 100%;
    padding: 2rem;
  }
  
  @media (max-width: 480px) {
    padding: 1.5rem;
    border-radius: 16px;
    box-shadow: 0 5px 20px ${props => props.$isDarkMode ? 
      'rgba(0, 0, 0, 0.2)' : 
      'rgba(145, 70, 255, 0.1)'};
  }
`;

// Enhanced company section styling
const CompanyInfoSection = styled.div`
  flex: 1;
  background: var(--gradient);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: white;
  position: relative; // Added for decorative elements
  overflow: hidden; // Contain decorative elements
  
  &::before {
    content: '';
    position: absolute;
    top: -10%;
    right: -10%;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    z-index: 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -15%;
    left: -15%;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    z-index: 0;
  }
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    min-height: 20vh;
    order: 2;
  }
  
  @media (max-width: 480px) {
    padding: 1rem;
    min-height: 15vh;
  }
`;

// Enhanced title with better typography
const Title = styled.h2`
  font-family: 'Poppins', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-color);
  letter-spacing: -0.5px;
  
  @media (max-width: 480px) {
    font-size: 1.75rem;
    margin-bottom: 1.25rem;
  }
`;

// Enhanced company title with better typography
const CompanyTitle = styled.h1`
  font-family: 'Poppins', sans-serif;
  font-size: 2.75rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  letter-spacing: -0.5px;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    font-size: 2.25rem;
    margin-bottom: 0.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.75rem;
    margin-bottom: 0.25rem;
  }
`;

// Add a typing and deleting animation effect
const typeAnimation = keyframes`
  from { width: 0 }
  to { width: 100% }
`;

const deleteAnimation = keyframes`
  from { width: 100% }
  to { width: 0 }
`;

const blinkCursorAnimation = keyframes`
  from, to { border-color: transparent }
  50% { border-color: white }
`;

// Enhanced CompanyDescription with typewriter effect
const CompanyDescription = styled.div`
  font-family: 'Poppins', sans-serif;
  font-size: 1.25rem;
  text-align: center;
  max-width: 80%;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
  position: relative;
  z-index: 1;
  margin-top: 0.5rem;
  min-height: 2.5rem; /* Reserve space for text to prevent layout shifts */
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
    max-width: 100%;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const TypingText = styled.span`
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  border-right: 3px solid white;
  margin: 0 auto;
  animation: 
    ${props => props.$isTyping ? typeAnimation : deleteAnimation} ${props => props.$isTyping ? '2s' : '1.5s'} steps(40, end) forwards,
    ${blinkCursorAnimation} 0.75s step-end infinite;
`;

const ErrorMessage = styled.p`
  color: var(--error-color);
  font-weight: 500;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-align: left;
  font-family: 'Poppins', sans-serif;
  display: flex;
  align-items: center;
  
  &::before {
    content: '⚠️';
    margin-right: 5px;
  }
`;

// Improved input styling
const StyledInput = styled.input`
  width: 100%;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid ${props => props.$isDarkMode ? 
    'rgba(99, 80, 158, 0.5)' : 
    'rgba(145, 70, 255, 0.3)'};
  border-radius: 14px;
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;
  transition: all 0.3s ease;
  background-color: ${props => props.$isDarkMode ? 
    'rgba(40, 35, 50, 0.8)' : 
    'rgba(255, 255, 255, 0.9)'};
  color: var(--text-color);
  
  &::placeholder {
    color: ${props => props.$isDarkMode ? 
      'rgba(255, 255, 255, 0.5)' : 
      'rgba(0, 0, 0, 0.4)'};
    font-weight: 300;
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px ${props => props.$isDarkMode ? 
      'rgba(155, 110, 255, 0.25)' : 
      'rgba(145, 70, 255, 0.15)'};
    transform: translateY(-2px);
  }
  
  @media (max-width: 480px) {
    padding: 0.9rem 1rem;
    font-size: 0.95rem;
    margin-bottom: 0.85rem;
    border-radius: 12px;
  }
`;

// Enhanced button with better transitions
const StyledButton = styled.button`
  width: 100%;
  padding: 1rem 1.25rem;
  margin-top: 0.75rem;
  background: var(--gradient);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  font-family: 'Poppins', sans-serif;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.1);
    transition: width 0.3s ease;
  }
  
  &:hover {
    box-shadow: 0 8px 20px ${props => props.$isDarkMode ? 
      'rgba(155, 110, 255, 0.3)' : 
      'rgba(145, 70, 255, 0.3)'};
    transform: translateY(-3px);
    
    &::after {
      width: 100%;
    }
  }
  
  &:active {
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  @media (max-width: 480px) {
    padding: 0.9rem;
    font-size: 1rem;
    border-radius: 12px;
  }
`;

// Botón para cambio de tema en una esquina
const ThemeToggle = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$isDarkMode ? 
    'rgba(40, 35, 50, 0.8)' : 
    'rgba(255, 255, 255, 0.8)'};
  border: 1px solid ${props => props.$isDarkMode ? 
    'rgba(99, 80, 158, 0.3)' : 
    'rgba(145, 70, 255, 0.2)'};
  color: var(--text-color);
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s ease;
  
  &:hover {
    transform: rotate(15deg);
    box-shadow: 0 0 15px ${props => props.$isDarkMode ? 
      'rgba(155, 110, 255, 0.4)' : 
      'rgba(145, 70, 255, 0.3)'};
  }
`;

// Enhanced styled components for error and status messages
const StatusMessage = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  line-height: 1.4;
  
  ${props => props.$type === 'error' && css`
    background-color: rgba(255, 76, 76, 0.1);
    border: 1px solid var(--error-color);
    color: var(--error-color);
  `}
  
  ${props => props.$type === 'success' && css`
    background-color: rgba(64, 192, 87, 0.1);
    border: 1px solid var(--success-color);
    color: var(--success-color);
  `}
  
  ${props => props.$type === 'info' && css`
    background-color: rgba(85, 119, 255, 0.1);
    border: 1px solid var(--primary-color);
    color: var(--text-color);
  `}
`;

/**
 * Login Component
 * 
 * Handles user authentication with:
 * - Email/password login
 * - OTP (2FA) verification
 * - CAPTCHA for multiple failed attempts
 * - Error handling and user feedback
 * - Redirection after successful authentication
 */
const Login = () => {
  // CRITICAL FIX: Add error handling for auth context
  const auth = useAuthSafe();
  let safeAuth;
  try {
    safeAuth = auth;
  } catch (error) {
    console.error('[Login] Error using AuthSafe:', error);
    // Provide a fallback auth object
    safeAuth = {
      isAuthenticated: false,
      loading: false,
      login: async (...args) => {
        console.warn('[Login] Using direct API login due to context error');
        return await apiLogin(...args);
      }
    };
  }
  
  // Safely access auth properties with optional chaining
  const isAuthenticated = safeAuth?.isAuthenticated;
  const loading = safeAuth?.loading;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loginFails, setLoginFails] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState(null);
  const [captchaInput, setCaptchaInput] = useState(null);
  const [captchaReset, setCaptchaReset] = useState(false);
  const [hasOTPField, setHasOTPField] = useState(false); // Initially hide OTP field
  const [statusMessage, setStatusMessage] = useState(""); // New state for status messages
  const [otpRequired, setOtpRequired] = useState(false); // Track if OTP is needed
  const [typingText, setTypingText] = useState('Soluciones con Inteligencia Artificial');
  const [isTyping, setIsTyping] = useState(true);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  
  const { isDarkMode, toggleTheme } = useTheme();
  
  // CRITICAL FIX: Track redirect attempts to prevent infinite loops
  const redirectAttempted = useRef(false);
  const loginCompletedRef = useRef(false);

  // CRITICAL FIX: Define the aiCapabilities array that was missing
  const aiCapabilities = [
    'Soluciones con Inteligencia Artificial',
    'Generación de texto avanzada',
    'Análisis de datos inteligente',
    'Automatización de procesos complejos',
    'Asistencia educativa personalizada',
    'Creación de contenido dinámico',
    'Interpretación de lenguaje natural'
  ];

  // Load failed attempts from localStorage
  useEffect(() => {
    const storedFails = localStorage.getItem('loginFails');
    if (storedFails) {
      setLoginFails(parseInt(storedFails, 10));
    }
    
    // Check URL for 'logout=true' parameter to show logout message
    const params = new URLSearchParams(window.location.search);
    if (params.has('logout') && params.get('logout') === 'true') {
      setStatusMessage("Has cerrado sesión correctamente.");
    }
    
    // Check for 'error' parameter
    if (params.has('error')) {
      setErrorMessage(decodeURIComponent(params.get('error')));
    }
  }, []);

  // Store failed attempts in localStorage
  useEffect(() => {
    if (loginFails > 0) {
      localStorage.setItem('loginFails', loginFails.toString());
    }
  }, [loginFails]);

  // Reset failed attempts after 30 minutes
  useEffect(() => {
    const lastFailTime = localStorage.getItem('lastFailTime');
    if (lastFailTime) {
      const timeSinceFail = Date.now() - parseInt(lastFailTime, 10);
      if (timeSinceFail > 30 * 60 * 1000) { // 30 minutes
        setLoginFails(0);
        localStorage.removeItem('loginFails');
        localStorage.removeItem('lastFailTime');
      }
    }
  }, []);

  // FIXED: Consolidated redirect logic into a single useEffect with proper dependency tracking and loop prevention
  useEffect(() => {
    // Only attempt redirect when ALL these conditions are true
    if (!loading && 
        isAuthenticated && 
        !isSubmitting && 
        !redirectAttempted.current && 
        loginCompletedRef.current) {  // ADDED: Only redirect after successful login
      
      console.log("[Login] Attempting dashboard redirect, setting prevention flag");
      
      // Set the flag BEFORE navigation attempt
      redirectAttempted.current = true;
      
      // Store a timestamp in sessionStorage to prevent loops across page loads
      sessionStorage.setItem('lastLoginRedirect', Date.now().toString());
      
      // Use React Router's navigate instead of window.location
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 300);
    }
  }, [isAuthenticated, loading, isSubmitting, navigate]);

  // Add a cleanup effect to reset flags when unmounting
  useEffect(() => {
    return () => {
      console.log("[Login] Component unmounting, clearing redirect flags");
      redirectAttempted.current = false;
      loginCompletedRef.current = false;
    };
  }, []);

  // Handle text rotation with typing effect
  useEffect(() => {
    let timeout;
    let currentIndex = 0;
    
    const rotateText = () => {
      // If typing phase is complete, start delete phase
      if (isTyping) {
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, 3000); // Wait 3 seconds before deleting
      } else {
        // After delete phase, move to next text
        timeout = setTimeout(() => {
          currentIndex = (currentIndex + 1) % aiCapabilities.length;
          setTypingText(aiCapabilities[currentIndex]);
          setIsTyping(true);
        }, 1000); // Wait 1 second after deleting before typing new text
      }
    };
    
    timeout = setTimeout(rotateText, isTyping ? 2000 : 1500);
    
    return () => clearTimeout(timeout);
  }, [isTyping, aiCapabilities]);

  // Auto-dismiss logout message after 3 seconds
  useEffect(() => {
    if (statusMessage && statusMessage.includes("cerrado sesión")) {
      const timer = setTimeout(() => {
        setStatusMessage("");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleCaptchaChange = (value, isGenerated) => {
    if (isGenerated) {
      setCaptchaAnswer(value);
    } else {
      setCaptchaInput(value);
    }
  };

  const onSubmit = async (data) => {
    // Reset any previous states
    setErrorMessage("");
    setStatusMessage("");
    
    // First step - just showing the OTP field if needed
    if (!hasOTPField && !otpRequired) {
      // Check if OTP is present in form data already
      if (!data.otp) {
        setHasOTPField(true);
        return;
      }
    }
    
    // Verificamos CAPTCHA si hay más de 5 intentos fallidos
    if (loginFails >= 5) {
      if (!captchaInput || captchaInput !== captchaAnswer) {
        setErrorMessage("Por favor resuelve el captcha correctamente para continuar");
        setCaptchaReset(!captchaReset);
        return;
      }
    }

    setIsSubmitting(true);
    setStatusMessage("Verificando credenciales...");

    try {
      // Clear auth error flag
      if (safeAuth?.clearAuthError) {
        safeAuth.clearAuthError();
      }
      
      // CRITICAL FIX: Safely access the login function from auth or use direct API function
      let response;
      try {
        // Try to use context login function if available
        if (safeAuth && typeof safeAuth.login === 'function') {
          console.log("[Login] Using login function from auth context");
          response = await safeAuth.login(data.username, data.password, data.otp || "");
        } else {
          // Fallback to direct API call if context function is not available
          console.log("[Login] Auth context login not available, using direct API call");
          response = await apiLogin(data.username, data.password, data.otp || "", false);
        }
      } catch (loginError) {
        console.error("[Login] Error with login function:", loginError);
        // Last resort - completely direct API call
        response = await apiLogin(data.username, data.password, data.otp || "", false);
      }
      
      // Check if OTP is required but not provided
      if (response && response.otpRequired && !data.otp) {
        setOtpRequired(true);
        setHasOTPField(true);
        setStatusMessage("Se requiere código OTP para continuar");
        setIsSubmitting(false);
        return;
      }
      
      // Mark login as successful to prevent premature redirects
      loginCompletedRef.current = true;
      
      // Show animated success instead of text
      setShowSuccessAnimation(true);
      
      // Reset failed attempts counter
      setLoginFails(0);
      localStorage.removeItem('loginFails');
      localStorage.removeItem('lastFailTime');
      
      // IMPORTANT: Add a delay before refreshing auth to ensure tokens are saved
      setTimeout(async () => {
        // DIRECTLY SET TOKEN FROM THE RESPONSE if not already set by login function
        if (response && response.token) {
          console.log("[Login] Setting token directly from response");
          localStorage.setItem('token', response.token);
        }
        
        if (response && response.refresh_token) {
          localStorage.setItem('refreshToken', response.refresh_token);
        }
        
        // Verify tokens are in localStorage
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        
        console.log("[Login] Tokens present:", { 
          token: !!token, 
          refreshToken: !!refreshToken 
        });
        
        // STORE TOKEN AS USER ROLE - Extract user role from token if possible
        if (token) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              // Find roles in the token
              let userRole = 'alumno'; // Default
              
              if (payload.resource_access && 
                  payload.resource_access.ateacher_client_api_rest && 
                  payload.resource_access.ateacher_client_api_rest.roles) {
                
                const roles = payload.resource_access.ateacher_client_api_rest.roles;
                
                if (roles.includes('profesor_client_role')) {
                  userRole = 'profesor';
                } else if (roles.includes('alumno_client_role')) {
                  userRole = 'alumno';
                }
              }
              
              console.log("[Login] Setting user role from token:", userRole);
              localStorage.setItem('userRole', userRole);
            }
          } catch (e) {
            console.error("[Login] Error extracting role from token:", e);
          }
        }
        
        // Refresh auth state with tokens
        try {
          // Check token is properly stored before attempting refresh
          const token = localStorage.getItem('token');
          console.log('[Login] Token stored:', !!token);

          // Safely check if refreshAuth exists before calling it
          if (safeAuth && typeof safeAuth.refreshAuth === 'function') {
            await safeAuth.refreshAuth();
          } else {
            // If refreshAuth is not available, manually store user profile
            if (response.user) {
              localStorage.setItem('userProfile', JSON.stringify(response.user));
            }
            console.warn('[Login] refreshAuth not available, using fallback');
            
            // Try to reload the page to initialize auth from scratch
            window.location.href = "/dashboard";
            return;
          }
        } catch (refreshError) {
          console.error('[Login] Error refreshing auth:', refreshError);
          // Continue login process even if refresh fails
        }
        
        // Add another delay to ensure state is updated before redirect
        setTimeout(() => {
          // ENHANCEMENT: Use safeLocationNavigate instead of direct window.location
          console.log("[Login] Auth refreshed, navigating to dashboard");
          safeLocationNavigate('/dashboard', true);
        }, 1000);
      }, 1500);
      
    } catch (error) {
      console.error("[Login] Error durante inicio de sesión:", error);
      
      // Store the time of the failed attempt
      localStorage.setItem('lastFailTime', Date.now().toString());
      
      // Increment failed attempts counter
      const newFailCount = loginFails + 1;
      setLoginFails(newFailCount);
      
      // Check for OTP-related errors
      if (error.message && (error.message.includes('OTP') || error.message.includes('código'))) {
        setHasOTPField(true);
        setOtpRequired(true);
      }
      
      // Set appropriate error message
      setErrorMessage(error.message || "Credenciales inválidas. Por favor verifica tu email y contraseña.");
      
      // Show CAPTCHA warning if approaching limit
      if (newFailCount === 4) {
        setStatusMessage("Advertencia: Después del próximo intento fallido necesitarás resolver un CAPTCHA.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LoginContainer $isDarkMode={isDarkMode}>
      <FontImport />
      <ThemeToggle 
        onClick={toggleTheme} 
        $isDarkMode={isDarkMode}
        title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      >
        {isDarkMode ? "☀️" : "🌙"}
      </ThemeToggle>
      
      <LoginFormSection>
        <LoginForm 
          onSubmit={handleSubmit(onSubmit)}
          $isDarkMode={isDarkMode}
          $isSubmitting={isSubmitting}
          $hasError={!!errorMessage}
        >
          {isSubmitting ? (
            <div style={{ textAlign: 'center' }}>
              {showSuccessAnimation ? (
                <SuccessAnimation>
                  <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
                    <circle className="checkmark-circle-fill" cx="26" cy="26" r="25" />
                    <circle className="checkmark-circle" cx="26" cy="26" r="25" />
                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                  </svg>
                  <p>Inicio de sesión exitoso</p>
                </SuccessAnimation>
              ) : (
                <>
                  <Spinner />
                  {statusMessage && (
                    <p style={{ marginTop: '1rem', color: 'var(--text-color)' }}>{statusMessage}</p>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <Title>Ingreso al sistema</Title>
              
              {errorMessage && (
                <StatusMessage $type="error">{errorMessage}</StatusMessage>
              )}
              
              {statusMessage && !errorMessage && (
                <StatusMessage $type="success">{statusMessage}</StatusMessage>
              )}

              {/* FIXED: Add the missing username/email input field */}
              <StyledInput
                type="text"
                placeholder="Correo electrónico"
                {...register("username", emailValidation)}
                $isDarkMode={isDarkMode}
                disabled={isSubmitting}
                autoComplete="username"
              />
              {errors.username && (
                <ErrorMessage>{errors.username.message}</ErrorMessage>
              )}

              {/* FIXED: Corrected type attribute */}
              <StyledInput
                type="password"
                placeholder="Contraseña"
                {...register("password", { required: "Ingresa tu contraseña" })}
                $isDarkMode={isDarkMode}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              {errors.password && (
                <ErrorMessage>{errors.password.message}</ErrorMessage>
              )}

              {(hasOTPField || otpRequired) && (
                <>
                  <StyledInput
                    type="text"
                    placeholder="Código OTP"
                    {...register("otp", { 
                      required: otpRequired ? "El código OTP es obligatorio" : false,
                      minLength: {
                        value: 6,
                        message: "El código OTP debe tener al menos 6 caracteres"
                      },
                      maxLength: {
                        value: 8,
                        message: "El código OTP no puede tener más de 8 caracteres"
                      }
                    })}
                    $isDarkMode={isDarkMode}
                    disabled={isSubmitting}
                    autoComplete="one-time-code"
                  />
                  {errors.otp && (
                    <ErrorMessage>{errors.otp.message}</ErrorMessage>
                  )}
                </>
              )}

              {loginFails >= 5 && (
                <>
                  <div style={{ 
                    padding: '0.5rem 1rem', 
                    background: 'rgba(250, 82, 82, 0.1)', 
                    border: '1px solid var(--error-color)', 
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.9rem'
                  }}>
                    Demasiados intentos fallidos. Por favor completa el CAPTCHA a continuación.
                  </div>
                  <Captcha 
                    onCaptchaChange={handleCaptchaChange} 
                    resetFlag={captchaReset}
                    $isDarkMode={isDarkMode} 
                  />
                </>
              )}

              <StyledButton 
                type="submit" 
                $isDarkMode={isDarkMode}
                disabled={isSubmitting}
              >
                {!hasOTPField ? "Continuar" : "Iniciar Sesión"}
              </StyledButton>
              
              {/* Link for forgotten password or help */}
              <div style={{ 
                marginTop: '1rem', 
                textAlign: 'center',
                fontSize: '0.9rem' 
              }}>
                <a 
                  href="#" 
                  role="button"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Por favor contacta a soporte para restablecer tu contraseña");
                  }}
                  style={{ color: 'var(--primary-color)' }}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </>
          )}
        </LoginForm>
      </LoginFormSection>
      
      <CompanyInfoSection>
        <CompanyTitle>Agroup APP</CompanyTitle>
        <CompanyDescription>
          <TypingText $isTyping={isTyping}>
            {typingText}
          </TypingText>
        </CompanyDescription>
      </CompanyInfoSection>
    </LoginContainer>
  );
};

export default Login;