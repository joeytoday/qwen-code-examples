import { useState, useEffect, useRef } from 'react';
import { WebContainer } from '@webcontainer/api';
import { getWebContainer } from '@/lib/webcontainer';
import logger from '@/lib/logger';

export function useWebContainer() {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    async function boot() {
      try {
        setIsLoading(true);
        const instance = await getWebContainer();
        if (mountedRef.current) {
          setWebcontainer(instance);
        }
      } catch (err) {
        // Use logger.warn instead of logger.error to avoid triggering Next.js Error Overlay in dev mode.
        // The error is already displayed in the terminal UI via the webContainerError state.
        logger.warn('[WebContainer] Boot failed:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    boot();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { webcontainer, isLoading, error };
}
