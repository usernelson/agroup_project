import React, { useState, useEffect } from "react";
import styled from "styled-components";

const CaptchaWrapper = styled.div`
  background: #f0f4f8;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const CaptchaTitle = styled.p`
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: bold;
`;

const CaptchaQuestion = styled.p`
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  color: #040432;
`;

const CaptchaInput = styled.input`
  width: 80%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  &:focus {
    border-color: #3498db;
    outline: none;
  }
`;

const RefreshButton = styled.button`
  margin-top: 0.5rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s ease;
  &:hover {
    background: #2980b9;
  }
`;

const Captcha = ({ onCaptchaChange, resetFlag }) => {
  const [question, setQuestion] = useState("");

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setQuestion(`¿Cuánto es ${num1} + ${num2}?`);
    const correctAnswer = num1 + num2;
    onCaptchaChange(correctAnswer, true);
  };

  useEffect(() => {
    generateCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetFlag]);

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value, 10);
    onCaptchaChange(value, false);
  };

  return (
    <CaptchaWrapper>
      <CaptchaTitle>Verifica que eres humano</CaptchaTitle>
      <CaptchaQuestion>{question}</CaptchaQuestion>
      <CaptchaInput type="number" placeholder="Respuesta" onChange={handleInputChange} />
      <RefreshButton type="button" onClick={generateCaptcha}>
        Refrescar
      </RefreshButton>
    </CaptchaWrapper>
  );
};

export default Captcha;