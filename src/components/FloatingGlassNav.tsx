import React from 'react';
import { motion } from 'motion/react';
import { Brain, Compass, MessageSquareCode, History, Sliders, ShieldAlert, Sparkles } from 'lucide-react';
import { AppRoute, NexusSectionId } from '../types';
import { audioSynth } from '../utils/audioSynthesizer';

interface NavItem {
  id: AppRoute;
  label: string;
  icon: React.FC<{ className?: string }>;
  accentColor: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'nexus', label: 'NEXUS', icon: Sparkles, accentColor: '#C084FC' },
  { id: 'brain', label: 'BRAIN', icon: Brain, accentColor: '#C084FC' },
  { id: 'missions', label: 'MISSIONS', icon: Compass, accentColor: '#A855F7' },
  { id: 'chat', label: 'CHAT', icon: MessageSquareCode, accentColor: '#38BDF8' },
  { id: 'memory', label: 'MEMORY', icon: History, accentColor: '#E879F9' },
  { id: 'commandCenter', label: 'COMMAND', icon: Sliders, accentColor: '#34D399' },
  { id: 'orbDefense', label: 'DEFENSE', icon: ShieldAlert, accentColor: '#F43F5E' },
];

interface FloatingGlassNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const FloatingGlassNav: React.FC<FloatingGlassNavProps> = ({ currentRoute, onNavigate }) => {
  return (
    <div className="fixed bottom-6 inset-x-0 z-40 flex flex-col items-center pointer-events-none select-none">
      {/* Upward Energy Beam emanating from the active module towards the living Orb */}
      <div className="relative w-full max-w-lg flex justify-center h-4 overflow-visible pointer-events-none">
        <motion.div
          layoutId="activeEnergyBeam"
          className="w-1 bg-gradient-to-t from-purple-400 via-purple-600/40 to-transparent blur-[1px] shadow-[0_0_15px_#A855F7]"
          style={{ height: '40px', translateY: '-24px' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      </div>

      {/* Glass Panel Capsule */}
      <motion.nav
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto relative flex items-center gap-1 sm:gap-2 px-3 py-2 rounded-full bg-black/70 border border-white/20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.3)]"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = currentRoute === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                audioSynth.triggerHaptic([12, 24]);
                audioSynth.playNodeClick(isActive ? 880 : 600);
                onNavigate(item.id);
              }}
              className="relative group flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 focus:outline-none"
              title={item.label}
            >
              {/* Active Item Glass Glow Background */}
              {isActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 rounded-full bg-purple-950/80 border border-white/30 shadow-[0_0_20px_rgba(168,85,247,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  style={{
                    borderColor: item.accentColor,
                  }}
                />
              )}

              {/* Icon */}
              <div
                className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? 'scale-110' : 'opacity-60 group-hover:opacity-100'
                }`}
                style={{
                  color: isActive ? item.accentColor : '#D8B4FE',
                  filter: isActive ? `drop-shadow(0 0 8px ${item.accentColor})` : undefined,
                }}
              >
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>

              {/* Label (Only visible when active or hovered to keep navigation clean and uncluttered) */}
              <motion.span
                className={`relative z-10 text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap hidden sm:inline-block ${
                  isActive ? 'block text-white opacity-100' : 'hidden group-hover:inline-block text-purple-200/80'
                }`}
              >
                {item.label}
              </motion.span>
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
};
