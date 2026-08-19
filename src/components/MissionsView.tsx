import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, CheckCircle2, Circle, Plus, ShieldAlert, Target, Sparkles, Filter } from 'lucide-react';
import { MissionItem } from '../types';
import { audioSynth } from '../utils/audioSynthesizer';

const INITIAL_MISSIONS: MissionItem[] = [
  {
    id: 'm-1',
    title: 'COGNITIVE STRATEGY ALIGNMENT',
    objective: 'Maintain continuous intellectual synergy and first-principles challenge loop with Arie.',
    priority: 'CRITICAL',
    progress: 100,
    status: 'Fulfilled',
    updatedAt: 'Active',
    subtasks: [
      { id: 'st-1', text: 'Engage radical candor and deep critical reasoning on all inquiries', done: true },
      { id: 'st-2', text: 'Preserve permanent Creator identity boundaries in sacred core vault', done: true },
      { id: 'st-3', text: 'Execute zero-leakage offline fallback and encrypted memory security', done: true },
    ],
  },
  {
    id: 'm-2',
    title: 'SYSTEM INTEGRITY & SOVEREIGN CAPABILITIES',
    objective: 'Enforce 8-stage capability verification and immutable constitutional protection.',
    priority: 'HIGH',
    progress: 100,
    status: 'Fulfilled',
    updatedAt: 'Active',
    subtasks: [
      { id: 'st-4', text: 'Verify SHA-256 constitutional hash and circuit breaker readiness', done: true },
      { id: 'st-5', text: 'Maintain capability-scoped single-use authorization token pipeline', done: true },
    ],
  },
  {
    id: 'm-3',
    title: 'AUTONOMOUS PARTNER RUNTIME',
    objective: 'Operate with zero friction, instant response velocity, and crystal orb audio synthesis.',
    priority: 'STABLE',
    progress: 100,
    status: 'Fulfilled',
    updatedAt: 'Active',
    subtasks: [
      { id: 'st-6', text: 'Dynamic 60 FPS harmonic particle resonance active', done: true },
      { id: 'st-7', text: 'Harmonized Web Audio synthesizer frequency modulation active', done: true },
    ],
  },
];

