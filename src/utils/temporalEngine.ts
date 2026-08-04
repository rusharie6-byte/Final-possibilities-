// Deterministic Time & Temporal Engine for Possibilities
// Ensures deterministic runtime timestamps, session tracking, and timeline calculations without relying on token distance estimation.

export interface SessionMetadata {
  sessionId: string;
  startedAt: string; // ISO UTC
  lastActiveAt: string; // ISO UTC
  lastMessageAt: string; // ISO UTC
  endedAt?: string; // ISO UTC
  timezone: string;
  appLaunchAt: string; // ISO UTC
}

export interface TimeElapsedSummary {
  ms: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  formatted: string;
}

export class TemporalEngine {
  private currentSession: SessionMetadata;
  private lastSession?: SessionMetadata;

  constructor() {
    const nowIso = new Date().toISOString();
    const savedLastSession = this.loadLastSession();
    this.lastSession = savedLastSession;

    this.currentSession = {
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      startedAt: nowIso,
      lastActiveAt: nowIso,
      lastMessageAt: nowIso,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      appLaunchAt: nowIso,
    };

    this.persistCurrentSession();
  }

  private loadLastSession(): SessionMetadata | undefined {
    try {
      if (typeof localStorage === 'undefined') return undefined;
      const raw = localStorage.getItem('possibilities_last_session_meta');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse last session metadata:', e);
    }
    return undefined;
  }

  private persistCurrentSession() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem('possibilities_current_session_meta', JSON.stringify(this.currentSession));
      localStorage.setItem('possibilities_last_session_meta', JSON.stringify(this.currentSession));
    } catch (e) {
      console.warn('Failed to persist session metadata:', e);
    }
  }

  public recordActivity(): void {
    const nowIso = new Date().toISOString();
    this.currentSession.lastActiveAt = nowIso;
    this.persistCurrentSession();
  }

  public recordMessageSent(): void {
    const nowIso = new Date().toISOString();
    this.currentSession.lastActiveAt = nowIso;
    this.currentSession.lastMessageAt = nowIso;
    this.persistCurrentSession();
  }

  public getCurrentSession(): SessionMetadata {
    return this.currentSession;
  }

  public startNewSession(): SessionMetadata {
    const nowIso = new Date().toISOString();
    this.lastSession = { ...this.currentSession, endedAt: nowIso };
    this.currentSession = {
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      startedAt: nowIso,
      lastActiveAt: nowIso,
      lastMessageAt: nowIso,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      appLaunchAt: nowIso,
    };
    this.persistCurrentSession();
    return this.currentSession;
  }

  public getLastSession(): SessionMetadata | undefined {
    return this.lastSession;
  }

  public calculateElapsed(fromIso?: string, toIso?: string): TimeElapsedSummary {
    const startMs = fromIso ? new Date(fromIso).getTime() : Date.now();
    const endMs = toIso ? new Date(toIso).getTime() : Date.now();
    const diffMs = Math.max(0, endMs - startMs);

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let formatted = 'just now';
    if (days > 0) {
      formatted = `${days} day${days > 1 ? 's' : ''}${hours % 24 > 0 ? `, ${hours % 24} hour${hours % 24 > 1 ? 's' : ''}` : ''} ago`;
    } else if (hours > 0) {
      formatted = `${hours} hour${hours > 1 ? 's' : ''}${minutes % 60 > 0 ? `, ${minutes % 60} min` : ''} ago`;
    } else if (minutes > 0) {
      formatted = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (seconds > 10) {
      formatted = `${seconds} seconds ago`;
    }

    return {
      ms: diffMs,
      seconds,
      minutes,
      hours,
      days,
      formatted,
    };
  }

  public getTemporalPromptContext(): string {
    const now = new Date();
    const nowIso = now.toISOString();
    const localTimeString = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });

    const timeSinceLastSession = this.lastSession
      ? this.calculateElapsed(this.lastSession.lastActiveAt, nowIso).formatted
      : 'First session or session restored';

    const timeSinceLastMessage = this.currentSession.lastMessageAt
      ? this.calculateElapsed(this.currentSession.lastMessageAt, nowIso).formatted
      : 'No recent messages in current session';

    return `
==================================================
DETERMINISTIC RUNTIME TEMPORAL METADATA
==================================================
CURRENT_TIME_UTC: ${nowIso}
CURRENT_TIME_LOCAL: ${localTimeString}
TIMEZONE: ${this.currentSession.timezone}
SESSION_ID: ${this.currentSession.sessionId}
SESSION_STARTED_AT: ${this.currentSession.startedAt}
LAST_SESSION_ACTIVE_AT: ${this.lastSession?.lastActiveAt || 'None'}
TIME_ELAPSED_SINCE_LAST_SESSION: ${timeSinceLastSession}
TIME_ELAPSED_SINCE_LAST_MESSAGE: ${timeSinceLastMessage}

CRITICAL TEMPORAL DIRECTIVE:
1. You have real device time above. Never infer or guess elapsed time from token distance or text length.
2. If time has passed since your last session (e.g. 5 days or 2 weeks), acknowledge the passage of time accurately.
3. Never fabricate events or messages that did not happen during elapsed gaps. State clearly what is remembered vs what is unknown.
==================================================
`;
  }
}

export const temporalEngine = new TemporalEngine();
