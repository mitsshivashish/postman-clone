'use client';
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { KeyValue } from '@/lib/types';

interface Props {
  rows: KeyValue[];
  onChange: (rows: KeyValue[]) => void;
  placeholder?: { key?: string; value?: string };
  readOnly?: boolean;
}

export default function KeyValueEditor({ rows, onChange, placeholder, readOnly }: Props) {
  const ensureTrailingEmpty = (list: KeyValue[]): KeyValue[] => {
    const last = list[list.length - 1];
    if (!last || last.key !== '' || last.value !== '') {
      return [...list, { key: '', value: '', enabled: true }];
    }
    return list;
  };

  const update = (idx: number, field: keyof KeyValue, value: string | boolean) => {
    const next = rows.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    onChange(ensureTrailingEmpty(next));
  };

  const remove = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    onChange(ensureTrailingEmpty(next));
  };

  const add = () => {
    onChange([...rows, { key: '', value: '', enabled: true }]);
  };

  const displayed = ensureTrailingEmpty(rows);

  return (
    <div className="flex flex-col text-sm">
      {/* Header */}
      <div className="grid grid-cols-[20px_1fr_1fr_32px] gap-1 px-2 py-1 border-b border-[#2a2a2a] text-[11px] text-[#6b6b6b] uppercase tracking-wider">
        <span></span>
        <span>{placeholder?.key || 'Key'}</span>
        <span>{placeholder?.value || 'Value'}</span>
        <span></span>
      </div>

      {displayed.map((row, idx) => {
        const isLast = idx === displayed.length - 1 && row.key === '' && row.value === '';
        return (
          <div
            key={idx}
            className="grid grid-cols-[20px_1fr_1fr_32px] gap-1 px-2 py-[3px] border-b border-[#1e1e1e] group hover:bg-[#1a1a1a]"
          >
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={row.enabled}
                disabled={readOnly || isLast}
                onChange={e => update(idx, 'enabled', e.target.checked)}
                className="w-3 h-3 accent-orange-500 cursor-pointer disabled:opacity-30"
              />
            </div>
            <input
              value={row.key}
              placeholder={placeholder?.key || 'Key'}
              readOnly={readOnly}
              onChange={e => update(idx, 'key', e.target.value)}
              className="bg-transparent text-[#d4d4d4] placeholder-[#4a4a4a] outline-none border-none py-1 px-1 focus:bg-[#252525] rounded text-xs font-mono"
            />
            <input
              value={row.value}
              placeholder={placeholder?.value || 'Value'}
              readOnly={readOnly}
              onChange={e => update(idx, 'value', e.target.value)}
              className="bg-transparent text-[#d4d4d4] placeholder-[#4a4a4a] outline-none border-none py-1 px-1 focus:bg-[#252525] rounded text-xs font-mono"
            />
            <div className="flex items-center justify-center">
              {!isLast && !readOnly && (
                <button
                  onClick={() => remove(idx)}
                  className="opacity-0 group-hover:opacity-100 text-[#6b6b6b] hover:text-red-400 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {!readOnly && (
        <button
          onClick={add}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6b6b6b] hover:text-orange-400 hover:bg-[#1a1a1a] transition-colors w-fit mt-1"
        >
          <Plus size={12} /> Add Row
        </button>
      )}
    </div>
  );
}