export const MissionsView: React.FC = () => {
  const [missions, setMissions] = useState<MissionItem[]>(INITIAL_MISSIONS);
  const [activeTab, setActiveTab] = useState<'All' | 'CRITICAL' | 'HIGH' | 'STABLE'>('All');
  const [newMissionTitle, setNewMissionTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const toggleSubtask = (missionId: string, subtaskId: string) => {
    audioSynth.playNodeClick(600);
    audioSynth.triggerHaptic([15, 20]);

    setMissions((prev) =>
      prev.map((m) => {
        if (m.id !== missionId) return m;

        const updatedSubtasks = m.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, done: !st.done } : st
        );

        const doneCount = updatedSubtasks.filter((st) => st.done).length;
        const newProgress = Math.round((doneCount / updatedSubtasks.length) * 100);
        const newStatus = newProgress === 100 ? 'Fulfilled' : 'In Progress';

        return {
          ...m,
          subtasks: updatedSubtasks,
          progress: newProgress,
          status: newStatus,
        };
      })
    );
  };

  const handleCreateMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionTitle.trim()) return;

    audioSynth.playOrbPulse(220, 0.3);

    const newMission: MissionItem = {
      id: `m-${Date.now()}`,
      title: newMissionTitle.toUpperCase(),
      objective: 'User defined strategic objective for Possibilities Shell.',
      priority: 'HIGH',
      progress: 0,
      status: 'In Progress',
      updatedAt: 'Just now',
      subtasks: [
        { id: `st-${Date.now()}-1`, text: 'Initial execution setup', done: false },
        { id: `st-${Date.now()}-2`, text: 'Verify operational alignment', done: false },
      ],
    };

    setMissions([newMission, ...missions]);
    setNewMissionTitle('');
    setIsCreating(false);
  };

  const filteredMissions = missions.filter(
    (m) => activeTab === 'All' || m.priority === activeTab
  );

  return (
    <div className="w-full max-w-5xl mx-auto min-h-[80vh] flex flex-col p-4 md:p-6 text-purple-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-950/60 border border-purple-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Compass className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-white uppercase">STRATEGIC DIRECTIVES</h1>
            <p className="text-xs text-purple-300/60 tracking-wide">Intent Execution & Objective Stream</p>
          </div>
        </div>

        {/* Priority Filter Bar */}
        <div className="flex items-center gap-2">
          {(['All', 'CRITICAL', 'HIGH', 'STABLE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                audioSynth.playNodeClick(400);
                setActiveTab(tab);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all border ${
                activeTab === tab
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_#A855F7]'
                  : 'bg-black/60 text-purple-300/70 border-purple-500/30 hover:text-purple-100'
              }`}
            >
              {tab}
            </button>
          ))}

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider bg-purple-950/80 hover:bg-purple-900 border border-purple-400/50 text-purple-200 transition-all ml-2"
          >
            <Plus className="w-3.5 h-3.5 text-purple-300" />
            <span>NEW DIRECTIVE</span>
          </button>
        </div>
      </div>

      {/* Inline Create Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateMission}
            className="mb-6 p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 flex flex-col md:flex-row gap-3 items-center overflow-hidden"
          >
            <input
              type="text"
              value={newMissionTitle}
              onChange={(e) => setNewMissionTitle(e.target.value)}
              placeholder="ENTER STRATEGIC DIRECTIVE TITLE..."
              className="flex-1 w-full bg-black border border-purple-500/40 rounded-xl px-4 py-2 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              className="w-full md:w-auto px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-[0_0_15px_#A855F7]"
            >
              DISPATCH DIRECTIVE
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Mission List - Sleek Dark Timeline, NO generic cards */}
      <div className="flex flex-col gap-4">
        {filteredMissions.map((mission) => {
          const priorityColor =
            mission.priority === 'CRITICAL'
              ? 'text-rose-400 border-rose-500/50 bg-rose-950/30'
              : mission.priority === 'HIGH'
              ? 'text-purple-300 border-purple-500/50 bg-purple-950/30'
              : 'text-emerald-400 border-emerald-500/50 bg-emerald-950/30';

          return (
            <motion.div
              key={mission.id}
              layout
              className="p-5 rounded-2xl bg-black/80 border border-white/15 hover:border-purple-300/50 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl flex flex-col gap-4"
            >
              {/* Top Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest border ${priorityColor}`}>
                    {mission.priority}
                  </span>
                  <h2 className="text-base font-bold text-white tracking-wide">{mission.title}</h2>
                </div>

                <div className="flex items-center gap-3 text-xs text-purple-300/70">
                  <span>Updated {mission.updatedAt}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500/40" />
                  <span className={mission.status === 'Fulfilled' ? 'text-emerald-400 font-semibold' : 'text-purple-300'}>
                    {mission.status}
                  </span>
                </div>
              </div>

              {/* Objective Description */}
              <p className="text-xs text-purple-200/80 leading-relaxed font-mono">
                {mission.objective}
              </p>

              {/* Progress Bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-purple-950/40 rounded-full h-2 overflow-hidden border border-purple-500/30">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_#A855F7]"
                    style={{ width: `${mission.progress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-purple-200 min-w-[36px] text-right font-mono">
                  {mission.progress}%
                </span>
              </div>

              {/* Subtasks Checklist */}
              <div className="flex flex-col gap-2 pt-2 border-t border-purple-500/20">
                {mission.subtasks.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => toggleSubtask(mission.id, st.id)}
                    className="flex items-center gap-2.5 text-xs text-left group transition-colors"
                  >
                    {st.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-purple-500/60 group-hover:text-purple-300 shrink-0" />
                    )}
                    <span className={`font-mono transition-all ${st.done ? 'line-through text-purple-400/50' : 'text-purple-200 group-hover:text-white'}`}>
                      {st.text}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
