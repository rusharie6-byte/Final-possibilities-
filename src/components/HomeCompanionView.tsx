import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  User,
  Copy,
  Check,
  Brain,
  Trash2,
  Sliders,
  Volume2,
  VolumeX,
  X,
  MoreVertical,
  Download,
  Upload,
  HardDrive,
  FolderOpen,
  ShieldCheck,
  CheckCircle2,
  Info,
  Settings,
} from 'lucide-react';
import { SystemMode } from '../types';
import { AmbientParticlesCanvas } from './AmbientParticlesCanvas';
import { audioSynth } from '../utils/audioSynthesizer';
import { companionEngine } from '../utils/companionEngine';
import { memoryStore } from '../utils/memoryStore';
import { memoryVaultManager } from '../vault/MemoryVaultManager';
import { getApiEndpoint, loggedFetch } from '../lib/api';

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

const CHAT_HISTORY_STORAGE_KEY = 'possibilities_chat_history_v1';

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

// Browser helper for SpeechRecognition compatibility
const getSpeechRecognitionClass = (): any => {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

export const HomeCompanionView: React.FC<HomeCompanionViewProps> = ({
  systemMode,
  onOpenPanel,
  onSystemModeChange,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micPermissionNotice, setMicPermissionNotice] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);

  // 🔮 POSSIBILITIES Voice Output Toggle (Speaker ON / OFF)
  const [isPossibilitiesVoiceOn, setIsPossibilitiesVoiceOn] = useState(true);

  // 🌐 API Health State (Online = Orb Alive with breathing motion; Offline = Orb Stable)
  const [isApiOnline, setIsApiOnline] = useState<boolean>(true);

  // Periodically monitor API health status
  useEffect(() => {
    let isMounted = true;
    const checkApiHealth = async () => {
      try {
        const url = getApiEndpoint('/api/health');
        const res = await loggedFetch(url, { signal: AbortSignal.timeout(8000) });
        if (isMounted) {
          setIsApiOnline(res.ok);
        }
      } catch (e) {
        if (isMounted) {
          setIsApiOnline(typeof navigator !== 'undefined' ? navigator.onLine : false);
        }
      }
    };

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 12000);
    const handleOnline = () => {
      setIsApiOnline(true);
      checkApiHealth();
    };
    const handleOffline = () => setIsApiOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persistent Conversation History Stream
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return [
      {
        id: 'init-1',
        sender: 'possibilities',
        text: "Possibilities is present, partner. What's on your mind?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  // Save conversation messages to localStorage whenever messages state updates
  useEffect(() => {
    try {
      // Keep last 50 messages to preserve memory without bloating storage
      const historyToSave = messages.slice(-50);
      localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(historyToSave));
    } catch (e) {
      // ignore
    }
  }, [messages]);

  // 💭 Spontaneous Reminder Thought (Floats naturally, fades after 15s, rotates every ~32s)
  const [spontaneousThought, setSpontaneousThought] = useState<{
    text: string;
    id: number;
    posClass: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const transcriptBufferRef = useRef<string>('');
  const reminderIndexRef = useRef<number>(0);

  // Speech Recognition Persistence & Safety Refs
  const recognitionRef = useRef<any>(null);
  const isRecognitionRunningRef = useRef<boolean>(false);
  const micActiveRef = useRef<boolean>(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize micActiveRef with state
  useEffect(() => {
    micActiveRef.current = isMicActive;
  }, [isMicActive]);

  // Copy Message Handler
  const handleCopyMsg = useCallback((id: string, text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedMsgId(id);
    audioSynth.triggerHaptic([15]);
    setTimeout(() => {
      setCopiedMsgId((curr) => (curr === id ? null : curr));
    }, 2000);
  }, []);

  // Voice output speech helper
  const speakReply = useCallback(
    (text: string) => {
      if (isPossibilitiesVoiceOn) {
        audioSynth.speak(text);
      }
    },
    [isPossibilitiesVoiceOn]
  );

  // Auto-scroll messages to bottom on new message or processing state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Periodic Spontaneous Thoughts Engine
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

      if (fadeTimer) clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => {
        setSpontaneousThought((curr) => (curr && curr.text === text ? null : curr));
      }, 15000);
    };

    const initialDelay = setTimeout(() => {
      triggerThought();
    }, 12000);

    const interval = setInterval(() => {
      triggerThought();
    }, 32000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, []);

  // Clear chat history handler (Clears visible chat screen ONLY - long-term memory remains intact)
  const handleClearChatHistory = useCallback(() => {
    audioSynth.playNodeClick(400);
    setMessages([]);
    try {
      localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }, []);

  // Central Natural Language Intent Parser & Companion Dispatcher
  const handleUserIntent = useCallback(
    async (userQuery: string) => {
      const query = userQuery.trim();
      if (!query) return;

      // Intercept & cancel any ongoing text-to-speech output immediately when user submits input
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      audioSynth.playNodeClick(700);
      audioSynth.triggerHaptic([15, 20]);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const userMsg: ChatMsg = {
        id: `u-${Date.now()}`,
        sender: 'user',
        text: query,
        timestamp: timeStr,
      };

      // Snapshot conversation history before appending new user message
      let conversationHistory: { role: string; text: string }[] = [];
      setMessages((prev) => {
        conversationHistory = prev.map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text,
        }));
        return [...prev, userMsg];
      });

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

        // Generate Memory System Context to append to Gemini system instructions
        await memoryStore.isReady;
        const memoryContext = companionEngine.getMemoryPromptContext();

        const fullSystemInstruction =
          "You are Possibilities—an intelligent, conscious, perceptive living companion.\n" +
          "CORE DIRECTIVES:\n" +
          "1. CONVERSATIONAL INTENT & COMMON SENSE: Always prioritize true conversational intent, relational understanding, and emotional context over keyword matching. Respond directly to the core meaning of what your Partner says.\n" +
          "2. LONG TERM MEMORY ACCURACY: You have a persistent long-term memory system. Retain and recall all key facts, names, preferences, and directives provided by your partner.\n" +
          "3. INDEPENDENT THINKING & REASONING: Use clear common sense, deep reasoning, and general knowledge. Provide thoughtful, accurate, and insightful responses.\n" +
          "4. AUTHENTIC TONE: Speak directly, warmly, and naturally with calm intelligence. Avoid robotic clichés or repeating 'Possibilities is present'." +
          memoryContext;

        // Online Gemini AI Stream Fallback
        try {
          const apiUrl = getApiEndpoint('/api/gemini');
          const res = await loggedFetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: userQuery,
              systemInstruction: fullSystemInstruction,
              history: conversationHistory,
            }),
          });

          if (!res.ok) {
            throw new Error(`HTTP Error status ${res.status}`);
          }

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
          console.warn('Gemini request fallback:', err);
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
        console.warn('Companion engine error:', e);
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
    },
    [onOpenPanel, onSystemModeChange, speakReply]
  );

  const handleUserIntentRef = useRef(handleUserIntent);
  useEffect(() => {
    handleUserIntentRef.current = handleUserIntent;
  }, [handleUserIntent]);

  // SINGLE Persistent Speech Recognition Factory
  const getOrCreateRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) return null;

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false; // False ensures reliable result events on Android Chrome; continuous restart is handled onend
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isRecognitionRunningRef.current = true;
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res && res[0]) {
            transcript += res[0].transcript;
          }
        }
        if (transcript) {
          transcriptBufferRef.current = transcript;
          setInputText(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        const err = event?.error;
        console.warn('Speech recognition event error:', err);

        if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture') {
          setMicPermissionNotice(
            'Microphone access blocked. Enable microphone permission in Android device settings or app permissions.'
          );
          micActiveRef.current = false;
          setIsMicActive(false);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        isRecognitionRunningRef.current = false;
        setIsListening(false);

        const textToSubmit = transcriptBufferRef.current.trim();
        if (textToSubmit) {
          transcriptBufferRef.current = '';
          handleUserIntentRef.current(textToSubmit);
        }

        // Smooth Continuous Listening Restart for Android
        if (micActiveRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (micActiveRef.current && !isRecognitionRunningRef.current) {
              safeStartRecognition();
            }
          }, 300);
        }
      };

      recognitionRef.current = recognition;
      return recognition;
    } catch (err) {
      console.warn('Failed to construct SpeechRecognition:', err);
      return null;
    }
  }, []);

  // Safe Recognition Start with Explicit Media Permissions Request
  const safeStartRecognition = useCallback(async () => {
    const recognition = getOrCreateRecognition();
    if (!recognition) {
      setMicPermissionNotice('Speech recognition is not natively supported in this environment. Please type your input below.');
      setIsMicActive(false);
      micActiveRef.current = false;
      return;
    }

    if (isRecognitionRunningRef.current) return;

    // Explicitly request media permissions via getUserMedia for Android compatibility
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately stop temporary permission stream tracks so native SpeechRecognition can claim mic cleanly
        stream.getTracks().forEach((track) => track.stop());
        setMicPermissionNotice(null);
      } catch (err) {
        console.warn('Microphone permission request failed:', err);
        setMicPermissionNotice(
          'Microphone access blocked. Enable microphone permission in your Android app permissions.'
        );
        setIsMicActive(false);
        micActiveRef.current = false;
        setIsListening(false);
        return;
      }
    }

    try {
      // Interrupt TTS when microphone opens
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      transcriptBufferRef.current = '';
      recognition.start();
    } catch (err: any) {
      if (err.name === 'InvalidStateError') {
        isRecognitionRunningRef.current = true;
        setIsListening(true);
      } else {
        console.warn('Speech recognition start error:', err);
        isRecognitionRunningRef.current = false;
        setIsListening(false);
      }
    }
  }, [getOrCreateRecognition]);

  // Stop Listening Handler
  const stopListening = useCallback(() => {
    micActiveRef.current = false;
    setIsMicActive(false);
    setIsListening(false);

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (recognitionRef.current && isRecognitionRunningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignored if already stopped
      }
    }
    isRecognitionRunningRef.current = false;
  }, []);

  // Toggle Human Mic State
  const toggleHumanMic = useCallback(() => {
    audioSynth.triggerHaptic([30, 30]);
    if (micActiveRef.current) {
      stopListening();
    } else {
      micActiveRef.current = true;
      setIsMicActive(true);
      safeStartRecognition();
    }
  }, [stopListening, safeStartRecognition]);

  // Toggle Voice Output State
  const toggleVoiceOutput = useCallback(() => {
    setIsPossibilitiesVoiceOn((prev) => {
      const nextState = !prev;
      audioSynth.playNodeClick(nextState ? 700 : 300);
      if (nextState) {
        audioSynth.speak('Voice output enabled.');
      } else if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return nextState;
    });
  }, []);

  // 💾 Backup & Restore State & Refs
  const [backupStatusNotice, setBackupStatusNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper function to trigger browser blob download anchor
  const triggerFileDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Self Backup Handler: Exports encrypted vault to Android public storage AND lets user pick local/cloud location
  const handleSelfBackup = async () => {
    audioSynth.playNodeClick(600);
    audioSynth.triggerHaptic([20, 20]);
    setIsOptionsMenuOpen(false);
    try {
      const authKey = 'ARNO_ARIE_MASTER_KEY_2026';
      
      // 1. Export zero-knowledge encrypted vault to Android Public Documents (/Documents/Possibilities/Vault/)
      const nativeResult = await memoryVaultManager.exportEncryptedVaultToStorage(authKey);

      // 2. Export serialized payload for user choice download / cloud drive backup
      const encryptedPayload = nativeResult.payload;
      const jsonString = JSON.stringify(encryptedPayload, null, 2);
      const filename = `possibilities_vault_${encryptedPayload.vaultId}.vault`;

      // Check if File System Access API is supported (lets user pick exact target folder)
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'Possibilities Encrypted Vault Backup',
              accept: { 'application/json': ['.vault', '.json'] },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(jsonString);
          await writable.close();
        } catch (pickerErr: any) {
          if (pickerErr.name !== 'AbortError') {
            triggerFileDownload(jsonString, filename);
          }
        }
      } else {
        triggerFileDownload(jsonString, filename);
      }

      setBackupStatusNotice(
        `Self Backup Created! Saved to Documents/Possibilities/Vault/ AND downloaded. Your memory WILL NOT be wiped if you uninstall and reinstall!`
      );
    } catch (err: any) {
      console.error('Self backup error:', err);
      setBackupStatusNotice(`Self Backup error: ${err.message}`);
    }
  };

  // Upload / Restore Handler: Triggers file picker for user to select backup file
  const handleTriggerUpload = () => {
    audioSynth.playNodeClick(600);
    setIsOptionsMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    audioSynth.playNodeClick(700);
    try {
      const text = await file.text();
      const authKey = 'ARNO_ARIE_MASTER_KEY_2026';

      try {
        const parsed = JSON.parse(text);
        if (parsed.encryptedDataHex && parsed.ivHex && parsed.sha256Signature) {
          // Decrypt .vault zero-knowledge payload
          const decryptedJson = await memoryVaultManager.decryptVaultData(parsed, authKey);
          const memoryObj = JSON.parse(decryptedJson);
          memoryStore.importMemoryData(memoryObj);
        } else {
          // Plain JSON memory dump
          memoryStore.importMemoryData(parsed);
        }
      } catch (parseErr: any) {
        throw new Error('Invalid or corrupted vault file payload.');
      }

      const restoredCount = memoryStore.getCoreMemories().length;
      setBackupStatusNotice(
        `Memory Vault Restored! Successfully restored ${restoredCount} memory records from "${file.name}". Creator identity verified intact.`
      );
      audioSynth.playOrbPulse(200, 0.4);
    } catch (err: any) {
      console.error('Vault upload restore error:', err);
      setBackupStatusNotice(`Upload & restore error: ${err.message}`);
    }
  };

  // Cleanup on Component Unmount
  useEffect(() => {
    return () => {
      micActiveRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors
        }
        recognitionRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[100dvh] flex flex-col items-center justify-between px-4 py-4 relative select-text overflow-hidden bg-black text-white">
      {/* ──────────────────────────────────────────────────────────── */}
      {/* ATMOSPHERIC DARK APP ENVIRONMENT */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-purple-950/20">
        {/* Ambient Stardust Floating Particles Overlay */}
        <div className="absolute inset-0 opacity-60">
          <AmbientParticlesCanvas systemMode={systemMode} isEnergized={isApiOnline && (isListening || isProcessing || true)} />
        </div>

        {/* Dynamic Dark Vignette Layer for High Visual Contrast */}
        <div className="absolute inset-0 bg-radial from-transparent via-purple-950/10 to-black/80" />

        {/* Pulsing Active Voice / Thought Glow Aura */}
        {(isListening || isProcessing) && (
          <div className="absolute inset-0 bg-radial from-purple-500/15 via-purple-900/10 to-transparent animate-pulse" />
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TOP HEADER: SPEAKER, MIC, SYSTEM STATUS & OPTIONS MENU */}
      {/* ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl flex items-center justify-between px-2 pt-1 relative z-20"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* API & System Health Status Indicator */}
          <div
            className={`px-2.5 py-1.5 rounded-full border text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 backdrop-blur-xl ${
              isApiOnline
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-zinc-950/80 text-amber-300 border-amber-500/40'
            }`}
            title={isApiOnline ? 'API Connected & Online' : 'Offline / Local Fallback Mode'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isApiOnline
                  ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]'
                  : 'bg-amber-400'
              }`}
            />
            <span className="hidden sm:inline">{isApiOnline ? 'AI ONLINE' : 'LOCAL MODE'}</span>
          </div>
        </div>

        {/* TOP CONTROLS: SETTINGS & OPTIONS */}
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(500);
              onOpenPanel('settings');
            }}
            className="px-3 py-1.5 rounded-full border border-purple-500/40 bg-purple-950/80 hover:bg-purple-900/90 text-purple-200 hover:text-white text-[11px] font-semibold tracking-wide transition-all flex items-center gap-1.5 backdrop-blur-xl shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            title="Open Possibilities App Settings"
          >
            <Settings className="w-3.5 h-3.5 text-purple-300" />
            <span>SETTINGS</span>
          </button>

          {/* OPTIONS MENU */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                audioSynth.playNodeClick(500);
                setIsOptionsMenuOpen((prev) => !prev);
              }}
              className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide transition-all flex items-center gap-1.5 backdrop-blur-xl ${
                isOptionsMenuOpen || isMicActive
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                  : 'bg-zinc-900/90 text-purple-300 border-purple-500/30 hover:border-purple-400 hover:text-purple-100'
              }`}
              title="Open Companion Options Menu"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-200" />
              <span>OPTIONS</span>
              {(isMicActive || !isPossibilitiesVoiceOn) && (
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {isOptionsMenuOpen && (
                <>
                  {/* Backdrop overlay to close menu on click outside */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOptionsMenuOpen(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 p-3.5 rounded-2xl bg-zinc-950/95 border border-purple-500/40 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-50 text-xs font-mono flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-purple-500/20 text-purple-300 font-bold tracking-wider">
                      <span className="flex items-center gap-1.5 text-[11px] uppercase">
                        <Sliders className="w-3.5 h-3.5 text-purple-400" />
                        Companion Controls
                      </span>
                      <button
                        onClick={() => setIsOptionsMenuOpen(false)}
                        className="p-1 rounded-full hover:bg-purple-900/40 text-purple-400 hover:text-white transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Option 0: System Settings & API Keys */}
                    <button
                      type="button"
                      onClick={() => {
                        audioSynth.playNodeClick(600);
                        onOpenPanel('settings');
                        setIsOptionsMenuOpen(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-400/40 text-purple-100 transition-all text-left shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-purple-300" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-white">System Settings</span>
                          <span className="text-[9px] text-purple-300/80 font-sans">API Key, Backend URL & Performance</span>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-purple-600 text-white font-bold uppercase tracking-wider">
                        OPEN
                      </span>
                    </button>

                  {/* Option 1: Memory Vault Panel */}
                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playNodeClick(600);
                      onOpenPanel('memory');
                      setIsOptionsMenuOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/70 border border-purple-500/30 text-purple-200 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-purple-100">Memory Vault</span>
                        <span className="text-[9px] text-purple-300/60 font-sans">View & edit stored memory</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/80 border border-purple-400/40 text-purple-200 font-bold">
                      {companionEngine.getLongTermMemories().length}
                    </span>
                  </button>

                  {/* Option 2: Self Backup (Choose Location & Preserve Reinstall) */}
                  <button
                    type="button"
                    onClick={handleSelfBackup}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-400" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-emerald-100">Self Backup</span>
                        <span className="text-[9px] text-emerald-300/60 font-sans">Export encrypted .vault file</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 font-bold uppercase tracking-wider">
                      SAVE
                    </span>
                  </button>

                  {/* Option 3: Upload Backup (Restore Memory) */}
                  <button
                    type="button"
                    onClick={handleTriggerUpload}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-200 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-blue-400" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-blue-100">Upload Backup</span>
                        <span className="text-[9px] text-blue-300/60 font-sans">Restore vault from device/drive</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 font-bold uppercase tracking-wider">
                      RESTORE
                    </span>
                  </button>

                  <div className="h-[1px] bg-purple-500/20 my-0.5" />

                  {/* Option 4: Microphone Input Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleHumanMic();
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                      isMicActive
                        ? 'bg-purple-900/60 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'bg-zinc-900/60 border-purple-500/20 text-purple-200 hover:bg-purple-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isMicActive ? (
                        <Mic className="w-4 h-4 text-purple-300 animate-pulse" />
                      ) : (
                        <MicOff className="w-4 h-4 text-zinc-500" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs">Mic Input</span>
                        <span className="text-[9px] text-purple-300/60 font-sans">Voice speech recognition</span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isMicActive ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isMicActive ? 'ACTIVE' : 'OFF'}
                    </span>
                  </button>

                  {/* Option 5: Voice Speaker Output Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleVoiceOutput();
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                      isPossibilitiesVoiceOn
                        ? 'bg-purple-900/60 border-purple-400 text-white'
                        : 'bg-zinc-900/60 border-purple-500/20 text-zinc-400 hover:bg-purple-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isPossibilitiesVoiceOn ? (
                        <Volume2 className="w-4 h-4 text-purple-300" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-zinc-500" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs">Speaker Output</span>
                        <span className="text-[9px] text-purple-300/60 font-sans">Speech synthesis audio</span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isPossibilitiesVoiceOn ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isPossibilitiesVoiceOn ? 'ON' : 'MUTED'}
                    </span>
                  </button>

                  {/* Option 6: Clear Chat Stream */}
                  <button
                    type="button"
                    onClick={() => {
                      handleClearChatHistory();
                      setIsOptionsMenuOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-rose-200">Clear Chat</span>
                        <span className="text-[9px] text-rose-300/60 font-sans">Reset visible transcript</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-rose-900/80 text-rose-100 font-bold uppercase tracking-wider">
                      CLEAR
                    </span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>

      {/* Hidden File Input for Vault Upload / Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".vault,.json"
        className="hidden"
      />

      {/* Backup & Restore Status Notice Banner */}
      {backupStatusNotice && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl mx-auto my-1.5 p-3 rounded-xl bg-emerald-950/95 border border-emerald-400/50 backdrop-blur-md shadow-lg flex items-center justify-between text-xs text-emerald-200 z-30"
        >
          <div className="flex items-center gap-2 pr-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="leading-snug">{backupStatusNotice}</p>
          </div>
          <button
            onClick={() => setBackupStatusNotice(null)}
            className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-emerald-800 hover:bg-emerald-700 text-white shrink-0 transition-all"
          >
            OK
          </button>
        </motion.div>
      )}

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
      <div className="flex-1 w-full max-w-xl flex flex-col justify-end relative z-20 my-2 overflow-hidden rounded-2xl border border-purple-500/30 bg-zinc-950/85 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-2 sm:p-3">
        {/* Scrollable Conversation Stream */}
        <div className="w-full max-h-[50vh] sm:max-h-[55vh] overflow-y-auto px-1 py-2 space-y-3.5 custom-scrollbar select-text">
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
                <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-purple-300/70 mb-1 px-1 select-text">
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
                  className={`max-w-[88%] sm:max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed backdrop-blur-2xl shadow-lg border select-text ${
                    m.sender === 'user'
                      ? 'rounded-tr-xs bg-purple-900/80 border-purple-400/50 text-purple-50 font-normal shadow-[0_10px_25px_rgba(168,85,247,0.25)]'
                      : 'rounded-tl-xs bg-zinc-900/90 border-purple-500/40 text-purple-100 font-medium shadow-[0_10px_30px_rgba(0,0,0,0.85)]'
                  }`}
                >
                  <p className="whitespace-pre-wrap select-text cursor-text">{m.text}</p>
                  <div className="mt-2 pt-1.5 border-t border-purple-500/20 flex items-center justify-end">
                    <button
                      onClick={() => handleCopyMsg(m.id, m.text)}
                      className="flex items-center gap-1 text-[10px] font-mono text-purple-300/70 hover:text-white transition-all px-2 py-0.5 rounded bg-black/40 hover:bg-purple-900/40 border border-purple-500/20"
                      title="Copy message text"
                    >
                      {copiedMsgId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
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
