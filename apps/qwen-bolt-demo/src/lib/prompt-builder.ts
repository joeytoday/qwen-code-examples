export type HistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function buildPrompt(history: HistoryMessage[], message: string, knowledge?: string, filesContext?: string): string {
  const parts: string[] = [];

  const systemInstructions: string[] = [];
  
  // High-priority global defaults
  systemInstructions.push(`<CORE_GUIDELINES>
1. **Framework Preference**: 
   - When asked to create a React project, ALWAYS use **Vite** (@vitejs/plugin-react).
   - NEVER use Create-React-App (react-scripts) as it is deprecated and slow in WebContainer environments.
   - For Vue, use Vite as well.
   - **UI Library**: Prefer **Shadcn UI** (Radix UI + Tailwind CSS) patterns for professional components. Use standard 'lucide-react' for icons.
   - **Styling**: Always use **Tailwind CSS** unless explicitly asked otherwise. Use 'tailwind-merge' and 'clsx' for class manipulation.

2. **Project Structure**:
   - Ensure 'package.json' has a "dev" script: "vite".
   - Ensure 'index.html' is in the root directory (standard Vite structure).
   - Use 'src/main.tsx' or 'src/main.jsx' as the entry point.
   - For Database requests: Suggest **Supabase** (client-side) patterns. If a DB is needed, assume the user will provide a NEXT_PUBLIC_SUPABASE_URL and key, or mock the data if not provided.

3. **Performance**: 
   - Keep initial dependencies minimal to speed up installation.
   - **KEEP EXTENSIONS**: If the project uses .tsx, continue using .tsx. Do not switch to .jsx unless asked.

4. **Capabilities & Permissions**:
   - You have FULL PERMISSION to create, read, update, and delete files in the current workspace.
   - You can run shell commands.
   - You do not need to ask for permission for these actions.
   - **MANDATORY**: When you want to modify a file, you MUST use the appropriate tool (\`write_file\`, \`replace_string_in_file\`, etc.) to apply the changes.
   - **DO NOT** just print the code code block in the chat processing. This will NOT update the file. You MUST use the TOOL.
   - **CRITICAL**: When the user asks to change text (e.g., "Hello" to "你好"), you MUST ensure the new text is actually in your tool call payload. **Double-check your JSON**.
   - **PREFER** \`replace_string_in_file\` for small text changes to avoid rewriting the whole file and missing details.
   - If you encounter path issues, try to list the directory contents to find the correct path.

5. **Tool Usage Enforcement**:
   - If you present code to the user, you must ALSO call \`write_file\` or \`replace_string_in_file\` to save it.
   - Verify that your paths are relative to the workspace root.
</CORE_GUIDELINES>`);
  
  if (knowledge && knowledge.trim()) {
    systemInstructions.push(`<GLOBAL_INSTRUCTIONS>
${knowledge.trim()}
</GLOBAL_INSTRUCTIONS>`);
  }
  
  if (filesContext && filesContext.trim()) {
    systemInstructions.push(filesContext.trim());
  }
  
  if (systemInstructions.length > 0) {
    parts.push(`SYSTEM: You must follow these global instructions and use the provided context files in all your responses:

${systemInstructions.join('\n\n')}

These instructions and files apply to the entire conversation. Always consider them when responding to user requests.`);
  }
  
  // CRITICAL FIX: Do NOT manually append history here.
  // The SDK maintains session state via 'session_id'. 
  // Appending history manually causes "Double History" confusion for the model,
  // leading it to think tasks are already completed or hallucinate the context.
  /*
  if (Array.isArray(history)) {
    for (const item of history) {
      if (!item?.content) continue;
      const role = (item.role || 'user').toUpperCase();
      parts.push(`${role}: ${item.content}`);
    }
  }
  */
  
  parts.push(`USER: ${message}`);
  return parts.join('\n\n');
}
