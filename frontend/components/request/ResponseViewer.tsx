'use client';
import React, { useState, useMemo } from 'react';
import { Copy, Check, Search, ArrowRight } from 'lucide-react';
import { RunResponse } from '@/lib/types';
import { statusBg, statusColor, formatSize, formatTime, tryFormatJson } from '@/lib/utils';
import { toast } from 'sonner';

type ViewMode = 'pretty' | 'raw' | 'preview' | 'headers' | 'cookies';

interface Props {
  response?: RunResponse;
  loading: boolean;
  requestUrl?: string;
}

interface ParsedCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: string;
  secure: boolean;
  httpOnly: boolean;
}

function parseCookies(headers: Record<string, string>, requestUrl?: string): ParsedCookie[] {
  const setCookieKey = Object.keys(headers).find(k => k.toLowerCase() === 'set-cookie');
  if (!setCookieKey) return [];
  const val = headers[setCookieKey];
  if (!val) return [];

  let defaultDomain = 'N/A';
  if (requestUrl) {
    try {
      const u = new URL(requestUrl.startsWith('http') ? requestUrl : 'https://' + requestUrl);
      defaultDomain = u.hostname;
    } catch {}
  }

  const cookieStrings: string[] = [];
  let current = '';
  const parts = val.split(',');
  const expiresRegex = /expires\s*=\s*(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (current === '') {
      current = part;
    } else {
      const trimmedLower = current.toLowerCase().trim();
      const isWeekday = expiresRegex.test(trimmedLower);
      if (isWeekday) {
        current += ',' + part;
      } else {
        cookieStrings.push(current.trim());
        current = part;
      }
    }
  }
  if (current) cookieStrings.push(current.trim());

  return cookieStrings.map(str => {
    const segments = str.split(';').map(s => s.trim());
    const first = segments[0] || '';
    const equalIdx = first.indexOf('=');
    const name = equalIdx >= 0 ? first.slice(0, equalIdx) : first;
    const value = equalIdx >= 0 ? first.slice(equalIdx + 1) : '';

    let domain = '';
    let path = '';
    let expires = '';
    let secure = false;
    let httpOnly = false;

    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      const eqIdx = seg.indexOf('=');
      const k = (eqIdx >= 0 ? seg.slice(0, eqIdx) : seg).toLowerCase().trim();
      const v = eqIdx >= 0 ? seg.slice(eqIdx + 1).trim() : '';
      if (k === 'domain') domain = v;
      else if (k === 'path') path = v;
      else if (k === 'expires') expires = v;
      else if (k === 'secure') secure = true;
      else if (k === 'httponly') httpOnly = true;
    }

    return { name, value, domain: domain || defaultDomain, path, expires, secure, httpOnly };
  }).filter(c => c.name);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function highlightMatches(text: string, search: string) {
  if (!search) return text;
  const escaped = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark style="background: rgba(249,115,22,0.45); color: #fff; padding: 0 1px; border-radius: 2px;">$1</mark>');
}

