'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProject } from '@/contexts/ProjectContext';
import { useToken } from '@/contexts/TokenContext';
import { TerminalPanel } from '@/components/TerminalPanel';
import {
  ChatHeader,
  MessageList,
  ChatInput,
  ViewModeToggle,
  CodePanel,
  PreviewPanel,
  Message,
  AttachedFile,
  ViewMode,
  DevServer,
} from '@/components/workspace';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || '';
  const { settings } = useProject();
  const { addTokenUsage } = useToken();
  
  // Chat state
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  
  // File state
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  
  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [devServer, setDevServer] = useState<DevServer | null>(null);
  const [isStartingServer, setIsStartingServer] = useState(false);
  const [serverError, setServerError] = useState<string>('');
  const [devServerLogs, setDevServerLogs] = useState<string[]>([]);
  
  // UI state
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('code');
  const [terminalHeight, setTerminalHeight] = useState(320); // Default height in pixels
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitializedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  // Cleanup: Stop dev server when component unmounts
  useEffect(() => {
    return () => {
      if (sessionId && devServer) {
        console.log('[Workspace] Stopping dev server on unmount...');
        fetch(`/api/dev-server?sessionId=${sessionId}`, {
          method: 'DELETE',
        }).catch(err => console.error('[Workspace] Error stopping dev server:', err));
      }
    };
  }, [sessionId, devServer]);

  // Start development server
  const startDevServer = async () => {
    if (!sessionId || isStartingServer) return;

    setIsStartingServer(true);
    setServerError('');
    setDevServerLogs([]);

    try {
      console.log('[Workspace] Starting dev server for session:', sessionId);
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
      console.log('[Workspace] Dev server response:', data);

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
      console.error('[Workspace] Error starting dev server:', error);
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
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  // Auto-send initial prompt
  useEffect(() => {
    if (initialPrompt && messages.length === 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      sendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  // Recursively collect all file paths
  const collectFilePaths = (nodes: FileNode[]): string[] => {
    const paths: string[] = [];
    for (const node of nodes) {
      if (node.type === 'file') {
        paths.push(node.path);
      } else if (node.children) {
        paths.push(...collectFilePaths(node.children));
      }
    }
    return paths;
  };

  // Load all file contents
  const loadAllFiles = async (sid: string) => {
    console.log('[loadAllFiles] Starting to load files for session:', sid);
    try {
      const response = await fetch(`/api/files?sessionId=${sid}`);
      const data = await response.json();
      console.log('[loadAllFiles] Files API response:', data);
      
      if (data.success && data.tree) {
        const filePaths = collectFilePaths(data.tree);
        console.log('[loadAllFiles] Collected file paths:', filePaths);
        const fileContents: Record<string, string> = {};

        await Promise.all(
          filePaths.map(async (path) => {
            try {
              const fileResponse = await fetch(
                `/api/files?sessionId=${sid}&path=${encodeURIComponent(path)}`
              );
              const fileData = await fileResponse.json();
              console.log(`[loadAllFiles] Loaded file ${path}:`, fileData.success);
              if (fileData.success && fileData.content) {
                fileContents[path] = fileData.content;
              }
            } catch (error) {
              console.error(`Failed to load file ${path}:`, error);
            }
          })
        );

        console.log('[loadAllFiles] All files loaded:', Object.keys(fileContents));
        setFiles(fileContents);
        
        if (filePaths.length > 0 && !activeFile) {
          console.log('[loadAllFiles] Setting active file:', filePaths[0]);
          setActiveFile(filePaths[0]);
        }
      } else {
        console.warn('[loadAllFiles] No tree in response or not successful');
      }
    } catch (error) {
      console.error('[loadAllFiles] Failed to load files:', error);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const currentAttachedFiles = [...attachedFiles];

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
      attachedFiles: currentAttachedFiles,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);
    setCurrentResponse('');

    abortControllerRef.current = new AbortController();

    try {
      const allUploadedFiles = [
        ...settings.uploadedFiles,
        ...attachedFiles.map(f => ({
          id: f.id,
          name: f.name,
          path: f.path,
          content: f.content,
          type: 'file' as const,
          size: f.size,
        })),
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
          sessionId: sessionId || undefined,
          uploadedFiles: allUploadedFiles,
          knowledge: settings.knowledge,
          modelConfig: settings.modelConfig,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedResponse = '';
        let hasReceivedResult = false;
        let currentSessionId = sessionId;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              if (jsonStr.trim()) {
                try {
                  const parsed = JSON.parse(jsonStr);

                  if (parsed.type === 'session_info') {
                    currentSessionId = parsed.sessionId;
                    setSessionId(parsed.sessionId);
                    console.log('[Workspace] Session ID:', parsed.sessionId);
                  }

                  if (parsed.type === 'file_updated') {
                    console.log('[Workspace] File updated:', parsed.tool, parsed.input);
                    if (currentSessionId) {
                      console.log('[Workspace] Triggering file reload for session:', currentSessionId);
                      loadAllFiles(currentSessionId);
                    }
                  }

                  if (parsed.type === 'result') {
                    hasReceivedResult = true;
                    console.log('[Workspace] Received result, final refresh');

                    if (parsed.usage) {
                      console.log('[Token] Found usage in result:', parsed.usage);
                      const inputTokens = parsed.usage.input_tokens || parsed.usage.prompt_tokens || 0;
                      const outputTokens = parsed.usage.output_tokens || parsed.usage.completion_tokens || 0;
                      console.log('[Token] Result tokens - input:', inputTokens, 'output:', outputTokens);
                      if (inputTokens > 0 || outputTokens > 0) {
                        addTokenUsage(inputTokens, outputTokens);
                        console.log('[Token] Updated token usage from result');
                      }
                    }

                    if (currentSessionId) {
                      setTimeout(() => {
                        loadAllFiles(currentSessionId);
                      }, 1000);
                    }
                    break;
                  }

                  if (parsed.type === 'assistant' && parsed.message?.content) {
                    const textContent = Array.isArray(parsed.message.content)
                      ? parsed.message.content
                          .filter((block: { type: string }) => block.type === 'text')
                          .map((block: { text: string }) => block.text)
                          .join('')
                      : parsed.message.content;

                    if (textContent) {
                      accumulatedResponse += textContent;
                      setCurrentResponse(accumulatedResponse);
                    }
                  }
                } catch (e) {
                  console.error('Error parsing JSON:', e);
                }
              }
            }
          }

          if (hasReceivedResult) break;
        }

        if (accumulatedResponse) {
          const assistantMessage: Message = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            content: accumulatedResponse,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sending message:', error);
      }
    } finally {
      setIsLoading(false);
      setCurrentResponse('');
    }
  };

  // Handle file selection
  const handleSelectFile = (path: string) => {
    setActiveFile(path);
  };

  // Handle code change
  const handleCodeChange = (code: string, filename?: string) => {
    console.log('Code changed:', filename, code);
  };

  // Handle preview refresh
  const handlePreviewRefresh = () => {
    setPreviewUrl(`${previewUrl.split('?t=')[0]}?t=${Date.now()}`);
  };

  // Handle open in new tab
  const handleOpenInNewTab = () => {
    window.open(previewUrl, '_blank');
  };

  // Handle terminal resize drag
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = terminalHeight;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaY = dragStartY.current - e.clientY;
      const newHeight = Math.min(Math.max(dragStartHeight.current + deltaY, 100), 600);
      setTerminalHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Debug log
  console.log('[Workspace Debug]', {
    sessionId,
    filesCount: Object.keys(files).length,
    previewUrl,
    devServer,
    isStartingServer,
    serverError,
  });

  return (
    <div className="flex h-screen bg-white dark:bg-black text-gray-900 dark:text-white relative transition-colors">
      {/* Left: Chat area */}
      <div className="w-[480px] flex flex-col border-r border-gray-200/60 dark:border-gray-800/60">
        <ChatHeader />
        
        <MessageList
          messages={messages}
          currentResponse={currentResponse}
          messagesEndRef={messagesEndRef}
        />
        
        <ChatInput
          input={input}
          isLoading={isLoading}
          attachedFiles={attachedFiles}
          onInputChange={setInput}
          onSend={() => sendMessage()}
          onFilesAttached={(newFiles) => setAttachedFiles(prev => [...prev, ...newFiles])}
          onFileRemoved={(fileId) => setAttachedFiles(prev => prev.filter(f => f.id !== fileId))}
          onFolderRemoved={(folderName) => setAttachedFiles(prev => prev.filter(f => f.folderName !== folderName))}
        />
      </div>

      {/* Middle & Right: Code editor and Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ViewModeToggle
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main content area */}
          <div className={`flex overflow-hidden ${isTerminalOpen ? 'flex-1' : 'h-full'}`}>
            {viewMode === 'code' && (
              <div className="w-full flex overflow-hidden">
                <CodePanel
                  files={files}
                  activeFile={activeFile}
                  sessionId={sessionId}
                  isLoading={isLoading}
                  onSelectFile={handleSelectFile}
                  onCodeChange={handleCodeChange}
                />
              </div>
            )}

            {viewMode === 'preview' && (
              <PreviewPanel
                previewUrl={previewUrl}
                devServer={devServer}
                isStartingServer={isStartingServer}
                serverError={serverError}
                sessionId={sessionId}
                hasFiles={Object.keys(files).length > 0}
                onStartServer={startDevServer}
                onRefresh={handlePreviewRefresh}
                onOpenInNewTab={handleOpenInNewTab}
              />
            )}
          </div>

          {/* Terminal Panel with Resizable Handle */}
          <div 
            ref={containerRef}
            className="flex flex-col"
            style={{ height: isTerminalOpen ? terminalHeight : 'auto' }}
          >
            {/* Drag Handle - serves as both border and resize handle */}
            {isTerminalOpen && (
              <>
                <div
                  onMouseDown={handleDragStart}
                  className={`h-2 flex-shrink-0 cursor-ns-resize transition-colors flex items-center justify-center group ${
                    isDragging ? 'bg-blue-500/20' : 'hover:bg-blue-500/10'
                  }`}
                  title="Drag to resize"
                >
                  <div className={`w-12 h-1 rounded-full transition-colors ${
                    isDragging ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-500 group-hover:bg-blue-400'
                  }`} />
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
              </>
            )}
            {!isTerminalOpen && (
              <div className="h-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            )}
            <TerminalPanel 
              devServerLogs={devServerLogs} 
              sessionId={sessionId}
              isOpen={isTerminalOpen}
              onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
              onServerDetected={(port) => {
                console.log('[Workspace] Server detected on port:', port);
                const url = `http://localhost:${port}`;
                setPreviewUrl(url);
                setDevServer({ port, framework: 'Manual', url });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
