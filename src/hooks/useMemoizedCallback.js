import { useCallback, useRef } from 'react';

/**
 * Custom hook that memoizes a callback while preserving the latest closure
 * Combines benefits of useCallback with always-current values
 * 
 * @param {Function} callback - The callback to memoize
 * @param {Array} dependencies - Dependencies to determine when to update the ref
 * @returns {Function} - The memoized callback
 */
const useMemoizedCallback = (callback, dependencies) => {
  // Store the latest callback in a ref
  const callbackRef = useRef(callback);
  
  // Update ref when callback changes
  callbackRef.current = callback;
  
  // Return a memoized version that calls latest callback
  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, dependencies);
};

export default useMemoizedCallback;
