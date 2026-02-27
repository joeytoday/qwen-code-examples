import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

// Find HTML entry file
async function findHtmlEntry(workspaceDir: string): Promise<string | null> {
  const possibleEntries = [
    'index.html',
    'src/index.html',
    'public/index.html',
    'dist/index.html',
  ];

  for (const entry of possibleEntries) {
    try {
      const fullPath = join(workspaceDir, entry);
      await readFile(fullPath);
      return entry;
    } catch {
      continue;
    }
  }

  // If not found, try searching for the first HTML file
  try {
    const files = await readdir(workspaceDir);
    const htmlFile = files.find(f => f.endsWith('.html'));
    if (htmlFile) {
      return htmlFile;
    }
  } catch {
    // ignore
  }

  return null;
}

// Read and process HTML file, inject all related resources
async function buildPreviewHtml(workspaceDir: string, entryFile: string): Promise<string> {
  const htmlPath = join(workspaceDir, entryFile);
  let html = await readFile(htmlPath, 'utf-8');

  // Read all CSS files
  const cssFiles: string[] = [];
  try {
    const files = await readdir(workspaceDir, { recursive: true });
    for (const file of files) {
      if (typeof file === 'string' && file.endsWith('.css')) {
        try {
          const cssPath = join(workspaceDir, file);
          const cssContent = await readFile(cssPath, 'utf-8');
          cssFiles.push(cssContent);
        } catch {
          continue;
        }
      }
    }
  } catch {
    // ignore
  }

  // Read all JS files
  const jsFiles: string[] = [];
  try {
    const files = await readdir(workspaceDir, { recursive: true });
    for (const file of files) {
      if (typeof file === 'string' && file.endsWith('.js') && !file.includes('node_modules')) {
        try {
          const jsPath = join(workspaceDir, file);
          const jsContent = await readFile(jsPath, 'utf-8');
          jsFiles.push(jsContent);
        } catch {
          continue;
        }
      }
    }
  } catch {
    // ignore
  }

  // Inject CSS
  if (cssFiles.length > 0) {
    const cssTag = `<style>\n${cssFiles.join('\n\n')}\n</style>`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${cssTag}\n</head>`);
    } else {
      html = `${cssTag}\n${html}`;
    }
  }

  // Inject JS
  if (jsFiles.length > 0) {
    const jsTag = `<script>\n${jsFiles.join('\n\n')}\n</script>`;
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${jsTag}\n</body>`);
    } else {
      html = `${html}\n${jsTag}`;
    }
  }

  return html;
}

// GET /api/preview?sessionId=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return new Response('sessionId is required', { status: 400 });
    }

    const workspaceDir = join(tmpdir(), 'qwen-bolt', sessionId);

    // Find HTML entry file
    const entryFile = await findHtmlEntry(workspaceDir);
    
    if (!entryFile) {
      // If no HTML file found, return a default page
      const defaultHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    body {
      margin: 0;
      padding: 40px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .message {
      text-align: center;
      color: #666;
    }
    .message h1 {
      font-size: 24px;
      margin-bottom: 12px;
      color: #333;
    }
    .message p {
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="message">
    <h1>No Preview Available</h1>
    <p>Start chatting with AI to generate your app</p>
  </div>
</body>
</html>
      `;
      
      return new Response(defaultHtml, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Build preview HTML
    const previewHtml = await buildPreviewHtml(workspaceDir, entryFile);

    return new Response(previewHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    logger.error('Error in preview endpoint:', error);
    
    const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview Error</title>
  <style>
    body {
      margin: 0;
      padding: 40px;
      font-family: monospace;
      background: #1a1a1a;
      color: #ff6b6b;
    }
    .error {
      background: #2a2a2a;
      border: 1px solid #ff6b6b;
      border-radius: 8px;
      padding: 20px;
    }
    h1 { margin-top: 0; }
    pre {
      background: #1a1a1a;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="error">
    <h1>Preview Error</h1>
    <p>Failed to generate preview</p>
    <pre>${error instanceof Error ? error.message : String(error)}</pre>
  </div>
</body>
</html>
    `;
    
    return new Response(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}
