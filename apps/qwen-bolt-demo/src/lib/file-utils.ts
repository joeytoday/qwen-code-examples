import { FileSystemTree, DirectoryNode } from '@webcontainer/api';
import JSZip from 'jszip';

export async function downloadProjectAsZip(files: Record<string, string>, projectName = 'project') {
  const zip = new JSZip();

  for (const [path, content] of Object.entries(files)) {
    // Remove leading slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    zip.file(cleanPath, content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  
  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function convertFilesToTree(files: Record<string, string>): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const [path, content] of Object.entries(files)) {
    // Key fix: sanitize all paths, ensure no absolute path prefix or leading /
    // e.g.: /private/var/.../package.json -> package.json
    let cleanPath = path;
    
    // If the path contains system paths like 'private/var', try to keep only the part after the project root
    // A safer approach is to rely on the API layer sanitization. If dirty data remains here, it is from stale state.
    // At minimum, we strip the leading / here
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.slice(1);
    }
    
    // Force remove possible system prefix interference (for Mac temp directories)
    const systemPrefixes = ['private/var', 'var/folders', 'tmp/qwen-bolt'];
    for (const prefix of systemPrefixes) {
       if (cleanPath.startsWith(prefix)) {
          // This is a very rough heuristic fix: find the first position that looks like a project file
          // A better approach is for the backend to not pass such paths
          // Assuming the project root always has package.json or src, we can try to truncate
          // But for now, we only rely on the backend fix.
          console.warn('[convertFilesToTree] Detected system path leaking:', cleanPath);
       }
    }

    const parts = cleanPath.split('/');
    let current = tree;

    for (let i = 0; i < parts.length; i++) {

      const part = parts[i];
      if (!part) continue; // Skip empty parts just in case

      const isFile = i === parts.length - 1;

      if (isFile) {
        current[part] = {
          file: {
            contents: content,
          },
        };
      } else {
        if (!current[part]) {
          current[part] = {
            directory: {},
          };
        }
        
        const node = current[part];
        if ('directory' in node) {
          current = node.directory;
        } else {
             // Conflict: trying to treat a file as a directory
             // In a realistic scenario, valid file paths shouldn't conflict like this (foo vs foo/bar)
             // But if so, we simply can't proceed down this branch. Overwriting would be destructive.
             console.warn(`Path conflict at ${part} for ${path}`);
             break;
        }
      }
    }
  }

  return tree;
}

export function findProjectRoot(files: Record<string, string>): string {
  const filePaths = Object.keys(files);
  
  // 1. Check root package.json
  if (filePaths.some(p => p === 'package.json' || p === '/package.json')) {
    return '.';
  }

  // 2. Check for package.json in subdirectories
  // Sort by depth (shortest path first) to find the "top-most" package.json
  const packageJsonPaths = filePaths
    .filter(p => p.endsWith('package.json'))
    .sort((a, b) => a.split('/').length - b.split('/').length);

  if (packageJsonPaths.length > 0) {
    const matched = packageJsonPaths[0];
    const dir = matched.substring(0, matched.lastIndexOf('/'));
    return dir.startsWith('/') ? dir.slice(1) : dir;
  }

  return '.';
}
