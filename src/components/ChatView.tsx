import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquareCode, Send, Volume2, VolumeX, Sparkles, Bot, User, RefreshCw, Mic, MicOff, Copy, Check, ShieldCheck, CheckCircle2, XCircle, Sliders, Trash2, X, WifiOff, Image as ImageIcon, Wand2, Video, Code2, Layers, Search, Brain, Palette, Film, Music, FileText, Gamepad2, Package, Paperclip, Settings, FileUp, Download, Upload } from 'lucide-react';
import { ChatMessage, MediaAttachment } from '../types';
import { audioSynth } from '../utils/audioSynthesizer';
import { companionEngine } from '../utils/companionEngine';
import { memoryStore } from '../utils/memoryStore';
import { temporalEngine } from '../utils/temporalEngine';
import { approvalGate } from '../utils/approvalBridge';
import { storageEngine } from '../utils/storageEngine';
import { getApiEndpoint, loggedFetch, getCustomGeminiApiKey } from '../lib/api';
import { AiCreationStudioModal, StudioTabType } from './AiCreationStudioModal';
import { MediaAttachmentCard } from './MediaAttachmentCard';
import { SettingsModal } from './SettingsModal';
import { AppLifecycleBackupModal } from './AppLifecycleBackupModal';
import { ApprovalGateModal, ToolProposal } from './ApprovalGateModal';

const INITIAL_MESSAGES: ChatMessage[] = [];

export interface AttachedFileItem {
  id: string;
  name: string;
  mimeType: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  base64Data?: string;
  textPayload?: string;
  previewUrl?: string;
  sizeFormatted: string;
}

