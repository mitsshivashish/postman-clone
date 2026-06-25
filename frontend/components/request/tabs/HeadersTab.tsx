'use client';
import React from 'react';
import { KeyValue } from '@/lib/types';
import KeyValueEditor from '@/components/ui/KeyValueEditor';

interface Props {
  headers: KeyValue[];
  onChange: (headers: KeyValue[]) => void;
  bodyType?: string;
  rawType?: string;
  url?: string;
  bodyContent?: string;
}

export default function HeadersTab({ headers, onChange, bodyType, rawType, url, bodyContent }: Props) {
  const [isBulk, setIsBulk] = React.useState(false);
  const [bulkText, setBulkText] = React.useState('');
  const [showAuto, setShowAuto] = React.useState(false);

  const autoHeaders = React.useMemo(() => {
    const list = [];
    
    // Host
    let host = 'N/A';
    if (url) {
      try {
        const u = new URL(url.startsWith('http') ? url : 'https://' + url);
        host = u.hostname;
      } catch {}
    }
    list.push({ key: 'Host', value: host, description: 'Target host name' });
    
    // User-Agent
    list.push({ key: 'User-Agent', value: 'PostmanClone/1.0 (contact: admin@postmanclone.local)', description: 'Client identifier' });
    
    // Accept
    list.push({ key: 'Accept', value: '*/*', description: 'Accepted response types' });
    
    // Accept-Encoding
    list.push({ key: 'Accept-Encoding', value: 'gzip, deflate, br', description: 'Supported compression algorithms' });
    
    // Connection
    list.push({ key: 'Connection', value: 'keep-alive', description: 'Connection persistence setting' });
    
    // Content-Type
    if (bodyType && bodyType !== 'none') {
      let ct = 'text/plain';
      if (bodyType === 'raw') {
        ct = rawType === 'JSON' ? 'application/json' : 'text/plain';
      } else if (bodyType === 'x-www-form-urlencoded') {
        ct = 'application/x-www-form-urlencoded';
      } else if (bodyType === 'form-data') {
        ct = 'multipart/form-data; boundary=...';
      }
      list.push({ key: 'Content-Type', value: ct, description: 'Format of the request body' });
    }
    
    // Content-Length
    if (bodyType && bodyType !== 'none' && bodyContent) {
      try {
        const len = new Blob([bodyContent]).size;
        list.push({ key: 'Content-Length', value: String(len), description: 'Size of the request body in bytes' });
      } catch {
        list.push({ key: 'Content-Length', value: String(bodyContent.length), description: 'Size of the request body in bytes' });
      }
    }
    
    return list;
  }, [url, bodyType, rawType, bodyContent]);

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
      onChange(bulkTextToRows(bulkText));
    } else {
      setBulkText(rowsToBulkText(headers));
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
            onChange(bulkTextToRows(val));
          }}
          placeholder="Header-Key: value&#10;Another-Header: value"
          spellCheck={false}
          className="w-full flex-1 bg-[#151515] border border-[#2a2a2a] rounded p-3 text-xs font-mono text-[#d4d4d4] outline-none resize-none min-h-[140px] leading-relaxed placeholder-[#3a3a3a]"
        />
      ) : (
        <KeyValueEditor
          rows={headers}
          onChange={onChange}
          placeholder={{ key: 'Header', value: 'Value' }}
        />
      )}

      {/* Auto-generated Headers expandable section */}
      <div className="mt-4 border-t border-[#2a2a2a] pt-3 px-4 select-none">
        <button
          onClick={() => setShowAuto(!showAuto)}
          className="flex items-center gap-1.5 text-xs text-[#8b8b8b] hover:text-[#d4d4d4] transition-colors cursor-pointer"
        >
          <span className="bg-[#252525] text-[10px] text-orange-400 border border-[#3a3a3a] font-bold px-1.5 py-0.5 rounded-full">
            {autoHeaders.length}
          </span>
          <span>auto-generated request headers</span>
        </button>
        
        {showAuto && (
          <div className="mt-2.5 flex flex-col gap-1.5 pl-6 border-l border-[#2a2a2a] py-1">
            {autoHeaders.map(h => (
              <div key={h.key} className="grid grid-cols-[140px_1fr_120px] gap-2 py-0.5 text-xs font-mono">
                <span className="text-[#8b8b8b] font-medium">{h.key}</span>
                <span className="text-[#6b6b6b] truncate" title={h.value}>{h.value}</span>
                <span className="text-[10px] text-[#4a4a4a] italic text-right">{h.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
