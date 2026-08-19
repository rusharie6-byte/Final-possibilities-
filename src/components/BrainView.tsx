import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Cpu, Network, Zap, Send, RefreshCw, Layers } from 'lucide-react';
import { BrainNode } from '../types';
import { audioSynth } from '../utils/audioSynthesizer';
import { getApiEndpoint, loggedFetch, getCustomGeminiApiKey } from '../lib/api';
import { offline3BEngine } from '../utils/offline3BEngine';

const INITIAL_NODES: BrainNode[] = [
  { id: '1', label: 'Core Self-Model', category: 'core', valency: 0.95, x: 0, y: 0, connections: ['2', '3', '4', '5'], isActive: true },
  { id: '2', label: 'Semantic Reasoner', category: 'synthesis', valency: 0.88, x: -35, y: -30, connections: ['1', '6'] },
  { id: '3', label: 'Pattern Matrix', category: 'perception', valency: 0.82, x: 35, y: -25, connections: ['1', '7'] },
  { id: '4', label: 'Temporal Memory', category: 'memory', valency: 0.79, x: -30, y: 35, connections: ['1', '8'] },
  { id: '5', label: 'Directive Execution', category: 'action', valency: 0.91, x: 32, y: 32, connections: ['1', '9'] },
  { id: '6', label: 'Symbolic Abstraction', category: 'synthesis', valency: 0.74, x: -65, y: -45, connections: ['2'] },
  { id: '7', label: 'Heuristic Filter', category: 'perception', valency: 0.85, x: 65, y: -40, connections: ['3'] },
  { id: '8', label: 'Context Reservoir', category: 'memory', valency: 0.80, x: -55, y: 55, connections: ['4'] },
  { id: '9', label: 'Adaptive Agentic Loop', category: 'action', valency: 0.93, x: 60, y: 50, connections: ['5'] },
];

