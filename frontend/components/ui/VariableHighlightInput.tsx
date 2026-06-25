'use client';
import React, { useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
}

/**
 * URL input that visually highlights {{variable}} — green if resolved, red if missing.
 * Uses a hidden overlay div with the same font/padding as the real input.
 */
export default function VariableHighlightInput({ value, onChange, onKeyDown, placeholder, className }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { environments, activeEnvironmentId } = useAppStore();

  const activeEnv = environments.find(e => e.id === activeEnvironmentId);
  const varMap: Record<string, string> = {};
  activeEnv?.variables.forEach(v => { if (v.is_enabled) varMap[v.key] = v.current_value || v.value; });

  useEffect(() => {
    if (!overlayRef.current) return;
    const html = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmed = key.trim();
        const exists = trimmed in varMap;
        const color = exists ? '#f97316' : '#ef4444';
        const bg = exists ? 'rgba(249,115,22,0.12)' : 'rgba(239,68,68,0.12)';
        return `<span style="color:${color};background:${bg};border-radius:2px;padding:0 2px">${match}</span>`;
      });
    overlayRef.current.innerHTML = html || `<span style="color:#4a4a4a">${placeholder || ''}</span>`;
  }, [value, activeEnvironmentId, environments]);

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Highlight overlay — visually behind the input */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="absolute inset-0 px-3 flex items-center pointer-events-none text-sm font-mono whitespace-pre overflow-hidden"
        style={{ color: 'transparent' }}
      />
      {/* Real input — transparent text so overlay shows through */}
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={`relative w-full h-full bg-transparent px-3 text-sm font-mono outline-none placeholder-[#4a4a4a] ${className || ''}`}
        style={{ caretColor: '#d4d4d4', color: value ? 'transparent' : undefined, WebkitTextFillColor: value ? 'transparent' : undefined }}
      />
      {/* Visible text layer on top (same content, proper color) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 px-3 flex items-center pointer-events-none text-sm font-mono whitespace-pre overflow-hidden"
        dangerouslySetInnerHTML={{
          __html: value
            ? value
              .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/\{\{([^}]+)\}\}/g, (match, key) => {
                const exists = key.trim() in varMap;
                const color = exists ? '#f97316' : '#ef4444';
                const bg = exists ? 'rgba(249,115,22,0.12)' : 'rgba(239,68,68,0.12)';
                return `<span style="color:${color};background:${bg};border-radius:2px;padding:0 2px">${match}</span>`;
              })
              .replace(/((?!\{\{)[^\{])+|\{(?!\{)/g, (m) => `<span style="color:#d4d4d4">${m}</span>`)
            : ''
        }}
      />
    </div>
  );
}
