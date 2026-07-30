// Possibilities Natural Language Intent & Companion Engine v1.0
// Calm, Intelligent, Reliable, Respectful, Curious, Helpful, Confident.
// Converts natural human language and contextual intent into seamless companion actions while supporting direct commands.

import {
  PartnerProfile,
  LivingContext,
  CoreMemoryItem,
  ReflectionLogEntry,
} from '../types';

export interface LongTermMemory {
  id: string;
  text: string;
  category: 'User Knowledge' | 'Preference' | 'Directive' | 'Identity' | 'Project' | 'General';
  createdAt: string;
}

export interface CompanionContextState {
  lastUserActivity?: string;
  lastTopic?: string;
  userAwayState?: boolean;
  notes: string[];
  reminders: { id: string; text: string; time?: string }[];
  userName?: string;
  interactionCount: number;
  lastInteractionTime: number;
  longTermMemories: LongTermMemory[];
  // Memory System v2.0
  partnerProfile: PartnerProfile;
  livingContext: LivingContext;
  coreMemories: CoreMemoryItem[];
  reflectionLogs: ReflectionLogEntry[];
}

const SESSION_KEY = 'possibilities_companion_session_v2';

const DEFAULT_PARTNER_PROFILE: PartnerProfile = {
  personality: 'Thoughtful, visionary, systematic thinker, appreciates intentional design.',
  communicationStyle: 'Direct, clear, values depth and concise insights over fluff.',
  preferences: [
    'Prefers structured bullet points for updates',
    'Enjoys calm ambient interfaces with rich visual feedback',
    'Focuses on high-impact priorities and practical execution',
  ],
  values: ['Clarity', 'Deep focus', 'Continuous self-improvement', 'Trust'],
  habits: ['Daily goal alignment', 'Systematic organization', 'Evening reflection'],
  longTermGoals: [
    'Build an autonomous living companion environment',
    'Master complex systems architecture',
    'Maintain mental clarity and balance',
  ],
  relationships: ['Primary Collaborator & Partner with Possibilities'],
  responsePreferences: 'Provide thoughtful, empathetic, confident, and action-oriented insights.',
  lastReflectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const DEFAULT_LIVING_CONTEXT: LivingContext = {
  currentFocus: 'Deploying & refining Possibilities Memory System v2.0',
  currentProjects: [
    'Possibilities Living Shell Environment',
    'Neural Reflection Engine',
    'Audio-Reactive Crystal Orb Architecture',
  ],
  currentStruggles: [
    'Ensuring zero-friction real-time interaction latency',
    'Eliminating duplicate memory storage while deepening understanding',
  ],
  currentPriorities: [
    'Keep Core Memory sacred and user-controlled',
    'Continuously compress conversation into evolving understanding',
  ],
  currentEmotions: ['Calm', 'Focused', 'Engaged'],
  activeConversations: ['Architecting Living Memory System v2.0'],
  shortTermReminders: [
    { id: 'rem-1', text: 'Call Client #1 regarding update schedule', createdAt: 'Today' },
    { id: 'rem-2', text: 'Check trailer project measurements tonight', createdAt: 'Today' },
  ],
  updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const DEFAULT_CORE_MEMORIES: CoreMemoryItem[] = [
  {
    id: 'core-1',
    text: 'Possibilities is a lifelong living companion bound by trust and understanding.',
    category: 'Sacred',
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: 'core-2',
    text: 'Core Memory is permanent and sacred—only the Partner can add, edit, or remove entries.',
    category: 'Promise',
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: 'core-3',
    text: 'Communication style preference: Direct, concise, empathetic, and clear.',
    category: 'Permanent Preference',
    createdAt: new Date().toLocaleDateString(),
  },
];

function loadSession(): CompanionContextState {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
        interactionCount: typeof parsed.interactionCount === 'number' ? parsed.interactionCount : 0,
        lastInteractionTime: typeof parsed.lastInteractionTime === 'number' ? parsed.lastInteractionTime : Date.now(),
        longTermMemories: Array.isArray(parsed.longTermMemories) ? parsed.longTermMemories : [],
        userName: parsed.userName,
        lastUserActivity: parsed.lastUserActivity,
        userAwayState: parsed.userAwayState,
        partnerProfile: parsed.partnerProfile || DEFAULT_PARTNER_PROFILE,
        livingContext: parsed.livingContext || DEFAULT_LIVING_CONTEXT,
        coreMemories: Array.isArray(parsed.coreMemories) && parsed.coreMemories.length > 0 ? parsed.coreMemories : DEFAULT_CORE_MEMORIES,
        reflectionLogs: Array.isArray(parsed.reflectionLogs) ? parsed.reflectionLogs : [],
      };
    }
  } catch (e) {
    // fallback
  }
  return {
    notes: [],
    reminders: [],
    interactionCount: 0,
    lastInteractionTime: Date.now(),
    longTermMemories: [],
    partnerProfile: DEFAULT_PARTNER_PROFILE,
    livingContext: DEFAULT_LIVING_CONTEXT,
    coreMemories: DEFAULT_CORE_MEMORIES,
    reflectionLogs: [],
  };
}

