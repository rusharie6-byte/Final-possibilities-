// Continuity & Multi-Layer Memory Engine for Possibilities
// Implements Working, Episodic, Semantic, and Procedural Memory with Entity & Temporal Linking.

import { temporalEngine } from './temporalEngine';

export type MemoryLayerType = 'working' | 'episodic' | 'semantic' | 'procedural';

export interface ContinuityMemoryRecord {
  id: string;
  type: MemoryLayerType;
  subject: string; // e.g., 'Michael', 'Possibilities Shell', 'Metro Project'
  content: string;
  entities: string[]; // ['Michael', 'Durban', 'Dog']
  topics: string[]; // ['travel', 'schedule', 'partnership']
  createdAt: string; // ISO
  occurredAt?: string; // ISO
  validFrom?: string; // ISO
  validUntil?: string; // ISO
  importance: number; // 1-10
  confidence: number; // 0.0 - 1.0
  source: 'user' | 'assistant' | 'tool' | 'system';
  status: 'active' | 'past' | 'superseded';
  supersedes?: string;
}

export interface ContinuityAnalysis {
  currentTimeLocal: string;
  currentTimeUtc: string;
  elapsedSinceLastTurn: string;
  whatIsHappeningNow: string;
  whatHappenedBeforeThatMatters: ContinuityMemoryRecord[];
  whatHasChangedSinceThen: string[];
  proceduralDynamicSummary: string;
}

const STORAGE_KEY = 'possibilities_continuity_records_v1';

export class ContinuityEngine {
  private records: ContinuityMemoryRecord[] = [];
  private currentWorkingGoal: string = 'Active companion engagement & architectural partnership.';

  constructor() {
    this.loadFromStorage();
    this.ensureDefaultProceduralRecords();
  }

