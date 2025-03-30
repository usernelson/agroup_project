/**
 * WebSocket Client with failure handling
 * This service manages WebSocket connections with proper error handling
 */

let socket = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 3000; // 3 seconds

/**
 * Connect to WebSocket with proper error handling
 * @param {Function} onMessage - Callback for message events
 * @param {Function} onError - Callback for error events
 * @returns {WebSocket|null} - The WebSocket instance or null if disabled
 */
export const connectWebSocket = (onMessage, onError) => {
  // CRITICAL FIX: Check if WebSockets are enabled in configuration
  if (process.env.REACT_APP_ENABLE_WEBSOCKETS !== 'true') {
    console.log('[WebSocket] WebSockets are disabled in configuration');
    return null;
  }
  
  if (isConnecting) {
    console.log('[WebSocket] Connection already in progress');
    return socket;
  }
  
  if (socket?.readyState === WebSocket.OPEN) {
    console.log('[WebSocket] Already connected');
    return socket;
  }
  
  isConnecting = true;
  
  try {
    const wsUrl = process.env.REACT_APP_WS_URL || 'wss://ia.agroup.app:3000/ws';
    console.log(`[WebSocket] Connecting to ${wsUrl}`);
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('[WebSocket] Connection established');
      isConnecting = false;
      reconnectAttempts = 0;
    };
    
    socket.onmessage = (event) => {
      if (onMessage && typeof onMessage === 'function') {
        onMessage(event);
      }
    };
    
    socket.onerror = (error) => {
      console.warn('[WebSocket] Connection error:', error);
      isConnecting = false;
      
      if (onError && typeof onError === 'function') {
        onError(error);
      }
    };
    
    socket.onclose = (event) => {
      console.log(`[WebSocket] Connection closed: ${event.code} - ${event.reason}`);
      isConnecting = false;
      socket = null;
      
      // Attempt to reconnect if not closed cleanly and under max attempts
      if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`[WebSocket] Reconnecting (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        
        setTimeout(() => {
          connectWebSocket(onMessage, onError);
        }, RECONNECT_DELAY);
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn('[WebSocket] Max reconnect attempts reached, giving up');
      }
    };
    
    return socket;
  } catch (error) {
    console.error('[WebSocket] Failed to create connection:', error);
    isConnecting = false;
    return null;
  }
};

/**
 * Send a message through the WebSocket connection
 * @param {Object} data - Data to send 
 * @returns {boolean} - Whether the send was successful
 */
export const sendMessage = (data) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn('[WebSocket] Cannot send message: socket not connected');
    return false;
  }
  
  try {
    socket.send(JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('[WebSocket] Error sending message:', error);
    return false;
  }
};

/**
 * Disconnect the WebSocket
 */
export const disconnectWebSocket = () => {
  if (socket) {
    console.log('[WebSocket] Closing connection');
    socket.close(1000, 'User logout or page unload');
    socket = null;
  }
};

/**
 * Get the current connection status
 * @returns {string} - "connected", "connecting", "disconnected", or "error"
 */
export const getConnectionStatus = () => {
  if (!socket) return 'disconnected';
  
  switch (socket.readyState) {
    case WebSocket.CONNECTING:
      return 'connecting';
    case WebSocket.OPEN:
      return 'connected';
    case WebSocket.CLOSING:
    case WebSocket.CLOSED:
      return 'disconnected';
    default:
      return 'error';
  }
};

export default {
  connect: connectWebSocket,
  disconnect: disconnectWebSocket,
  send: sendMessage,
  getStatus: getConnectionStatus
};