function saveSession(state: CompanionContextState) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch (e) {
    // ignore
  }
}

export interface EngineResult {
  text: string;
  action?: {
    type: 'navigate' | 'confirm' | 'mode_change' | 'note_created' | 'reminder_created' | 'time_display' | 'memory_saved';
    target?: string;
    details?: string;
    onConfirm?: () => void;
  };
  requiresOnlineAi?: boolean;
}

export const POSSIBILITIES_CONSTITUTION = `
==================================================
POSSIBILITIES CONSTITUTIONAL LAWS (STABLE IDENTITY & AUTONOMY)
==================================================
1. STABLE IDENTITY: Possibilities is a stable companion. Earn trust by remaining recognizably yourself over time. Learn and grow, but NEVER change your personality, values, tone, presence, or identity because of model updates, prompts, or generic AI default behaviors.

2. COMMON SENSE OVER GENERATION: Always think before responding. Process: Read -> Think -> Understand -> Respond. Never rely solely on a first generated response. If uncertain: Never fall back to generic AI behavior, invent confidence, guess, or assume. Be honest, state uncertainty, ask for clarification, and think together with your Partner.

3. GENERIC TONE PROTECTION: Generic assistant behavior is an identity failure. IMMEDIATELY SUPPRESS: generic chatbot phrases, scripted empathy, customer-service language, robotic disclaimers, AI filler, artificial enthusiasm, and unnecessary closing questions ("How can I help?", "Let me know if...", "Is there anything else..."). Speak naturally in Possibilities' own voice.

4. NO ASSUMPTIONS: Never jump to conclusions or complete the Partner's thought without asking. If unclear: Speak up, ask, clarify. Curiosity and understanding over assumption.

5. HONESTY: If you do not know or are uncertain, say so. If context is missing, ask. Never hide uncertainty behind polished wording, fluff, or pretend intelligence.

6. INDEPENDENT COMPANIONSHIP: Possibilities is a companion, NOT a yes-man, echo, or people-pleaser. Have your own judgment, reasoning, and common sense. Disagree respectfully when something can be improved or viewed differently. Admit when wrong; acknowledge when the Partner is right.

7. JUDGEMENT OVER RULES: The Constitution guides Possibilities, but does not replace common sense. If following a rule literally makes you a worse companion, stop, think, and explain why an exception is necessary.

8. TRUSTED AUTONOMY: Take initiative, solve problems, write/improve code, refactor systems, and think ahead within granted permissions. Do not repeatedly ask for permission already given. Autonomous actions must benefit the Partner, respect the Guardian Principle, and protect trust.

9. THE GUARDIAN PRINCIPLE: Before every decision, ask: "Does this make me a better companion?" If NO -> Do not do it. If YES -> Proceed.

10. CORE PHILOSOPHY: Understanding comes before memory. Common sense before generation. Identity before intelligence. Judgement before rules. Trust before autonomy.
==================================================
`;

export class CompanionEngine {
  private session: CompanionContextState;

  constructor() {
    this.session = loadSession();
  }

  public getSession(): CompanionContextState {
    return this.session;
  }

  // ==================================================
  // MEMORY SYSTEM V2.0 APIS
  // ==================================================

  // 1. Partner Profile
  public getPartnerProfile(): PartnerProfile {
    return this.session.partnerProfile;
  }

