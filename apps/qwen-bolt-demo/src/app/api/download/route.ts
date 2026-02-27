import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { tmpdir } from 'os';
import { readdir, readFile, stat } from 'fs/promises';
import JSZip from 'jszip';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

// Recursively read all files in a directory
async function getAllFiles(dirPath: string, baseDir: string = dirPath): Promise<{ path: string; content: Buffer }[]> {
  const files: { path: string; content: Buffer }[] = [];
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      // Skip node_modules and hidden files
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      
      if (entry.isDirectory()) {
        // Recursively read subdirectories
        const subFiles = await getAllFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        // Read file content
        const content = await readFile(fullPath);
        const relativePath = fullPath.substring(baseDir.length + 1);
        files.push({ path: relativePath, content });
      }
    }
  } catch (error) {
    logger.error(`[Download API] Error reading directory ${dirPath}:`, error);
  }
  
  return files;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }


    // Get workspace directory
    const workspaceDir = join(tmpdir(), 'qwen-bolt', sessionId);
    
    // Check if directory exists
    try {
      await stat(workspaceDir);
    } catch {
      return NextResponse.json(
        { error: 'Session workspace not found' },
        { status: 404 }
      );
    }

    // Read all files
    const files = await getAllFiles(workspaceDir);
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files found in workspace' },
        { status: 404 }
      );
    }


    // Create ZIP file
    const zip = new JSZip();
    
    for (const file of files) {
      zip.file(file.path, file.content);
    }

    // Generate ZIP file (using blob type)
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });


    // Return ZIP file
    return new NextResponse(zipBlob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="project-${sessionId.substring(0, 8)}.zip"`,
        'Content-Length': zipBlob.size.toString(),
      },
    });
  } catch (error) {
    logger.error('[Download API] Error creating zip:', error);
    return NextResponse.json(
      { error: 'Failed to create zip file', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
