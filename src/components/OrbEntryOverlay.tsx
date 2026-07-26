import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audioSynth } from '../utils/audioSynthesizer';

interface OrbEntryOverlayProps {
  isTriggered: boolean;
  onSequenceComplete: () => void;
}

export const OrbEntryOverlay: React.FC<OrbEntryOverlayProps> = ({
  isTriggered,
  onSequenceComplete,
}) => {
  const [step, setStep] = useState<number>(0); // 0 = idle, 1..6 = sequence steps, 7 = complete

  useEffect(() => {
    if (!isTriggered) {
      setStep(0);
      return;
    }

    let isMounted = true;

    const runSequence = async () => {
      // 0ms: User Tap -> Haptic + Orb Pulse
      audioSynth.triggerHaptic([30, 60, 30]);
      audioSynth.playOrbPulse(140, 0.2);
      if (isMounted) setStep(1); // 0ms - 120ms

      await new Promise((r) => setTimeout(r, 120));
      if (!isMounted) return;
      // 120ms: Energy Intensifies
      setStep(2); // 120ms - 270ms

      await new Promise((r) => setTimeout(r, 150));
      if (!isMounted) return;
      // 270ms: Glow Expands + Sound Bloom Pulse
      audioSynth.playEnergyBloom();
      setStep(3); // 270ms - 470ms

      await new Promise((r) => setTimeout(r, 200));
      if (!isMounted) return;
      // 470ms: Purple Bloom Fills Screen (alpha -> 0.9)
      setStep(4); // 470ms - 650ms

      await new Promise((r) => setTimeout(r, 180));
      if (!isMounted) return;
      // 650ms: Background Dissolves
      setStep(5); // 650ms - 750ms

      await new Promise((r) => setTimeout(r, 100));
      if (!isMounted) return;
      // 750ms: Core Interface Appears
      setStep(6); // 750ms - 900ms

      await new Promise((r) => setTimeout(r, 150));
      if (!isMounted) return;
      // 900ms: Sequence Complete
      setStep(7);
      onSequenceComplete();
    };

    runSequence();

    return () => {
      isMounted = false;
    };
  }, [isTriggered, onSequenceComplete]);

  if (!isTriggered || step === 0) return null;

  // Calculate bloom alpha based on step
  let bloomAlpha = 0;
  if (step >= 4 && step < 6) bloomAlpha = 0.9;
  else if (step >= 6) bloomAlpha = 0.3; // Bloom fades to 0.3 and stays inside Nexus

  let expandGlowRadius = 40;
  if (step >= 3) expandGlowRadius = 200;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {/* Step 3: Expanding Shockwave Glow */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-purple-600/40"
          initial={{ width: 80, height: 80, opacity: 0 }}
          animate={{
            width: expandGlowRadius * 4,
            height: expandGlowRadius * 4,
            opacity: step >= 3 ? 0.8 : 0.2,
          }}
          transition={{ duration: 0.2, ease: [0.0, 0.0, 0.2, 1] }}
        />

        {/* Step 4 & 5: Purple Bloom Overlay Color 0xFFA855F7 */}
        <motion.div
          className="absolute inset-0 bg-[#A855F7]"
          initial={{ opacity: 0 }}
          animate={{ opacity: bloomAlpha }}
          transition={{ duration: step >= 6 ? 0.3 : 0.18, ease: 'easeInOut' }}
        />

        {/* Step 6: Radiant Particles Burst */}
        {step >= 5 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="w-96 h-96 rounded-full border border-purple-300/60 shadow-[0_0_120px_#A855F7]"
            />
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
