import { useState, useCallback } from 'react';
import type { DevServer } from '@/components/workspace';

export function useDevServer(sessionId: string) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [devServer, setDevServer] = useState<DevServer | null>(null);
  const [isStartingServer, setIsStartingServer] = useState(false);
  const [serverError, setServerError] = useState<string>('');
  const [devServerLogs, setDevServerLogs] = useState<string[]>([]);

  // Stop dev server on unmount or session change
  // Note: This logic was in useEffect in page.tsx. We can expose a cleanup function or handle it here if we pass a cleanup ref.
  // For simplicity, we'll keep the useEffect in the component or basic state management here.
  
  const startDevServer = useCallback(async () => {
    if (!sessionId || isStartingServer) return;

    setIsStartingServer(true);
    setServerError('');
    setDevServerLogs([]);

    try {
      console.log('[DevServer Hook] Starting dev server for session:', sessionId);
      setDevServerLogs(prev => [...prev, `[DevServer API] Starting dev server for session: ${sessionId}`]);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch('/api/dev-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      console.log('[DevServer Hook] Response:', data);

      if (data.logs && Array.isArray(data.logs)) {
        setDevServerLogs(prev => [...prev, ...data.logs]);
      }

      if (data.success) {
        if (data.type === 'static') {
          setPreviewUrl(`/api/preview?sessionId=${sessionId}&t=${Date.now()}`);
          setDevServerLogs(prev => [...prev, '[DevServer] Static project detected, using preview API']);
        } else {
          setDevServer({
            port: data.port,
            framework: data.framework,
            url: data.url,
          });
          setPreviewUrl(`${data.url}?t=${Date.now()}`);
          setDevServerLogs(prev => [...prev, `[DevServer] Server started successfully on port ${data.port}`]);
        }
        setServerError('');
      } else {
        const errorMsg = data.error || 'Failed to start dev server';
        setServerError(errorMsg);
        setDevServerLogs(prev => [...prev, `[DevServer Error] ${errorMsg}`]);
      }
    } catch (error: unknown) {
      console.error('[DevServer Hook] Error:', error);
      let errorMsg = '';
      if (error instanceof Error && error.name === 'AbortError') {
        errorMsg = 'Server start timeout (2 minutes). The project may be too large or have dependency issues.';
      } else {
        errorMsg = error instanceof Error ? error.message : 'Failed to start dev server';
      }
      setServerError(errorMsg);
      setDevServerLogs(prev => [...prev, `[DevServer Error] ${errorMsg}`]);
    } finally {
      setIsStartingServer(false);
    }
  }, [sessionId, isStartingServer]);

  const refreshPreview = useCallback(() => {
    if (previewUrl) {
      setPreviewUrl(`${previewUrl.split('?t=')[0]}?t=${Date.now()}`);
    }
  }, [previewUrl]);

  return {
    previewUrl,
    setPreviewUrl,
    devServer,
    setDevServer,
    isStartingServer,
    serverError,
    devServerLogs,
    startDevServer,
    refreshPreview,
    setDevServerLogs
  };
}
