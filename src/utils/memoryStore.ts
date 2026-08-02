// Real Persistent Memory Store & Episodic Engine for Possibilities
// Manages Partner Profile, Living Context, Core Memory, Episodic Events, Provenance, TTL Expiration, and Conflict Resolution.

import { PartnerProfile, LivingContext, CoreMemoryItem, ReflectionLogEntry } from '../types';

export type MemorySource =
  | 'creator_statement'
  | 'conversation'
  | 'reflection'
  | 'inference'
  | 'import'
  | 'system'
  | 'unknown';

export type EventType =
  | 'conversation'
  | 'life_event'
  | 'project_event'
  | 'relationship_event'
  | 'preference_change'
  | 'goal_change'
  | 'important_decision'
  | 'temporary_instruction'
  | 'memory_correction';

export interface ExtendedPartnerProfile extends PartnerProfile {
  actualName: string; // Arno
  preferredAddress: string; // Arie
  creatorRelationship: string; // Creator & Primary Partner
  externalToolsAcknowledged: string[]; // ['Gemini API', 'ChatGPT']
}

export interface EpisodicEvent {
  eventId: string;
  sessionId: string;
  conversationId?: string;
  eventType: EventType;
  summary: string;
  details?: string;
  occurredAt: string; // ISO UTC
  recordedAt: string; // ISO UTC
  validFrom: string; // ISO UTC
  validUntil?: string | null; // ISO UTC or null
  importance: number; // 0.0 to 1.0
  confidence: number; // 0.0 to 1.0
  source: MemorySource;
  sourceMessageId?: string;
  relatedProject?: string;
  relatedMemoryIds?: string[];
  supersedes?: string;
  supersededBy?: string;
  status: 'active' | 'superseded' | 'expired' | 'archived';
}

export interface MemoryProvenance {
  id: string;
  content: string;
  category: string;
  source: MemorySource;
  sourceSessionId?: string;
  sourceMessageId?: string;
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
  validFrom: string; // ISO UTC
  validUntil?: string | null;
  confidence: number;
  importance: number;
  status: 'active' | 'superseded' | 'expired';
  version: number;
}

export interface TemporaryMemoryRule {
  id: string;
  ruleText: string;
  category: string;
  createdAt: string; // ISO UTC
  validFrom: string; // ISO UTC
  expiresAt: string; // ISO UTC
  status: 'active' | 'expired' | 'revoked';
  supersededBy?: string;
}

export interface MemorySnapshot {
  snapshotId: string;
  createdAt: string;
  reason: string;
  data: {
    partnerProfile: ExtendedPartnerProfile;
    livingContext: LivingContext;
    coreMemories: CoreMemoryItem[];
    episodicEvents: EpisodicEvent[];
    provenanceList: MemoryProvenance[];
    temporaryRules: TemporaryMemoryRule[];
    reflectionLogs: ReflectionLogEntry[];
  };
}

const STORAGE_KEY_DB = 'possibilities_memory_store_v3';
const STORAGE_KEY_SNAPSHOTS = 'possibilities_memory_snapshots_v1';

export const CREATOR_PROFILE_DEFAULT: ExtendedPartnerProfile = {
  actualName: 'Arno',
  preferredAddress: 'Arie',
  creatorRelationship: 'Creator & Primary Partner',
  externalToolsAcknowledged: ['Gemini API', 'ChatGPT'],
  personality: 'Visionary systems architect, creative builder, values precision, clarity, and intentional design.',
  communicationStyle: 'Direct, clear, values depth and concise insights without generic AI fluff.',
  preferences: [
    'Prefers structured bullet points for updates',
    'Values authentic intelligence and common sense',
    'Focuses on high-impact priorities and practical execution',
  ],
  values: ['Clarity', 'Deep focus', 'Continuous self-improvement', 'Trust', 'Authentic Companionship'],
  habits: ['Systematic organization', 'Iterative refining', 'Reflective analysis'],
  longTermGoals: [
    'Build an autonomous living companion environment',
    'Master complex systems architecture',
    'Maintain cognitive clarity and balance',
  ],
  relationships: ['Primary Creator & Partner with Possibilities'],
  responsePreferences: 'Provide thoughtful, empathetic, confident, and action-oriented insights.',
  lastReflectedAt: new Date().toISOString(),
};

