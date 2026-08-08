import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Zap, RefreshCw, Trophy, ShieldCheck, ChevronRight, Activity } from 'lucide-react';
import { audioSynth } from '../utils/audioSynthesizer';
import { perfManager } from '../utils/performance';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface EnemyFragment {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  speed: number;
  type: 'spike' | 'disruptor' | 'seeker';
  hp: number;
  maxHp: number;
  angle: number;
}

interface LaserPulse {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  life: number;
}

export const OrbDefenseView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [coreHealth, setCoreHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [fragmentsNeutralized, setFragmentsNeutralized] = useState(0);
  const [gameState, setGameState] = useState<'PLAYING' | 'VICTORY' | 'GAMEOVER'>('PLAYING');
  const [timeRemaining, setTimeRemaining] = useState(90); // 90 second rapid defense session

  // Mouse / Touch aiming
  const mousePos = useRef({ x: 300, y: 300 });
  const shieldAngle = useRef(0);

  // Audio trigger throttling
  const lastAudioTime = useRef(0);

  // Start / Reset Session
  const handleRestart = () => {
    setCoreHealth(100);
    setScore(0);
    setWave(1);
    setFragmentsNeutralized(0);
    setTimeRemaining(90);
    setGameState('PLAYING');
    audioSynth.playNodeClick(880);
    audioSynth.triggerHaptic([30, 20, 30]);
  };

  // 60fps Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    let nextEnemyId = 1;

    let localCoreHealth = coreHealth;
    let localScore = score;
    let localNeutralized = fragmentsNeutralized;
    let localGameState = gameState;

    const coreRadius = 38;
    const shieldDistance = 75;
    const shieldArcWidth = Math.PI * 0.45; // ~80 degrees protective arc

    const enemies: EnemyFragment[] = [];
    const lasers: LaserPulse[] = [];
    const particles: Particle[] = [];

    // Helper to add explosion burst
    const addExplosion = (x: number, y: number, color: string, count = 16) => {
      const isHigh = perfManager.getEffectiveMode() === 'high';
      const actualCount = isHigh ? count : Math.min(6, count);
      for (let i = 0; i < actualCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.5 + 1;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 2.5 + 1,
          color,
          alpha: 1.0,
          life: 0,
          maxLife: 20 + Math.random() * 15,
        });
      }
    };

    // Enemy Spawner
    let spawnCounter = 0;

    const render = () => {
      if (!canvas || !ctx) return;
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }
      time += 0.02;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Update Shield Aiming Angle towards pointer
      const dx = mousePos.current.x - centerX;
      const dy = mousePos.current.y - centerY;
      const targetAngle = Math.atan2(dy, dx);

      // Smooth interpolation for fluid shield feel
      let angleDiff = targetAngle - shieldAngle.current;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      shieldAngle.current += angleDiff * 0.25;

      // Clear Canvas with subtle deep spatial clear
      ctx.fillStyle = 'rgba(3, 0, 8, 0.35)';
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Spatial Tactical Grid Lines
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, shieldDistance, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, shieldDistance * 1.8, 0, Math.PI * 2);
      ctx.stroke();

      if (localGameState === 'PLAYING') {
        // Spawn Enemies
        spawnCounter++;
        const spawnInterval = Math.max(25, 60 - wave * 6);
        if (spawnCounter > spawnInterval) {
          spawnCounter = 0;
          const spawnAngle = Math.random() * Math.PI * 2;
          const spawnDist = Math.max(width, height) * 0.6;
          const ex = centerX + Math.cos(spawnAngle) * spawnDist;
          const ey = centerY + Math.sin(spawnAngle) * spawnDist;

          const toCoreAngle = Math.atan2(centerY - ey, centerX - ex);
          const enemyType: EnemyFragment['type'] =
            Math.random() > 0.7 ? 'disruptor' : Math.random() > 0.4 ? 'seeker' : 'spike';

          const speed =
            enemyType === 'seeker' ? 2.2 + wave * 0.2 : enemyType === 'disruptor' ? 1.2 + wave * 0.1 : 1.8 + wave * 0.15;

          enemies.push({
            id: nextEnemyId++,
            x: ex,
            y: ey,
            vx: Math.cos(toCoreAngle) * speed,
            vy: Math.sin(toCoreAngle) * speed,
            size: enemyType === 'disruptor' ? 12 : enemyType === 'seeker' ? 8 : 10,
            speed,
            type: enemyType,
            hp: enemyType === 'disruptor' ? 3 : 1,
            maxHp: enemyType === 'disruptor' ? 3 : 1,
            angle: toCoreAngle,
          });
        }

        // 2. Update and Draw Lasers
        for (let i = lasers.length - 1; i >= 0; i--) {
          const l = lasers[i];
          l.x += l.vx;
          l.y += l.vy;
          l.life++;

          ctx.beginPath();
          ctx.arc(l.x, l.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#C084FC';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Hit Test Lasers against Enemies
          for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const edx = e.x - l.x;
            const edy = e.y - l.y;
            const dist = Math.sqrt(edx * edx + edy * edy);

            if (dist < e.size + 4) {
              e.hp--;
              lasers.splice(i, 1);
              addExplosion(e.x, e.y, '#C084FC', 8);

              if (e.hp <= 0) {
                enemies.splice(j, 1);
                addExplosion(e.x, e.y, '#EC4899', 20);
                localScore += e.maxHp * 150;
                localNeutralized++;
                setScore(localScore);
                setFragmentsNeutralized(localNeutralized);

                const now = Date.now();
                if (now - lastAudioTime.current > 80) {
                  audioSynth.playNodeClick(1200);
                  audioSynth.triggerHaptic([10]);
                  lastAudioTime.current = now;
                }
              }
              break;
            }
          }

          if (l.life > 40) {
            lasers.splice(i, 1);
          }
        }

        // 3. Update and Draw Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          e.x += e.vx;
          e.y += e.vy;

          const edx = centerX - e.x;
          const edy = centerY - e.y;
          const distToCenter = Math.sqrt(edx * edx + edy * edy);
          const currentAngleToCenter = Math.atan2(e.y - centerY, e.x - centerX);

          // Test Shield Deflection Collision
          if (distToCenter <= shieldDistance + 8 && distToCenter >= shieldDistance - 10) {
            let diff = currentAngleToCenter - shieldAngle.current;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;

            if (Math.abs(diff) <= shieldArcWidth / 2) {
              // Shield Deflection Success!
              enemies.splice(i, 1);
              addExplosion(e.x, e.y, '#38BDF8', 22);
              localScore += 100;
              localNeutralized++;
              setScore(localScore);
              setFragmentsNeutralized(localNeutralized);

              const now = Date.now();
              if (now - lastAudioTime.current > 80) {
                audioSynth.playNodeClick(600);
                audioSynth.triggerHaptic([20, 20]);
                lastAudioTime.current = now;
              }
              continue;
            }
          }

          // Test Core Impact
          if (distToCenter <= coreRadius + e.size) {
            enemies.splice(i, 1);
            addExplosion(e.x, e.y, '#F43F5E', 30);
            localCoreHealth = Math.max(0, localCoreHealth - (e.type === 'disruptor' ? 25 : 12));
            setCoreHealth(localCoreHealth);

            audioSynth.playNodeClick(220);
            audioSynth.triggerHaptic([50, 50, 50]);

            if (localCoreHealth <= 0) {
              localGameState = 'GAMEOVER';
              setGameState('GAMEOVER');
            }
            continue;
          }

          // Render Enemy Fragment Body
          ctx.save();
          ctx.translate(e.x, e.y);
          ctx.rotate(time * 3 + e.id);

          ctx.beginPath();
          if (e.type === 'disruptor') {
            ctx.rect(-e.size, -e.size, e.size * 2, e.size * 2);
            ctx.fillStyle = '#F43F5E';
          } else if (e.type === 'seeker') {
            ctx.arc(0, 0, e.size, 0, Math.PI * 2);
            ctx.fillStyle = '#E879F9';
          } else {
            ctx.moveTo(0, -e.size * 1.3);
            ctx.lineTo(e.size, e.size);
            ctx.lineTo(-e.size, e.size);
            ctx.closePath();
            ctx.fillStyle = '#A855F7';
          }

          ctx.shadowColor = e.type === 'disruptor' ? '#F43F5E' : '#C084FC';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.restore();
        }
      }

      // 4. Draw Defensive Shield Arc Around Core
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        shieldDistance,
        shieldAngle.current - shieldArcWidth / 2,
        shieldAngle.current + shieldArcWidth / 2
      );
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 20;
      ctx.stroke();

      // Inner Shield Sheen Accent Arc
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        shieldDistance - 3,
        shieldAngle.current - shieldArcWidth / 2 + 0.1,
        shieldAngle.current + shieldArcWidth / 2 - 0.1
      );
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // 5. Draw Central Living Orb Core
      const corePulse = 1 + Math.sin(time * 3) * 0.05;
      const currentCoreRadius = coreRadius * corePulse;

      const coreGrad = ctx.createRadialGradient(
        centerX - currentCoreRadius * 0.3,
        centerY - currentCoreRadius * 0.3,
        2,
        centerX,
        centerY,
        currentCoreRadius
      );
      coreGrad.addColorStop(0, '#FFFFFF');
      coreGrad.addColorStop(0.3, '#C084FC');
      coreGrad.addColorStop(0.7, '#A855F7');
      coreGrad.addColorStop(1, '#3B0764');

      ctx.beginPath();
      ctx.arc(centerX, centerY, currentCoreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = '#A855F7';
      ctx.shadowBlur = 30;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Specular Glass Lens Reflection Arc
      ctx.beginPath();
      ctx.arc(
        centerX - currentCoreRadius * 0.1,
        centerY - currentCoreRadius * 0.1,
        currentCoreRadius * 0.8,
        Math.PI * 1.1,
        Math.PI * 1.7
      );
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 6. Update and Render Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    // Firing Lasers on Canvas Pointer Click
    const handleCanvasClick = (e: MouseEvent) => {
      if (localGameState !== 'PLAYING') return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const angle = Math.atan2(clickY - centerY, clickX - centerX);
      const speed = 12;

      lasers.push({
        x: centerX + Math.cos(angle) * (coreRadius + 10),
        y: centerY + Math.sin(angle) * (coreRadius + 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle,
        life: 0,
      });

      audioSynth.playNodeClick(1100);
      audioSynth.triggerHaptic([8]);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleMouseMove);

    render();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [wave, gameState]);

  // Session Timer Countdown
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setGameState('VICTORY');
          audioSynth.playNodeClick(1320);
          audioSynth.triggerHaptic([30, 50, 30, 50]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 flex flex-col items-center justify-center min-h-[82vh] relative select-text">
      {/* Session Diagnostics Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-4 px-6 py-3 rounded-2xl bg-black/80 border border-white/15 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)]">
        {/* Core Shield Meter */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-400/30 text-purple-300">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-purple-300 uppercase">CORE INTEGRITY</span>
            <div className="flex items-center gap-2">
              <div className="w-28 bg-black/80 h-2 rounded-full overflow-hidden border border-white/10">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    coreHealth > 50
                      ? 'bg-gradient-to-r from-purple-500 to-emerald-400 shadow-[0_0_10px_#34D399]'
                      : coreHealth > 25
                      ? 'bg-gradient-to-r from-amber-500 to-purple-500 shadow-[0_0_10px_#F59E0B]'
                      : 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_#F43F5E]'
                  }`}
                  style={{ width: `${coreHealth}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-white">{coreHealth}%</span>
            </div>
          </div>
        </div>

        {/* Score & Timer */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold tracking-widest text-purple-300 uppercase">NEUTRALIZED</span>
            <span className="text-sm font-mono font-black text-white">{score} XP</span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold tracking-widest text-purple-300 uppercase">TIME REMAINING</span>
            <span className="text-sm font-mono font-black text-purple-200">{timeRemaining}s</span>
          </div>
        </div>
      </div>

      {/* Main 60fps Interactive Arcade Canvas */}
      <div className="relative rounded-3xl overflow-hidden border border-white/20 bg-black/90 shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-2xl">
        <canvas
          ref={canvasRef}
          width={640}
          height={420}
          className="cursor-crosshair block max-w-full h-auto"
        />

        {/* Instructions Banner */}
        <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none">
          <span className="text-[10px] font-semibold tracking-widest text-purple-200/80 uppercase px-4 py-1 rounded-full bg-black/70 border border-purple-500/30 backdrop-blur-md">
            AIM SHIELD WITH POINTER • CLICK TO DISINTEGRATE ENTROPY
          </span>
        </div>

        {/* Overlays for Game Over / Victory */}
        <AnimatePresence>
          {gameState === 'VICTORY' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center z-30"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(52,211,153,0.5)]">
                <ShieldCheck className="w-8 h-8 text-emerald-300" />
              </div>
              <h2 className="text-2xl font-black tracking-[0.2em] text-white uppercase mb-1">
                CORE SECURED
              </h2>
              <p className="text-xs text-purple-200/80 max-w-sm mb-6">
                All incoming entropy fragments have been successfully neutralized. System resonance returned to peak harmony.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6 w-full max-w-xs font-mono">
                <div className="p-3 rounded-xl bg-purple-950/40 border border-white/10 text-center">
                  <div className="text-[10px] text-purple-300">FRAGMENTS</div>
                  <div className="text-lg font-bold text-white">{fragmentsNeutralized}</div>
                </div>
                <div className="p-3 rounded-xl bg-purple-950/40 border border-white/10 text-center">
                  <div className="text-[10px] text-purple-300">SCORE</div>
                  <div className="text-lg font-bold text-emerald-300">{score}</div>
                </div>
              </div>

              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-xs font-bold tracking-widest text-white uppercase transition-all shadow-[0_0_25px_#A855F7,inset_0_1px_1px_rgba(255,255,255,0.4)]"
              >
                <RefreshCw className="w-4 h-4" /> RE-ENGAGE DEFENSE
              </button>
            </motion.div>
          )}

          {gameState === 'GAMEOVER' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center z-30"
            >
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(244,63,94,0.5)]">
                <Activity className="w-8 h-8 text-rose-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black tracking-[0.2em] text-rose-200 uppercase mb-1">
                CORE BREACHED
              </h2>
              <p className="text-xs text-purple-200/80 max-w-sm mb-6">
                Entropy overload breached the defensive perimeter. Initiate core restoration protocol.
              </p>

              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-xs font-bold tracking-widest text-white uppercase transition-all shadow-[0_0_25px_#F43F5E,inset_0_1px_1px_rgba(255,255,255,0.4)]"
              >
                <RefreshCw className="w-4 h-4" /> RESTORE CORE
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
