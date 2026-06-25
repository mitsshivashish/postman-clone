'use client';
import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function RenameRequestModal({ id, initialName }: { id: number; initialName: string }) {
  const { closeModal, requestsByCollection, loadCollectionRequests } = useAppStore();
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.updateRequest(id, { name: name.trim() });
      // Reload all collection request lists that might contain this request
      const state = useAppStore.getState();
      Object.keys(state.requestsByCollection).forEach(colId => {
        state.loadCollectionRequests(Number(colId));
      });
      toast.success('Request renamed');
      closeModal();
    } catch {
      toast.error('Failed to rename');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Rename Request" onClose={closeModal} width="w-[420px]">
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <div>
          <label className="text-xs text-[#8b8b8b] block mb-1.5">Request Name</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-[#252525] border border-[#3a3a3a] rounded px-3 py-2 text-sm text-[#d4d4d4] outline-none focus:border-orange-500/60" />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-[#2a2a2a]">
          <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-[#8b8b8b] hover:text-[#d4d4d4]">Cancel</button>
          <button type="submit" disabled={!name.trim() || loading}
            className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded font-medium">
            {loading ? 'Saving...' : 'Rename'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
