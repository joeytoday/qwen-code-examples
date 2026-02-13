import { useState, useCallback, useRef, useEffect } from 'react';
import type { DevServer } from '@/components/workspace';
import { useWebContainer } from './useWebContainer';
import { convertFilesToTree, findProjectRoot } from '@/lib/file-utils';

// .npmrc content for faster npm install using China mirror
const NPMRC_CONTENT = `registry=https://registry.npmmirror.com
fetch-retries=3
fetch-retry-mintimeout=5000
fetch-retry-maxtimeout=30000
`;

export function useDevServer(sessionId: string, files: Record<string, string>) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [devServer, setDevServer] = useState<DevServer | null>(null);
  const [isStartingServer, setIsStartingServer] = useState(false);
  const [serverError, setServerError] = useState<string>('');
  const [devServerLogs, setDevServerLogs] = useState<string[]>([]);
  
  const { webcontainer, isLoading: isWebContainerLoading, error: webContainerError } = useWebContainer();
  const isFileSystemMountedRef = useRef(false);
  const npmrcWrittenRef = useRef(false);

  // Mount/sync files to WebContainer FS when files change
  useEffect(() => {
    async function mountFiles() {
      if (!webcontainer || Object.keys(files).length === 0) return;

      if (!isFileSystemMountedRef.current) {
        try {
          console.log('[DevServer] Mounting files to WebContainer FS:', Object.keys(files).length);
          const tree = convertFilesToTree(files);
          await webcontainer.mount(tree);
          isFileSystemMountedRef.current = true;
          setDevServerLogs(prev => [...prev, '[System] File system mounted.']);
        } catch (error) {
          console.error('[DevServer] Failed to mount files:', error);
        }
      }
    }

    mountFiles();
  }, [webcontainer, files]);

  // Reset mount flag when WebContainer changes
  useEffect(() => {
    if (!webcontainer) {
      isFileSystemMountedRef.current = false;
      npmrcWrittenRef.current = false;
    }
  }, [webcontainer]);

  // Write .npmrc and .env to WebContainer for faster npm install and proper host binding
  useEffect(() => {
    async function writeConfigFiles() {
      if (!webcontainer || npmrcWrittenRef.current) return;
      
      try {
        // Write .npmrc for faster installs
        await webcontainer.fs.writeFile('.npmrc', NPMRC_CONTENT);
        
        // Write .env with HOST=0.0.0.0 so frameworks (Vite, Next.js, etc.) bind correctly
        // This ensures preview works regardless of how the user starts the dev server
        await webcontainer.fs.writeFile('.env', 'HOST=0.0.0.0\n');
        
        npmrcWrittenRef.current = true;
        console.log('[DevServer] .npmrc and .env written to WebContainer');
        setDevServerLogs(prev => [...prev, '[System] npm mirror and host binding configured.']);
      } catch (error) {
        console.warn('[DevServer] Failed to write config files:', error);
      }
    }
    
    writeConfigFiles();
  }, [webcontainer]);

  // Listen for server-ready events from WebContainer
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

      // Find package.json to determine dev script
      const packageJsonPath = Object.keys(files).find(f => {
        const cleanPath = f.startsWith('/') ? f.substring(1) : f;
        return cleanPath === (projectRoot === '.' ? 'package.json' : `${projectRoot}/package.json`);
      });

      if (packageJsonPath) {
          const content = files[packageJsonPath];
          let devScript = 'npm run dev';
          try {
              const pkg = JSON.parse(content);
              if (!pkg.scripts?.dev && pkg.scripts?.start) {
                  devScript = 'npm start';
              }
          } catch (parseError) {
              console.warn('[DevServer] Failed to parse package.json:', parseError);
          }

          // Dispatch install + dev command to the terminal shell
          // HOST=0.0.0.0 is already configured via .env file written at boot time,
          // so the user can also manually run these commands and preview will still work
          setTimeout(() => {
            const command = `${cdCommand}npm install && ${devScript}`;
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
    if (webcontainer) {
        webcontainer.spawn('killall', ['node']);
        setDevServerLogs(prev => [...prev, '[System] Server process terminated.']);
        setPreviewUrl('');
        setDevServer(null);
        setIsStartingServer(false);
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
