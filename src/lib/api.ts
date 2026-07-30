import { Capacitor } from '@capacitor/core';

// Canonical deployed Cloud Run backend service URL for native APK environment
const DEFAULT_DEPLOYED_BACKEND_URL =
  'https://possibilities-shell.ai.studio';

/**
 * Detects whether the application is executing inside a Capacitor Native App (Android/iOS)
 */
export const isCapacitorNative = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    if (Capacitor.isNativePlatform()) return true;
    const platform = Capacitor.getPlatform();
    if (platform === 'android' || platform === 'ios') return true;
  } catch (e) {
    // Ignore error and check fallback window object
  }

  const cap = (window as any).Capacitor;
  if (cap && typeof cap.getPlatform === 'function') {
    const platform = cap.getPlatform();
    if (platform === 'android' || platform === 'ios') return true;
  }

  const isProtocolNative =
    window.location.protocol === 'capacitor:' || window.location.protocol === 'file:';
  const isHostLocalNative =
    window.location.hostname === 'localhost' && typeof cap !== 'undefined';

  return isProtocolNative || isHostLocalNative;
};

/**
 * Returns the backend API base origin (without trailing slash).
 * - Inside Capacitor Native (Android/iOS): Returns the deployed remote backend URL (NEVER localhost).
 * - On Web Browser: Uses relative origin or explicit VITE_BACKEND_URL.
 */
export const getApiBaseUrl = (): string => {
  const envBase =
    (import.meta as any).env?.VITE_BACKEND_URL ||
    (import.meta as any).env?.VITE_API_BASE_URL;

  if (isCapacitorNative()) {
    // Native Android APK cannot authenticate against internal ais-dev auth proxies
    if (envBase && typeof envBase === 'string' && envBase.trim() !== '' && !envBase.includes('ais-dev')) {
      return envBase.replace(/\/+$/, '');
    }
    return DEFAULT_DEPLOYED_BACKEND_URL.replace(/\/+$/, '');
  }

  if (envBase && typeof envBase === 'string' && envBase.trim() !== '') {
    return envBase.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  return DEFAULT_DEPLOYED_BACKEND_URL.replace(/\/+$/, '');
};

/**
 * Resolves full absolute URL for any API endpoint path (e.g. '/api/gemini', '/api/health').
 * Ensures 100% unified URL resolution across Orb health checks, Gemini chat, microphone voice input,
 * long-term memory, and brain synthesis.
 */
export const getApiEndpoint = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (isCapacitorNative()) {
    const base = getApiBaseUrl();
    return `${base}${cleanPath}`;
  }

  const envBase =
    (import.meta as any).env?.VITE_BACKEND_URL ||
    (import.meta as any).env?.VITE_API_BASE_URL;

  // On web browser inside AI Studio or dev container, prefer relative path for same-origin
  if (envBase && typeof envBase === 'string' && envBase.trim() !== '' && !envBase.includes('ais-dev')) {
    return `${envBase.replace(/\/+$/, '')}${cleanPath}`;
  }

  return cleanPath;
};

export interface NetworkLogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  body?: string;
  error?: string;
  durationMs?: number;
}

type LogListener = (logs: NetworkLogEntry[]) => void;

let networkLogsStore: NetworkLogEntry[] = [];
const logListeners: Set<LogListener> = new Set();

export const subscribeNetworkLogs = (listener: LogListener): (() => void) => {
  logListeners.add(listener);
  listener([...networkLogsStore]);
  return () => {
    logListeners.delete(listener);
  };
};

export const clearNetworkLogs = () => {
  networkLogsStore = [];
  logListeners.forEach((fn) => fn([]));
};

const addNetworkLogEntry = (entry: NetworkLogEntry) => {
  networkLogsStore = [entry, ...networkLogsStore].slice(0, 50);
  logListeners.forEach((fn) => fn([...networkLogsStore]));
};

/**
 * Wrapper for window.fetch that logs:
 * - Exact URL being called
 * - HTTP method
 * - Response status
 * - Response body
 * - Any fetch error
 */
export const loggedFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const urlString =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

  const method = init?.method || 'GET';
  const startTime = Date.now();
  const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const timestamp = new Date().toLocaleTimeString();

  console.log(`[NETWORK REQUEST] Method: ${method} | URL: ${urlString}`);

  try {
    const response = await fetch(input, init);
    const durationMs = Date.now() - startTime;

    // Clone response to read body without consuming original stream
    const clone = response.clone();
    let bodyText = '';
    try {
      bodyText = await clone.text();
    } catch (e) {
      bodyText = '[Unreadable body stream]';
    }

    console.log(
      `[NETWORK RESPONSE] URL: ${urlString} | Status: ${response.status} ${response.statusText} | Body: ${
        bodyText.length > 500 ? bodyText.substring(0, 500) + '...' : bodyText
      }`
    );

    addNetworkLogEntry({
      id,
      timestamp,
      method,
      url: urlString,
      status: response.status,
      statusText: response.statusText,
      body: bodyText,
      durationMs,
    });

    return response;
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    const errMsg = error?.message || String(error) || 'Failed to fetch (ERR_CONNECTION_REFUSED or Network Failure)';

    console.error(
      `[NETWORK ERROR] URL: ${urlString} | Method: ${method} | Error:`,
      error
    );

    addNetworkLogEntry({
      id,
      timestamp,
      method,
      url: urlString,
      status: 0,
      statusText: 'FETCH_ERROR',
      error: errMsg,
      durationMs,
    });

    throw error;
  }
};

