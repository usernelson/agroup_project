import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { useTheme } from '../../context/ThemeContext';
import { emailValidation } from '../../utils/validation';
import { requestPasswordReset } from '../../api/authService';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${props => props.$isDarkMode ? 
    'linear-gradient(135deg, #1a1625, #121016)' : 
    'linear-gradient(135deg, #f8f9ff, #f0f0ff)'};
  padding: 2rem;
`;

const FormCard = styled.div`
  width: 100%;
  max-width: 450px;
  background-color: var(--card-background);
  border-radius: 20px;
  box-shadow: 0 10px 40px ${props => props.$isDarkMode ? 
    'rgba(0, 0, 0, 0.3)' : 
    'rgba(145, 70, 255, 0.15)'};
  padding: 2.5rem;
  
  @media (max-width: 480px) {
    padding: 1.5rem;
  }
`;

const Title = styled.h1`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: var(--text-color);
  text-align: center;
`;

const Description = styled.p`
  margin-bottom: 2rem;
  color: var(--text-muted);
  text-align: center;
`;

const FormField = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--background-alt-color);
  color: var(--text-color);
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(145, 70, 255, 0.2);
  }
`;

const ErrorMessage = styled.p`
  color: var(--error-color);
  font-size: 0.85rem;
  margin-top: 0.5rem;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: var(--gradient);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px rgba(145, 70, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const BackLink = styled(Link)`
  display: block;
  text-align: center;
  margin-top: 1.5rem;
  color: var(--primary-color);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const StatusMessage = styled.div`
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 8px;
  
  ${props => props.$isSuccess && `
    background-color: rgba(46, 213, 115, 0.1);
    border: 1px solid var(--success-color);
    color: var(--success-color);
  `}
  
  ${props => !props.$isSuccess && `
    background-color: rgba(255, 71, 87, 0.1);
    border: 1px solid var(--error-color);
    color: var(--error-color);
  `}
`;

const ForgotPassword = () => {
  const { isDarkMode } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      // In development, just show a success message
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        setIsSuccess(true);
        setMessage("Si tu correo existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.");
      } else {
        const response = await requestPasswordReset(data.email);
        setIsSuccess(true);
        setMessage(response.message || "Si tu correo existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.");
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage(error.message || "No se pudo procesar tu solicitud. Por favor intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <PageContainer $isDarkMode={isDarkMode}>
      <FormCard $isDarkMode={isDarkMode}>
        <Title>Recuperar Contraseña</Title>
        <Description>
          Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
        </Description>
        
        {message && (
          <StatusMessage $isSuccess={isSuccess}>
            {message}
          </StatusMessage>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField>
            <Label>Correo Electrónico</Label>
            <Input 
              type="email" 
              placeholder="ejemplo@correo.com"
              {...register("email", emailValidation)}
              disabled={isSubmitting}
            />
            {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
          </FormField>
          
          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Procesando..." : "Enviar Instrucciones"}
          </SubmitButton>
        </form>
        
        <BackLink to="/login">Volver al inicio de sesión</BackLink>
      </FormCard>
    </PageContainer>
  );
};

export default ForgotPassword;
