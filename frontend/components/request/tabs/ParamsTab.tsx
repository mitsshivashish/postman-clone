'use client';
import React from 'react';
import { KeyValue } from '@/lib/types';
import KeyValueEditor from '@/components/ui/KeyValueEditor';

interface Props {
  params: KeyValue[];
  url: string;
  onChange: (params: KeyValue[], url?: string) => void;
}

export default function ParamsTab({ params, url, onChange }: Props) {
  const [isBulk, setIsBulk] = React.useState(false);
  const [bulkText, setBulkText] = React.useState('');

  const handleChange = (rows: KeyValue[]) => {
    try {
      const base = url.split('?')[0];
      const active = rows.filter(r => r.enabled && r.key.trim());
      const qs = active.map(r => `${encodeURIComponent(r.key)}=${encodeURIComponent(r.value)}`).join('&');
      const newUrl = qs ? `${base}?${qs}` : base;
      onChange(rows, newUrl);
    } catch {
      onChange(rows);
    }
  };

  const rowsToBulkText = (rows: KeyValue[]) => {
    return rows
      .filter(r => r.key.trim() || r.value.trim())
      .map(r => `${r.key}: ${r.value}`)
      .join('\n');
  };

  const bulkTextToRows = (text: string) => {
    const list = text.split('\n').map(line => {
      const idx = line.indexOf(':');
      if (idx >= 0) {
        return { key: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim(), enabled: true };
      }
      const idxEq = line.indexOf('=');
      if (idxEq >= 0) {
        return { key: line.slice(0, idxEq).trim(), value: line.slice(idxEq + 1).trim(), enabled: true };
      }
      return { key: line.trim(), value: '', enabled: true };
    }).filter(r => r.key.trim());
    return [...list, { key: '', value: '', enabled: true }];
  };

  const toggleBulk = () => {
    if (isBulk) {
      handleChange(bulkTextToRows(bulkText));
    } else {
      setBulkText(rowsToBulkText(params));
    }
    setIsBulk(!isBulk);
  };

  return (
    <div className="py-2 flex flex-col h-full">
      <div className="flex justify-end px-4 mb-1">
        <button
          onClick={toggleBulk}
          className="text-[10px] bg-[#252525] border border-[#3a3a3a] hover:bg-[#333] text-orange-400 font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors"
        >
          {isBulk ? 'Key-Value Edit' : 'Bulk Edit'}
        </button>
      </div>

      {isBulk ? (
        <textarea
          value={bulkText}
          onChange={e => {
            const val = e.target.value;
            setBulkText(val);
            handleChange(bulkTextToRows(val));
          }}
          placeholder="parameter_key: value&#10;another_key: value"
          spellCheck={false}
          className="w-full flex-1 bg-[#151515] border border-[#2a2a2a] rounded p-3 text-xs font-mono text-[#d4d4d4] outline-none resize-none min-h-[140px] leading-relaxed placeholder-[#3a3a3a]"
        />
      ) : (
        <KeyValueEditor
          rows={params}
          onChange={handleChange}
          placeholder={{ key: 'Parameter', value: 'Value' }}
        />
      )}
    </div>
  );
}
