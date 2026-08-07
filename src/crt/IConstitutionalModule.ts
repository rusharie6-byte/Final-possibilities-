/**
 * CONSTITUTIONAL MODULE CONTRACT (IConstitutionalModule)
 * Constitutional Root of Trust (CRT) v2.0
 */

export interface PermissionManifest {
  moduleId: string;
  allowedStoragePaths: string[];
  allowedSystemCalls: string[];
  networkAccess: boolean;
  writeToCoreMemory: boolean;
  executeNativeCode: boolean;
}

export interface CapabilityManifest {
  moduleId: string;
  version: string;
  description: string;
  providedServices: string[];
  maxMemoryMb: number;
  cpuQuotaPercentage: number;
}

export type ModuleHealthStatus = 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'RESTORATION_REQUIRED';

export interface ModuleIntegrityReport {
  moduleId: string;
  isIntegrityValid: boolean;
  sha256Signature: string;
  verifiedAt: string;
  violations: string[];
}

export interface IConstitutionalModule {
  moduleId: string;
  verifyIntegrity(): Promise<boolean>;
  declarePermissions(): PermissionManifest;
  declareCapabilities(): CapabilityManifest;
  heartbeat(): boolean;
  shutdown(reason: string): void;
}
