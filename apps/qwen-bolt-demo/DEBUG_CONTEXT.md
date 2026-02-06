# Context for Next Agent: Qwen Bolt Demo Debugging

## Current Status
- **Backend**: ✅ Fixed. `fs.watch`, `realpath` (macOS), and Tool Permission issues are resolved. File updates are reliably pushed via SSE.
- **Frontend State**: ✅ Fixed. `useChat` and `useFiles` correctly receive and update the `files` state in React.
- **Terminal**: ✅ Fixed. `ChunkLoadError` fixed via dynamic import.

## Critical Issues to Investigate

### 1. Editor Display Sync (Priority: High)
**Symptom**: User sees "Hello" in the code editor even after AI updates the file to "你好".
**Suspected Cause**: `src/components/CodeRenderer/CodeEditorPanel.tsx` likely initializes CodeMirror once and fails to update the editor content when the `code` prop changes.
**Action Needed**: 
- Read `src/components/CodeRenderer/CodeEditorPanel.tsx`.
- Ensure it has a `useEffect` that dispatches a transaction to update the editor state when `code` changes (checking for focus/cursor to avoid fighting the user).

### 2. WebContainer File Sync (Priority: High)
**Symptom**: DevServer stuck or Preview showing old content.
**Suspected Cause**: React state (`files`) is updated, but these changes are **not wrote back** to the WebContainer's virtual file system. WebContainer runs in the browser and needs explicit `webcontainerInstance.fs.writeFile()` calls to see changes made by the AI.
**Action Needed**:
- Read `src/hooks/useDevServer.ts`.
- Look for a `useEffect` depending on `files`.
- Implement a diffing mechanism or file watcher to sync changes from `files` -> WebContainer FS.

### 3. DevServer Stuck on Install
**Symptom**: Terminals stuck at `[WebContainer] Installing dependencies...` for 10+ minutes.
**Suspected Cause**: 
- `npm install` hanging due to network or lockfile issues (macOS lockfile vs Linux container).
- Missing `package.json` in WebContainer (validating #2 priority).
**Action Needed**:
- Read `src/lib/webcontainer.ts` and `src/hooks/useDevServer.ts`.
- Optimize install command (e.g., `npm install --no-audit --prefer-offline`).
- Add a "Reinstall" button or force refresh logic.

## Recommended Tool Calls for Next Agent
```json
// Inspect Editor
{
  "name": "read_file",
  "arguments": { "filePath": "/Users/mac/Desktop/project/AiToDo/qwen-code-examples/apps/qwen-bolt-demo/src/components/CodeRenderer/CodeEditorPanel.tsx", "startLine": 1, "endLine": 150 }
}

// Inspect WebContainer Sync Logic
{
  "name": "read_file",
  "arguments": { "filePath": "/Users/mac/Desktop/project/AiToDo/qwen-code-examples/apps/qwen-bolt-demo/src/hooks/useDevServer.ts", "startLine": 1, "endLine": 250 }
}

// Inspect WebContainer Boot Logic
{
  "name": "read_file",
  "arguments": { "filePath": "/Users/mac/Desktop/project/AiToDo/qwen-code-examples/apps/qwen-bolt-demo/src/lib/webcontainer.ts", "startLine": 1, "endLine": 150 }
}
```