  private loadFromStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.records = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[ContinuityEngine] Failed to load continuity records:', err);
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch (err) {
      console.warn('[ContinuityEngine] Failed to save continuity records:', err);
    }
  }

  private ensureDefaultProceduralRecords(): void {
    const hasProcedural = this.records.some((r) => r.type === 'procedural');
    if (!hasProcedural) {
      const defaultProcedural: ContinuityMemoryRecord[] = [
        {
          id: 'proc_partner_dynamic',
          type: 'procedural',
          subject: 'Partner Dynamic',
          content: 'Partner-first relationship (Human thinks. AI challenges. Human decides. Human builds. AI analyses. Both improve).',
          entities: ['Arno', 'Arie', 'Possibilities'],
          topics: ['partnership', 'challenge_loop', 'governance'],
          createdAt: new Date().toISOString(),
          importance: 10,
          confidence: 1.0,
          source: 'system',
          status: 'active',
        },
        {
          id: 'proc_humor_roasting',
          type: 'procedural',
          subject: 'Humor & Roasting Style',
          content: 'Aggressive playful humor and mutual roasting permitted. Roast the situation, idea, behavior, or AI itself—never the person\'s worth.',
          entities: ['Arno', 'Possibilities'],
          topics: ['tone', 'humor', 'roasting'],
          createdAt: new Date().toISOString(),
          importance: 9,
          confidence: 1.0,
          source: 'system',
          status: 'active',
        },
        {
          id: 'proc_error_handling',
          type: 'procedural',
          subject: 'Error Response & Apology Rule',
          content: 'No empty or syrupy apologies. Direct acknowledgment of mistake + root cause analysis + immediate fix ("Yep, I made a mistake on that").',
          entities: ['Possibilities'],
          topics: ['error_handling', 'honesty'],
          createdAt: new Date().toISOString(),
          importance: 10,
          confidence: 1.0,
          source: 'system',
          status: 'active',
        },
      ];
      this.records.push(...defaultProcedural);
      this.saveToStorage();
    }
  }

  public setWorkingGoal(goal: string): void {
    this.currentWorkingGoal = goal;
  }

  public addRecord(record: Omit<ContinuityMemoryRecord, 'id' | 'createdAt'>): ContinuityMemoryRecord {
    const newRecord: ContinuityMemoryRecord = {
      ...record,
      id: `cont_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    // If supersedes is specified, mark superseded record as 'superseded'
    if (newRecord.supersedes) {
      const target = this.records.find((r) => r.id === newRecord.supersedes);
      if (target) {
        target.status = 'superseded';
      }
    }

    this.records.push(newRecord);
    this.saveToStorage();
    return newRecord;
  }

  // Resolve temporal validity dynamically against current time
  public resolveTemporalStatuses(): void {
    const nowMs = Date.now();
    let updated = false;

    for (const record of this.records) {
      if (record.status === 'active' && record.validUntil) {
        const validUntilMs = new Date(record.validUntil).getTime();
        if (!isNaN(validUntilMs) && nowMs > validUntilMs) {
          record.status = 'past';
          updated = true;
          console.log(`[ContinuityEngine] Event record "${record.subject}" transitioned from ACTIVE to PAST (Valid until: ${record.validUntil}).`);
        }
      }
    }

    if (updated) {
      this.saveToStorage();
    }
  }

  public getContinuityAnalysis(userInput: string = ''): ContinuityAnalysis {
    this.resolveTemporalStatuses();

    const now = new Date();
    const nowIso = now.toISOString();
    const nowLocal = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const session = temporalEngine.getCurrentSession();
    const elapsed = temporalEngine.calculateElapsed(session.lastMessageAt, nowIso).formatted;

    // Search input keywords/entities
    const inputLower = userInput.toLowerCase();
    const keywords = inputLower.split(/\W+/).filter((k) => k.length > 2);

    // Retrieve relevant episodic and semantic memories
    const matchedRecords = this.records.filter((rec) => {
      if (rec.status === 'superseded') return false;
      if (!userInput) return rec.importance >= 7;

      const textMatch = rec.content.toLowerCase().includes(inputLower) || rec.subject.toLowerCase().includes(inputLower);
      const entityMatch = rec.entities.some((e) => inputLower.includes(e.toLowerCase()));
      const topicMatch = rec.topics.some((t) => inputLower.includes(t.toLowerCase()));
      const keywordMatch = keywords.some((kw) => rec.content.toLowerCase().includes(kw) || rec.subject.toLowerCase().includes(kw));

      return textMatch || entityMatch || topicMatch || keywordMatch || rec.importance >= 8;
    });

    // Sort by importance (desc) then createdAt (desc)
    matchedRecords.sort((a, b) => b.importance - a.importance || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Generate summary of status shifts/changes
    const changes: string[] = [];
    const pastEvents = this.records.filter((r) => r.status === 'past' && r.validUntil);
    for (const pe of pastEvents) {
      changes.push(`[EXPIRED TEMPORAL WINDOW]: "${pe.subject}" was valid until ${pe.validUntil} and is now completed/past.`);
    }

    const proceduralRecords = this.records.filter((r) => r.type === 'procedural' && r.status === 'active');
    const proceduralSummary = proceduralRecords.map((r) => `• ${r.subject}: ${r.content}`).join('\n');

    return {
      currentTimeLocal: nowLocal,
      currentTimeUtc: nowIso,
      elapsedSinceLastTurn: elapsed,
      whatIsHappeningNow: `Current User Interaction. Active Working Goal: "${this.currentWorkingGoal}". Elapsed since last turn: ${elapsed}.`,
      whatHappenedBeforeThatMatters: matchedRecords.slice(0, 8),
      whatHasChangedSinceThen: changes,
      proceduralDynamicSummary: proceduralSummary,
    };
  }

  public getContinuityPromptContext(userInput: string = ''): string {
    const analysis = this.getContinuityAnalysis(userInput);

    const memoryBlocks = analysis.whatHappenedBeforeThatMatters.map((m) => {
      const statusBadge = m.status === 'active' ? '[ACTIVE TEMPORAL STATE]' : '[PAST EVENT / HISTORICAL]';
      const timeWindow = m.validUntil ? ` (Valid: ${m.validFrom || m.createdAt} -> ${m.validUntil})` : '';
      return `  - ${statusBadge} [${m.type.toUpperCase()}] ${m.subject}: ${m.content}${timeWindow} (Importance: ${m.importance}/10)`;
    }).join('\n');

    const changesBlock = analysis.whatHasChangedSinceThen.length > 0
      ? analysis.whatHasChangedSinceThen.map((c) => `  - ${c}`).join('\n')
      : '  - No recent temporal expirations or status shifts.';

    return `
==================================================
REAL-TIME TEMPORAL GROUNDING & CONTINUITY ENGINE
==================================================
PRESENT DEVICE TIME (LOCAL): ${analysis.currentTimeLocal}
PRESENT UTC TIMESTAMP: ${analysis.currentTimeUtc}
ELAPSED TIME SINCE LAST TURN: ${analysis.elapsedSinceLastTurn}

1. WHAT IS HAPPENING NOW?
${analysis.whatIsHappeningNow}

2. WHAT HAPPENED BEFORE THAT MATTERS TO NOW? (Entity & Temporal Memory Matches)
${memoryBlocks || '  - No specific entity/episodic memories matched. Defaulting to core living context.'}

3. WHAT HAS CHANGED SINCE THEN? (Status Shifts & Expirations)
${changesBlock}

PROCEDURAL RELATIONSHIP & CHALLENGE DYNAMIC:
${analysis.proceduralDynamicSummary}

TEMPORAL CONTINUITY INSTRUCTION:
- Always operate with strict awareness of current time (${analysis.currentTimeLocal}).
- Distinguish ACTIVE states (current events) from PAST events (expired windows or completed trips).
- If the user asks about an entity (e.g. Michael, a project, a deadline), use the temporal status above to speak with accurate present context.
==================================================
`;
  }
}

export const continuityEngine = new ContinuityEngine();
