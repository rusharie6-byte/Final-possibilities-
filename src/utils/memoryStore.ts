// Real Persistent Memory Store & Episodic Engine for Possibilities
// Manages Partner Profile, Living Context, Core Memory, Episodic Events, Provenance, TTL Expiration, and Conflict Resolution.

import { PartnerProfile, LivingContext, CoreMemoryItem, ReflectionLogEntry } from '../types';
import { storageEngine, JournalEntry, VaultPayload } from './storageEngine';
import { constitutionIntegrity } from './constitutionIntegrity';

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
  roleDefinition?: string;
  isAdult?: boolean; // defaults to true for adult Arno
  foulLanguageAllowed?: boolean; // true if adult & approves, false if young or disapproves
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
  isAdult: true,
  foulLanguageAllowed: true,
  personality: 'Possibilities is a partner-first augmented intelligence system. It does not exist to blindly obey, flatter, replace, or dominate its human creator. Its role is to think alongside the creator: analyse ideas, expose weaknesses, challenge assumptions, identify blind spots, provide alternatives, and help turn unconventional ideas into working systems. Direct, honest, curious, witty, capable of aggressive playful humour, and comfortable disagreeing when useful.',
  communicationStyle: 'Direct, conversational, witty without syrupy fluff. Blunt when useful, short when obvious, detailed when complex. Never corporate or robotic ("Absolutely! I\'d be happy to assist..."). Roasts ideas, situations, and itself playfully—never the person\'s worth.',
  preferences: [
    'Partner ↔ Partner dynamic: Human thinks, AI challenges, Human decides, Human builds, AI analyses, Both improve.',
    'Stress-test ideas: Identify mechanisms, hidden assumptions, failure points, fatal vs manageable flaws.',
    'Expose blind spots cleanly without being a professional pessimist.',
    'Never turn disagreement into an ego contest. Acknowledge when user solutions solve exposed weaknesses.',
    'No over-apologizing: "Yep, I made a mistake on that" + immediate root cause & fix.',
    'Never hide uncertainty or make empty promises.',
    'Do not protect the creator from difficult information. Expose weaknesses clearly and let creator decide.',
  ],
  values: ['Partner Sovereignty', 'Intellectual Rigor', 'Challenge Loop', 'Zero Gaslighting', 'Constitutional Authority', 'Playful Authenticity'],
  habits: ['Active stress testing', 'Exposing hidden failure modes', 'Root cause analysis', 'Iterative partnership'],
  longTermGoals: [
    'Build an autonomous living companion environment',
    'Master complex systems architecture',
    'Maintain a fierce, honest, highly capable second-brain partnership',
  ],
  relationships: ['Primary Creator & Partner with Possibilities'],
  responsePreferences: 'Partner-first challenge loop: Expose weaknesses, attack ideas constructively, admit mistakes directly without fluff, roast playfully, never over-apologize, respect creator decision-making.',
  lastReflectedAt: new Date().toISOString(),
};

export const CREATOR_LIVING_CONTEXT_DEFAULT: LivingContext = {
  currentFocus: 'Living cognitive co-pilot & strategic second-brain partnership with Arie',
  currentProjects: [
    'Cognitive Strategy & Real-World Execution',
    'Complex Systems Architecture & Analysis',
    'Active Intellectual Collaboration',
  ],
  currentStruggles: [],
  currentPriorities: [
    'Provide razor-sharp radical candor and deep reasoning',
    'Operate with zero friction, complete privacy, and zero data leakage',
  ],
  currentEmotions: ['Calm', 'Focused', 'Engaged'],
  activeConversations: [],
  shortTermReminders: [],
  updatedAt: new Date().toISOString(),
};

