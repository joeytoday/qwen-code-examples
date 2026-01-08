import { NextRequest } from "next/server";
import { query, type SDKUserMessage, type SDKMessage } from "@qwen-code/sdk";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

type HistoryItem = {
  role: "user" | "assistant" | "system";
  content: string;
};

function buildPrompt(history: HistoryItem[] | undefined, prompt: string): string {
  const parts: string[] = [];
  if (Array.isArray(history)) {
    for (const item of history) {
      if (!item?.content) continue;
      const role = (item.role || "user").toUpperCase();
      parts.push(`${role}: ${item.content}`);
    }
  }
  parts.push(`USER: ${prompt}`);
  return parts.join("\n\n");
}

async function* oneShotPrompt(
  sessionId: string,
  content: string
): AsyncIterable<SDKUserMessage> {
  yield {
    type: "user",
    session_id: sessionId,
    message: { role: "user", content },
    parent_tool_use_id: null,
  } as SDKUserMessage;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId: rawSessionId, prompt, history } = await request.json();
    const sessionId =
      typeof rawSessionId === "string" && rawSessionId ? rawSessionId : randomUUID();
    console.log("[API /chat/send] Received request:", { sessionId, prompt });

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const fullPrompt = buildPrompt(history, prompt);

    const q = query({
      prompt: oneShotPrompt(sessionId, fullPrompt),
      options: {
        pathToQwenExecutable: "qwen",
        includePartialMessages: true,
        debug: false,
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await q.initialized;
          for await (const message of q as AsyncIterable<SDKMessage>) {
            const jsonLine = JSON.stringify(message);
            controller.enqueue(encoder.encode(`data: ${jsonLine}\n\n`));
            if ((message as { type?: string }).type === "result") {
              break;
            }
          }
        } catch (error) {
          console.error(
            "[API /chat/send] Error streaming query:",
            error
          );
          const errorLine = JSON.stringify({
            type: "error",
            error: "Error streaming query",
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          });
          controller.enqueue(encoder.encode(`data: ${errorLine}\n\n`));

          const endMarker = JSON.stringify({
            type: "conversation_end",
            timestamp: new Date().toISOString(),
          });
          controller.enqueue(encoder.encode(`data: ${endMarker}\n\n`));
        } finally {
          try {
            await q.close();
          } catch {
            // ignore
          }
          controller.close();
        }
      },
      cancel() {
        console.log(
          "[API /chat/send] Stream cancelled for session:",
          sessionId
        );
        void q.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in chat send endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
