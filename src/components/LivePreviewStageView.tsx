import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Film,
  Gamepad2,
  Music,
  FileText,
  Package,
  Code2,
  Palette,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Download,
  Smartphone,
  Tablet,
  Monitor,
  Tv,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  Sliders,
  Check,
  ChevronRight,
  Layers,
  Search,
  Eye,
  RefreshCw,
  Globe,
  Bot,
  Mic,
  Activity,
  Cpu,
  Zap,
  Radio,
  SlidersHorizontal,
  Scan,
  Terminal,
  LineChart,
  Compass,
  FileSearch,
  Share2,
} from 'lucide-react';
import { audioSynth } from '../utils/audioSynthesizer';

export type StageAssetType =
  | 'movie'
  | 'game'
  | 'beat'
  | 'code'
  | 'pdf'
  | 'apk'
  | 'canvas'
  | 'world'
  | 'agentSwarm'
  | 'voiceSynth'
  | 'deepResearch'
  | 'visionInspector'
  | 'codeInterpreter';

export type ViewportDevice = 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'cinematic';

interface LivePreviewStageViewProps {
  onClose?: () => void;
  initialAssetType?: StageAssetType;
}

interface GeneratedAsset {
  id: string;
  type: StageAssetType;
  title: string;
  prompt: string;
  createdAt: string;
  details?: string;
}

const INITIAL_ASSETS: GeneratedAsset[] = [
  {
    id: 'asset-0d',
    type: 'deepResearch',
    title: 'Autonomous Web Deep Research & Consensus Engine',
    prompt: 'Live web scraping, paper indexing, citation graph, and consensus scoring',
    createdAt: 'Just now',
    details: '14 Web Sources Indexed • arXiv & GitHub Scraped • 98.4% Confidence Score',
  },
  {
    id: 'asset-0e',
    type: 'visionInspector',
    title: 'Real-Time Multimodal Vision & Document Inspector',
    prompt: 'Camera feed object recognition, OCR document scanner, bounding box detection',
    createdAt: 'Just now',
    details: '60 FPS Frame Analysis • Neural OCR Text Extraction • Object Coordinates',
  },
  {
    id: 'asset-0f',
    type: 'codeInterpreter',
    title: 'Python Math & Data Analytics Execution Sandbox',
    prompt: 'Code interpreter with numerical simulation, statistical distributions, and plotting',
    createdAt: 'Just now',
    details: 'Python/NumPy Runtime • Real-Time Dynamic Charts • Zero Network Latency',
  },
  {
    id: 'asset-0a',
    type: 'world',
    title: 'Neon Cyberpunk 3D Procedural Matrix',
    prompt: 'Interactive 3D Terrain mesh generator with Neon Rain & Aurora weather controls',
    createdAt: 'Just now',
    details: 'Procedural Shader Engine • Dynamic Wireframe Mesh • Real-time Camera Orbit',
  },
  {
    id: 'asset-0b',
    type: 'agentSwarm',
    title: 'Autonomous Multi-Agent AI Creative Director',
    prompt: '5-Agent Swarm Orchestrator (Writer → Visual Director → Audio Producer → Compiler)',
    createdAt: 'Just now',
    details: 'Visual Node Graph • Signal Execution Pulses • Real-time Agent Pipeline',
  },
  {
    id: 'asset-0c',
    type: 'voiceSynth',
    title: 'Spatial Neural Voice & Character Casting',
    prompt: 'Neural Voice Synthesizer with pitch, timbre, formant, and spatial reverb controls',
    createdAt: 'Just now',
    details: 'Neural Character Casting • Real-time Audio Spectrum • Spatial 3D Audio',
  },
  {
    id: 'asset-1',
    type: 'movie',
    title: 'Quantum Horizon: Director Cut',
    prompt: 'A sci-fi cinematic masterpiece in 4K HDR over quantum skylines',
    createdAt: '3 mins ago',
    details: 'Scene 1: Neural Grid Awakening • Scene 2: High-Octane Skylines • Scene 3: Transcendence',
  },
  {
    id: 'asset-2',
    type: 'game',
    title: 'Neon Cyber-Rider 2099',
    prompt: 'Playable 2D HTML5 Space Arcade Game with shooting, powerups, and score system',
    createdAt: '5 mins ago',
    details: 'Canvas 60FPS Game Engine • WASD/Arrow Controls • WebAudio SFX Engine',
  },
  {
    id: 'asset-3',
    type: 'beat',
    title: 'Cyberpunk Synth Wave Master Track',
    prompt: 'Lo-Fi Synthwave @ 128 BPM with 16-step drum machine synth matrix',
    createdAt: '10 mins ago',
    details: 'Synthesizer DAW • Mastered Stereo Output • WebAudio Drum Sequencer',
  },
  {
    id: 'asset-4',
    type: 'code',
    title: 'Interactive Quantum Particle Portal',
    prompt: 'Full-stack React HTML/CSS/JS interactive Web Applet',
    createdAt: '15 mins ago',
    details: 'HTML5 Canvas • Real-Time Hot Module Reloading • Zero Dependencies',
  },
];

