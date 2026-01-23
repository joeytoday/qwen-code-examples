'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Sparkles, 
  Send, 
  X,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import CodeRenderer from '@/components/CodeRenderer';
import Container, { ContainerRef } from '@/components/Container';
import Terminal from '@/components/Terminal';
import LogViewer from '@/components/LogViewer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || '';
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'terminal'>('logs');
  const [devServer, setDevServer] = useState<{ port: number; framework: string; proxyUrl: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const containerRef = useRef<ContainerRef>(null);

  // 处理开发服务器检测
  const handleDevServerDetected = (info: { port: number; framework: string; proxyUrl: string }) => {
    console.log('[Workspace] Dev server detected:', info);
    setDevServer(info);
    // 自动切换预览 URL 到代理地址
    setPreviewUrl(`${info.proxyUrl}&t=${Date.now()}`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  // 自动发送初始提示
  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      sendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  // 递归收集所有文件路径
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

  // 加载所有文件内容
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

        // 并行加载所有文件内容
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
        
        // 设置第一个文件为活动文件
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

  // 更新预览
  const updatePreview = (sid: string) => {
    setPreviewUrl(`/api/preview?sessionId=${sid}&t=${Date.now()}`);
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentResponse('');

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
          sessionId: sessionId || undefined,
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

                  // 处理会话信息
                  if (parsed.type === 'session_info') {
                    currentSessionId = parsed.sessionId;
                    setSessionId(parsed.sessionId);
                    console.log('[Workspace] Session ID:', parsed.sessionId);
                  }

                  // 处理文件更新通知
                  if (parsed.type === 'file_updated') {
                    console.log('[Workspace] File updated:', parsed.tool, parsed.input);
                    // 立即刷新文件和预览
                    if (currentSessionId) {
                      console.log('[Workspace] Triggering file reload for session:', currentSessionId);
                      loadAllFiles(currentSessionId);
                      updatePreview(currentSessionId);
                    }
                  }

                  if (parsed.type === 'result') {
                    hasReceivedResult = true;
                    console.log('[Workspace] Received result, final refresh');
                    // 最终刷新文件和预览
                    if (currentSessionId) {
                      // 延迟一下确保文件写入完成
                      setTimeout(() => {
                        loadAllFiles(currentSessionId);
                        updatePreview(currentSessionId);
                      }, 1000);
                    }
                    break;
                  }

                  if (parsed.type === 'assistant' && parsed.message?.content) {
                    const textContent = Array.isArray(parsed.message.content)
                      ? parsed.message.content
                          .filter((block: any) => block.type === 'text')
                          .map((block: any) => block.text)
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
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Error sending message:', error);
      }
    } finally {
      setIsLoading(false);
      setCurrentResponse('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 处理文件选择
  const handleSelectFile = (path: string) => {
    setActiveFile(path);
  };

  // 处理代码变更（只读模式，不需要实现）
  const handleCodeChange = (code: string, filename?: string) => {
    console.log('Code changed:', filename, code);
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* 左侧：聊天区域 */}
      <div className="w-96 flex flex-col border-r border-gray-800">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">bolt.new</span>
          </div>
          <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}

          {currentResponse && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gray-800">
                <div className="text-sm whitespace-pre-wrap text-gray-100">
                  {currentResponse}
                </div>
                <div className="flex items-center mt-2 text-blue-400">
                  <div className="animate-pulse">●</div>
                  <span className="ml-2 text-xs">Typing...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="How can Bolt help you today?"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={2}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 中间：代码编辑器 + 终端/日志 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {Object.keys(files).length > 0 ? (
          <Container
            ref={containerRef}
            defaultSplit={70}
            top={
              <CodeRenderer
                files={files}
                readOnly={true}
                isComplete={!isLoading}
                onCodeChange={handleCodeChange}
                activeFile={activeFile}
                onSelectFile={handleSelectFile}
              />
            }
            bottom={
              <div className="flex h-full flex-col bg-gray-900">
                {/* Tab Bar */}
                <div className="flex items-center border-b border-gray-700 bg-gray-800 px-4 py-2">
                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-t transition-colors ${
                      activeTab === 'logs'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Logs
                  </button>
                  <button
                    onClick={() => setActiveTab('terminal')}
                    className={`ml-2 px-4 py-1.5 text-sm font-medium rounded-t transition-colors ${
                      activeTab === 'terminal'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Terminal
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  {activeTab === 'logs' ? (
                    <LogViewer logs={logs} loading={isLoading} />
                  ) : (
                    <Terminal
                      containerId={sessionId || 'default'}
                      socketUrl={typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
                      onDevServerDetected={handleDevServerDetected}
                    />
                  )}
                </div>
              </div>
            }
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-900 text-gray-500">
            <div className="text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No files yet</p>
              <p className="text-sm mt-2">Start chatting with AI to generate your project</p>
            </div>
          </div>
        )}
      </div>

      {/* 右侧：预览 */}
      <div className="w-1/3 flex flex-col bg-gray-900 border-l border-gray-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Preview</h2>
            {devServer && (
              <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                {devServer.framework} • Port {devServer.port}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => previewUrl && setPreviewUrl(`${previewUrl.split('&t=')[0]}&t=${Date.now()}`)}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
              title="Refresh Preview"
            >
              <RotateCcw className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => {
                if (previewUrl) {
                  window.open(previewUrl, '_blank');
                }
              }}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
              title="Open in New Tab"
            >
              <Maximize2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-white">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No Preview Available</p>
                <p className="text-sm mt-2">Start chatting with AI to generate your app</p>
                {devServer && (
                  <p className="text-xs mt-4 text-green-400">
                    Dev server detected! Preview will load automatically.
                  </p>
                )}
              </div>
            </div>
          )}
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
