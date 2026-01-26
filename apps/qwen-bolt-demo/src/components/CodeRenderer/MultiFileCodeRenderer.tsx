'use client';

import React, { useState, useEffect } from 'react';
import { MultiFileCodeRendererProps } from './types';
import { FileTree } from './FileTree';
import { CodeEditorPanel } from './CodeEditorPanel';
import { PanelLeft } from 'lucide-react';

export const MultiFileCodeRenderer: React.FC<
  MultiFileCodeRendererProps & { tabBarExtraContent?: React.ReactNode; sessionId?: string }
> = ({
  files,
  readOnly = true,
  isComplete = true,
  onCodeChange,
  activeFile: propActiveFile,
  onSelectFile,
  tabBarExtraContent,
  sessionId,
}) => {
  const [activeFile, setActiveFile] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize active file
  useEffect(() => {
    if (propActiveFile) {
      setActiveFile(propActiveFile);
    } else {
      // Set first file as active if none specified
      const firstFile = Object.keys(files)[0];
      if (firstFile) {
        setActiveFile(firstFile);
      }
    }
  }, [propActiveFile, files]);

  // Handle file selection
  const handleSelectFile = (path: string) => {
    setActiveFile(path);
    onSelectFile?.(path);
  };

  // Handle code change with proper typing
  const handleCodeChange = (code: string, filename?: string) => {
    if (onCodeChange && filename) {
      onCodeChange(code, filename);
    }
  };

  return (
    <div className="relative flex h-full min-h-0 w-full bg-gray-900">
      {/* Sidebar */}
      {sidebarOpen && (
        <FileTree files={files} activeFile={activeFile} onSelectFile={handleSelectFile} sessionId={sessionId} />
      )}

      {/* Editor Area */}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label={sidebarOpen ? 'Collapse file tree' : 'Expand file tree'}
            >
              <PanelLeft
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  sidebarOpen ? '' : 'rotate-180'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-300 truncate">{activeFile}</span>
          </div>

          {tabBarExtraContent}
        </div>

        {/* Editor */}
        <div className="min-h-0 flex-1">
          <CodeEditorPanel
            file={activeFile}
            code={files[activeFile] || ''}
            readOnly={readOnly}
            isComplete={isComplete}
            onChange={handleCodeChange}
          />
        </div>
      </div>
    </div>
  );
};