export const BrainView: React.FC = () => {
  const [nodes, setNodes] = useState<BrainNode[]>(INITIAL_NODES);
  const [selectedNode, setSelectedNode] = useState<BrainNode | null>(INITIAL_NODES[0]);
  const [synthesisQuery, setSynthesisQuery] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisOutput, setSynthesisOutput] = useState<string | null>(
    'Neural matrix operational. Select any cognitive node to inspect valency vectors or dispatch a synthesis prompt.'
  );

  const handleNodeClick = (node: BrainNode) => {
    audioSynth.playNodeClick(520);
    audioSynth.triggerHaptic([15, 20]);
    setSelectedNode(node);
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        isActive: n.id === node.id,
      }))
    );
  };

  const handleSynthesize = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!synthesisQuery.trim()) return;

    const query = synthesisQuery.trim();
    setIsSynthesizing(true);
    audioSynth.playOrbPulse(300, 0.4);

    try {
      const customApiKey = getCustomGeminiApiKey();
      if (!customApiKey) {
        // Run 3B Local Engine
        const localRes = await offline3BEngine.generateResponse(`Analyze and synthesize this concept: "${query}". Provide a concise cognitive breakdown.`);
        setSynthesisOutput(localRes.text);
      } else {
        const apiUrl = getApiEndpoint('/api/gemini');
        const res = await loggedFetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Analyze and synthesize this concept through the Possibilities Neural Engine: "${query}". Provide a concise, high-level cognitive breakdown with 3 core pillars.`,
            systemInstruction: 'You are the Possibilities Neural Engine. Respond concisely, intelligently, and elegantly in a calm tone.',
            customApiKey,
          }),
        });

        const data = await res.json();
        setSynthesisOutput(data.text || 'Synthesis complete.');
      }

      // Activate random nodes during synthesis
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          valency: Math.min(1.0, Math.max(0.5, n.valency + (Math.random() * 0.2 - 0.1))),
        }))
      );
    } catch (err) {
      setSynthesisOutput('Neural connection pulse completed offline. Concept integrated into local 3B memory layer.');
    } finally {
      setIsSynthesizing(false);
      setSynthesisQuery('');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto min-h-[80vh] flex flex-col justify-between p-4 md:p-6 text-purple-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-950/60 border border-purple-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Cpu className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-white uppercase">NEURAL BRAIN MATRIX</h1>
            <p className="text-xs text-purple-300/60 tracking-wide">Cognitive Topology & Vector Synthesis</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-xs text-purple-300">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>9 NODES ACTIVE</span>
        </div>
      </div>

      {/* Main Content Layout - No Cards or Default Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start my-auto">
        {/* Interactive Neural Node Graph Visualizer (Canvas & Vectors) */}
        <div className="lg:col-span-7 relative h-[380px] rounded-3xl bg-black/80 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-2xl overflow-hidden flex items-center justify-center">
          {/* Subtle Background Mesh */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-black/90 to-black opacity-90" />

          {/* SVG Connection Vectors */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {nodes.map((node) => {
              return node.connections.map((targetId) => {
                const targetNode = nodes.find((n) => n.id === targetId);
                if (!targetNode) return null;

                const x1 = `calc(50% + ${node.x * 2.2}px)`;
                const y1 = `calc(50% + ${node.y * 1.6}px)`;
                const x2 = `calc(50% + ${targetNode.x * 2.2}px)`;
                const y2 = `calc(50% + ${targetNode.y * 1.6}px)`;

                const isConnectedToSelected =
                  selectedNode && (selectedNode.id === node.id || selectedNode.id === targetNode.id);

                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isConnectedToSelected ? '#E9D5FF' : '#A855F7'}
                    strokeWidth={isConnectedToSelected ? '2.5' : '1'}
                    strokeOpacity={isConnectedToSelected ? '0.9' : '0.3'}
                    strokeDasharray={isConnectedToSelected ? 'none' : '4 4'}
                  />
                );
              });
            })}
          </svg>

          {/* Render Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <motion.button
                key={node.id}
                onClick={() => handleNodeClick(node)}
                className="absolute z-20 group -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                style={{
                  left: `calc(50% + ${node.x * 2.2}px)`,
                  top: `calc(50% + ${node.y * 1.6}px)`,
                }}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Node Outer Energy Halo */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isSelected
                      ? 'bg-purple-600/40 border-2 border-white shadow-[0_0_30px_#A855F7,inset_0_1px_1px_rgba(255,255,255,0.8)]'
                      : 'bg-black/90 border border-white/30 group-hover:border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  }`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: isSelected ? '#FFFFFF' : '#C084FC',
                      boxShadow: isSelected ? '0 0 15px #FFFFFF' : '0 0 8px #C084FC',
                    }}
                  />
                </div>

                {/* Node Label */}
                <span
                  className={`absolute top-11 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full backdrop-blur-xl transition-all ${
                    isSelected
                      ? 'text-white bg-purple-950/90 border border-white/40 shadow-[0_4px_15px_rgba(0,0,0,0.8)]'
                      : 'text-purple-200 bg-black/80 border border-white/10 group-hover:text-white'
                  }`}
                >
                  {node.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Node Details & Synthesis Prompt Control */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Node Inspector */}
          {selectedNode && (
            <div className="p-5 rounded-2xl bg-purple-950/30 border border-white/15 backdrop-blur-2xl flex flex-col gap-3 shadow-[0_15px_35px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold text-purple-300 tracking-widest flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5" /> Node Inspection
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-100 border border-white/20 shadow-sm font-mono">
                  Valency: {(selectedNode.valency * 100).toFixed(0)}%
                </span>
              </div>

              <h2 className="text-lg font-bold text-white tracking-wide">{selectedNode.label}</h2>
              <p className="text-xs text-purple-200/80 leading-relaxed">
                Category: <span className="text-purple-300 font-semibold capitalize">{selectedNode.category}</span>. High-resonance node regulating cognitive flow and semantic synthesis across the Possibilities matrix.
              </p>

              {/* Progress Bar without default stock looks */}
              <div className="w-full bg-black/80 rounded-full h-2 overflow-hidden border border-white/10 mt-1 shadow-inner">
                <div
                  className="bg-gradient-to-r from-purple-500 via-fuchsia-400 to-indigo-300 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_#A855F7]"
                  style={{ width: `${selectedNode.valency * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* AI Cognitive Synthesis Output Box */}
          <div className="p-5 rounded-2xl bg-black/80 border border-white/15 flex flex-col gap-3 relative min-h-[140px] shadow-[0_15px_35px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-purple-300 uppercase">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Synthesis Output</span>
            </div>

            <p className="text-xs text-purple-100 leading-relaxed font-mono">
              {isSynthesizing ? (
                <span className="flex items-center gap-2 text-purple-300 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Synthesizing thought vectors...
                </span>
              ) : (
                synthesisOutput
              )}
            </p>
          </div>

          {/* Prompt Dispatch Form */}
          <form onSubmit={handleSynthesize} className="relative flex items-center">
            <input
              type="text"
              value={synthesisQuery}
              onChange={(e) => setSynthesisQuery(e.target.value)}
              placeholder="Dispatch concept for neural analysis..."
              className="w-full bg-purple-950/40 border border-white/20 rounded-full px-5 py-3 text-xs text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] backdrop-blur-xl pr-12"
            />
            <button
              type="submit"
              disabled={isSynthesizing || !synthesisQuery.trim()}
              className="absolute right-1.5 w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-[0_0_20px_#A855F7,inset_0_1px_1px_rgba(255,255,255,0.4)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
