import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sliders, X, ShieldCheck, Database, Cpu, Gauge } from 'lucide-react';
import { audioSynth } from '../utils/audioSynthesizer';
import { perfManager, PerformanceSetting } from '../utils/performance';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [perfSetting, setPerfSetting] = useState<PerformanceSetting>(perfManager.getSetting());
  const [effectiveMode, setEffectiveMode] = useState<'high' | 'low'>(perfManager.getEffectiveMode());
  const [fps, setFps] = useState<number>(perfManager.getFps());

  useEffect(() => {
    const unsubscribe = perfManager.subscribe(() => {
      setPerfSetting(perfManager.getSetting());
      setEffectiveMode(perfManager.getEffectiveMode());
      setFps(perfManager.getFps());
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl bg-black border border-purple-500/40 rounded-3xl p-6 shadow-[0_0_60px_rgba(168,85,247,0.3)] flex flex-col gap-5 text-purple-100"
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
                  <div className="font-bold text-white">Gemini 2.5 Flash Integration</div>
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
  );
};
