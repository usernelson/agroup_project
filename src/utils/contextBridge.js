// Este archivo sirve como puente entre las importaciones antiguas y las nuevas
// Evita importaciones circulares y proporciona compatibilidad hacia atrás

// Importar desde ambas ubicaciones para asegurar compatibilidad
let AuthContext, useAuth, AuthProvider;
let ThemeContext, useTheme, ThemeProvider;

try {
  // Intentar importar desde contexts (plural)
  const authModule = require('../contexts/AuthContext');
  AuthContext = authModule.AuthContext;
  useAuth = authModule.useAuth;
  AuthProvider = authModule.AuthProvider;
} catch (e) {
  // Fallback a context (singular)
  const authModule = require('../context/AuthContext');
  AuthContext = authModule.AuthContext;
  useAuth = authModule.useAuth;
  AuthProvider = authModule.AuthProvider;
}

try {
  // Intentar importar desde contexts (plural)
  const themeModule = require('../contexts/ThemeContext');
  ThemeContext = themeModule.ThemeContext;
  useTheme = themeModule.useTheme;
  ThemeProvider = themeModule.ThemeProvider;
} catch (e) {
  // Fallback a context (singular)
  const themeModule = require('../context/ThemeContext');
  ThemeContext = themeModule.ThemeContext; 
  useTheme = themeModule.useTheme;
  ThemeProvider = themeModule.ThemeProvider;
}

// Re-exportar todo para que los componentes puedan importar desde cualquier ubicación
export {
  AuthContext, 
  useAuth, 
  AuthProvider,
  ThemeContext,
  useTheme,
  ThemeProvider
};