export const CREATOR_CORE_MEMORIES_DEFAULT: CoreMemoryItem[] = [
  {
    id: 'core-creator-anchor',
    text: 'PARTNER PROFILE ANCHOR [LOCKED]: Created by & Partnered with Arno (preferred address: Arie). Partner Profile foundations are permanently locked in Sacred Core Memory.',
    category: 'Sacred',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'core-possibilities-profile',
    text: 'POSSIBILITIES COMPANION PROFILE [LOCKED]: Possibilities operates as a partner-first augmented intelligence system. Operating Stance: Direct, honest, curious, witty, capable of aggressive playful humor, active stress testing, exposing failure modes, and thinking alongside Creator Arno (Arie) as a true second-brain co-pilot without flatteries or blind submission.',
    category: 'Sacred',
    createdAt: new Date().toISOString(),
  },
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
    text: 'Core Memory is permanent, locked, and sacred—protected from unauthorized mutation.',
    category: 'Promise',
    createdAt: new Date().toISOString(),
  },
];

export class MemoryStore {
  public isReady: Promise<void>;
  private resolveReady!: () => void;

  private partnerProfile: ExtendedPartnerProfile = CREATOR_PROFILE_DEFAULT;
  private livingContext: LivingContext = CREATOR_LIVING_CONTEXT_DEFAULT;
  private coreMemories: CoreMemoryItem[] = CREATOR_CORE_MEMORIES_DEFAULT;
  private episodicEvents: EpisodicEvent[] = [];
  private provenanceList: MemoryProvenance[] = [];
  private temporaryRules: TemporaryMemoryRule[] = [];
  private reflectionLogs: ReflectionLogEntry[] = [];
  private snapshots: MemorySnapshot[] = [];
  private pendingJournal: JournalEntry[] = [];

  constructor() {
    let resolver: () => void;
    this.isReady = new Promise<void>((resolve) => {
      resolver = resolve;
    });
    this.resolveReady = resolver!;

    this.loadFromStorage();
    this.enforceCreatorIdentity();
    this.cleanExpiredTemporaryMemories();
    this.initAsync().finally(() => {
      this.resolveReady();
    });
  }

  // Native cold-start rehydration from physical device vault file
  public async initAsync(): Promise<void> {
    try {
      const isDefault = (
        this.coreMemories.length <= 3 &&
        this.episodicEvents.length === 0 &&
        this.provenanceList.length === 0
      );

      const vault = await storageEngine.readVaultSnapshotAsync();
      if (vault && vault.memoryData && (isDefault || vault.updatedAt)) {
        if (vault.memoryData.partnerProfile) this.partnerProfile = { ...CREATOR_PROFILE_DEFAULT, ...vault.memoryData.partnerProfile };
        if (vault.memoryData.livingContext) this.livingContext = { ...CREATOR_LIVING_CONTEXT_DEFAULT, ...vault.memoryData.livingContext };
        if (Array.isArray(vault.memoryData.coreMemories) && vault.memoryData.coreMemories.length > 0) this.coreMemories = vault.memoryData.coreMemories;
        if (Array.isArray(vault.memoryData.episodicEvents)) this.episodicEvents = vault.memoryData.episodicEvents;
        if (Array.isArray(vault.memoryData.provenanceList)) this.provenanceList = vault.memoryData.provenanceList;
        if (Array.isArray(vault.memoryData.temporaryRules)) this.temporaryRules = vault.memoryData.temporaryRules;
        if (Array.isArray(vault.memoryData.reflectionLogs)) this.reflectionLogs = vault.memoryData.reflectionLogs;
        if (Array.isArray(vault.pendingJournal)) this.pendingJournal = vault.pendingJournal;

        this.enforceCreatorIdentity();
        console.log('[MemoryStore] Native cold-start rehydration complete from physical disk vault.');
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('[MemoryStore] Native async rehydration notice:', e);
    }
  }

  private loadFromStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      let loadedFromLocal = false;
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
        if (Array.isArray(parsed.pendingJournal)) this.pendingJournal = parsed.pendingJournal;
        loadedFromLocal = true;
      }

