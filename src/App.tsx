import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { AppRoute, SystemMode } from './types';
import { HomeCompanionView } from './components/HomeCompanionView';
import { BrainView } from './components/BrainView';
import { MissionsView } from './components/MissionsView';
import { ChatView } from './components/ChatView';
import { MemoryView } from './components/MemoryView';
import { CommandCenterView } from './components/CommandCenterView';
import { OrbDefenseView } from './components/OrbDefenseView';
import { AmbientParticlesCanvas } from './components/AmbientParticlesCanvas';
import { SearchOverlay } from './components/SearchOverlay';
import { SettingsModal } from './components/SettingsModal';
import { audioSynth } from './utils/audioSynthesizer';

export default function App() {
  // activeOverlay manages temporary overlays over the permanently mounted Home Companion Environment
  const [activeOverlay, setActiveOverlay] = useState<AppRoute | null>(null);
  const [systemMode, setSystemMode] = useState<SystemMode>('calm');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCloseOverlay = () => {
    audioSynth.playOrbPulse(120, 0.3);
    setActiveOverlay(null);
  };

  const handleOpenPanelFromVoice = (panelId: string) => {
    if (!panelId) {
      setActiveOverlay(null);
      return;
    }
    if (panelId === 'settings') setIsSettingsOpen(true);
    else if (panelId === 'search') setIsSearchOpen(true);
    else setActiveOverlay(panelId as AppRoute);
  };

  const isFeatureOverlay =
    activeOverlay &&
    ['brain', 'missions', 'chat', 'memory', 'commandCenter', 'orbDefense'].includes(activeOverlay);

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#030008] text-purple-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white overflow-x-hidden relative">
      {/* Living Atmospheric Depth Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft Radial Energy Nebulae */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-purple-900/25 via-indigo-900/10 to-transparent blur-[120px] rounded-full animate-pulse-glow" />
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-radial from-fuchsia-900/15 via-purple-950/5 to-transparent blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-radial from-cyan-950/20 via-indigo-950/10 to-transparent blur-[100px] rounded-full" />

        {/* Dynamic 3D Matrix Stars/Grid Lines */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.8) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Global Search and Settings Overlays */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(targetRoute) => {
          setIsSearchOpen(false);
          setActiveOverlay(targetRoute);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Main Environment Container */}
      <main className="flex-1 flex flex-col items-center justify-center relative w-full">
        {/* PERMANENT ANCHOR: HOME COMPANION ENVIRONMENT (ALWAYS MOUNTED & ACTIVE) */}
        <HomeCompanionView
          systemMode={systemMode}
          onEnterNexus={() => {}}
          onOpenPanel={handleOpenPanelFromVoice}
          onSystemModeChange={(mode) => setSystemMode(mode)}
        />

        {/* TEMPORARY SUBSYSTEM OVERLAY SHEETS (FLOATS OVER HOME WHILE ORB & CONTROLS REMAIN VISIBLE) */}
        <AnimatePresence>
          {isFeatureOverlay && (
            <>
              {/* Semi-translucent Backdrop */}
              <motion.div
                key="overlay-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
                onClick={handleCloseOverlay}
              />

              {/* Floating Glass Sheet Overlay */}
              <motion.div
                key="temporary-panel-overlay"
                initial={{ opacity: 0, y: 25, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 25, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-x-3 top-10 bottom-24 z-40 sm:inset-x-6 sm:top-14 sm:bottom-24 mx-auto max-w-4xl flex flex-col pointer-events-none"
              >
                <div className="pointer-events-auto w-full h-full overflow-y-auto rounded-2xl bg-black/80 border border-purple-500/35 backdrop-blur-2xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-purple-100 flex flex-col gap-4 custom-scrollbar">
                  {/* Sleek Header */}
                  <div className="w-full flex items-center justify-between pb-3 border-b border-purple-500/25 sticky top-0 z-50 bg-black/70 backdrop-blur-md py-1 px-2 rounded-lg">
                    <span className="text-[11px] font-bold tracking-widest uppercase text-purple-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                      {activeOverlay?.toUpperCase()}
                    </span>

                    <button
                      onClick={handleCloseOverlay}
                      className="p-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all backdrop-blur-md flex items-center gap-1.5 px-3 py-1 text-xs font-semibold"
                      title="Close Overlay"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>CLOSE</span>
                    </button>
                  </div>

                  {/* Panel Content Modules */}
                  <div className="w-full pb-4">
                    {activeOverlay === 'brain' && <BrainView />}
                    {activeOverlay === 'missions' && <MissionsView />}
                    {activeOverlay === 'chat' && <ChatView />}
                    {activeOverlay === 'memory' && <MemoryView />}
                    {activeOverlay === 'commandCenter' && (
                      <CommandCenterView
                        currentMode={systemMode}
                        onModeChange={(mode) => setSystemMode(mode)}
                      />
                    )}
                    {activeOverlay === 'orbDefense' && <OrbDefenseView />}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

