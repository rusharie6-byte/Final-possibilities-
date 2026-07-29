import { Capacitor } from '@capacitor/core';

// Canonical deployed Cloud Run backend service URL for native APK environment
const DEFAULT_DEPLOYED_BACKEND_URL =
  'https://ais-pre-xki5itro4qvkulz7ttotff-584621251809.europe-west2.run.app';

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

  if (envBase && typeof envBase === 'string' && envBase.trim() !== '') {
    return envBase.replace(/\/+$/, '');
  }

  if (isCapacitorNative()) {
    return DEFAULT_DEPLOYED_BACKEND_URL.replace(/\/+$/, '');
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

  if (envBase && typeof envBase === 'string' && envBase.trim() !== '') {
    return `${envBase.replace(/\/+$/, '')}${cleanPath}`;
  }

  return cleanPath;
};
