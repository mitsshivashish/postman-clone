'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import TopBar from './TopBar';
import TabBar from './TabBar';
import Sidebar from './Sidebar';
import RequestBuilder from '@/components/request/RequestBuilder';
import ModalManager from './ModalManager';
import { Toaster } from 'sonner';

import { X } from 'lucide-react';

const MIN_SIDEBAR = 220;
const MAX_SIDEBAR = 480;

export default function Workspace() {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    loadCollections,
    loadEnvironments,
    loadHistory,
    leftPanelWidth,
    setLeftPanelWidth,
    sidebarCollapsed,
    setSidebarCollapsed,
    environments,
    activeEnvironmentId
  } = useAppStore();
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const activeEnv = environments.find(e => e.id === activeEnvironmentId);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadCollections();
    loadEnvironments();
    loadHistory();
  }, []);

  // Set first tab active if none
  useEffect(() => {
    if (!activeTabId && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTabId]);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = leftPanelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      const newW = Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, startW.current + delta));
      setLeftPanelWidth(newW);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Global keyboard shortcut to toggle left sidebar
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [sidebarCollapsed]);

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] overflow-hidden select-none">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          style={{
            width: sidebarCollapsed ? 0 : leftPanelWidth,
            minWidth: sidebarCollapsed ? 0 : MIN_SIDEBAR,
            maxWidth: sidebarCollapsed ? 0 : MAX_SIDEBAR,
          }}
          className={`flex flex-col border-r border-[#2a2a2a] overflow-hidden shrink-0 transition-all duration-150 ease-in-out ${
            sidebarCollapsed ? 'border-r-0 opacity-0 pointer-events-none' : ''
          }`}
        >
          <Sidebar />
        </div>

        {/* Resize handle */}
        {!sidebarCollapsed && (
          <div
            onMouseDown={onMouseDown}
            className="w-1 hover:w-1.5 bg-[#2a2a2a] hover:bg-orange-500/40 cursor-col-resize transition-all shrink-0"
          />
        )}

        {/* Main area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <TabBar />
          <div className="flex-1 overflow-hidden">
            {activeTab ? (
              <RequestBuilder key={activeTab.id} tab={activeTab} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="h-7 bg-[#161616] border-t border-[#2a2a2a] flex items-center justify-between px-3 text-xs text-[#8b8b8b] shrink-0 font-sans">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand Sidebar (Ctrl + \\)' : 'Collapse Sidebar (Ctrl + \\)'}
            className="p-1 hover:text-[#d4d4d4] hover:bg-[#252525] rounded transition-colors"
          >
            {sidebarCollapsed ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>

          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] text-[#6b6b6b]">Local Agent Online</span>
          </div>

          <span className="text-[#3a3a3a] select-none">|</span>

          <button
            onClick={() => setShowShortcutsModal(true)}
            className="flex items-center gap-1 text-[11px] hover:text-[#d4d4d4] transition-colors"
          >
            <span>Keyboard Shortcuts</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {activeEnv && (
            <div className="flex items-center gap-1 text-[#6b6b6b]">
              <span>Active Environment:</span>
              <span className="text-orange-400 font-mono font-medium">{activeEnv.name}</span>
              <span className="bg-orange-500/10 text-orange-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
                {activeEnv.variables.filter(v => v.is_enabled).length} variables
              </span>
            </div>
          )}
          <span className="text-[#3a3a3a] select-none">|</span>
          <span className="text-[#5b5b5b]">PostmanX Clone v1.0</span>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs">
          <div className="w-[420px] bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] bg-[#161616]">
              <span className="text-xs font-semibold text-[#d4d4d4] uppercase tracking-wider">Keyboard Shortcuts</span>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-[#6b6b6b] hover:text-[#d4d4d4] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#252525] pb-2">
                <span className="text-xs text-[#8b8b8b]">Send HTTP Request</span>
                <kbd className="px-2 py-0.5 bg-[#252525] border border-[#3a3a3a] rounded text-[10px] text-orange-400 font-mono font-semibold">Ctrl + Enter</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-[#252525] pb-2">
                <span className="text-xs text-[#8b8b8b]">Save / Update Request</span>
                <kbd className="px-2 py-0.5 bg-[#252525] border border-[#3a3a3a] rounded text-[10px] text-[#d4d4d4] font-mono font-semibold">Ctrl + S</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-[#252525] pb-2">
                <span className="text-xs text-[#8b8b8b]">Toggle Left Sidebar</span>
                <kbd className="px-2 py-0.5 bg-[#252525] border border-[#3a3a3a] rounded text-[10px] text-[#d4d4d4] font-mono font-semibold">Ctrl + \</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-[#252525] pb-2">
                <span className="text-xs text-[#8b8b8b]">Toggle Code Snippet Panel</span>
                <kbd className="px-2 py-0.5 bg-[#252525] border border-[#3a3a3a] rounded text-[10px] text-[#d4d4d4] font-mono font-semibold">Alt + C</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b8b8b]">Open New Request Tab</span>
                <kbd className="px-2 py-0.5 bg-[#252525] border border-[#3a3a3a] rounded text-[10px] text-[#d4d4d4] font-mono font-semibold">Click '+' Tab</kbd>
              </div>
            </div>
            <div className="flex justify-end px-4 py-3 bg-[#161616] border-t border-[#2a2a2a]">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalManager />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: { background: '#252525', border: '1px solid #3a3a3a', color: '#d4d4d4' },
        }}
      />
    </div>
  );
}

function EmptyState() {
  const { openNewTab } = useAppStore();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-[#4a4a4a]">
      <svg className="w-20 h-20 opacity-20" viewBox="0 0 80 80" fill="none" stroke="currentColor">
        <rect x="10" y="20" width="60" height="45" rx="4" strokeWidth="2" />
        <path d="M25 40h30M25 50h20" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="14" r="4" strokeWidth="2" />
        <circle cx="40" cy="14" r="4" strokeWidth="2" />
        <circle cx="60" cy="14" r="4" strokeWidth="2" />
      </svg>
      <div className="text-sm font-medium text-[#6b6b6b]">No request open</div>
      <button
        onClick={openNewTab}
        className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors font-semibold"
      >
        New Request
      </button>
    </div>
  );
}
