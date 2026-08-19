// Self-Inspection & Code/System Access Engine for Possibilities
// Provides authorized inspection tools for system status, file structures, schemas, memory states, logs, and capabilities.

import { memoryStore } from './memoryStore';
import { temporalEngine } from './temporalEngine';

export interface CodeFileInfo {
  path: string;
  category: 'Android Shell' | 'React Core' | 'Memory System' | 'Config' | 'Audio Engine';
  description: string;
}

export const KNOWN_SYSTEM_FILES: CodeFileInfo[] = [
  { path: 'android/app/build.gradle', category: 'Android Shell', description: 'Android build script, version code, version name, signing config' },
  { path: 'android/app/src/main/AndroidManifest.xml', category: 'Android Shell', description: 'Android application manifest, backup rules, permissions' },
  { path: 'capacitor.config.json', category: 'Config', description: 'Capacitor mobile shell configuration' },
  { path: 'package.json', category: 'Config', description: 'Project scripts, dependencies, build targets' },
  { path: 'server.ts', category: 'React Core', description: 'Express backend server, Gemini API proxy, static asset server' },
  { path: 'src/App.tsx', category: 'React Core', description: 'Main application router, navigation state, floating orb layout' },
  { path: 'src/types.ts', category: 'React Core', description: 'Global TypeScript data structures and interfaces' },
  { path: 'src/utils/companionEngine.ts', category: 'Memory System', description: 'Central companion engine, intent parser, prompt builder' },
  { path: 'src/utils/memoryStore.ts', category: 'Memory System', description: 'Structured persistent memory, episodic engine, provenance' },
  { path: 'src/utils/temporalEngine.ts', category: 'Memory System', description: 'Deterministic time calculations, session metadata' },
  { path: 'src/utils/backupEngine.ts', category: 'Memory System', description: 'Memory serializer, export/import JSON, auto-backup' },
  { path: 'src/utils/selfInspection.ts', category: 'Memory System', description: 'Self-inspection tools, code search, status diagnosis' },
  { path: 'src/utils/approvalEngine.ts', category: 'Memory System', description: 'Approval-gated code modification, diff viewer, rollback' },
  { path: 'src/utils/audioSynthesizer.ts', category: 'Audio Engine', description: 'Web Audio API procedural sound synthesizer' },
  { path: 'src/components/HomeCompanionView.tsx', category: 'React Core', description: 'Primary living orb screen, voice/text input, chat clearing' },
  { path: 'src/components/ChatView.tsx', category: 'React Core', description: 'Detailed conversational view with message history' },
  { path: 'src/components/MemoryView.tsx', category: 'Memory System', description: 'Living document memory manager and inspection dashboard' },
  { path: 'src/components/CommandCenterView.tsx', category: 'React Core', description: 'System diagnostics and self-inspection control panel' },
  { path: 'src/components/BrainView.tsx', category: 'React Core', description: 'Neural graph node visualization' },
];

export class SelfInspectionEngine {
  public selfInspect() {
    const session = temporalEngine.getCurrentSession();
    const profile = memoryStore.getPartnerProfile();
    const living = memoryStore.getLivingContext();
    const coreCount = memoryStore.getCoreMemories().length;
    const episodicCount = memoryStore.getEpisodicEvents().length;
    const tempRulesCount = memoryStore.getTemporaryRules().length;

    return {
      identity: {
        companionName: 'Possibilities',
        creator: profile.actualName,
        creatorPreferredAddress: profile.preferredAddress,
        creatorRelationship: profile.creatorRelationship,
        externalTools: profile.externalToolsAcknowledged,
      },
      mentalModel: {
        androidShell: 'Body (Capacitor / Android App Shell)',
        memorySystem: 'Brain (Persistent Memory Store & Cortical Capsule Engine)',
        services: 'Organs (Express API, Gemini API Proxy, Web Audio Synthesizer)',
        tools: 'Capabilities (Self-Inspect, File Access, Code Search, Capability Pipeline, Backup/Restore)',
        database: 'Persistent Memory Store',
      },
      session: {
        sessionId: session.sessionId,
        startedAt: session.startedAt,
        timezone: session.timezone,
      },
      memoryHealth: {
        coreMemories: coreCount,
        episodicEvents: episodicCount,
        temporaryRules: tempRulesCount,
        livingContextProjects: living.currentProjects.length,
        status: 'Healthy & Operational',
      },
    };
  }

  public listFiles(): CodeFileInfo[] {
    return KNOWN_SYSTEM_FILES;
  }

  public readConfig(): { capacitor: string; packageJson: string; androidManifest: string } {
    return {
      capacitor: 'App ID: com.possibilities.app, App Name: Possibilities',
      packageJson: 'Version: 0.0.0, Scripts: dev, build, start, lint, Preview Port: 3000',
      androidManifest: 'Package: com.possibilities.app, allowBackup: true, Backup Rules: @xml/backup_rules',
    };
  }

  public readDatabaseSchema() {
    return {
      tables: [
        { name: 'partner_profile', description: 'Creator Identity (Arno/Arie) & Communication Preferences' },
        { name: 'living_context', description: 'Current projects, priorities, struggles, and active focus' },
        { name: 'core_memories', description: 'Permanent sacred facts, promises, and directives' },
        { name: 'episodic_events', description: 'Time-aware meaningful conversation and life events' },
        { name: 'memory_provenance', description: 'Source tracking, confidence, and versioning for memories' },
        { name: 'temporary_memories', description: 'TTL rules with expiration timestamps' },
        { name: 'snapshots', description: 'Pre-patch and pre-wipe safety rollbacks' },
      ],
      version: '3.0',
      storageBackend: 'IndexedDB / LocalStorage JSON backing',
    };
  }

  public readCapabilities() {
    return [
      'Self-Inspection & Diagnostic Telemetry',
      'Code Path & File Inspection',
      'Approval-Gated Code & Schema Modification',
      'Deterministic Runtime Temporal Calculation',
      'Persistent Episodic Event Memory',
      'Memory Provenance & TTL Expiration Engine',
      'Web Audio Procedural Sound Synthesis',
      'Zero-Memory-Loss Backup & Restore Serializer',
      'Clear Chat Screen Reset (Memory Preserving)',
    ];
  }
}

export const selfInspectionEngine = new SelfInspectionEngine();