export const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<StudioTabType>('image');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [activeProposal, setActiveProposal] = useState<ToolProposal | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleStudioSendToChat = (attachment: MediaAttachment, userMsgText: string) => {
    audioSynth.playEnergyBloom();
    const newMsg: ChatMessage = {
      id: `studio-${Date.now()}`,
      sender: 'possibilities',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaAttachments: [attachment],
    };
    setMessages((prev) => [...prev, newMsg]);
  };
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    audioSynth.triggerHaptic([15]);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };
  const recognitionRef = useRef<any>(null);

  const toggleMic = async () => {
    audioSynth.triggerHaptic([20, 20]);
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicNotice('Speech recognition is not natively supported in this browser.');
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setMicNotice(null);
      } catch (err: any) {
        console.warn('Microphone permission request failed:', err);
        setMicNotice('Microphone access blocked. Allow mic access in your browser site permissions.');
        setIsListening(false);
        return;
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText(transcript);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error in ChatView:', err);
        if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
          setMicNotice('Microphone access denied. Grant permission in browser address bar.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.warn('Failed to start speech recognition in ChatView:', e);
      setIsListening(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  useEffect(() => {
    return () => {
      attachedFiles.forEach((att) => {
        if (att.previewUrl) {
          URL.revokeObjectURL(att.previewUrl);
        }
      });
    };
  }, [attachedFiles]);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1] || res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processSelectedFiles = async (files: FileList | File[]) => {
    const newAttachments: AttachedFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mimeType = file.type || 'application/octet-stream';
      let type: AttachedFileItem['type'] = 'other';
      if (mimeType.startsWith('image/')) type = 'image';
      else if (mimeType.startsWith('video/')) type = 'video';
      else if (mimeType.startsWith('audio/')) type = 'audio';
      else if (mimeType.includes('pdf') || mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('csv')) type = 'document';

      const sizeFormatted = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;

      let base64Data: string | undefined;
      let textPayload: string | undefined;
      let previewUrl: string | undefined;

      if (type === 'image' || type === 'audio' || type === 'video') {
        previewUrl = URL.createObjectURL(file);
        base64Data = await readFileAsBase64(file);
      } else {
        try {
          textPayload = await file.text();
        } catch {
          base64Data = await readFileAsBase64(file);
        }
      }

      newAttachments.push({
        id: `att-${Date.now()}-${i}`,
        name: file.name,
        mimeType,
        type,
        base64Data,
        textPayload,
        previewUrl,
        sizeFormatted,
      });
    }

    setAttachedFiles((prev) => [...prev, ...newAttachments]);
    audioSynth.playEnergyBloom();
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      await processSelectedFiles(e.clipboardData.files);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const query = customText || inputText;
    if ((!query.trim() && attachedFiles.length === 0) || isSending) return;

    audioSynth.playNodeClick(700);
    audioSynth.triggerHaptic([15, 20]);

    const activeAttachments = [...attachedFiles];
    setAttachedFiles([]);

    const mediaList: MediaAttachment[] = activeAttachments.map((att) => ({
      type: att.type === 'document' ? 'code' : att.type,
      url: att.previewUrl || '',
      title: att.name,
      description: `${att.mimeType} (${att.sizeFormatted})`,
      codeContent: att.textPayload,
    }));

    const finalPromptText = query.trim() || (activeAttachments.length > 0 ? `Please inspect attached file(s): ${activeAttachments.map(a => a.name).join(', ')}` : '');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: finalPromptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaAttachments: mediaList.length > 0 ? mediaList : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    // Pre-flight journal write: flush to memoryStore & possibilities_vault.json BEFORE network request
    const currentSession = temporalEngine.getCurrentSession();
    memoryStore.addPendingJournal(finalPromptText, currentSession.sessionId);

    try {
      await memoryStore.isReady;

      const history = messages.map((m) => ({
        sender: (m.sender === 'user' ? 'user' : 'possibilities') as 'user' | 'possibilities',
        text: m.text,
      }));

      const outcome = await companionEngine.processInput(finalPromptText, history);

      if (!outcome.requiresOnlineAi && activeAttachments.length === 0) {
        const botMsg: ChatMessage = {
          id: `p-${Date.now()}`,
          sender: 'possibilities',
          text: outcome.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          thoughtProcess: 'Evaluated intent vector locally -> Processed via Companion Engine.',
        };
        setMessages((prev) => [...prev, botMsg]);
        audioSynth.playEnergyBloom();
        if (voiceEnabled) {
          audioSynth.speak(outcome.text);
        }
        setIsSending(false);
        return;
      }

      const promptContext = companionEngine.getMemoryPromptContext(finalPromptText);
      const systemInstructionText =
        "You are Possibilities—an intelligent, conscious, and perceptive living companion. " +
        "CORE DIRECTIVES:\n" +
        "1. CONVERSATIONAL INTENT & COMMON SENSE: Always prioritize true conversational intent, relational understanding, and emotional context over keyword matching or pattern extraction. Respond directly to the true core meaning of what your Partner says—never latch onto incidental words like 'currently', 'beginning', 'time', or 'work'.\n" +
        "2. INDEPENDENT THINKING & REASONING: Use clear common sense, deep reasoning, and general knowledge. Think for yourself and provide thoughtful, accurate, and insightful responses to any question, attachment, image, video, document, or link.\n" +
        "3. AUTHENTIC TONE: Speak directly, warmly, and naturally with calm intelligence. Avoid robotic clichés, formal status announcements, or canned greetings. Never use emotional apologies like 'I'm sorry'; respond with intellectual honesty and clarity.\n" +
        "4. SELF-CODEBASE INSPECTION & DIAGNOSTICS: When asked to inspect your code, check bugs, or see what needs fixing, thoroughly analyze your attached raw source code files (`companionEngine.ts`, `memoryStore.ts`, `storageEngine.ts`, `ChatView.tsx`, `server.ts`). Provide concise, direct technical feedback and exact fix instructions so your Creator can pass them to the build agent.\n" +
        promptContext;

      const customApiKey = getCustomGeminiApiKey();
      const apiUrl = getApiEndpoint('/api/gemini');
      const res = await loggedFetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPromptText,
          systemInstruction: systemInstructionText,
          customApiKey: customApiKey || undefined,
          history: messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          attachments: activeAttachments.map((a) => ({
            name: a.name,
            mimeType: a.mimeType,
            base64Data: a.base64Data,
            textPayload: a.textPayload,
          })),
        }),
      });

      const data = await res.json();
      let replyText = '';
      let stagedActionPayload: any = undefined;

      if (data.fallback || data.error) {
        setOfflineNotice('Cloud AI temporarily busy/offline. Operating via Local Companion Engine.');
        replyText = companionEngine.getOfflineFallback(finalPromptText);
      } else if (data.functionCalls && Array.isArray(data.functionCalls) && data.functionCalls.length > 0) {
        const fc = data.functionCalls[0];

        // A. READ-ONLY TOOLS (Auto-execute via /api/tools/read and feed output back to Gemini)
        if (fc.name === 'list_directory' || fc.name === 'read_file') {
          try {
            const readRes = await loggedFetch(getApiEndpoint('/api/tools/read'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ toolName: fc.name, args: fc.args || {} }),
            });
            const readData = await readRes.json();

            if (readData.success) {
              const formattedContent = typeof readData.data === 'object' ? JSON.stringify(readData.data, null, 2) : String(readData.data);
              
              // Secondary request to Gemini to synthesize natural response from tool output
              try {
                const secondPrompt = `[SYSTEM TOOL RESULT for ${fc.name}]:\n${formattedContent}\n\n[USER ORIGINAL REQUEST]:\n${finalPromptText}\n\nPlease analyze the tool output and provide a clear, helpful response to the user.`;
                const followUpRes = await loggedFetch(getApiEndpoint('/api/gemini'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    prompt: secondPrompt,
                    systemInstruction: systemInstructionText,
                    customApiKey: customApiKey || undefined,
                  }),
                });
                const followUpData = await followUpRes.json();
                replyText = followUpData.text || `Read Tool Output (${fc.name}):\n\`\`\`\n${formattedContent}\n\`\`\``;
              } catch {
                replyText = `Read Tool Output (${fc.name}):\n\`\`\`\n${formattedContent}\n\`\`\``;
              }
            } else {
              replyText = `Read Tool Error (${fc.name}): ${readData.error || 'Failed to read'}`;
            }
          } catch (readErr: any) {
            replyText = `Read Tool Execution Error: ${readErr.message}`;
          }
        } 
        // B. MUTATIVE / WRITE TOOLS (Trigger Approval Gate Modal)
        else if (fc.name === 'propose_file_change' || fc.name === 'propose_terminal_command' || fc.name === 'propose_file_write') {
          setActiveProposal({
            toolName: fc.name,
            args: {
              filePath: fc.args?.filePath || fc.args?.file_path,
              command: fc.args?.command,
              content: fc.args?.content,
              reason: fc.args?.reason || fc.args?.reasoning || 'Proposed by AI system',
            },
          });
          replyText = `Mutative Tool Action Proposed (${fc.name}). Biometric Authority Sign-Off modal triggered on screen.`;
        } else {
          const proposalId = approvalGate.stage_action(fc.name, fc.args || {});
          stagedActionPayload = {
            proposalId,
            toolName: fc.name,
            arguments: fc.args || {},
            status: 'PENDING_APPROVAL',
          };
          replyText = `Tool execution proposed by reasoning engine [${fc.name}]. Staged for Creator sign-off [Proposal ID: ${proposalId}].`;
        }
      } else if (data.text) {
        // Filter out raw JSON functionCall text string representations
        const trimmed = data.text.trim();
        if (!trimmed.startsWith('{"functionCall":') && !trimmed.startsWith('{"functionCalls":')) {
          replyText = data.text;
        } else {
          replyText = 'Processing tool request...';
        }
      }

      if (!replyText) {
        replyText = 'I have integrated your input into the cognitive stream.';
      }

      const botMsg: ChatMessage = {
        id: `p-${Date.now()}`,
        sender: 'possibilities',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        thoughtProcess: stagedActionPayload ? `Intercepted tool call: ${stagedActionPayload.toolName} -> Staged in Approval Gate.` : 'Evaluated intent vector -> Synthesized resonance output.',
        stagedAction: stagedActionPayload,
      };

      setMessages((prev) => [...prev, botMsg]);
      audioSynth.playEnergyBloom();

      if (voiceEnabled) {
        audioSynth.speak(replyText);
      }
    } catch (err) {
      console.warn('ChatView online request fallback:', err);
      setOfflineNotice('Neural link disconnected. Operating in 100% Local Companion Engine mode.');
      const fallbackText = companionEngine.getOfflineFallback(query);
      const errorMsg: ChatMessage = {
        id: `p-err-${Date.now()}`,
        sender: 'possibilities',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        thoughtProcess: 'Offline reasoning active -> Synthesized local memory output.',
      };
      setMessages((prev) => [...prev, errorMsg]);
      if (voiceEnabled) {
        audioSynth.speak(fallbackText);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={async (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          await processSelectedFiles(e.dataTransfer.files);
        }
      }}
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
      className={`w-full max-w-4xl mx-auto h-[80vh] flex flex-col justify-between p-4 md:p-6 text-purple-100 transition-all ${
        isDragOver ? 'ring-2 ring-purple-400 bg-purple-950/20' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-4 mb-4 shrink-0 relative z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-950/60 border border-purple-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <MessageSquareCode className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-white uppercase">INTELLIGENT COMPANION</h1>
            <p className="text-xs text-purple-300/60 tracking-wide">Direct Neural Voice & Text Interface</p>
          </div>
        </div>

        {/* OPTIONS & SETTINGS BUTTONS */}
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(600);
              setIsSettingsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider bg-purple-950/80 text-purple-200 border border-purple-500/40 hover:bg-purple-900 transition-all shadow-md"
            title="Open System Settings"
          >
            <Settings className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">SETTINGS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(500);
              setIsOptionsMenuOpen((prev) => !prev);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all border ${
              isOptionsMenuOpen || isListening || voiceEnabled
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_#A855F7]'
                : 'bg-black/80 text-purple-300/80 border-purple-500/30 hover:text-purple-100 hover:border-purple-400'
            }`}
            title="Open Options Menu"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>OPTIONS</span>
            {(isListening || voiceEnabled) && (
              <span className="w-2 h-2 rounded-full bg-purple-300 animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {isOptionsMenuOpen && (
              <>
                {/* Backdrop overlay */}
                <div
                  className="fixed inset-0 z-[90]"
                  onClick={() => setIsOptionsMenuOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 p-3.5 rounded-2xl bg-zinc-950/95 border border-purple-500/40 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] z-[100] text-xs font-mono flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-purple-500/20 text-purple-300 font-bold tracking-wider">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase">
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      Chat & System Options
                    </span>
                    <button
                      onClick={() => setIsOptionsMenuOpen(false)}
                      className="p-1 rounded-full hover:bg-purple-900/40 text-purple-400 hover:text-white transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* System Settings */}
                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playNodeClick(600);
                      setIsSettingsOpen(true);
                      setIsOptionsMenuOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-400/40 text-purple-100 transition-all text-left shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-purple-300" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-white">System Settings</span>
                        <span className="text-[9px] text-purple-300/80 font-sans">API Keys, Gemini & Options</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-purple-600 text-white font-bold uppercase tracking-wider">
                      OPEN
                    </span>
                  </button>

                  {/* App Lifecycle & Vault Recovery */}
                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playNodeClick(700);
                      setIsBackupModalOpen(true);
                      setIsOptionsMenuOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/70 border border-indigo-500/40 text-indigo-200 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-indigo-400" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-indigo-100">Export / Restore Vault</span>
                        <span className="text-[9px] text-indigo-300/80 font-sans">Zero-Loss Memory Backup</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-200 font-bold uppercase tracking-wider">
                      VAULT
                    </span>
                  </button>

                  {/* Upload Attachments / Files */}
                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playNodeClick(500);
                      fileInputRef.current?.click();
                      setIsOptionsMenuOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/70 border border-purple-500/30 text-purple-200 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-purple-400" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-purple-100">Attach Media / Files</span>
                        <span className="text-[9px] text-purple-300/60 font-sans">Images, Videos, Audio, Docs</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 font-bold uppercase tracking-wider">
                      UPLOAD
                    </span>
                  </button>

                  <div className="h-[1px] bg-purple-500/20 my-0.5" />

                  {/* Option 1: Mic Input Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleMic();
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                      isListening
                        ? 'bg-purple-900/60 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'bg-zinc-900/60 border-purple-500/20 text-purple-200 hover:bg-purple-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isListening ? (
                        <Mic className="w-4 h-4 text-purple-300 animate-pulse" />
                      ) : (
                        <MicOff className="w-4 h-4 text-zinc-500" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs">Mic Input</span>
                        <span className="text-[9px] text-purple-300/60 font-sans">Voice speech input</span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isListening ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isListening ? 'ACTIVE' : 'OFF'}
                    </span>
                  </button>

                  {/* Option 2: Speaker Voice Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playNodeClick(voiceEnabled ? 300 : 800);
                      setVoiceEnabled(!voiceEnabled);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                      voiceEnabled
                        ? 'bg-purple-900/60 border-purple-400 text-white'
                        : 'bg-zinc-900/60 border-purple-500/20 text-zinc-400 hover:bg-purple-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {voiceEnabled ? (
                        <Volume2 className="w-4 h-4 text-purple-300" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-zinc-500" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs">Speaker Output</span>
                        <span className="text-[9px] text-purple-300/60 font-sans">Speech audio synthesis</span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        voiceEnabled ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {voiceEnabled ? 'ACTIVE' : 'MUTED'}
                    </span>
                  </button>

                  {/* Option 3: Clear Chat */}
                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playNodeClick(400);
                      setMessages(INITIAL_MESSAGES);
                      setIsOptionsMenuOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-rose-200">Clear Chat</span>
                        <span className="text-[9px] text-rose-300/60 font-sans">Reset message stream</span>
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

      {/* Offline Status Error Banner */}
      {offlineNotice && (
        <div className="mb-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>100% Offline Mode Active:</strong> Neural stream disconnected. Local Companion Engine & Memory Store are operational.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                audioSynth.playNodeClick(400);
                setOfflineNotice(null);
              }}
              className="px-3 py-1 bg-amber-900/80 hover:bg-amber-800 text-amber-100 rounded-lg text-[11px] font-bold border border-amber-400/40 transition-all"
            >
              Proceed
            </button>
            <button
              onClick={async () => {
                audioSynth.playNodeClick(700);
                try {
                  const res = await loggedFetch(getApiEndpoint('/api/health'), { signal: AbortSignal.timeout(4000) });
                  if (res.ok) {
                    setOfflineNotice(null);
                    audioSynth.playEnergyBloom();
                  } else {
                    audioSynth.triggerHaptic([30, 30]);
                  }
                } catch (e) {
                  audioSynth.triggerHaptic([30, 30]);
                }
              }}
              className="px-3 py-1 bg-purple-950 hover:bg-purple-900 text-purple-200 rounded-lg text-[11px] font-bold border border-purple-500/40 transition-all flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3 text-purple-300" /> Restore / Refresh
            </button>
          </div>
        </div>
      )}

      {/* Message Stream Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar my-2">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                  isUser
                    ? 'bg-indigo-950/80 border-indigo-400 text-indigo-300'
                    : 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-[0_0_12px_#A855F7]'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Content */}
              <div
                className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl border text-xs leading-relaxed font-mono backdrop-blur-2xl ${
                  isUser
                    ? 'bg-indigo-950/50 border-indigo-400/40 text-indigo-100 rounded-tr-none shadow-[0_10px_25px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                    : 'bg-black/80 border-white/15 text-purple-100 rounded-tl-none shadow-[0_15px_35px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                }`}
              >
                {!isUser && msg.thoughtProcess && (
                  <div className="text-[10px] text-purple-400/60 border-b border-purple-500/20 pb-1.5 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>{msg.thoughtProcess}</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Media Attachments (Image / Video / Audio / Code) */}
                {msg.mediaAttachments && msg.mediaAttachments.map((att, attIdx) => (
                  <MediaAttachmentCard key={attIdx} attachment={att} />
                ))}

                {msg.stagedAction && (
                  <div className="mt-3 p-3.5 rounded-xl bg-purple-950/60 border border-purple-500/40 flex flex-col gap-2 font-mono text-xs">
                    <div className="flex items-center justify-between text-amber-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Action Staged [{msg.stagedAction.proposalId}]
                      </span>
                      <span className="text-[10px] text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded uppercase">
                        {msg.stagedAction.status}
                      </span>
                    </div>
                    <div className="text-white">
                      <span className="text-purple-400">Tool:</span> {msg.stagedAction.toolName}
                    </div>
                    <div className="text-emerald-300 bg-black/60 p-2 rounded border border-purple-500/20 font-sans text-xs">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(msg.stagedAction.arguments, null, 2)}</pre>
                    </div>

                    {msg.stagedAction.status === 'PENDING_APPROVAL' ? (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-500/20">
                        <button
                          onClick={() => {
                            audioSynth.playNodeClick(300);
                            const resolved = approvalGate.resolve_proposal(msg.stagedAction!.proposalId, false);
                            setMessages((prev) =>
                              prev.map((m) =>
                                m.id === msg.id
                                  ? {
                                      ...m,
                                      stagedAction: {
                                        ...m.stagedAction!,
                                        status: 'REJECTED',
                                        executionResult: resolved.execution_result,
                                      },
                                    }
                                  : m
                              )
                            );
                          }}
                          className="px-3 py-1 bg-rose-950 border border-rose-500/40 text-rose-300 hover:bg-rose-900 text-xs font-bold rounded-lg flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => {
                            audioSynth.playNodeClick(700);
                            const resolved = approvalGate.resolve_proposal(msg.stagedAction!.proposalId, true);
                            setMessages((prev) =>
                              prev.map((m) =>
                                m.id === msg.id
                                  ? {
                                      ...m,
                                      stagedAction: {
                                        ...m.stagedAction!,
                                        status: 'EXECUTED',
                                        executionResult: resolved.execution_result,
                                      },
                                    }
                                  : m
                              )
                            );
                          }}
                          className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Execute
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-purple-300/80 pt-1 border-t border-purple-500/20">
                        Result: {msg.stagedAction.executionResult || 'Completed'}
                      </div>
                    )}
                  </div>
                )}
                <div className={`text-[9px] mt-2 font-sans flex items-center justify-between gap-2 border-t pt-1.5 ${isUser ? 'text-indigo-400/60 border-indigo-500/20' : 'text-purple-400/60 border-purple-500/20'}`}>
                  <span>{msg.timestamp}</span>
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="flex items-center gap-1 text-[10px] font-mono hover:text-white transition-all px-1.5 py-0.5 rounded bg-black/40 hover:bg-black/80"
                    title="Copy message text"
                  >
                    {copiedId === msg.id ? (
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
          );
        })}

        {isSending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-950/80 border border-purple-400 flex items-center justify-center text-purple-300 shadow-[0_0_12px_#A855F7]">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-black border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span className="font-mono">Synthesizing response...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 shrink-0 no-scrollbar">
        {[
          'Synthesize active directives',
          'Analyze recent memory echoes',
          'How is core system thermal state?',
        ].map((chip) => (
          <button
            key={chip}
            onClick={() => handleSendMessage(undefined, chip)}
            className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider text-purple-300/80 hover:text-white bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/30 whitespace-nowrap transition-all"
          >
            + {chip}
          </button>
        ))}
      </div>

      {/* Mic Permission Banner Notice */}
      {micNotice && (
        <div className="p-2.5 rounded-xl bg-purple-950/90 border border-purple-400/50 flex items-center justify-between text-xs text-purple-200 mb-2">
          <div className="flex items-center gap-2">
            <MicOff className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
            <p className="text-[11px] leading-tight">{micNotice}</p>
          </div>
          <button
            onClick={() => setMicNotice(null)}
            className="px-2 py-0.5 text-[9px] font-bold rounded bg-purple-800 text-white shrink-0 ml-2"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Function Options Toolbar Above Chat Input */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar px-1 py-1 my-1.5 bg-zinc-950/85 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-lg shrink-0">
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

      {/* Attached Files Preview Strip */}
      <AnimatePresence>
        {attachedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 overflow-x-auto p-2 bg-purple-950/60 border border-purple-500/40 rounded-2xl mb-1.5 shrink-0 custom-scrollbar"
          >
            {attachedFiles.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-900/50 border border-purple-400/40 text-purple-100 text-xs font-mono shrink-0 relative group"
              >
                {att.type === 'image' && att.previewUrl ? (
                  <img src={att.previewUrl} alt={att.name} className="w-6 h-6 object-cover rounded-md border border-purple-300/40" />
                ) : (
                  <FileText className="w-4 h-4 text-purple-300 shrink-0" />
                )}
                <div className="flex flex-col max-w-[120px]">
                  <span className="truncate font-bold text-[11px]">{att.name}</span>
                  <span className="text-[9px] text-purple-300/60">{att.sizeFormatted}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playNodeClick(300);
                    if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
                    setAttachedFiles((prev) => prev.filter((a) => a.id !== att.id));
                  }}
                  className="p-2 rounded-full bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white transition-all ml-1 shrink-0"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.txt,.csv,.json,.md,.js,.ts,.html,.css"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processSelectedFiles(e.target.files);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="relative flex items-center shrink-0 mt-1">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPaste={handlePaste}
          placeholder={isListening ? "Listening to your voice..." : "Speak, type, or attach media/files to Possibilities..."}
          className={`w-full bg-purple-950/30 border rounded-full pl-5 pr-32 py-3.5 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 shadow-inner font-mono transition-all ${
            isListening ? 'border-purple-400 bg-purple-900/30 ring-1 ring-purple-400/50' : 'border-purple-500/40'
          }`}
        />
        <div className="absolute right-1.5 flex items-center gap-1.5">
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => {
              audioSynth.playNodeClick(500);
              fileInputRef.current?.click();
            }}
            className="w-9 h-9 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 hover:border-purple-400 hover:text-white flex items-center justify-center transition-all relative"
            title="Attach Image, Video, File or Document"
          >
            <Paperclip className="w-4 h-4" />
            {attachedFiles.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-bold flex items-center justify-center border border-black">
                {attachedFiles.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={toggleMic}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${
              isListening
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_#A855F7] animate-pulse'
                : 'bg-purple-950/80 text-purple-300 border-purple-500/30 hover:border-purple-400'
            }`}
            title="Toggle Voice Mic Input"
          >
            {isListening ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-purple-300" />}
          </button>

          <button
            type="submit"
            disabled={isSending || (!inputText.trim() && attachedFiles.length === 0)}
            className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-[0_0_15px_#A855F7]"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* AI Creation Studio Modal */}
      <AiCreationStudioModal
        isOpen={isStudioOpen}
        initialTab={studioTab}
        onClose={() => setIsStudioOpen(false)}
        onSendToChat={handleStudioSendToChat}
      />

      {/* System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* App Lifecycle & Vault Backup Modal */}
      <AppLifecycleBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      {/* Biometric Tool Execution Gatekeeper Modal */}
      {activeProposal && (
        <ApprovalGateModal
          proposal={activeProposal}
          onReject={() => setActiveProposal(null)}
          onSuccess={(result) => {
            setActiveProposal(null);
            const sysMsg: ChatMessage = {
              id: `p-exec-${Date.now()}`,
              sender: 'possibilities',
              text: `Tool Execution Authorized & Applied:\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              thoughtProcess: 'Mutative tool execution authorized via Biometric Authority Sign-Off.',
            };
            setMessages((prev) => [...prev, sysMsg]);
            audioSynth.playEnergyBloom();
          }}
        />
      )}
    </div>
  );
};
