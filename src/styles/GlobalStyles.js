import { createGlobalStyle } from 'styled-components';
import { useTheme } from '../context/ThemeContext';

// Note: Font imports should be in index.html, not here

const BaseStyles = createGlobalStyle`
  :root {
    /* Color variables */
    --primary-color: #9146FF;
    --primary-dark-color: #7B3EDB;
    --secondary-color: #F5F3FF;
    --accent-color: #40C057;
    --warning-color: #FFC107;
    --error-color: #FA5252;
    --success-color: #20C997;
    
    /* Theme variables - controlled by theme context */
    --background-color: ${props => props.isDarkMode ? '#121212' : '#F5F7FB'};
    --background-alt-color: ${props => props.isDarkMode ? '#1E1E1E' : '#ECEEF2'};
    --card-background: ${props => props.isDarkMode ? '#242424' : '#FFFFFF'};
    --text-color: ${props => props.isDarkMode ? '#E1E1E1' : '#2C2E3E'};
    --text-muted: ${props => props.isDarkMode ? '#A0A0A0' : '#6C757D'};
    --border-color: ${props => props.isDarkMode ? '#383838' : '#E9ECEF'};
    
    /* Shadows */
    --shadow-sm: ${props => props.isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.05)'};
    --shadow-md: ${props => props.isDarkMode ? '0 4px 6px rgba(0,0,0,0.4)' : '0 4px 6px rgba(0,0,0,0.08)'};
    --shadow-lg: ${props => props.isDarkMode ? '0 10px 15px rgba(0,0,0,0.5)' : '0 10px 15px rgba(0,0,0,0.1)'};
    --shadow-xl: ${props => props.isDarkMode ? '0 15px 25px rgba(0,0,0,0.6)' : '0 15px 25px rgba(0,0,0,0.12)'};
    
    /* Button shadow */
    --button-shadow: ${props => props.isDarkMode ? '0 4px 10px rgba(145,70,255,0.4)' : '0 4px 10px rgba(145,70,255,0.3)'};
    
    /* Gradient */
    --gradient: ${props => props.isDarkMode 
      ? 'linear-gradient(135deg, #9146FF, #7B3EDB)' 
      : 'linear-gradient(135deg, #9146FF, #7B3EDB)'};
    
    /* Border radius */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    
    /* Spacing */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;
    
    /* Z-index levels */
    --z-below: -1;
    --z-normal: 1;
    --z-sticky: 100;
    --z-dropdown: 200;
    --z-fixed: 300;
    --z-modal: 400;
    --z-popover: 500;
    --z-sidebar: 600;
    --z-tooltip: 700;
    --z-overlay: 800;
    --z-toast: 900;
    
    /* Mobile-friendly touch target */
    --mobile-touch-target: 48px;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
      Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 16px;
    line-height: 1.5;
    background-color: var(--background-color);
    color: var(--text-color);
    transition: background-color 0.3s ease, color 0.3s ease;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  h1, h2, h3, h4, h5, h6 {
    color: var(--text-color);
    line-height: 1.2;
    font-weight: 600;
  }

  a {
    color: var(--primary-color);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: var(--primary-dark-color);
    }
  }

  button, input, select, textarea {
    font-family: inherit;
    font-size: inherit;
    outline: none;
  }

  button {
    cursor: pointer;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.isDarkMode ? '#1E1E1E' : '#F5F5F5'};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.isDarkMode ? '#444444' : '#D1D1D1'};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.isDarkMode ? '#555555' : '#C1C1C1'};
  }
`;

const GlobalStyles = () => {
  const { isDarkMode } = useTheme();
  return <BaseStyles isDarkMode={isDarkMode} />;
};

export default GlobalStyles;