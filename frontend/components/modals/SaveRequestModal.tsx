'use client';
import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export default function SaveRequestModal({ tabId, presetCollectionId }: { tabId: string; presetCollectionId?: number }) {
  const { closeModal, collections, createRequest, tabs, openNewTab } = useAppStore();
  // If tabId is '__pick__', use the currently active tab
  const resolvedTabId = tabId === '__pick__' ? (useAppStore.getState().activeTabId || '') : tabId;
  const tab = tabs.find(t => t.id === resolvedTabId);
  const [name, setName] = useState(tab?.title === 'New Request' ? '' : (tab?.title || ''));
  const [collectionId, setCollectionId] = useState<number | ''>(presetCollectionId || collections[0]?.id || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !collectionId) return;
    setLoading(true);
    try {
      await createRequest(tabId, Number(collectionId), name.trim());
      toast.success('Request saved');
      closeModal();
    } catch {
      toast.error('Failed to save request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Save Request" onClose={closeModal}>
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <div>
          <label className="text-xs text-[#8b8b8b] block mb-1.5">Request Name *</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="My Request"
            className="w-full bg-[#252525] border border-[#3a3a3a] rounded px-3 py-2 text-sm text-[#d4d4d4] outline-none focus:border-orange-500/60 placeholder-[#4a4a4a]"
          />
        </div>
        <div>
          <label className="text-xs text-[#8b8b8b] block mb-1.5">Save to Collection *</label>
          {collections.length === 0 ? (
            <div className="text-xs text-[#6b6b6b] py-2">
              No collections yet. Create one first.
            </div>
          ) : (
            <select
              value={collectionId}
              onChange={e => setCollectionId(Number(e.target.value))}
              className="w-full bg-[#252525] border border-[#3a3a3a] rounded px-3 py-2 text-sm text-[#d4d4d4] outline-none focus:border-orange-500/60"
            >
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2a2a2a]">
          <button type="button" onClick={closeModal}
            className="px-4 py-2 text-sm text-[#8b8b8b] hover:text-[#d4d4d4] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={!name.trim() || !collectionId || loading || collections.length === 0}
            className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded transition-colors font-medium">
            {loading ? 'Saving...' : 'Save Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
