import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Brain, Compass, MessageSquareCode, History, Sliders, ChevronRight, Tv } from 'lucide-react';
import { NexusSectionId, NexusNodeConfig } from '../types';
import { audioSynth } from '../utils/audioSynthesizer';

interface TheNexusProps {
  onSelectSection: (sectionId: NexusSectionId) => void;
  onCollapseNexus: () => void;
}

const NEXUS_SECTIONS: NexusNodeConfig[] = [
  {
    id: 'brain',
    label: 'BRAIN',
    sublabel: 'Neural Intelligence Engine',
    angle: 0, // Top
    iconName: 'Brain',
    accentColor: '#C084FC',
  },
  {
    id: 'livePreviewStage',
    label: 'LIVE PREVIEW STAGE',
    sublabel: 'Universal Execution Stage',
    angle: 60,
    iconName: 'Tv',
    accentColor: '#F43F5E',
  },
  {
    id: 'missions',
    label: 'MISSIONS',
    sublabel: 'Strategic Directives',
    angle: 120,
    iconName: 'Compass',
    accentColor: '#A855F7',
  },
  {
    id: 'chat',
    label: 'CHAT',
    sublabel: 'Intelligent Companion',
    angle: 180,
    iconName: 'MessageSquareCode',
    accentColor: '#38BDF8',
  },
  {
    id: 'memory',
    label: 'MEMORY',
    sublabel: 'Temporal Knowledge Vault',
    angle: 240,
    iconName: 'History',
    accentColor: '#E879F9',
  },
  {
    id: 'commandCenter',
    label: 'COMMAND CENTER',
    sublabel: 'System Diagnostics',
    angle: 300,
    iconName: 'Sliders',
    accentColor: '#34D399',
  },
];

