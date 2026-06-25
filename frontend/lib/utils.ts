import { HttpMethod } from './types';

export function methodColor(method: HttpMethod | string): string {
  const colors: Record<string, string> = {
    GET: 'text-green-400',
    POST: 'text-yellow-400',
    PUT: 'text-blue-400',
    PATCH: 'text-orange-400',
    DELETE: 'text-red-400',
    HEAD: 'text-purple-400',
    OPTIONS: 'text-pink-400',
  };
  return colors[method?.toUpperCase()] || 'text-gray-400';
}

export function methodBg(method: HttpMethod | string): string {
  const colors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-400 border-green-500/30',
    POST: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    PUT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PATCH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
    HEAD: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    OPTIONS: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };
  return colors[method?.toUpperCase()] || 'bg-gray-500/20 text-gray-400';
}

export function statusColor(status: number | null): string {
  if (!status) return 'text-gray-400';
  if (status < 300) return 'text-green-400';
  if (status < 400) return 'text-yellow-400';
  if (status < 500) return 'text-orange-400';
  return 'text-red-400';
}

export function statusBg(status: number | null): string {
  if (!status) return 'bg-gray-500/20 text-gray-400';
  if (status < 300) return 'bg-green-500/20 text-green-400';
  if (status < 400) return 'bg-yellow-500/20 text-yellow-400';
  if (status < 500) return 'bg-orange-500/20 text-orange-400';
  return 'bg-red-500/20 text-red-400';
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString();
}

export function truncateUrl(url: string, max = 40): string {
  if (url.length <= max) return url;
  return url.slice(0, max) + '…';
}

export function tryFormatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