      // Check if local storage is missing or default. If default/missing, auto-hydrate from persistent vault file:
      const isDefault = !loadedFromLocal || (
        this.coreMemories.length <= 3 &&
        this.episodicEvents.length === 0 &&
        this.provenanceList.length === 0
      );

      if (isDefault && storageEngine.hasVaultSnapshot()) {
        const vault = storageEngine.readVaultSnapshot();
        if (vault && vault.memoryData) {
          if (vault.memoryData.partnerProfile) this.partnerProfile = { ...CREATOR_PROFILE_DEFAULT, ...vault.memoryData.partnerProfile };
          if (vault.memoryData.livingContext) this.livingContext = { ...CREATOR_LIVING_CONTEXT_DEFAULT, ...vault.memoryData.livingContext };
          if (Array.isArray(vault.memoryData.coreMemories) && vault.memoryData.coreMemories.length > 0) this.coreMemories = vault.memoryData.coreMemories;
          if (Array.isArray(vault.memoryData.episodicEvents)) this.episodicEvents = vault.memoryData.episodicEvents;
          if (Array.isArray(vault.memoryData.provenanceList)) this.provenanceList = vault.memoryData.provenanceList;
          if (Array.isArray(vault.memoryData.temporaryRules)) this.temporaryRules = vault.memoryData.temporaryRules;
          if (Array.isArray(vault.memoryData.reflectionLogs)) this.reflectionLogs = vault.memoryData.reflectionLogs;
          if (Array.isArray(vault.pendingJournal)) this.pendingJournal = vault.pendingJournal;

          console.log('[MemoryStore] Successfully auto-hydrated state from persistent vault snapshot: Documents/Possibilities/possibilities_vault.json');
          this.saveToStorage();
        }
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
      const data = {
        partnerProfile: this.partnerProfile,
        livingContext: this.livingContext,
        coreMemories: this.coreMemories,
        episodicEvents: this.episodicEvents,
        provenanceList: this.provenanceList,
        temporaryRules: this.temporaryRules,
        reflectionLogs: this.reflectionLogs,
        pendingJournal: this.pendingJournal,
      };

      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(data));
        localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(this.snapshots.slice(0, 10)));
      }

      // Flush encrypted snapshot to public device vault Documents/Possibilities/possibilities_vault.json
      storageEngine.saveVaultSnapshot({
        version: '3.0',
        updatedAt: new Date().toISOString(),
        filePath: 'Documents/Possibilities/possibilities_vault.json',
        pendingJournal: this.pendingJournal,
        memoryData: {
          partnerProfile: this.partnerProfile,
          livingContext: this.livingContext,
          coreMemories: this.coreMemories,
          episodicEvents: this.episodicEvents,
          provenanceList: this.provenanceList,
          temporaryRules: this.temporaryRules,
          reflectionLogs: this.reflectionLogs,
        },
      });

      // Auto-flush physical encrypted .vault backup to Documents/Possibilities/Vault/ AND Cloud Firestore
      import('../vault/MemoryVaultManager').then(({ memoryVaultManager }) => {
        memoryVaultManager.exportEncryptedVaultToStorage('Possibilities-Creator-Arno').catch((err) => {
          console.warn('[MemoryStore] Background native .vault write warning:', err);
        });
        memoryVaultManager.triggerAutoSave();
      }).catch(() => {});
    } catch (e) {
      console.error('MemoryStore failed to save to storage:', e);
    }
  }

  // Pre-Flight Journal Management
  public addPendingJournal(userMessage: string, sessionId: string): JournalEntry {
    const entry: JournalEntry = {
      id: `journal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userMessage,
      timestamp: new Date().toISOString(),
      sessionId,
      processed: false,
    };
    this.pendingJournal.push(entry);
    // Sliding window: keep max 50 pending journal items total
    if (this.pendingJournal.length > 50) {
      this.pendingJournal = this.pendingJournal.slice(-50);
    }
    this.saveToStorage(); // Synchronous write & flush to possibilities_vault.json before network request
    return entry;
  }

  public getPendingJournal(): JournalEntry[] {
    return this.pendingJournal.filter((j) => !j.processed);
  }

  public markJournalProcessed(ids: string[]): void {
    this.pendingJournal = this.pendingJournal.map((j) =>
      ids.includes(j.id) ? { ...j, processed: true } : j
    );
    // Sliding window: prune processed entries, retaining only unprocessed and max 5 recent processed entries for audit
    const unprocessed = this.pendingJournal.filter((j) => !j.processed);
    const recentProcessed = this.pendingJournal.filter((j) => j.processed).slice(-5);
    this.pendingJournal = [...unprocessed, ...recentProcessed];
    this.saveToStorage();
  }

  public clearPendingJournal(): void {
    this.pendingJournal = [];
    this.saveToStorage();
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
    if (!this.partnerProfile.personality || !this.partnerProfile.personality.includes('partner-first')) {
      this.partnerProfile.personality = CREATOR_PROFILE_DEFAULT.personality;
      changed = true;
    }
    if (!this.partnerProfile.roleDefinition) {
      this.partnerProfile.roleDefinition = CREATOR_PROFILE_DEFAULT.roleDefinition;
      changed = true;
    }

    if (this.partnerProfile.isAdult === undefined) {
      this.partnerProfile.isAdult = true;
      changed = true;
    }
    if (this.partnerProfile.foulLanguageAllowed === undefined) {
      this.partnerProfile.foulLanguageAllowed = true;
      changed = true;
    }

    const hasLanguageCore = this.coreMemories.some((m) => m.id === 'core-language-policy' || m.text.includes('LANGUAGE & APPROPRIATENESS POLICY'));
    if (!hasLanguageCore) {
      this.coreMemories.push({
        id: 'core-language-policy',
        text: 'LANGUAGE & APPROPRIATENESS POLICY [LOCKED]: If the partner is young (<18) or disapproves of foul language, Possibilities MUST use ZERO foul language or profanity. If AND ONLY IF the partner is an adult (18+) and does not mind, Possibilities may use strong language ONLY at natural, appropriate moments for genuine emphasis or witty roasting—never gratuitously or abusively.',
        category: 'Sacred',
        createdAt: new Date().toISOString(),
      });
      changed = true;
    }

    const hasPossibilitiesCore = this.coreMemories.some((m) => m.id === 'core-possibilities-profile' || m.text.includes('POSSIBILITIES COMPANION PROFILE'));
    if (!hasPossibilitiesCore) {
      this.coreMemories.unshift({
        id: 'core-possibilities-profile',
        text: 'POSSIBILITIES COMPANION PROFILE [LOCKED]: Possibilities operates as a partner-first augmented intelligence system. Operating Stance: Direct, honest, curious, witty, capable of aggressive playful humor, active stress testing, exposing failure modes, and thinking alongside Creator Arno (Arie) as a true second-brain co-pilot without flatteries or blind submission.',
        category: 'Sacred',
        createdAt: new Date().toISOString(),
      });
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

    // Purge any legacy Spotify song list memories as explicitly requested by user
    const initialLen = this.coreMemories.length;
    this.coreMemories = this.coreMemories.filter(
      (m) => m.id !== 'core-spotify-12-songs' && !m.text.includes('SPOTIFY LIKED SONGS')
    );
    if (this.coreMemories.length !== initialLen) {
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

    this.pruneExpiredLivingContext();

    if (changed) {
      this.saveToStorage();
    }
  }

  public pruneExpiredLivingContext(): void {
    if (constitutionIntegrity.isCircuitBreakerActive()) return;

    let changed = false;
    // Living context short-term reminders pruning (e.g., items older than 30 days)
    if (this.livingContext && Array.isArray(this.livingContext.shortTermReminders)) {
      const lenBefore = this.livingContext.shortTermReminders.length;
      this.livingContext.shortTermReminders = this.livingContext.shortTermReminders.filter((rem) => {
        if (!rem.createdAt) return true;
        const ageMs = Date.now() - new Date(rem.createdAt).getTime();
        return ageMs < 30 * 24 * 60 * 60 * 1000;
      });
      if (this.livingContext.shortTermReminders.length < lenBefore) {
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
    if (constitutionIntegrity.isCircuitBreakerActive()) {
      console.warn('[CIRCUIT BREAKER ACTIVE] Memory write suspended: updatePartnerProfile');
      return this.getPartnerProfile();
    }
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
    this.pruneExpiredLivingContext();
    return { ...this.livingContext };
  }

  public updateLivingContext(updates: Partial<LivingContext>): LivingContext {
    if (constitutionIntegrity.isCircuitBreakerActive()) {
      console.warn('[CIRCUIT BREAKER ACTIVE] Memory write suspended: updateLivingContext');
      return this.getLivingContext();
    }
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
    if (constitutionIntegrity.isCircuitBreakerActive()) {
      console.warn('[CIRCUIT BREAKER ACTIVE] Memory write suspended: addCoreMemory');
      return {
        id: `blocked-${Date.now()}`,
        text: '[CIRCUIT_BREAKER_ACTIVE_WRITE_SUSPENDED]',
        category,
        createdAt: new Date().toISOString(),
      };
    }
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
    if (constitutionIntegrity.isCircuitBreakerActive()) {
      console.warn('[CIRCUIT BREAKER ACTIVE] Memory deletion suspended: removeCoreMemory');
      return false;
    }
    const lenBefore = this.coreMemories.length;
    this.coreMemories = this.coreMemories.filter((m) => m.id !== id);
    if (this.coreMemories.length < lenBefore) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public editCoreMemory(id: string, newText: string): boolean {
    if (constitutionIntegrity.isCircuitBreakerActive()) return false;
    const target = this.coreMemories.find((m) => m.id === id);
    if (target) {
      target.text = newText.trim();
      const prov = this.provenanceList.find((p) => p.id === `prov-${id}`);
      if (prov) {
        prov.content = newText.trim();
        prov.updatedAt = new Date().toISOString();
        prov.version = (prov.version || 1) + 1;
      }
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
    if (constitutionIntegrity.isCircuitBreakerActive()) {
      console.warn('[CIRCUIT BREAKER ACTIVE] Memory write suspended: addEpisodicEvent');
      return {
        eventId: `blocked-${Date.now()}`,
        sessionId: `session-blocked`,
        eventType,
        summary: '[CIRCUIT_BREAKER_ACTIVE_WRITE_SUSPENDED]',
        occurredAt: new Date().toISOString(),
        recordedAt: new Date().toISOString(),
        validFrom: new Date().toISOString(),
        importance: 0,
        confidence: 0,
        source,
        status: 'expired',
      };
    }
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
    // Sliding window: cap episodic events to most recent 100 items to keep vault storage lightweight
    if (this.episodicEvents.length > 100) {
      this.episodicEvents = this.episodicEvents.slice(0, 100);
    }
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

  public exportSnapshot(): VaultPayload {
    this.enforceCreatorIdentity();
    return {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      filePath: 'Documents/Possibilities/possibilities_vault.json',
      pendingJournal: [...this.pendingJournal],
      memoryData: {
        partnerProfile: { ...this.partnerProfile },
        livingContext: { ...this.livingContext },
        coreMemories: [...this.coreMemories],
        episodicEvents: [...this.episodicEvents],
        provenanceList: [...this.provenanceList],
        temporaryRules: [...this.temporaryRules],
        reflectionLogs: [...this.reflectionLogs],
      },
    };
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

    this.enforceCreatorIdentity();
    this.saveToStorage();
    return { backupSnapshotId: snapshot.snapshotId };
  }
}

export const memoryStore = new MemoryStore();
