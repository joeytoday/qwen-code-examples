'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  // Initialize a new session
  const initSession = async () => {
    try {
      // Demo mode: client-only session id
      setSessionId(crypto.randomUUID());
      setMessages([]);
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  // Send a message
  const sendMessage = async () => {
    if (!sessionId || !message.trim() || isLoading) return;

    const currentMessage = message.trim();
    const history = messages;
    setMessage(''); // Clear input immediately
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentResponse('');

    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      // Using fetch with streaming response via SSE
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          prompt: currentMessage,
          history: history.map(({ role, content }) => ({ role, content })),
        }),
        signal: abortControllerRef.current.signal
      });

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let accumulatedResponse = '';
        let hasReceivedResult = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // SSE data format: data: {...}\n\n
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6); // Remove 'data: ' prefix
              if (jsonStr.trim()) {
                try {
                  const parsed = JSON.parse(jsonStr);
                  console.log('[UI] Received message type:', parsed.type, 'subtype:', parsed.subtype);

                  // Check if this is a result message (end of turn)
                  if (parsed.type === 'result') {
                    hasReceivedResult = true;
                    console.log('[UI] Received result message, ending turn. Accumulated response length:', accumulatedResponse.length);
                    break;
                  }

                  // Process assistant messages
                  if (parsed.type === 'assistant' && parsed.message && parsed.message.content) {
                    console.log('[UI] Processing assistant message, content blocks:', parsed.message.content.length);
                    // Extract text content from content blocks
                    const textContent = Array.isArray(parsed.message.content)
                      ? parsed.message.content
                        .filter((block: { type: string; text?: string }) => block.type === 'text')
                        .map((block: { type: string; text: string }) => block.text)
                        .join('')
                      : parsed.message.content;

                    if (textContent) {
                      console.log('[UI] Extracted text length:', textContent.length);
                      accumulatedResponse += textContent;
                      setCurrentResponse(accumulatedResponse);
                    }
                  }
                } catch (e) {
                  console.error('Error parsing JSON line:', e, jsonStr);
                }
              }
            }
          }

          if (hasReceivedResult) {
            break;
          }
        }

        // Add the complete assistant response to messages
        console.log('[UI] Stream ended. Final accumulated response length:', accumulatedResponse.length);
        if (accumulatedResponse) {
          console.log('[UI] Adding assistant message to messages array');
          const assistantMessage: ChatMessage = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            content: accumulatedResponse,
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => {
            const newMessages = [...prev, assistantMessage];
            console.log('[UI] New messages array length:', newMessages.length);
            return newMessages;
          });
        } else {
          console.log('[UI] No accumulated response to add');
        }
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && (error as Error).name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        console.error('Error sending message:', error);
        // Show error message to user
        setMessages(prev => [...prev, {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: '❌ Error: Failed to get response from the assistant.',
          timestamp: new Date().toISOString(),
        }]);
      }
    } finally {
      setIsLoading(false);
      setCurrentResponse('');
    }
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-initialize session on mount
  useEffect(() => {
    initSession();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Qwen Chat</h1>
            <p className="text-sm text-gray-500 mt-1">
              {sessionId ? (
                <>
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Session: {sessionId.substring(0, 8)}...
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Initializing...
                </>
              )}
            </p>
          </div>
          <button
            onClick={initSession}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            New Session
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && !currentResponse && (
            <div className="text-center text-gray-500 mt-20">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg">Start a conversation with Qwen</p>
              <p className="text-sm mt-2">Type your message below to begin</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                  }`}
              >
                <div className="whitespace-pre-wrap wrap-break-word">{msg.content}</div>
                <div
                  className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {currentResponse && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white text-gray-800 border border-gray-200 shadow-sm">
                <div className="whitespace-pre-wrap wrap-break-word">{currentResponse}</div>
                <div className="flex items-center mt-2 text-xs text-gray-400">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                  Typing...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={3}
              disabled={!sessionId || isLoading}
            />
            <button
              onClick={sendMessage}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={!sessionId || !message.trim() || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Sending
                </span>
              ) : (
                'Send'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}