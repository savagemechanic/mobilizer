import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UsePollingOptions {
  /**
   * Polling interval in milliseconds
   */
  interval: number;
  /**
   * Whether polling is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether to execute callback immediately on mount
   * @default false
   */
  executeOnMount?: boolean;
  /**
   * Whether to execute callback when app becomes active
   * @default true
   */
  executeOnActive?: boolean;
}

/**
 * Custom hook for polling data at regular intervals
 * Automatically pauses when app is in background and resumes when active
 *
 * @param callback - Function to execute on each poll
 * @param options - Polling configuration options
 *
 * @example
 * ```tsx
 * usePolling(
 *   () => refetch(),
 *   { interval: 30000, enabled: true }
 * );
 * ```
 */
export function usePolling(
  callback: () => void | Promise<void>,
  options: UsePollingOptions
) {
  const {
    interval,
    enabled = true,
    executeOnMount = false,
    executeOnActive = true,
  } = options;

  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Execute callback wrapper
  const executeCallback = useCallback(() => {
    const result = callbackRef.current();
    if (result instanceof Promise) {
      result.catch((error) => {
        console.error('Error in polling callback:', error);
      });
    }
  }, []);

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      executeCallback();
    }, interval);
  }, [interval, executeCallback]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle app state changes
  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App became active - execute callback if configured and restart polling
        if (executeOnActive) {
          executeCallback();
        }
        startPolling();
      } else {
        // App went to background - stop polling
        stopPolling();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, executeOnActive, executeCallback, startPolling, stopPolling]);

  // Main polling effect
  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    // Execute immediately on mount if configured
    if (executeOnMount) {
      executeCallback();
    }

    // Start polling
    startPolling();

    // Cleanup
    return () => {
      stopPolling();
    };
  }, [enabled, executeOnMount, executeCallback, startPolling, stopPolling]);
}
