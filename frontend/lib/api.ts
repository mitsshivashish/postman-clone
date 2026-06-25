import { Collection, SavedRequest, Environment, HistoryItem, RunResponse, KeyValue, AuthData, BodyType, RawBodyType, AuthType, HttpMethod } from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Collections ─────────────────────────────────────────────
export const api = {
  // Collections
  getCollections: () => req<Collection[]>('/api/collections'),
  createCollection: (name: string, description?: string) =>
    req<Collection>('/api/collections', { method: 'POST', body: JSON.stringify({ name, description }) }),
  updateCollection: (id: number, data: Partial<{ name: string; description: string }>) =>
    req<Collection>(`/api/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCollection: (id: number) =>
    req<void>(`/api/collections/${id}`, { method: 'DELETE' }),
  exportCollection: (id: number) => req<any>(`/api/collections/${id}/export`),
  importCollection: (data: any) => req<Collection>('/api/collections/import', { method: 'POST', body: JSON.stringify(data) }),

  // Requests
  getCollectionRequests: (colId: number) =>
    req<SavedRequest[]>(`/api/collections/${colId}/requests`),
  createRequest: (data: {
    collection_id: number; name: string; description?: string; method: HttpMethod; url: string;
    headers: string; params: string; body_type: BodyType; body_content: string;
    body_raw_type: RawBodyType; auth_type: AuthType; auth_data: string;
  }) => req<SavedRequest>('/api/requests', { method: 'POST', body: JSON.stringify(data) }),
  updateRequest: (id: number, data: Partial<SavedRequest>) =>
    req<SavedRequest>(`/api/requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRequest: (id: number) =>
    req<void>(`/api/requests/${id}`, { method: 'DELETE' }),
 
  // Environments
  getEnvironments: () => req<Environment[]>('/api/environments'),
  createEnvironment: (name: string, variables?: { key: string; value: string; current_value?: string; is_enabled: boolean }[]) =>
    req<Environment>('/api/environments', { method: 'POST', body: JSON.stringify({ name, variables }) }),
  updateEnvironment: (id: number, data: { name?: string; variables?: { key: string; value: string; current_value?: string; is_enabled: boolean }[] }) =>
    req<Environment>(`/api/environments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEnvironment: (id: number) =>
    req<void>(`/api/environments/${id}`, { method: 'DELETE' }),
  activateEnvironment: (id: number) =>
    req<Environment>(`/api/environments/${id}/activate`, { method: 'POST' }),
  deactivateAll: () =>
    req<void>('/api/environments/deactivate', { method: 'POST' }),

  // History
  getHistory: (limit = 100) => req<HistoryItem[]>(`/api/history?limit=${limit}`),
  clearHistory: () => req<void>('/api/history', { method: 'DELETE' }),
  deleteHistoryItem: (id: number) => req<void>(`/api/history/${id}`, { method: 'DELETE' }),

  runRequest: (payload: {
    method: string; url: string;
    headers: KeyValue[]; params: KeyValue[];
    body_type: string; body_content: string; body_raw_type: string;
    auth_type: string; auth_data: AuthData | null;
    environment_id?: number | null;
    follow_redirects?: boolean;
    verify_ssl?: boolean;
    timeout_ms?: number;
  }) => req<RunResponse>('/api/run', { method: 'POST', body: JSON.stringify(payload) }),
};
