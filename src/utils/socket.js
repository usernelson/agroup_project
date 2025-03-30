import WebSocketClient from './WebSocketClient';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 3000; // 3 seconds

/**
 * Initialize WebSocket connection with error handling and reconnection logic
 * @param {string} url - WebSocket server URL
 * @param {Function} onMessage - Message handler
 * @param {Function} onOpen - Connection open handler
 * @param {Function} onClose - Connection close handler
 * @param {Function} onError - Error handler
 * @returns {WebSocket} The WebSocket instance
 */
export const initSocket = (url, onMessage, onOpen, onClose, onError) => {
  // Clean up any existing socket
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    socket.close();
  }
  
  try {
    // Create new socket connection
    socket = new WebSocketClient(url);
    
    // Set up event handlers
    socket.onopen = () => {
      console.log('WebSocket connection established');
      reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      if (onOpen) onOpen();
    };
    
    socket.onmessage = (event) => {
      if (onMessage) onMessage(event.data);
    };
    
    socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
      
      // Only attempt to reconnect if it wasn't a clean close and we haven't exceeded max attempts
      if (!event.wasClean && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        
        setTimeout(() => {
          initSocket(url, onMessage, onOpen, onClose, onError);
        }, RECONNECT_DELAY);
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Maximum reconnection attempts reached. Please refresh the page to try again.');
      }
      
      if (onClose) onClose(event);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };
    
    return socket;
  } catch (error) {
    console.error('Error initializing WebSocket:', error);
    if (onError) onError(error);
    return null;
  }
};

// Initialize the socket connection only when the app is in a visible tab
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && socket === null) {
    // Only try to connect when the server URL is defined and the tab is visible
    const wsUrl = process.env.REACT_APP_WS_URL || 'wss://ia.agroup.app:3000/ws';
    // Try to connect but don't keep retrying if it fails
    if (reconnectAttempts < 1) {
      initSocket(wsUrl, 
        (data) => console.log('WS message:', data),
        () => console.log('WS opened'),
        () => console.log('WS closed'),
        (err) => console.error('WS error:', err)
      );
    }
  }
});

export const sendMessage = (message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
    return true;
  }
  console.warn('WebSocket is not connected. Message not sent.');
  return false;
};

export const closeSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
    reconnectAttempts = 0;
  }
};

export default {
  initSocket,
  sendMessage,
  closeSocket
};
