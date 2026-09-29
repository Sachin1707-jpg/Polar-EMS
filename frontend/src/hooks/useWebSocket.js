/**
 * Custom hook for WebSocket connections
 */
import { useEffect, useCallback, useRef } from 'react';
import wsService from '../services/websocket';

export const useWebSocket = (onMessage, options = {}) => {
  const { 
    autoConnect = true,
    reconnect = true,
    url = 'ws://localhost:8000/ws'
  } = options;

  const messageHandler = useRef(onMessage);

  useEffect(() => {
    messageHandler.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (autoConnect) {
      wsService.connect(url);

      const unsubscribe = wsService.on('message', (data) => {
        if (messageHandler.current) {
          messageHandler.current(data);
        }
      });

      return () => {
        unsubscribe();
        if (!reconnect) {
          wsService.disconnect();
        }
      };
    }
  }, [autoConnect, reconnect, url]);

  const send = useCallback((type, data) => {
    wsService.send(type, data);
  }, []);

  const isConnected = useCallback(() => {
    return wsService.isConnected();
  }, []);

  return { send, isConnected };
};

export default useWebSocket;
