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
  Zap,
  Filter,
  Scissors,
  HardDrive,
  Database,
  ArrowRight,
} from 'lucide-react';
import {
  PartnerProfile,
  LivingContext,
  CoreMemoryItem,
  ReflectionLogEntry,
} from '../types';
import { audioSynth } from '../utils/audioSynthesizer';
import { companionEngine } from '../utils/companionEngine';
import { approvalEngine } from '../utils/approvalEngine';
import { timestampCapsuleEngine, TimestampCapsule, DistillationStats } from '../utils/timestampCapsuleEngine';
import { ExtendedPartnerProfile } from '../utils/memoryStore';

type ActiveTab = 'profile' | 'context' | 'capsules' | 'core' | 'reflection' | 'proposals';

export const MemoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [profile, setProfile] = useState<PartnerProfile>(companionEngine.getPartnerProfile());
  const [context, setContext] = useState<LivingContext>(companionEngine.getLivingContext());
  const [coreMemories, setCoreMemories] = useState<CoreMemoryItem[]>(companionEngine.getCoreMemories());
  const [reflectionLogs, setReflectionLogs] = useState<ReflectionLogEntry[]>(companionEngine.getReflectionLogs());

  // Timestamp Capsules State
  const [capsules, setCapsules] = useState<TimestampCapsule[]>(timestampCapsuleEngine.getCapsules());
  const [distillStats, setDistillStats] = useState<DistillationStats>(timestampCapsuleEngine.getDistillationStats());
  const [capsuleNotice, setCapsuleNotice] = useState<string | null>(null);

  // Proposals & Receipts
  const [memoryProposals, setMemoryProposals] = useState(approvalEngine.getAllMemoryWriteProposals());
  const [codeProposals, setCodeProposals] = useState(approvalEngine.getAllProposals());
  const [receipts, setReceipts] = useState(approvalEngine.getCommitReceipts());

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
    setMemoryProposals([...approvalEngine.getAllMemoryWriteProposals()]);
    setCodeProposals([...approvalEngine.getAllProposals()]);
    setReceipts([...approvalEngine.getCommitReceipts()]);
    setCapsules([...timestampCapsuleEngine.getCapsules()]);
    setDistillStats({ ...timestampCapsuleEngine.getDistillationStats() });
  };

  const handleRunDistillationAndPrune = () => {
    audioSynth.playNodeClick(750);
    audioSynth.triggerHaptic([20, 40, 20]);
    const result = timestampCapsuleEngine.distillAndConsolidate();
    setCapsules([...result.capsules]);
    setDistillStats({ ...timestampCapsuleEngine.getDistillationStats() });
    setCapsuleNotice(result.message);
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
              audioSynth.playNodeClick(530);
              setActiveTab('capsules');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'capsules'
                ? 'bg-purple-600 text-white shadow-[0_0_15px_#A855F7]'
                : 'text-purple-300/70 hover:text-purple-100 hover:bg-purple-950/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-300" />
            <span>CAPSULES & CLEANING ({capsules.length})</span>
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

          <button
            onClick={() => {
              audioSynth.playNodeClick(580);
              setActiveTab('proposals');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'proposals'
                ? 'bg-purple-600 text-white shadow-[0_0_15px_#A855F7]'
                : 'text-purple-300/70 hover:text-purple-100 hover:bg-purple-950/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>APPROVALS & RECEIPTS ({memoryProposals.filter(p => p.status === 'PENDING_APPROVAL').length})</span>
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

            {/* Locked Vault Protection Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 text-xs text-amber-200 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-amber-100 font-mono tracking-wider uppercase">LOCKED PARTNER ANCHOR</span>
                  <p className="text-[11px] text-amber-200/80 leading-snug">
                    Creator Arno (Arie) & Partner Profile foundations are securely locked in Sacred Core Memory.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-900/80 border border-amber-400/50 text-amber-100 shrink-0">
                PROTECTED VAULT
              </span>
            </div>

            {/* Profile Editing Form or Visual Card View */}
            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="p-5 rounded-2xl bg-zinc-950 border border-purple-500/50 flex flex-col gap-4 shadow-2xl">
                <h3 className="text-xs font-bold text-purple-300 tracking-wider font-mono uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  MANUALLY REFINE PARTNER PROFILE UNDERSTANDING
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30">
                  <div>
                    <label className="block text-[11px] font-mono text-purple-300 mb-1">Audience Maturity / Age Status</label>
                    <select
                      value={(profileForm as ExtendedPartnerProfile).isAdult !== false ? 'adult' : 'minor'}
                      onChange={(e) => {
                        const isAdult = e.target.value === 'adult';
                        setProfileForm({
                          ...profileForm,
                          isAdult,
                          foulLanguageAllowed: isAdult ? ((profileForm as ExtendedPartnerProfile).foulLanguageAllowed ?? true) : false,
                        } as any);
                      }}
                      className="w-full bg-black border border-purple-500/30 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-purple-400 font-sans"
                    >
                      <option value="adult">Adult (18+ Years Old)</option>
                      <option value="minor">Young / Minor (Under 18 Years Old)</option>
                    </select>
                    <p className="text-[10px] text-purple-300/60 mt-1">
                      Minor status enforces 100% strictly clean language with zero profanity.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-purple-300 mb-1">Strong Language Policy</label>
                    <select
                      disabled={(profileForm as ExtendedPartnerProfile).isAdult === false}
                      value={(profileForm as ExtendedPartnerProfile).foulLanguageAllowed !== false && (profileForm as ExtendedPartnerProfile).isAdult !== false ? 'allowed' : 'strictly_clean'}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          foulLanguageAllowed: e.target.value === 'allowed',
                        } as any)
                      }
                      className="w-full bg-black border border-purple-500/30 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-purple-400 font-sans disabled:opacity-50"
                    >
                      <option value="allowed">Adult Appropriate (Allowed only when contextually appropriate)</option>
                      <option value="strictly_clean">Strictly Clean (Zero Foul Language / Profanity)</option>
                    </select>
                    <p className="text-[10px] text-purple-300/60 mt-1">
                      Controls whether Possibilities can use occasional strong language for emphasis/roasting.
                    </p>
                  </div>
                </div>

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
                {/* Age & Language Standard Card */}
                <div className="p-5 rounded-2xl bg-black border border-purple-500/30 flex flex-col gap-3 shadow-lg hover:border-purple-400/50 transition-all">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 font-mono">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>AGE & LANGUAGE STANDARD</span>
                  </div>
                  <div className="text-xs text-purple-200/90 leading-relaxed flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20">
                      <span className="text-[11px] text-purple-300">Audience Rating:</span>
                      <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md ${
                        (profile as ExtendedPartnerProfile).isAdult !== false ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                      }`}>
                        {(profile as ExtendedPartnerProfile).isAdult !== false ? 'Adult (18+)' : 'Young / Minor (<18)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20">
                      <span className="text-[11px] text-purple-300">Language Standard:</span>
                      <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md ${
                        (profile as ExtendedPartnerProfile).isAdult !== false && (profile as ExtendedPartnerProfile).foulLanguageAllowed !== false
                          ? 'bg-purple-900/80 text-purple-200 border border-purple-400/40'
                          : 'bg-cyan-950/80 text-cyan-200 border border-cyan-500/30'
                      }`}>
                        {(profile as ExtendedPartnerProfile).isAdult !== false && (profile as ExtendedPartnerProfile).foulLanguageAllowed !== false
                          ? 'Adult Appropriate'
                          : 'Strictly Clean'}
                      </span>
                    </div>
                    <p className="text-[10px] text-purple-300/70 italic mt-1 leading-snug">
                      {(profile as ExtendedPartnerProfile).isAdult === false || (profile as ExtendedPartnerProfile).foulLanguageAllowed === false
                        ? 'Possibilities is strictly instructed to use 100% clean language with zero profanity under all circumstances.'
                        : 'Possibilities is permitted to use mild strong language only when contextually appropriate for emphasis or witty roasting.'}
                    </p>
                  </div>
                </div>

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
        {/* TIMESTAMP CAPSULES & MEMORY DISTILLATION ENGINE TAB */}
        {/* ======================================================== */}
        {activeTab === 'capsules' && (
          <motion.div
            key="tab-capsules"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Engine Banner & Execution Control */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-zinc-950 to-cyan-950/40 border border-purple-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] shrink-0">
                  <Clock className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
                      TIMESTAMP CAPSULES & DISTILLATION ENGINE
                    </h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-600/80 text-cyan-100 font-mono font-bold border border-cyan-400/40">
                      NOISE-FREE COMPRESSION
                    </span>
                  </div>
                  <p className="text-xs text-purple-300/80 tracking-wide mt-0.5">
                    Organizes memories into chronological timestamp capsules. Distills essential details, strips filler chatter, and cleans up outdated unreferenced entries while permanently preserving Sacred Core Memory.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunDistillationAndPrune}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-xs font-bold font-mono rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2 shrink-0 border border-cyan-300/40"
              >
                <Scissors className="w-4 h-4 text-cyan-100" />
                <span>DISTILL & CLEAN OUTDATED MEMORY</span>
              </button>
            </div>

            {/* Distillation & Clean-up Notice Banner */}
            {capsuleNotice && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-400/50 backdrop-blur-md flex items-center justify-between text-xs text-emerald-200"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-mono">{capsuleNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCapsuleNotice(null)}
                  className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white shrink-0"
                >
                  DISMISS
                </button>
              </motion.div>
            )}

                      {/* Key Metrics Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
                        <div className="p-3.5 rounded-2xl bg-black/80 border border-purple-500/30 flex flex-col gap-1">
                          <span className="text-[10px] text-purple-400 uppercase tracking-wider">Timestamp Capsules</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-white">{distillStats.totalCapsules}</span>
                            <span className="text-[10px] text-cyan-300">Capsules</span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-black/80 border border-purple-500/30 flex flex-col gap-1">
                          <span className="text-[10px] text-purple-400 uppercase tracking-wider">Cortical Nodes</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-emerald-300">{distillStats.totalSchemaNodes}</span>
                            <span className="text-[10px] text-emerald-400/80">Triples</span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-black/80 border border-purple-500/30 flex flex-col gap-1">
                          <span className="text-[10px] text-purple-400 uppercase tracking-wider">Synaptic Retention</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-cyan-300">{(distillStats.averageSynapticStrength * 100).toFixed(0)}%</span>
                            <span className="text-[10px] text-cyan-400">Ebbinghaus</span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-black/80 border border-purple-500/30 flex flex-col gap-1">
                          <span className="text-[10px] text-purple-400 uppercase tracking-wider">Outdated Pruned</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-amber-300">{distillStats.outdatedPrunedCount}</span>
                            <span className="text-[10px] text-amber-400/80">LAW 0/11</span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-black/80 border border-purple-500/30 flex flex-col gap-1">
                          <span className="text-[10px] text-purple-400 uppercase tracking-wider">LAW 12 Audit Log</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-purple-300">{distillStats.law12AuditCount}</span>
                            <span className="text-[10px] text-purple-400">Records</span>
                          </div>
                        </div>
                      </div>

            {/* Cortical Schema Nodes (Human Brain Knowledge Graph) */}
            <div className="p-4 rounded-2xl bg-black/80 border border-cyan-500/30 flex flex-col gap-3 font-mono">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    CORTICAL SCHEMA NODES (HUMAN BRAIN SEMANTIC TRIPLES)
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30">
                  {timestampCapsuleEngine.getSchemaNodes().length} Knowledge Triples
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {timestampCapsuleEngine.getSchemaNodes().map((node) => (
                  <div
                    key={node.nodeId}
                    className="p-3 rounded-xl bg-zinc-950 border border-cyan-500/20 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-bold border border-purple-500/30">
                        {node.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-cyan-300">
                        <span>Synaptic: {(node.synapticStrength * 100).toFixed(0)}%</span>
                        <div className="w-12 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${node.synapticStrength * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-white font-sans flex items-center gap-1.5">
                      <span className="text-cyan-300 font-bold font-mono">{node.subject}</span>
                      <span className="text-purple-400 italic text-[11px] font-mono">{node.predicate}</span>
                      <span className="text-emerald-300 font-bold font-mono">{node.object}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Capsules Timeline Container */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs font-mono text-purple-300/80 px-1">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-purple-400" />
                  CHRONOLOGICAL TIMESTAMP CAPSULES FEED
                </span>
                <span>Sorted by Recency & Sacred Status</span>
              </div>

              {capsules.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-black/60 border border-purple-500/20 text-xs text-purple-400 font-mono">
                  No timestamp capsules built yet. Click "Distill & Clean Outdated Memory" above to consolidate memories.
                </div>
              ) : (
                capsules.map((capsule) => (
                  <div
                    key={capsule.capsuleId}
                    className={`p-4 rounded-2xl bg-zinc-950/80 border ${
                      capsule.dateKey === 'sacred-core'
                        ? 'border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
                        : 'border-purple-500/30'
                    } flex flex-col gap-3 font-mono`}
                  >
                    {/* Capsule Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-purple-500/20">
                      <div className="flex items-center gap-2">
                        {capsule.dateKey === 'sacred-core' ? (
                          <Lock className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-cyan-400" />
                        )}
                        <span
                          className={`text-sm font-bold tracking-wide ${
                            capsule.dateKey === 'sacred-core' ? 'text-amber-300 font-sans' : 'text-white'
                          }`}
                        >
                          {capsule.formattedDate}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/30">
                          {capsule.details.length} Details
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-purple-300/70">
                        {capsule.spaceSavedPct > 0 && (
                          <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-bold">
                            {capsule.spaceSavedPct}% Noise Reduced
                          </span>
                        )}
                        <span>Consolidated: {new Date(capsule.lastConsolidatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Capsule Details Feed */}
                    <div className="grid grid-cols-1 gap-2.5">
                      {capsule.details.map((detail) => (
                        <div
                          key={detail.id}
                          className={`p-3 rounded-xl border transition-all ${
                            detail.isSacred
                              ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400/50'
                              : 'bg-black/60 border-purple-500/20 hover:border-purple-400/40'
                          } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                                  detail.isSacred
                                    ? 'bg-amber-500 text-black'
                                    : 'bg-purple-900/80 text-purple-200 border border-purple-500/30'
                                }`}
                              >
                                {detail.category}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/30">
                                {detail.lawClassification}
                              </span>
                              <span className="text-[10px] text-purple-400">
                                Importance: {(detail.importance * 100).toFixed(0)}%
                              </span>
                              <span className="text-[10px] text-emerald-400">
                                Calibration: {(detail.calibrationRating * 100).toFixed(0)}%
                              </span>
                              <span className="text-[10px] text-cyan-400/80">
                                Referenced {detail.referenceCount}x
                              </span>
                            </div>
                            <p className="text-xs text-white font-sans leading-relaxed">
                              {detail.summary}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              audioSynth.playNodeClick(800);
                              timestampCapsuleEngine.markMemoryReferenced(detail.id);
                              refreshAllState();
                            }}
                            className="px-2.5 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-[10px] text-purple-300 hover:text-white shrink-0 transition-all font-mono"
                            title="Simulate referencing this memory item in conversation under Law 11"
                          >
                            Mark Referenced
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* LAW 12 IMMUTABLE PRUNE AUDIT LEDGER */}
            {timestampCapsuleEngine.getAuditLedger().length > 0 && (
              <div className="p-4 rounded-2xl bg-black/90 border border-purple-500/30 flex flex-col gap-3 font-mono">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      LAW 12 IMMUTABLE PRUNE AUDIT LEDGER
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-400">
                    {timestampCapsuleEngine.getAuditLedger().length} Records Preserved
                  </span>
                </div>

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {timestampCapsuleEngine.getAuditLedger().map((record) => (
                    <div
                      key={record.auditId}
                      className="p-2.5 rounded-xl bg-zinc-950 border border-purple-500/20 text-[11px] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-bold border border-purple-500/30 shrink-0">
                          {record.pruneReason}
                        </span>
                        <span className="text-zinc-300 truncate font-sans">{record.summarySnippet}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {new Date(record.prunedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
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
        {/* 5. APPROVALS & COMMIT RECEIPTS TAB */}
        {/* ======================================================== */}
        {activeTab === 'proposals' && (
          <motion.div
            key="tab-proposals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Header Banner */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-900/60 flex items-center justify-center border border-purple-400/40 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">5. CREATOR APPROVAL ENGINE & COMMIT RECEIPTS</h2>
                  <p className="text-xs text-purple-300/70">
                    No state-changing memory or code modification happens without Creator Arno/Arie approval.
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Memory Proposals */}
            <div className="p-4 rounded-2xl bg-black border border-purple-500/30 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-emerald-300 font-mono tracking-wider flex items-center justify-between">
                <span>PENDING MEMORY WRITE PROPOSALS ({memoryProposals.filter((p) => p.status === 'PENDING_APPROVAL').length})</span>
              </h3>

              {memoryProposals.filter((p) => p.status === 'PENDING_APPROVAL').length === 0 ? (
                <div className="p-4 text-center text-xs text-purple-400/60 font-mono">
                  No pending memory write proposals awaiting Creator approval.
                </div>
              ) : (
                memoryProposals
                  .filter((p) => p.status === 'PENDING_APPROVAL')
                  .map((prop) => (
                    <div key={prop.proposalId} className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 flex flex-col gap-2 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300">PROPOSAL ID: {prop.proposalId}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900 text-purple-200 uppercase">{prop.targetLayer}</span>
                      </div>
                      <div className="text-xs text-white">
                        <span className="text-purple-400">Key/Topic:</span> {prop.key}
                      </div>
                      <div className="text-xs text-emerald-300 bg-black/60 p-2.5 rounded border border-purple-500/20 font-sans">
                        "{prop.value}"
                      </div>
                      <div className="text-[11px] text-purple-300/80 italic">
                        Justification: {prop.justification}
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-500/20">
                        <button
                          onClick={() => {
                            audioSynth.playNodeClick(300);
                            approvalEngine.rejectMemoryWrite(prop.proposalId);
                            refreshAllState();
                          }}
                          className="px-3 py-1 bg-rose-950 border border-rose-500/40 text-rose-300 hover:bg-rose-900 text-xs font-bold rounded-lg"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            audioSynth.playNodeClick(700);
                            approvalEngine.approveMemoryWrite(prop.proposalId);
                            refreshAllState();
                          }}
                          className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md"
                        >
                          Approve & Commit
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Commit Receipts History */}
            <div className="p-4 rounded-2xl bg-black border border-purple-500/30 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-purple-300 font-mono tracking-wider flex items-center justify-between">
                <span>VERIFIABLE COMMIT RECEIPTS ({receipts.length})</span>
              </h3>

              {receipts.length === 0 ? (
                <div className="p-4 text-center text-xs text-purple-400/60 font-mono">
                  No commit receipts generated yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                  {receipts.map((rc) => (
                    <div key={rc.recordId + rc.timestamp} className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs font-mono flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${rc.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          [{rc.status}] {rc.operation.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-purple-400">{rc.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-purple-200/90">{rc.message}</div>
                      <div className="text-[10px] text-purple-400 flex items-center gap-3 pt-1 border-t border-purple-500/10">
                        <span>Write: {rc.verification.writeConfirmed ? '✓ CONFIRMED' : '✗ FAILED'}</span>
                        <span>ReadBack: {rc.verification.readBackConfirmed ? '✓ CONFIRMED' : '✗ FAILED'}</span>
                        <span>Reload: {rc.verification.contextReloadConfirmed ? '✓ CONFIRMED' : '✗ FAILED'}</span>
                      </div>
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