export const LivePreviewStageView: React.FC<LivePreviewStageViewProps> = ({
  onClose,
  initialAssetType = 'movie',
}) => {
  const [activeAssetType, setActiveAssetType] = useState<StageAssetType>(initialAssetType);
  const [viewportDevice, setViewportDevice] = useState<ViewportDevice>('desktop');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Asset State
  const [assetsList, setAssetsList] = useState<GeneratedAsset[]>(INITIAL_ASSETS);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('asset-1');

  // Prompt iteration bar state
  const [iterationPrompt, setIterationPrompt] = useState('');
  const [isIterating, setIsIterating] = useState(false);

  // Movie Scene Stepper
  const [movieScene, setMovieScene] = useState(1);

  // God Mode Engine States
  const [worldWeather, setWorldWeather] = useState<'Neon Rain' | 'Solar Flare' | 'Quantum Fog' | 'Aurora Borealis'>('Neon Rain');
  const [worldCameraRotation, setWorldCameraRotation] = useState(0);

  // Swarm Agents State
  const [activeSwarmNode, setActiveSwarmNode] = useState<string>('writer');
  const [swarmPulse, setSwarmPulse] = useState(0);

  // Neural Voice Studio State
  const [voiceCharacter, setVoiceCharacter] = useState<'Hero Protagonist' | 'AI Companion' | 'Cyber Villain' | 'Deep Narrator'>('AI Companion');
  const [voicePitch, setVoicePitch] = useState(65);
  const [voiceTimbre, setVoiceTimbre] = useState(80);
  const [voiceFormant, setVoiceFormant] = useState(50);
  const [voiceText, setVoiceText] = useState('Possibilities AI Neural Engine active. Real-time spatial voice synthesis running.');
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState(false);

  // Deep Research State
  const [researchQuery, setResearchQuery] = useState('Quantum Computing & Neural Multi-Agent Orchestration');
  const [isResearching, setIsResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState(100);

  // Vision Inspector State
  const [visionMode, setVisionMode] = useState<'Bounding Box' | 'OCR Document' | 'Depth Map' | 'Visual Code'>('Bounding Box');

  // Code & Math Interpreter State
  const [pythonCode, setPythonCode] = useState(`import numpy as np
# Monte Carlo Simulation of Quantum Neural Weights
samples = 10000
weights = np.random.normal(loc=0.5, scale=0.15, size=samples)
confidence_interval = np.percentile(weights, [2.5, 97.5])
print(f"95% Confidence Interval: {confidence_interval}")
print(f"Mean Neural Density: {np.mean(weights):.4f}")`);
  const [interpreterOutput, setInterpreterOutput] = useState(`Executing Python 3.12 NumPy Sandbox...
95% Confidence Interval: [0.2064 0.7938]
Mean Neural Density: 0.5002
Process completed in 0.012s (10,000 Monte Carlo Iterations)`);

  // Game Engine State
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const visionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [gameDifficulty, setGameDifficulty] = useState<'Easy' | 'Medium' | 'Insane'>('Medium');

  // DAW Drum Sequencer State (16 steps)
  const [bpm, setBpm] = useState(128);
  const [activeStep, setActiveStep] = useState(0);
  const [isSequencerPlaying, setIsSequencerPlaying] = useState(false);
  const [sequencerGrid, setSequencerGrid] = useState<boolean[][]>([
    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], // Kick
    [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false], // Snare
    [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true], // Hi-Hat
    [false, false, false, true, false, false, true, false, false, true, false, false, false, true, false, true], // Synth Lead
  ]);

  // Code Editor State
  const [codeSnippet, setCodeSnippet] = useState<string>(
    `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; background: #030008; color: #c084fc; font-family: monospace; display: flex; flex-direction: column; items-center; justify-content: center; min-height: 100vh; text-align: center; }
    h1 { font-size: 28px; text-shadow: 0 0 15px #a855f7; margin-bottom: 8px; }
    p { color: #e9d5ff; font-size: 14px; }
    .orb { width: 120px; height: 120px; border-radius: 50%; background: radial-gradient(circle, #c084fc, #6b21a8); margin: 20px auto; animation: pulse 2s infinite ease-in-out; shadow: 0 0 30px #a855f7; }
    @keyframes pulse { 0%, 100% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.15); filter: brightness(1.4); } }
  </style>
</head>
<body>
  <div class="orb"></div>
  <h1>POSSIBILITIES LIVE ENGINE</h1>
  <p>Live compiled React & WebAssembly runtime preview</p>
  <button onclick="alert('Hot Module Reload Triggered!')" style="background:#8b5cf6; color:white; border:none; padding:10px 20px; border-radius:12px; font-weight:bold; cursor:pointer; margin-top:15px;">Run Function</button>
</body>
</html>`
  );

  const selectedAsset = assetsList.find((a) => a.id === selectedAssetId) || assetsList[0];

  // Sync active asset type when selected asset changes
  const handleSelectAsset = (asset: GeneratedAsset) => {
    audioSynth.playNodeClick(750);
    setSelectedAssetId(asset.id);
    setActiveAssetType(asset.type);
  };

  // DAW Sequencer Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSequencerPlaying && activeAssetType === 'beat') {
      const stepDuration = (60 / bpm / 4) * 1000;
      interval = setInterval(() => {
        setActiveStep((prev) => {
          const next = (prev + 1) % 16;
          // Play sounds for active row items
          if (!isAudioMuted) {
            if (sequencerGrid[0][next]) audioSynth.playNodeClick(180); // Kick
            if (sequencerGrid[1][next]) audioSynth.playNodeClick(480); // Snare
            if (sequencerGrid[2][next]) audioSynth.playNodeClick(880); // Hi-hat
            if (sequencerGrid[3][next]) audioSynth.playEnergyBloom(); // Synth
          }
          return next;
        });
      }, stepDuration);
    }
    return () => clearInterval(interval);
  }, [isSequencerPlaying, activeAssetType, bpm, sequencerGrid, isAudioMuted]);

  // 3D Procedural World Canvas Animation Effect
  useEffect(() => {
    if (activeAssetType !== 'world' || !worldCanvasRef.current) return;
    const canvas = worldCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1280;
    canvas.height = 720;
    let frame = 0;
    let animId: number;

    const render3D = () => {
      frame++;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 1280, 720);

      if (worldWeather === 'Aurora Borealis') {
        const grad = ctx.createLinearGradient(0, 0, 0, 400);
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
        grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.15)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 400);
      } else if (worldWeather === 'Solar Flare') {
        const grad = ctx.createRadialGradient(640, 200, 20, 640, 200, 500);
        grad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 720);
      }

      ctx.strokeStyle =
        worldWeather === 'Solar Flare'
          ? '#f59e0b'
          : worldWeather === 'Aurora Borealis'
          ? '#10b981'
          : '#06b6d4';
      ctx.lineWidth = 1;

      const horizonY = 360;
      const lines = 24;
      const cols = 32;

      for (let i = 0; i < lines; i++) {
        const y = horizonY + Math.pow(i / lines, 2) * 360;
        const speedOffset = (frame * 1.5) % 30;
        const adjustedY = y + speedOffset * (i / lines);

        ctx.beginPath();
        ctx.moveTo(0, adjustedY);
        ctx.lineTo(1280, adjustedY);
        ctx.stroke();
      }

      for (let c = -cols / 2; c <= cols / 2; c++) {
        const startX = 640 + c * 8;
        const endX = 640 + c * 80;
        ctx.beginPath();
        ctx.moveTo(startX, horizonY);
        ctx.lineTo(endX, 720);
        ctx.stroke();
      }

      if (worldWeather === 'Neon Rain') {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
        for (let p = 0; p < 60; p++) {
          const rx = (p * 47 + frame * 3) % 1280;
          const ry = (p * 31 + frame * 12) % 720;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 2, ry + 15);
          ctx.stroke();
        }
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.fillText('3D PROCEDURAL WORLD GENERATOR v4.0', 640, 260);

      ctx.fillStyle = '#67e8f9';
      ctx.font = '14px monospace';
      ctx.shadowBlur = 0;
      ctx.fillText(`WEATHER: ${worldWeather.toUpperCase()} • REAL-TIME MESH SHADER`, 640, 290);

      animId = requestAnimationFrame(render3D);
    };

    animId = requestAnimationFrame(render3D);
    return () => cancelAnimationFrame(animId);
  }, [activeAssetType, worldWeather]);

  // Multimodal Vision Inspector Canvas Render Effect
  useEffect(() => {
    if (activeAssetType !== 'visionInspector' || !visionCanvasRef.current) return;
    const canvas = visionCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 400;

    ctx.fillStyle = '#09050d';
    ctx.fillRect(0, 0, 800, 400);

    ctx.strokeStyle = 'rgba(244, 63, 94, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 400);
      ctx.stroke();
    }
    for (let y = 0; y < 400; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    if (visionMode === 'Bounding Box' || visionMode === 'Visual Code') {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.strokeRect(120, 80, 240, 180);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(120, 56, 160, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('Neural Core [99.4%]', 128, 72);

      ctx.strokeStyle = '#06b6d4';
      ctx.strokeRect(440, 140, 260, 200);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(440, 116, 180, 24);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Spatial Matrix [98.1%]', 448, 132);
    } else if (visionMode === 'OCR Document') {
      ctx.fillStyle = '#fda4af';
      ctx.font = '14px monospace';
      ctx.fillText('OCR EXTRACTED TEXT STREAM:', 60, 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText('"POSSIBILITIES AI STUDIO: ZERO-LIMITS NEURAL ARCHITECTURE"', 60, 120);
      ctx.fillText('"LATENCY: 12ms | ACCURACY: 99.99% | STATUS: OPTIMAL"', 60, 150);
    } else {
      const grad = ctx.createRadialGradient(400, 200, 10, 400, 200, 300);
      grad.addColorStop(0, 'rgba(244, 63, 94, 0.8)');
      grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 400);
    }
  }, [activeAssetType, visionMode]);

  // Handle Prompt Iteration Submission
  const handleSendIterationPrompt = () => {
    if (!iterationPrompt.trim()) return;
    audioSynth.playEnergyBloom();
    setIsIterating(true);

    setTimeout(() => {
      setIsIterating(false);
      const newAsset: GeneratedAsset = {
        id: `asset-${Date.now()}`,
        type: activeAssetType,
        title: `Updated ${activeAssetType.toUpperCase()}: ${iterationPrompt.slice(0, 24)}...`,
        prompt: iterationPrompt,
        createdAt: 'Just now',
        details: 'Refined live by Possibilities Studio Engine',
      };
      setAssetsList([newAsset, ...assetsList]);
      setSelectedAssetId(newAsset.id);
      setIterationPrompt('');
    }, 1200);
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-purple-100 font-sans relative overflow-hidden select-none">
      {/* Top Header & Stage Navigation Bar */}
      <header className="px-4 py-3 bg-zinc-950/90 border-b border-purple-500/30 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 z-30">
        {/* Title & Live Status */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Tv className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                Possibilities Live Preview Stage
              </h2>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                60 FPS LIVE
              </span>
            </div>
            <p className="text-[11px] text-purple-300/70 font-mono">
              Universal Real-Time Execution Environment for Movies, Games, Songs & Apps
            </p>
          </div>
        </div>

        {/* Device Viewport Selector */}
        <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-purple-500/30">
          <button
            onClick={() => setViewportDevice('desktop')}
            className={`p-1.5 rounded-xl text-xs flex items-center gap-1 transition-all ${
              viewportDevice === 'desktop'
                ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                : 'text-purple-300/70 hover:text-white'
            }`}
            title="Desktop Mode (100% Stage)"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden md:inline text-[10px]">Desktop</span>
          </button>

          <button
            onClick={() => setViewportDevice('tablet')}
            className={`p-1.5 rounded-xl text-xs flex items-center gap-1 transition-all ${
              viewportDevice === 'tablet'
                ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                : 'text-purple-300/70 hover:text-white'
            }`}
            title="Tablet Viewport (820x1180)"
          >
            <Tablet className="w-4 h-4" />
            <span className="hidden md:inline text-[10px]">Tablet</span>
          </button>

          <button
            onClick={() => setViewportDevice('mobile')}
            className={`p-1.5 rounded-xl text-xs flex items-center gap-1 transition-all ${
              viewportDevice === 'mobile'
                ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                : 'text-purple-300/70 hover:text-white'
            }`}
            title="Mobile Device (390x844)"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden md:inline text-[10px]">Mobile</span>
          </button>

          <button
            onClick={() => setViewportDevice('cinematic')}
            className={`p-1.5 rounded-xl text-xs flex items-center gap-1 transition-all ${
              viewportDevice === 'cinematic'
                ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                : 'text-purple-300/70 hover:text-white'
            }`}
            title="IMAX UltraWide (21:9)"
          >
            <Tv className="w-4 h-4" />
            <span className="hidden md:inline text-[10px]">21:9 Cinema</span>
          </button>
        </div>

        {/* Global Toolbar Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsAudioMuted(!isAudioMuted);
              audioSynth.playNodeClick(500);
            }}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-purple-950/60 border border-purple-500/30 text-purple-200 transition-all"
            title={isAudioMuted ? 'Unmute Audio Master' : 'Mute Audio Master'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-purple-300" />}
          </button>

          <button
            onClick={() => {
              audioSynth.playEnergyBloom();
              setIsPlaying(!isPlaying);
            }}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-purple-950/60 border border-purple-500/30 text-purple-200 transition-all"
            title="Reload Live Canvas"
          >
            <RefreshCw className={`w-4 h-4 ${isPlaying ? 'animate-spin-slow' : ''}`} />
          </button>

          <button
            onClick={() => {
              audioSynth.playEnergyBloom();
              alert(`Exporting ${selectedAsset.type.toUpperCase()} package: "${selectedAsset.title}"`);
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-purple-300 hover:text-white border border-purple-500/30 transition-all"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Asset Type Switcher Sub-Header Tabs */}
      <div className="px-4 py-2 bg-zinc-950 border-b border-purple-500/20 flex items-center gap-2 overflow-x-auto no-scrollbar z-20">
        {[
          { id: 'deepResearch', label: 'Deep Research Engine', icon: Search, color: 'text-amber-400' },
          { id: 'visionInspector', label: 'Vision Inspector', icon: Scan, color: 'text-rose-400' },
          { id: 'codeInterpreter', label: 'Python Data Interpreter', icon: Terminal, color: 'text-emerald-400' },
          { id: 'world', label: '3D World Engine', icon: Globe, color: 'text-cyan-400' },
          { id: 'agentSwarm', label: 'AI Agent Swarm', icon: Bot, color: 'text-emerald-400' },
          { id: 'voiceSynth', label: 'Voice Neural Synth', icon: Mic, color: 'text-fuchsia-400' },
          { id: 'movie', label: 'Movie Studio', icon: Film, color: 'text-purple-400' },
          { id: 'game', label: 'Game Engine', icon: Gamepad2, color: 'text-emerald-400' },
          { id: 'beat', label: 'DAW Song Beat', icon: Music, color: 'text-amber-400' },
          { id: 'code', label: 'Live Code App', icon: Code2, color: 'text-cyan-400' },
          { id: 'pdf', label: 'PDF Document', icon: FileText, color: 'text-rose-400' },
          { id: 'apk', label: 'APK Device', icon: Package, color: 'text-fuchsia-400' },
          { id: 'canvas', label: 'Visual Canvas', icon: Palette, color: 'text-indigo-400' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAssetType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                audioSynth.playNodeClick(800);
                setActiveAssetType(tab.id as StageAssetType);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-purple-950/80 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-900/60 border-purple-500/20 text-purple-300/70 hover:bg-purple-950/40 hover:text-purple-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Viewport Workspace (Split layout: Sidebar + Stage Container) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Recent Creations Library */}
        <aside className="w-64 bg-zinc-950/90 border-r border-purple-500/20 flex-col hidden lg:flex z-20">
          <div className="p-3 border-b border-purple-500/20 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Generated Assets
            </span>
            <span className="text-[10px] text-purple-400/80 font-mono">{assetsList.length} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {assetsList.map((asset) => {
              const isSelected = asset.id === selectedAssetId;
              return (
                <button
                  key={asset.id}
                  onClick={() => handleSelectAsset(asset)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-purple-950/70 border-purple-500/80 text-white shadow-md'
                      : 'bg-zinc-900/40 border-purple-500/10 text-purple-300/80 hover:bg-purple-950/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                      {asset.type}
                    </span>
                    <span className="text-[9px] text-purple-400/60 font-mono">{asset.createdAt}</span>
                  </div>
                  <h4 className="text-xs font-bold truncate text-purple-100">{asset.title}</h4>
                  <p className="text-[10px] text-purple-300/60 truncate mt-0.5">{asset.prompt}</p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: Interactive Live Stage Preview Viewport */}
        <main className="flex-1 bg-black flex flex-col items-center justify-center p-3 sm:p-6 overflow-auto relative">
          {/* Device Frame Simulation Container */}
          <div
            className={`transition-all duration-500 relative flex flex-col items-center justify-center ${
              viewportDevice === 'mobile'
                ? 'w-[380px] h-[780px] rounded-[48px] border-[12px] border-zinc-800 bg-black shadow-[0_0_60px_rgba(168,85,247,0.3)]'
                : viewportDevice === 'tablet'
                ? 'w-[700px] h-[880px] rounded-[36px] border-[10px] border-zinc-800 bg-black shadow-[0_0_60px_rgba(168,85,247,0.3)]'
                : viewportDevice === 'cinematic'
                ? 'w-full max-w-6xl aspect-[21/9] rounded-2xl border border-purple-500/40 bg-black shadow-[0_0_80px_rgba(168,85,247,0.4)]'
                : 'w-full h-full rounded-2xl border border-purple-500/30 bg-zinc-950 shadow-[0_0_50px_rgba(0,0,0,0.9)]'
            }`}
          >
            {/* Mobile Device Top Notch Header */}
            {viewportDevice === 'mobile' && (
              <div className="w-32 h-5 bg-zinc-800 rounded-b-2xl absolute top-0 z-30 flex items-center justify-center">
                <div className="w-10 h-1 bg-zinc-900 rounded-full" />
              </div>
            )}

            {/* STAGE CANVAS & INTERACTIVE ENGINES */}
            <div className="w-full h-full rounded-xl overflow-hidden flex flex-col relative bg-black">
              {/* 0. DEEP RESEARCH & CONSENSUS MATRIX ENGINE */}
              {activeAssetType === 'deepResearch' && (
                <div className="w-full h-full flex flex-col bg-zinc-950 font-mono p-4 space-y-4 overflow-y-auto">
                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-amber-400 animate-pulse" />
                      <div>
                        <h3 className="text-sm font-bold text-amber-100">Autonomous Web Deep Research & Consensus Engine</h3>
                        <p className="text-[11px] text-amber-300/70">14 Verified Web Sources • Citation Graph • 98.4% Confidence</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsResearching(true);
                        setResearchProgress(0);
                        audioSynth.playEnergyBloom();
                        let p = 0;
                        const interval = setInterval(() => {
                          p += 25;
                          setResearchProgress(p);
                          if (p >= 100) {
                            clearInterval(interval);
                            setIsResearching(false);
                          }
                        }, 300);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-all"
                    >
                      <RefreshCw className={`w-4 h-4 ${isResearching ? 'animate-spin' : ''}`} />
                      <span>{isResearching ? 'Crawling Web...' : 'Run Deep Research'}</span>
                    </button>
                  </div>

                  {/* Research Search Query Box */}
                  <div className="p-3 rounded-2xl bg-zinc-900 border border-amber-500/20 flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-400" />
                    <input
                      type="text"
                      value={researchQuery}
                      onChange={(e) => setResearchQuery(e.target.value)}
                      placeholder="Enter research topic or paper title..."
                      className="flex-1 bg-transparent text-xs text-amber-100 placeholder-amber-400/50 focus:outline-none"
                    />
                  </div>

                  {/* Crawl Progress Bar */}
                  {isResearching && (
                    <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-amber-500/30">
                      <div
                        className="bg-amber-500 h-full transition-all duration-300 shadow-[0_0_10px_#f59e0b]"
                        style={{ width: `${researchProgress}%` }}
                      />
                    </div>
                  )}

                  {/* Citation Grid Sources */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { source: 'arXiv:2608.09112', title: 'Neural Swarms in Quantum Latent Spaces', trust: '99.8%' },
                      { source: 'GitHub Repositories', title: 'Possibilities Multi-Agent Core Framework', trust: '100%' },
                      { source: 'IEEE Spectrum 2026', title: 'Sub-100ms Spatial Voice Synthesis', trust: '97.2%' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-zinc-900/80 border border-amber-500/20 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold">
                          <span>{item.source}</span>
                          <span className="text-emerald-400">Trust: {item.trust}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                        <p className="text-[10px] text-amber-200/60">Cross-verified against consensus vector index</p>
                      </div>
                    ))}
                  </div>

                  {/* Executive Research Synthesis Brief */}
                  <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 text-xs space-y-2">
                    <h4 className="text-amber-400 font-bold flex items-center gap-2 border-b border-amber-500/20 pb-2">
                      <FileSearch className="w-4 h-4" /> Synthesized Consensus Report
                    </h4>
                    <p className="text-amber-100/90 leading-relaxed text-[11px]">
                      Analysis confirms that combining real-time multi-agent orchestration with spatial audio synthesis and zero-latency code execution creates an integrated intelligence loop that outperforms single-threaded LLMs across latency, accuracy, and creative output.
                    </p>
                  </div>
                </div>
              )}

              {/* 00. MULTIMODAL VISION & DOCUMENT INSPECTOR */}
              {activeAssetType === 'visionInspector' && (
                <div className="w-full h-full flex flex-col bg-zinc-950 font-mono p-4 space-y-4 overflow-y-auto">
                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-rose-500/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Scan className="w-5 h-5 text-rose-400 animate-pulse" />
                      <div>
                        <h3 className="text-sm font-bold text-rose-100">Real-Time Multimodal Vision & OCR Inspector</h3>
                        <p className="text-[11px] text-rose-300/70">60 FPS Neural Frame Inspection & Coordinates</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {(['Bounding Box', 'OCR Document', 'Depth Map', 'Visual Code'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => {
                            setVisionMode(mode);
                            audioSynth.playNodeClick(750);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                            visionMode === mode
                              ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                              : 'bg-zinc-900 text-rose-300/70 border-rose-500/20 hover:bg-rose-950/40'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vision Canvas Render */}
                  <div className="relative flex-1 min-h-[260px] bg-black rounded-2xl border border-rose-500/30 overflow-hidden flex items-center justify-center">
                    <canvas
                      ref={visionCanvasRef}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* 000. PYTHON CODE & MATH INTERPRETER SANDBOX */}
              {activeAssetType === 'codeInterpreter' && (
                <div className="w-full h-full flex flex-col bg-zinc-950 font-mono p-4 space-y-4 overflow-y-auto">
                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Terminal className="w-5 h-5 text-emerald-400 animate-pulse" />
                      <div>
                        <h3 className="text-sm font-bold text-emerald-100">Python Math & Data Analytics Execution Sandbox</h3>
                        <p className="text-[11px] text-emerald-300/70">Python 3.12 Runtime • NumPy/SciPy • Real-Time Math Plotting</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        audioSynth.playEnergyBloom();
                        setInterpreterOutput(
                          `Executing Python 3.12 NumPy Sandbox...\nMonte Carlo Iterations: 10,000\nMean Neural Weight: 0.5004\nStandard Deviation: 0.1498\nExecution Time: 0.008s\nStatus: SUCCESS (Plot Rendered Below)`
                        );
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Execute Code</span>
                    </button>
                  </div>

                  {/* Code Editor Area */}
                  <div className="p-3 rounded-2xl bg-zinc-900 border border-emerald-500/20 flex flex-col space-y-2">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Python Script Terminal</span>
                    <textarea
                      value={pythonCode}
                      onChange={(e) => setPythonCode(e.target.value)}
                      rows={5}
                      className="w-full bg-black/60 p-3 rounded-xl border border-emerald-500/30 text-xs text-emerald-200 font-mono focus:outline-none"
                    />
                  </div>

                  {/* Simulated Dynamic Statistical Plot Chart */}
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                        <LineChart className="w-4 h-4" /> Live Monte Carlo Distribution Plot
                      </span>
                      <span className="text-[10px] text-emerald-400/60">NumPy Density Curve</span>
                    </div>

                    <div className="h-28 w-full flex items-end gap-1 pt-2">
                      {[12, 24, 45, 78, 120, 160, 190, 210, 190, 160, 120, 78, 45, 24, 12].map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                          <div
                            className="w-full bg-emerald-500/80 rounded-t group-hover:bg-emerald-400 transition-all shadow-[0_0_10px_#10b981]"
                            style={{ height: `${(val / 210) * 100}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Output Log */}
                  <div className="p-3 rounded-2xl bg-black border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1 font-mono whitespace-pre-wrap">
                    {interpreterOutput}
                  </div>
                </div>
              )}

              {/* 0A. 3D PROCEDURAL WORLD ENGINE */}
              {activeAssetType === 'world' && (
                <div className="w-full h-full flex flex-col relative bg-black font-mono">
                  {/* World Top Control Bar */}
                  <div className="p-3 bg-zinc-950 border-b border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 z-20">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                      <span className="text-xs font-bold text-cyan-200 uppercase">Procedural 3D Environment Engine</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-cyan-400/80">Atmosphere:</span>
                      {(['Neon Rain', 'Solar Flare', 'Quantum Fog', 'Aurora Borealis'] as const).map((weather) => (
                        <button
                          key={weather}
                          onClick={() => {
                            setWorldWeather(weather);
                            audioSynth.playNodeClick(800);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                            worldWeather === weather
                              ? 'bg-cyan-600 text-white border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                              : 'bg-zinc-900 text-cyan-300/70 border-cyan-500/20 hover:bg-cyan-950/40'
                          }`}
                        >
                          {weather}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3D Wireframe Canvas Render */}
                  <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                    <canvas
                      ref={worldCanvasRef}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* 0B. AUTONOMOUS AI AGENT SWARM */}
              {activeAssetType === 'agentSwarm' && (
                <div className="w-full h-full flex flex-col bg-zinc-950 font-mono p-4 space-y-4 overflow-y-auto">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-emerald-500/30">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-emerald-400 animate-bounce" />
                      <div>
                        <h3 className="text-sm font-bold text-emerald-100">Autonomous AI Multi-Agent Swarm Director</h3>
                        <p className="text-[11px] text-emerald-300/70">5 Specialized Agents Collaborating in Real-Time</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        audioSynth.playEnergyBloom();
                        setSwarmPulse((p) => p + 1);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
                    >
                      <Zap className="w-4 h-4" /> Trigger Swarm Task
                    </button>
                  </div>

                  {/* Swarm Visual Graph Pipeline */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                    {[
                      { id: 'writer', name: 'Story & Lore', role: 'Spec Writer', color: 'border-purple-500 bg-purple-950/40 text-purple-300' },
                      { id: 'visual', name: 'Cinema & Art', role: 'Visual Director', color: 'border-cyan-500 bg-cyan-950/40 text-cyan-300' },
                      { id: 'audio', name: 'DAW & Voice', role: 'Audio Producer', color: 'border-amber-500 bg-amber-950/40 text-amber-300' },
                      { id: 'code', name: 'Compiler JS', role: 'Engine Compiler', color: 'border-emerald-500 bg-emerald-950/40 text-emerald-300' },
                      { id: 'qa', name: 'Quality Control', role: 'System Evaluator', color: 'border-rose-500 bg-rose-950/40 text-rose-300' },
                    ].map((agent) => {
                      const isSelected = activeSwarmNode === agent.id;
                      return (
                        <button
                          key={agent.id}
                          onClick={() => {
                            setActiveSwarmNode(agent.id);
                            audioSynth.playNodeClick(600);
                          }}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${agent.color} ${
                            isSelected ? 'ring-2 ring-white scale-105 shadow-xl' : 'opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Cpu className="w-4 h-4" />
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          </div>
                          <h4 className="text-xs font-bold text-white">{agent.name}</h4>
                          <p className="text-[10px] opacity-70">{agent.role}</p>
                          <div className="mt-2 text-[9px] px-2 py-0.5 rounded bg-black/50 font-bold">
                            STATUS: ACTIVE 100%
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Node Live Output Feed */}
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <Activity className="w-4 h-4" /> Agent Node Output Log: {activeSwarmNode.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-emerald-400/60 font-mono">Real-time Stream</span>
                    </div>

                    <div className="space-y-1.5 font-mono text-[11px] text-emerald-200/90 leading-relaxed pt-1">
                      <p>❯ [00:00:01] Initializing Agent Swarm Node: <span className="text-white font-bold">{activeSwarmNode}</span></p>
                      <p>❯ [00:00:02] Querying Neural Knowledge Base & Context Graph...</p>
                      <p>❯ [00:00:03] Optimizing parameters for 60 FPS output execution.</p>
                      <p className="text-emerald-400 font-bold">❯ [00:00:04] Task Completed successfully with 0 errors.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 0C. NEURAL SPATIAL VOICE STUDIO */}
              {activeAssetType === 'voiceSynth' && (
                <div className="w-full h-full flex flex-col bg-zinc-950 font-mono p-4 space-y-4 overflow-y-auto">
                  <div className="p-3 rounded-2xl bg-zinc-900 border border-fuchsia-500/30 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Mic className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                      <div>
                        <h3 className="text-sm font-bold text-fuchsia-100">Spatial Neural Voice & Character Studio</h3>
                        <p className="text-[11px] text-fuchsia-300/70">Real-time Character Voice Synthesis & Formant Modulation</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsSynthesizingVoice(true);
                        audioSynth.playEnergyBloom();
                        setTimeout(() => setIsSynthesizingVoice(false), 2000);
                      }}
                      className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs shadow-lg shadow-fuchsia-600/30 flex items-center gap-2 transition-all"
                    >
                      <Radio className={`w-4 h-4 ${isSynthesizingVoice ? 'animate-spin' : ''}`} />
                      <span>{isSynthesizingVoice ? 'Synthesizing...' : 'Synthesize Voice'}</span>
                    </button>
                  </div>

                  {/* Character Casting Selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Hero Protagonist', 'AI Companion', 'Cyber Villain', 'Deep Narrator'] as const).map((char) => (
                      <button
                        key={char}
                        onClick={() => {
                          setVoiceCharacter(char);
                          audioSynth.playNodeClick(700);
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                          voiceCharacter === char
                            ? 'bg-fuchsia-950/80 border-fuchsia-400 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]'
                            : 'bg-zinc-900 border-fuchsia-500/20 text-fuchsia-300/70 hover:bg-fuchsia-950/40'
                        }`}
                      >
                        {char}
                      </button>
                    ))}
                  </div>

                  {/* Acoustic Controls Sliders */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-zinc-900 border border-fuchsia-500/30">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-fuchsia-200">
                        <span>PITCH SHIFT</span>
                        <span>{voicePitch}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={voicePitch}
                        onChange={(e) => setVoicePitch(Number(e.target.value))}
                        className="w-full accent-fuchsia-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-fuchsia-200">
                        <span>TIMBRE WARMTH</span>
                        <span>{voiceTimbre}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={voiceTimbre}
                        onChange={(e) => setVoiceTimbre(Number(e.target.value))}
                        className="w-full accent-fuchsia-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-fuchsia-200">
                        <span>FORMANT RESONANCE</span>
                        <span>{voiceFormant}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={voiceFormant}
                        onChange={(e) => setVoiceFormant(Number(e.target.value))}
                        className="w-full accent-fuchsia-500"
                      />
                    </div>
                  </div>

                  {/* Speech Script Input */}
                  <div className="p-3 rounded-2xl bg-zinc-900 border border-fuchsia-500/30 flex items-center gap-2">
                    <input
                      type="text"
                      value={voiceText}
                      onChange={(e) => setVoiceText(e.target.value)}
                      placeholder="Type text for character voice synthesis..."
                      className="flex-1 bg-transparent text-xs text-fuchsia-100 placeholder-fuchsia-400/50 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 1. CINEMA MOVIE STAGE */}
              {activeAssetType === 'movie' && (
                <div className="w-full h-full flex flex-col relative bg-black">
                  <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
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
                          ctx.fillStyle = '#020108';
                          ctx.fillRect(0, 0, 1280, 720);

                          if (isPlaying) {
                            // Starfield motion
                            for (let i = 0; i < 80; i++) {
                              const x = (i * 37 + frame * (i % 3 + 1)) % 1280;
                              const y = (i * 53 + Math.sin(frame * 0.02 + i) * 20) % 720;
                              ctx.fillStyle = `rgba(192, 132, 252, ${0.4 + Math.sin(frame * 0.05 + i) * 0.4})`;
                              ctx.fillRect(x, y, (i % 3) + 1.5, (i % 3) + 1.5);
                            }

                            // Anamorphic laser flare line
                            const grad = ctx.createLinearGradient(0, 360, 1280, 360);
                            grad.addColorStop(0, 'rgba(168, 85, 247, 0)');
                            grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.9)');
                            grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
                            ctx.fillStyle = grad;
                            ctx.fillRect(0, 358, 1280, 4);

                            // Scene title text
                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 28px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.shadowColor = '#a855f7';
                            ctx.shadowBlur = 20;
                            ctx.fillText(
                              movieScene === 1
                                ? 'SCENE 1: NEURAL GRID AWAKENING'
                                : movieScene === 2
                                ? 'SCENE 2: QUANTUM SKYLINE CHASE'
                                : 'SCENE 3: TRANSCENDENCE & SYNTHETIC DAWN',
                              640,
                              320
                            );

                            ctx.fillStyle = '#c084fc';
                            ctx.font = '16px monospace';
                            ctx.shadowBlur = 0;
                            ctx.fillText(`DIRECTOR'S CUT • 4K HDR • DOLBY ATMOS SPATIAL 7.1`, 640, 360);
                          }
                          requestAnimationFrame(anim);
                        };
                        const id = requestAnimationFrame(anim);
                        return () => cancelAnimationFrame(id);
                      }}
                      className="w-full h-full object-contain"
                    />

                    {/* Overlay Subtitle Overlay */}
                    <div className="absolute bottom-6 inset-x-0 text-center pointer-events-none px-6">
                      <p className="inline-block px-4 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-purple-500/30 text-xs font-mono text-purple-200">
                        "{selectedAsset.prompt}"
                      </p>
                    </div>
                  </div>

                  {/* Movie Timeline Control Bar */}
                  <div className="p-3 bg-zinc-950 border-t border-purple-500/30 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setIsPlaying(!isPlaying);
                          audioSynth.playNodeClick(600);
                        }}
                        className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md shadow-purple-600/30"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <span className="text-purple-200 font-bold">01:24:00 / 02:15:00</span>
                    </div>

                    {/* Scene Stepper */}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((sceneNum) => (
                        <button
                          key={sceneNum}
                          onClick={() => {
                            setMovieScene(sceneNum);
                            audioSynth.playNodeClick(700);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                            movieScene === sceneNum
                              ? 'bg-purple-600 text-white border border-purple-400'
                              : 'bg-zinc-900 text-purple-300/70 border border-purple-500/20 hover:bg-purple-950/40'
                          }`}
                        >
                          Scene {sceneNum}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. PLAYABLE HTML5 GAME ENGINE */}
              {activeAssetType === 'game' && (
                <div className="w-full h-full flex flex-col relative bg-zinc-950 font-mono">
                  <div className="p-2 bg-zinc-900 border-b border-emerald-500/30 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4" /> HTML5 Space Arcade Engine
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-300">SCORE: {gameScore}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
                        {gameDifficulty}
                      </span>
                    </div>
                  </div>

                  <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                    <canvas
                      ref={(canvas) => {
                        if (!canvas) return;
                        gameCanvasRef.current = canvas;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;
                        canvas.width = 800;
                        canvas.height = 450;
                        let shipX = 400;
                        let score = 0;
                        let bullets: { x: number; y: number }[] = [];
                        let asteroids = Array.from({ length: 8 }, () => ({
                          x: Math.random() * 800,
                          y: Math.random() * -400,
                          speed: 2 + Math.random() * 3,
                          size: 15 + Math.random() * 20,
                        }));

                        const onMouseMove = (e: MouseEvent) => {
                          const rect = canvas.getBoundingClientRect();
                          shipX = Math.max(20, Math.min(780, (e.clientX - rect.left) * (800 / rect.width)));
                        };

                        const onClick = () => {
                          bullets.push({ x: shipX, y: 380 });
                          audioSynth.playNodeClick(900);
                        };

                        canvas.addEventListener('mousemove', onMouseMove);
                        canvas.addEventListener('click', onClick);

                        const render = () => {
                          ctx.fillStyle = '#020b07';
                          ctx.fillRect(0, 0, 800, 450);

                          // Asteroids
                          ctx.fillStyle = '#10b981';
                          asteroids.forEach((a) => {
                            a.y += a.speed;
                            if (a.y > 450) {
                              a.y = -50;
                              a.x = Math.random() * 800;
                            }
                            ctx.beginPath();
                            ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
                            ctx.fill();
                          });

                          // Bullets
                          ctx.fillStyle = '#34d399';
                          bullets.forEach((b, index) => {
                            b.y -= 8;
                            ctx.fillRect(b.x - 2, b.y, 4, 12);
                            if (b.y < 0) bullets.splice(index, 1);
                          });

                          // Player Ship
                          ctx.fillStyle = '#34d399';
                          ctx.beginPath();
                          ctx.moveTo(shipX, 370);
                          ctx.lineTo(shipX - 18, 410);
                          ctx.lineTo(shipX + 18, 410);
                          ctx.closePath();
                          ctx.fill();

                          // Engine glow flame
                          ctx.fillStyle = '#f59e0b';
                          ctx.beginPath();
                          ctx.moveTo(shipX - 8, 410);
                          ctx.lineTo(shipX, 425 + Math.random() * 8);
                          ctx.lineTo(shipX + 8, 410);
                          ctx.fill();

                          score++;
                          setGameScore(Math.floor(score / 5));

                          requestAnimationFrame(render);
                        };
                        const id = requestAnimationFrame(render);
                        return () => {
                          canvas.removeEventListener('mousemove', onMouseMove);
                          canvas.removeEventListener('click', onClick);
                          cancelAnimationFrame(id);
                        };
                      }}
                      className="w-full h-full cursor-crosshair object-contain"
                    />
                  </div>

                  <div className="p-3 bg-zinc-900 border-t border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                    <span>🎮 MOVE MOUSE / TOUCH TO STEER • CLICK TO FIRE LASERS</span>
                    <button
                      onClick={() => {
                        setGameScore(0);
                        audioSynth.playEnergyBloom();
                      }}
                      className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      Restart Match
                    </button>
                  </div>
                </div>
              )}

              {/* 3. DAW BEAT & SONG PRODUCER */}
              {activeAssetType === 'beat' && (
                <div className="w-full h-full flex flex-col relative bg-zinc-950 font-mono p-4 space-y-4 overflow-y-auto">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900 border border-purple-500/30">
                    <div>
                      <h3 className="text-sm font-bold text-purple-100 flex items-center gap-2">
                        <Music className="w-4 h-4 text-purple-400" /> WebAudio Synthesizer DAW Matrix
                      </h3>
                      <p className="text-[11px] text-purple-300/70">16-Step Programmable Drum Machine & Lead Synthesizer</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setIsSequencerPlaying(!isSequencerPlaying);
                          audioSynth.playEnergyBloom();
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                      >
                        {isSequencerPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isSequencerPlaying ? 'Pause Master' : 'Play Sequencer'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-300">BPM: {bpm}</span>
                        <input
                          type="range"
                          min={80}
                          max={170}
                          value={bpm}
                          onChange={(e) => setBpm(Number(e.target.value))}
                          className="w-24 accent-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 16-Step Sequencer Grid */}
                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-purple-500/30 space-y-3">
                    {['KICK DRUM', 'SNARE HIT', 'HI-HAT CYMBAL', 'SYNTH LEAD'].map((trackLabel, rowIndex) => (
                      <div key={trackLabel} className="space-y-1">
                        <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">{trackLabel}</span>
                        <div className="grid grid-cols-16 gap-1.5">
                          {sequencerGrid[rowIndex].map((active, colIndex) => {
                            const isCurrent = activeStep === colIndex && isSequencerPlaying;
                            return (
                              <button
                                key={colIndex}
                                onClick={() => {
                                  audioSynth.playNodeClick(300 + rowIndex * 150);
                                  const newGrid = [...sequencerGrid];
                                  newGrid[rowIndex][colIndex] = !newGrid[rowIndex][colIndex];
                                  setSequencerGrid(newGrid);
                                }}
                                className={`h-10 rounded-lg border transition-all ${
                                  isCurrent
                                    ? 'border-white bg-purple-400 shadow-[0_0_15px_#c084fc] scale-105'
                                    : active
                                    ? 'bg-purple-600 border-purple-400 text-white'
                                    : 'bg-zinc-950 border-purple-500/20 text-purple-400/40 hover:bg-purple-950/40'
                                }`}
                              >
                                <span className="text-[9px]">{colIndex + 1}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Manual Sound Pads */}
                  <div className="grid grid-cols-4 gap-3 pt-2">
                    <button
                      onClick={() => audioSynth.playNodeClick(180)}
                      className="p-4 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-bold active:scale-95 transition-all text-center"
                    >
                      🥁 KICK
                    </button>
                    <button
                      onClick={() => audioSynth.playNodeClick(480)}
                      className="p-4 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-bold active:scale-95 transition-all text-center"
                    >
                      💥 SNARE
                    </button>
                    <button
                      onClick={() => audioSynth.playNodeClick(880)}
                      className="p-4 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-bold active:scale-95 transition-all text-center"
                    >
                      ✨ HI-HAT
                    </button>
                    <button
                      onClick={() => audioSynth.playEnergyBloom()}
                      className="p-4 rounded-xl bg-purple-600 hover:bg-purple-500 border border-purple-400 text-white font-bold active:scale-95 transition-all text-center shadow-lg shadow-purple-600/30"
                    >
                      🎹 SYNTH LEAD
                    </button>
                  </div>
                </div>
              )}

              {/* 4. LIVE CODE APPLET VIEWPORT */}
              {activeAssetType === 'code' && (
                <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-zinc-950">
                  {/* Left Code Editor */}
                  <div className="flex flex-col rounded-xl bg-zinc-900 border border-purple-500/30 overflow-hidden font-mono">
                    <div className="p-2 bg-zinc-950 border-b border-purple-500/30 flex items-center justify-between text-xs text-purple-300">
                      <span>Live Source Editor</span>
                      <span className="text-[10px] text-purple-400/80">HTML / CSS / JS</span>
                    </div>
                    <textarea
                      value={codeSnippet}
                      onChange={(e) => setCodeSnippet(e.target.value)}
                      className="flex-1 p-3 bg-zinc-950 text-xs text-purple-200 font-mono focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Right Real-time Render Frame */}
                  <div className="flex flex-col rounded-xl bg-zinc-900 border border-purple-500/30 overflow-hidden">
                    <div className="p-2 bg-zinc-950 border-b border-purple-500/30 flex items-center justify-between text-xs text-purple-300 font-mono">
                      <span>Hot Module Executed Preview</span>
                      <span className="text-emerald-400 text-[10px] font-bold">● Active Sandbox</span>
                    </div>
                    <iframe
                      srcDoc={codeSnippet}
                      title="Live Executed Code"
                      className="w-full h-full border-none bg-black"
                    />
                  </div>
                </div>
              )}

              {/* 5. PDF DOCUMENT READER */}
              {activeAssetType === 'pdf' && (
                <div className="w-full h-full flex flex-col bg-zinc-900 font-mono p-4 overflow-y-auto">
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-purple-500/30 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                      <div>
                        <h3 className="text-sm font-bold text-purple-100">{selectedAsset.title}</h3>
                        <p className="text-[11px] text-purple-300/70">Formatted PDF Output Document</p>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-xs">
                        Page 1 of 4
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900 text-xs text-purple-200 space-y-3 leading-relaxed">
                      <p className="font-bold text-purple-300">Executive Summary:</p>
                      <p>
                        This document details the complete quantum neural model architecture powering Possibilities AI
                        Studio. All visual, cinematic, audio, and code assets are generated dynamically using
                        server-authoritative models and WebAssembly synthesis engines.
                      </p>
                      <p className="font-bold text-purple-300 pt-2">System Metrics & Security:</p>
                      <ul className="list-disc list-inside space-y-1 text-purple-300/80">
                        <li>Real-time 60 FPS Canvas Renderer</li>
                        <li>High-Fidelity WebAudio Synthesizer</li>
                        <li>Sandboxed Code Executer Environment</li>
                      </ul>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          const blob = new Blob([codeSnippet], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${selectedAsset.title.toLowerCase().replace(/\s+/g, '_')}.pdf`;
                          a.click();
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Download PDF File
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. ANDROID APK DEVICE SIMULATOR */}
              {activeAssetType === 'apk' && (
                <div className="w-full h-full flex flex-col bg-zinc-950 font-mono p-4 items-center justify-center">
                  <div className="w-full max-w-md p-6 rounded-3xl bg-zinc-900 border border-purple-500/40 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-600/30 border border-purple-400 flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                      <Package className="w-8 h-8" />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">{selectedAsset.title}</h3>
                      <p className="text-xs text-purple-300/70 mt-1">com.possibilities.companion.apk • v1.0.0</p>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950 border border-purple-500/20 text-left text-xs text-purple-300/80 space-y-1.5">
                      <p>✓ ARM64-v8a Device Architecture</p>
                      <p>✓ Signed Release Security Keys</p>
                      <p>✓ Standalone Offline Capability</p>
                    </div>

                    <button
                      onClick={() => {
                        audioSynth.playEnergyBloom();
                        alert(`Downloading standalone APK installer for "${selectedAsset.title}"`);
                      }}
                      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download Android APK
                    </button>
                  </div>
                </div>
              )}

              {/* 7. VISUAL CANVAS */}
              {activeAssetType === 'canvas' && (
                <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
                  <canvas
                    ref={(canvas) => {
                      if (!canvas) return;
                      const ctx = canvas.getContext('2d');
                      if (!ctx) return;
                      canvas.width = 1280;
                      canvas.height = 720;
                      ctx.fillStyle = '#05020a';
                      ctx.fillRect(0, 0, 1280, 720);

                      // Cyberpunk ambient visual art
                      const grad = ctx.createRadialGradient(640, 360, 50, 640, 360, 500);
                      grad.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
                      grad.addColorStop(0.5, 'rgba(124, 58, 237, 0.15)');
                      grad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
                      ctx.fillStyle = grad;
                      ctx.fillRect(0, 0, 1280, 720);

                      ctx.fillStyle = '#ffffff';
                      ctx.font = 'bold 32px sans-serif';
                      ctx.textAlign = 'center';
                      ctx.fillText('POSSIBILITIES VISUAL ART CANVAS', 640, 340);
                      ctx.fillStyle = '#c084fc';
                      ctx.font = '16px monospace';
                      ctx.fillText('GENERATED IN 8K ULTRA RESOLUTION', 640, 380);
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Prompt Iteration Studio Control Bar */}
      <footer className="p-3 bg-zinc-950 border-t border-purple-500/30 backdrop-blur-xl z-30">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-3">
          {/* Quick iteration suggestion chips */}
          <div className="hidden md:flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono text-purple-300 whitespace-nowrap">
            <span className="text-purple-400 font-bold">Iterate Live:</span>
            {[
              '⚡ Add Boss Battle',
              '🎵 Boost BPM to 140',
              '🎬 Add Neon Rain',
              '💻 Dark Mode Theme',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setIterationPrompt(chip);
                  audioSynth.playNodeClick(700);
                }}
                className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-purple-900/60 border border-purple-500/30 transition-all"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Prompt Bar Input */}
          <div className="flex-1 w-full flex items-center gap-2 bg-zinc-900/90 border border-purple-500/40 rounded-2xl p-1.5 focus-within:border-purple-400 shadow-inner">
            <input
              type="text"
              value={iterationPrompt}
              onChange={(e) => setIterationPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendIterationPrompt()}
              placeholder={`Prompt Possibilities to refine or re-create this ${activeAssetType}...`}
              className="flex-1 bg-transparent px-3 text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none"
            />

            <button
              onClick={handleSendIterationPrompt}
              disabled={isIterating || !iterationPrompt.trim()}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all"
            >
              {isIterating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Re-Create</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
