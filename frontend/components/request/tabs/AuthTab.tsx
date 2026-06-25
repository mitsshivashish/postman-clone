'use client';
import React from 'react';
import { AuthType, AuthData } from '@/lib/types';

interface Props {
  authType: AuthType;
  authData: AuthData;
  onChange: (authType: AuthType, authData: AuthData) => void;
}

const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'apikey', label: 'API Key' },
];

export default function AuthTab({ authType, authData, onChange }: Props) {
  return (
    <div className="flex flex-col">
      {/* Auth type selector */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-[#2a2a2a]">
        {AUTH_TYPES.map(at => (
          <button
            key={at.value}
            onClick={() => onChange(at.value, authData)}
            className="px-3 py-1.5 text-xs rounded transition-colors border bg-transparent text-[#8b8b8b] border-transparent hover:text-[#d4d4d4] hover:bg-[#252525] cursor-pointer"
            style={authType === at.value ? { backgroundColor: 'rgba(249,115,22,0.15)', color: '#f97316', borderColor: 'rgba(249,115,22,0.3)' } : {}}
          >
            {at.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {authType === 'none' && (
          <div className="flex items-center justify-center py-6 text-[#4a4a4a] text-xs text-center">
            <div>
              <div className="text-[#6b6b6b] mb-1">No authentication selected.</div>
              <div>This request does not use any authorization.</div>
            </div>
          </div>
        )}

        {authType === 'bearer' && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-[#8b8b8b] block mb-1.5">Token</label>
              <input
                value={authData.token || ''}
                onChange={e => onChange(authType, { ...authData, token: e.target.value })}
                placeholder="Enter Bearer token or {{variable}}"
                className="w-full bg-[#252525] border border-[#3a3a3a] rounded px-3 py-2 text-xs text-[#d4d4d4] font-mono outline-none focus:border-orange-500/50 placeholder-[#4a4a4a]"
              />
            </div>
            <p className="text-[10px] text-[#5b5b5b]">
              Token will be sent as: <code className="text-orange-400/70">Authorization: Bearer &lt;token&gt;</code>
            </p>
          </div>
        )}

        {authType === 'basic' && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-[#8b8b8b] block mb-1.5">Username</label>
              <input
                value={authData.username || ''}
                onChange={e => onChange(authType, { ...authData, username: e.target.value })}
                placeholder="Username or {{variable}}"
                className="w-full bg-[#252525] border border-[#3a3a3a] rounded px-3 py-2 text-xs text-[#d4d4d4] font-mono outline-none focus:border-orange-500/50 placeholder-[#4a4a4a]"
              />
            </div>
            <div>
              <label className="text-xs text-[#8b8b8b] block mb-1.5">Password</label>
              <input
                type="password"
                value={authData.password || ''}
                onChange={e => onChange(authType, { ...authData, password: e.target.value })}
                placeholder="Password or {{variable}}"
                className="w-full bg-[#252525] border border-[#3a3a3a] rounded px-3 py-2 text-xs text-[#d4d4d4] font-mono outline-none focus:border-orange-500/50 placeholder-[#4a4a4a]"
              />
            </div>
            <p className="text-[10px] text-[#5b5b5b]">
              Credentials will be Base64 encoded and sent as: <code className="text-orange-400/70">Authorization: Basic &lt;credentials&gt;</code>
            </p>
          </div>
        )}

        {authType === 'apikey' && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-[#8b8b8b] block mb-1.5">Key</label>
              <input
                value={authData.apiKeyKey || ''}
                onChange={e => onChange(authType, { ...authData, apiKeyKey: e.target.value })}
                placeholder="Header or Parameter Key (e.g. X-API-Key)"
                className="w-full bg-[#252525] border border-[#3a3a3a] rounded px-3 py-2 text-xs text-[#d4d4d4] font-mono outline-none focus:border-orange-500/50 placeholder-[#4a4a4a]"
              />
            </div>
            <div>
              <label className="text-xs text-[#8b8b8b] block mb-1.5">Value</label>
              <input
                value={authData.apiKeyValue || ''}
                onChange={e => onChange(authType, { ...authData, apiKeyValue: e.target.value })}
                placeholder="Value or {{variable}}"
                className="w-full bg-[#252525] border border-[#3a3a3a] rounded px-3 py-2 text-xs text-[#d4d4d4] font-mono outline-none focus:border-orange-500/50 placeholder-[#4a4a4a]"
              />
            </div>
            <div>
              <label className="text-xs text-[#8b8b8b] block mb-1.5 font-sans">Add to</label>
              <select
                value={authData.apiKeyAddTo || 'header'}
                onChange={e => onChange(authType, { ...authData, apiKeyAddTo: e.target.value as any })}
                className="bg-[#252525] border border-[#3a3a3a] rounded px-3 py-2 text-xs text-[#d4d4d4] outline-none focus:border-orange-500/50 cursor-pointer font-sans"
              >
                <option value="header">Header</option>
                <option value="query">Query Params</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
