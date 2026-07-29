import React, { useState, useEffect } from 'react';
import { Bug, X, RefreshCw, Trash2, CheckCircle2, AlertTriangle, Globe, Terminal } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import {
  NetworkLogEntry,
  subscribeNetworkLogs,
  clearNetworkLogs,
  getApiBaseUrl,
  getApiEndpoint,
  isCapacitorNative,
  loggedFetch,
} from '../lib/api';

export const DebugNetworkPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<NetworkLogEntry[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeNetworkLogs((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return () => unsubscribe();
  }, []);

  const handleManualTestHealth = async () => {
    setIsTesting(true);
    try {
      const url = getApiEndpoint('/api/health');
      await loggedFetch(url, { method: 'GET' });
    } catch (e) {
      console.error('Manual test failed:', e);
    } finally {
      setIsTesting(false);
    }
  };

  const handleManualTestGemini = async () => {
    setIsTesting(true);
    try {
      const url = getApiEndpoint('/api/gemini');
      await loggedFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Ping test from Debug Panel' }),
      });
    } catch (e) {
      console.error('Manual Gemini test failed:', e);
    } finally {
      setIsTesting(false);
    }
  };

  const platform = typeof window !== 'undefined' ? Capacitor.getPlatform() : 'unknown';
  const nativeDetected = isCapacitorNative();
  const currentOrigin = typeof window !== 'undefined' ? window.location.href : '';
  const resolvedBase = getApiBaseUrl();

  const lastLog = logs[0];
  const hasError = logs.some((l) => l.error || (l.status && l.status >= 400));

  return (
    <>
      {/* Floating Toggle Button Always Visible On Screen */}
      <div className="fixed top-3 left-3 z-[9999] flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-mono font-bold shadow-lg border backdrop-blur-md transition-all ${
            hasError
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50 hover:bg-rose-900'
              : 'bg-indigo-950/90 text-cyan-200 border-cyan-500/40 hover:bg-indigo-900'
          }`}
          title="Open On-Screen Network Debug Panel"
        >
          <Bug className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>NET LOGS</span>
          <span className="px-1.5 py-0.2 bg-black/60 rounded-full text-[10px] text-cyan-300">
            {logs.length}
          </span>
        </button>
      </div>

      {/* Expanded Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex flex-col p-3 sm:p-6 overflow-hidden">
          <div className="w-full max-w-4xl mx-auto h-full flex flex-col bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-cyan-500/20 bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-cyan-300 uppercase tracking-wide">
                  On-Screen Network Debugger
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualTestHealth}
                  disabled={isTesting}
                  className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 rounded text-[11px] text-cyan-200 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  Test /health
                </button>
                <button
                  onClick={handleManualTestGemini}
                  disabled={isTesting}
                  className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-500/40 rounded text-[11px] text-purple-200 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  Test /gemini
                </button>
                <button
                  onClick={clearNetworkLogs}
                  className="px-2 py-1 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 rounded text-[11px] text-rose-300 flex items-center gap-1"
                  title="Clear log entries"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Diagnostic System Info */}
            <div className="p-3 bg-slate-900/50 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">Capacitor Native: </span>
                <span className={nativeDetected ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {nativeDetected ? `YES (${platform})` : `NO (web platform: ${platform})`}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Current Window URL: </span>
                <span className="text-cyan-300 break-all">{currentOrigin}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400">Resolved Backend Base URL: </span>
                <span className="text-emerald-300 font-bold break-all">{resolvedBase}</span>
              </div>
            </div>

            {/* Log Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                  <Globe className="w-8 h-8 mb-2 opacity-50" />
                  <p>No network requests logged yet.</p>
                  <p className="text-[10px] mt-1">Tap 'Test /health' or trigger orb voice chat to record requests.</p>
                </div>
              ) : (
                logs.map((log) => {
                  const isOk = log.status && log.status >= 200 && log.status < 300;
                  return (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border ${
                        isOk
                          ? 'bg-slate-900/90 border-emerald-500/30'
                          : 'bg-rose-950/30 border-rose-500/40'
                      }`}
                    >
                      {/* Top Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5 pb-1 border-b border-slate-800">
                        <div className="flex items-center gap-1.5">
                          {isOk ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          )}
                          <span className="font-bold text-cyan-300">{log.method}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isOk ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                            }`}
                          >
                            {log.status ? `${log.status} ${log.statusText || ''}` : 'FAILED (0)'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {log.timestamp} {log.durationMs ? `(${log.durationMs}ms)` : ''}
                        </div>
                      </div>

                      {/* URL */}
                      <div className="mb-1 text-slate-200 font-bold break-all bg-black/40 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 select-none">URL: </span>
                        {log.url}
                      </div>

                      {/* Error or Body */}
                      {log.error && (
                        <div className="mt-1 text-rose-300 font-semibold bg-rose-950/60 p-2 rounded border border-rose-500/30 break-all">
                          <span className="text-rose-400 font-bold">FETCH ERROR: </span>
                          {log.error}
                        </div>
                      )}

                      {log.body && (
                        <div className="mt-1">
                          <div className="text-[10px] text-slate-400 mb-0.5">Response Body:</div>
                          <pre className="p-2 bg-black/60 rounded text-[11px] text-slate-300 overflow-x-auto max-h-40 whitespace-pre-wrap break-all border border-slate-800/80">
                            {log.body}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
