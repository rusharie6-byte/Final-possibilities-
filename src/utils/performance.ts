export type PerformanceSetting = 'auto' | 'high' | 'low';

class PerformanceManager {
  private modeSetting: PerformanceSetting = 'auto';
  private currentFps = 60;
  private effectiveMode: 'high' | 'low' = 'high';
  private frameCount = 0;
  private lastTime = performance.now();
  private fpsHistory: number[] = [];
  private listeners: Set<() => void> = new Set();
  private animFrameId: number | null = null;

  constructor() {
    // Load saved preference if available
    const saved = localStorage.getItem('possibilities_perf_mode') as PerformanceSetting;
    if (saved && ['auto', 'high', 'low'].includes(saved)) {
      this.modeSetting = saved;
    }

    // Initial hardware check: if low CPU core count or mobile memory hint, default low
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
      this.effectiveMode = 'low';
    }

    this.startFpsTracker();

    // Pause FPS tracker when tab is hidden to save CPU/battery
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stopFpsTracker();
        } else {
          this.startFpsTracker();
        }
      });
    }
  }

  public getSetting(): PerformanceSetting {
    return this.modeSetting;
  }

  public getEffectiveMode(): 'high' | 'low' {
    if (this.modeSetting === 'high') return 'high';
    if (this.modeSetting === 'low') return 'low';
    return this.effectiveMode;
  }

  public getFps(): number {
    return this.currentFps;
  }

  public setSetting(setting: PerformanceSetting) {
    this.modeSetting = setting;
    localStorage.setItem('possibilities_perf_mode', setting);
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private startFpsTracker() {
    if (this.animFrameId) return;

    this.lastTime = performance.now();
    this.frameCount = 0;

    const tick = (now: number) => {
      this.frameCount++;
      const delta = now - this.lastTime;

      if (delta >= 500) {
        this.currentFps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastTime = now;

        this.fpsHistory.push(this.currentFps);
        if (this.fpsHistory.length > 6) {
          this.fpsHistory.shift();
        }

        // Auto-adapt if mode is set to 'auto'
        if (this.modeSetting === 'auto') {
          const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
          const newEffective = avgFps < 45 ? 'low' : 'high';
          if (newEffective !== this.effectiveMode) {
            this.effectiveMode = newEffective;
            this.notify();
          }
        } else {
          this.notify();
        }
      }

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private stopFpsTracker() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}

export const perfManager = new PerformanceManager();
