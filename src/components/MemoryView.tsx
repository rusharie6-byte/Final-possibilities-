import React, { useState } from 'react';
import { motion } from 'motion/react';
import { History, Search, Tag, Sparkles, Filter, Database, Calendar } from 'lucide-react';
import { MemoryItem } from '../types';
import { audioSynth } from '../utils/audioSynthesizer';

const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    title: 'INITIAL NEXUS HARMONIZATION',
    timestamp: '2026-07-25 14:12',
    category: 'System',
    resonanceScore: 0.98,
    summary: 'Successfully calibrated radial node angles at 72° offsets with staggered 80ms animation entry contract.',
    tags: ['Nexus', 'AnimationContract', 'OrbIdentity'],
  },
  {
    id: 'mem-2',
    title: 'CANVAS PARTICLE SPIKE ROTATION',
    timestamp: '2026-07-25 13:45',
    category: 'Cognitive',
    resonanceScore: 0.92,
    summary: '12 canvas spikes configured to rotate at 0.2° per frame with sine alpha breathing loop.',
    tags: ['Canvas2D', 'OrbSpikes', 'Identity'],
  },
  {
    id: 'mem-3',
    title: 'DIRECTIVE COMPLETION PROTOCOL',
    timestamp: '2026-07-25 12:30',
    category: 'Directive',
    resonanceScore: 0.85,
    summary: 'Executed strategic diagnostic check across Web Audio synthesizer and haptic vibration engine.',
    tags: ['Diagnostics', 'Haptics', 'AudioSynth'],
  },
  {
    id: 'mem-4',
    title: 'NEURAL THOUGHT VECTOR SYNTHESIS',
    timestamp: '2026-07-25 10:15',
    category: 'Synthesis',
    resonanceScore: 0.89,
    summary: 'Gemini server proxy stream validated. Generative reasoning integrated directly into Brain graph.',
    tags: ['Gemini', 'ServerSide', 'NeuralGraph'],
  },
];

export const MemoryView: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>(INITIAL_MEMORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredMemories = memories.filter((mem) => {
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
            <h1 className="text-lg font-bold tracking-widest text-white uppercase">TEMPORAL KNOWLEDGE VAULT</h1>
            <p className="text-xs text-purple-300/60 tracking-wide">Neural Echoes & Interaction Logs</p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {['All', 'System', 'Cognitive', 'Directive', 'Synthesis'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                audioSynth.playNodeClick(500);
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all border whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_#A855F7]'
                  : 'bg-black/60 text-purple-300/70 border-purple-500/30 hover:text-purple-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH MEMORY ECHOES BY KEYWORD OR TAG..."
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
          filteredMemories.map((mem) => (
            <motion.div
              key={mem.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-black border border-purple-500/30 hover:border-purple-400/60 transition-all shadow-[0_0_20px_rgba(168,85,247,0.1)] flex flex-col gap-3"
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
                  <span className="text-purple-400 font-bold">
                    Resonance: {(mem.resonanceScore * 100).toFixed(0)}%
                  </span>
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
          ))
        )}
      </div>
    </div>
  );
};
