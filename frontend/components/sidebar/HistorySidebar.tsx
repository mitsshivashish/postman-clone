'use client';
import React, { useState } from 'react';
import { Trash2, Clock, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { methodBg, statusColor, formatDate, truncateUrl } from '@/lib/utils';

export default function HistorySidebar() {
  const { history, openHistoryItem, clearHistory, deleteHistoryItem, loadingHistory } = useAppStore();
  const [search, setSearch] = useState('');

  const filtered = history.filter(h =>
    h.url.toLowerCase().includes(search.toLowerCase()) ||
    h.method.toLowerCase().includes(search.toLowerCase())
  );

  // Group by date
  const groups: Record<string, typeof history> = {};
  filtered.forEach(item => {
    const date = new Date(item.sent_at);
    const now = new Date();
    let label = 'Older';
    const diff = now.getTime() - date.getTime();
    if (diff < 86_400_000) label = 'Today';
    else if (diff < 172_800_000) label = 'Yesterday';
    else if (diff < 604_800_000) label = 'This Week';
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  });

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older'];

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-2 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2 bg-[#252525] rounded px-2.5 py-1.5">
          <svg className="w-3.5 h-3.5 text-[#6b6b6b] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search history..."
            className="bg-transparent text-xs text-[#d4d4d4] placeholder-[#4a4a4a] outline-none w-full"
          />
        </div>
      </div>

      {/* Clear button */}
      {history.length > 0 && (
        <div className="px-3 py-2 border-b border-[#2a2a2a]">
          <button
            onClick={() => clearHistory()}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[#8b8b8b] border border-[#3a3a3a] rounded hover:bg-[#2a2a2a] hover:text-red-400 hover:border-red-400/30 transition-colors"
          >
            <Trash2 size={12} />
            Clear History
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {loadingHistory && (
          <div className="text-center text-[#4a4a4a] text-xs py-8">Loading...</div>
        )}

        {!loadingHistory && filtered.length === 0 && (
          <div className="text-center text-[#4a4a4a] text-xs py-8 px-4 flex flex-col items-center gap-2">
            <Clock size={24} className="text-[#3a3a3a]" />
            {search ? 'No matching history' : 'No history yet. Send a request!'}
          </div>
        )}

        {groupOrder.map(label => {
          const items = groups[label];
          if (!items || items.length === 0) return null;
          return (
            <div key={label}>
              <div className="px-3 py-1 text-[10px] text-[#5b5b5b] uppercase tracking-wider font-medium border-b border-[#1e1e1e] bg-[#161616]">
                {label}
              </div>
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-[#252525] group border-b border-[#1a1a1a]"
                  onClick={() => openHistoryItem(item)}
                >
                  <span className={`text-[9px] font-bold shrink-0 px-1 py-0.5 rounded border mt-0.5 ${methodBg(item.method)}`}>
                    {item.method.slice(0, 3)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#c4c4c4] text-xs truncate">{truncateUrl(item.url, 35)}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.response_status && (
                        <span className={`text-[10px] font-mono ${statusColor(item.response_status)}`}>
                          {item.response_status}
                        </span>
                      )}
                      {item.response_error && (
                        <span className="text-[10px] text-red-400">Error</span>
                      )}
                      <span className="text-[10px] text-[#5b5b5b]">{formatDate(item.sent_at)}</span>
                    </div>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-[#6b6b6b] hover:text-red-400 shrink-0 mt-0.5"
                    onClick={e => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
