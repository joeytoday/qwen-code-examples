# Qwen Code SDK Integration Demos

This repo demonstrates how to build AI applications using `@qwen-code/sdk`. It contains two demos:

- **CLI demo**: an interactive terminal chatbot
- **Next.js demo**: a web chat app with streaming responses (SSE)

## Prerequisites

### 1) Install Qwen Code CLI (global)

The SDK expects a `qwen` executable to be available on your machine.

After installation, verify it works:

```bash
qwen --version
```

### 2) Install dependencies

Install project dependencies (this repo uses `@qwen-code/sdk@^0.1.1` as defined in `package.json`):

```bash
npm install
```

---

## CLI demo

### Features

The interactive CLI chatbot (`demo/cli-chatbot.ts`) demonstrates:

- **Multi-turn conversation** via an async generator that continuously yields user messages
- **Streaming output** by printing partial deltas as they arrive
- **Tool call display** by printing tool-use blocks and tool results
- **Tool permission control** via the `canUseTool` callback

### Run the CLI demo

```bash
npm run start:cli
```

### Usage

1. Start the program and you will see a prompt
2. Type a message and press Enter
3. The assistant responds in a streaming fashion
4. If tools are used, the tool calls/results are printed
5. Type `quit`, `exit`, or `q` to exit

### Core idea

The CLI demo builds an async iterable of `SDKUserMessage` and passes it to the SDK `query()` API, then consumes the streamed `SDKMessage` output with `for await ... of`.

---

## Next.js demo

### What it demonstrates

The Next.js 16 web chat app demonstrates:

- **Client-side session id** to group turns on the UI
- **Streaming responses** using Server-Sent Events (SSE)
- **Multi-turn context** by sending `history` and building a single prompt string server-side
- **Error handling** for network/stream failures

### Run the Next.js demo

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

The app runs at `http://localhost:3000`.

### API endpoints

#### POST `/api/chat/init`

Creates a new session id (demo mode; no server-side persistence).

Response example:

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "success",
  "message": "Session created successfully"
}
```

Note: the current UI initializes the session id on the client (see `src/app/chat/page.tsx`), so calling this endpoint is optional.

#### POST `/api/chat/send`

Sends a message and receives a streaming SSE response.

Request body:

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "prompt": "Hello, please help me write a React component",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

Response:

Returns an SSE stream where each event is a JSON-encoded SDK message (i.e., `SDKMessage`) in `data: ...\n\n` format. The server ends the stream for the current turn when it sees a `type: "result"` message.

---

## Project structure

```text
qwen-code-sdk-chat-demo/
├── demo/
│   └── cli-chatbot.ts          # CLI chatbot demo
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       ├── init/       # Session init API
│   │   │       └── send/       # SSE streaming chat API
│   │   ├── chat/               # Chat page
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   ├── chat/               # Chat UI components
│   │   └── ui/                 # Base UI components
│   ├── lib/
│   │   ├── chat-session.ts     # Advanced session manager (not wired by default)
│   │   └── utils.ts            # Utilities
│   └── types/
│       └── chat.ts             # App-level types (not required by the demos)
├── package.json
└── README.md
```

---

## Development notes

### Requirements

- Node.js 20+
- npm (or pnpm)

### Scripts

- `npm run dev` - start Next.js dev server
- `npm run build` - build production bundle
- `npm start` - start production server
- `npm run lint` - run ESLint
- `npm run start:cli` - start the CLI chatbot demo

### Tech stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS 4
- **SDK**: `@qwen-code/sdk` (this repo uses `^0.1.1`)

---

## License

This project is provided by Qwen Team for learning and reference.
