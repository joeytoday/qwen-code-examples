import { useState, useCallback, useRef, useEffect } from 'react';
import type { DevServer } from '@/components/workspace';
import { useWebContainer } from './useWebContainer';
import { convertFilesToTree, findProjectRoot } from '@/lib/file-utils';

export function useDevServer(sessionId: string, files: Record<string, string>) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [devServer, setDevServer] = useState<DevServer | null>(null);
  const [isStartingServer, setIsStartingServer] = useState(false);
  const [serverError, setServerError] = useState<string>('');
  const [devServerLogs, setDevServerLogs] = useState<string[]>([]);
  
  const { webcontainer, isLoading: isWebContainerLoading, error: webContainerError } = useWebContainer();
  const isFileSystemMountedRef = useRef(false);

  // 1. Mount/Sync Files
  useEffect(() => {
    async function initFileSystem() {
      if (!webcontainer || Object.keys(files).length === 0) {
          return;
      }
      
      // Full mount only once
      if (!isFileSystemMountedRef.current) {
        try {
          console.log('[DevServer] Initial mount.', Object.keys(files).length);
          const tree = convertFilesToTree(files);
          await webcontainer.mount(tree);
          isFileSystemMountedRef.current = true;
          setDevServerLogs(prev => [...prev, '[System] File system mounted.']);
        } catch (error) {
          console.error('[WebContainer] Failed to mount files:', error);
        }
      }
    }
    
    initFileSystem();
  }, [webcontainer, files]);

  useEffect(() => {
    if (!webcontainer) {
        isFileSystemMountedRef.current = false;
    }
  }, [webcontainer]);

  // 2. Server Ready Listener
  useEffect(() => {
    if (!webcontainer) return;

    const handleServerReady = (port: number, url: string) => {
      console.log('[DevServer] Server Ready:', url);
      setPreviewUrl(url);
      setDevServer({
        port,
        framework: 'WebContainer',
        url
      });
      setIsStartingServer(false);
      setDevServerLogs(prev => [...prev, `[System] Server ready at ${url}`]);
    };

    webcontainer.on('server-ready', handleServerReady);
  }, [webcontainer]);

  const startDevServer = useCallback(async () => {
    if (!webcontainer || isStartingServer) return;

    setIsStartingServer(true);
    setServerError('');
    setDevServerLogs(prev => [...prev, '[System] Initiating development environment...']);

    try {
      const projectRoot = findProjectRoot(files);
      const rootPath = projectRoot === '.' ? '' : projectRoot;
      const cdCommand = rootPath ? `cd ${rootPath} && ` : '';

      // Find package.json to determine script
      const packageJsonPath = Object.keys(files).find(f => 
        f === (projectRoot === '.' ? 'package.json' : `${projectRoot}/package.json`) || 
        f.endsWith(`/${projectRoot}/package.json`)
      );

      if (packageJsonPath) {
          const content = files[packageJsonPath];
          let devScript = 'npm run dev';
          try {
              const pkg = JSON.parse(content);
              if (!pkg.scripts?.dev && pkg.scripts?.start) {
                  devScript = 'npm start';
              }
          } catch (e) {}

          // Write .env.local to force host binding for frameworks that respect it
          // OR modify the command to set HOST=0.0.0.0
          // Many tools (Vite, Next.js) respect HOST env var.
          
          // Send command to terminal
          // We force host binding to 0.0.0.0 via environment variable
          setTimeout(() => {
            // Check if we need to install dependencies first time
            // For now we always do 'npm install' which is safe but maybe slow if already installed.
            // But since this is 'auto-start' on new generation, install makes sense.
            const command = `export HOST=0.0.0.0 && ${cdCommand}npm install && ${devScript} -- --host 0.0.0.0`;
            console.log('[DevServer] Dispatching command:', command);
            window.dispatchEvent(new CustomEvent('bolt:run-command', { 
                detail: { command } 
            }));
          }, 500);

      } else {
          setServerError('No package.json found');
          setDevServerLogs(prev => [...prev, '[Error] No package.json found.']);
          setIsStartingServer(false);
      }

    } catch (error: any) {
      console.error('[DevServer] Error:', error);
      setServerError(error.message);
      setIsStartingServer(false);
    }
  }, [webcontainer, isStartingServer, files]);

  const stopDevServer = useCallback(() => {
    // In jsh, we can't easily kill the foreground process from here without knowing its PID.
    // However, we can kill all node processes.
    if (webcontainer) {
        webcontainer.spawn('killall', ['node']);
        setDevServerLogs(prev => [...prev, '[System] Server process terminated.']);
        setPreviewUrl('');
        setDevServer(null);
        setIsStartingServer(false);
        // Dispatch Ctrl+C typically requires writing \x03 to stdin, but we don't have the stream here.
        // killing node is sufficient for the server effect.
    }
  }, [webcontainer]);

  const restartDevServer = useCallback(() => {
     stopDevServer();
     setTimeout(() => startDevServer(), 1000);
  }, [stopDevServer, startDevServer]);

  const refreshPreview = useCallback(() => {
     if (previewUrl) {
       const current = previewUrl;
       setPreviewUrl('');
       setTimeout(() => setPreviewUrl(current), 50);
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
    stopDevServer,
    restartDevServer,
    refreshPreview,
    isWebContainerLoading,
    webContainerError
  };
}
