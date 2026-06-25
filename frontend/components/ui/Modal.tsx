'use client';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

export default function Modal({ title, onClose, children, width = 'w-[480px]' }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`${width} bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg shadow-2xl flex flex-col max-h-[85vh]`}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2a2a]">
          <h2 className="text-sm font-semibold text-[#e0e0e0]">{title}</h2>
          <button onClick={onClose} className="text-[#6b6b6b] hover:text-[#e0e0e0] transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
