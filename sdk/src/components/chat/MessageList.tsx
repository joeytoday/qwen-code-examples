import React from 'react';
import { Message } from '@/types/chat';
import MessageItem from './MessageItem';
import { v4 as uuidv4 } from 'uuid';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="space-y-4 mb-4">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          <div className="mb-4 text-gray-400 dark:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No messages yet</p>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Start a conversation by sending a message.</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageItem
            key={`message-${message.id}-${uuidv4()}`}
            message={message}
          />
        ))
      )}
    </div>
  );
};

export default MessageList;