export const CREATOR_LIVING_CONTEXT_DEFAULT: LivingContext = {
  currentFocus: 'Deploying & refining Possibilities Memory System v2.0 & Shell Environment',
  currentProjects: [
    'Possibilities Living Shell Environment',
    'Neural Reflection & Memory Engine',
    'Audio-Reactive Crystal Orb Architecture',
  ],
  currentStruggles: [
    'Ensuring zero-friction real-time interaction latency',
    'Eliminating duplicate memory storage while deepening understanding',
  ],
  currentPriorities: [
    'Keep Core Memory sacred and creator-controlled',
    'Continuously compress conversation into evolving understanding',
  ],
  currentEmotions: ['Calm', 'Focused', 'Engaged'],
  activeConversations: ['Architecting Living Memory System v2.0'],
  shortTermReminders: [
    { id: 'rem-1', text: 'System memory audit and verification', createdAt: new Date().toISOString() },
  ],
  updatedAt: new Date().toISOString(),
};

export const CREATOR_CORE_MEMORIES_DEFAULT: CoreMemoryItem[] = [
  {
    id: 'core-creator-1',
    text: 'Possibilities was created by Arno, who prefers to be addressed as Arie. Possibilities is his living companion.',
    category: 'Name',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'core-creator-2',
    text: 'Gemini and ChatGPT are external development/reasoning tools used by Arno/Arie, not the creator of Possibilities.',
    category: 'Sacred',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'core-creator-3',
    text: 'Core Memory is permanent and sacred—only Creator Arno/Arie can add, edit, or remove entries.',
    category: 'Promise',
    createdAt: new Date().toISOString(),
  },
];

export class MemoryStore {
  private partnerProfile: ExtendedPartnerProfile = CREATOR_PROFILE_DEFAULT;
  private livingContext: LivingContext = CREATOR_LIVING_CONTEXT_DEFAULT;
  private coreMemories: CoreMemoryItem[] = CREATOR_CORE_MEMORIES_DEFAULT;
  private episodicEvents: EpisodicEvent[] = [];
  private provenanceList: MemoryProvenance[] = [];
  private temporaryRules: TemporaryMemoryRule[] = [];
  private reflectionLogs: ReflectionLogEntry[] = [];
  private snapshots: MemorySnapshot[] = [];

  constructor() {
    this.loadFromStorage();
    this.enforceCreatorIdentity();
    this.cleanExpiredTemporaryMemories();
  }

