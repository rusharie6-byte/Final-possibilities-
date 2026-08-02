import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  User,
  Activity,
  ShieldCheck,
  RotateCw,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock,
  Layers,
  Heart,
  Target,
  Flame,
  Clock,
  Compass,
} from 'lucide-react';
import {
  PartnerProfile,
  LivingContext,
  CoreMemoryItem,
  ReflectionLogEntry,
} from '../types';
import { audioSynth } from '../utils/audioSynthesizer';
import { companionEngine } from '../utils/companionEngine';

type ActiveTab = 'profile' | 'context' | 'core' | 'reflection';

export const MemoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [profile, setProfile] = useState<PartnerProfile>(companionEngine.getPartnerProfile());
  const [context, setContext] = useState<LivingContext>(companionEngine.getLivingContext());
  const [coreMemories, setCoreMemories] = useState<CoreMemoryItem[]>(companionEngine.getCoreMemories());
  const [reflectionLogs, setReflectionLogs] = useState<ReflectionLogEntry[]>(companionEngine.getReflectionLogs());

  // Form states for Core Memory
  const [isAddingCore, setIsAddingCore] = useState(false);
  const [newCoreText, setNewCoreText] = useState('');
  const [newCoreCategory, setNewCoreCategory] = useState<CoreMemoryItem['category']>('Sacred');
  const [editingCoreId, setEditingCoreId] = useState<string | null>(null);
  const [editingCoreText, setEditingCoreText] = useState('');

  // Form states for Partner Profile Editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<PartnerProfile>(profile);
  const [newPrefInput, setNewPrefInput] = useState('');
  const [newGoalInput, setNewGoalInput] = useState('');

  // Form states for Living Context Editing
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [contextForm, setContextForm] = useState<LivingContext>(context);
  const [newProjectInput, setNewProjectInput] = useState('');

  const refreshAllState = () => {
    setProfile({ ...companionEngine.getPartnerProfile() });
    setContext({ ...companionEngine.getLivingContext() });
    setCoreMemories([...companionEngine.getCoreMemories()]);
    setReflectionLogs([...companionEngine.getReflectionLogs()]);
  };

  useEffect(() => {
    refreshAllState();
  }, []);

  // Handlers for Core Memory
  const handleAddCoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoreText.trim()) return;
    audioSynth.playNodeClick(700);
    audioSynth.triggerHaptic([20]);
    companionEngine.addCoreMemory(newCoreText.trim(), newCoreCategory);
    setNewCoreText('');
    setIsAddingCore(false);
    refreshAllState();
  };

  const handleDeleteCore = (id: string) => {
    audioSynth.playNodeClick(300);
    companionEngine.removeCoreMemory(id);
    refreshAllState();
  };

  const handleSaveEditCore = (id: string) => {
    if (!editingCoreText.trim()) return;
    audioSynth.playNodeClick(600);
    companionEngine.editCoreMemory(id, editingCoreText);
    setEditingCoreId(null);
    refreshAllState();
  };

  // Handlers for Profile Update
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    audioSynth.playNodeClick(650);
    companionEngine.updatePartnerProfile(profileForm);
    setIsEditingProfile(false);
    refreshAllState();
  };

  const handleAddPreference = () => {
    if (!newPrefInput.trim()) return;
    setProfileForm({
      ...profileForm,
      preferences: [...profileForm.preferences, newPrefInput.trim()],
    });
    setNewPrefInput('');
  };

  const handleRemovePreference = (index: number) => {
    const updated = profileForm.preferences.filter((_, i) => i !== index);
    setProfileForm({ ...profileForm, preferences: updated });
  };

  const handleAddGoal = () => {
    if (!newGoalInput.trim()) return;
    setProfileForm({
      ...profileForm,
      longTermGoals: [...profileForm.longTermGoals, newGoalInput.trim()],
    });
    setNewGoalInput('');
  };

  const handleRemoveGoal = (index: number) => {
    const updated = profileForm.longTermGoals.filter((_, i) => i !== index);
    setProfileForm({ ...profileForm, longTermGoals: updated });
  };

  // Handlers for Living Context Update
  const handleSaveContext = (e: React.FormEvent) => {
    e.preventDefault();
    audioSynth.playNodeClick(650);
    companionEngine.updateLivingContext(contextForm);
    setIsEditingContext(false);
    refreshAllState();
  };

  const handleAddProject = () => {
    if (!newProjectInput.trim()) return;
    setContextForm({
      ...contextForm,
      currentProjects: [...contextForm.currentProjects, newProjectInput.trim()],
    });
    setNewProjectInput('');
  };

  const handleRemoveProject = (index: number) => {
    const updated = contextForm.currentProjects.filter((_, i) => i !== index);
    setContextForm({ ...contextForm, currentProjects: updated });
  };

  // Simulate a manual reflection cycle test
  const handleRunManualReflection = () => {
    audioSynth.playNodeClick(800);
    audioSynth.triggerHaptic([15, 30]);
    companionEngine.recordReflection(
      true,
      'Refined communication preference: Partner values high clarity and responsive real-time state feedback.',
      'Partner Profile'
    );
    companionEngine.updatePartnerProfile({
      lastReflectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    refreshAllState();
  };

  return (
    <div className="w-full max-w-6xl mx-auto min-h-[85vh] flex flex-col p-3 sm:p-6 text-purple-100 font-sans">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-500/20 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] shrink-0">
            <Brain className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-widest text-white uppercase font-mono">
                POSSIBILITIES MEMORY SYSTEM v2.0
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600/80 text-purple-100 font-mono font-bold border border-purple-400/40">
                LIVING UNDERSTANDING
              </span>
            </div>
            <p className="text-xs text-purple-300/70 tracking-wide mt-0.5">
              Memory is not a transcript. It is continuously compressing life into understanding. Remember less, understand more.
            </p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-purple-500/30 backdrop-blur-xl overflow-x-auto custom-scrollbar">
          <button
            onClick={() => {
              audioSynth.playNodeClick(500);
              setActiveTab('profile');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-purple-600 text-white shadow-[0_0_15px_#A855F7]'
                : 'text-purple-300/70 hover:text-purple-100 hover:bg-purple-950/40'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>PARTNER PROFILE</span>
          </button>

          <button
            onClick={() => {
              audioSynth.playNodeClick(520);
              setActiveTab('context');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'context'
                ? 'bg-purple-600 text-white shadow-[0_0_15px_#A855F7]'
                : 'text-purple-300/70 hover:text-purple-100 hover:bg-purple-950/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>LIVING CONTEXT</span>
          </button>

          <button
            onClick={() => {
              audioSynth.playNodeClick(540);
              setActiveTab('core');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'core'
                ? 'bg-purple-600 text-white shadow-[0_0_15px_#A855F7]'
                : 'text-purple-300/70 hover:text-purple-100 hover:bg-purple-950/40'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span>CORE MEMORY ({coreMemories.length})</span>
          </button>

          <button
            onClick={() => {
              audioSynth.playNodeClick(560);
              setActiveTab('reflection');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'reflection'
                ? 'bg-purple-600 text-white shadow-[0_0_15px_#A855F7]'
                : 'text-purple-300/70 hover:text-purple-100 hover:bg-purple-950/40'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>REFLECTION CYCLE</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views Container */}
      <AnimatePresence mode="wait">
        {/* ======================================================== */}
        {/* 1. PARTNER PROFILE TAB */}
        {/* ======================================================== */}
        {activeTab === 'profile' && (
          <motion.div
            key="tab-profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Status & Purpose Header */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-900/60 flex items-center justify-center border border-purple-400/40 shrink-0">
                  <User className="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">1. PARTNER PROFILE</h2>
                  <p className="text-xs text-purple-300/70">
                    An evolving understanding of who the Partner is. Changes slowly. Only updates when genuine understanding improves.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-purple-300/80 bg-black/50 px-2.5 py-1 rounded-full border border-purple-500/20">
                  Last Reflected: {profile.lastReflectedAt || 'Active'}
                </span>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-md"
                >
                  <Edit3 className="w-3 h-3" />
                  {isEditingProfile ? 'Cancel Edit' : 'Refine Understanding'}
                </button>
              </div>
            </div>

            {/* Profile Editing Form or Visual Card View */}
            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="p-5 rounded-2xl bg-zinc-950 border border-purple-500/50 flex flex-col gap-4 shadow-2xl">
                <h3 className="text-xs font-bold text-purple-300 tracking-wider font-mono uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  MANUALLY REFINE PARTNER PROFILE UNDERSTANDING
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-purple-300 mb-1">Personality Traits</label>
                    <textarea
                      value={profileForm.personality}
                      onChange={(e) => setProfileForm({ ...profileForm, personality: e.target.value })}
                      className="w-full bg-black border border-purple-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-400 font-sans"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-purple-300 mb-1">Communication Style</label>
                    <textarea
                      value={profileForm.communicationStyle}
                      onChange={(e) => setProfileForm({ ...profileForm, communicationStyle: e.target.value })}
                      className="w-full bg-black border border-purple-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-400 font-sans"
                      rows={2}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-purple-300 mb-1">Response Preferences (How Possibilities responds)</label>
                  <input
                    type="text"
                    value={profileForm.responsePreferences}
                    onChange={(e) => setProfileForm({ ...profileForm, responsePreferences: e.target.value })}
                    className="w-full bg-black border border-purple-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-400 font-sans"
                  />
                </div>

                {/* Key Preferences List */}
                <div>
                  <label className="block text-[11px] font-mono text-purple-300 mb-1">Key Preferences</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newPrefInput}
                      onChange={(e) => setNewPrefInput(e.target.value)}
                      placeholder="e.g. Prefers dark mode visual themes..."
                      className="flex-1 bg-black border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddPreference}
                      className="px-3 py-1 bg-purple-700 text-white rounded-xl text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileForm.preferences.map((pref, idx) => (
                      <span key={idx} className="bg-purple-950/60 border border-purple-500/30 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5">
                        <span>{pref}</span>
                        <button type="button" onClick={() => handleRemovePreference(idx)} className="text-zinc-400 hover:text-rose-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Long-Term Goals */}
                <div>
                  <label className="block text-[11px] font-mono text-purple-300 mb-1">Long-Term Goals</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newGoalInput}
                      onChange={(e) => setNewGoalInput(e.target.value)}
                      placeholder="e.g. Master system architecture..."
                      className="flex-1 bg-black border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddGoal}
                      className="px-3 py-1 bg-purple-700 text-white rounded-xl text-xs font-bold"
                    >
                      Add Goal
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileForm.longTermGoals.map((goal, idx) => (
                      <span key={idx} className="bg-purple-950/60 border border-purple-500/30 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5">
                        <span>{goal}</span>
                        <button type="button" onClick={() => handleRemoveGoal(idx)} className="text-zinc-400 hover:text-rose-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-purple-500/20">
                  <button type="button" onClick={() => setIsEditingProfile(false)} className="px-3 py-1.5 text-xs text-zinc-400">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg">
                    Save Profile Understanding
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Personality & Style Card */}
                <div className="p-5 rounded-2xl bg-black border border-purple-500/30 flex flex-col gap-3 shadow-lg hover:border-purple-400/50 transition-all">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 font-mono">
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span>PERSONALITY & COMMUNICATION</span>
                  </div>
                  <div className="text-xs text-purple-200/90 leading-relaxed">
                    <p className="font-semibold text-white mb-1">Personality:</p>
                    <p className="mb-3 text-purple-200/80">{profile.personality}</p>
                    <p className="font-semibold text-white mb-1">Communication Style:</p>
                    <p className="text-purple-200/80">{profile.communicationStyle}</p>
                  </div>
                </div>

                {/* Response Preferences */}
                <div className="p-5 rounded-2xl bg-black border border-purple-500/30 flex flex-col gap-3 shadow-lg hover:border-purple-400/50 transition-all">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 font-mono">
                    <Heart className="w-4 h-4 text-purple-400" />
                    <span>HOW POSSIBILITIES RESPONDS</span>
                  </div>
                  <p className="text-xs text-purple-200/90 leading-relaxed font-mono bg-purple-950/30 p-3 rounded-xl border border-purple-500/20">
                    "{profile.responsePreferences}"
                  </p>
                  <div className="text-[11px] text-purple-300/70 pt-2 border-t border-purple-500/20">
                    Values: <span className="text-white font-medium">{profile.values.join(' • ')}</span>
                  </div>
                </div>

                {/* Long Term Goals */}
                <div className="p-5 rounded-2xl bg-black border border-purple-500/30 flex flex-col gap-3 shadow-lg hover:border-purple-400/50 transition-all">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 font-mono">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span>LONG-TERM GOALS</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {profile.longTermGoals.map((goal, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-purple-200/90">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                        <span>{goal}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Preferences */}
                <div className="p-5 rounded-2xl bg-black border border-purple-500/30 md:col-span-2 lg:col-span-3 flex flex-col gap-3 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 font-mono">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>PREFERENCES & HABITS</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] font-mono text-purple-400/80 mb-2">Preferences:</div>
                      <div className="flex flex-wrap gap-2">
                        {profile.preferences.map((pref, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-xl text-xs bg-purple-950/60 border border-purple-500/30 text-purple-200">
                            {pref}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-mono text-purple-400/80 mb-2">Habits:</div>
                      <div className="flex flex-wrap gap-2">
                        {profile.habits.map((habit, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-xl text-xs bg-zinc-900 border border-zinc-700 text-purple-300 font-mono">
                            {habit}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 2. LIVING CONTEXT TAB */}
        {/* ======================================================== */}
        {activeTab === 'context' && (
          <motion.div
            key="tab-context"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Status & Purpose Header */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-900/60 flex items-center justify-center border border-purple-400/40 shrink-0">
                  <Activity className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">2. LIVING CONTEXT</h2>
                  <p className="text-xs text-purple-300/70">
                    Everything important happening right now. Rewritten continuously as life changes. Old information naturally disappears.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-cyan-300/80 bg-black/50 px-2.5 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-cyan-400 animate-pulse" />
                  Continuous Dynamic Sync
                </span>
                <button
                  onClick={() => setIsEditingContext(!isEditingContext)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-md"
                >
                  <Edit3 className="w-3 h-3" />
                  {isEditingContext ? 'Cancel Edit' : 'Update Focus'}
                </button>
              </div>
            </div>

            {/* Editing Form or Visual Card View */}
            {isEditingContext ? (
              <form onSubmit={handleSaveContext} className="p-5 rounded-2xl bg-zinc-950 border border-purple-500/50 flex flex-col gap-4 shadow-2xl">
                <h3 className="text-xs font-bold text-cyan-300 tracking-wider font-mono uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  UPDATE CURRENT LIVING CONTEXT
                </h3>

                <div>
                  <label className="block text-[11px] font-mono text-purple-300 mb-1">Primary Current Focus</label>
                  <input
                    type="text"
                    value={contextForm.currentFocus}
                    onChange={(e) => setContextForm({ ...contextForm, currentFocus: e.target.value })}
                    className="w-full bg-black border border-purple-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-purple-300 mb-1">Active Projects</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newProjectInput}
                      onChange={(e) => setNewProjectInput(e.target.value)}
                      placeholder="e.g. Next-gen UI refinement..."
                      className="flex-1 bg-black border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <button type="button" onClick={handleAddProject} className="px-3 py-1 bg-purple-700 text-white rounded-xl text-xs font-bold">
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contextForm.currentProjects.map((p, idx) => (
                      <span key={idx} className="bg-purple-950/60 border border-purple-500/30 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5">
                        <span>{p}</span>
                        <button type="button" onClick={() => handleRemoveProject(idx)} className="text-zinc-400 hover:text-rose-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-purple-500/20">
                  <button type="button" onClick={() => setIsEditingContext(false)} className="px-3 py-1.5 text-xs text-zinc-400">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg">
                    Save Living Context
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Current Focus Highlight */}
                <div className="p-5 rounded-2xl bg-black border border-cyan-500/40 md:col-span-2 lg:col-span-3 flex flex-col gap-2 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 font-mono">
                    <Flame className="w-4 h-4 text-cyan-400" />
                    <span>PRIMARY CURRENT FOCUS</span>
                  </div>
                  <p className="text-sm font-semibold text-white tracking-wide bg-cyan-950/20 p-3 rounded-xl border border-cyan-500/30">
                    {context.currentFocus}
                  </p>
                </div>

                {/* Active Projects */}
                <div className="p-5 rounded-2xl bg-black border border-purple-500/30 flex flex-col gap-3 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 font-mono">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>ACTIVE PROJECTS</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {context.currentProjects.map((proj, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs text-purple-100 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{proj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priorities & Struggles */}
                <div className="p-5 rounded-2xl bg-black border border-purple-500/30 flex flex-col gap-3 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 font-mono">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span>PRIORITIES & STRUGGLES</span>
                  </div>
                  <div className="text-xs">
                    <p className="font-mono text-purple-300/80 mb-1">Current Priorities:</p>
                    <div className="space-y-1 mb-3">
                      {context.currentPriorities.map((p, i) => (
                        <div key={i} className="text-purple-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                    <p className="font-mono text-amber-300/80 mb-1">Active Struggles / Bottlenecks:</p>
                    <div className="space-y-1">
                      {context.currentStruggles.map((s, i) => (
                        <div key={i} className="text-amber-200/90 flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Short-Term Reminders & Emotions */}
                <div className="p-5 rounded-2xl bg-black border border-purple-500/30 flex flex-col gap-3 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 font-mono">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>ACTIVE REMINDERS & EMOTIONS</span>
                  </div>
                  <div className="space-y-2">
                    {context.shortTermReminders.map((rem) => (
                      <div key={rem.id} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-purple-200 flex items-center justify-between">
                        <span>{rem.text}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{rem.createdAt}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-purple-500/20 text-xs flex items-center justify-between">
                    <span className="text-purple-300/70">Current Emotion State:</span>
                    <span className="font-mono text-cyan-300 font-bold">{context.currentEmotions.join(' • ')}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 3. CORE MEMORY TAB (SACRED) */}
        {/* ======================================================== */}
        {activeTab === 'core' && (
          <motion.div
            key="tab-core"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Sacred Banner */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-950/80 flex items-center justify-center border border-amber-400/50 shrink-0">
                  <Lock className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-amber-200 tracking-wide font-mono">3. CORE MEMORY (SACRED)</h2>
                    <span className="text-[10px] bg-amber-500 text-black px-2 py-0.2 rounded-full font-bold">
                      PERMANENT
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/70 mt-0.5">
                    Core Memory CANNOT be modified automatically by AI. Only the Partner can add, edit, or remove entries.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddingCore(!isAddingCore)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>ADD SACRED MEMORY</span>
              </button>
            </div>

            {/* Form to Add Core Memory */}
            {isAddingCore && (
              <form onSubmit={handleAddCoreSubmit} className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/50 shadow-2xl flex flex-col gap-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">EXPLICITLY RECORD SACRED CORE MEMORY</span>
                  <select
                    value={newCoreCategory}
                    onChange={(e) => setNewCoreCategory(e.target.value as any)}
                    className="bg-black border border-amber-500/40 text-amber-200 text-xs rounded px-2 py-1"
                  >
                    <option value="Sacred">Sacred</option>
                    <option value="Name">Name</option>
                    <option value="Family">Family</option>
                    <option value="Life Event">Life Event</option>
                    <option value="Permanent Preference">Permanent Preference</option>
                    <option value="Promise">Promise</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={newCoreText}
                  onChange={(e) => setNewCoreText(e.target.value)}
                  placeholder="e.g. Always keep client data local and secure..."
                  className="w-full bg-black border border-amber-500/40 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-sans"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddingCore(false)} className="px-3 py-1.5 text-xs text-zinc-400">
                    Cancel
                  </button>
                  <button type="submit" disabled={!newCoreText.trim()} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg disabled:opacity-40">
                    Commit to Sacred Core
                  </button>
                </div>
              </form>
            )}

            {/* List of Sacred Core Memories */}
            <div className="flex flex-col gap-3">
              {coreMemories.length === 0 ? (
                <div className="p-8 text-center text-xs text-amber-400/60 font-mono">
                  No Core Memories explicitly marked yet. Tap 'ADD SACRED MEMORY' to create one.
                </div>
              ) : (
                coreMemories.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-black border border-amber-500/30 hover:border-amber-400/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex-1 flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-950 text-amber-300 border border-amber-500/40 font-mono uppercase">
                            {item.category}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">{item.createdAt}</span>
                        </div>

                        {editingCoreId === item.id ? (
                          <div className="flex gap-2 mt-1">
                            <input
                              type="text"
                              value={editingCoreText}
                              onChange={(e) => setEditingCoreText(e.target.value)}
                              className="flex-1 bg-zinc-900 border border-amber-400/50 rounded px-2.5 py-1 text-xs text-white"
                            />
                            <button
                              onClick={() => handleSaveEditCore(item.id)}
                              className="px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCoreId(null)}
                              className="px-2 py-1 text-xs text-zinc-400"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-amber-100 font-medium leading-relaxed font-sans">
                            {item.text}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => {
                          setEditingCoreId(item.id);
                          setEditingCoreText(item.text);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-amber-950/50"
                        title="Edit Core Memory"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCore(item.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/50"
                        title="Delete Core Memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 4. REFLECTION CYCLE TAB */}
        {/* ======================================================== */}
        {activeTab === 'reflection' && (
          <motion.div
            key="tab-reflection"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Philosophy Banner */}
            <div className="p-5 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-purple-300 animate-spin" style={{ animationDuration: '10s' }} />
                  <h2 className="text-sm font-bold text-white tracking-widest font-mono uppercase">
                    THE REFLECTION CYCLE
                  </h2>
                </div>
                <button
                  onClick={handleRunManualReflection}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  <span>Trigger Evaluation Cycle</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-purple-500/30 text-xs text-purple-200/90 leading-relaxed font-mono space-y-2">
                <p className="font-bold text-purple-300">
                  After every conversation, Possibilities evaluates:
                </p>
                <p className="p-2 rounded bg-purple-950/50 border border-purple-400/30 text-white font-semibold">
                  "Did I genuinely learn something new about my Partner?"
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                    <span className="font-bold">If YES:</span> Update Partner Profile or Living Context. Improve understanding without duplicating entries.
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                    <span className="font-bold">If NO:</span> Do nothing. Preserve understanding without saving conversation transcripts.
                  </div>
                </div>
              </div>
            </div>

            {/* Reflection Audit Log Stream */}
            <div className="p-4 rounded-2xl bg-black border border-purple-500/30 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-purple-300 font-mono tracking-wider flex items-center justify-between">
                <span>RECENT REFLECTION AUDIT LOGS</span>
                <span className="text-[10px] text-purple-400">{reflectionLogs.length} Records</span>
              </h3>

              {reflectionLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-purple-400/60 font-mono">
                  No reflection cycles recorded yet. Interactive conversations continuously populate this log.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {reflectionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs flex items-center justify-between gap-3 font-mono"
                    >
                      <div className="flex items-center gap-2">
                        {log.learnedNew ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <HelpCircle className="w-4 h-4 text-zinc-500 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-white">
                            {log.learnedNew ? `Learned New Understanding -> Updated [${log.updatedDocument}]` : 'Preserved Existing Understanding'}
                          </div>
                          {log.insightSummary && (
                            <p className="text-[11px] text-purple-300/80 mt-0.5 font-sans">{log.insightSummary}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-purple-400 shrink-0">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
        {/* ======================================================== */}
        {/* BACKUP & PERSISTENCE MANAGEMENT TOOLBAR */}
        {/* ======================================================== */}
        <div className="mt-8 pt-6 border-t border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                audioSynth.playNodeClick(700);
                companionEngine.processInput('backup memory', []);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <span>Export Memory Backup (JSON)</span>
            </button>

            <label className="px-4 py-2 rounded-xl bg-purple-950/60 border border-purple-400/40 hover:bg-purple-900/50 text-purple-200 text-xs font-bold cursor-pointer transition-all flex items-center gap-2">
              <span>Import Memory Backup</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const content = evt.target?.result as string;
                    if (content) {
                      const res = companionEngine.getMemoryPromptContext();
                      audioSynth.playNodeClick(800);
                      refreshAllState();
                      alert('Memory Backup Restored Successfully.');
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('WIPE MEMORY WARNING: This will reset all persistent local memories. An automatic backup snapshot will be saved first. Continue?')) {
                  audioSynth.playNodeClick(200);
                  companionEngine.clearLongTermMemories();
                  refreshAllState();
                  alert('Memory wiped. Automatic snapshot preserved in local backups.');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/50 text-rose-300 text-xs font-bold transition-all"
            >
              Factory Reset Memory
            </button>
          </div>
        </div>
      </AnimatePresence>
    </div>
  );
};
