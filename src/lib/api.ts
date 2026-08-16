import { Capacitor } from '@capacitor/core';

// Canonical default backend URL for APK (can be overriden via SettingsModal or localStorage)
const DEFAULT_DEPLOYED_BACKEND_URL =
  (import.meta as any).env?.VITE_BACKEND_URL ||
  (import.meta as any).env?.APP_URL ||
  '';

export const getCustomBackendUrl = (): string => {
  if (typeof localStorage === 'undefined') return '';
  const stored = localStorage.getItem('possibilities_custom_backend_url') || '';
  if (!stored) return '';

  // If in web browser (not APK) and stored URL is an internal ais-dev/ais-pre or same origin URL, clear it
  if (!isCapacitorNative() && typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/+$/, '');
    const cleanStored = stored.trim().replace(/\/+$/, '');
    if (cleanStored === origin || cleanStored.includes('ais-dev') || cleanStored.includes('ais-pre')) {
      localStorage.removeItem('possibilities_custom_backend_url');
      return '';
    }
  }

  return stored;
};

export const setCustomBackendUrl = (url: string): void => {
  if (typeof localStorage === 'undefined') return;
  if (!url || url.trim() === '') {
    localStorage.removeItem('possibilities_custom_backend_url');
  } else {
    localStorage.setItem('possibilities_custom_backend_url', url.trim().replace(/\/+$/, ''));
  }
};

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
  const customBackend = getCustomBackendUrl();
  if (customBackend) {
    return customBackend;
  }

  const envBase =
    (import.meta as any).env?.VITE_BACKEND_URL ||
    (import.meta as any).env?.VITE_API_BASE_URL;

  if (isCapacitorNative()) {
    // Native Android APK cannot authenticate against internal ais-dev auth proxies
    if (envBase && typeof envBase === 'string' && envBase.trim() !== '' && !envBase.includes('ais-dev')) {
      return envBase.replace(/\/+$/, '');
    }
    if (DEFAULT_DEPLOYED_BACKEND_URL) {
      return DEFAULT_DEPLOYED_BACKEND_URL.replace(/\/+$/, '');
    }
    // Fallback: prompt user to set backend URL in Settings if empty in APK
    return 'https://ai.studio';
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

  const customBackend = getCustomBackendUrl();
  if (customBackend) {
    return `${customBackend.replace(/\/+$/, '')}${cleanPath}`;
  }

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

export const getCustomGeminiApiKey = (): string => {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem('possibilities_custom_gemini_key') || '';
};

export const setCustomGeminiApiKey = (key: string): void => {
  if (typeof localStorage === 'undefined') return;
  if (!key || key.trim() === '') {
    localStorage.removeItem('possibilities_custom_gemini_key');
  } else {
    localStorage.setItem('possibilities_custom_gemini_key', key.trim());
  }
};

export const getGeminiApiHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const customKey = getCustomGeminiApiKey();
  if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }
  return headers;
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
  const customKey = getCustomGeminiApiKey();

  // Merge custom API key header if available
  let mergedInit = init ? { ...init } : {};
  if (customKey && (urlString.includes('/api/gemini') || urlString.includes('/api/health'))) {
    const existingHeaders = new Headers(mergedInit.headers || {});
    if (!existingHeaders.has('x-gemini-api-key')) {
      existingHeaders.set('x-gemini-api-key', customKey);
    }
    mergedInit.headers = existingHeaders;
  }

  const startTime = Date.now();
  const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const timestamp = new Date().toLocaleTimeString();

  console.log(`[NETWORK REQUEST] Method: ${method} | URL: ${urlString}`);

  try {
    const response = await fetch(input, mergedInit);
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
    // If an absolute custom backend URL fails in web browser mode, automatically retry with relative path
    if (
      !isCapacitorNative() &&
      (urlString.startsWith('http://') || urlString.startsWith('https://')) &&
      urlString.includes('/api/')
    ) {
      try {
        const relativePath = urlString.substring(urlString.indexOf('/api/'));
        console.log(`[NETWORK FALLBACK] Retrying with relative path: ${relativePath}`);
        const fallbackRes = await fetch(relativePath, mergedInit);
        if (fallbackRes.ok) {
          // Clear bad custom backend URL since relative endpoint works
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('possibilities_custom_backend_url');
          }
          return fallbackRes;
        }
      } catch (fallbackErr) {
        // Continue to log original error
      }
    }

    const durationMs = Date.now() - startTime;
    const errMsg = error?.message || String(error) || 'Failed to fetch (ERR_CONNECTION_REFUSED or Network Failure)';

    console.warn(
      `[NETWORK NOTICE] URL: ${urlString} | Method: ${method} | Error:`,
      errMsg
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

