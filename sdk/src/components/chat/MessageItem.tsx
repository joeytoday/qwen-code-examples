import React from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Determine status-based styling for both user and assistant messages
  const statusClass = message.status === 'error'
    ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 text-red-800 dark:text-red-200'
    : message.status === 'delivered'
      ? isUser
        ? 'bg-blue-600 dark:bg-blue-700 text-white' // Improved contrast: darker blue with white text
        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200'
      : isUser
        ? 'bg-blue-500 dark:bg-blue-600 text-white' // Consistent styling for all user statuses
        : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-gray-800 dark:text-gray-200'; // For sent messages

  return (
    <div className={cn(
      'flex',
      isUser ? 'justify-end' : 'justify-start',
      'mb-4'
    )}>
      <div className={cn(
        'max-w-[80%] rounded-2xl p-4 shadow-sm',
        isUser
          ? 'rounded-tr-none' // User message rounded corners
          : 'rounded-tl-none', // Assistant message rounded corners
        statusClass
      )}>
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
        <div className={cn(
          'text-xs mt-2 opacity-70',
          isUser ? 'text-blue-100 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400' // Better contrast for timestamps
        )}>
          {message.timestamp?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;