export default function ResponseViewer({ response, loading, requestUrl }: Props) {
  const [mode, setMode] = useState<ViewMode>('pretty');
  const [copied, setCopied] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopy = async () => {
    if (!response) return;
    await navigator.clipboard.writeText(response.body);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const isError = response ? !!response.error : false;

  const prettyBody = useMemo(() => {
    if (!response) return '';
    return mode === 'pretty' ? tryFormatJson(response.body) : response.body;
  }, [mode, response]);

  const parsedCookies = useMemo(() => {
    if (!response) return [];
    return parseCookies(response.headers, requestUrl);
  }, [response, requestUrl]);

  const contentElement = useMemo(() => {
    if (!response) return null;
    if (isError) {
      return (
        <div className="p-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4">
            <div className="text-sm text-red-400 font-semibold mb-1">Request Failed</div>
            <div className="text-xs text-red-300/80 font-mono">{response.error}</div>
          </div>
        </div>
      );
    }
    
    if (mode === 'headers') {
      return (
        <div className="p-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left py-2 px-3 text-[#6b6b6b] font-medium w-1/3">Header</th>
                <th className="text-left py-2 px-3 text-[#6b6b6b] font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(response.headers).map(([k, v]) => (
                <tr key={k} className="border-b border-[#1e1e1e] hover:bg-[#252525]">
                  <td className="py-1.5 px-3 text-[#9b7cb0] font-mono">{k}</td>
                  <td className="py-1.5 px-3 text-[#c4c4c4] font-mono break-all">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (mode === 'cookies') {
      return (
        <div className="p-2">
          <table className="w-full text-xs text-[#d4d4d4]">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-[#6b6b6b]">
                <th className="text-left py-2 px-3 font-medium">Name</th>
                <th className="text-left py-2 px-3 font-medium">Value</th>
                <th className="text-left py-2 px-3 font-medium">Domain</th>
                <th className="text-left py-2 px-3 font-medium">Path</th>
                <th className="text-left py-2 px-3 font-medium">Expires</th>
                <th className="text-left py-2 px-3 font-medium w-[60px]">Flags</th>
              </tr>
            </thead>
            <tbody>
              {parsedCookies.map((c, i) => (
                <tr key={i} className="border-b border-[#1e1e1e] hover:bg-[#252525]">
                  <td className="py-1.5 px-3 text-orange-400 font-semibold font-mono">{c.name}</td>
                  <td className="py-1.5 px-3 font-mono break-all text-[#ce9178]">{c.value}</td>
                  <td className="py-1.5 px-3 font-mono text-cyan-400">{c.domain || 'N/A'}</td>
                  <td className="py-1.5 px-3 font-mono">{c.path || 'N/A'}</td>
                  <td className="py-1.5 px-3 text-[#8b8b8b]">{c.expires || 'Session'}</td>
                  <td className="py-1.5 px-3 text-[10px] font-mono text-[#5b5b5b]">
                    {c.secure && <span className="text-green-500 mr-1" title="Secure">S</span>}
                    {c.httpOnly && <span className="text-blue-500" title="HttpOnly">HTTP</span>}
                    {!c.secure && !c.httpOnly && '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (mode === 'preview') {
      return (
        <div className="flex-1 w-full bg-white relative min-h-[300px]">
          <iframe
            title="Response Preview"
            srcDoc={response.body}
            sandbox="allow-scripts"
            className="absolute inset-0 w-full h-full border-0 bg-white"
          />
        </div>
      );
    }

    return (
      <pre className="p-4 text-xs font-mono text-[#d4d4d4] whitespace-pre-wrap break-all leading-relaxed">
        <JsonHighlight content={prettyBody} isJson={mode === 'pretty'} search={searchQuery} />
      </pre>
    );
  }, [response, mode, prettyBody, parsedCookies, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3">
        <svg className="animate-spin w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
        </svg>
        <span className="text-sm text-[#6b6b6b]">Sending request...</span>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-2 text-[#4a4a4a]">
        <svg className="w-16 h-16 opacity-20" viewBox="0 0 64 64" fill="none" stroke="currentColor">
          <circle cx="32" cy="32" r="28" strokeWidth="2" />
          <path d="M22 32h20M32 22l10 10-10 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="text-sm font-medium text-[#5b5b5b]">Hit Send to get a response</div>
        <div className="text-xs text-[#4a4a4a]">Enter a URL above and press Send</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#2a2a2a] bg-[#1e1e1e]">
        {isError ? (
          <span className="text-xs font-semibold text-red-400 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
            Error
          </span>
        ) : (
          <>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${statusBg(response.status)}`}>
              {response.status} {response.status_text}
            </span>
            <span className="text-xs text-[#6b6b6b]">
              Time: <span className="text-[#a0a0a0]">{formatTime(response.time_ms)}</span>
            </span>
            <span className="text-xs text-[#6b6b6b]">
              Size: <span className="text-[#a0a0a0]">{formatSize(response.size_bytes)}</span>
            </span>
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          {(['pretty', 'raw', 'preview', 'headers', 'cookies'] as ViewMode[]).map(m => {
            if (m === 'cookies' && parsedCookies.length === 0) return null;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 text-xs rounded capitalize transition-colors ${
                  mode === m ? 'bg-[#3a3a3a] text-[#d4d4d4]' : 'text-[#6b6b6b] hover:text-[#d4d4d4]'
                }`}
              >
                {m}
              </button>
            );
          })}
          <button
            onClick={handleCopy}
            className="ml-2 p-1.5 text-[#6b6b6b] hover:text-[#d4d4d4] rounded transition-colors hover:bg-[#2a2a2a]"
            title="Copy response"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {(mode === 'pretty' || mode === 'raw') && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-[#161616] border-b border-[#2a2a2a] shrink-0 select-none">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setSearchQuery(searchInput);
                }
              }}
              placeholder="Search in response body..."
              className="bg-[#222] border border-[#2a2a2a] text-xs text-[#d4d4d4] pl-7 pr-2.5 py-1 rounded outline-none focus:border-orange-500/50 w-64 placeholder-[#4a4a4a] font-sans"
            />
            <Search size={11} className="absolute left-2.5 text-[#5b5b5b]" />
          </div>
          
          <button
            onClick={() => setSearchQuery(searchInput)}
            className="p-1 px-2.5 h-7 bg-[#252525] border border-[#3a3a3a] hover:bg-[#303030] text-[#8b8b8b] hover:text-orange-400 rounded transition-colors cursor-pointer flex items-center gap-1.5 text-[10px] font-semibold"
            title="Find"
          >
            <ArrowRight size={11} />
            <span>Find</span>
          </button>

          {searchQuery && (
            <button
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
              }}
              className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold px-2 py-1 bg-[#2a2a2a] hover:bg-[#333] rounded transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {contentElement}
      </div>
    </div>
  );
}

function JsonHighlight({ content, isJson, search }: { content: string; isJson: boolean; search: string }) {
  if (!isJson) {
    const escaped = escapeHtml(content);
    const highlighted = highlightMatches(escaped, search);
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  }
  try {
    JSON.parse(content);
    let highlighted = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (m, _, __, offset, str) => {
        const after = str.slice(offset + m.length).trimStart();
        if (after.startsWith(':')) {
          return `<span style="color:#9cdcfe">${m}</span>`;
        }
        return `<span style="color:#ce9178">${m}</span>`;
      })
      .replace(/\b(true|false)\b/g, '<span style="color:#569cd6">$1</span>')
      .replace(/\bnull\b/g, '<span style="color:#569cd6">null</span>')
      .replace(/\b(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, '<span style="color:#b5cea8">$1</span>');

    if (search) {
      highlighted = highlightMatches(highlighted, search);
    }
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  } catch {
    const escaped = escapeHtml(content);
    const highlighted = highlightMatches(escaped, search);
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  }
}
