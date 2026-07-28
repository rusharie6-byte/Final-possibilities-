import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { OrbMode, SystemMode } from '../types';
import { audioSynth } from '../utils/audioSynthesizer';
import { perfManager } from '../utils/performance';

const orbImageUrl = new URL('../assets/images/crystal_orb_asset_1785163496547.jpg', import.meta.url).href;

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking';

interface OrbProps {
  mode?: OrbMode | 'small' | 'chat';
  state?: OrbState;
  audioLevel?: number; // 0.0 to 1.0 audio reactivity level
  systemMode?: SystemMode;
  onClick?: () => void;
  onLongPress?: () => void;
  isEnergized?: boolean;
  pulseScale?: number;
  glowExpansionPx?: number;
  className?: string;
}

// Pre-cached static Image instance to avoid re-creation on re-renders
const cachedOrbImg = new Image();
cachedOrbImg.src = orbImageUrl;

export const Orb: React.FC<OrbProps> = ({
  mode = 'hero',
  state = 'idle',
  audioLevel = 0,
  systemMode = 'calm',
  onClick,
  onLongPress,
  isEnergized = false,
  pulseScale = 1.0,
  glowExpansionPx = 50,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [chargeProgress, setChargeProgress] = useState(0);

  const pointerPos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chargeAnimRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const isLongPressTriggered = useRef(false);

  const [effectiveMode, setEffectiveMode] = useState<'high' | 'low'>(perfManager.getEffectiveMode());

  useEffect(() => {
    const unsubscribe = perfManager.subscribe(() => {
      setEffectiveMode(perfManager.getEffectiveMode());
    });
    return unsubscribe;
  }, []);

  // Size mapping according to specification
  const getSize = () => {
    switch (mode) {
      case 'hero':
        return 430; // Enriched visual gravity — Possibilities living presence
      case 'nexus':
        return 180;
      case 'floating':
        return 100;
      case 'chat':
        return 75;
      case 'small':
      case 'minimized':
        return 55;
      default:
        return 220;
    }
  };

  const baseSize = getSize();
  const canvasSize = baseSize + 280; // Expansive canvas padding for deep atmospheric purple aura bloom
  const baseRadius = baseSize / 2;

  // System mode or state color accents (#7B2FFF core, #A020F0 spikes, #4B0082 depth)
  const getColors = () => {
    switch (systemMode) {
      case 'intelligence':
        return { core: '#E0E7FF', innerGlow: '#818CF8', outerGlow: '#6366F1', spikes: 'rgba(199, 210, 254, 0.9)' };
      case 'focus':
        return { core: '#F5D0FE', innerGlow: '#C084FC', outerGlow: '#A855F7', spikes: 'rgba(233, 213, 255, 0.9)' };
      case 'overdrive':
        return { core: '#FFEDD5', innerGlow: '#F97316', outerGlow: '#D97706', spikes: 'rgba(253, 186, 116, 0.9)' };
      case 'calm':
      default:
        return {
          core: '#8B5CF6',
          brightCore: '#C084FC',
          deepCore: '#581C87',
          innerGlow: 'rgba(168, 85, 247, 0.85)',
          outerGlow: 'rgba(147, 51, 234, 0.65)',
          spikes: 'rgba(192, 132, 252, 0.9)',
        };
    }
  };

  const colors = getColors();

  // Canvas render loop for living 3D crystal glass orb
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    let processSweepAngle = 0;

    const img = cachedOrbImg;

    const isHigh = effectiveMode === 'high';
    const particleCount = isHigh ? 50 : 25;

    // Orbiting, bright, living stardust particles inside and around Possibilities
    const stardust = Array.from({ length: particleCount }).map((_, i) => ({
      orbitRadiusRatio: 0.2 + Math.random() * 0.75,
      orbitAngle: (i / particleCount) * Math.PI * 2,
      orbitSpeed: (0.003 + Math.random() * 0.006) * (Math.random() < 0.5 ? 1 : -1),
      tiltAngle: Math.random() * Math.PI,
      size: Math.random() * 1.5 + 0.5,
      baseAlpha: Math.random() * 0.75 + 0.25,
      twinkleSpeed: 1.2 + Math.random() * 2.5,
      color: Math.random() < 0.5 ? 'rgba(255, 255, 255, ' : Math.random() < 0.8 ? 'rgba(233, 213, 255, ' : 'rgba(192, 132, 252, ',
    }));

    const render = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      time += 0.012; // Calmer, slower time step
      processSweepAngle += 0.03;

      // Pointer interactive tilt offset
      const mouseX = pointerPos.current.x;
      const mouseY = pointerPos.current.y;
      const centerX = canvas.width / 2 + mouseX * 0.03;
      const centerY = canvas.height / 2 + mouseY * 0.03 - 4;

      let stateScaleMultiplier = 1.0;
      let stateGlowAlpha = 0.75;

      switch (state) {
        case 'listening':
          stateScaleMultiplier = 1.0 + Math.sin(time * 3.5) * 0.025 + audioLevel * 0.05;
          stateGlowAlpha = 0.9 + audioLevel * 0.1;
          break;
        case 'processing':
          stateScaleMultiplier = 1.0 + Math.sin(time * 2.8) * 0.02;
          stateGlowAlpha = 0.85;
          break;
        case 'speaking':
          stateScaleMultiplier = 1.0 + Math.sin(time * 3.0) * 0.025 + audioLevel * 0.04;
          stateGlowAlpha = 0.85;
          break;
        case 'idle':
        default:
          // Very slow, calm, deep 8-second breathing motion
          stateScaleMultiplier = 1.0 + Math.sin(time * 0.8) * 0.028;
          stateGlowAlpha = 0.7 + Math.sin(time * 0.6) * 0.12;
          break;
      }

      const totalRadius = baseRadius * stateScaleMultiplier * pulseScale;

      // ── LAYER 1: GROUNDED DROP SHADOW & DOWNWARD VIOLET AMBIENT REFLECTION ──
      const shadowY = centerY + totalRadius * 0.94;
      const shadowRx = totalRadius * 0.9;
      const shadowRy = totalRadius * 0.22;

      // Dark matte contact shadow
      const matteShadowGrad = ctx.createRadialGradient(
        centerX,
        shadowY,
        0,
        centerX,
        shadowY,
        shadowRx * 1.2
      );
      matteShadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      matteShadowGrad.addColorStop(0.35, 'rgba(20, 8, 45, 0.85)');
      matteShadowGrad.addColorStop(0.7, 'rgba(147, 51, 234, 0.2)');
      matteShadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.ellipse(centerX, shadowY, shadowRx * 1.2, shadowRy * 1.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = matteShadowGrad;
      ctx.fill();

      // Soft bright violet ambient floor reflection spot directly beneath orb
      ctx.beginPath();
      ctx.ellipse(centerX, shadowY + 2, shadowRx * 0.8, shadowRy * 0.75, 0, 0, Math.PI * 2);
      const floorGlowGrad = ctx.createRadialGradient(
        centerX,
        shadowY + 2,
        0,
        centerX,
        shadowY + 2,
        shadowRx * 0.8
      );
      floorGlowGrad.addColorStop(0, `rgba(253, 224, 71, ${0.45 + Math.sin(time * 1.5) * 0.08})`);
      floorGlowGrad.addColorStop(0.3, `rgba(216, 180, 254, ${0.5 + Math.sin(time * 1.5) * 0.08})`);
      floorGlowGrad.addColorStop(0.6, `rgba(168, 85, 247, ${0.3 + Math.sin(time * 1.8) * 0.05})`);
      floorGlowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = floorGlowGrad;
      ctx.fill();

      // Golden ground embers sparkling on the wet floor surface beneath the orb
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2 + time * 0.2;
        const dist = (0.2 + (i % 5) * 0.18) * shadowRx;
        const ex = centerX + Math.cos(angle) * dist;
        const ey = shadowY + Math.sin(angle) * (shadowRy * 0.6);
        const eAlpha = 0.25 + Math.sin(time * 2 + i) * 0.25;
        const eSize = 0.8 + (i % 3) * 0.6;

        ctx.beginPath();
        ctx.arc(ex, ey, eSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(253, 224, 71, ${eAlpha})`;
        ctx.fill();
      }
      ctx.restore();

      // ── LAYER 2: INTENSE ATMOSPHERIC VIOLET/MAGENTA BLOOM HALO ──
      const glowRadius = totalRadius + 140 * (1 + audioLevel * 0.3);
      const outerGlowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        totalRadius * 0.2,
        centerX,
        centerY,
        glowRadius
      );
      outerGlowGrad.addColorStop(0, `rgba(216, 180, 254, ${stateGlowAlpha * 0.75})`);
      outerGlowGrad.addColorStop(0.3, `rgba(168, 85, 247, ${stateGlowAlpha * 0.5})`);
      outerGlowGrad.addColorStop(0.65, `rgba(109, 40, 217, ${stateGlowAlpha * 0.22})`);
      outerGlowGrad.addColorStop(0.85, `rgba(58, 12, 115, ${stateGlowAlpha * 0.08})`);
      outerGlowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = outerGlowGrad;
      ctx.fill();

      // ── LAYER 3: PHOTOREALISTIC 3D ORB (CIRCULAR CLIPPED — NO RECTANGULAR EDGES) ──
      if (img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, totalRadius * 0.98, 0, Math.PI * 2);
        ctx.clip();

        const renderSize = totalRadius * 2.1;
        ctx.drawImage(
          img,
          centerX - renderSize / 2,
          centerY - renderSize / 2,
          renderSize,
          renderSize
        );
        ctx.restore();
      }

      // ── LAYER 4: INTERNAL FLOWING ENERGY NEBULA HIGHLIGHTS ──
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, totalRadius * 0.94, 0, Math.PI * 2);
      ctx.clip();

      // Swirling internal energy core
      const swirlX = centerX + Math.cos(time * 0.5) * totalRadius * 0.15;
      const swirlY = centerY + Math.sin(time * 0.7) * totalRadius * 0.15;
      const innerEnergyGrad = ctx.createRadialGradient(
        swirlX,
        swirlY,
        0,
        swirlX,
        swirlY,
        totalRadius * 0.8
      );
      innerEnergyGrad.addColorStop(0, `rgba(245, 208, 254, ${0.25 + Math.sin(time * 1.2) * 0.08})`);
      innerEnergyGrad.addColorStop(0.5, `rgba(192, 132, 252, ${0.15 + Math.cos(time * 0.9) * 0.05})`);
      innerEnergyGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = innerEnergyGrad;
      ctx.fill();

      // ── LAYER 5: CONTINUOUS ORBITING STARDUST PARTICLES ──
      ctx.globalCompositeOperation = 'lighter';
      stardust.forEach((p) => {
        p.orbitAngle += p.orbitSpeed;

        const rx = totalRadius * p.orbitRadiusRatio;
        const ry = rx * 0.65;

        // Elliptical 3D orbital projection
        const cosA = Math.cos(p.orbitAngle);
        const sinA = Math.sin(p.orbitAngle);
        const px = centerX + cosA * rx * Math.cos(p.tiltAngle) - sinA * ry * Math.sin(p.tiltAngle);
        const py = centerY + cosA * rx * Math.sin(p.tiltAngle) + sinA * ry * Math.cos(p.tiltAngle);

        const alpha = Math.min(1.0, Math.max(0.15, p.baseAlpha + Math.sin(time * p.twinkleSpeed + p.orbitAngle) * 0.35));

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${alpha})`;
        ctx.fill();
      });
      ctx.restore();

      // ── LAYER 6: PROCESSING SWEEP RING ──
      if (state === 'processing') {
        ctx.beginPath();
        ctx.arc(centerX, centerY, totalRadius * 1.05, processSweepAngle, processSweepAngle + Math.PI * 0.6);
        ctx.strokeStyle = 'rgba(233, 213, 255, 0.95)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Pointer spring dampening
      pointerPos.current.x += (pointerPos.current.targetX - pointerPos.current.x) * 0.08;
      pointerPos.current.y += (pointerPos.current.targetY - pointerPos.current.y) * 0.08;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [baseRadius, glowExpansionPx, isEnergized, pulseScale, isHovered, systemMode, state, audioLevel, effectiveMode]);

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    pointerPos.current.targetX = x;
    pointerPos.current.targetY = y;
  };

  const handlePointerDown = () => {
    isLongPressTriggered.current = false;
    setIsCharging(true);
    setChargeProgress(0);

    const startTime = Date.now();
    const duration = 480;

    const updateCharge = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(1, elapsed / duration);
      setChargeProgress(pct);

      if (pct < 1) {
        chargeAnimRef.current = requestAnimationFrame(updateCharge);
      } else {
        isLongPressTriggered.current = true;
        setIsCharging(false);
        audioSynth.triggerHaptic([30, 60, 90, 120]);
        audioSynth.playOrbPulse(350, 0.6);
        if (onLongPress) {
          onLongPress();
        } else if (onClick) {
          onClick();
        }
      }
    };

    chargeAnimRef.current = requestAnimationFrame(updateCharge);
  };

  const handlePointerUp = () => {
    if (chargeAnimRef.current) cancelAnimationFrame(chargeAnimRef.current);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    if (!isLongPressTriggered.current) {
      setIsCharging(false);
      setChargeProgress(0);
      handleOrbClick();
    }
  };

  const handlePointerLeave = () => {
    if (chargeAnimRef.current) cancelAnimationFrame(chargeAnimRef.current);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    setIsCharging(false);
    setChargeProgress(0);
    pointerPos.current.targetX = 0;
    pointerPos.current.targetY = 0;
    setIsHovered(false);
  };

  const handleOrbClick = () => {
    audioSynth.triggerHaptic([20, 40, 20]);
    audioSynth.playOrbPulse(160, 0.35);
    if (onClick) {
      onClick();
    }
  };

  const strokeDash = 2 * Math.PI * (baseRadius + 12);

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center cursor-pointer select-none touch-manipulation ${className}`}
      style={{
        width: canvasSize,
        height: canvasSize,
        filter: 'drop-shadow(0 0 60px rgba(123, 47, 255, 0.6)) drop-shadow(0 0 120px rgba(123, 47, 255, 0.3))',
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handlePointerLeave}
      role="button"
      aria-label="Possibilities Central Living Orb"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleOrbClick();
        }
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="block pointer-events-none"
      />

      {/* Charging Ring SVG Overlay for Long Press Visual Feedback */}
      {isCharging && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none transform -rotate-90"
          viewBox={`0 0 ${canvasSize} ${canvasSize}`}
        >
          <circle
            cx={canvasSize / 2}
            cy={canvasSize / 2}
            r={baseRadius + 12}
            fill="none"
            stroke="#A855F7"
            strokeWidth="3.5"
            strokeDasharray={strokeDash}
            strokeDashoffset={strokeDash * (1 - chargeProgress)}
            strokeLinecap="round"
            className="filter drop-shadow-[0_0_12px_#A855F7]"
          />
        </svg>
      )}
    </motion.div>
  );
};

