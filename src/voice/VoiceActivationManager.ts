/**
 * WAKE & SLEEP WORD VOICE CONTROLLER
 * File Target: src/voice/VoiceActivationManager.ts
 */

export type VoiceState = 'SLEEP' | 'STANDBY' | 'LISTENING' | 'PROCESSING';

export interface VoiceStateChangeEvent {
  previousState: VoiceState;
  currentState: VoiceState;
  triggerWord?: string;
  timestamp: string;
}

export class VoiceActivationManager {
  private static instance: VoiceActivationManager;
  private currentState: VoiceState = 'SLEEP';
  private recognition: any = null;

  private wakeWords = ['possibilities', 'hey possibilities', 'possibility'];
  private sleepWords = ['sleep', 'go to sleep', 'standby', 'stop listening'];

  private listeners: ((event: VoiceStateChangeEvent) => void)[] = [];

  public static getInstance(): VoiceActivationManager {
    if (!VoiceActivationManager.instance) {
      VoiceActivationManager.instance = new VoiceActivationManager();
    }
    return VoiceActivationManager.instance;
  }

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[VOICE ENGINE] Web Speech API not supported on this engine/platform.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        this.processTranscript(transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('[VOICE ENGINE ERROR]', event.error);
    };

    this.recognition.onend = () => {
      // Auto-restart listener if in active listening/standby state
      if (this.currentState !== 'SLEEP') {
        try {
          this.recognition.start();
        } catch {
          // Already running
        }
      }
    };
  }

  public subscribeStateChanges(callback: (event: VoiceStateChangeEvent) => void): void {
    this.listeners.push(callback);
  }

  private setState(newState: VoiceState, triggerWord?: string): void {
    const previousState = this.currentState;
    this.currentState = newState;

    const event: VoiceStateChangeEvent = {
      previousState,
      currentState: newState,
      triggerWord,
      timestamp: new Date().toISOString(),
    };

    console.log(`[VOICE STATE TRANSITION] ${previousState} -> ${newState} (Trigger: ${triggerWord || 'NONE'})`);
    this.listeners.forEach(cb => cb(event));
  }

  public processTranscript(transcript: string): void {
    console.log(`[VOICE INPUT] "${transcript}" | Current State: ${this.currentState}`);

    // Check for Sleep Words when active
    if (this.currentState === 'LISTENING' || this.currentState === 'STANDBY') {
      for (const sleepWord of this.sleepWords) {
        if (transcript.includes(sleepWord)) {
          this.setState('SLEEP', sleepWord);
          this.stopContinuousListening();
          return;
        }
      }
    }

    // Check for Wake Words when sleeping/standby
    if (this.currentState === 'SLEEP' || this.currentState === 'STANDBY') {
      for (const wakeWord of this.wakeWords) {
        if (transcript.includes(wakeWord)) {
          this.setState('LISTENING', wakeWord);
          return;
        }
      }
    }
  }

  public startWakeWordMonitor(): void {
    if (!this.recognition) return;
    this.setState('STANDBY');
    try {
      this.recognition.start();
    } catch {
      // Listener active
    }
  }

  public stopContinuousListening(): void {
    this.setState('SLEEP');
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Stopped
      }
    }
  }

  public getCurrentState(): VoiceState {
    return this.currentState;
  }
}

export const voiceActivationManager = VoiceActivationManager.getInstance();
