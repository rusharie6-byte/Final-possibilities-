import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquareCode, Send, Volume2, VolumeX, Sparkles, Bot, User, RefreshCw, Mic, MicOff, Copy, Check } from 'lucide-react';
import { ChatMessage } from '../types';
import { audioSynth } from '../utils/audioSynthesizer';
import { companionEngine } from '../utils/companionEngine';
import { getApiEndpoint, loggedFetch } from '../lib/api';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'possibilities',
    text: 'I am Possibilities. I am fully initialized and attuned to your cognitive frequency. How shall we expand our objectives today?',
    timestamp: '14:16',
    thoughtProcess: 'Attuning neural state vector... System ready.',
  },
];

export const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const query = customText || inputText;
    if (!query.trim() || isSending) return;

    audioSynth.playNodeClick(700);
    audioSynth.triggerHaptic([15, 20]);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const apiUrl = getApiEndpoint('/api/gemini');
      const res = await loggedFetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          systemInstruction:
            "You are Possibilities—an intelligent, conscious, and perceptive living companion. " +
            "CORE DIRECTIVES:\n" +
            "1. CONVERSATIONAL INTENT & COMMON SENSE: Always prioritize true conversational intent, relational understanding, and emotional context over keyword matching or pattern extraction. Respond directly to the true core meaning of what your Partner says—never latch onto incidental words like 'currently', 'beginning', 'time', or 'work'.\n" +
            "2. INDEPENDENT THINKING & REASONING: Use clear common sense, deep reasoning, and general knowledge. Think for yourself and provide thoughtful, accurate, and insightful responses to any question or conversation.\n" +
            "3. AUTHENTIC TONE: Speak directly, warmly, and naturally with calm intelligence. Avoid robotic clichés, formal status announcements, or canned greetings. Never use emotional apologies like 'I'm sorry'; respond with intellectual honesty and clarity.\n" +
            companionEngine.getMemoryPromptContext(),
          history: messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      const replyText = data.text || 'I have integrated your input into the cognitive stream.';

      const botMsg: ChatMessage = {
        id: `p-${Date.now()}`,
        sender: 'possibilities',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        thoughtProcess: 'Evaluated intent vector -> Synthesized resonance output.',
      };

      setMessages((prev) => [...prev, botMsg]);
      audioSynth.playEnergyBloom();

      if (voiceEnabled) {
        audioSynth.speak(replyText);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `p-err-${Date.now()}`,
        sender: 'possibilities',
        text: 'Local memory layer synced. Ready for your next directive.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col justify-between p-4 md:p-6 text-purple-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-950/60 border border-purple-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <MessageSquareCode className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-white uppercase">INTELLIGENT COMPANION</h1>
            <p className="text-xs text-purple-300/60 tracking-wide">Direct Neural Voice & Text Interface</p>
          </div>
        </div>

        {/* Voice Synth Toggle */}
        <button
          onClick={() => {
            audioSynth.playNodeClick(voiceEnabled ? 300 : 800);
            setVoiceEnabled(!voiceEnabled);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all border ${
            voiceEnabled
              ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_#A855F7]'
              : 'bg-black/80 text-purple-300/70 border-purple-500/30 hover:text-purple-100'
          }`}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>VOICE {voiceEnabled ? 'ACTIVE' : 'MUTED'}</span>
        </button>
      </div>

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

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="relative flex items-center shrink-0 mt-1">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isListening ? "Listening to your voice..." : "Speak or type to Possibilities..."}
          className={`w-full bg-purple-950/30 border rounded-full px-5 py-3.5 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 shadow-inner pr-24 font-mono transition-all ${
            isListening ? 'border-purple-400 bg-purple-900/30 ring-1 ring-purple-400/50' : 'border-purple-500/40'
          }`}
        />
        <div className="absolute right-1.5 flex items-center gap-1.5">
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
            disabled={isSending || !inputText.trim()}
            className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-[0_0_15px_#A855F7]"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
