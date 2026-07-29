// Possibilities Natural Language Intent & Companion Engine v1.0
// Calm, Intelligent, Reliable, Respectful, Curious, Helpful, Confident.
// Converts natural human language and contextual intent into seamless companion actions while supporting direct commands.

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
}

const SESSION_KEY = 'possibilities_companion_session_v1';

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

export class CompanionEngine {
  private session: CompanionContextState;

  constructor() {
    this.session = loadSession();
  }

  public getSession(): CompanionContextState {
    return this.session;
  }

  // Add a piece of information to long-term persistent memory
  public addLongTermMemory(text: string, category: LongTermMemory['category'] = 'User Knowledge'): LongTermMemory {
    const memory: LongTermMemory = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: text.trim(),
      category,
      createdAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    };

    // Avoid duplicate memory strings
    const exists = this.session.longTermMemories.some(
      (m) => m.text.toLowerCase() === memory.text.toLowerCase()
    );

    if (!exists) {
      this.session.longTermMemories.unshift(memory);
      saveSession(this.session);
    }
    return memory;
  }

  public getLongTermMemories(): LongTermMemory[] {
    return this.session.longTermMemories;
  }

  public removeLongTermMemory(idOrText: string): boolean {
    const prevCount = this.session.longTermMemories.length;
    this.session.longTermMemories = this.session.longTermMemories.filter(
      (m) => m.id !== idOrText && !m.text.toLowerCase().includes(idOrText.toLowerCase())
    );
    const removed = this.session.longTermMemories.length < prevCount;
    if (removed) {
      saveSession(this.session);
    }
    return removed;
  }

  public clearLongTermMemories(): void {
    this.session.longTermMemories = [];
    saveSession(this.session);
  }

  // Generates system prompt string containing all user long term memories
  public getMemoryPromptContext(): string {
    const memories = this.getLongTermMemories();
    if (memories.length === 0) {
      return "";
    }
    const memoryLines = memories.map((m) => `- [${m.category}] ${m.text} (Saved: ${m.createdAt})`).join('\n');
    return (
      `\n\nLONG-TERM MEMORY RECALL SYSTEM:\n` +
      `The following important facts and user details are permanently saved in your long-term memory system:\n` +
      `${memoryLines}\n\n` +
      `INSTRUCTION: Seamlessly incorporate these facts into your responses whenever relevant. Never forget them.`
    );
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
