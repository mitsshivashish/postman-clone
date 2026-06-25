'use client';
import React from 'react';
import { BodyType, RawBodyType, KeyValue } from '@/lib/types';
import KeyValueEditor from '@/components/ui/KeyValueEditor';

interface Props {
  bodyType: BodyType;
  bodyContent: string;
  rawType: RawBodyType;
  onChange: (bodyType: BodyType, bodyContent: string, rawType: RawBodyType) => void;
}

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'none', label: 'none' },
  { value: 'raw', label: 'raw' },
  { value: 'form-data', label: 'form-data' },
  { value: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' },
];

const RAW_TYPES: RawBodyType[] = ['JSON', 'Text'];

function parseKV(content: string): KeyValue[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [{ key: '', value: '', enabled: true }];
}

export default function BodyTab({ bodyType, bodyContent, rawType, onChange }: Props) {
  const [jsonError, setJsonError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (bodyType === 'raw' && rawType === 'JSON' && bodyContent.trim()) {
      try {
        JSON.parse(bodyContent);
        setJsonError(null);
      } catch (err: any) {
        setJsonError(err.message || 'Invalid JSON');
      }
    } else {
      setJsonError(null);
    }
  }, [bodyContent, bodyType, rawType]);

  const repairJson = (str: string): string => {
    let output = '';
    let inString = false;
    let stringChar = '';
    const stack: ('{' | '[')[] = [];
    
    str = str.trim();
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if (inString) {
        if (char === '\\') {
          output += char;
          if (i + 1 < str.length) {
            output += str[i + 1];
            i++;
          }
        } else if (char === stringChar) {
          inString = false;
          output += '"';
        } else {
          output += char;
        }
      } else {
        if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
          output += '"';
        } else if (char === '{') {
          stack.push('{');
          output += char;
        } else if (char === '[') {
          stack.push('[');
          output += char;
        } else if (char === '}') {
          if (stack.length > 0 && stack[stack.length - 1] === '{') {
            stack.pop();
          }
          output += char;
        } else if (char === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === '[') {
            stack.pop();
          }
          output += char;
        } else {
          output += char;
        }
      }
    }
    
    if (inString) {
      output += '"';
    }
    
    // Remove trailing commas before closing braces/brackets
    output = output.replace(/,\s*([}\]])/g, '$1');
    
    // Auto-complete missing closing brackets/braces
    while (stack.length > 0) {
      const last = stack.pop();
      if (last === '{') output += '}';
      if (last === '[') output += ']';
    }
    
    return output;
  };

  const handleBeautify = () => {
    if (!bodyContent.trim()) return;
    try {
      const parsed = JSON.parse(bodyContent);
      onChange(bodyType, JSON.stringify(parsed, null, 2), rawType);
      setJsonError(null);
    } catch (err) {
      try {
        // Quoting unquoted keys (supporting words, hyphens, and underscores)
        let repaired = bodyContent.trim().replace(/([{\s,])([a-zA-Z0-9_-]+)(?=\s*:)/g, '$1"$2"');
        // Parse & repair single quotes, trailing commas, missing braces/brackets
        repaired = repairJson(repaired);
        const parsed = JSON.parse(repaired);
        onChange(bodyType, JSON.stringify(parsed, null, 2), rawType);
        setJsonError(null);
      } catch (err2: any) {
        setJsonError(err2.message || 'Cannot beautify invalid JSON');
      }
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[180px]">
      {/* Body type selector */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-[#2a2a2a] shrink-0">
        {BODY_TYPES.map(bt => (
          <label key={bt.value} className="flex items-center gap-1.5 cursor-pointer">
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                bodyType === bt.value ? 'border-orange-500' : 'border-[#4a4a4a]'
              }`}
              onClick={() => onChange(bt.value, bodyContent, rawType)}
            >
              {bodyType === bt.value && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
            </div>
            <span
              className={`text-xs cursor-pointer select-none transition-colors ${
                bodyType === bt.value ? 'text-orange-400' : 'text-[#8b8b8b] hover:text-[#d4d4d4]'
              }`}
              onClick={() => onChange(bt.value, bodyContent, rawType)}
            >
              {bt.label}
            </span>
          </label>
        ))}

        {/* Raw type selector & Beautify */}
        {bodyType === 'raw' && (
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#252525] rounded p-0.5 border border-[#3a3a3a]">
              {RAW_TYPES.map(rt => (
                <button
                  key={rt}
                  onClick={() => onChange(bodyType, bodyContent, rt)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    rawType === rt ? 'bg-[#3a3a3a] text-orange-400' : 'text-[#8b8b8b] hover:text-[#d4d4d4]'
                  }`}
                >
                  {rt}
                </button>
              ))}
            </div>
            {rawType === 'JSON' && (
              <button
                onClick={handleBeautify}
                className="px-2.5 py-1 text-xs bg-[#252525] border border-[#3a3a3a] hover:bg-[#303030] text-[#8b8b8b] hover:text-orange-400 rounded transition-colors font-medium cursor-pointer"
              >
                Beautify
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body content */}
      <div className="flex-1 flex flex-col min-h-0">
        {bodyType === 'none' && (
          <div className="flex items-center justify-center py-10 text-[#4a4a4a] text-xs">
            This request does not have a body
          </div>
        )}

        {bodyType === 'raw' && (
          <div className="flex-1 flex flex-col min-h-0 relative">
            <textarea
              value={bodyContent}
              onChange={e => onChange(bodyType, e.target.value, rawType)}
              placeholder={rawType === 'JSON' ? '{\n  "key": "value"\n}' : 'Enter raw text...'}
              spellCheck={false}
              className="w-full flex-1 bg-[#1a1a1a] text-[#d4d4d4] text-xs font-mono p-4 outline-none resize-none min-h-[120px] border-0 placeholder-[#3a3a3a] leading-relaxed"
            />
            {jsonError && (
              <div className="px-4 py-2 bg-red-950/20 border-t border-red-500/20 text-red-400 text-[10px] font-mono select-none flex items-center gap-1.5 shrink-0">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>JSON Error: {jsonError}</span>
              </div>
            )}
          </div>
        )}

        {(bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') && (
          <div className="py-2 overflow-y-auto max-h-full">
            <KeyValueEditor
              rows={parseKV(bodyContent)}
              onChange={rows => onChange(bodyType, JSON.stringify(rows), rawType)}
              placeholder={{ key: 'Key', value: 'Value' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
