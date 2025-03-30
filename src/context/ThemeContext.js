import React, { createContext, useState, useContext, useEffect } from 'react';

// Define theme constants
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

// Create context with default values
const ThemeContext = createContext({
  theme: THEME_LIGHT, 
  isDarkMode: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or default to light mode
  const [theme, setTheme] = useState(() => {
    try {
      // Try to get saved theme from localStorage
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === THEME_DARK ? THEME_DARK : THEME_LIGHT;
    } catch (error) {
      console.warn('Error reading theme from localStorage:', error);
      return THEME_LIGHT;
    }
  });
  
  const isDarkMode = theme === THEME_DARK;
  
  // Save theme to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('theme', theme);
      
      // Also update the data-theme attribute on the document
      document.documentElement.setAttribute('data-theme', theme);
      
      // Add/remove dark class from body for global CSS selectors
      if (isDarkMode) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    } catch (error) {
      console.warn('Error saving theme to localStorage:', error);
    }
  }, [theme, isDarkMode]);
  
  // Check if user prefers dark mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Only use system preference if no theme is stored
    if (!localStorage.getItem('theme')) {
      setTheme(mediaQuery.matches ? THEME_DARK : THEME_LIGHT);
    }
    
    // Update theme if system preference changes
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? THEME_DARK : THEME_LIGHT);
      }
    };
    
    // Add event listener for system preference change
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);
  
  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
