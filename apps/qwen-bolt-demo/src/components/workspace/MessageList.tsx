'use client';

import { RefObject } from 'react';
import { PlanMessage, containsPlan } from '@/components/PlanMessage';
import { SummaryMessage, containsSummary } from '@/components/SummaryMessage';
import { UserMessageBubble, AssistantMessageBubble, StreamingIndicator } from '@/components/chat';
import type { AttachedFileItem } from '@/components/chat';

interface AttachedFile {
  id: string;
  name: string;
  path: string;
  content: string;
  size: number;
  isFolder?: boolean;
  folderName?: string;
  fileCount?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachedFiles?: AttachedFile[];
}

interface MessageListProps {
  messages: Message[];
  currentResponse: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  isLoading: boolean;
}

function StreamingResponse({ content }: { content: string }) {
  const isPlan = containsPlan(content);
  const isSummary = !isPlan && containsSummary(content);

  if (isPlan) {
    return (
      <StreamingIndicator content={content}>
        <PlanMessage content={content} />
      </StreamingIndicator>
    );
  }

  if (isSummary) {
    return (
      <StreamingIndicator content={content}>
        <SummaryMessage content={content} />
      </StreamingIndicator>
    );
  }

  return <StreamingIndicator content={content} />;
}

export function MessageList({ messages, currentResponse, messagesEndRef, isLoading }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-black">
      {messages.map((msg) => {
        const isPlan = msg.role === 'assistant' && containsPlan(msg.content);
        const isSummary = msg.role === 'assistant' && !isPlan && containsSummary(msg.content);
        
        return (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'user' ? (
              <UserMessageBubble content={msg.content} attachedFiles={msg.attachedFiles as AttachedFileItem[]} />
            ) : isPlan ? (
              <div className="max-w-[85%]">
                <PlanMessage content={msg.content} />
              </div>
            ) : isSummary ? (
              <div className="max-w-[85%]">
                <SummaryMessage content={msg.content} />
              </div>
            ) : (
              <AssistantMessageBubble content={msg.content} />
            )}
          </div>
        );
      })}

      {(currentResponse || isLoading) && (
        <div className="flex justify-start">
          <StreamingResponse content={currentResponse} />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export type { Message, AttachedFile };
