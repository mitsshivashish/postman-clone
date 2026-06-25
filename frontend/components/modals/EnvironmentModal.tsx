'use client';
import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Check, X, Copy } from 'lucide-react';
import { Environment, EnvVariable } from '@/lib/types';
import { api } from '@/lib/api';

export default function EnvironmentModal() {
  const { closeModal, environments, createEnvironment, updateEnvironment, deleteEnvironment, setActiveEnvironment, activeEnvironmentId } = useAppStore();
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(environments[0]?.id || null);
  const [newEnvName, setNewEnvName] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingVars, setEditingVars] = useState<{ key: string; value: string; current_value?: string; is_enabled: boolean }[]>([]);
  const [envName, setEnvName] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedEnv = environments.find(e => e.id === selectedEnvId);

  React.useEffect(() => {
    if (selectedEnv) {
      setEditingVars(selectedEnv.variables.map(v => ({
        key: v.key,
        value: v.value,
        current_value: v.current_value !== undefined ? v.current_value : v.value,
        is_enabled: v.is_enabled
      })));
      setEnvName(selectedEnv.name);
    }
  }, [selectedEnvId, environments.length]);

  const ensureTrailing = (vars: typeof editingVars) => {
    const last = vars[vars.length - 1];
    if (!last || last.key !== '' || last.value !== '' || (last.current_value !== undefined && last.current_value !== '')) {
      return [...vars, { key: '', value: '', current_value: '', is_enabled: true }];
    }
    return vars;
  };

  const handleSave = async () => {
    if (!selectedEnv) return;
    setLoading(true);
    try {
      const cleanVars = editingVars.filter(v => v.key.trim());
      await updateEnvironment(selectedEnv.id, envName, cleanVars);
      toast.success('Environment saved');
    } catch {
      toast.error('Failed to save environment');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEnv = async () => {
    if (!newEnvName.trim()) return;
    try {
      await createEnvironment(newEnvName.trim());
      setNewEnvName('');
      setShowNewForm(false);
      toast.success('Environment created');
    } catch {
      toast.error('Failed to create environment');
    }
  };

  const handleDeleteEnv = async (id: number) => {
    try {
      await deleteEnvironment(id);
      setSelectedEnvId(environments.find(e => e.id !== id)?.id || null);
      toast.success('Environment deleted');
    } catch {
      toast.error('Failed to delete environment');
    }
  };

  const handleDuplicateEnv = async (env: Environment) => {
    try {
      const cleanVars = env.variables.map(v => ({
        key: v.key,
        value: v.value,
        current_value: v.current_value || v.value,
        is_enabled: v.is_enabled
      }));
      const duplicate = await api.createEnvironment(`${env.name} Copy`, cleanVars);
      await useAppStore.getState().loadEnvironments();
      setSelectedEnvId(duplicate.id);
      toast.success('Environment duplicated');
    } catch {
      toast.error('Failed to duplicate environment');
    }
  };

  const handleResetCurrentValues = () => {
    const next = editingVars.map(v => ({
      ...v,
      current_value: ''
    }));
    setEditingVars(next);
    toast.info('Current values reset locally. Click Save to persist.');
  };

  const vars = ensureTrailing(editingVars);

  return (
    <Modal title="Manage Environments" onClose={closeModal} width="w-[700px]">
      <div className="flex h-[480px]">
        {/* Left: env list */}
        <div className="w-[200px] border-r border-[#2a2a2a] flex flex-col">
          <div className="flex-1 overflow-y-auto py-1">
            {environments.map(env => (
              <div
                key={env.id}
                onClick={() => setSelectedEnvId(env.id)}
                className={`flex items-center justify-between px-3 py-2 cursor-pointer group text-sm ${selectedEnvId === env.id ? 'bg-[#2a2a2a] text-[#d4d4d4]' : 'text-[#8b8b8b] hover:bg-[#222] hover:text-[#d4d4d4]'}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${env.is_active ? 'bg-green-400' : 'bg-[#3a3a3a]'}`} />
                  <span className="truncate text-xs">{env.name}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); handleDuplicateEnv(env); }}
                    className="text-[#6b6b6b] hover:text-orange-400"
                    title="Duplicate"
                  >
                    <Copy size={11} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteEnv(env.id); }}
                    className="text-[#6b6b6b] hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showNewForm ? (
            <div className="p-2 border-t border-[#2a2a2a]">
              <input
                autoFocus
                value={newEnvName}
                onChange={e => setNewEnvName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateEnv(); if (e.key === 'Escape') setShowNewForm(false); }}
                placeholder="Environment name"
                className="w-full bg-[#252525] border border-[#3a3a3a] rounded px-2 py-1.5 text-xs text-[#d4d4d4] outline-none focus:border-orange-500/60"
              />
              <div className="flex gap-1 mt-1.5">
                <button onClick={handleCreateEnv} className="flex-1 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded">Add</button>
                <button onClick={() => setShowNewForm(false)} className="flex-1 py-1 text-xs bg-[#2a2a2a] hover:bg-[#333] text-[#8b8b8b] rounded">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-orange-400 hover:bg-[#1a1a1a] border-t border-[#2a2a2a] transition-colors"
            >
              <Plus size={12} /> New Environment
            </button>
          )}
        </div>

        {/* Right: variables editor */}
        <div className="flex-1 flex flex-col">
          {selectedEnv ? (
            <>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2a2a]">
                <input
                  value={envName}
                  onChange={e => setEnvName(e.target.value)}
                  className="flex-1 bg-[#252525] border border-[#3a3a3a] rounded px-2 py-1.5 text-sm text-[#d4d4d4] outline-none focus:border-orange-500/60"
                />
                <button
                  onClick={handleResetCurrentValues}
                  className="px-3 py-1.5 text-xs rounded border border-[#3a3a3a] text-[#8b8b8b] hover:border-orange-500/40 hover:text-orange-400 transition-colors cursor-pointer"
                  title="Reset Current Values"
                >
                  Reset Current
                </button>
                <button
                  onClick={() => setActiveEnvironment(selectedEnv.is_active ? null : selectedEnv.id)}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors cursor-pointer ${selectedEnv.is_active ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'text-[#8b8b8b] border-[#3a3a3a] hover:border-orange-500/40 hover:text-orange-400'}`}
                >
                  {selectedEnv.is_active ? 'Active' : 'Set Active'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-[20px_1fr_1.2fr_1.2fr_28px] gap-1 px-3 py-1.5 text-[10px] text-[#5b5b5b] uppercase tracking-wider border-b border-[#2a2a2a]">
                  <span></span><span>Variable</span><span>Initial Value</span><span>Current Value</span><span></span>
                </div>
                {vars.map((v, i) => {
                  const isLast = i === vars.length - 1 && !v.key && !v.value && !v.current_value;
                  return (
                    <div key={i} className="grid grid-cols-[20px_1fr_1.2fr_1.2fr_28px] gap-1 px-3 py-1 border-b border-[#1e1e1e] hover:bg-[#1f1f1f] group">
                      <div className="flex items-center">
                        <input type="checkbox" checked={v.is_enabled} disabled={isLast}
                          onChange={e => {
                            const next = vars.map((x, j) => j === i ? { ...x, is_enabled: e.target.checked } : x);
                            setEditingVars(next);
                          }}
                          className="w-3 h-3 accent-orange-500" />
                      </div>
                      <input value={v.key} placeholder="Variable"
                        onChange={e => {
                          const next = vars.map((x, j) => j === i ? { ...x, key: e.target.value } : x);
                          setEditingVars(ensureTrailing(next));
                        }}
                        className="bg-transparent text-xs font-mono text-[#9cdcfe] placeholder-[#3a3a3a] outline-none py-1 px-1 focus:bg-[#252525] rounded" />
                      <input value={v.value} placeholder="Initial Value"
                        onChange={e => {
                          const next = vars.map((x, j) => {
                            if (j === i) {
                              const syncCurrent = !x.current_value || x.current_value === x.value;
                              return {
                                ...x,
                                value: e.target.value,
                                current_value: syncCurrent ? e.target.value : x.current_value
                              };
                            }
                            return x;
                          });
                          setEditingVars(ensureTrailing(next));
                        }}
                        className="bg-transparent text-xs font-mono text-[#ce9178] placeholder-[#3a3a3a] outline-none py-1 px-1 focus:bg-[#252525] rounded" />
                      <input value={v.current_value || ''} placeholder="Current Value"
                        onChange={e => {
                          const next = vars.map((x, j) => j === i ? { ...x, current_value: e.target.value } : x);
                          setEditingVars(ensureTrailing(next));
                        }}
                        className="bg-transparent text-xs font-mono text-[#4fc1ff] placeholder-[#3a3a3a] outline-none py-1 px-1 focus:bg-[#252525] rounded" />
                      <div className="flex items-center justify-center">
                        {!isLast && (
                          <button onClick={() => setEditingVars(vars.filter((_, j) => j !== i))}
                            className="opacity-0 group-hover:opacity-100 text-[#6b6b6b] hover:text-red-400">
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#2a2a2a]">
                <button onClick={closeModal} className="px-4 py-2 text-sm text-[#8b8b8b] hover:text-[#d4d4d4]">Close</button>
                <button onClick={handleSave} disabled={loading}
                  className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded font-medium">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-[#4a4a4a] text-sm">
              Select or create an environment
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
