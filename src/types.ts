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

export interface ChatMessage {
  id: string;
  sender: 'user' | 'possibilities';
  text: string;
  timestamp: string;
  thoughtProcess?: string;
  isStreaming?: boolean;
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
