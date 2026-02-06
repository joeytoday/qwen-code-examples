import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) {
    return webcontainerInstance;
  }

  if (bootPromise) {
    return bootPromise;
  }

  // Add COOP/COEP check
  if (typeof window !== 'undefined' && window.crossOriginIsolated === false) {
    console.warn('[WebContainer] App is not cross-origin isolated. WebContainer will not boot.');
    // Ideally throw error, but let's try to boot anyway so error is caught in logs
  }

  console.log('[WebContainer] Booting...');
  bootPromise = WebContainer.boot();
  
  try {
    webcontainerInstance = await bootPromise;
    console.log('[WebContainer] Booted successfully.');
    return webcontainerInstance;
  } catch (error) {
    console.error('[WebContainer] Boot failed:', error);
    bootPromise = null;
    throw error;
  }
}

export function isWebContainerBooted() {
  return !!webcontainerInstance;
}
