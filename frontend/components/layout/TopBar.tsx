'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Settings, ChevronDown, Plus, Upload } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function TopBar() {
  const { environments, activeEnvironmentId, setActiveEnvironment, openModal } = useAppStore();
  const activeEnv = environments.find(e => e.id === activeEnvironmentId);
  const [envOpen, setEnvOpen] = useState(false);
  const envRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (envRef.current && !envRef.current.contains(e.target as Node)) setEnvOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="flex items-center justify-between px-3 h-11 bg-[#1a1a1a] border-b border-[#2a2a2a] shrink-0">
      {/* Logo + workspace */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          </div>
          <span className="text-white text-sm font-semibold">PostmanX</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded text-[#8b8b8b] hover:bg-[#252525] cursor-pointer text-xs border border-[#2a2a2a]">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18"/></svg>
          <span>My Workspace</span>
          <ChevronDown size={10}/>
        </div>
        <button onClick={() => openModal({ type: 'newCollection' })}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors font-medium">
          <Plus size={12}/> New
        </button>
        <button className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#8b8b8b] border border-[#2a2a2a] hover:border-[#3a3a3a] hover:text-[#d4d4d4] rounded transition-colors">
          <Upload size={12}/> Import
        </button>
      </div>

      {/* Center nav */}
      <div className="flex items-center gap-0.5">
        {['Home','Workspaces','API Network','Explore'].map(item => (
          <button key={item} className="px-3 py-1 text-xs text-[#8b8b8b] hover:text-[#d4d4d4] hover:bg-[#252525] rounded transition-colors">{item}</button>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Environment quick-dropdown */}
        <div ref={envRef} className="relative">
          <div onClick={() => setEnvOpen(!envOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#252525] border border-[#3a3a3a] rounded cursor-pointer hover:border-orange-500/40 transition-colors">
            <div className={`w-1.5 h-1.5 rounded-full ${activeEnv ? 'bg-green-400' : 'bg-[#4a4a4a]'}`}/>
            <span className={activeEnv ? 'text-[#d4d4d4]' : 'text-[#5b5b5b]'}>{activeEnv ? activeEnv.name : 'No Environment'}</span>
            <ChevronDown size={10} className="text-[#6b6b6b]"/>
          </div>
          {envOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-[#252525] border border-[#3a3a3a] rounded shadow-xl min-w-[180px] py-1">
              <button onClick={() => { setActiveEnvironment(null); setEnvOpen(false); }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-[#333] ${!activeEnv ? 'text-orange-400' : 'text-[#8b8b8b]'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#4a4a4a]"/> No Environment
              </button>
              {environments.map(env => (
                <button key={env.id} onClick={() => { setActiveEnvironment(env.id); setEnvOpen(false); }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-[#333] ${activeEnvironmentId === env.id ? 'text-orange-400' : 'text-[#d4d4d4]'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${env.is_active ? 'bg-green-400' : 'bg-[#4a4a4a]'}`}/> {env.name}
                </button>
              ))}
              <div className="border-t border-[#2a2a2a] mt-1 pt-1">
                <button onClick={() => { openModal({ type: 'environment' }); setEnvOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-orange-400 hover:bg-[#333]">
                  <Settings size={11}/> Manage Environments
                </button>
              </div>
            </div>
          )}
        </div>
        <button onClick={() => openModal({ type: 'settings' })}
          className="p-1.5 text-[#6b6b6b] hover:text-[#d4d4d4] hover:bg-[#252525] rounded transition-colors">
          <Settings size={14}/>
        </button>
        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">U</div>
      </div>
    </div>
  );
}
