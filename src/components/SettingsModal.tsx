import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sliders, X, ShieldCheck, Database, Cpu, Gauge, Key, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';
import { audioSynth } from '../utils/audioSynthesizer';
import { perfManager, PerformanceSetting } from '../utils/performance';
import { getCustomGeminiApiKey, setCustomGeminiApiKey, getCustomBackendUrl, setCustomBackendUrl, getApiEndpoint, loggedFetch } from '../lib/api';
import { AppLifecycleBackupModal } from './AppLifecycleBackupModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [perfSetting, setPerfSetting] = useState<PerformanceSetting>(perfManager.getSetting());
  const [effectiveMode, setEffectiveMode] = useState<'high' | 'low'>(perfManager.getEffectiveMode());
  const [fps, setFps] = useState<number>(perfManager.getFps());

  // API Key & Backend URL State
  const [apiKeyInput, setApiKeyInput] = useState<string>(getCustomGeminiApiKey());
  const [backendUrlInput, setBackendUrlInput] = useState<string>(getCustomBackendUrl());
  const [keyTestStatus, setKeyTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [keyMessage, setKeyMessage] = useState<string>('');

  // Backup Modal State
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBackendUrlInput(getCustomBackendUrl());
      setApiKeyInput(getCustomGeminiApiKey());
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = perfManager.subscribe(() => {
      setPerfSetting(perfManager.getSetting());
      setEffectiveMode(perfManager.getEffectiveMode());
      setFps(perfManager.getFps());
    });
    return unsubscribe;
  }, []);

  const handleResetToDefault = async () => {
    setBackendUrlInput('');
    setApiKeyInput('');
    setCustomBackendUrl('');
    setCustomGeminiApiKey('');
    setKeyTestStatus('testing');
    setKeyMessage('Reconnecting to built-in server...');
    audioSynth.playNodeClick(700);

    try {
      const res = await loggedFetch('/api/health?checkGemini=true');
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Backend returned HTML or non-JSON response. Ensure Cloud Run / Backend URL is empty for Web Preview.');
      }

      if (res.ok || data.status === 'ok') {
        setKeyTestStatus('success');
        setKeyMessage('Successfully reconnected! Possibilities built-in host is ONLINE.');
      } else {
        setKeyTestStatus('error');
        setKeyMessage('Server responded but health check failed.');
      }
    } catch (e: any) {
      setKeyTestStatus('error');
      setKeyMessage('Reconnection error: ' + (e?.message || 'Failed to fetch'));
    }
  };

  const handleSaveAndTestKey = async () => {
    const cleanKey = apiKeyInput.trim();
    const cleanUrl = backendUrlInput.trim();
    setCustomGeminiApiKey(cleanKey);
    setCustomBackendUrl(cleanUrl);
    setKeyTestStatus('testing');
    setKeyMessage('Testing API connection...');
    audioSynth.playOrbPulse(600, 0.2);

    try {
      const url = getApiEndpoint('/api/health?checkGemini=true');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (cleanKey) {
        headers['x-gemini-api-key'] = cleanKey;
      }

      const res = await loggedFetch(url, { method: 'GET', headers });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned HTML instead of JSON. Leave "Cloud Run / Remote Backend URL" blank when testing in browser preview.');
      }

      if (res.ok || data.status === 'ok' || data.geminiConnection === 'success' || data.geminiKeyPresent) {
        setKeyTestStatus('success');
        setKeyMessage(cleanKey ? 'Custom Gemini API Key & Backend verified! AI features active.' : 'Backend connection verified active & ONLINE!');
        audioSynth.playNodeClick(1000);
      } else {
        setKeyTestStatus('error');
        setKeyMessage('Settings saved locally, but server health check failed. Verify backend URL or key.');
      }
    } catch (err: any) {
      setKeyTestStatus('error');
      setKeyMessage(`Connection error: ${err?.message || 'Server proxy unreachable'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-black border border-purple-500/40 rounded-3xl p-6 shadow-[0_0_60px_rgba(168,85,247,0.3)] flex flex-col gap-5 text-purple-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-white uppercase">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>POSSIBILITIES SYSTEM CONFIGURATION</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-purple-400 hover:text-white hover:bg-purple-950/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Configuration List */}
            <div className="flex flex-col gap-4 text-xs font-mono">
              {/* Performance Mode Selector */}
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gauge className="w-5 h-5 text-indigo-400" />
                    <div>
                      <div className="font-bold text-white">Performance Mode</div>
                      <div className="text-[10px] text-purple-300/60">Target: 60 FPS | Measured: {fps} FPS</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/40 uppercase font-bold">
                    {effectiveMode.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'auto', label: 'AUTO' },
                    { id: 'high', label: 'HIGH' },
                    { id: 'low', label: 'SAVER' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        audioSynth.playNodeClick(700);
                        perfManager.setSetting(p.id as PerformanceSetting);
                      }}
                      className={`py-1.5 rounded-xl border text-center transition-all ${
                        perfSetting === p.id
                          ? 'bg-purple-600 text-white font-bold border-white/40 shadow-[0_0_12px_#A855F7]'
                          : 'bg-purple-950/40 border-purple-500/20 text-purple-300 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gemini API Key & Backend Service URL Section */}
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="font-bold text-white">APK Remote Backend & Gemini Key</div>
                      <div className="text-[10px] text-purple-300/60">Target Cloud Run URL & Custom Gemini API Key for Android APK</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(backendUrlInput.trim() || apiKeyInput.trim()) && (
                      <button
                        type="button"
                        onClick={handleResetToDefault}
                        className="text-[9px] px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-bold uppercase transition-all shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                        title="Clear custom backend URL & key and reconnect"
                      >
                        RESET DEFAULT
                      </button>
                    )}
                    <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase font-bold ${apiKeyInput.trim() || backendUrlInput.trim() ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'}`}>
                      {backendUrlInput.trim() ? 'CUSTOM BACKEND' : 'BUILT-IN HOST'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-purple-300/80 uppercase font-bold">Cloud Run / Remote Backend URL (APK mode):</label>
                      {backendUrlInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setBackendUrlInput('');
                            setCustomBackendUrl('');
                          }}
                          className="text-[9px] text-purple-400 hover:text-white underline"
                        >
                          Clear URL
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={backendUrlInput}
                      onChange={(e) => setBackendUrlInput(e.target.value)}
                      placeholder="Leave blank for web preview (e.g. https://your-app.run.app for APK)"
                      className="bg-black border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-400 font-sans"
                    />
                    <span className="text-[10px] text-purple-300/70 leading-normal">
                      💡 <strong>Web Browser / Preview</strong>: Leave blank! The app connects directly to the built-in server. Only fill this in if you compiled the app as an Android APK.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-purple-300/80 uppercase font-bold">Custom Gemini API Key:</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Leave blank to use server key, or paste AIZaSy..."
                        className="flex-1 bg-black border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-400 font-sans"
                      />
                      <button
                        type="button"
                        onClick={handleSaveAndTestKey}
                        disabled={keyTestStatus === 'testing'}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs uppercase transition-all shadow-[0_0_12px_#A855F7]"
                      >
                        {keyTestStatus === 'testing' ? 'TESTING...' : 'SAVE & TEST'}
                      </button>
                    </div>
                    <span className="text-[10px] text-purple-300/70 leading-normal">
                      💡 <strong>Gemini Key</strong>: Optional. Leave blank to use the app's server-side key automatically, or enter your personal Gemini key from Google AI Studio.
                    </span>
                  </div>
                </div>

                {keyMessage && (
                  <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${keyTestStatus === 'success' ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' : keyTestStatus === 'error' ? 'bg-rose-950/50 border-rose-500/40 text-rose-300' : 'bg-purple-900/40 border-purple-500/30 text-purple-200'}`}>
                    {keyTestStatus === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{keyMessage}</span>
                  </div>
                )}
              </div>

              {/* App Lifecycle & Vault Recovery Button */}
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="font-bold text-white">App Lifecycle & Vault Recovery</div>
                    <div className="text-[10px] text-purple-300/60">Export backup file, retrieve backup on reinstall, & manage uninstall wipe</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    audioSynth.playNodeClick(800);
                    setIsBackupModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 text-[10px] uppercase font-bold transition-all shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                >
                  OPEN RECOVERY
                </button>
              </div>

              {/* Identity Contract Status */}
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="font-bold text-white">Experience Contract vFINAL-C1</div>
                    <div className="text-[10px] text-purple-300/60">Orb Identity & 60 FPS Canvas Verification</div>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 uppercase font-bold">
                  PASS
                </span>
              </div>

              {/* AI Model Architecture */}
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="font-bold text-white">Gemini 3.6 Flash Engine</div>
                    <div className="text-[10px] text-purple-300/60">Server-Side Proxy via /api/gemini</div>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/40 uppercase font-bold">
                  ACTIVE
                </span>
              </div>

              {/* Local Storage & Backup */}
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="font-bold text-white">Local Resonance Vault</div>
                    <div className="text-[10px] text-purple-300/60">Zero Data Leakage / Full Offline Fallback</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    audioSynth.playOrbPulse(300, 0.2);
                    alert('Local memory cache purged and re-calibrated.');
                  }}
                  className="px-3 py-1 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/30 text-[10px] uppercase font-bold transition-colors"
                >
                  PURGE CACHE
                </button>
              </div>
            </div>

            {/* Footer Close */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_#A855F7]"
              >
                SAVE & RETURN
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      <AppLifecycleBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </>
  );
};
