'use client';
import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export default function RenameCollectionModal({ id, initialName }: { id: number; initialName: string }) {
  const { closeModal, renameCollection } = useAppStore();
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await renameCollection(id, name.trim());
      toast.success('Collection renamed');
      closeModal();
    } catch {
      toast.error('Failed to rename collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Rename Collection" onClose={closeModal}>
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <div>
          <label className="text-xs text-[#8b8b8b] block mb-1.5">Collection Name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-[#252525] border border-[#3a3a3a] rounded px-3 py-2 text-sm text-[#d4d4d4] outline-none focus:border-orange-500/60"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2a2a2a]">
          <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-[#8b8b8b] hover:text-[#d4d4d4] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={!name.trim() || loading}
            className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded transition-colors font-medium">
            {loading ? 'Saving...' : 'Rename'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
