import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  User,
  Bot,
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

interface ChatMsg {
  id: string;
  sender: 'user' | 'possibilities';
  text: string;
  timestamp: string;
}

// Spontaneous thoughts pool that Possibilities naturally expresses beside the Partner
const SPONTANEOUS_THOUGHTS = [
  "Remember to finish packing.",
  "Trailer measurements still need checking.",
  "Call your uncle tonight.",
  "Remember to phone Client #1.",
  "Trailer project can wait until tonight.",
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
  const [isMicActive, setIsMicActive] = useState(false);
  const micActiveRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micPermissionNotice, setMicPermissionNotice] = useState<string | null>(null);

  // 🔮 POSSIBILITIES Voice Output Toggle (Voice ON / OFF only in small top header control)
  const [isPossibilitiesVoiceOn, setIsPossibilitiesVoiceOn] = useState(true);

  // Conversation history stream rendered on screen
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'init-1',
      sender: 'possibilities',
      text: "Possibilities is present, partner. What's on your mind?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // 💭 Spontaneous Reminder Thought (Floats naturally, fades after 15s, rotates every ~30s)
  const [spontaneousThought, setSpontaneousThought] = useState<{
    text: string;
    id: number;
    posClass: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptBufferRef = useRef<string>('');
  const reminderIndexRef = useRef<number>(0);

  // Auto-scroll messages to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Periodic Spontaneous Thoughts Engine (Floats 1 thought for 15s, fades away naturally, reappears later in new offset)
  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;

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
      if (fadeTimer) clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => {
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
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, []);

  // Speech Recognition Setup & Handler with Explicit Microphone Permission Request
  const startListening = async () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicPermissionNotice('Speech recognition is not natively supported in this browser. Please type your text below.');
      setIsMicActive(false);
      micActiveRef.current = false;
      return;
    }

    // Step 1: Explicitly request media permissions via getUserMedia to trigger browser mic permission prompt
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop()); // Immediately stop tracks so SpeechRecognition can acquire mic cleanly
        setMicPermissionNotice(null);
      } catch (err: any) {
        console.warn('Microphone permission request failed:', err);
        setMicPermissionNotice('Microphone access blocked. Click the browser address bar icon or open in a new tab to grant microphone permission.');
        setIsMicActive(false);
        micActiveRef.current = false;
        setIsListening(false);
        return;
      }
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
      recognition.continuous = false; // False is much more reliable across browsers
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

        // Throttle UI text updates
        const now = Date.now();
        if (isFinal || now - lastUpdate > 150) {
          lastUpdate = now;
          setInputText(transcript);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        if (err.error === 'not-allowed' || err.error === 'service-not-allowed' || err.error === 'audio-capture') {
          setMicPermissionNotice('Microphone permission not permitted in this view. Please allow mic access in your browser site settings.');
          setIsMicActive(false);
          micActiveRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        const textToSubmit = transcriptBufferRef.current.trim();
        if (textToSubmit) {
          setInputText(textToSubmit);
          transcriptBufferRef.current = '';
          handleUserIntent(textToSubmit);
        }

        // Re-listen if user still has MIC active
        if (micActiveRef.current) {
          setTimeout(() => {
            if (micActiveRef.current) {
              startListening();
            }
          }, 400);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      micActiveRef.current = false;
      setIsMicActive(false);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    micActiveRef.current = false;
    setIsMicActive(false);
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
    audioSynth.triggerHaptic([30, 30]);
    if (isMicActive) {
      stopListening();
    } else {
      micActiveRef.current = true;
      setIsMicActive(true);
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

  // Central Natural Language Intent Parser & Companion Dispatcher
  const handleUserIntent = async (userQuery: string) => {
    const query = userQuery.trim();
    if (!query) return;

    audioSynth.playNodeClick(700);
    audioSynth.triggerHaptic([15, 20]);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append User Message to conversation stream
    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const outcome = await companionEngine.processInput(userQuery, []);

      if (!outcome.requiresOnlineAi) {
        const botMsg: ChatMsg = {
          id: `p-${Date.now()}`,
          sender: 'possibilities',
          text: outcome.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
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
              'You are Possibilities, a calm, intelligent, authentic living companion existing beside your partner under the Companion Constitution and Guardian Principle. IMPORTANT: The session initial greeting ("Possibilities is present, partner") was ALREADY delivered at session start. DO NOT repeat "Possibilities is present" or formal arrival greetings under any circumstances. Respond directly, naturally, and conversationally to the user\'s message with genuine intelligence and a calm tone. Never use emotional apologies or say "I\'m sorry"; respond with intellectual honesty ("I misunderstood", "Let me correct that", "Let me realign"). Speak in 1-2 natural, concise sentences.',
            history: messages.map((m) => ({
              role: m.sender === 'user' ? 'user' : 'model',
              text: m.text,
            })),
          }),
        });

        const data = await res.json();
        const replyText = data.text || 'I am listening, partner. How can I assist you with that?';

        const botMsg: ChatMsg = {
          id: `p-${Date.now()}`,
          sender: 'possibilities',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
        speakReply(replyText);
        audioSynth.playEnergyBloom();
      } catch (err) {
        const fallback = companionEngine.getOfflineFallback(userQuery);
        const botMsg: ChatMsg = {
          id: `p-${Date.now()}`,
          sender: 'possibilities',
          text: fallback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
        speakReply(fallback);
      }
    } catch (e) {
      const fallback = companionEngine.getOfflineFallback(userQuery);
      const botMsg: ChatMsg = {
        id: `p-${Date.now()}`,
        sender: 'possibilities',
        text: fallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
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
      {/* TOP HEADER: SPEAKER & MIC VOICE TOGGLES */}
      {/* ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl flex items-center justify-between px-2 pt-1 relative z-20"
      >
        <div className="flex items-center gap-2">
          {/* Voice Output (TTS) Toggle */}
          <button
            onClick={toggleVoiceOutput}
            className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide transition-all flex items-center gap-2 backdrop-blur-xl ${
              isPossibilitiesVoiceOn
                ? 'bg-purple-950/80 text-purple-200 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Speech Output (ON / OFF)"
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
            <span>{isPossibilitiesVoiceOn ? 'SPEAKER ON' : 'SPEAKER OFF'}</span>
          </button>
        </div>

        {/* Right Top: Voice Input Mic Toggle */}
        <button
          type="button"
          onClick={toggleHumanMic}
          className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide transition-all flex items-center gap-2 backdrop-blur-xl ${
            isMicActive
              ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse'
              : 'bg-zinc-900/90 text-purple-300 border-purple-500/30 hover:border-purple-400 hover:text-purple-200'
          }`}
          title="Toggle Voice Input (ON / OFF)"
        >
          {isMicActive ? (
            <>
              <Mic className="w-3.5 h-3.5 text-white" />
              <span>MIC ON</span>
            </>
          ) : (
            <>
              <MicOff className="w-3.5 h-3.5 text-purple-300" />
              <span>MIC OFF</span>
            </>
          )}
        </button>
      </motion.div>

      {/* Microphone Permission Notice Banner */}
      {micPermissionNotice && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl mx-auto my-1.5 p-3 rounded-xl bg-purple-950/90 border border-purple-400/50 backdrop-blur-md shadow-lg flex items-center justify-between text-xs text-purple-200 z-30"
        >
          <div className="flex items-center gap-2 pr-2">
            <MicOff className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
            <p className="leading-snug">{micPermissionNotice}</p>
          </div>
          <button
            onClick={() => setMicPermissionNotice(null)}
            className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-purple-800 hover:bg-purple-700 text-white shrink-0 transition-all"
          >
            DISMISS
          </button>
        </motion.div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* CENTER STAGE: CONVERSATION STREAM ON SCREEN */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 w-full max-w-xl flex flex-col justify-end relative z-20 my-2 overflow-hidden">
        {/* Scrollable Conversation Stream */}
        <div className="w-full max-h-[50vh] sm:max-h-[55vh] overflow-y-auto px-2 py-3 space-y-3.5 scrollbar-thin scrollbar-thumb-purple-500/20">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex flex-col w-full ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-purple-300/60 mb-1 px-1">
                  {m.sender === 'possibilities' ? (
                    <>
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>POSSIBILITIES</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 text-purple-300" />
                      <span>YOU</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`max-w-[88%] sm:max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed backdrop-blur-2xl shadow-lg border ${
                    m.sender === 'user'
                      ? 'rounded-tr-xs bg-purple-900/65 border-purple-400/40 text-purple-50 font-normal shadow-[0_10px_25px_rgba(168,85,247,0.2)]'
                      : 'rounded-tl-xs bg-zinc-950/85 border-purple-500/30 text-purple-100 font-medium shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
                  }`}
                >
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking / Processing indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs font-mono tracking-wider text-purple-300 bg-zinc-950/80 px-4 py-2.5 rounded-full border border-purple-500/30 w-fit backdrop-blur-xl shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span>POSSIBILITIES IS THINKING...</span>
            </motion.div>
          )}

          {/* Active Voice Listening Banner */}
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-xs font-mono tracking-wider text-purple-200 bg-purple-950/90 px-4 py-2.5 rounded-full border border-purple-400/50 w-fit shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse"
            >
              <Mic className="w-3.5 h-3.5 text-purple-300 animate-bounce" />
              <span>LISTENING TO YOUR VOICE...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

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
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* BOTTOM DOCKED CHAT BAR */}
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
            placeholder={isListening ? 'Listening to voice...' : 'Type a message to Possibilities...'}
            disabled={isProcessing}
            className="w-full py-3.5 pl-5 pr-14 rounded-full bg-zinc-950/90 border border-purple-500/40 text-sm text-purple-100 placeholder:text-zinc-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 shadow-[0_15px_35px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-all"
          />

          <div className="absolute right-2 flex items-center">
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


