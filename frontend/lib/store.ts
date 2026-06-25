'use client';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  Collection, SavedRequest, Environment, HistoryItem,
  RequestTab, HttpMethod, KeyValue, AuthData, BodyType, RawBodyType, AuthType,
  AppSettings,
} from './types';
import { api } from './api';

function newTab(overrides?: Partial<RequestTab>): RequestTab {
  return {
    id: nanoid(),
    title: 'New Request',
    description: '',
    isDirty: false,
    method: 'GET',
    url: '',
    headers: [{ key: '', value: '', enabled: true }],
    params: [{ key: '', value: '', enabled: true }],
    body_type: 'none',
    body_content: '',
    body_raw_type: 'JSON',
    auth_type: 'none',
    auth_data: {},
    ...overrides,
  };
}

interface AppState {
  // Data
  collections: Collection[];
  requestsByCollection: Record<number, SavedRequest[]>;
  environments: Environment[];
  history: HistoryItem[];

  // UI state
  tabs: RequestTab[];
  activeTabId: string | null;
  sidebarTab: 'collections' | 'history';
  expandedCollections: number[];
  activeEnvironmentId: number | null;
  leftPanelWidth: number;
  sidebarCollapsed: boolean;
  settings: AppSettings;

  // Modal state
  modal: null | { type: 'newCollection' } | { type: 'renameCollection'; id: number; name: string }
    | { type: 'deleteCollection'; id: number; name: string }
    | { type: 'saveRequest'; tabId: string; collectionId?: number }
    | { type: 'renameRequest'; id: number; name: string }
    | { type: 'deleteRequest'; id: number; name: string }
    | { type: 'environment' }
    | { type: 'settings' }
    | { type: 'collectionRunner'; collectionId: number }
    | { type: 'collectionDoc'; collectionId: number };

  // Loaders
  loadingCollections: boolean;
  loadingHistory: boolean;

  // Actions — data
  loadCollections: () => Promise<void>;
  loadCollectionRequests: (colId: number) => Promise<void>;
  loadEnvironments: () => Promise<void>;
  loadHistory: () => Promise<void>;

  createCollection: (name: string, description?: string) => Promise<void>;
  renameCollection: (id: number, name: string) => Promise<void>;
  deleteCollection: (id: number) => Promise<void>;
  importCollection: (collectionJson: any) => Promise<void>;
  exportCollection: (colId: number, colName: string) => Promise<void>;

  createRequest: (tabId: string, collectionId: number, name: string) => Promise<void>;
  updateSavedRequest: (id: number, tab: RequestTab) => Promise<void>;
  deleteSavedRequest: (id: number) => Promise<void>;

  createEnvironment: (name: string) => Promise<void>;
  updateEnvironment: (id: number, name: string, variables: { key: string; value: string; current_value?: string; is_enabled: boolean }[]) => Promise<void>;
  deleteEnvironment: (id: number) => Promise<void>;
  setActiveEnvironment: (id: number | null) => Promise<void>;

  clearHistory: () => Promise<void>;
  deleteHistoryItem: (id: number) => Promise<void>;

  // Actions — tabs
  openNewTab: () => void;
  closeTab: (id: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, patch: Partial<RequestTab>) => void;
  openSavedRequest: (req: SavedRequest) => void;
  openHistoryItem: (item: HistoryItem) => void;

