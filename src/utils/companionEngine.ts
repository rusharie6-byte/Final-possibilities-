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
    // PRIORITY 2: GREETINGS & SMALL TALK
    // ==================================================
    if (/^(hi|hello|hey|morning|good morning|evening|good evening|greetings|yo|sup)\b/.test(query)) {
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
    // PRIORITY 3: CONTEXT & SESSION MEMORY (Leaving / Returning)
    // ==================================================
    if (
      query.includes('going to') ||
      query.includes('brb') ||
      query.includes('be right back') ||
      query.includes('stepping away') ||
      query.includes('feed the dogs') ||
      query.includes('grab coffee') ||
      query.includes('lunch') ||
      query.includes('take a walk')
    ) {
      let activity = 'what you were doing';
      if (query.includes('feed') || query.includes('dog')) activity = 'the dogs';
      else if (query.includes('coffee')) activity = 'your coffee';
      else if (query.includes('lunch')) activity = 'lunch';
      else if (query.includes('walk')) activity = 'your walk';

      this.session.lastUserActivity = activity;
      this.session.userAwayState = true;
      saveSession(this.session);

      const reply = this.pickRandom([
        `Understood. I'll be right here when you return from ${activity}.`,
        `Take your time. I'll keep things ready for when you get back.`,
        `Got it. I'll be waiting here.`
      ]);
      return { text: reply };
    }

    if (
      (query.includes('back') || query.includes("i'm back") || query.includes('returned') || query.includes('here again')) &&
      this.session.userAwayState
    ) {
      const lastAct = this.session.lastUserActivity || 'your task';
      this.session.userAwayState = false;
      this.session.lastUserActivity = undefined;
      saveSession(this.session);

      const reply = this.pickRandom([
        `Welcome back. How was ${lastAct}?`,
        `Glad you're back. Ready to pick up where we left off?`,
        `Welcome back. What's our next step?`
      ]);
      return { text: reply };
    }

    // ==================================================
    // PRIORITY 4: TIME AND DATE
    // ==================================================
    if (query.includes('time') || query.includes('what time') || query.includes('clock') || query.includes('hour')) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const reply = this.pickRandom([
        `It is currently ${timeStr}.`,
        `The current time is ${timeStr}.`,
        `It's ${timeStr}.`
      ]);
      return { text: reply, action: { type: 'time_display' } };
    }

    if (query.includes('date') || query.includes('day is it') || query.includes("today's date") || query.includes('calendar')) {
      const now = new Date();
      const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      const reply = `Today is ${dateStr}.`;
      return { text: reply };
    }

    // ==================================================
    // PRIORITY 5: NATURAL LANGUAGE INTENT RECOGNITION
    // ==================================================

    // CLOSE / DISMISS OVERLAY INTENT
    if (
      query === 'close' ||
      query.includes('close overlay') ||
      query.includes('close page') ||
      query.includes('close view') ||
      query.includes('close panel') ||
      query.includes('hide page') ||
      query.includes('hide overlay') ||
      query.includes('go back') ||
      query.includes('back home') ||
      query.includes('dismiss')
    ) {
      return {
        text: "Closing overlay view.",
        action: { type: 'navigate', target: 'home' }
      };
    }

    // A. MISSIONS & TASKS INTENT
    // "What work do I still have?" "What must I still do?" "Today's jobs." "What haven't I finished?" "What's next?" "What is my priority?"
    if (
      query.includes('mission') ||
      query.includes('task') ||
      query.includes('must i still do') ||
      query.includes('work is left') ||
      query.includes('work do i still have') ||
      query.includes("today's jobs") ||
      query.includes("today's tasks") ||
      query.includes("today's missions") ||
      query.includes("haven't i finished") ||
      query.includes("haven't finished") ||
      query.includes("what's next") ||
      query.includes('my priority') ||
      query.includes('my priorities') ||
      query.includes('what to do') ||
      query.includes('todo') ||
      query.includes('to do list') ||
      query.includes('agenda')
    ) {
      return { 
        text: "Possibilities has loaded your 3 critical daily tasks for today. Check your daily view on screen.",
        action: { type: 'navigate', target: 'home' }
      };
    }

    // B. MEMORY & SAVING INTENT
    // "I need to remember something." "I forgot..." "Save this." "Remember this." "Store this." "I'll need this later." "I want to keep this."
    if (
      query.includes('need to remember') ||
      query.includes('i forgot') ||
      query.includes('remember this') ||
      query.includes('save this') ||
      query.includes('store this') ||
      query.includes("need this later") ||
      query.includes('keep this') ||
      query.includes('write this down') ||
      query.includes('note this down') ||
      query.includes('memory') ||
      query.includes('memories') ||
      query.includes('constellation')
    ) {
      const noteMatch = input.match(/(?:save this|remember this|store this|need to remember|write this down|note down)[:\s]+(.+)/i);
      if (noteMatch && noteMatch[1]) {
        const content = noteMatch[1].trim();
        this.session.notes.push(content);
        saveSession(this.session);
        const reply = this.pickRandom([
          `Saved to your memories: "${content}".`,
          `Recorded. I will keep "${content}" safe for you.`,
          `Stored in memory.`
        ]);
        return { text: reply, action: { type: 'note_created', details: content } };
      }

      const reply = this.pickRandom([
        "Accessing your cognitive memory constellations.",
        "Opening your saved memories and notes.",
        "Retrieving your memory nodes."
      ]);
      return { text: reply, action: { type: 'navigate', target: 'memory' } };
    }

    // C. BRAIN / THINKING / ANALYSIS INTENT
    // "Help me think." "I need help thinking." "Analyze this." "What do you think?" "Give me ideas." "Help me solve this."
    if (
      query.includes('help me think') ||
      query.includes('help thinking') ||
      query.includes('analyze') ||
      query.includes('what do you think') ||
      query.includes('give me ideas') ||
      query.includes('help me solve') ||
      query.includes('brainstorm') ||
      query.includes('cognitive') ||
      query.includes('neural') ||
      query.includes('brain') ||
      query.includes('solve this')
    ) {
      const reply = this.pickRandom([
        "Initiating neural cognitive analysis.",
        "Opening brain topology to help you think through this.",
        "Let's break this down together."
      ]);
      return { text: reply, action: { type: 'navigate', target: 'brain' } };
    }

    // D. COMMAND CENTER / SYSTEM DIAGNOSTICS INTENT
    // "System status." "Show diagnostics." "Performance." "Health." "Status."
    if (
      query.includes('system status') ||
      query.includes('show diagnostics') ||
      query.includes('diagnostics') ||
      query.includes('performance') ||
      query.includes('system health') ||
      query.includes('command center') ||
      query.includes('telemetry')
    ) {
      const reply = this.pickRandom([
        "Displaying system command center and diagnostics.",
        "Opening system health and performance telemetry.",
        "Accessing command center."
      ]);
      return { text: reply, action: { type: 'navigate', target: 'commandCenter' } };
    }

    // E. SETTINGS & PREFERENCES INTENT
    // "I want to change my voice." "Turn speech off." "Preferences." "I want to change something."
    if (
      query.includes('change my voice') ||
      query.includes('turn speech off') ||
      query.includes('preferences') ||
      query.includes('change something') ||
      query.includes('settings') ||
      query.includes('options') ||
      query.includes('configure')
    ) {
      const reply = this.pickRandom([
        "Opening system configuration and preferences.",
        "Accessing settings for you.",
        "Bringing up system parameters."
      ]);
      return { text: reply, action: { type: 'navigate', target: 'settings' } };
    }

    // F. SEARCH INTENT
    // "Find Charlene." "Search..." "Where did I save..." "Look for..."
    if (
      query.startsWith('find') ||
      query.startsWith('search') ||
      query.includes('where did i save') ||
      query.includes('look for') ||
      query.includes('where is my') ||
      query.includes('locate')
    ) {
      const reply = this.pickRandom([
        "Opening search index. What shall we look for?",
        "Searching your cognitive notes and memories.",
        "Accessing search."
      ]);
      return { text: reply, action: { type: 'navigate', target: 'search' } };
    }

    // G. ORB DEFENSE / RELAXATION INTENT
    // "I'm bored." "I want a break." "Let's defend the core." "I need to relax."
    if (
      query.includes('want a break') ||
      query.includes("i'm bored") ||
      query.includes('defend the core') ||
      query.includes('need to relax') ||
      query.includes('unwind') ||
      query.includes('orb defense') ||
      query.includes('take a rest')
    ) {
      const reply = this.pickRandom([
        "Engaging Orb Defense core simulation.",
        "Opening Orb Defense. Take a moment to relax.",
        "Accessing core defense protocol."
      ]);
      return { text: reply, action: { type: 'navigate', target: 'orbDefense' } };
    }

    // ==================================================
    // PRIORITY 6: AMBIGUOUS INTENT HANDLING (Ask Clarification)
    // ==================================================
    if (
      query.includes('lost something') ||
      query.includes('looking for') ||
      query.includes('where is it') ||
      query.includes('can you help me find')
    ) {
      const reply = "Would you like me to search your memories, notes, or missions?";
      return { text: reply };
    }

    // ==================================================
    // PRIORITY 7: OTHER ACTIONS & CONFIRMATIONS
    // ==================================================
    if (query.includes('remind') || query.includes('reminder')) {
      const reminderText = input.replace(/^(remind me to|set a reminder to|remind me|reminder)\s*/i, '').trim();
      this.session.reminders.push({ id: `${Date.now()}`, text: reminderText });
      saveSession(this.session);

      const reply = this.pickRandom([
        `Reminder set: "${reminderText}".`,
        `Logged. I will remind you as requested.`,
        `Reminder added to your active queue.`
      ]);
      return { text: reply, action: { type: 'reminder_created', details: reminderText } };
    }

    if (query.includes('call') || query.includes('charlene') || query.includes('dial')) {
      const contactName = query.includes('charlene') ? 'Charlene' : 'contact';
      const reply = `Shall I initiate a secure voice line with ${contactName}?`;

      return {
        text: reply,
        action: {
          type: 'confirm',
          target: `Call ${contactName}`,
          details: `Voice transmission to ${contactName}`,
        },
      };
    }

    if (query.includes('focus mode') || query.includes('overdrive') || query.includes('calm mode')) {
      let mode = 'calm';
      if (query.includes('focus')) mode = 'focus';
      if (query.includes('overdrive')) mode = 'overdrive';

      const reply = `Switched to ${mode} mode. Systems aligned.`;
      return { text: reply, action: { type: 'mode_change', target: mode } };
    }

    if (query.includes('how are you') || query.includes('how do you feel') || query.includes('what are you')) {
      const reply = this.pickRandom([
        "All systems are operating in harmony. Ready whenever you are.",
        "Calm and attuned. How are you holding up?",
        "I'm feeling balanced and ready to assist."
      ]);
      return { text: reply };
    }

    if (query.includes('thank') || query.includes('thanks')) {
      const reply = this.pickRandom([
        "Always a pleasure.",
        "Anytime.",
        "Glad I could help.",
        "Of course."
      ]);
      return { text: reply };
    }

    // Default to triggering online AI if connected
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
