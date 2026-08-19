import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mic, Cloud, HardDrive, Check, X } from 'lucide-react';
import { audioSynth } from '../utils/audioSynthesizer';

interface FirstLaunchPermissionModalProps {
  isOpen: boolean;
  onGrantMicrophone: () => Promise<void>;
  onGrantCloudBackup: () => Promise<void>;
  onDismiss: () => void;
  micGranted: boolean;
  cloudGranted: boolean;
}

export const FirstLaunchPermissionModal: React.FC<FirstLaunchPermissionModalProps> = ({
  isOpen,
  onGrantMicrophone,
  onGrantCloudBackup,
  onDismiss,
  micGranted,
  cloudGranted,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-zinc-950 border border-purple-500/50 rounded-3xl p-6 shadow-[0_0_80px_rgba(168,85,247,0.4)] flex flex-col gap-5 text-purple-100 font-sans"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-purple-500/20 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-900/60 border border-purple-400 flex items-center justify-center text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <ShieldCheck className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">INITIAL SETUP PERMISSIONS</h2>
              <p className="text-xs text-purple-300/70">Required for zero memory loss & voice cognition</p>
            </div>
          </div>

          <p className="text-xs text-purple-200/90 leading-relaxed">
            Welcome to <strong>Possibilities</strong>. To guarantee zero memory loss across uninstalls/reinstalls and enable voice interaction, please review the initial device capabilities below:
          </p>

          {/* Permissions List */}
          <div className="flex flex-col gap-3">
            {/* 1. Microphone Permission */}
            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-900/50 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Microphone & Speech</span>
                    {micGranted && <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-500/40">Granted</span>}
                  </div>
                  <div className="text-[10px] text-purple-300/70">
                    Enables voice interaction and live companion speech
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  audioSynth.playOrbPulse(500, 0.1);
                  await onGrantMicrophone();
                }}
                disabled={micGranted}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  micGranted
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 cursor-default'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                }`}
              >
                {micGranted ? <Check className="w-3.5 h-3.5" /> : 'Allow'}
              </button>
            </div>

            {/* 2. Cloud Memory Vault Permission & Google Link */}
            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-900/50 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Cloud Vault & Reinstall Recovery</span>
                    {cloudGranted && <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-500/40">Connected</span>}
                  </div>
                  <div className="text-[10px] text-purple-300/70">
                    Auto-backs up encrypted memories to restore after reinstall
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  audioSynth.playOrbPulse(700, 0.2);
                  await onGrantCloudBackup();
                }}
                disabled={cloudGranted}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  cloudGranted
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                }`}
              >
                {cloudGranted ? <Check className="w-3.5 h-3.5" /> : 'Connect'}
              </button>
            </div>
          </div>

          {/* Continue / Done Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                audioSynth.playEnergyBloom();
                onDismiss();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all"
            >
              Continue to Possibilities
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
