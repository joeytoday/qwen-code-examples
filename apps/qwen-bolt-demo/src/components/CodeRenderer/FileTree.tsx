'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Download } from 'lucide-react';
import { FileTreeProps } from './types';
import { buildFileTree, getFileIcon, FileNode } from './utils';

export const FileTree: React.FC<FileTreeProps & { sessionId?: string }> = ({ files, activeFile, onSelectFile, sessionId }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const fileTree = buildFileTree(files);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isActive = node.type === 'file' && node.path === activeFile;
    const Icon = node.type === 'directory' 
      ? (isExpanded ? FolderOpen : Folder)
      : getFileIcon(node.name);

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-800/50 transition-colors ${
            isActive ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleFolder(node.path);
            } else {
              onSelectFile(node.path);
            }
          }}
        >
          {node.type === 'directory' && (
            <span className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm truncate">{node.name}</span>
        </div>
        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // 下载项目
  const handleDownload = async () => {
    if (!sessionId) {
      alert('No session ID available');
      return;
    }

    try {
      const response = await fetch(`/api/download?sessionId=${sessionId}`);
      
      if (!response.ok) {
        const error = await response.json();
        alert(`Download failed: ${error.error || 'Unknown error'}`);
        return;
      }

      // 创建下载链接
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${sessionId.substring(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download project');
    }
  };

  return (
    <div className="w-64 border-r border-gray-700 bg-gray-900 overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400">FILES</h3>
        {sessionId && Object.keys(files).length > 0 && (
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors group"
            title="Download Project"
          >
            <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
          </button>
        )}
      </div>
      <div className="py-2">
        {fileTree.map((node) => renderNode(node))}
      </div>
    </div>
  );
};
