'use client';
import React from 'react';
import { useAppStore } from '@/lib/store';
import NewCollectionModal from '@/components/modals/NewCollectionModal';
import RenameCollectionModal from '@/components/modals/RenameCollectionModal';
import DeleteCollectionModal from '@/components/modals/DeleteCollectionModal';
import SaveRequestModal from '@/components/modals/SaveRequestModal';
import DeleteRequestModal from '@/components/modals/DeleteRequestModal';
import EnvironmentModal from '@/components/modals/EnvironmentModal';
import SettingsModal from '@/components/modals/SettingsModal';
import RenameRequestModal from '@/components/modals/RenameRequestModal';
import CollectionRunnerModal from '@/components/modals/CollectionRunnerModal';
import CollectionDocModal from '@/components/modals/CollectionDocModal';

export default function ModalManager() {
  const { modal } = useAppStore();
  if (!modal) return null;
  switch (modal.type) {
    case 'newCollection': return <NewCollectionModal />;
    case 'renameCollection': return <RenameCollectionModal id={modal.id} initialName={modal.name} />;
    case 'deleteCollection': return <DeleteCollectionModal id={modal.id} name={modal.name} />;
    case 'saveRequest': return <SaveRequestModal tabId={modal.tabId} presetCollectionId={(modal as any).collectionId} />;
    case 'renameRequest': return <RenameRequestModal id={modal.id} initialName={modal.name} />;
    case 'deleteRequest': return <DeleteRequestModal id={modal.id} name={modal.name} />;
    case 'environment': return <EnvironmentModal />;
    case 'settings': return <SettingsModal />;
    case 'collectionRunner': return <CollectionRunnerModal collectionId={modal.collectionId} />;
    case 'collectionDoc': return <CollectionDocModal collectionId={modal.collectionId} />;
    default: return null;
  }
}
