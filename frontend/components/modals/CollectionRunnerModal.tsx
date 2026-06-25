'use client';
import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Play, Square, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { methodColor } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  collectionId: number;
}

interface RunResult {
  reqId: number;
  name: string;
  method: string;
  url: string;
  status: 'pending' | 'running' | 'success' | 'error';
  statusCode?: number | null;
  timeMs?: number;
  errorMessage?: string;
}

export default function CollectionRunnerModal({ collectionId }: Props) {
  const { closeModal, collections, requestsByCollection, loadCollectionRequests, activeEnvironmentId, settings } = useAppStore();
  const collection = collections.find(c => c.id === collectionId);
  const requests = requestsByCollection[collectionId] || [];

  const [selectedReqIds, setSelectedReqIds] = useState<number[]>([]);
  const [iterations, setIterations] = useState(1);
  const [delay, setDelay] = useState(0); // ms

  const [isRunning, setIsRunning] = useState(false);
  const [shouldStop, setShouldStop] = useState(false);
  const [runHistory, setRunHistory] = useState<RunResult[]>([]);
  const [currentIteration, setCurrentIteration] = useState(0);

  useEffect(() => {
    loadCollectionRequests(collectionId);
  }, [collectionId]);

  useEffect(() => {
    if (requests.length > 0 && selectedReqIds.length === 0) {
      setSelectedReqIds(requests.map(r => r.id));
    }
  }, [requests]);

  const toggleSelectRequest = (id: number) => {
    setSelectedReqIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReqIds.length === requests.length) {
      setSelectedReqIds([]);
    } else {
      setSelectedReqIds(requests.map(r => r.id));
    }
  };

  const handleRun = async () => {
    if (selectedReqIds.length === 0) {
      toast.error('Select at least one request to run');
      return;
    }
    setIsRunning(true);
    setShouldStop(false);
    setRunHistory([]);
    setCurrentIteration(1);

    const targetReqs = requests.filter(r => selectedReqIds.includes(r.id));
    const history: RunResult[] = [];

    for (let iter = 1; iter <= iterations; iter++) {
      for (const r of targetReqs) {
        history.push({
          reqId: r.id,
          name: r.name,
          method: r.method,
          url: r.url,
          status: 'pending'
        });
      }
    }
    setRunHistory(history);

    let stopFlag = false;
    for (let iter = 1; iter <= iterations; iter++) {
      if (stopFlag) break;
      setCurrentIteration(iter);

      for (let i = 0; i < targetReqs.length; i++) {
        if (shouldStop) {
          stopFlag = true;
          break;
        }

        const r = targetReqs[i];
        const historyIdx = (iter - 1) * targetReqs.length + i;

        setRunHistory(prev => {
          const next = [...prev];
          next[historyIdx].status = 'running';
          return next;
        });

        if (delay > 0 && historyIdx > 0) {
          await new Promise(res => setTimeout(res, delay));
        }

        try {
          const res = await api.runRequest({
            method: r.method,
            url: r.url,
            headers: r.headers ? JSON.parse(r.headers) : [],
            params: r.params ? JSON.parse(r.params) : [],
            body_type: r.body_type,
            body_content: r.body_content,
            body_raw_type: r.body_raw_type,
            auth_type: r.auth_type,
            auth_data: r.auth_data ? JSON.parse(r.auth_data) : null,
            environment_id: activeEnvironmentId,
            follow_redirects: settings.followRedirects,
            verify_ssl: settings.sslVerification,
            timeout_ms: settings.timeout
          });

          setRunHistory(prev => {
            const next = [...prev];
            const item = next[historyIdx];
            item.status = res.error ? 'error' : 'success';
            item.statusCode = res.status;
            item.timeMs = res.time_ms;
            item.errorMessage = res.error || undefined;
            return next;
          });
        } catch (err: any) {
          setRunHistory(prev => {
            const next = [...prev];
            const item = next[historyIdx];
            item.status = 'error';
            item.errorMessage = err.message || 'Request failed';
            return next;
          });
        }
      }
    }

    setIsRunning(false);
    useAppStore.getState().loadHistory();
  };

  const handleStop = () => {
    setShouldStop(true);
    setIsRunning(false);
    toast.info('Collection run stopped by user');
  };

  const successCount = runHistory.filter(h => h.status === 'success').length;
  const failureCount = runHistory.filter(h => h.status === 'error').length;

  return (
    <Modal title={`Runner — ${collection?.name || 'Collection'}`} onClose={closeModal} width="w-[840px]">
      <div className="flex h-[490px] bg-[#1a1a1a] text-[#d4d4d4] font-sans">
        <div className="w-[300px] border-r border-[#2a2a2a] p-4 flex flex-col justify-between shrink-0 select-none">
          <div className="flex flex-col gap-4 overflow-y-auto">
            <span className="text-xs font-semibold text-[#8b8b8b] uppercase tracking-wider">Runner Options</span>
            
            <div>
              <label className="text-xs text-[#8b8b8b] block mb-1">Iterations</label>
              <input
                type="number"
                min={1}
                max={50}
                disabled={isRunning}
                value={iterations}
                onChange={e => setIterations(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#252525] border border-[#3a3a3a] rounded px-3 py-1.5 text-xs text-[#d4d4d4] outline-none focus:border-orange-500/50"
              />
            </div>

            <div>
              <label className="text-xs text-[#8b8b8b] block mb-1">Delay (ms)</label>
              <input
                type="number"
                min={0}
                max={10000}
                step={100}
                disabled={isRunning}
                value={delay}
                onChange={e => setDelay(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-[#252525] border border-[#3a3a3a] rounded px-3 py-1.5 text-xs text-[#d4d4d4] outline-none focus:border-orange-500/50"
              />
            </div>

            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <div className="flex items-center justify-between text-xs text-[#8b8b8b] border-b border-[#2a2a2a] pb-1.5 mt-2">
                <span>Select Requests</span>
                <button onClick={toggleSelectAll} disabled={isRunning} className="text-orange-400 hover:text-orange-300 font-semibold cursor-pointer">
                  {selectedReqIds.length === requests.length ? 'Clear All' : 'Select All'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 max-h-[200px]">
                {requests.length === 0 ? (
                  <div className="text-center py-4 text-[#4a4a4a] text-xs">No requests in collection</div>
                ) : (
                  requests.map(r => (
                    <label key={r.id} className="flex items-center gap-2 text-xs cursor-pointer select-none hover:text-[#d4d4d4] py-0.5">
                      <input
                        type="checkbox"
                        disabled={isRunning}
                        checked={selectedReqIds.includes(r.id)}
                        onChange={() => toggleSelectRequest(r.id)}
                        className="w-3.5 h-3.5 accent-orange-500 rounded bg-[#252525]"
                      />
                      <span className={`text-[10px] font-bold font-mono ${methodColor(r.method)} w-9 shrink-0`}>{r.method}</span>
                      <span className="truncate flex-1">{r.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-[#2a2a2a] pt-3 mt-3">
            {isRunning ? (
              <button
                onClick={handleStop}
                className="w-full flex items-center justify-center gap-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
              >
                <Square size={13} fill="white" /> Stop Run
              </button>
            ) : (
              <button
                onClick={handleRun}
                disabled={requests.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
              >
                <Play size={13} fill="white" /> Run Collection
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-col min-w-0">
          {runHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[#4a4a4a] gap-2">
              <Play size={44} className="opacity-15" />
              <div className="text-sm font-medium text-[#5b5b5b]">Ready to Run</div>
              <div className="text-xs text-[#4a4a4a]">Configure options and click "Run Collection" to execute.</div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3 mb-3 shrink-0">
                <div className="flex gap-4 text-xs font-medium">
                  {iterations > 1 && (
                    <span className="text-[#8b8b8b]">
                      Iteration: <span className="text-[#d4d4d4] font-mono">{currentIteration} / {iterations}</span>
                    </span>
                  )}
                  <span className="text-green-500">
                    Passed: <span className="font-mono">{successCount}</span>
                  </span>
                  <span className="text-red-400">
                    Failed: <span className="font-mono">{failureCount}</span>
                  </span>
                </div>
                {isRunning && (
                  <div className="flex items-center gap-1.5 text-xs text-orange-400 font-semibold">
                    <Loader2 size={13} className="animate-spin" />
                    <span>Running...</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0 font-mono text-xs">
                {runHistory.map((h, idx) => (
                  <div key={idx} className="flex items-start justify-between bg-[#1f1f1f] border border-[#2a2a2a]/60 rounded p-2 hover:bg-[#252525]/30">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${methodColor(h.method)}`}>{h.method}</span>
                        <span className="text-[#d4d4d4] font-semibold font-sans">{h.name}</span>
                        {h.status === 'running' && <span className="text-[10px] text-orange-400 animate-pulse font-sans ml-1">executing...</span>}
                      </div>
                      <div className="text-[10px] text-[#5b5b5b] truncate mt-1">{h.url}</div>
                      {h.errorMessage && (
                        <div className="text-[10px] text-red-400 mt-1 select-text bg-red-950/15 border border-red-500/10 rounded px-1.5 py-0.5">
                          {h.errorMessage}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      {h.status === 'success' && (
                        <>
                          <span className="text-[11px] text-[#8b8b8b]">{h.timeMs}ms</span>
                          <span className="text-green-400 font-bold bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/15">{h.statusCode} OK</span>
                          <CheckCircle size={14} className="text-green-400 shrink-0" />
                        </>
                      )}
                      {h.status === 'error' && (
                        <>
                          {h.statusCode && <span className="text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/15">{h.statusCode} Error</span>}
                          <XCircle size={14} className="text-red-400 shrink-0" />
                        </>
                      )}
                      {h.status === 'pending' && (
                        <span className="text-[10px] text-[#4a4a4a] font-sans">queued</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
