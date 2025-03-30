import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { register } from '../../api/auth';
import { colors } from '../../styles/GlobalStyles';

// Animation keyframes
const shakeAnimation = keyframes`
  0%   { transform: translateX(0); }
  25%  { transform: translateX(-5px); }
  50%  { transform: translateX(5px); }
  75%  { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

// Styled components
const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  background: var(--gradient);
  padding: 1rem;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 420px;
`;

const Logo = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1.5rem;
  text-align: center;
  
  span {
    color: #FFF176;
  }
`;

const AnimatedForm = styled.form`
  font-family: 'Poppins', sans-serif;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  text-align: center;
  transition: transform 0.5s ease, opacity 0.5s ease, box-shadow 0.5s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  }
`;

const Title = styled.h1`
  font-family: 'Poppins', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1.5rem;
`;

const StyledInput = styled.input`
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  transition: box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease;

  &::placeholder {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    opacity: 0.6;
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--hover-shadow);
    transform: scale(1.02);
  }
`;

const StyledButton = styled.button`
  font-family: 'Poppins', sans-serif;
  padding: 0.75rem 1.5rem;
  margin-top: 0.5rem;
  width: 100%;
  background: var(--gradient);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 5px 15px var(--button-shadow);
    transform: translateY(-2px);
  }
  
  &:active {
    animation: ${shakeAnimation} 0.4s ease;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const FormLink = styled(Link)`
  color: var(--primary-color);
  font-family: 'Poppins', sans-serif;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
  
  &:hover {
    color: var(--accent-color);
    text-decoration: underline;
  }
`;

const FormText = styled.p`
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  margin-top: 1.5rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  font-family: 'Poppins', sans-serif;
  color: red;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: left;
  width: 100%;
  padding: 0.5rem;
  background-color: rgba(255, 0, 0, 0.05);
  border-radius: 8px;
  animation: ${shakeAnimation} 0.4s ease;
`;

const Divider = styled.div`
  margin: 1.5rem 0;
  display: flex;
  align-items: center;
  width: 100%;
  
  &::before, &::after {
    content: '';
    flex-grow: 1;
    height: 1px;
    background-color: #e0e0e0;
  }
  
  span {
    padding: 0 1rem;
    color: #666;
    font-size: 0.9rem;
  }
`;

// Registration form component
const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    // Clear any previous errors
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Call register API
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      
      // Success - redirect to login
      navigate('/login', { 
        state: { 
          message: 'Registro exitoso. Por favor, inicia sesión.' 
        } 
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Error al registrar. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <PageContainer>
      <FormContainer>
        <Logo>a<span>Teacher</span></Logo>
        
        <AnimatedForm onSubmit={handleSubmit}>
          <Title>Crear Cuenta</Title>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <StyledInput
            type="text"
            name="firstName"
            placeholder="Nombre"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          
          <StyledInput
            type="text"
            name="lastName"
            placeholder="Apellido"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
          
          <StyledInput
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleChange}
            required
          />
          
          <StyledInput
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            required
          />
          
          <StyledInput
            type="password"
            name="confirmPassword"
            placeholder="Confirmar contraseña"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          
          <StyledButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : 'Registrarse'}
          </StyledButton>
          
          <FormText>
            ¿Ya tienes una cuenta? <FormLink to="/login">Iniciar sesión</FormLink>
          </FormText>
        </AnimatedForm>
      </FormContainer>
    </PageContainer>
  );
};

export default Register;
