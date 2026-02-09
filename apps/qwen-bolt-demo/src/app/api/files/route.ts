import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile, stat, realpath } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export const runtime = 'nodejs';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileNode[];
}

// Recursively build file tree
async function buildFileTree(dirPath: string, relativePath: string = ''): Promise<FileNode[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      // Ignore hidden files and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      const fullPath = join(dirPath, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const children = await buildFileTree(fullPath, relPath);
        nodes.push({
          name: entry.name,
          path: relPath,
          type: 'directory',
          children,
        });
      } else {
        nodes.push({
          name: entry.name,
          path: relPath,
          type: 'file',
        });
      }
    }

    // Sort: directories first, files second
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error building file tree:', error);
    return [];
  }
}

// GET /api/files?sessionId=xxx - Get file tree
// GET /api/files?sessionId=xxx&path=xxx - Get file content
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const filePath = searchParams.get('path');
    const t = searchParams.get('t'); // Timestamp for cache busting

    console.log('[API /api/files] Request:', { sessionId, filePath, t });

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    let workspaceDir = join(tmpdir(), 'qwen-bolt', sessionId);

    // Resolve realpath to match chat route logic
    try {
      await stat(workspaceDir); // Ensure it exists first
      workspaceDir = await realpath(workspaceDir);
      console.log('[API /api/files] Workspace directory (resolved):', workspaceDir);
    } catch (error) {
      console.error('[API /api/files] Workspace not found:', error);
      return NextResponse.json(
        { error: 'Session workspace not found' },
        { status: 404 }
      );
    }

    // If a file path is specified, return file content
    if (filePath) {
      // Security check: prevent path traversal attacks
      if (filePath.includes('..')) {
         return NextResponse.json(
          { error: 'Invalid file path' },
          { status: 400 }
        );
      }
      
      // Remove possible leading slashes
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const fullPath = join(workspaceDir, cleanPath);
      
      try {
        const content = await readFile(fullPath, 'utf-8');
        console.log(`[API /api/files] Read content for ${filePath}. Length: ${content.length}`);
        return NextResponse.json({ success: true, content });
      } catch (error) {
        console.error('[API /api/files] Error reading file:', error);
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
    }

    // Otherwise return file tree
    // We always build from workspaceDir, relativePath starts empty
    const tree = await buildFileTree(workspaceDir, '');
    
    return NextResponse.json({ success: true, tree });

  } catch (error) {
    console.error('Error in files endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