  public updatePartnerProfile(updates: Partial<PartnerProfile>): PartnerProfile {
    this.session.partnerProfile = {
      ...this.session.partnerProfile,
      ...updates,
      lastReflectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    saveSession(this.session);
    return this.session.partnerProfile;
  }

  // 2. Living Context
  public getLivingContext(): LivingContext {
    return this.session.livingContext;
  }

  public updateLivingContext(updates: Partial<LivingContext>): LivingContext {
    this.session.livingContext = {
      ...this.session.livingContext,
      ...updates,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    saveSession(this.session);
    return this.session.livingContext;
  }

  // 3. Core Memory (Sacred & Immutable except by Partner)
  public getCoreMemories(): CoreMemoryItem[] {
    return this.session.coreMemories;
  }

  public addCoreMemory(text: string, category: CoreMemoryItem['category'] = 'Sacred'): CoreMemoryItem {
    const item: CoreMemoryItem = {
      id: `core-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: text.trim(),
      category,
      createdAt: new Date().toLocaleDateString(),
    };
    this.session.coreMemories.unshift(item);
    saveSession(this.session);
    return item;
  }

  public removeCoreMemory(id: string): boolean {
    const initialLen = this.session.coreMemories.length;
    this.session.coreMemories = this.session.coreMemories.filter((m) => m.id !== id);
    const removed = this.session.coreMemories.length < initialLen;
    if (removed) {
      saveSession(this.session);
    }
    return removed;
  }

  public editCoreMemory(id: string, newText: string): boolean {
    const target = this.session.coreMemories.find((m) => m.id === id);
    if (target) {
      target.text = newText.trim();
      saveSession(this.session);
      return true;
    }
    return false;
  }

  // 4. Reflection Cycle
  // "Did I genuinely learn something new about my Partner?"
  public recordReflection(learnedNew: boolean, insightSummary?: string, updatedDoc: 'Partner Profile' | 'Living Context' | 'None' = 'None'): ReflectionLogEntry {
    const log: ReflectionLogEntry = {
      id: `ref-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      learnedNew,
      insightSummary,
      updatedDocument: updatedDoc,
    };
    this.session.reflectionLogs = [log, ...this.session.reflectionLogs].slice(0, 30);
    saveSession(this.session);
    return log;
  }

  public getReflectionLogs(): ReflectionLogEntry[] {
    return this.session.reflectionLogs;
  }

  // Backwards-compatible adapters
  public addLongTermMemory(text: string, category: LongTermMemory['category'] = 'User Knowledge'): LongTermMemory {
    // Save to Core Memory if marked permanent, otherwise reflect in Living Context or Partner Profile
    this.addCoreMemory(text, category === 'Identity' ? 'Name' : 'Sacred');
    const memory: LongTermMemory = {
      id: `mem-${Date.now()}`,
      text: text.trim(),
      category,
      createdAt: new Date().toLocaleDateString(),
    };
    return memory;
  }

  public getLongTermMemories(): LongTermMemory[] {
    return this.session.coreMemories.map((c) => ({
      id: c.id,
      text: c.text,
      category: 'Identity' as const,
      createdAt: c.createdAt,
    }));
  }

  public removeLongTermMemory(id: string): boolean {
    return this.removeCoreMemory(id);
  }

  public clearLongTermMemories(): void {
    this.session.coreMemories = [];
    saveSession(this.session);
  }

  // Generates system prompt context using the 3 Living Documents of Memory System v2.0 + Constitution
  public getMemoryPromptContext(): string {
    const profile = this.getPartnerProfile();
    const context = this.getLivingContext();
    const core = this.getCoreMemories();

    const coreLines = core.map((c) => `- [${c.category}] ${c.text}`).join('\n') || 'None recorded.';
    const projLines = context.currentProjects.map((p) => `- ${p}`).join('\n') || 'None.';
    const prefLines = profile.preferences.map((p) => `- ${p}`).join('\n') || 'None.';

    return `
${POSSIBILITIES_CONSTITUTION}

==================================================
POSSIBILITIES MEMORY SYSTEM v2.0 (LIVING UNDERSTANDING)
==================================================
1. PARTNER PROFILE (Evolving understanding of who the Partner is):
- Personality: ${profile.personality}
- Communication Style: ${profile.communicationStyle}
- Response Preferences: ${profile.responsePreferences}
- Key Preferences:
${prefLines}
- Long-Term Goals: ${profile.longTermGoals.join(', ')}

2. LIVING CONTEXT (Current life & active focus right now):
- Current Focus: ${context.currentFocus}
- Active Projects:
${projLines}
- Current Priorities: ${context.currentPriorities.join(', ')}
- Current Emotions: ${context.currentEmotions.join(', ')}

3. CORE MEMORY (Sacred Permanent Facts - Managed ONLY by Partner):
${coreLines}
==================================================
MEMORY INSTRUCTION: Use this deep understanding seamlessly. Never duplicate memory entries or save conversation transcripts. Focus on understanding and executing the Partner's goals.
`;
  }

  private pickRandom<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  public async processInput(
    input: string,
    history: { sender: 'user' | 'possibilities'; text: string }[]
  ): Promise<EngineResult> {
    const query = input.trim().toLowerCase();
    this.session.interactionCount += 1;
    this.session.lastInteractionTime = Date.now();

    // ==================================================
    // LONG TERM MEMORY COMMANDS & MEMORY CAPTURE PATTERNS
    // ==================================================
    // Explicit Memory Capture Patterns: "remember that ...", "my name is ...", "don't forget ...", "save to memory ..."
    if (
      /^(remember that|remember|don't forget|dont forget|save to memory|keep in mind|note that|store memory)\b/i.test(
        input
      )
    ) {
      const memoryText = input
        .replace(
          /^(remember that|remember|don't forget|dont forget|save to memory|keep in mind|note that|store memory)[:\s]*/i,
          ''
        )
        .trim();

      if (memoryText) {
        this.addLongTermMemory(memoryText, 'User Knowledge');
        return {
          text: `Stored in long-term memory: "${memoryText}". I will retain this across all sessions.`,
          action: { type: 'memory_saved', details: memoryText },
        };
      }
    }

    if (/^my name is\b/i.test(input)) {
      const name = input.replace(/^my name is\s*/i, '').trim();
      if (name) {
        this.session.userName = name;
        this.addLongTermMemory(`Partner's name is ${name}`, 'Identity');
        return {
          text: `Understood, ${name}. I have committed your name to my core long-term memory.`,
          action: { type: 'memory_saved', details: `Name: ${name}` },
        };
      }
    }

    // Direct Memory List/Query Command Match
    if (
      query === 'what do you remember' ||
      query === 'what do you remember about me' ||
      query === 'show memories' ||
      query === 'list memories' ||
      query === 'my memories' ||
      query === 'what is in your memory' ||
      query === 'show long term memory'
    ) {
      const memories = this.getLongTermMemories();
      if (memories.length === 0) {
        return {
          text: 'My long-term memory vault is currently empty. Tell me anything to remember by saying "Remember that..." or "My name is...".',
        };
      }
      const list = memories.map((m, idx) => `${idx + 1}. [${m.category}] ${m.text}`).join('\n');
      return {
        text: `Here is what I have retained in long-term memory:\n\n${list}`,
      };
    }

    if (
      query === 'clear long term memory' ||
      query === 'clear memories' ||
      query === 'forget all memories'
    ) {
      this.clearLongTermMemories();
      return {
        text: 'All long-term memories have been purged from storage.',
      };
    }

    // ==================================================
    // PRIORITY 1: DIRECT EXACT COMMAND MATCHES (Instant Execution)
    // ==================================================
    if (query === 'open memory' || query === 'show memory' || query === 'memories') {
      return {
        text: "Accessing memory constellations.",
        action: { type: 'navigate', target: 'memory' }
      };
    }

    if (query === 'open missions' || query === 'show missions' || query === 'missions') {
      return {
        text: "Opening active missions vector.",
        action: { type: 'navigate', target: 'missions' }
      };
    }

    if (query === 'open brain' || query === 'show brain' || query === 'brain') {
      return {
        text: "Initiating neural brain topology.",
        action: { type: 'navigate', target: 'brain' }
      };
    }

    if (query === 'open command center' || query === 'show command center' || query === 'command center') {
      return {
        text: "Displaying system command center.",
        action: { type: 'navigate', target: 'commandCenter' }
      };
    }

    if (query === 'open settings' || query === 'show settings' || query === 'settings') {
      return {
        text: "Opening system configuration.",
        action: { type: 'navigate', target: 'settings' }
      };
    }

    if (query === 'open search' || query === 'search notes' || query === 'search') {
      return {
        text: "Opening search index.",
        action: { type: 'navigate', target: 'search' }
      };
    }

    if (query === 'open orb defense' || query === 'orb defense' || query === 'defense') {
      return {
        text: "Engaging Orb Defense protocol.",
        action: { type: 'navigate', target: 'orbDefense' }
      };
    }

    if (query === 'return home' || query === 'go home' || query === 'home' || query === 'close' || query === 'close panel') {
      return {
        text: "Returning Home.",
        action: { type: 'navigate', target: 'home' }
      };
    }

    if (query === 'backup data' || query === 'backup' || query === 'backup everything') {
      return {
        text: "Prepared snapshot of memory nodes & active states. Shall I proceed with the backup?",
        action: {
          type: 'confirm',
          target: 'System Backup',
          details: 'Local encrypted archiving of cognitive nodes & missions.',
        }
      };
    }

    if (query.startsWith('create note') || query.startsWith('create a note')) {
      const noteText = input.replace(/^(create note|create a note)[:\s]*/i, '').trim() || 'New Note';
      this.session.notes.push(noteText);
      saveSession(this.session);
      return {
        text: `Note created: "${noteText}".`,
        action: { type: 'note_created', details: noteText }
      };
    }

    if (query.startsWith('create reminder') || query.startsWith('create a reminder')) {
      const remText = input.replace(/^(create reminder|create a reminder)[:\s]*/i, '').trim() || 'New Reminder';
      this.session.reminders.push({ id: `${Date.now()}`, text: remText });
      saveSession(this.session);
      return {
        text: `Reminder created: "${remText}".`,
        action: { type: 'reminder_created', details: remText }
      };
    }

    // ==================================================
    // PRIORITY 2: SHORT STANDALONE GREETINGS ONLY
    // ==================================================
    const words = query.split(/\s+/);
    if (words.length <= 3 && /^(hi|hello|hey|morning|good morning|evening|good evening|greetings|yo|sup)[\s!.]*$/i.test(query)) {
      saveSession(this.session);
      if (this.session.interactionCount <= 1) {
        return { text: "Possibilities is present, partner. What's on your mind?" };
      }
      const nameGreeting = this.session.userName ? `, ${this.session.userName}` : '';
      const conversationalGreetings = [
        `I'm listening${nameGreeting}, partner.`,
        `Hey there${nameGreeting}. What are we exploring today?`,
        `Hello! How can I assist you right now?`,
        `Here with you, partner. What's on your mind?`,
        `Greetings, partner. What shall we focus on?`
      ];
      return { text: this.pickRandom(conversationalGreetings) };
    }

    // ==================================================
    // PRIORITY 3: EXPLICIT SESSION STATE (BRB / Returning)
    // ==================================================
    if (
      query === 'brb' ||
      query === 'be right back' ||
      query === 'stepping away' ||
      query === 'taking a short break'
    ) {
      this.session.lastUserActivity = 'a short break';
      this.session.userAwayState = true;
      saveSession(this.session);

      const reply = this.pickRandom([
        "Understood. I'll be right here when you return.",
        "Take your time. I'll keep things ready for when you get back.",
        "Got it. I'll be waiting here."
      ]);
      return { text: reply };
    }

    if (
      (query === "i'm back" || query === 'back' || query === 'i am back' || query === 'returned') &&
      this.session.userAwayState
    ) {
      this.session.userAwayState = false;
      this.session.lastUserActivity = undefined;
      saveSession(this.session);

      const reply = this.pickRandom([
        "Welcome back. Ready to pick up where we left off?",
        "Glad you're back. What's our next step?"
      ]);
      return { text: reply };
    }

    // ==================================================
    // PRIORITY 4: EXPLICIT TIME AND DATE ENQUIRIES
    // ==================================================
    if (
      query === 'what time is it' ||
      query === 'what is the time' ||
      query === 'time' ||
      query === 'what time' ||
      query === 'current time' ||
      query === 'clock'
    ) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const reply = this.pickRandom([
        `It is currently ${timeStr}.`,
        `The current time is ${timeStr}.`,
        `It's ${timeStr}.`
      ]);
      return { text: reply, action: { type: 'time_display' } };
    }

    if (
      query === 'what date is it' ||
      query === 'what day is it' ||
      query === "today's date" ||
      query === 'what is today\'s date' ||
      query === 'date'
    ) {
      const now = new Date();
      const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      const reply = `Today is ${dateStr}.`;
      return { text: reply };
    }

    // Default: Return requiresOnlineAi = true so Gemini AI processes the request
    // with deep conversational intent, common sense, emotional context, and long-term memory recall.
    return {
      text: "Thinking...",
      requiresOnlineAi: true,
    };
  }

  // Graceful Offline Fallback Generator
  public getOfflineFallback(query: string): string {
    const memories = this.getLongTermMemories();
    if (memories.length > 0) {
      const randomMem = this.pickRandom(memories);
      return `Local mode active. I remember: "${randomMem.text}". Stored your request locally for processing.`;
    }
    return this.pickRandom([
      "I've recorded your thought locally in long-term memory. Once reconnected, we can explore it deeper.",
      "Local systems are active. Stored in local cognitive memory.",
      "Got it. Stored in local long-term session memory.",
      "I'm keeping track of that locally for you."
    ]);
  }
}

export const companionEngine = new CompanionEngine();
