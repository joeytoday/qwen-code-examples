'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Terminal from './Terminal';
import { ChevronUp, ChevronDown, Plus, X } from 'lucide-react';
import { useTheme } from 'next-themes';

interface TerminalTab {
  id: string;
  label: string;
  type: 'terminal' | 'output';
}

interface TerminalPanelProps {
  devServerLogs?: string[];
  sessionId?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

let terminalIdCounter = 1;

export function TerminalPanel({ 
  devServerLogs = [], 
  isOpen = true, 
  onToggle,
}: TerminalPanelProps) {
  const { theme } = useTheme();
  const isDark = theme !== 'light';

  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: 'terminal-0', label: 'Terminal', type: 'terminal' },
    { id: 'output', label: 'Output', type: 'output' },
  ]);
  const [activeTabId, setActiveTabId] = useState('terminal-0');
  const outputRef = useRef<HTMLDivElement>(null);
  // Track which terminal tabs have been activated (mounted) at least once
  // Default terminal is always mounted
  const mountedTabsRef = useRef<Set<string>>(new Set(['terminal-0']));

  // Auto-scroll output
  useEffect(() => {
    if (activeTabId === 'output' && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [devServerLogs, activeTabId]);

  const addTerminalTab = useCallback(() => {
    const newId = `terminal-${terminalIdCounter++}`;
    const newTab: TerminalTab = {
      id: newId,
      label: `Terminal ${terminalIdCounter}`,
      type: 'terminal',
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      // If closing the active tab, switch to the first remaining tab
      if (tabId === activeTabId && filtered.length > 0) {
        setActiveTabId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeTabId]);

  const outputLogCount = devServerLogs.length;

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'bg-[#1a1b26]' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between h-9 px-2 border-b flex-none ${
        isDark ? 'border-gray-800 bg-[#1a1b26]' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center gap-1 h-full text-sm overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`flex items-center gap-1 h-full border-b-2 px-2 cursor-pointer transition-colors group ${
                activeTabId === tab.id
                  ? isDark
                    ? 'border-blue-500 text-white'
                    : 'border-blue-500 text-gray-900'
                  : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span className="whitespace-nowrap select-none">
                {tab.type === 'output' ? `${tab.label} (${outputLogCount})` : tab.label}
              </span>
              {/* Show close button for non-default tabs */}
              {tab.id !== 'terminal-0' && tab.id !== 'output' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className={`ml-1 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  }`}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          
          {/* Add terminal button */}
          <button
            onClick={addTerminalTab}
            className={`flex items-center justify-center h-full px-2 transition-colors ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'
            }`}
            title="New Terminal"
          >
            <Plus size={14} />
          </button>
        </div>
        
        {onToggle && (
          <button
            onClick={onToggle}
            className={`ml-2 transition-colors flex-shrink-0 ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'
            }`}
            title={isOpen ? "Minimize" : "Maximize"}
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {/* Terminal Tabs - Lazy mount: only render after first activation */}
        {tabs.filter(t => t.type === 'terminal').map(tab => {
          const isActive = activeTabId === tab.id;
          // Track which tabs have been activated (mounted) at least once
          if (isActive && !mountedTabsRef.current.has(tab.id)) {
            mountedTabsRef.current.add(tab.id);
          }
          const isMounted = mountedTabsRef.current.has(tab.id);
          if (!isMounted) return null;

          return (
            <div 
              key={tab.id}
              className={`absolute inset-0 w-full h-full ${isDark ? 'bg-[#1a1b26]' : 'bg-white'}`}
              style={{ 
                visibility: isActive ? 'visible' : 'hidden',
                zIndex: isActive ? 10 : 0,
                display: isActive ? 'block' : 'none'
              }}
            >
              <Terminal isPrimary={tab.id === 'terminal-0'} />
            </div>
          );
        })}

        {/* Output Tab */}
        <div 
          ref={outputRef}
          className={`absolute inset-0 w-full h-full p-4 overflow-auto font-mono text-sm ${
            isDark ? 'bg-[#1a1b26]' : 'bg-white'
          }`}
          style={{ 
            visibility: activeTabId === 'output' ? 'visible' : 'hidden',
            zIndex: activeTabId === 'output' ? 10 : 0 
          }}
        >
          {devServerLogs.length === 0 ? (
            <div className={`italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              No output logs yet...
            </div>
          ) : (
            devServerLogs.map((log, i) => (
              <div key={i} className={`whitespace-pre-wrap mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
