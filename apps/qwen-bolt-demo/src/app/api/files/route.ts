import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
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

// 递归构建文件树
async function buildFileTree(dirPath: string, relativePath: string = ''): Promise<FileNode[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      // 忽略隐藏文件和 node_modules
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

    // 排序：目录在前，文件在后
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

// GET /api/files?sessionId=xxx - 获取文件树
// GET /api/files?sessionId=xxx&path=xxx - 获取文件内容
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const filePath = searchParams.get('path');

    console.log('[API /api/files] Request:', { sessionId, filePath });

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

    // 如果指定了文件路径，返回文件内容
    if (filePath) {
      // 安全检查：防止路径遍历攻击
      if (filePath.includes('..')) {
         return NextResponse.json(
          { error: 'Invalid file path' },
          { status: 400 }
        );
      }
      
      // 去除可能的前导斜杠
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const fullPath = join(workspaceDir, cleanPath);
      
      try {
        const content = await readFile(fullPath, 'utf-8');
        return NextResponse.json({ success: true, content });
      } catch (error) {
        console.error('[API /api/files] Error reading file:', error);
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
    }

    // 否则返回文件树
    // 我们总是从 workspaceDir 开始构建，relativePath 初始为空
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