  // Actions — UI
  setSidebarTab: (tab: 'collections' | 'history') => void;
  toggleCollection: (id: number) => void;
  isCollectionExpanded: (id: number) => boolean;
  openModal: (modal: AppState['modal']) => void;
  closeModal: () => void;
  setLeftPanelWidth: (w: number) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

function parseKV(json: string): KeyValue[] {
  try { return JSON.parse(json) || []; } catch { return []; }
}
function parseAuth(json: string): AuthData {
  try { return JSON.parse(json) || {}; } catch { return {}; }
}

const DEFAULT_SETTINGS: AppSettings = {
  followRedirects: true,
  sendCookies: true,
  sslVerification: true,
  timeout: 30000,
  darkTheme: true,
};

function getInitialSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem('postman_clone_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.darkTheme === false) {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    collections: [],
    requestsByCollection: {},
    environments: [],
    history: [],
    tabs: [newTab()],
    activeTabId: null,
    sidebarTab: 'collections',
    expandedCollections: [],
    activeEnvironmentId: null,
    leftPanelWidth: 280,
    sidebarCollapsed: false,
    settings: getInitialSettings(),
    modal: null,
    loadingCollections: false,
    loadingHistory: false,

    loadCollections: async () => {
      set(s => { s.loadingCollections = true; });
      const cols = await api.getCollections();
      set(s => { s.collections = cols; s.loadingCollections = false; });
    },

    loadCollectionRequests: async (colId) => {
      const reqs = await api.getCollectionRequests(colId);
      set(s => { s.requestsByCollection[colId] = reqs; });
    },

    loadEnvironments: async () => {
      const envs = await api.getEnvironments();
      set(s => {
        s.environments = envs;
        const active = envs.find(e => e.is_active);
        if (active) s.activeEnvironmentId = active.id;
      });
    },

    loadHistory: async () => {
      set(s => { s.loadingHistory = true; });
      const h = await api.getHistory();
      set(s => { s.history = h; s.loadingHistory = false; });
    },

    createCollection: async (name, description) => {
      const col = await api.createCollection(name, description);
      set(s => { s.collections.push(col); });
    },

    renameCollection: async (id, name) => {
      const col = await api.updateCollection(id, { name });
      set(s => {
        const idx = s.collections.findIndex(c => c.id === id);
        if (idx >= 0) s.collections[idx] = col;
      });
    },

    deleteCollection: async (id) => {
      await api.deleteCollection(id);
      set(s => {
        s.collections = s.collections.filter(c => c.id !== id);
        delete s.requestsByCollection[id];
      });
    },

    importCollection: async (collectionJson) => {
      const col = await api.importCollection(collectionJson);
      set(s => {
        s.collections.push(col);
      });
      await get().loadCollectionRequests(col.id);
    },

    exportCollection: async (colId, colName) => {
      const data = await api.exportCollection(colId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${colName.toLowerCase().replace(/\s+/g, '_')}_collection.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    createRequest: async (tabId, collectionId, name) => {
      const tab = get().tabs.find(t => t.id === tabId);
      if (!tab) return;
      const saved = await api.createRequest({
        collection_id: collectionId,
        name,
        description: tab.description || '',
        method: tab.method,
        url: tab.url,
        headers: JSON.stringify(tab.headers),
        params: JSON.stringify(tab.params),
        body_type: tab.body_type,
        body_content: tab.body_content,
        body_raw_type: tab.body_raw_type,
        auth_type: tab.auth_type,
        auth_data: JSON.stringify(tab.auth_data),
      });
      set(s => {
        const existing = s.requestsByCollection[collectionId] || [];
        s.requestsByCollection[collectionId] = [...existing, saved];
        const t = s.tabs.find(t => t.id === tabId);
        if (t) {
          t.savedRequestId = saved.id;
          t.collectionId = collectionId;
          t.title = name;
          t.description = saved.description || '';
          t.isDirty = false;
        }
      });
    },

    updateSavedRequest: async (id, tab) => {
      const saved = await api.updateRequest(id, {
        name: tab.title,
        description: tab.description || '',
        method: tab.method,
        url: tab.url,
        headers: JSON.stringify(tab.headers),
        params: JSON.stringify(tab.params),
        body_type: tab.body_type,
        body_content: tab.body_content,
        body_raw_type: tab.body_raw_type,
        auth_type: tab.auth_type,
        auth_data: JSON.stringify(tab.auth_data),
      });
      set(s => {
        const colId = saved.collection_id;
        const list = s.requestsByCollection[colId] || [];
        const idx = list.findIndex(r => r.id === id);
        if (idx >= 0) s.requestsByCollection[colId][idx] = saved;
        const t = s.tabs.find(t => t.id === tab.id);
        if (t) {
          t.isDirty = false;
          t.description = saved.description || '';
        }
      });
    },

    deleteSavedRequest: async (id) => {
      await api.deleteRequest(id);
      set(s => {
        for (const [colId, reqs] of Object.entries(s.requestsByCollection)) {
          s.requestsByCollection[Number(colId)] = reqs.filter(r => r.id !== id);
        }
      });
    },

    createEnvironment: async (name) => {
      const env = await api.createEnvironment(name, []);
      set(s => { s.environments.push(env); });
    },

    updateEnvironment: async (id, name, variables) => {
      const env = await api.updateEnvironment(id, { name, variables });
      set(s => {
        const idx = s.environments.findIndex(e => e.id === id);
        if (idx >= 0) s.environments[idx] = env;
      });
    },

    deleteEnvironment: async (id) => {
      await api.deleteEnvironment(id);
      set(s => {
        s.environments = s.environments.filter(e => e.id !== id);
        if (s.activeEnvironmentId === id) s.activeEnvironmentId = null;
      });
    },

    setActiveEnvironment: async (id) => {
      if (id === null) {
        await api.deactivateAll();
        set(s => {
          s.activeEnvironmentId = null;
          s.environments.forEach(e => { e.is_active = false; });
        });
      } else {
        await api.activateEnvironment(id);
        set(s => {
          s.activeEnvironmentId = id;
          s.environments.forEach(e => { e.is_active = e.id === id; });
        });
      }
    },

    clearHistory: async () => {
      await api.clearHistory();
      set(s => { s.history = []; });
    },

    deleteHistoryItem: async (id) => {
      await api.deleteHistoryItem(id);
      set(s => { s.history = s.history.filter(h => h.id !== id); });
    },

    openNewTab: () => {
      const tab = newTab();
      set(s => {
        s.tabs.push(tab);
        s.activeTabId = tab.id;
      });
    },

    closeTab: (id) => {
      set(s => {
        const idx = s.tabs.findIndex(t => t.id === id);
        if (idx < 0) return;
        s.tabs.splice(idx, 1);
        if (s.tabs.length === 0) {
          const t = newTab();
          s.tabs.push(t);
          s.activeTabId = t.id;
        } else if (s.activeTabId === id) {
          s.activeTabId = s.tabs[Math.min(idx, s.tabs.length - 1)].id;
        }
      });
    },

    closeOtherTabs: (tabId) => {
      set(s => {
        const tab = s.tabs.find(t => t.id === tabId);
        if (!tab) return;
        s.tabs = [tab];
        s.activeTabId = tabId;
      });
    },

    closeAllTabs: () => {
      set(s => {
        const t = newTab();
        s.tabs = [t];
        s.activeTabId = t.id;
      });
    },

    setActiveTab: (id) => set(s => { s.activeTabId = id; }),

    updateTab: (id, patch) => {
      set(s => {
        const t = s.tabs.find(t => t.id === id);
        if (!t) return;
        Object.assign(t, patch);
        // Mark dirty if meaningful field changed
        const dirtyFields = ['method', 'url', 'headers', 'params', 'body_type', 'body_content', 'auth_type', 'auth_data', 'description'];
        if (Object.keys(patch).some(k => dirtyFields.includes(k))) {
          if (t.savedRequestId) t.isDirty = true;
        }
      });
    },

    openSavedRequest: (req) => {
      // Check if already open
      const existing = get().tabs.find(t => t.savedRequestId === req.id);
      if (existing) {
        set(s => { s.activeTabId = existing.id; });
        return;
      }
      const tab = newTab({
        title: req.name,
        description: req.description || '',
        method: req.method as HttpMethod,
        url: req.url,
        headers: parseKV(req.headers),
        params: parseKV(req.params),
        body_type: req.body_type as BodyType,
        body_content: req.body_content,
        body_raw_type: req.body_raw_type as RawBodyType,
        auth_type: req.auth_type as AuthType,
        auth_data: parseAuth(req.auth_data),
        savedRequestId: req.id,
        collectionId: req.collection_id,
        isDirty: false,
      });
      set(s => {
        s.tabs.push(tab);
        s.activeTabId = tab.id;
      });
    },

    openHistoryItem: (item) => {
      const tab = newTab({
        title: `${item.method} ${item.url.slice(0, 30)}`,
        method: item.method as HttpMethod,
        url: item.url,
        headers: parseKV(item.headers),
        params: parseKV(item.params),
        body_type: item.body_type as BodyType,
        body_content: item.body_content,
        body_raw_type: item.body_raw_type as RawBodyType,
        auth_type: item.auth_type as AuthType,
        auth_data: parseAuth(item.auth_data),
      });
      set(s => {
        s.tabs.push(tab);
        s.activeTabId = tab.id;
      });
    },

    setSidebarTab: (tab) => set(s => { s.sidebarTab = tab; }),

    toggleCollection: (id) => {
      set(s => {
        const idx = s.expandedCollections.indexOf(id);
        if (idx >= 0) {
          s.expandedCollections.splice(idx, 1);
        } else {
          s.expandedCollections.push(id);
        }
      });
      // Load requests if not yet loaded
      if (!get().requestsByCollection[id]) {
        get().loadCollectionRequests(id);
      }
    },

    isCollectionExpanded: (id) => get().expandedCollections.includes(id),

    openModal: (modal) => set(s => { s.modal = modal; }),
    closeModal: () => set(s => { s.modal = null; }),
    setLeftPanelWidth: (w) => set(s => { s.leftPanelWidth = w; }),
    setSidebarCollapsed: (collapsed) => set(s => { s.sidebarCollapsed = collapsed; }),
    updateSettings: (patch) => {
      set(s => {
        s.settings = { ...s.settings, ...patch };
        if (typeof window !== 'undefined') {
          localStorage.setItem('postman_clone_settings', JSON.stringify(s.settings));
          if (patch.darkTheme !== undefined) {
            if (patch.darkTheme === false) {
              document.documentElement.classList.add('light-theme');
            } else {
              document.documentElement.classList.remove('light-theme');
            }
          }
        }
      });
    },
  }))
);

// nanoid shim — Next.js edge-safe
function nanoid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
