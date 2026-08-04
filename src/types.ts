export type NexusSectionId = 'brain' | 'missions' | 'chat' | 'memory' | 'commandCenter' | 'orbDefense';

export type AppRoute = 'home' | 'nexus' | NexusSectionId | 'search' | 'settings';

export type OrbMode = 'hero' | 'nexus' | 'floating' | 'minimized';

export type SystemMode = 'calm' | 'intelligence' | 'focus' | 'overdrive';

export interface NexusNodeConfig {
  id: NexusSectionId;
  label: string;
  sublabel: string;
  angle: number; // in degrees (0 = top, 72 = top-right, etc.)
  iconName: string;
  accentColor: string;
}

export interface MissionItem {
  id: string;
  title: string;
  objective: string;
  priority: 'CRITICAL' | 'HIGH' | 'STABLE';
  progress: number; // 0 to 100
  status: 'In Progress' | 'Standby' | 'Fulfilled';
  updatedAt: string;
  subtasks: { id: string; text: string; done: boolean }[];
}

export interface PartnerProfile {
  personality: string;
  communicationStyle: string;
  preferences: string[];
  values: string[];
  habits: string[];
  longTermGoals: string[];
  relationships: string[];
  responsePreferences: string;
  lastReflectedAt: string;
}

export interface LivingContext {
  currentFocus: string;
  currentProjects: string[];
  currentStruggles: string[];
  currentPriorities: string[];
  currentEmotions: string[];
  activeConversations: string[];
  shortTermReminders: { id: string; text: string; createdAt: string }[];
  updatedAt: string;
}

export interface CoreMemoryItem {
  id: string;
  text: string;
  category: 'Name' | 'Family' | 'Life Event' | 'Permanent Preference' | 'Promise' | 'Sacred';
  createdAt: string;
}

export interface ReflectionLogEntry {
  id: string;
  timestamp: string;
  learnedNew: boolean;
  insightSummary?: string;
  updatedDocument?: 'Partner Profile' | 'Living Context' | 'None';
}

export interface MemoryItem {
  id: string;
  title: string;
  timestamp: string;
  category: 'Cognitive' | 'Directive' | 'Synthesis' | 'System';
  resonanceScore: number; // 0.0 to 1.0
  summary: string;
  tags: string[];
}

export interface BrainNode {
  id: string;
  label: string;
  category: 'core' | 'perception' | 'synthesis' | 'memory' | 'action';
  valency: number; // 0.0 to 1.0
  x: number; // -100 to 100 percentage
  y: number; // -100 to 100 percentage
  connections: string[]; // target node IDs
  isActive?: boolean;
}

export interface StagedActionPayload {
  proposalId: string;
  toolName: string;
  arguments: Record<string, any>;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED';
  executionResult?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'possibilities';
  text: string;
  timestamp: string;
  thoughtProcess?: string;
  isStreaming?: boolean;
  stagedAction?: StagedActionPayload;
}

export interface CommitReceipt {
  recordId: string;
  operationId: string;
  operation: 'memory_write' | 'code_patch' | 'schema_update' | 'presence_rule' | 'rollback';
  status: 'SUCCESS' | 'REJECTED' | 'FAILED';
  timestamp: string; // ISO UTC
  targetLayer?: 'core' | 'living_context' | 'episodic' | 'temporary' | 'presence_rule';
  keyOrCategory?: string;
  value?: string;
  provenance: string;
  verification: {
    writeConfirmed: boolean;
    readBackConfirmed: boolean;
    contextReloadConfirmed: boolean;
  };
  message: string;
}

export interface MemoryWriteProposal {
  proposalId: string;
  createdAt: string;
  targetLayer: 'core' | 'living_context' | 'episodic' | 'temporary' | 'presence_rule';
  key: string;
  value: string;
  justification: string;
  source: string;
  durationMs?: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'FAILED';
  receipt?: CommitReceipt;
}

export interface ConversationBackup {
  version: string;
  exportedAt: string;
  sessionId: string;
  messageCount: number;
  messages: ChatMessage[];
  metadata: {
    creator: string;
    preferredAddress: string;
  };
}

export interface SystemDiagnostics {
  fps: number;
  coreTemperature: string;
  neuralLoad: number; // 0 to 100
  activeThreads: number;
  audioFrequencyHz: number;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  activeMode: SystemMode;
}
