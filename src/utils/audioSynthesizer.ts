/**
 * Web Audio API procedural audio synthesizer for Possibilities Shell.
 * Zero external audio assets required - pure mathematical sound generation.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(0, this.ctx?.currentTime || 0, 0.1);
    }
  }

  public triggerHaptic(pattern: number[] = [15, 30, 15]) {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignored if haptics blocked by permissions
      }
    }
  }

  /**
   * Played at 0ms and 270ms of Orb entry sequence
   */
  public playOrbPulse(frequency = 120, duration = 0.4) {
    // Button/synth sound effects removed per user request ("remove it it doesnt belong")
    return;
  }

  /**
   * Played at 270ms when purple bloom fills screen
   */
  public playEnergyBloom() {
    // Button/synth sound effects removed per user request
    return;
  }

  /**
   * Played when selecting radial Nexus node or clicking interactive button
   */
  public playNodeClick(frequency = 587.33) {
    // Button/synth sound effects removed per user request
    return;
  }

  /**
   * Start subtle ambient background hum
   */
  public startAmbientHum() {
    // Button/synth sound effects removed per user request
    return;
  }

  /**
   * Optional Speech Synthesis for text-to-speech output
   */
  public speak(text: string) {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.95;
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }
}

export const audioSynth = new AudioSynthesizer();
