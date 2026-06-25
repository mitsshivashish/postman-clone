'use client';
import React, { useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store';
import { methodColor } from '@/lib/utils';

interface Props {
  collectionId: number;
}

export default function CollectionDocModal({ collectionId }: Props) {
  const { closeModal, collections, requestsByCollection, loadCollectionRequests } = useAppStore();
  const collection = collections.find(c => c.id === collectionId);
  const requests = requestsByCollection[collectionId] || [];

  useEffect(() => {
    loadCollectionRequests(collectionId);
  }, [collectionId]);

  const parseJson = (str: string, fallback: any) => {
    try {
      return JSON.parse(str) || fallback;
    } catch {
      return fallback;
    }
  };

  return (
    <Modal title={`Documentation — ${collection?.name || 'Collection'}`} onClose={closeModal} width="w-[780px]">
      <div className="h-[480px] overflow-y-auto bg-[#1a1a1a] text-[#d4d4d4] p-6 font-sans select-text">
        {/* Collection Header */}
        <div className="border-b border-[#2a2a2a] pb-4 mb-6">
          <h1 className="text-xl font-bold text-[#f97316] mb-1">{collection?.name}</h1>
          <p className="text-xs text-[#8b8b8b] leading-relaxed">
            {collection?.description || <span className="italic">No collection description provided.</span>}
          </p>
        </div>

        {/* Requests List */}
        <div className="flex flex-col gap-8">
          {requests.length === 0 ? (
            <div className="text-center py-10 text-[#4a4a4a] text-xs">
              No requests in this collection yet.
            </div>
          ) : (
            requests.map((r, idx) => {
              const headers = parseJson(r.headers, []);
              const params = parseJson(r.params, []);
              const authData = parseJson(r.auth_data, {});
              const activeHeaders = headers.filter((h: any) => h.enabled && h.key);
              const activeParams = params.filter((p: any) => p.enabled && p.key);

              return (
                <div key={r.id} className="border border-[#2a2a2a] rounded-lg bg-[#1e1e1e] p-4 flex flex-col gap-4">
                  {/* Request Title & URL */}
                  <div className="flex flex-col gap-1.5 border-b border-[#2a2a2a] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#6b6b6b] font-mono">#{idx + 1}</span>
                      <h2 className="text-sm font-semibold text-[#e4e4e4]">{r.name}</h2>
                    </div>
                    <div className="flex items-center gap-2 bg-[#151515] px-2.5 py-1.5 rounded border border-[#2a2a2a]/60">
                      <span className={`text-[10px] font-bold font-mono ${methodColor(r.method)} shrink-0`}>
                        {r.method}
                      </span>
                      <span className="text-xs font-mono text-[#a0a0a0] truncate select-all">{r.url || ' (No URL) '}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {r.description && (
                    <div>
                      <h3 className="text-[11px] text-[#6b6b6b] uppercase tracking-wider font-semibold mb-1">Description</h3>
                      <p className="text-xs text-[#c4c4c4] leading-relaxed whitespace-pre-wrap">{r.description}</p>
                    </div>
                  )}

                  {/* Auth details */}
                  {r.auth_type !== 'none' && (
                    <div>
                      <h3 className="text-[11px] text-[#6b6b6b] uppercase tracking-wider font-semibold mb-1">Authentication</h3>
                      <div className="text-xs text-[#8b8b8b] bg-[#151515] p-2 rounded border border-[#2a2a2a]/60 font-mono">
                        {r.auth_type === 'bearer' && (
                          <span>Type: <code className="text-orange-400">Bearer Token</code> {authData.token ? `(${authData.token})` : ''}</span>
                        )}
                        {r.auth_type === 'basic' && (
                          <span>Type: <code className="text-orange-400">Basic Auth</code> (Username: {authData.username})</span>
                        )}
                        {r.auth_type === 'apikey' && (
                          <span>Type: <code className="text-orange-400">API Key</code> (Key: {authData.apiKeyKey}, Add to: {authData.apiKeyAddTo})</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Headers */}
                  {activeHeaders.length > 0 && (
                    <div>
                      <h3 className="text-[11px] text-[#6b6b6b] uppercase tracking-wider font-semibold mb-1.5">Headers ({activeHeaders.length})</h3>
                      <table className="w-full text-xs text-[#8b8b8b] border border-[#2a2a2a] rounded overflow-hidden">
                        <thead>
                          <tr className="bg-[#151515] border-b border-[#2a2a2a]">
                            <th className="text-left py-1.5 px-2 font-medium w-1/3">Key</th>
                            <th className="text-left py-1.5 px-2 font-medium">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeHeaders.map((h: any, i: number) => (
                            <tr key={i} className="border-b border-[#2a2a2a]/40 text-[#c4c4c4] font-mono last:border-b-0">
                              <td className="py-1 px-2 text-[#9cdcfe]">{h.key}</td>
                              <td className="py-1 px-2 text-[#ce9178] break-all">{h.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Params */}
                  {activeParams.length > 0 && (
                    <div>
                      <h3 className="text-[11px] text-[#6b6b6b] uppercase tracking-wider font-semibold mb-1.5">Query Parameters ({activeParams.length})</h3>
                      <table className="w-full text-xs text-[#8b8b8b] border border-[#2a2a2a] rounded overflow-hidden">
                        <thead>
                          <tr className="bg-[#151515] border-b border-[#2a2a2a]">
                            <th className="text-left py-1.5 px-2 font-medium w-1/3">Key</th>
                            <th className="text-left py-1.5 px-2 font-medium">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeParams.map((p: any, i: number) => (
                            <tr key={i} className="border-b border-[#2a2a2a]/40 text-[#c4c4c4] font-mono last:border-b-0">
                              <td className="py-1 px-2 text-[#4fc1ff]">{p.key}</td>
                              <td className="py-1 px-2 text-[#ce9178] break-all">{p.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Body details */}
                  {r.body_type !== 'none' && r.body_content && (
                    <div>
                      <h3 className="text-[11px] text-[#6b6b6b] uppercase tracking-wider font-semibold mb-1">
                        Body ({r.body_type} {r.body_type === 'raw' ? `- ${r.body_raw_type}` : ''})
                      </h3>
                      {r.body_type === 'raw' ? (
                        <pre className="bg-[#151515] text-[#ce9178] border border-[#2a2a2a] rounded p-3 text-xs font-mono max-h-[160px] overflow-auto whitespace-pre-wrap leading-relaxed select-text">
                          {r.body_content}
                        </pre>
                      ) : (
                        <div className="bg-[#151515] border border-[#2a2a2a] rounded p-2 text-xs font-mono text-[#8b8b8b] max-h-[160px] overflow-auto">
                          {parseJson(r.body_content, []).map((kv: any, i: number) => (
                            <div key={i} className="flex gap-2 py-0.5 last:border-0 border-b border-[#2a2a2a]/20">
                              <span className="text-[#9cdcfe]">{kv.key}:</span>
                              <span className="text-[#ce9178]">{kv.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
