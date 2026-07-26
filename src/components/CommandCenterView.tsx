import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Sliders, Volume2, VolumeX, Vibrate, Activity, Cpu, Flame, Shield, Zap, Gauge } from 'lucide-react';
import { SystemDiagnostics, SystemMode } from '../types';
import { audioSynth } from '../utils/audioSynthesizer';
import { perfManager, PerformanceSetting } from '../utils/performance';

interface CommandCenterViewProps {
  currentMode: SystemMode;
  onModeChange: (mode: SystemMode) => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  currentMode,
  onModeChange,
}) => {
  const [perfSetting, setPerfSetting] = useState<PerformanceSetting>(perfManager.getSetting());
  const [effectiveMode, setEffectiveMode] = useState<'high' | 'low'>(perfManager.getEffectiveMode());
  const [liveFps, setLiveFps] = useState<number>(perfManager.getFps());

  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics>({
    fps: perfManager.getFps(),
    coreTemperature: '36.4°C',
    neuralLoad: 38,
    activeThreads: 12,
    audioFrequencyHz: 432,
    hapticsEnabled: true,
    soundEnabled: true,
    activeMode: currentMode,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subscribe to perfManager updates
  useEffect(() => {
    const unsubscribe = perfManager.subscribe(() => {
      setPerfSetting(perfManager.getSetting());
      setEffectiveMode(perfManager.getEffectiveMode());
      setLiveFps(perfManager.getFps());
    });
    return unsubscribe;
  }, []);

  // Live Jitter Loop for stats
  useEffect(() => {
    const interval = setInterval(() => {
      setDiagnostics((prev) => ({
        ...prev,
        neuralLoad: Math.floor(32 + Math.random() * 12),
        coreTemperature: `${(36.2 + Math.random() * 0.4).toFixed(1)}°C`,
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Live Oscilloscope Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      phase += 0.05;

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Oscilloscope background grid lines
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw Main Energy Sine Oscilloscope Wave
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle =
        currentMode === 'overdrive'
          ? '#F97316'
          : currentMode === 'intelligence'
          ? '#818CF8'
          : '#A855F7';

      for (let x = 0; x < width; x += 2) {
        const freq = currentMode === 'overdrive' ? 0.04 : 0.02;
        const amp = currentMode === 'overdrive' ? 35 : 20;
        const y = centerY + Math.sin(x * freq + phase) * Math.cos(x * 0.005) * amp;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      if (effectiveMode === 'high') {
        ctx.shadowColor = '#A855F7';
        ctx.shadowBlur = 15;
      }
      ctx.stroke();
      if (effectiveMode === 'high') ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [currentMode, effectiveMode]);

  const handleModeSelect = (mode: SystemMode) => {
    audioSynth.playOrbPulse(mode === 'overdrive' ? 440 : 220, 0.4);
    audioSynth.triggerHaptic([30, 40, 30]);
    onModeChange(mode);
    setDiagnostics((prev) => ({ ...prev, activeMode: mode }));
  };

  const toggleSound = () => {
    const nextSound = !diagnostics.soundEnabled;
    audioSynth.setMuted(!nextSound);
    audioSynth.playNodeClick(nextSound ? 800 : 200);
    setDiagnostics((prev) => ({ ...prev, soundEnabled: nextSound }));
  };

  const toggleHaptics = () => {
    const nextHaptics = !diagnostics.hapticsEnabled;
    if (nextHaptics) audioSynth.triggerHaptic([30, 60, 30]);
    setDiagnostics((prev) => ({ ...prev, hapticsEnabled: nextHaptics }));
  };

  return (
    <div className="w-full max-w-5xl mx-auto min-h-[80vh] flex flex-col p-4 md:p-6 text-purple-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-950/60 border border-purple-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Sliders className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-white uppercase">COMMAND CENTER</h1>
            <p className="text-xs text-purple-300/60 tracking-wide">System Matrix & Live Diagnostics</p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-400">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>FPS: {liveFps} ({effectiveMode === 'high' ? 'HIGH QUALITY' : 'PERFORMANCE MODE'})</span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Oscilloscope Waveform & Diagnostics */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Oscilloscope Container */}
          <div className="p-5 rounded-2xl bg-black/80 border border-white/15 flex flex-col gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest text-white uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                NEURAL ENERGY OSCILLOSCOPE
              </span>
              <span className="text-[10px] font-mono text-purple-300/80">FREQ: 432.00 Hz</span>
            </div>

            <canvas
              ref={canvasRef}
              width={600}
              height={140}
              className="w-full h-32 bg-black/90 rounded-xl border border-white/10 shadow-inner"
            />
          </div>

          {/* Performance Engine Mode Selector */}
          <div className="p-5 rounded-2xl bg-black/80 border border-white/15 flex flex-col gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest text-white uppercase flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-400" />
                AUTOMATIC PERFORMANCE & FRAME PACING
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-200 border border-purple-500/30">
                ACTIVE: {effectiveMode.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'auto', label: 'ADAPTIVE', desc: 'Auto 60 FPS Target' },
                { id: 'high', label: 'HIGH QUALITY', desc: 'Full Bloom & Shadows' },
                { id: 'low', label: 'BATTERY SAVER', desc: 'Optimized Mobile' },
              ].map((p) => {
                const isSelected = perfSetting === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      audioSynth.playNodeClick(600);
                      perfManager.setSetting(p.id as PerformanceSetting);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white border-white/40 shadow-[0_0_20px_#A855F7,inset_0_1px_1px_rgba(255,255,255,0.4)]'
                        : 'bg-purple-950/30 border-white/10 text-purple-200/80 hover:text-white hover:bg-purple-900/50'
                    }`}
                  >
                    <div className="text-xs font-bold tracking-wider uppercase">{p.label}</div>
                    <div className="text-[9px] text-purple-200/70 mt-0.5">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-purple-950/30 border border-white/15 backdrop-blur-xl flex flex-col gap-1 shadow-md">
              <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-bold tracking-wider uppercase">
                <Cpu className="w-3.5 h-3.5" /> Neural Load
              </div>
              <span className="text-lg font-bold text-white font-mono">{diagnostics.neuralLoad}%</span>
            </div>

            <div className="p-4 rounded-xl bg-purple-950/30 border border-white/15 backdrop-blur-xl flex flex-col gap-1 shadow-md">
              <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-bold tracking-wider uppercase">
                <Flame className="w-3.5 h-3.5" /> Core Temp
              </div>
              <span className="text-lg font-bold text-white font-mono">{diagnostics.coreTemperature}</span>
            </div>

            <div className="p-4 rounded-xl bg-purple-950/30 border border-white/15 backdrop-blur-xl flex flex-col gap-1 shadow-md">
              <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-bold tracking-wider uppercase">
                <Zap className="w-3.5 h-3.5" /> Threads
              </div>
              <span className="text-lg font-bold text-white font-mono">{diagnostics.activeThreads} ACTIVE</span>
            </div>

            <div className="p-4 rounded-xl bg-purple-950/30 border border-white/15 backdrop-blur-xl flex flex-col gap-1 shadow-md">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
                <Shield className="w-3.5 h-3.5" /> State
              </div>
              <span className="text-lg font-bold text-emerald-300 font-mono">NOMINAL</span>
            </div>
          </div>
        </div>

        {/* Right Column: System Mode & Audio Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* System Mode Switcher */}
          <div className="p-5 rounded-2xl bg-black/80 border border-white/15 flex flex-col gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl">
            <span className="text-xs font-bold tracking-widest text-white uppercase">SYSTEM RESONANCE MODE</span>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {[
                { id: 'calm', label: 'CALM', desc: 'Balanced Ambient State' },
                { id: 'intelligence', label: 'INTELLIGENCE', desc: 'Maximum Synthesis' },
                { id: 'focus', label: 'DEEP FOCUS', desc: 'Low Noise Isolation' },
                { id: 'overdrive', label: 'OVERDRIVE', desc: 'High Frequency Surge' },
              ].map((m) => {
                const isActive = currentMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModeSelect(m.id as SystemMode)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white border-white/40 shadow-[0_0_20px_#A855F7,inset_0_1px_1px_rgba(255,255,255,0.4)]'
                        : 'bg-purple-950/30 border-white/10 text-purple-200/80 hover:text-white hover:bg-purple-900/50'
                    }`}
                  >
                    <div className="text-xs font-bold tracking-wider uppercase">{m.label}</div>
                    <div className="text-[9px] text-purple-200/70 mt-0.5">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audio & Haptic Controls */}
          <div className="p-5 rounded-2xl bg-black/80 border border-white/15 flex flex-col gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl">
            <span className="text-xs font-bold tracking-widest text-white uppercase">FEEDBACK CONTROLS</span>

            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-purple-200">
                {diagnostics.soundEnabled ? <Volume2 className="w-4 h-4 text-purple-300" /> : <VolumeX className="w-4 h-4 text-purple-500/50" />}
                <span>Synthesizer Audio Feedback</span>
              </div>
              <button
                onClick={toggleSound}
                className={`w-11 h-6 rounded-full p-1 transition-colors ${diagnostics.soundEnabled ? 'bg-purple-600' : 'bg-gray-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${diagnostics.soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-purple-200">
                <Vibrate className="w-4 h-4 text-purple-300" />
                <span>Sub-millisecond Haptics</span>
              </div>
              <button
                onClick={toggleHaptics}
                className={`w-11 h-6 rounded-full p-1 transition-colors ${diagnostics.hapticsEnabled ? 'bg-purple-600' : 'bg-gray-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${diagnostics.hapticsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
