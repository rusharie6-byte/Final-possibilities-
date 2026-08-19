import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cloud, Shield, CheckCircle2, AlertCircle, RefreshCw, Key, LogIn, LogOut, User, HardDrive, Sparkles } from 'lucide-react';
import { auth, googleProvider, testFirestoreConnection } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { memoryVaultManager } from '../vault/MemoryVaultManager';
import { memoryStore } from '../utils/memoryStore';
import { audioSynth } from '../utils/audioSynthesizer';

interface CloudVaultManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudVaultManagerModal: React.FC<CloudVaultManagerModalProps> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [isDbOnline, setIsDbOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Trigger auto-restore if empty local
        memoryVaultManager.autoRestoreOnLaunchOrLogin();
      }
    });

    testFirestoreConnection().then((connected) => setIsDbOnline(connected));
    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    try {
      setIsSyncing(true);
      setStatusMessage('Connecting Google Account for Cloud Vault...');
      setStatusType('info');
      audioSynth.playOrbPulse(600, 0.2);

      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setStatusMessage(`Authenticated as ${result.user.email}. Restoring & syncing memory vault...`);
      setStatusType('success');

      // Auto-restore on login
      const restoreRes = await memoryVaultManager.autoRestoreOnLaunchOrLogin();
      if (restoreRes.restored) {
        setStatusMessage(`Restored ${restoreRes.count} memories from ${restoreRes.source} for ${result.user.email}!`);
      } else {
        // Sync current state to cloud
        const syncRes = await memoryVaultManager.syncToCloud();
        setStatusMessage(syncRes.message);
      }
    } catch (err: any) {
      setStatusMessage(`Sign-in error: ${err.message}`);
      setStatusType('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setStatusMessage('Signed out. Local vault remains active.');
      setStatusType('info');
    } catch (err: any) {
      setStatusMessage(`Sign-out error: ${err.message}`);
      setStatusType('error');
    }
  };

  const handleManualSyncNow = async () => {
    setIsSyncing(true);
    setStatusMessage('Syncing encrypted memories to Cloud Firestore & Storage...');
    setStatusType('info');
    audioSynth.playEnergyBloom();

    try {
      const res = await memoryVaultManager.syncToCloud();
      setStatusMessage(res.message);
      setStatusType(res.success ? 'success' : 'error');
    } catch (err: any) {
      setStatusMessage(`Sync error: ${err.message}`);
      setStatusType('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    setIsSyncing(true);
    setStatusMessage('Querying Cloud Firestore for your encrypted vault...');
    setStatusType('info');
    audioSynth.playOrbPulse(800, 0.3);

    try {
      const res = await memoryVaultManager.autoRestoreOnLaunchOrLogin();
      if (res.restored) {
        setStatusMessage(`Successfully restored ${res.count} core memory records from ${res.source}!`);
        setStatusType('success');
      } else {
        setStatusMessage('No older cloud backup found, or local vault already up to date.');
        setStatusType('info');
      }
    } catch (err: any) {
      setStatusMessage(`Restore error: ${err.message}`);
      setStatusType('error');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-zinc-950 border border-purple-500/40 rounded-3xl p-6 shadow-[0_0_60px_rgba(168,85,247,0.35)] flex flex-col gap-5 text-purple-100 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <Cloud className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-bold tracking-wider text-white uppercase">Cloud Memory Vault & Zero-Loss Sync</h3>
                <p className="text-[10px] text-purple-300/70">Automatic cloud backup & reinstall recovery</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-purple-400 hover:text-white hover:bg-purple-950/60 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Account Status Card */}
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-900/60 border border-purple-400/50 flex items-center justify-center text-purple-200">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {user ? user.email : 'No Cloud Account Linked'}
                  </div>
                  <div className="text-[10px] text-purple-300/70">
                    {user ? 'Google Account Connected (Cloud Auto-Sync Active)' : 'Local Storage Only (Sign in to prevent data loss on uninstall)'}
                  </div>
                </div>
              </div>
              <div>
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={handleSignIn}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-1.5 transition-all"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Connect Google</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sync metrics */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-500/20 text-xs">
              <div className="p-2.5 rounded-xl bg-black/50 border border-purple-500/20 flex flex-col">
                <span className="text-[10px] text-purple-400 uppercase font-mono">Protected Memories</span>
                <span className="text-sm font-bold text-white font-mono">{memoryStore.getCoreMemories().length} items</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/50 border border-purple-500/20 flex flex-col">
                <span className="text-[10px] text-purple-400 uppercase font-mono">Auto-Sync Status</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {user ? 'Cloud Live' : 'Local Resilient'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleManualSyncNow}
              disabled={isSyncing}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs uppercase transition-all shadow-[0_0_15px_#A855F7] flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Backup Vault Now</span>
            </button>
            <button
              onClick={handleRestoreFromCloud}
              disabled={isSyncing}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase transition-all shadow-[0_0_15px_#6366F1] flex items-center justify-center gap-2"
            >
              <HardDrive className="w-4 h-4" />
              <span>Restore Cloud Backup</span>
            </button>
          </div>

          {/* Status feedback */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusType === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : statusType === 'error'
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                : 'bg-purple-950/50 border-purple-500/40 text-purple-200'
            }`}>
              {statusType === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : statusType === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              )}
              <span className="leading-snug">{statusMessage}</span>
            </div>
          )}

          {/* Guarantee Note */}
          <div className="p-3 rounded-xl bg-black/40 border border-purple-500/20 text-[10px] text-purple-300/80 leading-relaxed flex items-start gap-2">
            <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>
              <strong>Zero Memory Loss Guarantee</strong>: All conversations, personal facts, directives, and autonomous neural states are AES-256 encrypted before leaving your device. If you uninstall and reinstall the app, connecting your Google account will immediately restore your complete brain vault.
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
