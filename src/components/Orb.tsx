import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { OrbMode, SystemMode } from '../types';
import { audioSynth } from '../utils/audioSynthesizer';
import { perfManager } from '../utils/performance';

interface OrbProps {
  mode: OrbMode;
  systemMode?: SystemMode;
  onClick?: () => void;
  onLongPress?: () => void;
  isEnergized?: boolean;
  pulseScale?: number;
  glowExpansionPx?: number;
  className?: string;
}

export const Orb: React.FC<OrbProps> = ({
  mode,
  systemMode = 'calm',
  onClick,
  onLongPress,
  isEnergized = false,
  pulseScale = 1.0,
  glowExpansionPx = 40,
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
        return 220;
      case 'nexus':
        return 140;
      case 'floating':
        return 80;
      case 'minimized':
        return 50;
      default:
        return 180;
    }
  };

  const canvasSize = getSize() + 100; // Extra padding for spike expansion and bloom glow
  const baseRadius = getSize() / 2;

  // System mode color accents
  const getColors = () => {
    switch (systemMode) {
      case 'intelligence':
        return { core: '#E0E7FF', innerGlow: '#818CF8', outerGlow: '#6366F1', spikes: '#C7D2FE' };
      case 'focus':
        return { core: '#F5D0FE', innerGlow: '#C084FC', outerGlow: '#A855F7', spikes: '#E9D5FF' };
      case 'overdrive':
        return { core: '#FFEDD5', innerGlow: '#F97316', outerGlow: '#D97706', spikes: '#FDBA74' };
      case 'calm':
      default:
        return { core: '#FAF5FF', innerGlow: '#C084FC', outerGlow: '#A855F7', spikes: '#E9D5FF' };
    }
  };

  const colors = getColors();

  // Canvas render loop for living 3D glass orb with plasma filaments, multi-layer depth parallax, and specular reflections
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotationAngle = 0;
    let time = 0;

    // Multi-depth particle layers (Foreground, Midground, Background)
    const particles = Array.from({ length: 36 }).map((_, i) => ({
      layer: i % 3, // 0 = back (slow, dark), 1 = mid, 2 = front (fast, bright)
      angle: Math.random() * Math.PI * 2,
      dist: baseRadius * (0.6 + Math.random() * 0.9),
      speed: (Math.random() * 0.012 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
      size: Math.random() * 2.5 + 0.8,
      alpha: Math.random() * 0.7 + 0.3,
      z: Math.random() * 2 - 1, // depth Z index -1 to 1
    }));

    // Living plasma strands inside core
    const strands = Array.from({ length: 7 }).map((_, i) => ({
      phase: i * (Math.PI / 3.5),
      speed: 0.02 + Math.random() * 0.02,
      amplitude: 0.15 + Math.random() * 0.25,
      frequency: 2 + Math.floor(Math.random() * 3),
    }));

    const render = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      time += 0.025;
      rotationAngle += 0.2; // REQUIRED SPEC: Rotate 0.2deg per frame

      const isHigh = effectiveMode === 'high';

      // Multi-layer parallax coordinates based on mouse position
      const mouseX = pointerPos.current.x;
      const mouseY = pointerPos.current.y;

      // Layer centers for 3D illusion
      const backX = canvas.width / 2 + mouseX * 0.05;
      const backY = canvas.height / 2 + mouseY * 0.05;
      const midX = canvas.width / 2 + mouseX * 0.15;
      const midY = canvas.height / 2 + mouseY * 0.15;
      const frontX = canvas.width / 2 + mouseX * 0.28;
      const fontY = canvas.height / 2 + mouseY * 0.28;

      // Organic double-beat heartbeat pulse (ba-bum... ba-bum)
      const heartCycle = (time * 1.2) % (Math.PI * 2);
      const heartPulse =
        Math.exp(-Math.pow(heartCycle - 1, 2) * 8) * 0.12 +
        Math.exp(-Math.pow(heartCycle - 1.5, 2) * 12) * 0.08;
      const breathe = 1.0 + heartPulse + Math.sin(time * 0.8) * 0.04;

      // 1. BACK DEPTH LAYER: Expanded Volumetric Radial Atmospheric Bloom
      const glowRadius = (baseRadius + glowExpansionPx + 20) * breathe * (isHovered ? 1.2 : 1.0);
      const outerGlowGrad = ctx.createRadialGradient(
        backX,
        backY,
        baseRadius * 0.1,
        backX,
        backY,
        glowRadius
      );
      outerGlowGrad.addColorStop(0, colors.innerGlow);
      outerGlowGrad.addColorStop(0.35, `${colors.outerGlow}${isEnergized ? 'FF' : 'B3'}`);
      outerGlowGrad.addColorStop(0.7, `${colors.outerGlow}44`);
      outerGlowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(backX, backY, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = outerGlowGrad;
      ctx.fill();

      // 2. MID DEPTH LAYER: Canvas Particle Spikes (12 spikes, rotate 0.2 deg/frame)
      const spikeCount = isHigh ? 12 : 8;
      const currentRotationRad = (rotationAngle * Math.PI) / 180;

      for (let i = 0; i < spikeCount; i++) {
        const spikeAngle = currentRotationRad + (i * (Math.PI * 2)) / spikeCount;
        const spikeLength =
          baseRadius *
          (1.28 + Math.sin(time * 2.2 + i) * 0.18 + heartPulse * 0.5) *
          (isEnergized ? 1.45 : 1.0);
        const spikeAlpha = 0.35 + Math.sin(time * 2.5 + i) * 0.35 + (isEnergized ? 0.35 : 0);

        const tipX = midX + Math.cos(spikeAngle) * spikeLength;
        const tipY = midY + Math.sin(spikeAngle) * spikeLength;

        const baseAngleLeft = spikeAngle - 0.09;
        const baseAngleRight = spikeAngle + 0.09;

        const baseLeftX = midX + Math.cos(baseAngleLeft) * (baseRadius * 0.82);
        const baseLeftY = midY + Math.sin(baseAngleLeft) * (baseRadius * 0.82);

        const baseRightX = midX + Math.cos(baseAngleRight) * (baseRadius * 0.82);
        const baseRightY = midY + Math.sin(baseAngleRight) * (baseRadius * 0.82);

        ctx.beginPath();
        ctx.moveTo(baseLeftX, baseLeftY);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(baseRightX, baseRightY);
        ctx.closePath();

        const spikeGrad = ctx.createLinearGradient(midX, midY, tipX, tipY);
        spikeGrad.addColorStop(0, colors.outerGlow);
        spikeGrad.addColorStop(0.5, colors.spikes);
        spikeGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = spikeGrad;
        ctx.globalAlpha = Math.min(1.0, Math.max(0, spikeAlpha));
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 3. MID-FRONT LAYER: 3D Tilting Orbital Ring
      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(time * 0.15);
      ctx.scale(1.0, 0.35);

      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 1.3 * breathe, 0, Math.PI * 2);
      ctx.strokeStyle = colors.spikes;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.4 + Math.sin(time * 1.5) * 0.2;
      ctx.setLineDash([6, 12]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 4. MICRO PARTICLES
      particles.forEach((p) => {
        p.angle += p.speed;
        const pX = midX + (p.layer === 2 ? mouseX * 0.1 : 0);
        const pY = midY + (p.layer === 2 ? mouseY * 0.1 : 0);
        const px = pX + Math.cos(p.angle) * p.dist * breathe;
        const py = pY + Math.sin(p.angle) * p.dist * breathe;

        ctx.beginPath();
        ctx.arc(px, py, p.size * (p.layer === 2 ? 1.4 : p.layer === 1 ? 1.0 : 0.7), 0, Math.PI * 2);
        ctx.fillStyle = p.layer === 2 ? '#FFFFFF' : colors.spikes;
        ctx.globalAlpha = p.alpha * (0.5 + Math.sin(time * 2 + p.angle) * 0.5);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // 5. CORE SPHERE
      const coreRadius = baseRadius * breathe * pulseScale;

      const coreGrad = ctx.createRadialGradient(
        midX - coreRadius * 0.3,
        midY - coreRadius * 0.3,
        coreRadius * 0.05,
        midX,
        midY,
        coreRadius
      );
      coreGrad.addColorStop(0, '#FFFFFF');
      coreGrad.addColorStop(0.2, colors.core);
      coreGrad.addColorStop(0.5, colors.innerGlow);
      coreGrad.addColorStop(0.85, colors.outerGlow);
      coreGrad.addColorStop(1.0, '#150028');

      ctx.beginPath();
      ctx.arc(midX, midY, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      if (isHigh) {
        ctx.shadowColor = colors.outerGlow;
        ctx.shadowBlur = isEnergized ? 50 : 30;
      }
      ctx.fill();
      if (isHigh) ctx.shadowBlur = 0;

      // 5b. Living Organic Plasma Filaments inside Core
      ctx.save();
      ctx.beginPath();
      ctx.arc(midX, midY, coreRadius * 0.95, 0, Math.PI * 2);
      ctx.clip();

      strands.forEach((st) => {
        ctx.beginPath();
        const strandAngle = st.phase + time * st.speed * 10;
        const startX = midX + Math.cos(strandAngle) * coreRadius * 0.8;
        const startY = midY + Math.sin(strandAngle) * coreRadius * 0.8;
        const endX = midX - Math.cos(strandAngle) * coreRadius * 0.8;
        const endY = midY - Math.sin(strandAngle) * coreRadius * 0.8;

        const ctrlX = midX + Math.sin(time * 3 + st.phase) * coreRadius * st.amplitude;
        const ctrlY = midY + Math.cos(time * 3 + st.phase) * coreRadius * st.amplitude;

        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.8;
        ctx.globalAlpha = 0.3 + Math.sin(time * 4 + st.phase) * 0.25;
        if (isHigh) {
          ctx.shadowColor = colors.spikes;
          ctx.shadowBlur = 10;
        }
        ctx.stroke();
      });
      ctx.restore();

      // 5c. 3D GLASS SPHERE SPECULAR REFLECTION & DOME GLARE
      // Top-Left Curved Glass Meniscus Highlight
      const highlightX = frontX - coreRadius * 0.35;
      const highlightY = fontY - coreRadius * 0.35;
      const glassGrad = ctx.createRadialGradient(
        highlightX,
        highlightY,
        0,
        highlightX,
        highlightY,
        coreRadius * 0.7
      );
      glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      glassGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.35)');
      glassGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
      glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.arc(midX, midY, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = glassGrad;
      ctx.fill();

      // Curved Specular Lens Reflection Arc at Top Edge
      ctx.beginPath();
      ctx.arc(
        midX - coreRadius * 0.1,
        midY - coreRadius * 0.1,
        coreRadius * 0.82,
        Math.PI * 1.15,
        Math.PI * 1.75
      );
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = coreRadius * 0.08;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Rim Light / Dark Ambient Occlusion Ring at Outer Boundary
      const rimGrad = ctx.createRadialGradient(
        midX,
        midY,
        coreRadius * 0.88,
        midX,
        midY,
        coreRadius
      );
      rimGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      rimGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.3)');
      rimGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.4)');

      ctx.beginPath();
      ctx.arc(midX, midY, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();

      // Pointer spring dampening
      pointerPos.current.x += (pointerPos.current.targetX - pointerPos.current.x) * 0.08;
      pointerPos.current.y += (pointerPos.current.targetY - pointerPos.current.y) * 0.08;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [baseRadius, glowExpansionPx, isEnergized, pulseScale, isHovered, systemMode]);

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
    const duration = 480; // 480ms hold threshold for long press

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
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handlePointerLeave}
      role="button"
      aria-label="Possibilities Central Orb"
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
