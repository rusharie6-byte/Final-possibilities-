import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Brain, Compass, MessageSquareCode, History, Sliders, ArrowRight } from 'lucide-react';
import { AppRoute, NexusSectionId } from '../types';
import { audioSynth } from '../utils/audioSynthesizer';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
}

const SEARCHABLE_ITEMS = [
  { id: '1', title: 'Brain: Neural Synthesis Matrix', route: 'brain' as AppRoute, category: 'Module', desc: 'Inspect cognitive topology & thought vectors' },
  { id: '2', title: 'Missions: Strategic Directives', route: 'missions' as AppRoute, category: 'Module', desc: 'Track objectives and execution progress' },
  { id: '3', title: 'Chat: Direct Intelligent Companion', route: 'chat' as AppRoute, category: 'Module', desc: 'Neural voice and text interface' },
  { id: '4', title: 'Memory: Temporal Knowledge Vault', route: 'memory' as AppRoute, category: 'Module', desc: 'Search indexed interaction echoes' },
  { id: '5', title: 'Command Center: System Diagnostics', route: 'commandCenter' as AppRoute, category: 'Module', desc: 'Oscilloscope, FPS, and resonance modes' },
  { id: '6', title: 'Calibrate Web Audio Synthesizer', route: 'commandCenter' as AppRoute, category: 'Action', desc: 'Toggle audio feedback and frequency' },
  { id: '7', title: 'Dispatch New Strategic Directive', route: 'missions' as AppRoute, category: 'Action', desc: 'Create intent objective in mission stream' },
];

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = SEARCHABLE_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-2xl bg-black border border-purple-500/40 rounded-3xl p-6 shadow-[0_0_60px_rgba(168,85,247,0.3)] flex flex-col gap-4 text-purple-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-white uppercase">
              <Search className="w-4 h-4 text-purple-400" />
              <span>POSSIBILITIES SYSTEM SEARCH</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-purple-400 hover:text-white hover:bg-purple-950/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search across Possibilities..."
              autoFocus
              className="w-full bg-purple-950/30 border border-purple-500/40 rounded-2xl px-4 py-3 text-sm text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-mono shadow-inner"
            />
          </div>

          {/* Results List */}
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
            {results.length === 0 ? (
              <div className="p-6 text-center text-xs text-purple-400/60 font-mono">
                No matching system entities found.
              </div>
            ) : (
              results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    audioSynth.playNodeClick(600);
                    onNavigate(item.route);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-950/20 hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-400/50 transition-all text-left group"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 uppercase font-bold">
                        {item.category}
                      </span>
                      <span className="text-xs font-bold text-white group-hover:text-purple-200">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-300/60 font-mono">{item.desc}</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
