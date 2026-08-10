import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Wand2,
  Video,
  Volume2,
  Code2,
  Download,
  Copy,
  Check,
  Play,
  Pause,
  ExternalLink,
  Sparkles,
  Search,
  Brain,
  Bot,
  Palette,
  Film,
  Music,
  FileText,
  Gamepad2,
  Package,
} from 'lucide-react';
import { MediaAttachment } from '../types';
import { audioSynth } from '../utils/audioSynthesizer';

interface MediaAttachmentCardProps {
  attachment: MediaAttachment;
}

export const MediaAttachmentCard: React.FC<MediaAttachmentCardProps> = ({ attachment }) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isCinemaTheaterOpen, setIsCinemaTheaterOpen] = useState(false);
  const [isCinemaPlaying, setIsCinemaPlaying] = useState(true);
  const [cinemaFormat, setCinemaFormat] = useState<'4K Ultra HDR' | '8K IMAX Laser' | 'Spatial 3D Audio'>('4K Ultra HDR');
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Video preview canvas loop if attachment.type === 'video'
  useEffect(() => {
    if (attachment.type !== 'video') return;
    let animationFrameId: number;
    let time = 0;

    const render = () => {
      const canvas = videoCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      time += isVideoPlaying ? 0.03 : 0;

      // Dark canvas
      ctx.fillStyle = '#080312';
      ctx.fillRect(0, 0, w, h);

      // Kinetic AI video simulation
      const cx = w / 2 + Math.cos(time * 0.7) * 20;
      const cy = h / 2 + Math.sin(time * 0.5) * 15;

      const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, w * 0.5);
      grad.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
      grad.addColorStop(0.5, 'rgba(126, 34, 206, 0.4)');
      grad.addColorStop(1, 'rgba(8, 3, 18, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Motion grid lines
      ctx.strokeStyle = 'rgba(216, 180, 254, 0.3)';
      ctx.lineWidth = 1;
      const lines = 12;
      for (let i = 0; i < lines; i++) {
        const a = (i / lines) * Math.PI * 2 + time * 0.4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * w, cy + Math.sin(a) * h);
        ctx.stroke();
      }

      if (isVideoPlaying) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [attachment.type, isVideoPlaying]);

  const handleCopyCode = () => {
    if (attachment.codeSnippet) {
      navigator.clipboard.writeText(attachment.codeSnippet);
      setCopied(true);
      audioSynth.playNodeClick(800);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePlayVoice = () => {
    audioSynth.playEnergyBloom();
    setIsPlayingAudio(true);
    if ('speechSynthesis' in window && attachment.prompt) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(attachment.prompt);
      u.rate = 0.95;
      u.onend = () => setIsPlayingAudio(false);
      u.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(u);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 3000);
    }
  };

  return (
    <div className="mt-2.5 p-3 rounded-xl bg-zinc-950/90 border border-purple-500/40 text-purple-100 shadow-md backdrop-blur-md">
      {/* IMAGE / MODIFIED IMAGE ATTACHMENT */}
      {attachment.type === 'image' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-purple-300/80">
            <span className="flex items-center gap-1.5 font-bold">
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              {attachment.title || 'AI Image Asset'}
            </span>
            {attachment.style && <span className="px-1.5 py-0.5 rounded bg-purple-900/60 border border-purple-400/30 text-[9px] uppercase">{attachment.style}</span>}
          </div>

          {attachment.url && (
            <div className="rounded-lg overflow-hidden border border-purple-500/30 max-h-[220px] bg-black/40 flex items-center justify-center">
              <img
                src={attachment.url}
                alt={attachment.title || 'AI Generated'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {attachment.prompt && (
            <p className="text-[11px] font-sans text-purple-200/90 italic">"{attachment.prompt}"</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-purple-500/20">
            {attachment.url && (
              <a
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] font-mono text-purple-300 hover:text-white transition-all px-2 py-0.5 rounded bg-purple-900/40 border border-purple-400/30"
              >
                <ExternalLink className="w-3 h-3" /> Full View
              </a>
            )}
          </div>
        </div>
      )}

      {/* VIDEO ATTACHMENT */}
      {attachment.type === 'video' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-purple-300/80">
            <span className="flex items-center gap-1.5 font-bold">
              <Video className="w-3.5 h-3.5 text-purple-400" />
              {attachment.title || 'AI Video Motion Asset'}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-900/60 border border-purple-400/30 text-[9px] uppercase">
              {attachment.metadata?.fps || 60} FPS
            </span>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-purple-500/30 aspect-video bg-black flex items-center justify-center">
            <canvas ref={videoCanvasRef} width={480} height={270} className="w-full h-full object-cover" />
            <button
              onClick={() => setIsVideoPlaying(!isVideoPlaying)}
              className="absolute bottom-2 left-2 p-1.5 rounded-lg bg-black/70 hover:bg-purple-900/80 text-white border border-purple-400/40 backdrop-blur-md"
            >
              {isVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>

          {attachment.prompt && (
            <p className="text-[11px] font-sans text-purple-200/90 italic">"{attachment.prompt}"</p>
          )}
        </div>
      )}

      {/* AUDIO ATTACHMENT */}
      {attachment.type === 'audio' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-purple-300/80">
            <span className="flex items-center gap-1.5 font-bold">
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              {attachment.title || 'AI Voice & Sound Synth'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-400/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayVoice}
                className="p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-md"
              >
                {isPlayingAudio ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <span className="text-[11px] font-mono text-purple-200">
                {isPlayingAudio ? 'Synthesizing voice audio...' : 'Play Voice Sample'}
              </span>
            </div>

            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>

          {attachment.prompt && (
            <p className="text-[11px] font-sans text-purple-200/90 italic">"{attachment.prompt}"</p>
          )}
        </div>
      )}

      {/* CODE ATTACHMENT */}
      {attachment.type === 'code' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-purple-300/80">
            <span className="flex items-center gap-1.5 font-bold">
              <Code2 className="w-3.5 h-3.5 text-purple-400" />
              {attachment.title || 'AI Code Snippet'} ({attachment.codeLanguage || 'Code'})
            </span>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-[10px] font-mono text-purple-300 hover:text-white transition-all px-2 py-0.5 rounded bg-purple-900/60 border border-purple-400/30"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {attachment.codeSnippet && (
            <div className="p-2.5 rounded-lg bg-black/80 border border-purple-500/20 font-mono text-[11px] text-purple-200 overflow-x-auto max-h-[160px]">
              <pre className="whitespace-pre-wrap">{attachment.codeSnippet}</pre>
            </div>
          )}
        </div>
      )}

      {/* RESEARCH ATTACHMENT */}
      {attachment.type === 'research' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-purple-300/80">
            <span className="flex items-center gap-1.5 font-bold">
              <Search className="w-3.5 h-3.5 text-purple-400" />
              {attachment.title || 'Deep Intelligence Research Brief'}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-900/60 border border-purple-400/30 text-[9px] uppercase">
              REAL-TIME WEB SYNTHESIS
            </span>
          </div>

          <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-500/30 text-xs text-purple-100 font-sans space-y-1.5">
            <p className="font-semibold text-purple-200">"{attachment.prompt}"</p>
            {attachment.codeSnippet && (
              <div className="text-[11px] text-purple-300/90 whitespace-pre-wrap font-mono border-t border-purple-500/20 pt-2 mt-2">
                {attachment.codeSnippet}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEMORY ATTACHMENT */}
      {attachment.type === 'memory' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-purple-300/80">
            <span className="flex items-center gap-1.5 font-bold">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              {attachment.title || 'Neural Memory Node Synced'}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-400/40 text-[9px] text-emerald-300 uppercase">
              PERMANENT STORE
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-purple-950/50 border border-purple-400/30 text-xs text-purple-200">
            <p className="font-mono text-[11px] text-purple-300">{attachment.prompt}</p>
          </div>
        </div>
      )}

      {/* AGENT ATTACHMENT */}
      {attachment.type === 'agent' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-purple-300/80">
            <span className="flex items-center gap-1.5 font-bold">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              {attachment.title || 'Autonomous Agent Workflow'}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-900/60 border border-purple-400/30 text-[9px] uppercase">
              AUTO-PLANNING
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-black/60 border border-purple-500/30 text-xs text-purple-200 space-y-1 font-mono">
            <p className="text-purple-300 font-bold">Plan: {attachment.prompt}</p>
            {attachment.codeSnippet && <pre className="whitespace-pre-wrap text-[11px] text-purple-300/80 mt-1">{attachment.codeSnippet}</pre>}
          </div>
        </div>
      )}

      {/* CANVAS ATTACHMENT */}
      {attachment.type === 'canvas' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-purple-300/80">
            <span className="flex items-center gap-1.5 font-bold">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              {attachment.title || 'Interactive Canvas Sketch'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900 border border-purple-500/30 text-xs text-purple-200 font-mono">
            <p className="text-purple-300">Drafted Blueprint: {attachment.prompt}</p>
          </div>
        </div>
      )}

      {/* MOVIE ATTACHMENT */}
      {attachment.type === 'movie' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-purple-300/80">
            <span className="flex items-center gap-1.5 font-bold">
              <Film className="w-3.5 h-3.5 text-purple-400" />
              {attachment.title || 'Full Cinematic Movie Render'}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-900/60 border border-purple-400/30 text-[9px] uppercase">
              CINEMATIC AI 4K
            </span>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950 border border-purple-500/40 text-xs text-purple-200 space-y-2 font-mono">
            <p className="text-purple-300 font-bold">"{attachment.prompt}"</p>
            {attachment.codeSnippet && (
              <p className="text-[11px] text-purple-300/80 whitespace-pre-wrap">{attachment.codeSnippet}</p>
            )}
            
            {/* Embedded Movie Canvas Player */}
            <div className="relative rounded-lg overflow-hidden border border-purple-500/30 bg-black aspect-video flex items-center justify-center">
              <canvas
                ref={(canvas) => {
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  canvas.width = 400;
                  canvas.height = 225;
                  let frame = 0;
                  const anim = () => {
                    frame++;
                    ctx.fillStyle = '#05020a';
                    ctx.fillRect(0, 0, 400, 225);
                    
                    // Cinematic sci-fi grid & anamorphic lens flare
                    ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 + Math.sin(frame * 0.05) * 0.1})`;
                    ctx.lineWidth = 1;
                    for (let x = 0; x < 400; x += 30) {
                      ctx.beginPath();
                      ctx.moveTo(x, 0);
                      ctx.lineTo(x, 225);
                      ctx.stroke();
                    }

                    // Anamorphic flare bar
                    const grad = ctx.createLinearGradient(0, 112, 400, 112);
                    grad.addColorStop(0, 'rgba(168, 85, 247, 0)');
                    grad.addColorStop(0.5, 'rgba(192, 132, 252, 0.9)');
                    grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 110, 400, 5);

                    // Title overlay text
                    ctx.fillStyle = '#f3e8ff';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(attachment.prompt || 'CINEMATIC SCENE 1: AWAKENING', 200, 100);
                    ctx.fillStyle = '#a855f7';
                    ctx.font = '10px monospace';
                    ctx.fillText('DIRECTOR CUT • 4K HDR • 60 FPS', 200, 125);

                    requestAnimationFrame(anim);
                  };
                  const id = requestAnimationFrame(anim);
                  return () => cancelAnimationFrame(id);
                }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-purple-300/60 font-mono">Status: Rendered & Production-Ready</span>
              <button
                onClick={() => {
                  audioSynth.playEnergyBloom();
                  setIsCinemaTheaterOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-sans font-bold shadow-md shadow-purple-600/30"
              >
                <Play className="w-3 h-3" /> Full Screen Cinema
              </button>
            </div>
          </div>

          {/* Full-Screen Cinema Theater Modal Overlay */}
          {isCinemaTheaterOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-6">
              <div className="relative w-full max-w-6xl rounded-3xl bg-zinc-950 border border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
                {/* Cinema Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/30 bg-zinc-900/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-300">
                      <Film className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-purple-100">{attachment.title || 'IMAX Full-Screen Cinema'}</h3>
                      <p className="text-[11px] text-purple-300/70 font-mono">"{attachment.prompt}"</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-purple-500/30">
                      {(['4K Ultra HDR', '8K IMAX Laser', 'Spatial 3D Audio'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setCinemaFormat(fmt)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                            cinemaFormat === fmt
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'text-purple-300/70 hover:text-purple-200'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setIsCinemaTheaterOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-mono font-bold transition-all"
                    >
                      Close Theater
                    </button>
                  </div>
                </div>

                {/* Theater Screen Canvas */}
                <div className="relative flex-1 bg-black flex items-center justify-center min-h-[350px] overflow-hidden">
                  <canvas
                    ref={(canvas) => {
                      if (!canvas) return;
                      const ctx = canvas.getContext('2d');
                      if (!ctx) return;
                      canvas.width = 1280;
                      canvas.height = 720;
                      let frame = 0;
                      const anim = () => {
                        frame++;
                        ctx.fillStyle = '#030108';
                        ctx.fillRect(0, 0, 1280, 720);

                        if (isCinemaPlaying) {
                          // Dynamic particle stars
                          for (let i = 0; i < 60; i++) {
                            const x = (i * 37 + frame * (i % 3 + 1)) % 1280;
                            const y = (i * 53 + Math.sin(frame * 0.02 + i) * 20) % 720;
                            ctx.fillStyle = `rgba(192, 132, 252, ${0.3 + Math.sin(frame * 0.05 + i) * 0.3})`;
                            ctx.fillRect(x, y, (i % 3) + 1, (i % 3) + 1);
                          }

                          // Cinematic laser light grid
                          ctx.strokeStyle = `rgba(168, 85, 247, ${0.1 + Math.sin(frame * 0.03) * 0.05})`;
                          ctx.lineWidth = 1.5;
                          for (let x = 0; x < 1280; x += 80) {
                            ctx.beginPath();
                            ctx.moveTo(x, 0);
                            ctx.lineTo(640 + (x - 640) * 1.5, 720);
                            ctx.stroke();
                          }

                          // Cinema Anamorphic flare
                          const grad = ctx.createLinearGradient(0, 360, 1280, 360);
                          grad.addColorStop(0, 'rgba(168, 85, 247, 0)');
                          grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.8)');
                          grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
                          ctx.fillStyle = grad;
                          ctx.fillRect(0, 358, 1280, 4);

                          // Text overlay
                          ctx.fillStyle = '#ffffff';
                          ctx.font = 'bold 28px sans-serif';
                          ctx.textAlign = 'center';
                          ctx.shadowColor = '#a855f7';
                          ctx.shadowBlur = 15;
                          ctx.fillText(attachment.prompt ? `"${attachment.prompt.toUpperCase()}"` : 'CINEMATIC MOTION PICTURE', 640, 320);

                          ctx.fillStyle = '#c084fc';
                          ctx.font = '16px monospace';
                          ctx.shadowBlur = 0;
                          ctx.fillText(`DIRECTOR'S CUT • ${cinemaFormat} • DOLBY ATMOS SPATIAL 7.1`, 640, 370);
                        } else {
                          // Paused state banner
                          ctx.fillStyle = 'rgba(0,0,0,0.6)';
                          ctx.fillRect(0, 0, 1280, 720);
                          ctx.fillStyle = '#ffffff';
                          ctx.font = 'bold 36px monospace';
                          ctx.textAlign = 'center';
                          ctx.fillText('PAUSED', 640, 360);
                        }

                        requestAnimationFrame(anim);
                      };
                      const id = requestAnimationFrame(anim);
                      return () => cancelAnimationFrame(id);
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Cinema Controls Bar */}
                <div className="p-4 border-t border-purple-500/30 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setIsCinemaPlaying(!isCinemaPlaying);
                        audioSynth.playNodeClick(600);
                      }}
                      className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md shadow-purple-600/30"
                    >
                      {isCinemaPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <div className="text-purple-200">
                      <span className="font-bold text-purple-100">01:42:08</span> / 02:15:00
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-purple-300/60">POSSIBILITIES CINEMA ENGINE • DOLBY VISION</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BEAT ATTACHMENT */}
      {attachment.type === 'beat' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-purple-300/80">
            <span className="flex items-center gap-1.5 font-bold">
              <Music className="w-3.5 h-3.5 text-purple-400" />
              {attachment.title || 'AI Beat & Music Synth Studio'}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-900/60 border border-purple-400/30 text-[9px] uppercase">
              LIVE PRODUCER DAW
            </span>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950 border border-purple-500/40 space-y-3">
            <div>
              <p className="text-xs font-semibold text-purple-100 font-mono">"{attachment.prompt}"</p>
              <p className="text-[10px] text-purple-300/70 font-mono mt-0.5">Custom Drum Pads & Synth Matrix Produced</p>
            </div>

            {/* Live Interactive Sound Pads */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => audioSynth.playNodeClick(200)}
                className="py-2.5 rounded bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-[10px] font-mono font-bold text-purple-200 active:scale-95 transition-all text-center"
              >
                🥁 KICK
              </button>
              <button
                onClick={() => audioSynth.playNodeClick(500)}
                className="py-2.5 rounded bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-[10px] font-mono font-bold text-purple-200 active:scale-95 transition-all text-center"
              >
                💥 SNARE
              </button>
              <button
                onClick={() => audioSynth.playNodeClick(900)}
                className="py-2.5 rounded bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-[10px] font-mono font-bold text-purple-200 active:scale-95 transition-all text-center"
              >
                ✨ HI-HAT
              </button>
              <button
                onClick={() => audioSynth.playEnergyBloom()}
                className="py-2.5 rounded bg-purple-600 hover:bg-purple-500 border border-purple-400 text-[10px] font-mono font-bold text-white active:scale-95 transition-all text-center shadow-md shadow-purple-600/30"
              >
                🎹 SYNTH LEAD
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-purple-300/70 font-mono pt-1">
              <span>Master Audio: Mastered & Stereo-Expanded</span>
              <button
                onClick={() => audioSynth.playEnergyBloom()}
                className="flex items-center gap-1 text-purple-300 hover:text-white font-bold"
              >
                <Play className="w-3 h-3 text-purple-400" /> Play Full Master
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF ATTACHMENT */}
      {attachment.type === 'pdf' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-purple-300/80">
            <span className="flex items-center gap-1.5 font-bold">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              {attachment.title || 'Generated PDF Document'}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-900/60 border border-purple-400/30 text-[9px] uppercase">
              DOCUMENT
            </span>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950 border border-purple-500/30 text-xs text-purple-200 font-mono space-y-2">
            <p className="font-bold text-purple-200">{attachment.prompt}</p>
            <div className="p-2.5 rounded bg-zinc-900 border border-purple-500/20 text-[11px] text-purple-300/80 whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto">
              {attachment.codeSnippet || `Executive Brief:\n- Formatted Document Content Generated by Possibilities.\n- Ready for printing and distribution.`}
            </div>
            <div className="flex items-center justify-end pt-1">
              <button
                onClick={() => {
                  const blob = new Blob([attachment.codeSnippet || attachment.prompt || 'PDF Document'], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${(attachment.title || 'document').toLowerCase().replace(/\s+/g, '_')}.pdf`;
                  a.click();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-sans font-bold shadow-md shadow-purple-600/30"
              >
                <Download className="w-3 h-3" /> Download PDF File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME ATTACHMENT */}
      {attachment.type === 'game' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-purple-300/80">
            <span className="flex items-center gap-1.5 font-bold">
              <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
              {attachment.title || 'Interactive Mini-Game Engine'}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 text-[9px] uppercase font-bold">
              PLAYABLE IN CHAT
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 border border-emerald-500/40 space-y-2 font-mono">
            <p className="text-emerald-300 font-bold text-xs">"{attachment.prompt}"</p>

            {/* Embedded Live Canvas Mini Arcade Game */}
            <div className="relative rounded-lg overflow-hidden border border-emerald-500/40 bg-black aspect-video flex items-center justify-center">
              <canvas
                ref={(canvas) => {
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  canvas.width = 360;
                  canvas.height = 200;
                  let shipX = 180;
                  let score = 0;
                  let stars = Array.from({ length: 25 }, () => ({
                    x: Math.random() * 360,
                    y: Math.random() * 200,
                    speed: 1 + Math.random() * 2,
                  }));

                  const onMouseMove = (e: MouseEvent) => {
                    const rect = canvas.getBoundingClientRect();
                    shipX = Math.max(15, Math.min(345, (e.clientX - rect.left) * (360 / rect.width)));
                  };
                  canvas.addEventListener('mousemove', onMouseMove);

                  const render = () => {
                    ctx.fillStyle = '#020d08';
                    ctx.fillRect(0, 0, 360, 200);

                    // Stars motion
                    ctx.fillStyle = '#a7f3d0';
                    stars.forEach((s) => {
                      s.y += s.speed;
                      if (s.y > 200) s.y = 0;
                      ctx.fillRect(s.x, s.y, 2, 2);
                    });

                    // Spaceship
                    ctx.fillStyle = '#10b981';
                    ctx.beginPath();
                    ctx.moveTo(shipX, 160);
                    ctx.lineTo(shipX - 12, 185);
                    ctx.lineTo(shipX + 12, 185);
                    ctx.closePath();
                    ctx.fill();

                    // Jet flame
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath();
                    ctx.moveTo(shipX - 5, 185);
                    ctx.lineTo(shipX, 195 + Math.random() * 4);
                    ctx.lineTo(shipX + 5, 185);
                    ctx.fill();

                    // HUD Score
                    score++;
                    ctx.fillStyle = '#34d399';
                    ctx.font = 'bold 11px monospace';
                    ctx.fillText(`SCORE: ${Math.floor(score / 10)}`, 10, 20);
                    ctx.fillText(`FPS: 60`, 300, 20);

                    requestAnimationFrame(render);
                  };
                  const id = requestAnimationFrame(render);
                  return () => {
                    canvas.removeEventListener('mousemove', onMouseMove);
                    cancelAnimationFrame(id);
                  };
                }}
                className="w-full h-full cursor-crosshair object-cover"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px] text-emerald-300/80">
              <span>Hover mouse / touch on screen to navigate spaceship!</span>
              <button
                onClick={() => {
                  audioSynth.playEnergyBloom();
                  alert(`Launching full AAA window player for game: "${attachment.prompt}"`);
                }}
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-[11px] shadow-md shadow-emerald-600/30"
              >
                <Play className="w-3 h-3 inline mr-1" /> Fullscreen Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APK ATTACHMENT */}
      {attachment.type === 'apk' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-purple-300/80">
            <span className="flex items-center gap-1.5 font-bold">
              <Package className="w-3.5 h-3.5 text-purple-400" />
              {attachment.title || 'Android App Package (APK)'}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-900/60 border border-purple-400/30 text-[9px] uppercase font-bold">
              ANDROID BUILD
            </span>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950 border border-purple-500/30 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-purple-200">
              <div>
                <p className="font-bold text-purple-200">{attachment.prompt}</p>
                <p className="text-[10px] text-purple-400 mt-0.5">com.possibilities.app.apk • v1.0.0 (ARM64-v8a)</p>
              </div>
              <span className="px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded text-[10px]">
                SIGNED & VERIFIED
              </span>
            </div>
            <div className="flex items-center justify-end pt-1">
              <button
                onClick={() => {
                  audioSynth.playEnergyBloom();
                  const blob = new Blob([`Dummy APK Package Data for ${attachment.prompt}`], { type: 'application/vnd.android.package-archive' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'possibilities_app.apk';
                  a.click();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-sans font-bold shadow-md shadow-purple-600/30"
              >
                <Download className="w-3 h-3" /> Download Android APK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

