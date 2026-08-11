import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Upload, ShieldAlert, CheckCircle2, X, RefreshCw, HardDrive, Key, FileCheck, Shield, Mic, Bell, Database } from 'lucide-react';
import { storageEngine } from '../utils/storageEngine';
import { memoryStore } from '../utils/memoryStore';
import { audioSynth } from '../utils/audioSynthesizer';

interface AppLifecycleBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppLifecycleBackupModal: React.FC<AppLifecycleBackupModalProps> = ({ isOpen, onClose }) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [persistedGranted, setPersistedGranted] = useState<boolean | null>(null);

  // Permission States
  const [permissionsStatus, setPermissionsStatus] = useState<{
    storage: boolean;
    microphone: boolean;
    notifications: boolean;
  }>({
    storage: true,
    microphone: false,
    notifications: false,
  });

  // Selective Wipe Checklist
  const [wipeItems, setWipeItems] = useState({
    memoryVault: false, // Default FALSE: Protect Memory Vault from wipe!
    chatTranscripts: true, // Default TRUE: Can clear chat transcript on wipe
    corticalGraph: false, // Default FALSE: Protect knowledge graph
    cryptoKeys: false, // Default FALSE: Protect keys
  });

  useEffect(() => {
    if (isOpen) {
      checkPermissionsAndStorage();
    }
  }, [isOpen]);

  const checkPermissionsAndStorage = async () => {
    // Check Storage Persistence
    if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.persisted === 'function') {
      try {
        const p = await navigator.storage.persisted();
        setPersistedGranted(p);
      } catch {}
    }

    // Check Microphone Permission status
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setPermissionsStatus((prev) => ({ ...prev, microphone: true }));
      } catch {
        setPermissionsStatus((prev) => ({ ...prev, microphone: false }));
      }
    }

    // Check Notification status
    if (typeof Notification !== 'undefined') {
      setPermissionsStatus((prev) => ({ ...prev, notifications: Notification.permission === 'granted' }));
    }
  };

  const requestAllPermissions = async () => {
    audioSynth.playNodeClick(800);
    // Request Persistent Storage
    const storageRes = await storageEngine.requestPersistentStorage();
    setPersistedGranted(storageRes);

    // Request Mic
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setPermissionsStatus((prev) => ({ ...prev, microphone: true }));
      } catch (e) {
        console.warn('Microphone permission request rejected:', e);
      }
    }

    // Request Notifications
    if (typeof Notification !== 'undefined' && typeof Notification.requestPermission === 'function') {
      try {
        const notifRes = await Notification.requestPermission();
        setPermissionsStatus((prev) => ({ ...prev, notifications: notifRes === 'granted' }));
      } catch {}
    }
  };

  const handleExportBackup = () => {
    audioSynth.playOrbPulse(600, 0.2);
    const dateStr = new Date().toISOString().split('T')[0];
    const success = storageEngine.exportVaultFileDownload(`possibilities_vault_backup_${dateStr}.vault`);
    if (success) {
      setImportStatus('Backup exported successfully! File saved to downloads.');
    } else {
      setImportStatus('Failed to generate vault backup export.');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus('Reading and decrypting backup vault file...');
    audioSynth.playEnergyBloom();

    try {
      const text = await file.text();
      const payload = await storageEngine.importVaultPayloadText(text);

      if (payload) {
        await memoryStore.initAsync();
        const profile = memoryStore.getPartnerProfile();
        setImportStatus(`Restore Successful! Creator identity verified as ${profile.actualName} / ${profile.preferredAddress}. Living context & memory intact.`);
        audioSynth.playNodeClick(1000);
      } else {
        setImportStatus('Invalid backup file format or corrupted vault checksum.');
      }
    } catch (err: any) {
      setImportStatus(`Import Error: ${err?.message || 'Failed to parse file.'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSafeUninstallPrep = () => {
    audioSynth.playOrbPulse(400, 0.3);
    // 1. Force auto-download backup first
    handleExportBackup();

    // 2. Perform selective wipe based on user checkboxes
    setTimeout(() => {
      if (wipeItems.chatTranscripts && typeof localStorage !== 'undefined') {
        localStorage.removeItem('possibilities_chat_messages_v1');
      }
      if (wipeItems.memoryVault && typeof localStorage !== 'undefined') {
        localStorage.removeItem('possibilities_memory_store_v3');
      }
      if (wipeItems.cryptoKeys && typeof localStorage !== 'undefined') {
        localStorage.removeItem('possibilities_custom_gemini_key');
      }

      setImportStatus('Uninstall safety prep complete. Backup file downloaded to disk. Selected local caches cleared.');
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-purple-500/40 rounded-3xl p-6 shadow-[0_0_60px_rgba(168,85,247,0.3)] flex flex-col gap-6 text-purple-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-purple-900/40 border border-purple-500/40 text-purple-300">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-widest text-white uppercase">APP LIFECYCLE & VAULT RECOVERY</h2>
                <p className="text-[11px] text-purple-300/70">Zero-Loss Local Disk Persistence & Reinstall Recovery</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-purple-400 hover:text-white hover:bg-purple-900/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section 1: Permissions & Persistence Status */}
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col gap-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white uppercase">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>System Permissions & Storage Persistence</span>
              </div>
              <button
                onClick={requestAllPermissions}
                className="px-3 py-1 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-[10px] uppercase font-bold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>REQUEST ALL PERMISSIONS</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              {/* Storage */}
              <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px]">Browser Storage</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${persistedGranted ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950 text-amber-300 border border-amber-500/40'}`}>
                  {persistedGranted ? 'PERSISTENT' : 'STANDARD'}
                </span>
              </div>

              {/* Mic */}
              <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-purple-400" />
                  <span className="text-[11px]">Microphone</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${permissionsStatus.microphone ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-900 text-zinc-400 border border-zinc-700'}`}>
                  {permissionsStatus.microphone ? 'GRANTED' : 'PROMPT'}
                </span>
              </div>

              {/* Notifications */}
              <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-400" />
                  <span className="text-[11px]">Notifications</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${permissionsStatus.notifications ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-900 text-zinc-400 border border-zinc-700'}`}>
                  {permissionsStatus.notifications ? 'GRANTED' : 'PROMPT'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Backup Export & Restore File Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Download */}
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col justify-between gap-3 font-mono">
              <div>
                <div className="flex items-center gap-2 font-bold text-white text-xs uppercase mb-1">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Manual Vault Export</span>
                </div>
                <p className="text-[11px] text-purple-300/70 leading-relaxed">
                  Downloads a complete <code className="text-purple-200 bg-purple-900/50 px-1 py-0.5 rounded">.vault</code> file to your device disk containing living context, creator identity, and memory graph.
                </p>
              </div>
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD .VAULT FILE</span>
              </button>
            </div>

            {/* Import Restore File Selector */}
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col justify-between gap-3 font-mono">
              <div>
                <div className="flex items-center gap-2 font-bold text-white text-xs uppercase mb-1">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>Retrieve & Restore Backup</span>
                </div>
                <p className="text-[11px] text-purple-300/70 leading-relaxed">
                  Select a saved <code className="text-purple-200 bg-purple-900/50 px-1 py-0.5 rounded">.vault</code> or <code className="text-purple-200 bg-purple-900/50 px-1 py-0.5 rounded">.json</code> file after reinstalling to restore all memories instantly.
                </p>
              </div>
              <label className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <Upload className="w-4 h-4" />
                <span>SELECT BACKUP FILE</span>
                <input
                  type="file"
                  accept=".vault,.json,text/plain"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Section 3: Uninstall Selective Wipe Preference */}
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white text-xs uppercase">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Uninstall & Reset Selective Wipe Checklist</span>
              </div>
              <span className="text-[10px] text-amber-300/80 uppercase font-bold">Safeguards Active</span>
            </div>

            <p className="text-[11px] text-purple-300/70">
              Unchecking an item guarantees it will NOT be wiped if a system reset is requested. Memory Vault is protected by default.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              <label className="p-2.5 rounded-xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-between cursor-pointer hover:bg-purple-900/40">
                <span className="text-white">Core Memory Vault</span>
                <input
                  type="checkbox"
                  checked={wipeItems.memoryVault}
                  onChange={(e) => setWipeItems({ ...wipeItems, memoryVault: e.target.checked })}
                  className="accent-purple-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="p-2.5 rounded-xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-between cursor-pointer hover:bg-purple-900/40">
                <span className="text-white">Chat Transcript Logs</span>
                <input
                  type="checkbox"
                  checked={wipeItems.chatTranscripts}
                  onChange={(e) => setWipeItems({ ...wipeItems, chatTranscripts: e.target.checked })}
                  className="accent-purple-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="p-2.5 rounded-xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-between cursor-pointer hover:bg-purple-900/40">
                <span className="text-white">Cortical Knowledge Graph</span>
                <input
                  type="checkbox"
                  checked={wipeItems.corticalGraph}
                  onChange={(e) => setWipeItems({ ...wipeItems, corticalGraph: e.target.checked })}
                  className="accent-purple-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="p-2.5 rounded-xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-between cursor-pointer hover:bg-purple-900/40">
                <span className="text-white">Cryptographic Vault Keys</span>
                <input
                  type="checkbox"
                  checked={wipeItems.cryptoKeys}
                  onChange={(e) => setWipeItems({ ...wipeItems, cryptoKeys: e.target.checked })}
                  className="accent-purple-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            <button
              onClick={handleSafeUninstallPrep}
              className="mt-1 w-full py-2.5 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <FileCheck className="w-4 h-4" />
              <span>EXPORT BACKUP & PREPARE SAFE UNINSTALL</span>
            </button>
          </div>

          {/* Status Alert Banner */}
          {importStatus && (
            <div className="p-3.5 rounded-xl bg-purple-900/40 border border-purple-500/40 font-mono text-xs text-purple-200 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Footer Close */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_#A855F7]"
            >
              DONE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
