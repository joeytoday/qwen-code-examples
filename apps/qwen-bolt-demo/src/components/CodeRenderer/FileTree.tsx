'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-react';
import { FileTreeProps } from './types';
import { buildFileTree, getFileIcon, FileNode } from './utils';

export const FileTree: React.FC<FileTreeProps> = ({ files, activeFile, onSelectFile }) => {
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

  return (
    <div className="w-64 border-r border-gray-700 bg-gray-900 overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-400">FILES</h3>
      </div>
      <div className="py-2">
        {fileTree.map((node) => renderNode(node))}
      </div>
    </div>
  );
};
