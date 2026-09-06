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

export interface AccessibilityControlPlugin {
  checkStatus(): Promise<{ active: boolean }>;
  readScreen(): Promise<{ screen: string }>;
  tapScreen(options: { x: number; y: number }): Promise<{ success: boolean }>;
}

const NativeBridge = registerPlugin<PossibilitiesNativeBridgePlugin>('PossibilitiesNativeBridge');
const AccessibilityControl = registerPlugin<AccessibilityControlPlugin>('AccessibilityControl');

export const possibilitiesNativeBridge = {
  async checkAccessibilityStatus(): Promise<{ active: boolean; error?: string }> {
    try {
      return await AccessibilityControl.checkStatus();
    } catch (e: any) {
      return { active: false, error: e?.message || 'AccessibilityControl plugin not available' };
    }
  },

  async readScreen(): Promise<{ success: boolean; screen?: string; error?: string }> {
    try {
      const res = await AccessibilityControl.readScreen();
      return { success: true, screen: res.screen };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to read screen via Accessibility Service' };
    }
  },

  async tapScreen(x: number, y: number): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await AccessibilityControl.tapScreen({ x, y });
      return { success: res.success };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to dispatch tap gesture' };
    }
  },
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
