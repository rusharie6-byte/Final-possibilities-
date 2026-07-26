import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sliders, ChevronLeft, Sparkles, Home } from 'lucide-react';
import { AppRoute, NexusSectionId, SystemMode } from './types';
import { Orb } from './components/Orb';
import { OrbEntryOverlay } from './components/OrbEntryOverlay';
import { TheNexus } from './components/TheNexus';
import { BrainView } from './components/BrainView';
import { MissionsView } from './components/MissionsView';
import { ChatView } from './components/ChatView';
import { MemoryView } from './components/MemoryView';
import { CommandCenterView } from './components/CommandCenterView';
import { OrbDefenseView } from './components/OrbDefenseView';
import { FloatingGlassNav } from './components/FloatingGlassNav';
import { AmbientParticlesCanvas } from './components/AmbientParticlesCanvas';
import { SearchOverlay } from './components/SearchOverlay';
import { SettingsModal } from './components/SettingsModal';
import { audioSynth } from './utils/audioSynthesizer';

export default function App() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [systemMode, setSystemMode] = useState<SystemMode>('calm');
  const [isEntrySequenceTriggered, setIsEntrySequenceTriggered] = useState(false);
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

  // Handle User Tap on Home Screen Orb -> Triggers Mandatory 900ms Entry Sequence Contract
  const handleHomeOrbClick = () => {
    if (isEntrySequenceTriggered) return;
    setIsEntrySequenceTriggered(true);
    audioSynth.startAmbientHum();
  };

  const handleSequenceComplete = () => {
    setIsEntrySequenceTriggered(false);
    setRoute('nexus');
  };

  const handleSelectNexusSection = (sectionId: NexusSectionId) => {
    setRoute(sectionId);
  };

  const handleCollapseNexus = () => {
    audioSynth.playOrbPulse(120, 0.3);
    setRoute('home');
  };

  const isFeatureRoute = ['brain', 'missions', 'chat', 'memory', 'commandCenter', 'orbDefense'].includes(route);

  return (
    <div className="min-h-screen w-full bg-[#030008] text-purple-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white overflow-x-hidden relative">
      {/* Living Atmospheric Depth Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Mouse Parallax Plasma Particles */}
        <AmbientParticlesCanvas />

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

      {/* Mandatory Animation Entry Contract Overlay */}
      <OrbEntryOverlay
        isTriggered={isEntrySequenceTriggered}
        onSequenceComplete={handleSequenceComplete}
      />

      {/* Global Search and Settings Overlays */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(targetRoute) => setRoute(targetRoute)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Top Persistent Frosted Glass Header Bar */}
      {route !== 'home' && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between z-30 border-b border-white/10 backdrop-blur-2xl sticky top-0 bg-black/60 shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)]"
        >
          {/* Left: Back to Nexus / Home Button */}
          <button
            onClick={() => {
              audioSynth.playNodeClick(400);
              if (isFeatureRoute) setRoute('nexus');
              else setRoute('home');
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-950/80 to-purple-900/40 hover:from-purple-900/90 hover:to-purple-800/60 border border-white/15 hover:border-purple-300/60 text-xs font-semibold text-purple-100 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
          >
            <ChevronLeft className="w-4 h-4 text-purple-300" />
            <span className="uppercase tracking-wider">{isFeatureRoute ? 'NEXUS' : 'HOME'}</span>
          </button>

          {/* Center: Persistent Floating Identity Orb Contract Rule #4 */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setRoute('nexus')}>
            <Orb
              mode="floating"
              systemMode={systemMode}
              onClick={() => {
                audioSynth.playOrbPulse(200, 0.2);
                setRoute('nexus');
              }}
              onLongPress={() => {
                audioSynth.playOrbPulse(350, 0.6);
                setRoute('nexus');
              }}
            />
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-black tracking-[0.2em] text-white uppercase group-hover:text-purple-200 transition-colors">
                POSSIBILITIES
              </span>
              <span className="text-[9px] text-purple-300/80 tracking-widest font-medium">LIVING OPERATING ENVIRONMENT</span>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                audioSynth.playNodeClick(700);
                setIsSearchOpen(true);
              }}
              className="p-2.5 rounded-full bg-purple-950/50 hover:bg-purple-900/80 border border-white/15 text-purple-200 hover:text-white transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
              title="Search System (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                audioSynth.playNodeClick(800);
                setIsSettingsOpen(true);
              }}
              className="p-2.5 rounded-full bg-purple-950/50 hover:bg-purple-900/80 border border-white/15 text-purple-200 hover:text-white transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
              title="System Configuration"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </motion.header>
      )}

      {/* Main View Container */}
      <main className="flex-1 flex flex-col items-center justify-center relative w-full">
        {/* Persistent Shared Views with Preloaded Offscreen Rendering */}
        <AnimatePresence mode="wait">
          {/* 1. FIRST FRAME: Home Screen */}
          {route === 'home' && (
            <motion.div
              key="home-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center min-h-[85vh] text-center p-4 relative z-10 select-none w-full"
            >
              {/* Title Header */}
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex flex-col items-center gap-2 mb-6"
              >
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/50 border border-purple-500/30 text-[10px] tracking-widest uppercase text-purple-300">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>EXPERIENCE LAYER vFINAL-C1</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-[0.25em] text-white uppercase drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                  POSSIBILITIES
                </h1>
              </motion.div>

              {/* Central Identity Hero Orb */}
              <div className="my-4 relative">
                <Orb
                  mode="hero"
                  systemMode={systemMode}
                  isEnergized={isEntrySequenceTriggered}
                  glowExpansionPx={isEntrySequenceTriggered ? 180 : 40}
                  onClick={handleHomeOrbClick}
                />
              </div>

              {/* Interactive Prompt Callout */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mt-6 flex flex-col items-center gap-2"
              >
                <button
                  onClick={handleHomeOrbClick}
                  className="px-6 py-2.5 rounded-full bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-xs font-bold tracking-widest text-purple-200 uppercase transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_35px_rgba(168,85,247,0.7)]"
                >
                  TAP THE ORB TO INITIALIZE NEXUS
                </button>
                <span className="text-[10px] text-purple-400/60 tracking-wider">
                  PRESS ORB OR SPACEBAR TO ENGAGE SEQUENCE
                </span>
              </motion.div>
            </motion.div>
          )}

          {/* 2. THE NEXUS: Orbital Command Hub */}
          {route === 'nexus' && (
            <motion.div
              key="nexus-screen"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex-1 flex flex-col items-center justify-center relative p-4"
            >
              <TheNexus
                onSelectSection={handleSelectNexusSection}
                onCollapseNexus={handleCollapseNexus}
              />

              {/* Central Orb inside Nexus */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
                <Orb
                  mode="nexus"
                  systemMode={systemMode}
                  onClick={handleCollapseNexus}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. PERSISTENT PRELOADED DESTINATION MODULES (Instant Keep-Alive Navigation) */}
        {route !== 'home' && route !== 'nexus' && (
          <div className="w-full relative">
            <div className={`w-full pb-20 transform-gpu transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1) ${route === 'brain' ? 'opacity-100 scale-100 pointer-events-auto block' : 'opacity-0 scale-95 pointer-events-none hidden'}`}>
              <BrainView />
            </div>

            <div className={`w-full pb-20 transform-gpu transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1) ${route === 'missions' ? 'opacity-100 scale-100 pointer-events-auto block' : 'opacity-0 scale-95 pointer-events-none hidden'}`}>
              <MissionsView />
            </div>

            <div className={`w-full pb-20 transform-gpu transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1) ${route === 'chat' ? 'opacity-100 scale-100 pointer-events-auto block' : 'opacity-0 scale-95 pointer-events-none hidden'}`}>
              <ChatView />
            </div>

            <div className={`w-full pb-20 transform-gpu transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1) ${route === 'memory' ? 'opacity-100 scale-100 pointer-events-auto block' : 'opacity-0 scale-95 pointer-events-none hidden'}`}>
              <MemoryView />
            </div>

            <div className={`w-full pb-20 transform-gpu transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1) ${route === 'commandCenter' ? 'opacity-100 scale-100 pointer-events-auto block' : 'opacity-0 scale-95 pointer-events-none hidden'}`}>
              <CommandCenterView currentMode={systemMode} onModeChange={(mode) => setSystemMode(mode)} />
            </div>

            <div className={`w-full pb-20 transform-gpu transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1) ${route === 'orbDefense' ? 'opacity-100 scale-100 pointer-events-auto block' : 'opacity-0 scale-95 pointer-events-none hidden'}`}>
              <OrbDefenseView />
            </div>
          </div>
        )}
      </main>

      {/* Floating Glass Bottom Navigation Bar */}
      {route !== 'home' && (
        <FloatingGlassNav
          currentRoute={route}
          onNavigate={(target) => setRoute(target)}
        />
      )}
    </div>
  );
}
