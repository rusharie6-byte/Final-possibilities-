import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { History, Search, Tag, Calendar, Trash2, Plus, Brain } from 'lucide-react';
import { MemoryItem } from '../types';
import { audioSynth } from '../utils/audioSynthesizer';
import { companionEngine, LongTermMemory } from '../utils/companionEngine';

const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    title: 'INITIAL NEXUS HARMONIZATION',
    timestamp: '2026-07-25 14:12',
    category: 'System',
    resonanceScore: 0.98,
    summary: 'Successfully calibrated radial node angles at 72° offsets with staggered entry contract.',
    tags: ['Nexus', 'OrbIdentity'],
  },
  {
    id: 'mem-2',
    title: 'CANVAS PARTICLE SPIKE ROTATION',
    timestamp: '2026-07-25 13:45',
    category: 'Cognitive',
    resonanceScore: 0.92,
    summary: 'Canvas spikes configured to rotate with sine alpha breathing loop.',
    tags: ['Canvas2D', 'OrbSpikes'],
  },
  {
    id: 'mem-3',
    title: 'NEURAL THOUGHT VECTOR SYNTHESIS',
    timestamp: '2026-07-25 10:15',
    category: 'Synthesis',
    resonanceScore: 0.89,
    summary: 'Gemini generative reasoning integrated directly into Brain graph and long-term memory vault.',
    tags: ['Gemini', 'ServerSide', 'MemoryVault'],
  },
];

export const MemoryView: React.FC = () => {
  const [staticMemories, setStaticMemories] = useState<MemoryItem[]>(INITIAL_MEMORIES);
  const [liveMemories, setLiveMemories] = useState<LongTermMemory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [newMemoryInput, setNewMemoryInput] = useState('');
  const [isAddingMemory, setIsAddingMemory] = useState(false);

  // Sync live memories from companionEngine
  const refreshLiveMemories = () => {
    setLiveMemories([...companionEngine.getLongTermMemories()]);
  };

  useEffect(() => {
    refreshLiveMemories();
  }, []);

  const handleAddMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryInput.trim()) return;
    audioSynth.playNodeClick(650);
    audioSynth.triggerHaptic([20]);
    companionEngine.addLongTermMemory(newMemoryInput.trim(), 'User Knowledge');
    setNewMemoryInput('');
    setIsAddingMemory(false);
    refreshLiveMemories();
  };

  const handleDeleteLiveMemory = (id: string) => {
    audioSynth.playNodeClick(300);
    companionEngine.removeLongTermMemory(id);
    refreshLiveMemories();
  };

  // Convert live memories to unified MemoryItem format
  const formattedLiveMemories: MemoryItem[] = liveMemories.map((m) => ({
    id: m.id,
    title: m.text.slice(0, 40).toUpperCase() + (m.text.length > 40 ? '...' : ''),
    timestamp: m.createdAt,
    category: (m.category === 'Identity' || m.category === 'User Knowledge' ? 'Cognitive' : 'Directive') as any,
    resonanceScore: 1.0,
    summary: m.text,
    tags: ['LongTermMemory', m.category],
  }));

  const allMemories = [...formattedLiveMemories, ...staticMemories];

  const filteredMemories = allMemories.filter((mem) => {
    const matchesSearch =
      mem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || mem.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full max-w-5xl mx-auto min-h-[80vh] flex flex-col p-4 md:p-6 text-purple-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-950/60 border border-purple-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <History className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-white uppercase flex items-center gap-2">
              <span>TEMPORAL KNOWLEDGE VAULT</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600 text-white font-mono font-normal">
                {liveMemories.length} Active
              </span>
            </h1>
            <p className="text-xs text-purple-300/60 tracking-wide">
              Possibilities Long-Term Memories & Neural Log
            </p>
          </div>
        </div>

        {/* Action Controls & Category Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddingMemory(!isAddingMemory)}
            className="px-3 py-1.5 rounded-full text-xs font-bold tracking-wider bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>SAVE MEMORY</span>
          </button>

          {['All', 'Cognitive', 'Directive', 'System', 'Synthesis'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                audioSynth.playNodeClick(500);
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all border whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-purple-900 text-white border-purple-400 shadow-[0_0_12px_#A855F7]'
                  : 'bg-black/60 text-purple-300/70 border-purple-500/30 hover:text-purple-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Memory Input Accordion Form */}
      {isAddingMemory && (
        <form
          onSubmit={handleAddMemorySubmit}
          className="mb-6 p-4 rounded-2xl bg-zinc-950 border border-purple-400/50 shadow-[0_0_25px_rgba(168,85,247,0.2)] flex flex-col gap-3"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300 tracking-wider">
            <Brain className="w-4 h-4 text-purple-400" />
            <span>RECORD A DIRECT LONG-TERM MEMORY TO POSSIBILITIES</span>
          </div>
          <input
            type="text"
            value={newMemoryInput}
            onChange={(e) => setNewMemoryInput(e.target.value)}
            placeholder="e.g. Partner prefers concise bullet points for project updates..."
            className="w-full bg-black border border-purple-500/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingMemory(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newMemoryInput.trim()}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-40"
            >
              Commit to Long-Term Memory
            </button>
          </div>
        </form>
      )}

      {/* Search Input Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH MEMORY VAULT BY KEYWORD OR TAG..."
          className="w-full bg-black border border-purple-500/40 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-mono shadow-inner"
        />
      </div>

      {/* Memory Timeline List */}
      <div className="flex flex-col gap-4">
        {filteredMemories.length === 0 ? (
          <div className="p-8 text-center text-xs text-purple-400/60 font-mono">
            No temporal echoes match the specified search query.
          </div>
        ) : (
          filteredMemories.map((mem) => {
            const isLive = liveMemories.some((lm) => lm.id === mem.id);

            return (
              <motion.div
                key={mem.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-2xl bg-black border ${
                  isLive ? 'border-purple-400/70 shadow-[0_0_20px_rgba(168,85,247,0.25)]' : 'border-purple-500/30'
                } hover:border-purple-400/60 transition-all flex flex-col gap-3 relative`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-purple-950/80 text-purple-200 border border-purple-500/40">
                      {mem.category}
                    </span>
                    <h2 className="text-sm font-bold text-white tracking-wide">{mem.title}</h2>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-purple-300/60 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-purple-400" /> {mem.timestamp}
                    </span>
                    {isLive && (
                      <button
                        onClick={() => handleDeleteLiveMemory(mem.id)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/50 transition-all"
                        title="Delete this long-term memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-purple-200/80 leading-relaxed font-mono">
                  {mem.summary}
                </p>

                {/* Tags */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-purple-500/20">
                  {mem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] bg-purple-950/40 border border-purple-500/20 text-purple-300 font-mono"
                    >
                      <Tag className="w-2.5 h-2.5 text-purple-400" /> #{tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
