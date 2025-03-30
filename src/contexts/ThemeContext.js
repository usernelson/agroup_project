import React, { createContext, useState, useEffect, useContext } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { colors, shadows } from '../styles/GlobalStyles';

// Define theme constants using our centralized colors
const lightTheme = {
  mode: 'light',
  ...colors.light,
  ...shadows.light
};

const darkTheme = {
  mode: 'dark',
  ...colors.dark,
  ...shadows.dark
};

// Create Theme Context
const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
});

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Unificar el nombre de la clave en localStorage
    const savedTheme = localStorage.getItem('theme') || localStorage.getItem('darkMode');
    
    if (savedTheme) {
      return savedTheme === 'dark' || savedTheme === 'true';
    }
    
    // Check for system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      // Establecer el tema en ambos formatos para compatibilidad
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };
  
  // Apply theme class to body and set data-theme attribute
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    
    // Update theme meta tag for mobile
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        isDarkMode ? darkTheme.background : lightTheme.background
      );
    }
  }, [isDarkMode]);
  
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <StyledThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook for accessing theme context
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
