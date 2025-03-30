import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { useAuthSafe } from './utils/contextHelpers';
import GlobalStyles from './styles/GlobalStyles';
import webSocketClient from './utils/WebSocketClient';

/**
 * Main App Component
 * Provides the primary structure and context for the entire application
 */
const App = () => {
  const auth = useAuthSafe();
  
  // Set up WebSocket connection when authenticated
  useEffect(() => {
    let wsConnection = null;
    
    if (auth?.isAuthenticated) {
      console.log('[App] User authenticated, initializing WebSocket');
      
      const handleMessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[WebSocket] Received message:', message);
          
          // Handle different message types here
          if (message.type === 'notification') {
            // Handle notification
          } else if (message.type === 'update') {
            // Handle update
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };
      
      const handleError = (error) => {
        console.warn('[WebSocket] Connection error:', error);
        // Only log the error, don't try to reconnect here as the client handles that
      };
      
      // CRITICAL FIX: Only connect if WebSocket is enabled in configuration
      // Check websocket availability without crashing
      if (process.env.REACT_APP_ENABLE_WEBSOCKETS === 'true') {
        wsConnection = webSocketClient.connect(handleMessage, handleError);
      } else {
        console.log('[App] WebSockets are disabled by configuration');
      }
    }
    
    // Clean up connection on unmount or when auth state changes
    return () => {
      if (wsConnection) {
        console.log('[App] Cleaning up WebSocket connection');
        webSocketClient.disconnect();
      }
    };
  }, [auth?.isAuthenticated]);
  
  return (
    <>
      <GlobalStyles />
      <Router>
        <AppRoutes />
      </Router>
    </>
  );
};

export default App;