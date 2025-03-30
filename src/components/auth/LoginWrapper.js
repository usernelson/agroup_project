import React from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Login from '../../pages/auth/Login';

const LoginWrapper = (props) => {
  const auth = React.useContext(AuthContext);
  
  // If there's no auth context, show a loading message
  if (!auth) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Cargando autenticación...</h2>
        <p>Por favor espere mientras se inicializa la aplicación.</p>
      </div>
    );
  }
  
  // Pass the auth values as props to the Login component
  return (
    <Login 
      isAuthenticated={auth.isAuthenticated}
      login={auth.login}
      loading={auth.loading}
      {...props}
    />
  );
};

export default LoginWrapper;
