import {
  query,
  Query,
  type SDKUserMessage,
  type SDKMessage,
} from "@qwen-code/sdk";
import { v4 as uuidv4 } from "uuid";

interface StreamClient {
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
}

interface SessionData {
  query: Query;
  promptGenerator: AsyncGenerator<SDKUserMessage, void, unknown>;
  queue: SDKUserMessage[];
  waiters: ((value: SDKUserMessage | null) => void)[];
  isClosing: boolean;
  messageCache: SDKMessage[];
  streamClients: StreamClient[];
  controller: AbortController;
}

// Session-based query management with stream caching
class SessionQueryManager {
  private sessions: Map<string, SessionData> = new Map();
  private activeSessionId: string | null = null; // Track the currently active session

  // Create a new prompt generator for a session
  private createPromptGenerator(
    sessionId: string
  ): AsyncGenerator<SDKUserMessage, void, unknown> {
    return this.createAsyncGenerator(sessionId);
  }

  private async *createAsyncGenerator(
    sessionId: string
  ): AsyncGenerator<SDKUserMessage, void, unknown> {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`);
    }

    while (!sessionData.isClosing) {
      if (sessionData.queue.length > 0) {
        const message = sessionData.queue.shift()!;
        console.log(
          "[AsyncGenerator] Yielding message:",
          message.message.content
        );
        yield message;
      } else {
        // Wait for the next message or until session is closed
        console.log("[AsyncGenerator] Waiting for next message...");
        const nextMessage = await new Promise<SDKUserMessage | null>(
          (resolve) => {
            sessionData.waiters.push(resolve);
          }
        );

        // If session is closing or we got a null message, break the loop
        if (!nextMessage || sessionData.isClosing) {
          console.log("[AsyncGenerator] Session closing, breaking loop");
          break;
        }

        console.log(
          "[AsyncGenerator] Yielding message:",
          nextMessage.message.content
        );
        yield nextMessage;
      }
    }

    console.log("[AsyncGenerator] Generator ended for session:", sessionId);
  }

  // Add message to a session's queue
  async pushToSession(sessionId: string, message: SDKUserMessage) {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`);
    }

    console.log(
      "[SessionManager] Pushing message to session:",
      sessionId,
      message.message.content
    );

    if (sessionData.waiters.length > 0) {
      const resolve = sessionData.waiters.shift();
      console.log("[SessionManager] Resolving waiter with message");
      resolve!(message);
    } else {
      console.log("[SessionManager] Adding message to queue");
      sessionData.queue.push(message);
    }
  }

  // Create a new query instance for a session, closing previous sessions
  async createQueryForSession(sessionId: string): Promise<Query> {
    // Close all existing sessions before creating a new one
    await this.closeAllSessions();

    // Create AbortController for this session
    const controller = new AbortController();

    // Create prompt generator
    const promptGenerator = this.createPromptGenerator(sessionId);

    // Create new query with the prompt generator
    const newQuery = query({
      prompt: promptGenerator,
      options: {
        pathToQwenExecutable: "qwen",
        includePartialMessages: true,
        debug: false,
      },
    });

    // Initialize session data
    const sessionData: SessionData = {
      query: newQuery,
      promptGenerator,
      queue: [],
      waiters: [],
      isClosing: false,
      messageCache: [],
      streamClients: [],
      controller,
    };

    // Store session data
    this.sessions.set(sessionId, sessionData);
    this.activeSessionId = sessionId;

    // Start processing messages from the query and cache them
    this.processQueryMessages(sessionId, newQuery);

    return newQuery;
  }

  // Process messages from the query and add them to the cache
  private async processQueryMessages(sessionId: string, queryInstance: Query) {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) {
      console.log("[processQueryMessages] Session not found:", sessionId);
      return;
    }

    console.log(
      "[processQueryMessages] Starting to process messages for session:",
      sessionId
    );

    try {
      for await (const message of queryInstance) {
        console.log(
          "[processQueryMessages] Received message:",
          message.type,
          message
        );
        sessionData.messageCache.push(message);

        // Send the message to all active stream clients
        const encoder = new TextEncoder();
        const jsonLine = JSON.stringify(message);
        const encodedMessage = encoder.encode(`data: ${jsonLine}\n\n`);

        console.log(
          "[processQueryMessages] Broadcasting to",
          sessionData.streamClients.length,
          "clients"
        );

        // Keep only active clients (filter out those that have been closed)
        const activeClients = [];
        for (const client of sessionData.streamClients) {
          try {
            client.controller.enqueue(encodedMessage);
            activeClients.push(client);
          } catch {
            // Client stream might be closed, skip it
            console.log("Stream client closed, removing from list");
          }
        }
        sessionData.streamClients = activeClients;

        // If this is a result message, clear the message cache and close all stream clients
        if (message.type === "result") {
          console.log(
            "[processQueryMessages] Result message received, clearing cache and closing stream clients"
          );
          sessionData.messageCache = [];

          // Close all stream clients for this turn
          console.log(
            "[processQueryMessages] Closing",
            sessionData.streamClients.length,
            "stream clients"
          );
          for (const client of sessionData.streamClients) {
            try {
              client.controller.close();
            } catch {
              // Client might already be closed, ignore errors
            }
          }
          // Clear the stream clients array
          sessionData.streamClients = [];
        }
      }
      console.log(
        "[processQueryMessages] Query iteration completed for session:",
        sessionId
      );
    } catch (error) {
      console.error(
        "[processQueryMessages] Error processing query messages for session:",
        sessionId,
        error
      );

      // Send error to all clients
      const encoder = new TextEncoder();
      const errorMessage = JSON.stringify({
        type: "error",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      const encodedError = encoder.encode(`data: ${errorMessage}\n\n`);

      for (const client of sessionData.streamClients) {
        try {
          client.controller.enqueue(encodedError);
        } catch {
          // Ignore if client is already closed
        }
      }
    }
  }

  // Add a stream client to a session
  addStreamClient(
    sessionId: string,
    controller: ReadableStreamDefaultController
  ): void {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`);
    }

    console.log(
      "[addStreamClient] Adding new stream client for session:",
      sessionId
    );
    console.log(
      "[addStreamClient] Current stream clients count:",
      sessionData.streamClients.length
    );
    console.log(
      "[addStreamClient] Current message cache size:",
      sessionData.messageCache.length
    );

    const encoder = new TextEncoder();
    const client: StreamClient = { controller, encoder };
    sessionData.streamClients.push(client);

    console.log(
      "[addStreamClient] Stream clients count after adding:",
      sessionData.streamClients.length
    );

    // Note: We don't send cached messages to new clients in multi-turn conversations
    // Each stream should only receive messages from the current turn
    // The message cache is cleared after each turn completes
  }

  // Remove a stream client from a session
  removeStreamClient(
    sessionId: string,
    controller: ReadableStreamDefaultController
  ): void {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) {
      return;
    }

    sessionData.streamClients = sessionData.streamClients.filter(
      (client) => client.controller !== controller
    );
  }

  // Get the query instance for a specific session
  getQueryForSession(sessionId: string): Query | null {
    const sessionData = this.sessions.get(sessionId);
    return sessionData ? sessionData.query : null;
  }

  // Check if session exists
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  // Close a specific session
  async closeSession(sessionId: string): Promise<boolean> {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) {
      return false;
    }

    // Mark as closing to stop the generator
    sessionData.isClosing = true;

    // Resolve any pending waiters to unblock the generator
    console.log(
      "[closeSession] Resolving",
      sessionData.waiters.length,
      "pending waiters"
    );
    while (sessionData.waiters.length > 0) {
      const resolve = sessionData.waiters.shift();
      if (resolve) {
        // Resolve with null to signal the generator to stop
        resolve(null);
      }
    }

    // Close all stream clients
    for (const client of sessionData.streamClients) {
      try {
        client.controller.close();
      } catch {
        // Controller might already be closed, ignore errors
      }
    }
    sessionData.streamClients = [];

    // Close the query if it exists
    if (sessionData.query) {
      try {
        await sessionData.query.close();
      } catch (error) {
        console.error("Error closing query for session:", sessionId, error);
      }
    }

    // Remove from active sessions
    this.sessions.delete(sessionId);

    // Update active session if needed
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }

    return true;
  }

  // Close all sessions (e.g., when shutting down the app)
  async closeAllSessions(): Promise<void> {
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      await this.closeSession(sessionId);
    }
  }
}

declare global {
}

// Singleton instance of the session query manager
const sessionQueryManager = new SessionQueryManager();

// Session storage (for metadata only)
interface ChatSession {
  id: string;
  isActive: boolean;
  createdAt: Date;
  lastInteraction: Date;
  sessionId: string;
}

// In-memory storage for session metadata
const sessions: Map<string, ChatSession> = new Map();

export async function createSession(): Promise<{ sessionId: string }> {
  const sessionId = uuidv4();

  // Create a new query for this session (this will close all old sessions)
  await sessionQueryManager.createQueryForSession(sessionId);

  const session: ChatSession = {
    id: sessionId,
    isActive: true,
    createdAt: new Date(),
    lastInteraction: new Date(),
    sessionId,
  };

  sessions.set(sessionId, session);

  return { sessionId };
}

export function getSession(sessionId: string): ChatSession | undefined {
  return sessions.get(sessionId);
}

export async function addMessageToSession(
  sessionId: string,
  message: SDKUserMessage
): Promise<boolean> {
  const session = sessions.get(sessionId);
  if (!session || !session.isActive) {
    return false;
  }

  // Update the last interaction time
  session.lastInteraction = new Date();

  // Ensure the message uses the correct session ID
  const messageWithCorrectSession: SDKUserMessage = {
    ...message,
    session_id: sessionId,
  };

  try {
    // Add the message to the session's queue
    await sessionQueryManager.pushToSession(
      sessionId,
      messageWithCorrectSession
    );
    return true;
  } catch (error) {
    console.error("Error adding message to session:", sessionId, error);
    return false;
  }
}

export async function closeSession(sessionId: string): Promise<boolean> {
  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }

  // Close the session in the query manager
  await sessionQueryManager.closeSession(sessionId);

  session.isActive = false;
  sessions.delete(sessionId);
  return true;
}

// Create a stream for a session
export function createSessionStream(
  sessionId: string,
  controller: ReadableStreamDefaultController
) {
  sessionQueryManager.addStreamClient(sessionId, controller);
  return {
    cleanup: () =>
      sessionQueryManager.removeStreamClient(sessionId, controller),
  };
}

// Close all sessions (e.g., when shutting down the app)
export async function closeAllSessions(): Promise<void> {
  // Close everything we know about (both metadata + query manager sessions)
  const sessionIds = Array.from(sessions.keys());
  for (const sessionId of sessionIds) {
    await closeSession(sessionId);
  }

  // Safety: also ask the query manager to close anything not present in metadata.
  await sessionQueryManager.closeAllSessions();
}
