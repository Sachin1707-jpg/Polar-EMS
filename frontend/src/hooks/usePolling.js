/**
 * Custom hook for polling data at intervals
 */
import { useEffect, useRef, useCallback } from 'react';

export const usePolling = (callback, interval = 5000, enabled = true) => {
  const savedCallback = useRef(callback);
  const intervalId = useRef(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (intervalId.current) return;
    
    // Call immediately
    savedCallback.current();
    
    // Then poll at interval
    intervalId.current = setInterval(() => {
      savedCallback.current();
    }, interval);
  }, [interval]);

  const stop = useCallback(() => {
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }

    return () => stop();
  }, [enabled, start, stop]);

  return { start, stop };
};

export default usePolling;
