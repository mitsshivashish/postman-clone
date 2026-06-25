'use client';
import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

export default function DeleteCollectionModal({ id, name }: { id: number; name: string }) {
  const { closeModal, deleteCollection } = useAppStore();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteCollection(id);
      toast.success(`Collection "${name}" deleted`);
      closeModal();
    } catch {
      toast.error('Failed to delete collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Delete Collection" onClose={closeModal} width="w-[420px]">
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm text-[#d4d4d4]">
              Are you sure you want to delete <span className="font-semibold text-white">"{name}"</span>?
            </p>
            <p className="text-xs text-[#6b6b6b] mt-1">
              This will permanently delete the collection and all its requests. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2a2a2a]">
          <button type="button" onClick={closeModal}
            className="px-4 py-2 text-sm text-[#8b8b8b] hover:text-[#d4d4d4] transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded transition-colors font-medium">
            {loading ? 'Deleting...' : 'Delete Collection'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