export const TheNexus: React.FC<TheNexusProps> = ({ onSelectSection, onCollapseNexus }) => {
  const [activeHoverNode, setActiveHoverNode] = useState<NexusNodeConfig | null>(null);
  const [convergingNodeId, setConvergingNodeId] = useState<NexusSectionId | null>(null);

  // Radius for 5 nodes in circle (180px - 210px)
  const radiusPx = 200;

  const renderIcon = (iconName: string, color: string) => {
    const props = { className: 'w-6 h-6', style: { color } };
    switch (iconName) {
      case 'Brain':
        return <Brain {...props} />;
      case 'Compass':
        return <Compass {...props} />;
      case 'MessageSquareCode':
        return <MessageSquareCode {...props} />;
      case 'History':
        return <History {...props} />;
      case 'Sliders':
        return <Sliders {...props} />;
      case 'Tv':
        return <Tv {...props} />;
      default:
        return <Brain {...props} />;
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] flex items-center justify-center select-text overflow-hidden perspective-1000">
      {/* Dynamic Glass Atmosphere & Depth Grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
        <defs>
          <radialGradient id="nexusGridGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C084FC" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#7E22CE" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="laserPulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#E9D5FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Dynamic 3D Concentric Energy Rings */}
        <circle
          cx="50%"
          cy="50%"
          r={radiusPx}
          fill="url(#nexusGridGrad)"
          stroke="rgba(192, 132, 252, 0.25)"
          strokeWidth="1.5"
          strokeDasharray="6 12"
          className="animate-spin-slow"
        />
        <circle
          cx="50%"
          cy="50%"
          r={radiusPx * 0.55}
          fill="none"
          stroke="rgba(168, 85, 247, 0.3)"
          strokeWidth="1"
          strokeDasharray="2 6"
        />

        {/* Connective Ray Lines & Animated Laser Energy Pulses */}
        {NEXUS_SECTIONS.map((sec, i) => {
          const rad = (sec.angle - 90) * (Math.PI / 180);
          const x2 = 50 + (Math.cos(rad) * radiusPx) / 5; // percentage approximation
          const y2 = 50 + (Math.sin(rad) * radiusPx) / 5;
          const isHovered = sec.id === activeHoverNode?.id;

          return (
            <g key={`ray-group-${sec.id}`}>
              {/* Core Ray Line */}
              <line
                x1="50%"
                y1="50%"
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke={isHovered ? sec.accentColor : '#A855F7'}
                strokeWidth={isHovered ? '2.5' : '1'}
                strokeOpacity={isHovered ? '0.9' : '0.25'}
                className="transition-all duration-300"
              />
              {/* Flowing Laser Energy Pulse along ray */}
              <circle
                r={isHovered ? '4' : '2.5'}
                fill={sec.accentColor}
                className="opacity-80 shadow-[0_0_10px_currentColor]"
              >
                <animateMotion
                  path={`M 0 0 L ${(Math.cos(rad) * radiusPx)} ${(Math.sin(rad) * radiusPx)}`}
                  dur={`${2.2 - i * 0.3}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })}
      </svg>

      {/* 5 Radial Glass Nodes with 3D Depth & Specular Sheen */}
      <div className="relative w-[500px] h-[500px] flex items-center justify-center transform-style-3d">
        {NEXUS_SECTIONS.map((section, index) => {
          const angleRad = (section.angle - 90) * (Math.PI / 180);
          const x = Math.cos(angleRad) * radiusPx;
          const y = Math.sin(angleRad) * radiusPx;

          const isHovered = activeHoverNode?.id === section.id;
          const isConverging = convergingNodeId === section.id;

          return (
            <motion.div
              key={section.id}
              className="absolute z-30"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
              }}
              initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
              animate={
                isConverging
                  ? {
                      opacity: [1, 1, 0],
                      scale: [1, 1.4, 0.2],
                      x: ['-50%', `${-x - 50}%`],
                      y: ['-50%', `${-y - 50}%`],
                    }
                  : { opacity: 1, scale: 1, x: '-50%', y: '-50%' }
              }
              transition={
                isConverging
                  ? { duration: 0.2, ease: 'easeIn' }
                  : { duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }
              }
            >
              <motion.button
                onClick={() => {
                  if (convergingNodeId) return;
                  setConvergingNodeId(section.id);
                  audioSynth.triggerHaptic([20, 50, 80]);
                  audioSynth.playNodeClick(880 + index * 100);
                  audioSynth.playOrbPulse(300, 0.5);

                  setTimeout(() => {
                    onSelectSection(section.id);
                  }, 160);
                }}
                onPointerEnter={() => {
                  setActiveHoverNode(section);
                  audioSynth.playNodeClick(800 + index * 50);
                }}
                onPointerLeave={() => setActiveHoverNode(null)}
                whileHover={{ scale: 1.15, z: 20 }}
                whileTap={{ scale: 0.92 }}
                className={`relative group flex flex-col items-center p-3 rounded-full transition-all duration-300 ${
                  isHovered ? 'z-40' : 'z-30'
                }`}
              >
                {/* Node Ambient Volumetric Aura */}
                <div
                  className="absolute inset-0 rounded-full blur-xl opacity-30 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ backgroundColor: section.accentColor }}
                />

                {/* Glass Orb Shell Button Container */}
                <div
                  className="relative w-16 h-16 rounded-full bg-gradient-to-b from-purple-950/70 via-black/90 to-purple-950/80 border border-white/20 group-hover:border-white/60 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)] backdrop-blur-xl group-hover:shadow-[0_0_35px_rgba(192,132,252,0.8),inset_0_1px_3px_rgba(255,255,255,0.8)] transition-all duration-300 overflow-hidden"
                  style={{
                    borderColor: isHovered ? section.accentColor : undefined,
                  }}
                >
                  {/* Glass Top Curve Reflection */}
                  <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none" />

                  {/* Icon with Dynamic Glow */}
                  <div className="relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_12px_currentColor]">
                    {renderIcon(section.iconName, section.accentColor)}
                  </div>
                </div>

                {/* Node Glass Badge Label */}
                <div className="absolute top-20 flex flex-col items-center pointer-events-none whitespace-nowrap z-20">
                  <span
                    className="text-xs font-semibold tracking-widest text-purple-100 group-hover:text-white uppercase px-3 py-1 rounded-full bg-black/80 border border-purple-400/30 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-300"
                    style={{ color: isHovered ? section.accentColor : undefined }}
                  >
                    {section.label}
                  </span>
                  <span className="text-[10px] font-medium tracking-wider text-purple-200/70 mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200 drop-shadow-md">
                    {section.sublabel}
                  </span>
                </div>
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Active Node Bottom Glass Status Bar */}
      {activeHoverNode && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute bottom-6 z-30 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-purple-950/60 border border-purple-400/40 backdrop-blur-2xl text-xs font-medium tracking-wider text-purple-100 shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)]"
        >
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor]"
            style={{ backgroundColor: activeHoverNode.accentColor }}
          />
          <span>ENGAGE {activeHoverNode.label} MODULE</span>
          <ChevronRight className="w-4 h-4 text-purple-300 animate-pulse" />
        </motion.div>
      )}
    </div>
  );
};
