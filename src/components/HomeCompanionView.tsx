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
  WifiOff,
  RefreshCw,
  Image as ImageIcon,
  Wand2,
  Video,
  Code2,
  Layers,
  Sparkles as SparklesIcon,
  Search,
  Bot,
  Palette,
  Film,
  Music,
  FileText,
  Gamepad2,
  Package,
  FileCheck,
  Paperclip,
} from 'lucide-react';
import { SystemMode, MediaAttachment } from '../types';
import { AmbientParticlesCanvas } from './AmbientParticlesCanvas';
import { AiCreationStudioModal, StudioTabType } from './AiCreationStudioModal';
import { MediaAttachmentCard } from './MediaAttachmentCard';
import { audioSynth } from '../utils/audioSynthesizer';
import { companionEngine } from '../utils/companionEngine';
import { memoryStore } from '../utils/memoryStore';
import { memoryVaultManager } from '../vault/MemoryVaultManager';
import { masterBundleEngine } from '../utils/masterBundleEngine';
import { offline3BEngine } from '../utils/offline3BEngine';
import { getApiEndpoint, loggedFetch, getCustomGeminiApiKey } from '../lib/api';

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
  mediaAttachments?: MediaAttachment[];
}

const CHAT_HISTORY_STORAGE_KEY = 'possibilities_chat_history_v1';

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

  // 📎 File Attachment State for Chat
  interface AttachedFileItem {
    name: string;
    size: number;
    type: string;
    content: string; // text content or data URL
    isText: boolean;
  }
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([]);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChatFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    audioSynth.playNodeClick(600);

    const newAttachments: AttachedFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isText = file.type.startsWith('text/') || 
        file.type.includes('json') || 
        file.type.includes('javascript') || 
        file.type.includes('typescript') || 
        file.name.endsWith('.md') || 
        file.name.endsWith('.ts') || 
        file.name.endsWith('.tsx') || 
        file.name.endsWith('.js') || 
        file.name.endsWith('.jsx') || 
        file.name.endsWith('.txt') || 
        file.name.endsWith('.py') || 
        file.name.endsWith('.html') || 
        file.name.endsWith('.css') || 
        file.name.endsWith('.env') || 
        file.name.endsWith('.yaml') || 
        file.name.endsWith('.yml');

      try {
        if (isText) {
          const text = await file.text();
          newAttachments.push({
            name: file.name,
            size: file.size,
            type: file.type || 'text/plain',
            content: text,
            isText: true,
          });
        } else {
          // Read base64 data URL for images/binaries
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          newAttachments.push({
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            content: dataUrl,
            isText: false,
          });
        }
      } catch (err) {
        console.warn('Failed to read file:', file.name, err);
      }
    }

    setAttachedFiles((prev) => [...prev, ...newAttachments]);
    if (chatFileInputRef.current) {
      chatFileInputRef.current.value = '';
    }
  };

  const removeAttachedFile = (index: number) => {
    audioSynth.playNodeClick(400);
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 🔮 POSSIBILITIES Voice Output Toggle (Speaker ON / OFF)
  const [isPossibilitiesVoiceOn, setIsPossibilitiesVoiceOn] = useState(true);

  // AI Creation Studio Modal state
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<StudioTabType>('image');

  const handleStudioSendToChat = (attachment: MediaAttachment, userMsgText: string) => {
    audioSynth.playEnergyBloom();
    const newMsg: ChatMsg = {
      id: `studio-${Date.now()}`,
      sender: 'possibilities',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaAttachments: [attachment],
    };
    setMessages((prev) => [...prev, newMsg]);
  };

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
          // Filter out legacy saved initial greetings so conversation starts clean with user messages
          const cleaned = parsed.filter(
            (m) =>
              m.id !== 'init-1' &&
              m.id !== 'msg-1' &&
              !m.text.includes('Possibilities is present') &&
              !m.text.includes("What's on your mind")
          );
          return cleaned;
        }
      }
    } catch (e) {
      // ignore
    }
    return [];
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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const transcriptBufferRef = useRef<string>('');

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

      const currentAttachments = [...attachedFiles];
      setAttachedFiles([]);

      let effectiveQuery = query;
      if (currentAttachments.length > 0) {
        const fileSummaries = currentAttachments.map((f) => {
          if (f.isText) {
            return `\n\n--- ATTACHED FILE: ${f.name} ---\n${f.content.slice(0, 100000)}\n--- END FILE: ${f.name} ---`;
          } else {
            return `\n\n[ATTACHED MEDIA FILE: ${f.name} (${f.type}, ${Math.round(f.size / 1024)} KB)]`;
          }
        }).join('\n');
        effectiveQuery = `${query}\n\n${fileSummaries}`;
      }

      const userMsg: ChatMsg = {
        id: `u-${Date.now()}`,
        sender: 'user',
        text: query,
        timestamp: timeStr,
        mediaAttachments: currentAttachments.map((f) => ({
          type: f.isText ? 'code' : 'image',
          title: f.name,
          url: !f.isText ? f.content : undefined,
          codeSnippet: f.isText ? f.content.slice(0, 1000) : undefined,
        })),
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

        const customApiKey = getCustomGeminiApiKey();

        // Check backend AI generation first (uses server-side Gemini API or custom key)
        let replyText: string | null = null;
        try {
          const apiUrl = getApiEndpoint('/api/gemini');
          const res = await loggedFetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: effectiveQuery,
              systemInstruction: fullSystemInstruction,
              customApiKey: customApiKey || undefined,
              history: conversationHistory,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              replyText = data.text;
            }
          }
        } catch (netErr) {
          console.warn('[AI Pipeline] Backend endpoint unreachable, executing offline 3B engine:', netErr);
        }

        // If backend unavailable or returned null, use 100% Offline 3B Cognitive Core Engine
        if (!replyText) {
          const local3BRes = await offline3BEngine.generateResponse(
            effectiveQuery,
            conversationHistory.map((h) => ({
              role: h.role === 'user' ? 'user' : 'model',
              text: h.text,
            })),
            fullSystemInstruction
          );
          replyText = local3BRes.text;
        }

        const botMsg: ChatMsg = {
          id: `p-${Date.now()}`,
          sender: 'possibilities',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
        speakReply(replyText);
        audioSynth.playEnergyBloom();
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

        {/* TOP CONTROLS: QUICK SAVE .MD + SETTINGS BUTTON */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              audioSynth.playOrbPulse(700, 0.25);
              masterBundleEngine.downloadSingleMasterFile('markdown');
              setBackupStatusNotice('Master System Blueprint (.md) saved! All 13 Laws & Memory Vault secured.');
            }}
            className="px-3 py-1.5 rounded-full border border-purple-500/50 bg-gradient-to-r from-purple-900/90 to-indigo-900/90 hover:from-purple-800 hover:to-indigo-800 text-white text-[11px] font-bold tracking-wide transition-all flex items-center gap-1.5 backdrop-blur-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer"
            title="1-Click Save Master System Blueprint (.md)"
          >
            <Download className="w-3.5 h-3.5 text-purple-300" />
            <span>SAVE .MD</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(500);
              onOpenPanel('settings');
            }}
            className="px-3.5 py-1.5 rounded-full border border-purple-500/40 bg-purple-950/80 hover:bg-purple-900/90 text-purple-200 hover:text-white text-[11px] font-semibold tracking-wide transition-all flex items-center gap-1.5 backdrop-blur-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer"
            title="Open Possibilities App Settings & Controls"
          >
            <Settings className="w-3.5 h-3.5 text-purple-300" />
            <span>SETTINGS</span>
          </button>
        </div>
      </motion.div>

      {/* Offline Mode Banner */}
      {!isApiOnline && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl mx-auto my-2 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg backdrop-blur-xl relative z-20"
        >
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              <strong>100% Offline Mode Active:</strong> Local Companion Engine & Memory Store operational.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                audioSynth.playNodeClick(400);
              }}
              className="px-2.5 py-1 bg-amber-900/80 hover:bg-amber-800 text-amber-100 rounded-lg text-[10px] font-bold border border-amber-400/40 transition-all"
            >
              Proceed
            </button>
            <button
              onClick={async () => {
                audioSynth.playNodeClick(700);
                try {
                  const url = getApiEndpoint('/api/health');
                  const res = await loggedFetch(url, { signal: AbortSignal.timeout(4000) });
                  if (res.ok) {
                    setIsApiOnline(true);
                    audioSynth.playEnergyBloom();
                  } else {
                    audioSynth.triggerHaptic([30, 30]);
                  }
                } catch (e) {
                  audioSynth.triggerHaptic([30, 30]);
                }
              }}
              className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-purple-200 rounded-lg text-[10px] font-bold border border-purple-500/40 transition-all flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3 text-purple-300" /> Restore / Refresh
            </button>
          </div>
        </motion.div>
      )}

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

                  {/* Media Attachments (Image / Video / Audio / Code) */}
                  {m.mediaAttachments && m.mediaAttachments.map((att, attIdx) => (
                    <MediaAttachmentCard key={attIdx} attachment={att} />
                  ))}

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
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* BOTTOM DOCKED CHAT BAR */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-xl flex flex-col gap-2 relative z-30 mb-2">
        {/* Function Options Toolbar Above Chat Input */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar px-1 py-1 bg-zinc-950/85 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-lg">
          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(400);
              setStudioTab('image');
              setIsStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>Create Image</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(450);
              setStudioTab('modify');
              setIsStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Modify Image</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(500);
              setStudioTab('video');
              setIsStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
          >
            <Video className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Video</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(550);
              setStudioTab('audio');
              setIsStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
          >
            <Mic className="w-3.5 h-3.5 text-purple-400" />
            <span>Voice & Sound</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(600);
              setStudioTab('code');
              setIsStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
          >
            <Code2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Code Studio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(650);
              setStudioTab('research');
              setIsStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
          >
            <Search className="w-3.5 h-3.5 text-purple-400" />
            <span>Deep Research</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(700);
              setStudioTab('memory');
              setIsStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span>Neural Memory</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(750);
              setStudioTab('agent');
              setIsStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span>Auto Agent</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(800);
              setStudioTab('canvas');
              setIsStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
          >
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span>Visual Canvas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(850);
              setStudioTab('movie');
              setIsStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
          >
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span>Movie Studio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(900);
              setStudioTab('beat');
              setIsStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
          >
            <Music className="w-3.5 h-3.5 text-purple-400" />
            <span>Beat Producer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(950);
              setStudioTab('pdf');
              setIsStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>PDF Export</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(1000);
              setStudioTab('game');
              setIsStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Game Builder</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(1050);
              setStudioTab('apk');
              setIsStudioOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
          >
            <Package className="w-3.5 h-3.5 text-purple-400" />
            <span>APK Package</span>
          </button>
        </div>

        {/* Attached Files Staging Area */}
        {attachedFiles.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar px-2 py-1.5 bg-zinc-950/90 rounded-xl border border-purple-500/40">
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-400/40 text-xs text-purple-200 shrink-0 font-mono shadow-sm"
              >
                <Paperclip className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="max-w-[140px] truncate" title={file.name}>{file.name}</span>
                <span className="text-[10px] text-purple-400/70">({Math.round(file.size / 1024)}KB)</span>
                <button
                  type="button"
                  onClick={() => removeAttachedFile(idx)}
                  className="p-0.5 hover:text-rose-400 text-purple-300 transition-colors ml-0.5"
                  title="Remove file"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hidden File Input for Paperclip Attachment */}
        <input
          type="file"
          ref={chatFileInputRef}
          onChange={handleChatFileSelected}
          multiple
          className="hidden"
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUserIntent(inputText);
          }}
          className="relative flex items-center w-full"
        >
          {/* Paperclip Button */}
          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(500);
              chatFileInputRef.current?.click();
            }}
            title="Attach file, code, or document"
            className="absolute left-2 z-10 p-2 rounded-full text-purple-400 hover:text-purple-200 hover:bg-purple-950/60 transition-all cursor-pointer"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? 'Listening to voice...' : 'Type a message to Possibilities or attach files...'}
            disabled={isProcessing}
            className="w-full py-3.5 pl-11 pr-14 rounded-full bg-zinc-950/90 border border-purple-500/40 text-sm text-purple-100 placeholder:text-zinc-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 shadow-[0_15px_35px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-all"
          />

          <div className="absolute right-2 flex items-center">
            {/* Submit Button */}
            <button
              type="submit"
              disabled={(!inputText.trim() && attachedFiles.length === 0) || isProcessing}
              className="p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-30 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* AI Creation Studio Modal */}
      <AiCreationStudioModal
        isOpen={isStudioOpen}
        initialTab={studioTab}
        onClose={() => setIsStudioOpen(false)}
        onSendToChat={handleStudioSendToChat}
      />
    </div>
  );
};
