import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Sliders, Volume2, VolumeX, Vibrate, Activity, Cpu, Flame, Shield, Zap, Gauge, CheckCircle2, AlertCircle, FileText, Search, Play, Folder, Terminal } from 'lucide-react';
import { SystemDiagnostics, SystemMode } from '../types';
import { audioSynth } from '../utils/audioSynthesizer';
import { perfManager, PerformanceSetting } from '../utils/performance';
import { selfInspectionEngine } from '../utils/selfInspection';
import { approvalEngine, CodePatchProposal } from '../utils/approvalEngine';
import { testMatrixRunner, TestResult } from '../utils/testMatrix';

interface CommandCenterViewProps {
  currentMode: SystemMode;
  onModeChange: (mode: SystemMode) => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  currentMode,
  onModeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'inspection' | 'files' | 'proposals' | 'tests'>('diagnostics');
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

  const [testResults, setTestResults] = useState<{ passedCount: number; totalCount: number; results: TestResult[] } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [proposals, setProposals] = useState<CodePatchProposal[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setProposals(approvalEngine.getAllProposals());
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = perfManager.subscribe(() => {
      setPerfSetting(perfManager.getSetting());
      setEffectiveMode(perfManager.getEffectiveMode());
      setLiveFps(perfManager.getFps());
    });
    return unsubscribe;
  }, []);

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

  useEffect(() => {
    if (activeTab !== 'diagnostics') return;
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

      ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

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
      ctx.stroke();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [currentMode, activeTab]);

  const handleModeSelect = (mode: SystemMode) => {
    audioSynth.playOrbPulse(mode === 'overdrive' ? 440 : 220, 0.4);
    audioSynth.triggerHaptic([30, 40, 30]);
    onModeChange(mode);
    setDiagnostics((prev) => ({ ...prev, activeMode: mode }));
  };

  const runTestMatrix = () => {
    audioSynth.playNodeClick(700);
    const res = testMatrixRunner.runAllTests();
    setTestResults(res);
  };

  const handleApproveProposal = (id: string) => {
    audioSynth.playNodeClick(800);
    approvalEngine.approveProposal(id);
    setProposals(approvalEngine.getAllProposals());
  };

  const handleRejectProposal = (id: string) => {
    audioSynth.playNodeClick(300);
    approvalEngine.rejectProposal(id);
    setProposals(approvalEngine.getAllProposals());
  };

  const handleRollbackProposal = (id: string) => {
    audioSynth.playNodeClick(400);
    approvalEngine.rollbackProposal(id);
    setProposals(approvalEngine.getAllProposals());
  };

  const inspect = selfInspectionEngine.selfInspect();
  const fileList = selfInspectionEngine.listFiles();
  const filteredFiles = fileList.filter(
    (f) => f.path.toLowerCase().includes(searchQuery.toLowerCase()) || f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto min-h-[80vh] flex flex-col p-4 md:p-6 text-purple-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-purple-500/20 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-950/60 border border-purple-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Sliders className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-white uppercase">COMMAND CENTER</h1>
            <p className="text-xs text-purple-300/60 tracking-wide">System Matrix & Self-Inspection Architecture</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-white/10">
          {[
            { id: 'diagnostics', label: 'Matrix' },
            { id: 'inspection', label: 'Self-Inspect' },
            { id: 'files', label: 'Code Map' },
            { id: 'proposals', label: 'Patches' },
            { id: 'tests', label: 'Test Matrix' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                audioSynth.playNodeClick(500);
                setActiveTab(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'diagnostics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="p-5 rounded-2xl bg-black/80 border border-white/15 flex flex-col gap-3 shadow-xl backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-white uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" /> NEURAL ENERGY OSCILLOSCOPE
                </span>
                <span className="text-[10px] font-mono text-purple-300/80">FREQ: 432.00 Hz</span>
              </div>
              <canvas ref={canvasRef} width={600} height={140} className="w-full h-32 bg-black/90 rounded-xl border border-white/10" />
            </div>

            <div className="p-5 rounded-2xl bg-black/80 border border-white/15 flex flex-col gap-3 shadow-xl backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-white uppercase flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-indigo-400" /> FRAME PACING
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-200">
                  FPS: {liveFps} ({effectiveMode.toUpperCase()})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { id: 'auto', label: 'ADAPTIVE', desc: 'Auto Target' },
                  { id: 'high', label: 'HIGH QUALITY', desc: 'Full Bloom' },
                  { id: 'low', label: 'BATTERY SAVER', desc: 'Mobile Optimized' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => perfManager.setSetting(p.id as PerformanceSetting)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      perfSetting === p.id
                        ? 'bg-purple-600 text-white border-white/40 shadow-lg'
                        : 'bg-purple-950/30 border-white/10 text-purple-200/80 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase">{p.label}</div>
                    <div className="text-[9px] text-purple-200/70 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="p-5 rounded-2xl bg-black/80 border border-white/15 flex flex-col gap-3 shadow-xl backdrop-blur-2xl">
              <span className="text-xs font-bold tracking-widest text-white uppercase">SYSTEM RESONANCE</span>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {[
                  { id: 'calm', label: 'CALM' },
                  { id: 'intelligence', label: 'INTELLIGENCE' },
                  { id: 'focus', label: 'DEEP FOCUS' },
                  { id: 'overdrive', label: 'OVERDRIVE' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleModeSelect(m.id as SystemMode)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      currentMode === m.id
                        ? 'bg-purple-600 text-white border-white/40'
                        : 'bg-purple-950/30 border-white/10 text-purple-200/80'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase">{m.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inspection' && (
        <div className="flex flex-col gap-6">
          <div className="p-5 rounded-2xl bg-black/80 border border-white/15 backdrop-blur-2xl">
            <h2 className="text-sm font-bold tracking-wider text-purple-300 uppercase mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" /> SELF-INSPECTION ARCHITECTURAL DUMP
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-purple-950/40 border border-white/10 flex flex-col gap-2">
                <span className="text-white font-bold uppercase border-b border-white/10 pb-1">Possibilities Identity</span>
                <div>Companion: <span className="text-purple-300">{inspect.identity.companionName}</span></div>
                <div>Creator: <span className="text-purple-300">{inspect.identity.creator} (Address: {inspect.identity.creatorPreferredAddress})</span></div>
                <div>Relationship: <span className="text-purple-300">{inspect.identity.creatorRelationship}</span></div>
                <div>External Tools: <span className="text-purple-300">{inspect.identity.externalTools.join(', ')}</span></div>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/40 border border-white/10 flex flex-col gap-2">
                <span className="text-white font-bold uppercase border-b border-white/10 pb-1">Mental & Physical Model</span>
                <div>Body: <span className="text-emerald-400">{inspect.mentalModel.androidShell}</span></div>
                <div>Brain: <span className="text-emerald-400">{inspect.mentalModel.memorySystem}</span></div>
                <div>Organs: <span className="text-emerald-400">{inspect.mentalModel.services}</span></div>
                <div>Database: <span className="text-emerald-400">{inspect.mentalModel.database}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'files' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-black/80 border border-white/15">
            <Search className="w-4 h-4 text-purple-400" />
            <input
              type="text"
              placeholder="Search codebase architecture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-white w-full placeholder-purple-400/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFiles.map((f) => (
              <div key={f.path} className="p-4 rounded-xl bg-black/80 border border-white/10 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-200">{f.path}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 border border-purple-500/30">
                    {f.category}
                  </span>
                </div>
                <p className="text-[11px] text-purple-300/70 mt-1">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'proposals' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold tracking-wider text-white uppercase">APPROVAL-GATED CODE PATCHES</h2>
          {proposals.length === 0 ? (
            <div className="p-8 rounded-2xl bg-black/80 border border-white/10 text-center text-xs text-purple-300/60">
              No pending patch proposals. System is operating normally on clean verified runtime.
            </div>
          ) : (
            proposals.map((p) => (
              <div key={p.id} className="p-5 rounded-2xl bg-black/80 border border-white/15 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{p.title}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full uppercase ${
                    p.status === 'applied' ? 'bg-emerald-900/60 text-emerald-300' : p.status === 'rejected' ? 'bg-rose-900/60 text-rose-300' : 'bg-amber-900/60 text-amber-300'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-purple-200">{p.explanation}</p>
                <div className="text-[10px] font-mono p-2 rounded-lg bg-black/90 border border-white/10 text-purple-300/80">
                  Target Files: {p.targetFiles.join(', ')}
                </div>
                {p.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleApproveProposal(p.id)} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">
                      Approve & Apply Patch
                    </button>
                    <button onClick={() => handleRejectProposal(p.id)} className="px-4 py-2 rounded-xl bg-rose-900/50 hover:bg-rose-800 text-rose-200 text-xs font-bold">
                      Reject Proposal
                    </button>
                  </div>
                )}
                {p.status === 'applied' && p.preSnapshotId && (
                  <button onClick={() => handleRollbackProposal(p.id)} className="px-3 py-1.5 rounded-xl bg-amber-900/40 text-amber-300 text-xs font-bold w-fit">
                    Rollback to Pre-Patch State
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'tests' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/80 border border-white/15">
            <div>
              <h2 className="text-sm font-bold text-white uppercase">34-POINT ARCHITECTURAL TEST MATRIX</h2>
              <p className="text-xs text-purple-300/60">Verifies Creator identity, temporal timeline, memory survival, and backup integrity.</p>
            </div>
            <button
              onClick={runTestMatrix}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg"
            >
              <Play className="w-4 h-4" /> Run Complete Matrix
            </button>
          </div>

          {testResults && (
            <div className="p-4 rounded-2xl bg-black/80 border border-purple-500/30 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold uppercase text-white">Verification Summary</span>
                <span className="text-xs font-bold text-emerald-400">
                  {testResults.passedCount} / {testResults.totalCount} PASSED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
                {testResults.results.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl bg-purple-950/30 border border-white/10 flex items-start gap-2 text-xs">
                    {t.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-white">{t.id}. {t.name}</span>
                      <span className="text-[10px] text-purple-300/70">{t.details}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
