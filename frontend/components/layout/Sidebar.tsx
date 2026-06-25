'use client';
import React from 'react';
import { FolderOpen, Clock, Plus, GitBranch, FileText, Users, Monitor } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import CollectionsSidebar from '@/components/sidebar/CollectionsSidebar';
import HistorySidebar from '@/components/sidebar/HistorySidebar';

const NAV_ITEMS = [
  { id: 'collections', icon: FolderOpen, label: 'Collections' },
  { id: 'history', icon: Clock, label: 'History' },
] as const;

const PLACEHOLDER_ITEMS = [
  { icon: GitBranch, label: 'Environments' },
  { icon: FileText, label: 'APIs' },
  { icon: Users, label: 'Team' },
  { icon: Monitor, label: 'Monitors' },
];

export default function Sidebar() {
  const { sidebarTab, setSidebarTab, openModal } = useAppStore();

  return (
    <div className="flex h-full bg-[#1a1a1a]">
      {/* Icon rail */}
      <div className="w-12 flex flex-col items-center py-2 gap-1 border-r border-[#2a2a2a] bg-[#161616]">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setSidebarTab(item.id)}
            title={item.label}
            className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${
              sidebarTab === item.id
                ? 'bg-orange-500/20 text-orange-400'
                : 'text-[#6b6b6b] hover:text-[#d4d4d4] hover:bg-[#252525]'
            }`}
          >
            <item.icon size={16} />
          </button>
        ))}

        <div className="w-6 border-t border-[#2a2a2a] my-1" />

        {PLACEHOLDER_ITEMS.map(item => (
          <button
            key={item.label}
            title={`${item.label} (Coming Soon)`}
            className="w-9 h-9 flex items-center justify-center rounded text-[#3a3a3a] hover:text-[#5b5b5b] transition-colors cursor-not-allowed"
          >
            <item.icon size={16} />
          </button>
        ))}

        <div className="mt-auto">
          <button
            onClick={() => openModal({ type: 'newCollection' })}
            title="New Collection"
            className="w-9 h-9 flex items-center justify-center rounded text-[#6b6b6b] hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Panel content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-[#2a2a2a]">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setSidebarTab(item.id)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                sidebarTab === item.id
                  ? 'bg-[#252525] text-[#d4d4d4]'
                  : 'text-[#6b6b6b] hover:text-[#d4d4d4]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          {sidebarTab === 'collections' ? <CollectionsSidebar /> : <HistorySidebar />}
        </div>
      </div>
    </div>
  );
}
