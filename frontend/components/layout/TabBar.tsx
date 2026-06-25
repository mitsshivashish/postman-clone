'use client';
import React from 'react';
import { X, Plus } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { methodColor } from '@/lib/utils';

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, closeOtherTabs, closeAllTabs, openNewTab } = useAppStore();
  const [contextTabId, setContextTabId] = React.useState<string | null>(null);
  const [menuPos, setMenuPos] = React.useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextTabId(tabId);
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  React.useEffect(() => {
    const handleClose = () => setContextTabId(null);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, []);

  return (
    <div className="flex items-center h-9 bg-[#1a1a1a] border-b border-[#2a2a2a] overflow-x-auto shrink-0 scrollbar-hide relative">
      {tabs.map(tab => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          onContextMenu={e => handleContextMenu(e, tab.id)}
          className={`group flex items-center gap-1.5 px-3 h-full border-r border-[#2a2a2a] cursor-pointer shrink-0 max-w-[200px] transition-colors relative ${
            activeTabId === tab.id
              ? 'bg-[#252525] border-t-2 border-t-orange-500'
              : 'hover:bg-[#1f1f1f]'
          }`}
        >
          <span className={`text-[10px] font-bold shrink-0 ${methodColor(tab.method)}`}>
            {tab.method.slice(0, 3)}
          </span>
          <span className={`text-xs truncate ${activeTabId === tab.id ? 'text-[#d4d4d4]' : 'text-[#8b8b8b]'}`}>
            {tab.title}
          </span>
          {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 ml-0.5" />}
          <button
            onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
            className="shrink-0 opacity-0 group-hover:opacity-100 text-[#6b6b6b] hover:text-[#d4d4d4] transition-opacity ml-1"
          >
            <X size={12} />
          </button>
        </div>
      ))}

      <button
        onClick={openNewTab}
        className="flex items-center justify-center w-9 h-full shrink-0 text-[#6b6b6b] hover:text-[#d4d4d4] hover:bg-[#252525] transition-colors cursor-pointer"
      >
        <Plus size={14} />
      </button>

      {contextTabId && (
        <div
          style={{ top: menuPos.y, left: menuPos.x }}
          className="fixed z-[1000] bg-[#252525] border border-[#3a3a3a] rounded shadow-2xl py-1 text-xs text-[#d4d4d4] w-36 font-sans select-none"
        >
          <button
            onClick={() => closeTab(contextTabId)}
            className="w-full text-left px-3 py-1.5 hover:bg-[#333] hover:text-orange-400 transition-colors cursor-pointer"
          >
            Close Tab
          </button>
          <button
            onClick={() => closeOtherTabs(contextTabId)}
            className="w-full text-left px-3 py-1.5 hover:bg-[#333] hover:text-orange-400 transition-colors cursor-pointer"
          >
            Close Other Tabs
          </button>
          <button
            onClick={() => closeAllTabs()}
            className="w-full text-left px-3 py-1.5 hover:bg-[#333] hover:text-orange-400 transition-colors cursor-pointer"
          >
            Close All Tabs
          </button>
        </div>
      )}
    </div>
  );
}
