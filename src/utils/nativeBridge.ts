// Native Android Capacitor Bridge Helper for Possibilities

import { registerPlugin } from '@capacitor/core';

export interface PossibilitiesNativeBridgePlugin {
  getSystemCapabilities(): Promise<{
    batteryLevel?: number;
    isNativeBridgeActive: boolean;
    handsFreeReady: boolean;
    deepLinkScheme?: string;
    error?: string;
  }>;
  setKeepScreenOn(options: { enable: boolean }): Promise<{ keepScreenOn: boolean }>;
  notifyWakeWordTrigger(): Promise<{ triggered: boolean; timestamp: number }>;
  addListener(
    eventName: 'onWakeWordIntent',
    listenerFunc: (data: { triggered: boolean; timestamp: number }) => void
  ): Promise<{ remove: () => void }>;
}

const NativeBridge = registerPlugin<PossibilitiesNativeBridgePlugin>('PossibilitiesNativeBridge');

export const possibilitiesNativeBridge = {
  async requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return { granted: true };
      }
      return { granted: false, error: 'MediaDevices API not supported' };
    } catch (e: any) {
      return { granted: false, error: e?.message || 'Microphone permission denied' };
    }
  },

  async requestMediaPermissions(): Promise<{ granted: boolean; error?: string }> {
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).permissions) {
        return { granted: true };
      }
      return { granted: true };
    } catch (e: any) {
      return { granted: false, error: e?.message || 'Media permission query failed' };
    }
  },

  async getCapabilities() {
    try {
      return await NativeBridge.getSystemCapabilities();
    } catch (e) {
      return { isNativeBridgeActive: false, handsFreeReady: false, error: String(e) };
    }
  },

  async setKeepScreenOn(enable: boolean) {
    try {
      return await NativeBridge.setKeepScreenOn({ enable });
    } catch (e) {
      console.warn('[NativeBridge] setKeepScreenOn fallback:', e);
      return { keepScreenOn: false };
    }
  },

  async setupHotwordListener(onTrigger: () => void) {
    try {
      return await NativeBridge.addListener('onWakeWordIntent', () => {
        onTrigger();
      });
    } catch (e) {
      console.warn('[NativeBridge] Hotword listener unavailable in web browser preview:', e);
      return null;
    }
  },
};
