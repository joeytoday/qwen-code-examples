// TypeScript interfaces for the Qwen Chat Service

// Represents a single message in a conversation (either user prompt or system response)
export interface Message {
  id: string;              // Unique message identifier
  conversationId: string;  // Reference to owning conversation
  role: 'user' | 'assistant'; // The sender of the message
  content: string;         // The text content of the message
  timestamp: Date;         // When the message was created
  status: 'sent' | 'delivered' | 'error'; // Delivery status of the message
}

// Represents an ongoing multi-turn dialogue with a unique identifier
export interface Conversation {
  id: string;              // Unique conversation identifier (UUID)
  createdAt: Date;         // Timestamp when conversation started
  updatedAt: Date;         // Timestamp of last message in conversation
  messages: Message[];     // Array of messages in the conversation
  sessionId?: string;      // Session identifier to group conversations (optional)
  isActive: boolean;       // Whether the conversation is currently active
}

// Represents a container for one or more related conversations during a user's interaction period
export interface Session {
  id: string;              // Unique session identifier (based on browser session)
  userId: string;          // User identifier (browser-generated, client-side only)
  startedAt: Date;         // When the session began
  lastActiveAt: Date;      // When the session was last used
  isActive: boolean;       // Whether the session is currently active
  conversations: Conversation[]; // Array of conversations in this session
}

// Represents a request to the chat service
export interface ChatRequest {
  message: string;         // The user's input message
  conversationId?: string; // ID of existing conversation (optional for new conversations)
  sessionId?: string;      // Session identifier (optional, generated if not provided)
  stream?: boolean;        // Whether to stream the response (default: true)
}

// Represents a response from the chat service
export interface ChatResponse {
  id: string;              // Unique response identifier
  conversationId: string;  // ID of the conversation this response belongs to
  message: string;         // The content of the response
  timestamp: Date;         // When the response was generated
  done: boolean;           // Whether this is the final response in a stream
  error?: string;          // Error message if the response failed
}

// Represents the current state of the chat interface
export interface ChatState {
  messages: Message[];     // Current messages in the conversation
  inputValue: string;      // Current value in the input field
  isLoading: boolean;      // Whether a response is currently being generated
  error: string | null;    // Any current error message
  conversationId: string | null; // Current conversation ID
  sessionId: string | null; // Current session ID
}

// Validation rules
export const MAX_MESSAGE_LENGTH = 4000; // Maximum content of any single message
export const MAX_MESSAGES_PER_CONVERSATION = 20; // Maximum messages in a conversation
export const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour session timeout in milliseconds