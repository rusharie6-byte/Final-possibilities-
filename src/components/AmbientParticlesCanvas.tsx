import React, { useEffect, useRef, useState } from 'react';
import { perfManager } from '../utils/performance';

interface AmbientParticlesCanvasProps {
  systemMode?: string;
  isEnergized?: boolean;
}

export const AmbientParticlesCanvas: React.FC<AmbientParticlesCanvasProps> = ({
  systemMode,
  isEnergized = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerPos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [effectiveMode, setEffectiveMode] = useState<'high' | 'low'>(perfManager.getEffectiveMode());

  useEffect(() => {
    const unsubscribe = perfManager.subscribe(() => {
      setEffectiveMode(perfManager.getEffectiveMode());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number | null = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const particleCount = effectiveMode === 'low' ? 14 : 32;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * (isEnergized ? 0.45 : 0.2),
      vy: (Math.random() - 0.5) * (isEnergized ? 0.45 : 0.2),
      depth: Math.random() * 0.8 + 0.2,
      alpha: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.5 ? '#A855F7' : '#C084FC',
    }));

    const handleMouseMove = (e: MouseEvent) => {
      pointerPos.current.targetX = (e.clientX - width / 2) * 0.025;
      pointerPos.current.targetY = (e.clientY - height / 2) * 0.025;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      pointerPos.current.x += (pointerPos.current.targetX - pointerPos.current.x) * 0.05;
      pointerPos.current.y += (pointerPos.current.targetY - pointerPos.current.y) * 0.05;

      const px = pointerPos.current.x;
      const py = pointerPos.current.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        const drawX = p.x + px * p.depth;
        const drawY = p.y + py * p.depth;

        // Core particle point
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.size * p.depth, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [effectiveMode, isEnergized]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 block w-full h-full opacity-60"
    />
  );
};

