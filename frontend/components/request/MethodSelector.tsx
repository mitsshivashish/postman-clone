'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { HttpMethod } from '@/lib/types';
import { methodColor } from '@/lib/utils';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

interface Props {
  value: HttpMethod;
  onChange: (method: HttpMethod) => void;
}

export default function MethodSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 h-full bg-[#1e1e1e] hover:bg-[#252525] border-r border-[#2a2a2a] rounded-l-md transition-colors min-w-[100px]"
      >
        <span className={`text-sm font-bold ${methodColor(value)}`}>{value}</span>
        <ChevronDown size={13} className="text-[#6b6b6b]" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#252525] border border-[#3a3a3a] rounded-md shadow-2xl overflow-hidden min-w-[120px]">
          {METHODS.map(m => (
            <button
              key={m}
              onClick={() => { onChange(m); setOpen(false); }}
              className={`flex items-center w-full px-3 py-2 text-sm font-semibold hover:bg-[#333] transition-colors ${methodColor(m)} ${m === value ? 'bg-[#2a2a2a]' : ''}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
