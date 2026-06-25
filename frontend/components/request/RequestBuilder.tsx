'use client';
import React, { useState, useEffect } from 'react';
import { Send, Save, Code, Edit2, X, Clipboard, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { RequestTab, KeyValue, HttpMethod, BodyType, RawBodyType, AuthType } from '@/lib/types';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import MethodSelector from './MethodSelector';
import ParamsTab from './tabs/ParamsTab';
import HeadersTab from './tabs/HeadersTab';
import BodyTab from './tabs/BodyTab';
import AuthTab from './tabs/AuthTab';
import ResponseViewer from './ResponseViewer';
import ResizableSplit from '@/components/ui/ResizableSplit';

const REQUEST_TABS = [
  'Params',
  'Authorization',
  'Headers',
  'Body',
  'Pre-request Script',
  'Tests',
  'Settings'
] as const;

function UrlInput({ value, onChange, onEnter }: { value: string; onChange: (v: string) => void; onEnter: () => void }) {
  const { environments, activeEnvironmentId } = useAppStore();
  const [showSuggest, setShowSuggest] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  const varMap: Record<string, string> = {};
  environments.find(e => e.id === activeEnvironmentId)?.variables.forEach(v => {
    if (v.is_enabled) varMap[v.key] = v.current_value || v.value;
  });

  const filteredVars = Object.keys(varMap).filter(k =>
    k.toLowerCase().includes(filterText.toLowerCase())
  );

  useEffect(() => {
    const lastOpen = value.lastIndexOf('{{');
    const lastClose = value.lastIndexOf('}}');
    if (lastOpen >= 0 && lastOpen > lastClose) {
      const sub = value.slice(lastOpen + 2);
      if (!sub.includes('/') && !sub.includes('?') && !sub.includes('&')) {
        setShowSuggest(true);
        setFilterText(sub.trim());
        setActiveIdx(0);
        return;
      }
    }
    setShowSuggest(false);
  }, [value]);

  const handleSelect = (key: string) => {
    const lastOpen = value.lastIndexOf('{{');
    const prefix = value.slice(0, lastOpen);
    const newValue = `${prefix}{{${key}}}`;
    onChange(newValue);
    setShowSuggest(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggest && filteredVars.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(prev => (prev + 1) % filteredVars.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(prev => (prev - 1 + filteredVars.length) % filteredVars.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelect(filteredVars[activeIdx]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggest(false);
      }
    } else {
      if (e.key === 'Enter') {
        onEnter();
      }
    }
  };

  const parts: { text: string; isVar: boolean; found?: boolean }[] = [];
  let last = 0;
  const re = /\{\{([^}]+)\}\}/g;
  let m;
  while ((m = re.exec(value)) !== null) {
    if (m.index > last) parts.push({ text: value.slice(last, m.index), isVar: false });
    parts.push({ text: m[0], isVar: true, found: m[1].trim() in varMap });
    last = m.index + m[0].length;
  }
  if (last < value.length) parts.push({ text: value.slice(last), isVar: false });

  return (
    <div className="relative flex-1 h-full">
      <div aria-hidden className="absolute inset-0 px-3 flex items-center pointer-events-none text-sm font-mono whitespace-pre overflow-hidden">
        {value ? parts.map((p, i) => p.isVar
          ? <span key={i} style={{ color: p.found ? '#f97316' : '#ef4444', background: p.found ? 'rgba(249,115,22,0.13)' : 'rgba(239,68,68,0.13)', borderRadius: 2, padding: '0 1px' }}>{p.text}</span>
          : <span key={i} style={{ color: '#d4d4d4' }}>{p.text}</span>
        ) : <span style={{ color: '#4a4a4a' }}>Enter URL or paste text</span>}
      </div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
        placeholder=""
        className="absolute inset-0 w-full h-full bg-transparent px-3 text-sm font-mono outline-none"
        style={{ color: 'transparent', caretColor: '#d4d4d4' }}
      />

      {showSuggest && filteredVars.length > 0 && (
        <div className="absolute top-full left-0 mt-1 z-[100] bg-[#252525] border border-[#3a3a3a] rounded-md shadow-2xl overflow-hidden min-w-[200px] max-h-[160px] overflow-y-auto font-sans">
          {filteredVars.map((v, idx) => (
            <button
              key={v}
              onClick={() => handleSelect(v)}
              className={`flex items-center justify-between w-full px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                idx === activeIdx ? 'bg-orange-500/25 text-orange-400 font-semibold' : 'text-[#d4d4d4] hover:bg-[#333]'
              }`}
            >
              <span className="font-mono text-orange-400">{"{{" + v + "}}"}</span>
              <span className="text-[10px] text-[#6b6b6b] truncate max-w-[90px]">{varMap[v]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props { tab: RequestTab; }

export default function RequestBuilder({ tab }: Props) {
  const { updateTab, openModal, activeEnvironmentId, environments, settings } = useAppStore();
  const [activeReqTab, setActiveReqTab] = useState<typeof REQUEST_TABS[number]>('Params');
  const [showCodePanel, setShowCodePanel] = useState(false);

  // Rename & Description State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempDesc, setTempDesc] = useState('');

  const countActive = (rows: KeyValue[]) => rows.filter(r => r.enabled && r.key.trim()).length;

  const handleSend = async () => {
    if (!tab.url.trim()) { toast.error('Please enter a URL'); return; }
    updateTab(tab.id, { loading: true, response: undefined });
    try {
      const result = await api.runRequest({
        method: tab.method,
        url: tab.url,
        headers: tab.headers,
        params: tab.params,
        body_type: tab.body_type,
        body_content: tab.body_content,
        body_raw_type: tab.body_raw_type,
        auth_type: tab.auth_type,
        auth_data: tab.auth_data,
        environment_id: activeEnvironmentId,
        follow_redirects: settings.followRedirects,
        verify_ssl: settings.sslVerification,
        timeout_ms: settings.timeout,
      });
      updateTab(tab.id, { response: result, loading: false });
      useAppStore.getState().loadHistory();
    } catch (err: any) {
      toast.error(err.message || 'Request failed');
      updateTab(tab.id, { loading: false });
    }
  };

  const handleSave = () => {
    if (tab.savedRequestId) {
      useAppStore.getState().updateSavedRequest(tab.savedRequestId, tab).then(() => toast.success('Request saved')).catch(() => toast.error('Failed to save'));
    } else {
      openModal({ type: 'saveRequest', tabId: tab.id });
    }
  };

  const finishRename = () => {
    setIsEditingName(false);
    const name = tempName.trim();
    if (!name || name === tab.title) return;
    updateTab(tab.id, { title: name });
    if (tab.savedRequestId) {
      useAppStore.getState().updateSavedRequest(tab.savedRequestId, {
        ...tab,
        title: name
      }).catch(() => toast.error('Failed to rename saved request'));
    }
  };

  const saveDescription = () => {
    setIsEditingDesc(false);
    updateTab(tab.id, { description: tempDesc });
    if (tab.savedRequestId) {
      useAppStore.getState().updateSavedRequest(tab.savedRequestId, {
        ...tab,
        description: tempDesc
      }).then(() => toast.success('Description updated')).catch(() => toast.error('Failed to update description'));
    }
  };

  const handleUrlChange = (url: string) => {
    let title = tab.title;
    if (!tab.savedRequestId) {
      try { const u = new URL(url.startsWith('http') ? url : 'https://' + url); title = u.pathname === '/' ? u.hostname : u.pathname; } catch {}
    }
    try {
      const u = new URL(url.startsWith('http') ? url : 'https://' + url);
      const newParams: KeyValue[] = [];
      u.searchParams.forEach((value, key) => newParams.push({ key, value, enabled: true }));
      if (newParams.length > 0) { updateTab(tab.id, { url, params: [...newParams, { key: '', value: '', enabled: true }], title }); return; }
    } catch {}
    updateTab(tab.id, { url, title });
  };

  // Keyboard Shortcuts (Send on Ctrl+Enter, Save on Ctrl+S, Code Toggle on Alt+C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setShowCodePanel(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tab, activeEnvironmentId, showCodePanel]);

  return (
    <div className="flex h-full bg-[#1a1a1a]">
      {/* Left panel: Request Builder Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Request Name and Description Editor Header */}
        <div className="px-4 py-2 bg-[#1e1e1e] border-b border-[#2a2a2a] flex flex-col select-none">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
              tab.method === 'GET' ? 'bg-green-500/20 text-green-400' :
              tab.method === 'POST' ? 'bg-yellow-500/20 text-yellow-400' :
              tab.method === 'PUT' ? 'bg-blue-500/20 text-blue-400' :
              tab.method === 'PATCH' ? 'bg-orange-500/20 text-orange-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {tab.method}
            </span>

            {isEditingName ? (
              <input
                type="text"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                onBlur={finishRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') finishRename();
                  if (e.key === 'Escape') { setTempName(tab.title); setIsEditingName(false); }
                }}
                className="bg-[#252525] border border-orange-500/50 text-[#d4d4d4] text-xs font-semibold px-2 py-0.5 rounded outline-none focus:ring-1 focus:ring-orange-500/20"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => { setTempName(tab.title); setIsEditingName(true); }}>
                <span className="text-xs font-semibold text-[#d4d4d4] group-hover:text-orange-400 transition-colors">{tab.title}</span>
                <Edit2 size={10} className="text-[#5b5b5b] group-hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            )}
          </div>

          <div className="text-[11px] text-[#6b6b6b] mt-0.5">
            {isEditingDesc ? (
              <div className="flex flex-col gap-1.5 mt-1 max-w-xl">
                <textarea
                  value={tempDesc}
                  onChange={e => setTempDesc(e.target.value)}
                  placeholder="Add request description... (e.g. endpoint details, parameters)"
                  className="w-full bg-[#252525] border border-[#3a3a3a] text-xs text-[#c4c4c4] p-1.5 rounded outline-none focus:border-orange-500/60 font-sans resize-y min-h-[50px] leading-relaxed placeholder-[#3a3a3a]"
                  autoFocus
                />
                <div className="flex gap-1.5 justify-end">
                  <button onClick={() => setIsEditingDesc(false)} className="px-2 py-0.5 text-[10px] text-[#8b8b8b] hover:text-[#d4d4d4] transition-colors">Cancel</button>
                  <button onClick={saveDescription} className="px-2 py-0.5 text-[10px] bg-orange-500 hover:bg-orange-600 text-white rounded font-medium transition-colors">Save</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => { setTempDesc(tab.description || ''); setIsEditingDesc(true); }}
                className="hover:bg-[#252525]/30 hover:text-[#c4c4c4] p-1 -ml-1 rounded cursor-pointer transition-colors max-w-xl truncate"
              >
                {tab.description ? tab.description : <span className="italic text-[#5b5b5b]">Add request description...</span>}
              </div>
            )}
          </div>
        </div>

        {/* URL Bar row */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2a2a] bg-[#1e1e1e]">
          <div className="flex flex-1 items-stretch border border-[#2a2a2a] rounded-md h-9 focus-within:border-orange-500/50 transition-colors">
            <MethodSelector value={tab.method} onChange={m => updateTab(tab.id, { method: m })} />
            <UrlInput value={tab.url} onChange={handleUrlChange} onEnter={handleSend} />
          </div>
          <button onClick={handleSend} disabled={tab.loading}
            className="flex items-center gap-2 px-5 h-9 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors shrink-0">
            {tab.loading ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75"/></svg>Sending</> : <><Send size={14}/>Send</>}
          </button>
          <button onClick={handleSave}
            className="flex items-center gap-2 px-3 h-9 bg-[#252525] hover:bg-[#2f2f2f] border border-[#3a3a3a] text-[#d4d4d4] text-sm rounded-md transition-colors shrink-0">
            <Save size={13}/>{tab.isDirty ? <span className="text-orange-400">Save*</span> : 'Save'}
          </button>
          <button onClick={() => setShowCodePanel(!showCodePanel)}
            className={`flex items-center gap-2 px-3 h-9 border text-sm rounded-md transition-colors shrink-0 ${
              showCodePanel
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                : 'bg-[#252525] hover:bg-[#2f2f2f] border border-[#3a3a3a] text-[#d4d4d4]'
            }`}
            title="Code Snippets (Alt+C)"
          >
            <Code size={13}/><span>Code</span>
          </button>
        </div>

        {/* Workspace split view */}
        <div className="flex-1 overflow-hidden">
          <ResizableSplit defaultTopHeight={260} minTop={140} minBottom={120}
            top={
              <div className="flex flex-col h-full">
                <div className="flex items-center border-b border-[#2a2a2a] bg-[#1a1a1a] px-4 overflow-x-auto">
                  {REQUEST_TABS.map(t => {
                    const badge = t === 'Params' ? countActive(tab.params) : t === 'Headers' ? countActive(tab.headers) : 0;
                    const isSelected = activeReqTab === t;
                    return (
                      <button key={t} onClick={() => setActiveReqTab(t)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors shrink-0 ${isSelected ? 'border-orange-500 text-orange-400' : 'border-transparent text-[#8b8b8b] hover:text-[#d4d4d4]'}`}>
                        {t}{badge > 0 && <span className="bg-orange-500/20 text-orange-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {activeReqTab === 'Params' && <ParamsTab key={tab.id} params={tab.params} url={tab.url} onChange={(p, u) => updateTab(tab.id, { params: p, ...(u !== undefined ? { url: u } : {}) })} />}
                  {activeReqTab === 'Authorization' && <AuthTab key={tab.id} authType={tab.auth_type} authData={tab.auth_data} onChange={(at, ad) => updateTab(tab.id, { auth_type: at, auth_data: ad })} />}
                  {activeReqTab === 'Headers' && <HeadersTab key={tab.id} headers={tab.headers} bodyType={tab.body_type} rawType={tab.body_raw_type} url={tab.url} bodyContent={tab.body_content} onChange={h => updateTab(tab.id, { headers: h })} />}
                  {activeReqTab === 'Body' && <BodyTab key={tab.id} bodyType={tab.body_type} bodyContent={tab.body_content} rawType={tab.body_raw_type} onChange={(bt, bc, brt) => updateTab(tab.id, { body_type: bt, body_content: bc, body_raw_type: brt })} />}
                  
                  {activeReqTab === 'Pre-request Script' && (
                    <div className="p-4 flex flex-col h-full bg-[#1a1a1a]">
                      <div className="text-xs text-[#8b8b8b] mb-2 font-mono italic">// Pre-request scripts run in Javascript before the request is executed.</div>
                      <textarea
                        readOnly
                        value={`// Example: Set environment variable\n// pm.environment.set("API_TOKEN", "my-new-token");\n\nconsole.log("Preparing request variables...");`}
                        className="w-full flex-1 min-h-[140px] bg-[#151515] border border-[#2a2a2a] rounded p-3 text-xs font-mono text-[#8695b2] outline-none select-none"
                      />
                      <div className="mt-2 text-[10px] text-orange-400/70 font-sans">* Pre-request Script execution (JS sandbox) is coming soon in the next version.</div>
                    </div>
                  )}
                  {activeReqTab === 'Tests' && (
                    <div className="p-4 flex flex-col h-full bg-[#1a1a1a]">
                      <div className="text-xs text-[#8b8b8b] mb-2 font-mono italic">// Write scripts to validate response headers, times, or body contents.</div>
                      <textarea
                        readOnly
                        value={`// Example: Test response status code\npm.test("Status code is 200", function () {\n    pm.response.to.have.status(200);\n});`}
                        className="w-full flex-1 min-h-[140px] bg-[#151515] border border-[#2a2a2a] rounded p-3 text-xs font-mono text-[#8695b2] outline-none select-none"
                      />
                      <div className="mt-2 text-[10px] text-orange-400/70 font-sans">* JavaScript tests sandboxed execution is coming soon in the next version.</div>
                    </div>
                  )}
                  {activeReqTab === 'Settings' && (
                    <div className="p-4 flex flex-col gap-4 bg-[#1a1a1a] text-xs text-[#d4d4d4] font-sans">
                      <div className="text-sm font-semibold text-[#8b8b8b] mb-1">Request Settings</div>
                      <div className="flex flex-col gap-2.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input type="checkbox" defaultChecked className="w-3.5 h-3.5 accent-orange-500 rounded bg-[#252525] border-[#3a3a3a]" />
                          <span>Enable SSL certificate verification</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input type="checkbox" defaultChecked className="w-3.5 h-3.5 accent-orange-500 rounded bg-[#252525] border-[#3a3a3a]" />
                          <span>Automatically follow redirects</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input type="checkbox" defaultChecked className="w-3.5 h-3.5 accent-orange-500 rounded bg-[#252525] border-[#3a3a3a]" />
                          <span>Send Postman-Token header</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input type="checkbox" className="w-3.5 h-3.5 accent-orange-500 rounded bg-[#252525] border-[#3a3a3a]" />
                          <span>Enable strict request encoding</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            }
            bottom={<ResponseViewer response={tab.response} loading={tab.loading || false} requestUrl={tab.url} />}
          />
        </div>
      </div>

      {/* Right panel: Code snippets drawer */}
      {showCodePanel && (
        <div className="w-[340px] border-l border-[#2a2a2a] bg-[#1e1e1e] flex flex-col h-full shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] bg-[#161616]">
            <span className="text-xs font-semibold text-[#d4d4d4] uppercase tracking-wider">Generate Code Snippet</span>
            <button
              onClick={() => setShowCodePanel(false)}
              className="text-[#6b6b6b] hover:text-[#d4d4d4] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <CodeSnippetViewer tab={tab} />
        </div>
      )}
    </div>
  );
}

// Subcomponent that manages code snippet viewing state
function CodeSnippetViewer({ tab }: { tab: RequestTab }) {
  const { environments, activeEnvironmentId } = useAppStore();
  const [lang, setLang] = useState<'curl' | 'fetch' | 'python'>('curl');
  const [resolveVars, setResolveVars] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extract variables map
  const varMap: Record<string, string> = {};
  environments.find(e => e.id === activeEnvironmentId)?.variables.forEach(v => {
    if (v.is_enabled) {
      varMap[v.key] = v.current_value || v.value;
    }
  });

  const getCode = () => {
    if (lang === 'curl') return generateCurl(tab, varMap, resolveVars);
    if (lang === 'fetch') return generateFetch(tab, varMap, resolveVars);
    return generatePythonRequests(tab, varMap, resolveVars);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getCode());
    setCopied(true);
    toast.success('Snippet copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const code = getCode();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Settings Row */}
      <div className="p-3 flex flex-col gap-2.5 border-b border-[#2a2a2a] bg-[#1e1e1e]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#6b6b6b] font-medium">LANGUAGE</span>
          <select
            value={lang}
            onChange={e => setLang(e.target.value as any)}
            className="bg-[#2a2a2a] border border-[#3a3a3a] text-xs text-[#d4d4d4] rounded px-2 py-1 outline-none focus:border-orange-500/50"
          >
            <option value="curl">cURL (command line)</option>
            <option value="fetch">JavaScript (fetch)</option>
            <option value="python">Python (requests)</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#6b6b6b] font-medium">RESOLVE VARIABLES</span>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={resolveVars}
              onChange={e => setResolveVars(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-7 h-4 bg-[#3a3a3a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#d4d4d4] after:border-[#3a3a3a] after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>
      </div>

      {/* Code Display Container */}
      <div className="flex-1 overflow-auto p-3 relative flex flex-col bg-[#151515]">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 bg-[#252525] border border-[#3a3a3a] hover:bg-[#333] text-[#8b8b8b] hover:text-[#d4d4d4] rounded transition-colors"
          title="Copy snippet"
        >
          {copied ? <Check size={13} className="text-green-400" /> : <Clipboard size={13} />}
        </button>

        <pre className="text-[11px] font-mono text-[#d4d4d4] whitespace-pre overflow-x-auto leading-relaxed pr-8 py-2">
          {code}
        </pre>
      </div>
    </div>
  );
}

// --- Snippet Generators ---

function generateCurl(tab: RequestTab, variables: Record<string, string>, resolveVars = false): string {
  const resolve = (val: string) => {
    if (!resolveVars) return val;
    return val.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const trimmed = key.trim();
      return trimmed in variables ? variables[trimmed] : `{{${key}}}`;
    });
  };

  let url = resolve(tab.url || 'https://api.example.com');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Construct query params in URL if not already present
  const enabledParams = tab.params.filter(p => p.enabled && p.key.trim());
  if (enabledParams.length > 0) {
    try {
      const parsedUrl = new URL(url);
      enabledParams.forEach(p => {
        parsedUrl.searchParams.set(resolve(p.key), resolve(p.value));
      });
      url = parsedUrl.toString();
    } catch {
      const qs = enabledParams.map(p => `${encodeURIComponent(resolve(p.key))}=${encodeURIComponent(resolve(p.value))}`).join('&');
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  let cmd = `curl --location '${url}' \\\n--request ${tab.method}`;

  // Headers
  const enabledHeaders = tab.headers.filter(h => h.enabled && h.key.trim());
  enabledHeaders.forEach(h => {
    cmd += ` \\\n--header '${resolve(h.key)}: ${resolve(h.value)}'`;
  });

  // Auth
  if (tab.auth_type === 'bearer' && tab.auth_data.token) {
    cmd += ` \\\n--header 'Authorization: Bearer ${resolve(tab.auth_data.token)}'`;
  } else if (tab.auth_type === 'basic') {
    const u = resolve(tab.auth_data.username || '');
    const p = resolve(tab.auth_data.password || '');
    cmd += ` \\\n--header 'Authorization: Basic ${btoa(`${u}:${p}`)}'`;
  }

  // Body
  if (tab.body_type === 'raw' && tab.body_content) {
    const rawBody = resolve(tab.body_content);
    cmd += ` \\\n--header 'Content-Type: ${tab.body_raw_type === 'JSON' ? 'application/json' : 'text/plain'}' \\\n--data '${rawBody.replace(/'/g, "'\\''")}'`;
  } else if (tab.body_type === 'x-www-form-urlencoded') {
    cmd += ` \\\n--header 'Content-Type: application/x-www-form-urlencoded'`;
    try {
      const kv = JSON.parse(tab.body_content) as KeyValue[];
      kv.filter(k => k.enabled && k.key.trim()).forEach(k => {
        cmd += ` \\\n--data-urlencode '${resolve(k.key)}=${resolve(k.value)}'`;
      });
    } catch {}
  } else if (tab.body_type === 'form-data') {
    try {
      const kv = JSON.parse(tab.body_content) as KeyValue[];
      kv.filter(k => k.enabled && k.key.trim()).forEach(k => {
        cmd += ` \\\n--form '${resolve(k.key)}="${resolve(k.value)}"'`;
      });
    } catch {}
  }

  return cmd;
}

function generateFetch(tab: RequestTab, variables: Record<string, string>, resolveVars = false): string {
  const resolve = (val: string) => {
    if (!resolveVars) return val;
    return val.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const trimmed = key.trim();
      return trimmed in variables ? variables[trimmed] : `{{${key}}}`;
    });
  };

  let url = resolve(tab.url || 'https://api.example.com');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  const enabledParams = tab.params.filter(p => p.enabled && p.key.trim());
  if (enabledParams.length > 0) {
    try {
      const parsedUrl = new URL(url);
      enabledParams.forEach(p => {
        parsedUrl.searchParams.set(resolve(p.key), resolve(p.value));
      });
      url = parsedUrl.toString();
    } catch {
      const qs = enabledParams.map(p => `${encodeURIComponent(resolve(p.key))}=${encodeURIComponent(resolve(p.value))}`).join('&');
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const headers: Record<string, string> = {};
  tab.headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
    headers[resolve(h.key)] = resolve(h.value);
  });

  if (tab.auth_type === 'bearer' && tab.auth_data.token) {
    headers['Authorization'] = `Bearer ${resolve(tab.auth_data.token)}`;
  } else if (tab.auth_type === 'basic') {
    const u = resolve(tab.auth_data.username || '');
    const p = resolve(tab.auth_data.password || '');
    headers['Authorization'] = `Basic ${btoa(`${u}:${p}`)}`;
  }

  let bodyCode = '';
  if (tab.body_type === 'raw' && tab.body_content) {
    headers['Content-Type'] = tab.body_raw_type === 'JSON' ? 'application/json' : 'text/plain';
    if (tab.body_raw_type === 'JSON') {
      try {
        bodyCode = `body: JSON.stringify(${resolve(tab.body_content).trim()}),\n  `;
      } catch {
        bodyCode = `body: JSON.stringify(${JSON.stringify(resolve(tab.body_content))}),\n  `;
      }
    } else {
      bodyCode = `body: ${JSON.stringify(resolve(tab.body_content))},\n  `;
    }
  } else if (tab.body_type === 'x-www-form-urlencoded') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    bodyCode = `body: new URLSearchParams({\n`;
    try {
      const kv = JSON.parse(tab.body_content) as KeyValue[];
      kv.filter(k => k.enabled && k.key.trim()).forEach(k => {
        bodyCode += `    ${JSON.stringify(resolve(k.key))}: ${JSON.stringify(resolve(k.value))},\n`;
      });
    } catch {}
    bodyCode += `  }),\n  `;
  } else if (tab.body_type === 'form-data') {
    bodyCode = `body: (() => {\n    const formdata = new FormData();\n`;
    try {
      const kv = JSON.parse(tab.body_content) as KeyValue[];
      kv.filter(k => k.enabled && k.key.trim()).forEach(k => {
        bodyCode += `    formdata.append(${JSON.stringify(resolve(k.key))}, ${JSON.stringify(resolve(k.value))});\n`;
      });
    } catch {}
    bodyCode += `    return formdata;\n  })(),\n  `;
  }

  const headersStr = Object.keys(headers).length > 0
    ? `headers: {\n${Object.entries(headers).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n  },\n  `
    : '';

  return `const myHeaders = new Headers();\n` +
    Object.entries(headers).map(([k, v]) => `myHeaders.append(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join('\n') +
    `\n\nconst requestOptions = {\n` +
    `  method: ${JSON.stringify(tab.method)},\n` +
    `  ${headersStr.trim() ? 'headers: myHeaders,\n  ' : ''}` +
    bodyCode +
    `redirect: "follow"\n` +
    `};\n\n` +
    `fetch(${JSON.stringify(url)}, requestOptions)\n` +
    `  .then((response) => response.text())\n` +
    `  .then((result) => console.log(result))\n` +
    `  .catch((error) => console.error(error));`;
}

function generatePythonRequests(tab: RequestTab, variables: Record<string, string>, resolveVars = false): string {
  const resolve = (val: string) => {
    if (!resolveVars) return val;
    return val.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const trimmed = key.trim();
      return trimmed in variables ? variables[trimmed] : `{{${key}}}`;
    });
  };

  let url = resolve(tab.url || 'https://api.example.com');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  const enabledParams = tab.params.filter(p => p.enabled && p.key.trim());
  if (enabledParams.length > 0) {
    try {
      const parsedUrl = new URL(url);
      enabledParams.forEach(p => {
        parsedUrl.searchParams.set(resolve(p.key), resolve(p.value));
      });
      url = parsedUrl.toString();
    } catch {
      const qs = enabledParams.map(p => `${encodeURIComponent(resolve(p.key))}=${encodeURIComponent(resolve(p.value))}`).join('&');
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const headers: Record<string, string> = {};
  tab.headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
    headers[resolve(h.key)] = resolve(h.value);
  });

  if (tab.auth_type === 'bearer' && tab.auth_data.token) {
    headers['Authorization'] = `Bearer ${resolve(tab.auth_data.token)}`;
  } else if (tab.auth_type === 'basic') {
    const u = resolve(tab.auth_data.username || '');
    const p = resolve(tab.auth_data.password || '');
    headers['Authorization'] = `Basic ${btoa(`${u}:${p}`)}`;
  }

  let code = `import requests\n\nurl = ${JSON.stringify(url)}\n\n`;

  const hasHeaders = Object.keys(headers).length > 0;
  if (hasHeaders) {
    code += `headers = {\n` +
      Object.entries(headers).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n') +
      `\n}\n\n`;
  }

  let payloadCode = '';
  let requestsArg = '';
  if (tab.body_type === 'raw' && tab.body_content) {
    if (tab.body_raw_type === 'JSON') {
      payloadCode = `payload = ${resolve(tab.body_content).trim()}\n\n`;
      requestsArg = `, json=payload`;
    } else {
      payloadCode = `payload = ${JSON.stringify(resolve(tab.body_content))}\n\n`;
      requestsArg = `, data=payload`;
    }
  } else if (tab.body_type === 'x-www-form-urlencoded') {
    payloadCode = `payload = {\n`;
    try {
      const kv = JSON.parse(tab.body_content) as KeyValue[];
      kv.filter(k => k.enabled && k.key.trim()).forEach(k => {
        payloadCode += `    ${JSON.stringify(resolve(k.key))}: ${JSON.stringify(resolve(k.value))},\n`;
      });
    } catch {}
    payloadCode += `}\n\n`;
    requestsArg = `, data=payload`;
  } else if (tab.body_type === 'form-data') {
    payloadCode = `payload = {\n`;
    try {
      const kv = JSON.parse(tab.body_content) as KeyValue[];
      kv.filter(k => k.enabled && k.key.trim()).forEach(k => {
        payloadCode += `    ${JSON.stringify(resolve(k.key))}: (None, ${JSON.stringify(resolve(k.value))}),\n`;
      });
    } catch {}
    payloadCode += `}\n\n`;
    requestsArg = `, files=payload`;
  }

  code += payloadCode;
  code += `response = requests.request(\n` +
    `    method=${JSON.stringify(tab.method)},\n` +
    `    url=url` +
    `${hasHeaders ? ', headers=headers' : ''}` +
    `${requestsArg}\n` +
    `)\n\n` +
    `print(response.text)\n`;

  return code;
}

