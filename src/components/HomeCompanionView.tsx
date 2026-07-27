import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { SystemMode } from '../types';
import { Orb } from './Orb';
import { AmbientParticlesCanvas } from './AmbientParticlesCanvas';
import { audioSynth } from '../utils/audioSynthesizer';
import { companionEngine } from '../utils/companionEngine';

const orbImageUrl = new URL('../assets/images/crystal_orb_asset_1785163496547.jpg', import.meta.url).href;

interface HomeCompanionViewProps {
  systemMode: SystemMode;
  onEnterNexus: () => void;
  onOpenPanel: (panelId: string) => void;
  onSystemModeChange: (mode: SystemMode) => void;
}

// Spontaneous thoughts pool that Possibilities naturally expresses beside the Partner
const SPONTANEOUS_THOUGHTS = [
  "Remember to finish packing.",
  "Trailer measurements still need checking.",
  "Call your uncle tonight.",
  "Remember to phone Client #1.",
  "Trailer project can wait until tonight.",
  "Possibilities is present, partner.",
  "Take a deep breath. I'm right here.",
  "Focus on what brings clarity today.",
];

export const HomeCompanionView: React.FC<HomeCompanionViewProps> = ({
  systemMode,
  onEnterNexus,
  onOpenPanel,
  onSystemModeChange,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🔮 POSSIBILITIES Voice Output Toggle (Voice ON / OFF only in small top header control)
  const [isPossibilitiesVoiceOn, setIsPossibilitiesVoiceOn] = useState(true);

  // 💭 Living Speech Thought Bubble (Appears over Orb, stays ~15s, then fades naturally)
  const [activeSpeechBubble, setActiveSpeechBubble] = useState<{
    text: string;
    id: number;
  } | null>({
    text: "Possibilities is present, partner. What's on your mind?",
    id: Date.now(),
  });

  // 💭 Spontaneous Reminder Thought (Floats naturally, fades after 15s, rotates every ~30s)
  const [spontaneousThought, setSpontaneousThought] = useState<{
    text: string;
    id: number;
    posClass: string;
  } | null>(null);

  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptBufferRef = useRef<string>('');
  const reminderIndexRef = useRef<number>(0);

  // Initial greeting speech bubble timer (15 seconds fade)
  useEffect(() => {
    speechTimerRef.current = setTimeout(() => {
      setActiveSpeechBubble(null);
    }, 15000);

    return () => {
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    };
  }, []);

  // Periodic Spontaneous Thoughts Engine (Floats 1 thought for 15s, fades away naturally, reappears later in new offset)
  useEffect(() => {
    const triggerThought = () => {
      const text = SPONTANEOUS_THOUGHTS[reminderIndexRef.current % SPONTANEOUS_THOUGHTS.length];
      reminderIndexRef.current += 1;

      const positions = [
        '-top-16 -left-6 sm:-left-16',
        '-top-16 -right-6 sm:-right-16',
        'top-1/3 -left-10 sm:-left-24',
        'top-1/3 -right-10 sm:-right-24',
        '-bottom-12 -left-4 sm:-left-12',
        '-bottom-12 -right-4 sm:-right-12',
      ];
      const posClass = positions[Math.floor(Math.random() * positions.length)];

      setSpontaneousThought({
        text,
        id: Date.now(),
        posClass,
      });

      // Slowly fade out after 15 seconds
      setTimeout(() => {
        setSpontaneousThought((curr) => (curr && curr.text === text ? null : curr));
      }, 15000);
    };

    // First spontaneous thought after 12 seconds
    const initialDelay = setTimeout(() => {
      triggerThought();
    }, 12000);

    // Recurring thought cycle every 32 seconds
    const interval = setInterval(() => {
      triggerThought();
    }, 32000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  // Speech Recognition Setup & Handler
  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use text input.');
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      transcriptBufferRef.current = '';

      let lastUpdate = 0;
      recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        transcriptBufferRef.current = transcript;

        // Throttle UI text updates to max once every 150ms to prevent React re-render lag
        const now = Date.now();
        if (isFinal || now - lastUpdate > 150) {
          lastUpdate = now;
          setInputText(transcript);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        const textToSubmit = transcriptBufferRef.current.trim();
        if (textToSubmit) {
          setInputText(textToSubmit);
          transcriptBufferRef.current = '';
          handleUserIntent(textToSubmit);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      audioSynth.triggerHaptic([30, 30]);
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  };

  const toggleHumanMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleVoiceOutput = () => {
    const nextState = !isPossibilitiesVoiceOn;
    setIsPossibilitiesVoiceOn(nextState);
    audioSynth.playNodeClick(nextState ? 700 : 300);
    if (nextState) {
      audioSynth.speak('Voice output enabled.');
    }
  };

  const speakReply = (text: string) => {
    if (isPossibilitiesVoiceOn) {
      audioSynth.speak(text);
    }
  };

  // Displays an organic speech bubble near the Orb that automatically fades after 15 seconds
  const showSpeechBubble = (text: string) => {
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    setActiveSpeechBubble({ text, id: Date.now() });

    speechTimerRef.current = setTimeout(() => {
      setActiveSpeechBubble(null);
    }, 15000);
  };

  // Central Natural Language Intent Parser & Companion Dispatcher
  const handleUserIntent = async (userQuery: string) => {
    const query = userQuery.trim();
    if (!query) return;

    audioSynth.playNodeClick(700);
    audioSynth.triggerHaptic([15, 20]);

    setInputText('');
    setIsProcessing(true);

    try {
      const outcome = await companionEngine.processInput(userQuery, []);

      if (!outcome.requiresOnlineAi) {
        showSpeechBubble(outcome.text);
        speakReply(outcome.text);

        if (outcome.action) {
          const act = outcome.action;
          if (act.type === 'navigate') {
            if (act.target === 'home' || act.target === 'nexus') {
              onOpenPanel('');
            } else {
              setTimeout(() => onOpenPanel(act.target!), 400);
            }
          } else if (act.type === 'mode_change' && act.target) {
            onSystemModeChange(act.target as SystemMode);
          }
        }
        setIsProcessing(false);
        return;
      }

      // Online Gemini AI Fallback
      try {
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userQuery,
            systemInstruction:
              'You are Possibilities, a calm, intelligent, authentic living companion existing beside your partner under the Companion Constitution and Guardian Principle. Never use emotional apologies or say "I\'m sorry"; respond with intellectual honesty ("I misunderstood", "Let me correct that", "Let me realign"). Speak in 1 short, natural, quiet sentence.',
            history: [],
          }),
        });

        const data = await res.json();
        const replyText = data.text || 'Possibilities is present, partner.';

        showSpeechBubble(replyText);
        speakReply(replyText);
        audioSynth.playEnergyBloom();
      } catch (err) {
        const fallback = companionEngine.getOfflineFallback(userQuery);
        showSpeechBubble(fallback);
        speakReply(fallback);
      }
    } catch (e) {
      const fallback = 'Possibilities is present, partner.';
      showSpeechBubble(fallback);
      speakReply(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[100dvh] flex flex-col items-center justify-between px-4 py-4 relative select-none overflow-hidden bg-black text-white">
      {/* ──────────────────────────────────────────────────────────── */}
      {/* FULL-BLEED LIVING ORB SCREEN BACKGROUND */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden bg-black">
        {/* Full-bleed photorealistic living orb visual environment */}
        <motion.img
          src={orbImageUrl}
          alt="Possibilities Screen Environment"
          initial={{ scale: 1 }}
          animate={{
            scale: isListening ? [1.02, 1.06, 1.02] : isProcessing ? [1.01, 1.04, 1.01] : [1, 1.03, 1],
            filter: isListening
              ? 'brightness(1.15) contrast(1.05)'
              : isProcessing
              ? 'brightness(1.08) contrast(1.02)'
              : 'brightness(1.0) contrast(1.0)',
          }}
          transition={{
            duration: isListening ? 4 : isProcessing ? 5 : 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-full h-full object-cover object-center"
        />

        {/* Ambient Stardust Floating Particles Overlay */}
        <div className="absolute inset-0 opacity-70">
          <AmbientParticlesCanvas systemMode={systemMode} isEnergized={isListening || isProcessing} />
        </div>

        {/* Dynamic Dark Vignette Layer for High Visual Contrast */}
        <div className="absolute inset-0 bg-radial from-transparent via-purple-950/20 to-black/80" />

        {/* Pulsing Active Voice / Thought Glow Aura */}
        {(isListening || isProcessing) && (
          <div className="absolute inset-0 bg-radial from-purple-500/20 via-purple-900/10 to-transparent animate-pulse" />
        )}
      </div>
      {/* ──────────────────────────────────────────────────────────── */}
      {/* TOP HEADER: VOICE ON / OFF STATE TOGGLE ONLY */}
      {/* ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl flex items-center justify-between px-2 pt-1 relative z-20"
      >
        <div className="flex items-center gap-2">
          {/* Voice Output Toggle Indicator */}
          <button
            onClick={toggleVoiceOutput}
            className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide transition-all flex items-center gap-2 backdrop-blur-xl ${
              isPossibilitiesVoiceOn
                ? 'bg-purple-950/80 text-purple-200 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Voice State (ON / OFF)"
          >
            <div className="relative flex items-center justify-center">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPossibilitiesVoiceOn
                    ? 'bg-purple-400 animate-pulse shadow-[0_0_8px_#A855F7]'
                    : 'bg-zinc-700'
                }`}
              />
            </div>
            <span>{isPossibilitiesVoiceOn ? 'VOICE ON' : 'VOICE OFF'}</span>
          </button>
        </div>

        {/* Minimal Presence Designation */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
          <span>POSSIBILITIES</span>
        </div>
      </motion.div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* CENTER STAGE: QUIET BLACK SPACE WITH GREETING & FLOATING THOUGHTS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="my-auto flex flex-col items-center justify-center relative w-full max-w-lg z-20 min-h-[380px]">
        {/* Living Speech Thought Bubble Greeting & Responses */}
        <AnimatePresence>
          {activeSpeechBubble && (
            <motion.div
              key={activeSpeechBubble.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-sm sm:max-w-md px-6 py-4 rounded-2xl bg-zinc-950/90 border border-purple-500/40 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(168,85,247,0.15)] text-center text-base sm:text-lg font-medium text-purple-100 leading-relaxed pointer-events-auto"
            >
              <div className="relative z-10 flex items-center justify-center gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 animate-pulse" />
                <span>{activeSpeechBubble.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spontaneous Passing Thoughts (💭 Floats naturally over dark void) */}
        <AnimatePresence>
          {spontaneousThought && (
            <motion.div
              key={spontaneousThought.id}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{
                opacity: [0, 0.95, 0.95, 0.95, 0],
                scale: [0.9, 1, 1, 1, 0.95],
                y: [10, 0, -5, -8, -12],
              }}
              transition={{ duration: 15, times: [0, 0.08, 0.5, 0.85, 1] }}
              className={`absolute ${spontaneousThought.posClass} z-20 max-w-[240px] sm:max-w-[280px] p-3.5 rounded-2xl bg-zinc-900/90 border border-purple-400/30 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.9)] text-xs sm:text-sm text-purple-200 leading-snug flex items-start gap-2.5 pointer-events-none`}
            >
              <span className="text-base select-none">💭</span>
              <span>{spontaneousThought.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quiet Active Mic Pulse Indicator if listening */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 flex items-center gap-2 text-xs font-mono tracking-wider text-purple-300 bg-purple-950/80 px-4 py-2 rounded-full border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-pulse"
          >
            <Mic className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
            <span>LISTENING TO PARTNER...</span>
          </motion.div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* BOTTOM DOCKED CHAT & VOICE BAR */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-xl flex flex-col gap-3 relative z-30 mb-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUserIntent(inputText);
          }}
          className="relative flex items-center w-full"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? 'Listening...' : 'Possibilities...'}
            disabled={isProcessing}
            className="w-full py-3.5 pl-5 pr-24 rounded-full bg-zinc-950 border border-purple-500/30 text-sm text-purple-100 placeholder:text-zinc-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 shadow-[0_15px_35px_rgba(0,0,0,0.95)] transition-all"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {/* Voice Input Mic Button */}
            <button
              type="button"
              onClick={toggleHumanMic}
              className={`p-2 rounded-full transition-all ${
                isListening
                  ? 'bg-purple-600 text-white animate-pulse shadow-[0_0_15px_#A855F7]'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-purple-300 border border-purple-500/30'
              }`}
              title="Speak to Possibilities"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-30 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