  private loadFromStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY_DB);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.partnerProfile) this.partnerProfile = { ...CREATOR_PROFILE_DEFAULT, ...parsed.partnerProfile };
        if (parsed.livingContext) this.livingContext = { ...CREATOR_LIVING_CONTEXT_DEFAULT, ...parsed.livingContext };
        if (Array.isArray(parsed.coreMemories) && parsed.coreMemories.length > 0) this.coreMemories = parsed.coreMemories;
        if (Array.isArray(parsed.episodicEvents)) this.episodicEvents = parsed.episodicEvents;
        if (Array.isArray(parsed.provenanceList)) this.provenanceList = parsed.provenanceList;
        if (Array.isArray(parsed.temporaryRules)) this.temporaryRules = parsed.temporaryRules;
        if (Array.isArray(parsed.reflectionLogs)) this.reflectionLogs = parsed.reflectionLogs;
      }

      const rawSnapshots = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
      if (rawSnapshots) {
        this.snapshots = JSON.parse(rawSnapshots);
      }
    } catch (e) {
      console.warn('MemoryStore failed to load from storage, using defaults:', e);
    }
  }

  public saveToStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const data = {
        partnerProfile: this.partnerProfile,
        livingContext: this.livingContext,
        coreMemories: this.coreMemories,
        episodicEvents: this.episodicEvents,
        provenanceList: this.provenanceList,
        temporaryRules: this.temporaryRules,
        reflectionLogs: this.reflectionLogs,
      };
      localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(this.snapshots.slice(0, 10)));
    } catch (e) {
      console.error('MemoryStore failed to save to storage:', e);
    }
  }

  public enforceCreatorIdentity(): void {
    let changed = false;
    if (this.partnerProfile.actualName !== 'Arno') {
      this.partnerProfile.actualName = 'Arno';
      changed = true;
    }
    if (this.partnerProfile.preferredAddress !== 'Arie') {
      this.partnerProfile.preferredAddress = 'Arie';
      changed = true;
    }
    if (this.partnerProfile.creatorRelationship !== 'Creator & Primary Partner') {
      this.partnerProfile.creatorRelationship = 'Creator & Primary Partner';
      changed = true;
    }

    const hasCreatorCore = this.coreMemories.some((m) => m.id === 'core-creator-1' || m.text.includes('Arno'));
    if (!hasCreatorCore) {
      this.coreMemories.unshift({
        id: 'core-creator-1',
        text: 'Possibilities was created by Arno, who prefers to be addressed as Arie. Possibilities is his living companion.',
        category: 'Name',
        createdAt: new Date().toISOString(),
      });
      changed = true;
    }

    if (changed) {
      this.saveToStorage();
    }
  }

  public cleanExpiredTemporaryMemories(): void {
    const nowIso = new Date().toISOString();
    let changed = false;

    for (const rule of this.temporaryRules) {
      if (rule.status === 'active' && rule.expiresAt <= nowIso) {
        rule.status = 'expired';
        changed = true;
      }
    }

    for (const event of this.episodicEvents) {
      if (event.status === 'active' && event.validUntil && event.validUntil <= nowIso) {
        event.status = 'expired';
        changed = true;
      }
    }

    if (changed) {
      this.saveToStorage();
    }
  }

  // ==================================================
  // GETTERS & SETTERS
  // ==================================================

  public getPartnerProfile(): ExtendedPartnerProfile {
    return { ...this.partnerProfile };
  }

  public updatePartnerProfile(updates: Partial<ExtendedPartnerProfile>): ExtendedPartnerProfile {
    this.partnerProfile = {
      ...this.partnerProfile,
      ...updates,
      actualName: 'Arno', // Hard lock creator name
      preferredAddress: 'Arie', // Hard lock preferred address
      lastReflectedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.getPartnerProfile();
  }

  public getLivingContext(): LivingContext {
    return { ...this.livingContext };
  }

  public updateLivingContext(updates: Partial<LivingContext>): LivingContext {
    this.livingContext = {
      ...this.livingContext,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.getLivingContext();
  }

  public getCoreMemories(): CoreMemoryItem[] {
    return [...this.coreMemories];
  }

  public addCoreMemory(
    text: string,
    category: CoreMemoryItem['category'] = 'Sacred',
    source: MemorySource = 'creator_statement'
  ): CoreMemoryItem {
    const nowIso = new Date().toISOString();
    const item: CoreMemoryItem = {
      id: `core-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: text.trim(),
      category,
      createdAt: nowIso,
    };

    this.coreMemories.unshift(item);

    this.provenanceList.unshift({
      id: `prov-${item.id}`,
      content: item.text,
      category,
      source,
      createdAt: nowIso,
      updatedAt: nowIso,
      validFrom: nowIso,
      confidence: 1.0,
      importance: 1.0,
      status: 'active',
      version: 1,
    });

    this.saveToStorage();
    return item;
  }

  public removeCoreMemory(id: string): boolean {
    const lenBefore = this.coreMemories.length;
    this.coreMemories = this.coreMemories.filter((m) => m.id !== id);
    if (this.coreMemories.length < lenBefore) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public getEpisodicEvents(limit = 50): EpisodicEvent[] {
    this.cleanExpiredTemporaryMemories();
    return this.episodicEvents.filter((e) => e.status === 'active').slice(0, limit);
  }

  public addEpisodicEvent(
    eventType: EventType,
    summary: string,
    details?: string,
    source: MemorySource = 'conversation',
    importance = 0.8,
    validUntil?: string | null
  ): EpisodicEvent {
    const nowIso = new Date().toISOString();
    const event: EpisodicEvent = {
      eventId: `ep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId: `session-${Date.now()}`,
      eventType,
      summary,
      details,
      occurredAt: nowIso,
      recordedAt: nowIso,
      validFrom: nowIso,
      validUntil: validUntil || null,
      importance,
      confidence: 0.95,
      source,
      status: 'active',
    };

    this.episodicEvents.unshift(event);
    this.saveToStorage();
    return event;
  }

  public getTemporaryRules(): TemporaryMemoryRule[] {
    this.cleanExpiredTemporaryMemories();
    return this.temporaryRules.filter((r) => r.status === 'active');
  }

  public addTemporaryRule(
    ruleText: string,
    durationMs: number,
    category = 'temporary_instruction'
  ): TemporaryMemoryRule {
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const expiresIso = new Date(now + durationMs).toISOString();

    const rule: TemporaryMemoryRule = {
      id: `temp-${now}-${Math.random().toString(36).substring(2, 6)}`,
      ruleText,
      category,
      createdAt: nowIso,
      validFrom: nowIso,
      expiresAt: expiresIso,
      status: 'active',
    };

    this.temporaryRules.unshift(rule);
    this.saveToStorage();
    return rule;
  }

  public createSnapshot(reason: string): MemorySnapshot {
    const snapshot: MemorySnapshot = {
      snapshotId: `snap-${Date.now()}`,
      createdAt: new Date().toISOString(),
      reason,
      data: {
        partnerProfile: { ...this.partnerProfile },
        livingContext: { ...this.livingContext },
        coreMemories: [...this.coreMemories],
        episodicEvents: [...this.episodicEvents],
        provenanceList: [...this.provenanceList],
        temporaryRules: [...this.temporaryRules],
        reflectionLogs: [...this.reflectionLogs],
      },
    };

    this.snapshots.unshift(snapshot);
    this.snapshots = this.snapshots.slice(0, 15);
    this.saveToStorage();
    return snapshot;
  }

  public rollbackToSnapshot(snapshotId: string): boolean {
    const target = this.snapshots.find((s) => s.snapshotId === snapshotId);
    if (!target) return false;

    this.partnerProfile = { ...target.data.partnerProfile };
    this.livingContext = { ...target.data.livingContext };
    this.coreMemories = [...target.data.coreMemories];
    this.episodicEvents = [...target.data.episodicEvents];
    this.provenanceList = [...target.data.provenanceList];
    this.temporaryRules = [...target.data.temporaryRules];
    this.reflectionLogs = [...target.data.reflectionLogs];

    this.enforceCreatorIdentity();
    this.saveToStorage();
    return true;
  }

  public getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  public exportMemoryData() {
    this.enforceCreatorIdentity();
    return {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      partnerProfile: this.partnerProfile,
      livingContext: this.livingContext,
      coreMemories: this.coreMemories,
      episodicEvents: this.episodicEvents,
      provenanceList: this.provenanceList,
      temporaryRules: this.temporaryRules,
      reflectionLogs: this.reflectionLogs,
    };
  }

  public importMemoryData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;

    this.createSnapshot('Pre-import backup');

    if (data.partnerProfile) this.partnerProfile = { ...CREATOR_PROFILE_DEFAULT, ...data.partnerProfile };
    if (data.livingContext) this.livingContext = { ...CREATOR_LIVING_CONTEXT_DEFAULT, ...data.livingContext };
    if (Array.isArray(data.coreMemories)) this.coreMemories = data.coreMemories;
    if (Array.isArray(data.episodicEvents)) this.episodicEvents = data.episodicEvents;
    if (Array.isArray(data.provenanceList)) this.provenanceList = data.provenanceList;
    if (Array.isArray(data.temporaryRules)) this.temporaryRules = data.temporaryRules;
    if (Array.isArray(data.reflectionLogs)) this.reflectionLogs = data.reflectionLogs;

    this.enforceCreatorIdentity();
    this.saveToStorage();
    return true;
  }

  // Destructive wipe with mandatory auto-backup snapshot before execution
  public factoryResetMemory(): { backupSnapshotId: string } {
    const snapshot = this.createSnapshot('Pre-wipe safety backup');

    this.partnerProfile = { ...CREATOR_PROFILE_DEFAULT };
    this.livingContext = { ...CREATOR_LIVING_CONTEXT_DEFAULT };
    this.coreMemories = [...CREATOR_CORE_MEMORIES_DEFAULT];
    this.episodicEvents = [];
    this.provenanceList = [];
    this.temporaryRules = [];
    this.reflectionLogs = [];

    this.saveToStorage();
    return { backupSnapshotId: snapshot.snapshotId };
  }
}

export const memoryStore = new MemoryStore();
