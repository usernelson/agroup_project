import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

// This is a special wrapper component that ensures context is available to its children
// It's useful when components have trouble accessing context directly
const ContextWrapper = ({ children }) => {
  const auth = useContext(AuthContext);
  
  // If auth context isn't available, show a fallback
  if (!auth) {
    console.warn('ContextWrapper: AuthContext not available, using fallback');
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Inicializando aplicación...</h3>
        <p>Por favor espere unos momentos mientras la aplicación termina de cargar.</p>
      </div>
    );
  }
  
  // Provide context to children by cloning them with context props
  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { auth });
    }
    return child;
  });
};

export default ContextWrapper;
