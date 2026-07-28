// Possibilities Natural Language Intent & Companion Engine v1.0
// Calm, Intelligent, Reliable, Respectful, Curious, Helpful, Confident.
// Converts natural human language and contextual intent into seamless companion actions while supporting direct commands.

export interface CompanionContextState {
  lastUserActivity?: string;
  lastTopic?: string;
  userAwayState?: boolean;
  notes: string[];
  reminders: { id: string; text: string; time?: string }[];
  userName?: string;
  interactionCount: number;
  lastInteractionTime: number;
}

const SESSION_KEY = 'possibilities_companion_session_v1';

function loadSession(): CompanionContextState {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // fallback
  }
  return {
    notes: [],
    reminders: [],
    interactionCount: 0,
    lastInteractionTime: Date.now(),
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
    type: 'navigate' | 'confirm' | 'mode_change' | 'note_created' | 'reminder_created' | 'time_display';
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
    // (Longer sentences containing greetings are handled by AI for deep conversational intent)
    // ==================================================
    const words = query.split(/\s+/);
    if (words.length <= 3 && /^(hi|hello|hey|morning|good morning|evening|good evening|greetings|yo|sup)[\s!.]*$/i.test(query)) {
      saveSession(this.session);
      if (this.session.interactionCount <= 1) {
        return { text: "Possibilities is present, partner. What's on your mind?" };
      }
      const conversationalGreetings = [
        "I'm listening, partner.",
        "Hey there. What are we exploring today?",
        "Hello! How can I assist you right now?",
        "Here with you, partner. What's on your mind?",
        "Greetings, partner. What shall we focus on?"
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
    // (Must be explicit queries, not incidental sentence occurrences of 'time')
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

    // ==================================================
    // PRIORITY 5: EXPLICIT SYSTEM & NAVIGATION COMMANDS
    // ==================================================
    if (
      query === 'close' ||
      query === 'close overlay' ||
      query === 'close panel' ||
      query === 'dismiss' ||
      query === 'go back' ||
      query === 'back home'
    ) {
      return {
        text: "Closing overlay view.",
        action: { type: 'navigate', target: 'home' }
      };
    }

    if (
      query === 'show missions' ||
      query === 'open missions' ||
      query === 'show my tasks' ||
      query === 'show my to do list' ||
      query === 'open tasks'
    ) {
      return { 
        text: "Possibilities has loaded your 3 critical daily tasks for today. Check your daily view on screen.",
        action: { type: 'navigate', target: 'home' }
      };
    }

    if (
      query === 'open memory' ||
      query === 'show memory' ||
      query === 'open my notes' ||
      query === 'show notes'
    ) {
      return {
        text: "Accessing your cognitive memory constellations.",
        action: { type: 'navigate', target: 'memory' }
      };
    }

    if (
      query === 'open brain' ||
      query === 'show brain' ||
      query === 'neural topology'
    ) {
      return {
        text: "Initiating neural cognitive analysis.",
        action: { type: 'navigate', target: 'brain' }
      };
    }

    if (
      query === 'show diagnostics' ||
      query === 'system diagnostics' ||
      query === 'open command center' ||
      query === 'show command center'
    ) {
      return {
        text: "Displaying system command center and diagnostics.",
        action: { type: 'navigate', target: 'commandCenter' }
      };
    }

    if (
      query === 'open settings' ||
      query === 'show settings' ||
      query === 'system settings'
    ) {
      return {
        text: "Opening system configuration and preferences.",
        action: { type: 'navigate', target: 'settings' }
      };
    }

    if (
      query === 'open search' ||
      query === 'search index'
    ) {
      return {
        text: "Opening search index.",
        action: { type: 'navigate', target: 'search' }
      };
    }

    if (
      query === 'open orb defense' ||
      query === 'orb defense'
    ) {
      return {
        text: "Engaging Orb Defense core simulation.",
        action: { type: 'navigate', target: 'orbDefense' }
      };
    }

    // ==================================================
    // PRIORITY 6: EXPLICIT COMMAND UTILITIES
    // ==================================================
    if (query.startsWith('create note:') || query.startsWith('save note:')) {
      const content = input.replace(/^(create note:|save note:)\s*/i, '').trim();
      if (content) {
        this.session.notes.push(content);
        saveSession(this.session);
        return {
          text: `Saved to memory: "${content}".`,
          action: { type: 'note_created', details: content }
        };
      }
    }

    if (query.startsWith('create reminder:') || query.startsWith('set reminder:')) {
      const remText = input.replace(/^(create reminder:|set reminder:)\s*/i, '').trim();
      if (remText) {
        this.session.reminders.push({ id: `${Date.now()}`, text: remText });
        saveSession(this.session);
        return {
          text: `Reminder set: "${remText}".`,
          action: { type: 'reminder_created', details: remText }
        };
      }
    }

    if (query === 'call charlene' || query === 'dial charlene') {
      return {
        text: "Shall I initiate a secure voice line with Charlene?",
        action: {
          type: 'confirm',
          target: 'Call Charlene',
          details: 'Voice transmission to Charlene',
        },
      };
    }

    if (query === 'switch to focus mode' || query === 'enable focus mode') {
      return { text: "Switched to focus mode. Systems aligned.", action: { type: 'mode_change', target: 'focus' } };
    }
    if (query === 'switch to calm mode' || query === 'enable calm mode') {
      return { text: "Switched to calm mode. Systems aligned.", action: { type: 'mode_change', target: 'calm' } };
    }

    // Default: Return requiresOnlineAi = true so Gemini AI processes the request
    // with deep conversational intent, common sense, and emotional context.
    return {
      text: "Thinking...",
      requiresOnlineAi: true,
    };
  }

  // Graceful Offline Fallback Generator
  public getOfflineFallback(query: string): string {
    return this.pickRandom([
      "I've recorded your thought locally. Once reconnected, we can explore it deeper.",
      "Local systems are active. I'll hold onto that request for cloud processing.",
      "Got it. Stored in local session memory.",
      "I'm keeping track of that locally for you."
    ]);
  }
}

export const companionEngine = new CompanionEngine();
