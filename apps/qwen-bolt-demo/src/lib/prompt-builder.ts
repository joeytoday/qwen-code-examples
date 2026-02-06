export type HistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// Simplified guidelines - minimal functional constraints only
const CORE_GUIDELINES = `
1. **Tool Usage**:
   - You have native permissions to read/write files and run shell commands.
   - ALWAYS use provided tools (write_file, replace_string_in_file) to modify files.
   - Double-check file paths are workspace-relative.

2. **Runtime Environment**:
   - Target: **WebContainer** (Browser-based Node.js).
   - Shell: Use sh/jsh. **NO** zsh/bash.
   - Database: Use **Supabase** (client-side) or mock data. No sqlite/mongo.
`;

export function getSystemInstructions(knowledge?: string): string {
  const parts: string[] = [];
  
  parts.push(`<CORE_GUIDELINES>\n${CORE_GUIDELINES.trim()}\n</CORE_GUIDELINES>`);

  if (knowledge && knowledge.trim()) {
    parts.push(`<GLOBAL_INSTRUCTIONS>\n${knowledge.trim()}\n</GLOBAL_INSTRUCTIONS>`);
  }

  return parts.join('\n\n');
}

export function buildUserMessage(message: string, filesContext?: string): string {
  const parts: string[] = [];
  
  if (filesContext && filesContext.trim()) {
    parts.push(filesContext.trim());
  }

  parts.push(message);
  
  return parts.join('\n\n');
}
