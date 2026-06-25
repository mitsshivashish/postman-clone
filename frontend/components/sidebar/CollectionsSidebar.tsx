'use client';
import React, { useState } from 'react';
import {
  ChevronRight, ChevronDown, Folder, FolderOpen,
  MoreHorizontal, Plus, Trash2, Edit2, FileText, Play
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { methodBg } from '@/lib/utils';
import { Collection, SavedRequest } from '@/lib/types';
import { toast } from 'sonner';

export default function CollectionsSidebar() {
  const {
    collections, requestsByCollection,
    toggleCollection, isCollectionExpanded, openSavedRequest, openModal, loadCollectionRequests,
    deleteSavedRequest, exportCollection, importCollection
  } = useAppStore();
  const [search, setSearch] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'collection' | 'request'; id: number; name: string } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filtered = collections.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleCollectionContext = (e: React.MouseEvent, col: Collection) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'collection', id: col.id, name: col.name });
  };

  const handleRequestContext = (e: React.MouseEvent, req: SavedRequest) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'request', id: req.id, name: req.name });
  };

  const triggerImportFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          await importCollection(parsed);
          toast.success('Collection imported successfully');
        } catch (err: any) {
          toast.error('Invalid collection JSON file');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      toast.error('Failed to read file');
    }
    e.target.value = '';
  };

  React.useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  return (
    <div className="flex flex-col h-full" onClick={() => setContextMenu(null)}>
      {/* Search */}
      <div className="px-3 py-2 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2 bg-[#252525] rounded px-2.5 py-1.5">
          <svg className="w-3.5 h-3.5 text-[#6b6b6b] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search collections..."
            className="bg-transparent text-xs text-[#d4d4d4] placeholder-[#4a4a4a] outline-none w-full"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="px-3 py-2 border-b border-[#2a2a2a]">
        <div className="flex gap-2">
          <button
            onClick={() => openModal({ type: 'newCollection' })}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-orange-400 border border-orange-400/30 rounded hover:bg-orange-400/10 transition-colors cursor-pointer"
          >
            <Plus size={13} />
            New Collection
          </button>
          <button
            onClick={triggerImportFileSelect}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#8b8b8b] border border-[#3a3a3a] rounded hover:bg-[#252525] hover:text-[#d4d4d4] transition-colors cursor-pointer"
          >
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Collections list */}
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <div className="text-center text-[#4a4a4a] text-xs py-8 px-4">
            {search ? 'No collections match your search' : 'No collections yet. Create one!'}
          </div>
        )}

        {filtered.map(col => {
          const isExpanded = isCollectionExpanded(col.id);
          const requests = requestsByCollection[col.id] || [];

          return (
            <div key={col.id}>
              {/* Collection row */}
              <div
                className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer hover:bg-[#252525] group select-none"
                onClick={() => {
                  toggleCollection(col.id);
                  if (!requestsByCollection[col.id]) loadCollectionRequests(col.id);
                }}
                onContextMenu={e => handleCollectionContext(e, col)}
              >
                <span className="text-[#6b6b6b] shrink-0">
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
                <span className="text-orange-400/80 shrink-0">
                  {isExpanded ? <FolderOpen size={13} /> : <Folder size={13} />}
                </span>
                <span className="text-[#d4d4d4] text-xs truncate flex-1">{col.name}</span>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                  <button
                    className="p-0.5 text-[#6b6b6b] hover:text-[#d4d4d4]"
                    onClick={e => { e.stopPropagation(); openModal({ type: 'saveRequest', tabId: '__pick__', collectionId: col.id }); }}
                    title="Add request"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    className="p-0.5 text-[#6b6b6b] hover:text-[#d4d4d4]"
                    onClick={e => { e.stopPropagation(); handleCollectionContext(e, col); }}
                  >
                    <MoreHorizontal size={12} />
                  </button>
                </div>
              </div>

              {/* Requests */}
              {isExpanded && (
                <div className="ml-4 border-l border-[#2a2a2a]">
                  {requests.length === 0 && (
                    <div className="text-[#4a4a4a] text-xs py-2 px-4 italic">No requests</div>
                  )}
                  {requests.map(req => (
                    <div
                      key={req.id}
                      className="flex items-center gap-2 pl-3 pr-2 py-1.5 cursor-pointer hover:bg-[#252525] group"
                      onClick={() => openSavedRequest(req)}
                      onContextMenu={e => handleRequestContext(e, req)}
                    >
                      <span className={`text-[10px] font-bold shrink-0 px-1 py-0.5 rounded border ${methodBg(req.method)}`}>
                        {req.method.slice(0, 3)}
                      </span>
                      <span className="text-[#c4c4c4] text-xs truncate flex-1">{req.name}</span>
                      <button
                        className="opacity-0 group-hover:opacity-100 text-[#6b6b6b] hover:text-red-400"
                        onClick={e => {
                          e.stopPropagation();
                          openModal({ type: 'deleteRequest', id: req.id, name: req.name });
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[1000] bg-[#252525] border border-[#3a3a3a] rounded shadow-xl py-1 min-w-[160px] text-xs select-none"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.type === 'collection' ? (
            <>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-[#d4d4d4] hover:bg-[#333] cursor-pointer"
                onClick={() => { openModal({ type: 'collectionRunner', collectionId: contextMenu.id }); setContextMenu(null); }}>
                <Play size={12} /> Run Collection
              </button>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-[#d4d4d4] hover:bg-[#333] cursor-pointer"
                onClick={() => { openModal({ type: 'collectionDoc', collectionId: contextMenu.id }); setContextMenu(null); }}>
                <FileText size={12} /> View Documentation
              </button>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-[#d4d4d4] hover:bg-[#333] cursor-pointer"
                onClick={() => { exportCollection(contextMenu.id, contextMenu.name); setContextMenu(null); }}>
                <svg className="w-3 h-3 text-[#d4d4d4]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export Collection
              </button>
              <div className="border-t border-[#2a2a2a] my-1" />
              <button className="flex items-center gap-2 w-full px-3 py-2 text-[#d4d4d4] hover:bg-[#333] cursor-pointer"
                onClick={() => { openModal({ type: 'renameCollection', id: contextMenu.id, name: contextMenu.name }); setContextMenu(null); }}>
                <Edit2 size={12} /> Rename
              </button>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-red-400 hover:bg-[#333] cursor-pointer"
                onClick={() => { openModal({ type: 'deleteCollection', id: contextMenu.id, name: contextMenu.name }); setContextMenu(null); }}>
                <Trash2 size={12} /> Delete
              </button>
            </>
          ) : (
            <>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-[#d4d4d4] hover:bg-[#333] cursor-pointer"
                onClick={() => { openModal({ type: 'renameRequest', id: contextMenu.id, name: contextMenu.name }); setContextMenu(null); }}>
                <Edit2 size={12} /> Rename
              </button>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-red-400 hover:bg-[#333] cursor-pointer"
                onClick={() => { openModal({ type: 'deleteRequest', id: contextMenu.id, name: contextMenu.name }); setContextMenu(null); }}>
                <Trash2 size={12} /> Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
