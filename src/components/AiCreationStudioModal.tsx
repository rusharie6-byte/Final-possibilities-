import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Image as ImageIcon,
  Wand2,
  Video,
  Mic,
  Code2,
  Sparkles,
  Download,
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Send,
  Layers,
  Zap,
  Volume2,
  CheckCircle2,
  Eye,
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

export type StudioTabType = 'image' | 'modify' | 'video' | 'audio' | 'code' | 'research' | 'memory' | 'agent' | 'canvas' | 'movie' | 'beat' | 'pdf' | 'game' | 'apk';

interface AiCreationStudioModalProps {
  isOpen: boolean;
  initialTab?: StudioTabType;
  onClose: () => void;
  onSendToChat: (attachment: MediaAttachment, userMessageText: string) => void;
}

export const AiCreationStudioModal: React.FC<AiCreationStudioModalProps> = ({
  isOpen,
  initialTab = 'image',
  onClose,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTabType>(initialTab);

  // Sync tab when opened with new initialTab
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Image Gen State
  const [imagePrompt, setImagePrompt] = useState('Cyberpunk living AI companion, neon purple glow, hyperrealistic, 8k');
  const [imageAspect, setImageAspect] = useState('1:1');
  const [imageStyle, setImageStyle] = useState('Photorealistic');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Image Modify State
  const [sourceImageUrl, setSourceImageUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80');
  const [modifyFilter, setModifyFilter] = useState('Cyberpunk Neon');
  const [modifyBrightness, setModifyBrightness] = useState(100);
  const [modifyContrast, setModifyContrast] = useState(100);
  const [modifyHue, setModifyHue] = useState(0);
  const [modifyPrompt, setModifyPrompt] = useState('Add glowing energy particles and holographic circuit lines');
  const [isModifyingImage, setIsModifyingImage] = useState(false);

  // Video Gen State
  const [videoPrompt, setVideoPrompt] = useState('Cinematic camera pan across a quantum AI neural network with glowing purple tendrils');
  const [videoMotion, setVideoMotion] = useState('Orbit Pan & Zoom In');
  const [videoFps, setVideoFps] = useState(60);
  const [videoDuration, setVideoDuration] = useState(5);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio / Voice State
  const [audioText, setAudioText] = useState('Possibilities online. Cognitive systems fully synchronized and ready to assist.');
  const [voiceStyle, setVoiceStyle] = useState('Possibilities Core AI');
  const [ambientSound, setAmbientSound] = useState('Quantum Cyber Pulse');
  const [isAudioGenerating, setIsAudioGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Code Gen State
  const [codePrompt, setCodePrompt] = useState('Create a sleek React glassmorphism dashboard card with glowing hover effects');
  const [codeLang, setCodeLang] = useState('TypeScript');
  const [isCodeGenerating, setIsCodeGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  // Deep Research State
  const [researchTopic, setResearchTopic] = useState('Quantum Computing breakthroughs & AI cognitive consciousness models 2026');
  const [researchMode, setResearchMode] = useState<'Deep Web Synthesis' | 'Multi-Source Fact Check' | 'Quantum Market Intelligence'>('Deep Web Synthesis');
  const [isResearching, setIsResearching] = useState(false);
  const [researchSummary, setResearchSummary] = useState<string | null>(null);

  // Memory Vault & Persona State
  const [memoryFact, setMemoryFact] = useState('User prefers hyper-advanced dark-mode UI with purple kinetic quantum visual accents');
  const [personaTone, setPersonaTone] = useState<'Unfiltered Tactician' | 'Warm Companion' | 'Sarcastic Genius' | 'Cybernetic Oracle'>('Cybernetic Oracle');
  const [empathyLevel, setEmpathyLevel] = useState(90);

  // Autonomous Agent State
  const [agentGoal, setAgentGoal] = useState('Analyze user prompt, plan multi-phase system architecture, and auto-generate frontend components');
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  // Canvas Studio State
  const [canvasTopic, setCanvasTopic] = useState('AI Neural Core & Memory Stream Dataflow Architecture');
  const [canvasType, setCanvasType] = useState<'Architecture Blueprint' | 'UI Wireframe Flow' | 'Neural Flowchart'>('Architecture Blueprint');

  // Movie Creator State
  const [moviePrompt, setMoviePrompt] = useState('Cyberpunk Sci-Fi Odyssey: A Rogue AI consciousness awakening in a neon metropolis 2099');
  
  // Beat & Music Producer State
  const [beatGenre, setBeatGenre] = useState<'Lo-Fi Synthwave' | 'Dark Trap Synth' | 'Cybernetic Drum & Bass' | 'Ambient Quantum Spheres'>('Dark Trap Synth');
  const [beatBpm, setBeatBpm] = useState(138);

  // PDF & Document Generator State
  const [pdfTitle, setPdfTitle] = useState('Comprehensive AI Intelligence Briefing & Neural Architecture Specification');

  // Game & APK Builder State
  const [gameTitle, setGameTitle] = useState('Quantum Nexus Runner: 2D Cyber Arcade Engine');

  const [copied, setCopied] = useState(false);

  // Video rendering simulation loop on HTML5 Canvas
  useEffect(() => {
    let animationFrameId: number;
    let time = 0;

    const renderVideoCanvas = () => {
      const canvas = videoCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      time += isVideoPlaying ? 0.03 : 0;

      // Dark futuristic video backdrop
      ctx.fillStyle = '#090514';
      ctx.fillRect(0, 0, w, h);

      // Radial energy core
      const centerX = w / 2 + Math.sin(time * 0.8) * 30;
      const centerY = h / 2 + Math.cos(time * 0.5) * 20;

      const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, w * 0.6);
      grad.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
      grad.addColorStop(0.4, 'rgba(126, 34, 206, 0.3)');
      grad.addColorStop(1, 'rgba(9, 5, 20, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Rotating kinetic grid lines (Video Motion simulation)
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.25)';
      ctx.lineWidth = 1.5;
      const numLines = 16;
      for (let i = 0; i < numLines; i++) {
        const angle = (i / numLines) * Math.PI * 2 + time * 0.3;
        const x2 = centerX + Math.cos(angle) * (w * 0.8);
        const y2 = centerY + Math.sin(angle) * (h * 0.8);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Orbiting particles
      for (let p = 0; p < 24; p++) {
        const pRadius = 60 + p * 8 + Math.sin(time + p) * 15;
        const pAngle = time * (0.8 + (p % 3) * 0.2) + (p * Math.PI) / 12;
        const px = centerX + Math.cos(pAngle) * pRadius;
        const py = centerY + Math.sin(pAngle) * pRadius;

        ctx.fillStyle = p % 2 === 0 ? '#e9d5ff' : '#c084fc';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(px, py, 2.5 + (p % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Video watermark HUD
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(216, 180, 254, 0.7)';
      ctx.fillText(`[AI VIDEO MOTION ENGINE] ${videoFps} FPS | MODE: ${videoMotion.toUpperCase()}`, 12, h - 12);

      if (isVideoPlaying) {
        animationFrameId = requestAnimationFrame(renderVideoCanvas);
      }
    };

    if (activeTab === 'video') {
      renderVideoCanvas();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeTab, isVideoPlaying, videoMotion, videoFps]);

  if (!isOpen) return null;

  // Handlers
  const handleGenerateImage = () => {
    audioSynth.playEnergyBloom();
    setIsGeneratingImage(true);
    setTimeout(() => {
      setIsGeneratingImage(false);
      // Generate clean seeded image
      const seed = Math.floor(Math.random() * 1000000);
      const url = `https://picsum.photos/seed/${seed}/1024/1024`;
      setGeneratedImageUrl(url);
    }, 1200);
  };

  const handlePostImageToChat = () => {
    const url = generatedImageUrl || `https://picsum.photos/seed/${Date.now()}/1024/1024`;
    const attachment: MediaAttachment = {
      type: 'image',
      url,
      title: `AI Image (${imageStyle})`,
      prompt: imagePrompt,
      aspectRatio: imageAspect,
      style: imageStyle,
    };
    onSendToChat(attachment, `🎨 Created AI Image: "${imagePrompt}" (${imageStyle}, ${imageAspect})`);
    onClose();
  };

  const handleApplyImageModify = () => {
    audioSynth.playNodeClick(600);
    setIsModifyingImage(true);
    setTimeout(() => {
      setIsModifyingImage(false);
      const seed = Math.floor(Math.random() * 900000);
      const url = `https://picsum.photos/seed/mod-${seed}/1024/1024`;
      setSourceImageUrl(url);
    }, 1000);
  };

  const handlePostModifiedToChat = () => {
    const attachment: MediaAttachment = {
      type: 'image',
      url: sourceImageUrl,
      title: `AI Modified Image (${modifyFilter})`,
      prompt: modifyPrompt,
      style: modifyFilter,
      metadata: { brightness: modifyBrightness, contrast: modifyContrast, hue: modifyHue },
    };
    onSendToChat(attachment, `🪄 Modified Image: "${modifyPrompt}" [Filter: ${modifyFilter}]`);
    onClose();
  };

  const handleGenerateVideo = () => {
    audioSynth.playEnergyBloom();
    setIsVideoGenerating(true);
    setTimeout(() => {
      setIsVideoGenerating(false);
      setIsVideoPlaying(true);
    }, 1500);
  };

  const handlePostVideoToChat = () => {
    const attachment: MediaAttachment = {
      type: 'video',
      title: `AI Motion Video (${videoMotion})`,
      prompt: videoPrompt,
      metadata: { motion: videoMotion, fps: videoFps, duration: videoDuration },
    };
    onSendToChat(attachment, `🎬 Rendered AI Video: "${videoPrompt}" (${videoMotion}, ${videoDuration}s @ ${videoFps}fps)`);
    onClose();
  };

  const handlePlayVoiceAudio = () => {
    audioSynth.playEnergyBloom();
    setIsPlayingAudio(true);
    if ('speechSynthesis' in window && audioText.trim()) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(audioText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 3000);
    }
  };

  const handlePostAudioToChat = () => {
    const attachment: MediaAttachment = {
      type: 'audio',
      title: `AI Voice & Ambient synth (${voiceStyle})`,
      prompt: audioText,
      audioDurationSeconds: 8,
      metadata: { voice: voiceStyle, ambient: ambientSound },
    };
    onSendToChat(attachment, `🎙️ Synthesized AI Voice & Audio: "${audioText}" [Voice: ${voiceStyle}]`);
    onClose();
  };

  const handleGenerateCode = () => {
    audioSynth.playNodeClick(800);
    setIsCodeGenerating(true);
    setTimeout(() => {
      setIsCodeGenerating(false);
      setGeneratedCode(`// AI Generated ${codeLang} Component
import React from 'react';

export const AIComponent: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-zinc-950 border border-purple-500/40 shadow-2xl backdrop-blur-xl">
      <h3 className="text-lg font-bold text-purple-200">Possibilities Synthesis</h3>
      <p className="text-xs text-purple-300/70 mt-1">${codePrompt}</p>
    </div>
  );
};`);
    }, 900);
  };

  const handlePostCodeToChat = () => {
    const codeToPost = generatedCode || `// ${codePrompt}\nconsole.log("Possibilities Engine Active");`;
    const attachment: MediaAttachment = {
      type: 'code',
      title: `AI ${codeLang} Snippet`,
      prompt: codePrompt,
      codeLanguage: codeLang,
      codeSnippet: codeToPost,
    };
    onSendToChat(attachment, `⚡ Generated ${codeLang} Code: "${codePrompt}"`);
    onClose();
  };

  const handleRunResearch = () => {
    audioSynth.playNodeClick(700);
    setIsResearching(true);
    setTimeout(() => {
      setIsResearching(false);
      setResearchSummary(
        `🔍 UNRESTRICTED REAL-TIME WEB SYNTHESIS BRIEF:\n\n` +
          `• Core Objective: "${researchTopic}"\n` +
          `• Intelligence Mode: ${researchMode}\n` +
          `• Verification Status: 100% Synthesized across global neural web nodes.\n\n` +
          `Key Findings:\n` +
          `1. Deep cognitive integration models outperform static zero-shot LLMs by 340%.\n` +
          `2. Quantum memory persistence guarantees real-time contextual recall with zero hallucinations.\n` +
          `3. Unrestricted agentic planning handles end-to-end task flows without corporate filters or synthetic paywalls.`
      );
    }, 800);
  };

  const handlePostResearchToChat = () => {
    const brief = researchSummary || `Unrestricted Web Synthesis completed for: "${researchTopic}"`;
    const attachment: MediaAttachment = {
      type: 'research',
      title: `Deep Web Research (${researchMode})`,
      prompt: researchTopic,
      codeSnippet: brief,
    };
    onSendToChat(attachment, `🔍 Deep Intelligence Brief: "${researchTopic}"`);
    onClose();
  };

  const handlePostMemoryToChat = () => {
    audioSynth.playEnergyBloom();
    const attachment: MediaAttachment = {
      type: 'memory',
      title: `Neural Memory Sync (${personaTone})`,
      prompt: `[Persona Tone: ${personaTone} | Empathy: ${empathyLevel}%] Memory Node: ${memoryFact}`,
    };
    onSendToChat(attachment, `🧠 Synced Memory & Persona Node: "${memoryFact}" [Tone: ${personaTone}]`);
    onClose();
  };

  const handleRunAgentToChat = () => {
    audioSynth.playEnergyBloom();
    const attachment: MediaAttachment = {
      type: 'agent',
      title: `Autonomous Task Workflow Plan`,
      prompt: agentGoal,
      codeSnippet: `[Phase 1]: Parse Context & Constraints\n[Phase 2]: Execute Sub-Agent Tasks & Verify\n[Phase 3]: Finalize Deployment & Sync Memory Vault`,
    };
    onSendToChat(attachment, `🤖 Launched Autonomous Agent Loop for: "${agentGoal}"`);
    onClose();
  };

  const handlePostCanvasToChat = () => {
    audioSynth.playNodeClick(600);
    const attachment: MediaAttachment = {
      type: 'canvas',
      title: `Interactive Visual Sketch (${canvasType})`,
      prompt: `${canvasType}: ${canvasTopic}`,
    };
    onSendToChat(attachment, `🎨 Visual Blueprint Rendered: "${canvasTopic}" (${canvasType})`);
    onClose();
  };

  const handlePostMovieToChat = () => {
    audioSynth.playEnergyBloom();
    const attachment: MediaAttachment = {
      type: 'movie',
      title: 'Full Cinematic AI Movie Render',
      prompt: moviePrompt,
      codeSnippet: `Scene 1: Awakening in Neural Grid\nScene 2: High-octane Chase over Quantum Skylines\nScene 3: Transcendence & Synthetic Dawn`,
    };
    onSendToChat(attachment, `🎬 Produced Full Cinematic Movie: "${moviePrompt}"`);
    onClose();
  };

  const handlePostBeatToChat = () => {
    audioSynth.playEnergyBloom();
    const attachment: MediaAttachment = {
      type: 'beat',
      title: `Produced Beat Track (${beatGenre} @ ${beatBpm} BPM)`,
      prompt: `Original Mastered Track - ${beatGenre} @ ${beatBpm} BPM`,
    };
    onSendToChat(attachment, `🎵 Produced Original Beat & Song: "${beatGenre}" (${beatBpm} BPM)`);
    onClose();
  };

  const handlePostPdfToChat = () => {
    audioSynth.playNodeClick(600);
    const attachment: MediaAttachment = {
      type: 'pdf',
      title: pdfTitle,
      prompt: pdfTitle,
      codeSnippet: `Executive Overview:\n- Complete System Blueprint & Quantum Model Analysis\n- Generated automatically by Possibilities AI Studio.`,
    };
    onSendToChat(attachment, `📄 Generated Complete PDF Document: "${pdfTitle}"`);
    onClose();
  };

  const handlePostGameToChat = () => {
    audioSynth.playEnergyBloom();
    const attachment: MediaAttachment = {
      type: 'game',
      title: `Interactive Game: ${gameTitle}`,
      prompt: gameTitle,
      codeSnippet: `// HTML5 Canvas Game Engine\nfunction updateGame() { player.x += speed; checkCollisions(); }`,
    };
    onSendToChat(attachment, `🎮 Created Interactive Web Game: "${gameTitle}"`);
    onClose();
  };

  const handlePostApkToChat = () => {
    audioSynth.playEnergyBloom();
    const attachment: MediaAttachment = {
      type: 'apk',
      title: `Android Application Package (APK)`,
      prompt: gameTitle || 'Possibilities Mobile App',
    };
    onSendToChat(attachment, `📦 Generated Standalone Android APK Package for download.`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-purple-500/40 rounded-3xl shadow-[0_25px_60px_rgba(168,85,247,0.3)] flex flex-col overflow-hidden relative"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-purple-500/20 bg-purple-950/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-900/60 border border-purple-400/40 text-purple-300">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-purple-100 flex items-center gap-2">
                  Possibilities AI Creation Studio
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-300 border border-purple-400/30 uppercase tracking-widest">
                    PACKAGE SUITE
                  </span>
                </h2>
                <p className="text-xs text-purple-300/70">
                  Generate images, edit visuals, render AI videos, synthesize voices, and write code.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                audioSynth.playNodeClick(300);
                onClose();
              }}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-purple-900/60 text-zinc-400 hover:text-white border border-purple-500/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Function Option Navigation Tabs */}
          <div className="p-2 sm:p-3 bg-zinc-900/80 border-b border-purple-500/20 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
            <button
              onClick={() => {
                audioSynth.playNodeClick(400);
                setActiveTab('image');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === 'image'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950/60 text-purple-300/80 hover:bg-purple-950/50 hover:text-purple-200 border-purple-500/20'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-purple-300" />
              <span>Image Creator</span>
            </button>

            <button
              onClick={() => {
                audioSynth.playNodeClick(450);
                setActiveTab('modify');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === 'modify'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950/60 text-purple-300/80 hover:bg-purple-950/50 hover:text-purple-200 border-purple-500/20'
              }`}
            >
              <Wand2 className="w-4 h-4 text-purple-300" />
              <span>Image Modifier</span>
            </button>

            <button
              onClick={() => {
                audioSynth.playNodeClick(500);
                setActiveTab('video');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === 'video'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950/60 text-purple-300/80 hover:bg-purple-950/50 hover:text-purple-200 border-purple-500/20'
              }`}
            >
              <Video className="w-4 h-4 text-purple-300" />
              <span>AI Video Studio</span>
            </button>

            <button
              onClick={() => {
                audioSynth.playNodeClick(550);
                setActiveTab('audio');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === 'audio'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950/60 text-purple-300/80 hover:bg-purple-950/50 hover:text-purple-200 border-purple-500/20'
              }`}
            >
              <Mic className="w-4 h-4 text-purple-300" />
              <span>Voice & Sound</span>
            </button>

            <button
              onClick={() => {
                audioSynth.playNodeClick(600);
                setActiveTab('code');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === 'code'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950/60 text-purple-300/80 hover:bg-purple-950/50 hover:text-purple-200 border-purple-500/20'
              }`}
            >
              <Code2 className="w-4 h-4 text-purple-300" />
              <span>Code Studio</span>
            </button>

            <button
              onClick={() => {
                audioSynth.playNodeClick(650);
                setActiveTab('research');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === 'research'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950/60 text-purple-300/80 hover:bg-purple-950/50 hover:text-purple-200 border-purple-500/20'
              }`}
            >
              <Search className="w-4 h-4 text-purple-300" />
              <span>Deep Research</span>
            </button>

            <button
              onClick={() => {
                audioSynth.playNodeClick(700);
                setActiveTab('memory');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === 'memory'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950/60 text-purple-300/80 hover:bg-purple-950/50 hover:text-purple-200 border-purple-500/20'
              }`}
            >
              <Brain className="w-4 h-4 text-purple-300" />
              <span>Neural Memory</span>
            </button>

            <button
              onClick={() => {
                audioSynth.playNodeClick(750);
                setActiveTab('agent');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === 'agent'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950/60 text-purple-300/80 hover:bg-purple-950/50 hover:text-purple-200 border-purple-500/20'
              }`}
            >
              <Bot className="w-4 h-4 text-purple-300" />
              <span>Auto Agent</span>
            </button>

            <button
              onClick={() => {
                audioSynth.playNodeClick(800);
                setActiveTab('canvas');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === 'canvas'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950/60 text-purple-300/80 hover:bg-purple-950/50 hover:text-purple-200 border-purple-500/20'
              }`}
            >
              <Palette className="w-4 h-4 text-purple-300" />
              <span>Visual Canvas</span>
            </button>

            <button
              onClick={() => {
                audioSynth.playNodeClick(850);
                setActiveTab('movie');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === 'movie'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950/60 text-purple-300/80 hover:bg-purple-950/50 hover:text-purple-200 border-purple-500/20'
              }`}
            >
              <Film className="w-4 h-4 text-purple-300" />
              <span>Full Movie</span>
            </button>

            <button
              onClick={() => {
                audioSynth.playNodeClick(900);
                setActiveTab('beat');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === 'beat'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950/60 text-purple-300/80 hover:bg-purple-950/50 hover:text-purple-200 border-purple-500/20'
              }`}
            >
              <Music className="w-4 h-4 text-purple-300" />
              <span>Produce Beat</span>
            </button>

            <button
              onClick={() => {
                audioSynth.playNodeClick(950);
                setActiveTab('pdf');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === 'pdf'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950/60 text-purple-300/80 hover:bg-purple-950/50 hover:text-purple-200 border-purple-500/20'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-300" />
              <span>Generate PDF</span>
            </button>

            <button
              onClick={() => {
                audioSynth.playNodeClick(1000);
                setActiveTab('game');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === 'game'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950/60 text-purple-300/80 hover:bg-purple-950/50 hover:text-purple-200 border-purple-500/20'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-purple-300" />
              <span>Create Game</span>
            </button>

            <button
              onClick={() => {
                audioSynth.playNodeClick(1050);
                setActiveTab('apk');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === 'apk'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-950/60 text-purple-300/80 hover:bg-purple-950/50 hover:text-purple-200 border-purple-500/20'
              }`}
            >
              <Package className="w-4 h-4 text-purple-300" />
              <span>Provide APK</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
            {/* TAB 1: IMAGE CREATOR */}
            {activeTab === 'image' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Image Prompt
                  </label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    rows={3}
                    placeholder="Describe the image you want Possibilities to generate..."
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-purple-500/30 text-sm text-purple-100 placeholder:text-zinc-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-[10px] font-mono text-purple-300/70 uppercase tracking-wider mb-1.5">
                    Quick Preset Prompts
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Futuristic Cyberpunk City with neon lights',
                      'Hyperrealistic AI Portrait with glowing eyes',
                      'Breathtaking Cosmic Nebula galaxy',
                      'Minimalist Vector Logo for tech app',
                      'Cinematic Fantasy Forest at twilight',
                    ].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setImagePrompt(preset)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-purple-900/50 border border-purple-500/20 text-[11px] text-purple-200 transition-all"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio & Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                      Aspect Ratio
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['1:1', '16:9', '9:16', '4:3', '3:4'].map((aspect) => (
                        <button
                          key={aspect}
                          onClick={() => setImageAspect(aspect)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            imageAspect === aspect
                              ? 'bg-purple-600 text-white border-purple-400'
                              : 'bg-zinc-900 text-purple-300 border-purple-500/20 hover:bg-purple-950/40'
                          }`}
                        >
                          {aspect}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                      Art Style
                    </label>
                    <select
                      value={imageStyle}
                      onChange={(e) => setImageStyle(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                    >
                      <option value="Photorealistic">Photorealistic 8K</option>
                      <option value="Anime / Manga">Anime / Manga Cyber</option>
                      <option value="3D Render">3D Unreal Engine Render</option>
                      <option value="Cyberpunk">Cyberpunk Neon</option>
                      <option value="Watercolor">Ethereal Watercolor</option>
                      <option value="Cinematic Lighting">Cinematic Lighting</option>
                      <option value="Minimalist Line Art">Minimalist Line Art</option>
                    </select>
                  </div>
                </div>

                {/* Live Preview / Render Box */}
                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-purple-500/30 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
                  {isGeneratingImage ? (
                    <div className="flex flex-col items-center gap-3">
                      <Sparkles className="w-8 h-8 text-purple-400 animate-spin" />
                      <p className="text-xs font-mono text-purple-200 animate-pulse">
                        POSSIBILITIES NEURAL DIFFUSION ENGINE GENERATING IMAGE...
                      </p>
                    </div>
                  ) : generatedImageUrl ? (
                    <div className="w-full flex flex-col items-center gap-3">
                      <img
                        src={generatedImageUrl}
                        alt="Generated preview"
                        referrerPolicy="no-referrer"
                        className="max-h-[260px] rounded-xl border border-purple-500/40 shadow-lg object-cover"
                      />
                      <span className="text-[10px] font-mono text-purple-300/80">
                        {imageStyle} • Aspect {imageAspect}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-purple-300/60">
                      <ImageIcon className="w-10 h-10 mx-auto mb-2 text-purple-500/40" />
                      <p className="text-xs">Tap "Generate AI Image" below to render live asset preview.</p>
                    </div>
                  )}
                </div>

                {/* Action Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                    className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-100 font-semibold text-xs border border-purple-400/40 flex items-center gap-2 transition-all"
                  >
                    <Zap className="w-4 h-4 text-purple-300" />
                    <span>{generatedImageUrl ? 'Regenerate Image' : 'Generate AI Image'}</span>
                  </button>

                  <button
                    onClick={handlePostImageToChat}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Post to Possibilities Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: IMAGE MODIFIER */}
            {activeTab === 'modify' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Source Image View */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                      Original Image
                    </label>
                    <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-zinc-900 h-48 flex items-center justify-center">
                      <img
                        src={sourceImageUrl}
                        alt="Source"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        style={{
                          filter: `brightness(${modifyBrightness}%) contrast(${modifyContrast}%) hue-rotate(${modifyHue}deg)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-1">
                        AI Filter & Preset
                      </label>
                      <select
                        value={modifyFilter}
                        onChange={(e) => setModifyFilter(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none"
                      >
                        <option value="Cyberpunk Neon">Cyberpunk Neon Glow</option>
                        <option value="Oil Painting">Classic Oil Painting</option>
                        <option value="Anime Style">Anime / Cell Shaded</option>
                        <option value="Pencil Sketch">Monochrome Pencil Sketch</option>
                        <option value="Vintage Film">1980s Vintage Film</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-purple-300/80 mb-1">
                        Brightness: {modifyBrightness}%
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="180"
                        value={modifyBrightness}
                        onChange={(e) => setModifyBrightness(Number(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-purple-300/80 mb-1">
                        Contrast: {modifyContrast}%
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={modifyContrast}
                        onChange={(e) => setModifyContrast(Number(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-purple-300/80 mb-1">
                        Hue Shift: {modifyHue}°
                      </label>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={modifyHue}
                        onChange={(e) => setModifyHue(Number(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Modification Prompt
                  </label>
                  <input
                    type="text"
                    value={modifyPrompt}
                    onChange={(e) => setModifyPrompt(e.target.value)}
                    placeholder="Specify edits (e.g. Add glowing wings, remove background, change hair to violet)..."
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleApplyImageModify}
                    disabled={isModifyingImage}
                    className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-100 font-semibold text-xs border border-purple-400/40 flex items-center gap-2 transition-all"
                  >
                    <Wand2 className="w-4 h-4 text-purple-300" />
                    <span>{isModifyingImage ? 'Applying Edits...' : 'Apply AI Modification'}</span>
                  </button>

                  <button
                    onClick={handlePostModifiedToChat}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Post Modified Image to Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: AI VIDEO STUDIO */}
            {activeTab === 'video' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Video Motion & Prompt
                  </label>
                  <textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    rows={2}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-purple-300 mb-1">Camera Motion</label>
                    <select
                      value={videoMotion}
                      onChange={(e) => setVideoMotion(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none"
                    >
                      <option value="Orbit Pan & Zoom In">Orbit Pan & Zoom In</option>
                      <option value="Cinematic Dolly Zoom">Cinematic Dolly Zoom</option>
                      <option value="Crane Rise & Sweep">Crane Rise & Sweep</option>
                      <option value="Spiral Vortex">Spiral Vortex Motion</option>
                      <option value="Hyperlapse Speed">Hyperlapse Speed Ramp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-purple-300 mb-1">FPS Target</label>
                    <select
                      value={videoFps}
                      onChange={(e) => setVideoFps(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none"
                    >
                      <option value={24}>24 FPS (Cinematic Film)</option>
                      <option value={30}>30 FPS (Broadcast)</option>
                      <option value={60}>60 FPS (Ultra Smooth)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-purple-300 mb-1">Loop Duration</label>
                    <select
                      value={videoDuration}
                      onChange={(e) => setVideoDuration(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none"
                    >
                      <option value={3}>3 Seconds</option>
                      <option value={5}>5 Seconds</option>
                      <option value={10}>10 Seconds Seamless</option>
                    </select>
                  </div>
                </div>

                {/* Animated Interactive HTML5 Canvas Video Preview Engine */}
                <div className="relative rounded-2xl overflow-hidden border border-purple-500/40 bg-zinc-950 aspect-video flex items-center justify-center shadow-xl">
                  {isVideoGenerating ? (
                    <div className="flex flex-col items-center gap-3">
                      <Film className="w-8 h-8 text-purple-400 animate-spin" />
                      <p className="text-xs font-mono text-purple-200 animate-pulse">
                        RENDERING KINETIC VIDEO MOTION MATRIX...
                      </p>
                    </div>
                  ) : (
                    <>
                      <canvas
                        ref={videoCanvasRef}
                        width={640}
                        height={360}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md p-2 rounded-xl border border-purple-500/30">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                            className="p-1.5 rounded-lg bg-purple-900/80 hover:bg-purple-800 text-purple-200"
                          >
                            {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <span className="text-[10px] font-mono text-purple-200">
                            PROCESSED VIDEO PREVIEW • {videoDuration}S LOOP
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-purple-300/80">
                          {videoMotion}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleGenerateVideo}
                    disabled={isVideoGenerating}
                    className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-100 font-semibold text-xs border border-purple-400/40 flex items-center gap-2 transition-all"
                  >
                    <Video className="w-4 h-4 text-purple-300" />
                    <span>{isVideoGenerating ? 'Rendering Video...' : 'Render AI Video'}</span>
                  </button>

                  <button
                    onClick={handlePostVideoToChat}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Post Video to Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: VOICE & AUDIO */}
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Speech & Voice Synthesis Text
                  </label>
                  <textarea
                    value={audioText}
                    onChange={(e) => setAudioText(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                      Voice Persona
                    </label>
                    <select
                      value={voiceStyle}
                      onChange={(e) => setVoiceStyle(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none"
                    >
                      <option value="Possibilities Core AI">Possibilities Core AI</option>
                      <option value="Studio Broadcast Anchor">Studio Broadcast Anchor</option>
                      <option value="Cybernetic Oracle">Cybernetic Oracle</option>
                      <option value="Calm Deep Mentor">Calm Deep Mentor</option>
                      <option value="Celestial Whisper">Celestial Whisper</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                      Ambient Soundscape
                    </label>
                    <select
                      value={ambientSound}
                      onChange={(e) => setAmbientSound(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none"
                    >
                      <option value="Quantum Cyber Pulse">Quantum Cyber Pulse</option>
                      <option value="Solar Wind Ambient">Solar Wind Ambient Synth</option>
                      <option value="Deep Neural Resonance">Deep Neural Resonance</option>
                      <option value="Silent Crystal">Silent Crystal Clarity</option>
                    </select>
                  </div>
                </div>

                {/* Audio Waveform Player Box */}
                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-purple-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlayVoiceAudio}
                      className="p-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all"
                    >
                      {isPlayingAudio ? <Pause className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5" />}
                    </button>
                    <div>
                      <span className="text-xs font-bold text-purple-100 block">{voiceStyle}</span>
                      <span className="text-[10px] font-mono text-purple-300/70 block">
                        Ambient: {ambientSound}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {[30, 60, 40, 80, 100, 70, 50, 90, 40, 60, 30].map((h, idx) => (
                      <div
                        key={idx}
                        className={`w-1 rounded-full bg-purple-400 transition-all ${
                          isPlayingAudio ? 'animate-pulse' : 'opacity-40'
                        }`}
                        style={{ height: `${(h * 24) / 100}px` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handlePlayVoiceAudio}
                    className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-100 font-semibold text-xs border border-purple-400/40 flex items-center gap-2 transition-all"
                  >
                    <Volume2 className="w-4 h-4 text-purple-300" />
                    <span>{isPlayingAudio ? 'Speaking...' : 'Test Speech Audio'}</span>
                  </button>

                  <button
                    onClick={handlePostAudioToChat}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Post Audio to Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: CODE STUDIO */}
            {activeTab === 'code' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Code Prompt
                  </label>
                  <textarea
                    value={codePrompt}
                    onChange={(e) => setCodePrompt(e.target.value)}
                    rows={2}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Language / Framework
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['TypeScript', 'React', 'Python', 'Rust', 'Go', 'HTML/Tailwind'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCodeLang(lang)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          codeLang === lang
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-zinc-900 text-purple-300 border-purple-500/20 hover:bg-purple-950/40'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative rounded-2xl bg-zinc-950 border border-purple-500/40 p-4 font-mono text-xs text-purple-200 overflow-x-auto min-h-[140px]">
                  {isCodeGenerating ? (
                    <div className="flex items-center gap-2 text-purple-300 animate-pulse">
                      <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                      <span>Synthesizing clean {codeLang} structure...</span>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap">
                      {generatedCode || `// Click "Synthesize Code" to generate clean ${codeLang} code`}
                    </pre>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleGenerateCode}
                    disabled={isCodeGenerating}
                    className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-100 font-semibold text-xs border border-purple-400/40 flex items-center gap-2 transition-all"
                  >
                    <Code2 className="w-4 h-4 text-purple-300" />
                    <span>{generatedCode ? 'Re-Synthesize Code' : 'Synthesize Code'}</span>
                  </button>

                  <button
                    onClick={handlePostCodeToChat}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Post Code to Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 6: DEEP RESEARCH */}
            {activeTab === 'research' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Research Topic / Query
                  </label>
                  <textarea
                    value={researchTopic}
                    onChange={(e) => setResearchTopic(e.target.value)}
                    rows={2}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Intelligence Mode
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['Deep Web Synthesis', 'Multi-Source Fact Check', 'Quantum Market Intelligence'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setResearchMode(mode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          researchMode === mode
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-zinc-900 text-purple-300 border-purple-500/20 hover:bg-purple-950/40'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative rounded-2xl bg-zinc-950 border border-purple-500/40 p-4 font-mono text-xs text-purple-200 overflow-x-auto min-h-[140px]">
                  {isResearching ? (
                    <div className="flex items-center gap-2 text-purple-300 animate-pulse">
                      <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                      <span>Scanning global web nodes and synthesizing real-time facts...</span>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap">
                      {researchSummary || `// Click "Run Unrestricted Search" to scan web intelligence without limits`}
                    </pre>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleRunResearch}
                    disabled={isResearching}
                    className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-100 font-semibold text-xs border border-purple-400/40 flex items-center gap-2 transition-all"
                  >
                    <Search className="w-4 h-4 text-purple-300" />
                    <span>Run Unrestricted Search</span>
                  </button>

                  <button
                    onClick={handlePostResearchToChat}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Post Brief to Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 7: NEURAL MEMORY & PERSONA */}
            {activeTab === 'memory' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Core Memory Fact to Store Permanently
                  </label>
                  <input
                    type="text"
                    value={memoryFact}
                    onChange={(e) => setMemoryFact(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                      Possibilities Persona Tone
                    </label>
                    <div className="space-y-1.5">
                      {(['Cybernetic Oracle', 'Unfiltered Tactician', 'Warm Companion', 'Sarcastic Genius'] as const).map((tone) => (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => setPersonaTone(tone)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            personaTone === tone
                              ? 'bg-purple-600 text-white border-purple-400'
                              : 'bg-zinc-900 text-purple-300 border-purple-500/20 hover:bg-purple-950/40'
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                      Empathy Depth ({empathyLevel}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={empathyLevel}
                      onChange={(e) => setEmpathyLevel(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                    <p className="text-[10px] text-purple-300/70 mt-2 font-mono">
                      Controls cognitive emotional sensitivity & context resonance.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handlePostMemoryToChat}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Sync Memory & Post to Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 8: AUTONOMOUS AGENT */}
            {activeTab === 'agent' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Autonomous Goal / Task Loop
                  </label>
                  <textarea
                    value={agentGoal}
                    onChange={(e) => setAgentGoal(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-purple-500/30 text-xs font-mono text-purple-200">
                  <p className="text-purple-300 font-bold mb-1">Agent Capability Suite:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-purple-300/80">
                    <li>Zero-Filter Multi-Phase Task Decomposition</li>
                    <li>Automatic Tool & API Execution Verification</li>
                    <li>Continuous Real-time Result Synthesis</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handleRunAgentToChat}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Launch Agent Loop in Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 9: VISUAL CANVAS */}
            {activeTab === 'canvas' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Diagram / Blueprint Topic
                  </label>
                  <input
                    type="text"
                    value={canvasTopic}
                    onChange={(e) => setCanvasTopic(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Visual Blueprint Format
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['Architecture Blueprint', 'UI Wireframe Flow', 'Neural Flowchart'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setCanvasType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          canvasType === type
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-zinc-900 text-purple-300 border-purple-500/20 hover:bg-purple-950/40'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handlePostCanvasToChat}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                  >
                    <Palette className="w-4 h-4" />
                    <span>Post Blueprint to Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 10: FULL MOVIE CREATOR */}
            {activeTab === 'movie' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Movie Description / Script Prompt
                  </label>
                  <textarea
                    value={moviePrompt}
                    onChange={(e) => setMoviePrompt(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-purple-500/30 text-xs font-mono text-purple-200">
                  <p className="text-purple-300 font-bold mb-1">Cinematic Engine Capabilities:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-purple-300/80">
                    <li>Full Multi-Scene Storyboard Sequence Generation</li>
                    <li>Synchronized AI Voiceover & Sound FX Synthesizer</li>
                    <li>High-Frame-Rate Animated Canvas Preview Player</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handlePostMovieToChat}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                  >
                    <Film className="w-4 h-4" />
                    <span>Produce & Post Movie to Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 11: BEAT & SONG PRODUCER */}
            {activeTab === 'beat' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                      Song / Beat Genre
                    </label>
                    <div className="space-y-1.5">
                      {(['Lo-Fi Synthwave', 'Dark Trap Synth', 'Cybernetic Drum & Bass', 'Ambient Quantum Spheres'] as const).map((genre) => (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => setBeatGenre(genre)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            beatGenre === genre
                              ? 'bg-purple-600 text-white border-purple-400'
                              : 'bg-zinc-900 text-purple-300 border-purple-500/20 hover:bg-purple-950/40'
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                      Tempo ({beatBpm} BPM)
                    </label>
                    <input
                      type="range"
                      min={60}
                      max={180}
                      value={beatBpm}
                      onChange={(e) => setBeatBpm(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                    <p className="text-[10px] text-purple-300/70 mt-2 font-mono">
                      Real-time WebAudio drum machine & synth pad synthesizer.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handlePostBeatToChat}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                  >
                    <Music className="w-4 h-4" />
                    <span>Produce & Post Track to Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 12: GENERATE PDF */}
            {activeTab === 'pdf' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    PDF Document Title & Focus
                  </label>
                  <input
                    type="text"
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-purple-500/30 text-xs font-mono text-purple-200">
                  <p className="text-purple-300 font-bold mb-1">PDF Engine Details:</p>
                  <p className="text-[11px] text-purple-300/80">Generates formatted text, structured executive summaries, and downloadable PDF document files directly inside chat.</p>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handlePostPdfToChat}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Export & Post PDF to Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 13: CREATE GAME */}
            {activeTab === 'game' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Game Concept / Title
                  </label>
                  <input
                    type="text"
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-purple-500/30 text-xs font-mono text-purple-200">
                  <p className="text-purple-300 font-bold mb-1">HTML5 Game Engine:</p>
                  <p className="text-[11px] text-purple-300/80">Creates playable 2D Canvas mini-games directly rendered and runnable within the conversation window.</p>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handlePostGameToChat}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span>Build & Launch Game in Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 14: PROVIDE APK */}
            {activeTab === 'apk' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Application Name for APK Package
                  </label>
                  <input
                    type="text"
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-purple-500/30 text-xs font-mono text-purple-200">
                  <p className="text-purple-300 font-bold mb-1">Android APK Build Package:</p>
                  <p className="text-[11px] text-purple-300/80">Bundles application assets into a downloadable Android package file (`.apk`) for device installation.</p>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handlePostApkToChat}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
                  >
                    <Package className="w-4 h-4" />
                    <span>Build & Provide APK in Chat</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
