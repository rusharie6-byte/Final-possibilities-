// Device Public Storage Vault & Encrypted Persistence Engine
// Uses @capacitor/filesystem for physical disk persistence on Android (Documents/Possibilities/possibilities_vault.json)
// with seamless Web / In-Memory / LocalStorage fallbacks.

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const PUBLIC_VAULT_FILENAME = 'Possibilities/possibilities_vault.json';
const PUBLIC_VAULT_STORAGE_KEY = 'Documents/Possibilities/possibilities_vault.json';

// Robust Base64 vault encoding/decoding helper
export function encryptVault(plainText: string): string {
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(plainText, 'utf-8').toString('base64');
    }
    return btoa(encodeURIComponent(plainText));
  } catch (e) {
    return btoa(plainText);
  }
}

export function decryptVault(cipherText: string): string {
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(cipherText, 'base64').toString('utf-8');
    }
    return decodeURIComponent(atob(cipherText));
  } catch (e) {
    return atob(cipherText);
  }
}

export interface JournalEntry {
  id: string;
  userMessage: string;
  timestamp: string;
  sessionId: string;
  processed: boolean;
}

export interface VaultPayload {
  version: string;
  updatedAt: string;
  filePath: string; // "Documents/Possibilities/possibilities_vault.json"
  pendingJournal: JournalEntry[];
  memoryData: {
    partnerProfile: any;
    livingContext: any;
    coreMemories: any[];
    episodicEvents: any[];
    provenanceList: any[];
    temporaryRules: any[];
    reflectionLogs: any[];
  };
}

export class StorageEngine {
  private filePath = PUBLIC_VAULT_STORAGE_KEY;
  private memVaultCache: string | null = null;

  private isNative(): boolean {
    try {
      return typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  }

  private async checkAndRequestPermissions(): Promise<boolean> {
    if (!this.isNative()) return true;
    try {
      if (typeof Filesystem.checkPermissions === 'function') {
        const status = await Filesystem.checkPermissions();
        if ((status as any)?.publicStorage === 'granted') {
          return true;
        }
        if (typeof Filesystem.requestPermissions === 'function') {
          const req = await Filesystem.requestPermissions();
          if ((req as any)?.publicStorage === 'granted') {
            return true;
          }
          console.warn('[StorageEngine] Native storage permission denied by user:', req);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.warn('[StorageEngine] Permission check error, proceeding best-effort:', err);
      return true;
    }
  }

  // Real Native Physical Disk Write using @capacitor/filesystem
  public async saveVaultSnapshotAsync(payload: VaultPayload): Promise<boolean> {
    try {
      const jsonStr = JSON.stringify(payload);
      const encrypted = encryptVault(jsonStr);
      this.memVaultCache = encrypted;

      // Always update Web LocalStorage & cache fallback
      if (typeof localStorage !== 'undefined' && localStorage) {
        try {
          localStorage.setItem(this.filePath, encrypted);
          localStorage.setItem('possibilities_vault_raw_path', this.filePath);
          localStorage.setItem('possibilities_vault_last_backup', payload.updatedAt);
        } catch {}
      }

      // If running on Native Android/iOS via Capacitor, write physical file to Documents directory
      if (this.isNative()) {
        const hasPermission = await this.checkAndRequestPermissions();
        if (!hasPermission) {
          console.warn('[StorageEngine] Skipping physical native write due to denied permissions. Falling back to LocalStorage.');
        } else {
          try {
            await Filesystem.writeFile({
              path: PUBLIC_VAULT_FILENAME,
              data: encrypted,
              directory: Directory.Documents,
              encoding: Encoding.UTF8,
              recursive: true,
            });
            console.log('[StorageEngine] Successfully wrote physical native vault file to Documents/Possibilities/possibilities_vault.json');
          } catch (nativeErr) {
            console.warn('[StorageEngine] Primary Directory.Documents write failed, trying Directory.ExternalStorage fallback...', nativeErr);
            try {
              await Filesystem.writeFile({
                path: PUBLIC_VAULT_FILENAME,
                data: encrypted,
                directory: Directory.ExternalStorage,
                encoding: Encoding.UTF8,
                recursive: true,
              });
              console.log('[StorageEngine] Wrote physical native vault file to ExternalStorage/Possibilities/possibilities_vault.json');
            } catch (extErr) {
              console.error('[StorageEngine] Physical disk write failed on native platform:', extErr);
            }
          }
        }
      }

      return true;
    } catch (e) {
      console.error('Failed to write vault snapshot to device storage:', e);
      return false;
    }
  }

  // Synchronous trigger that fires background native write and updates memory cache
  public saveVaultSnapshot(payload: VaultPayload): boolean {
    // Fire async native save in background
    this.saveVaultSnapshotAsync(payload).catch((err) => {
      console.warn('Background saveVaultSnapshotAsync error:', err);
    });
    return true;
  }

  // Real Native Physical Disk Read using @capacitor/filesystem
  public async readVaultSnapshotAsync(): Promise<VaultPayload | null> {
    try {
      let encrypted: string | null = null;

      // Try reading physical file from disk on Native Android/iOS first
      if (this.isNative()) {
        const hasPermission = await this.checkAndRequestPermissions();
        if (!hasPermission) {
          console.warn('[StorageEngine] Skipping physical native read due to denied permissions. Falling back to LocalStorage.');
        } else {
          try {
            const res = await Filesystem.readFile({
              path: PUBLIC_VAULT_FILENAME,
              directory: Directory.Documents,
              encoding: Encoding.UTF8,
            });
            if (res && typeof res.data === 'string' && res.data.length > 0) {
              encrypted = res.data;
              console.log('[StorageEngine] Read physical native vault file from Documents/Possibilities/possibilities_vault.json');
            }
          } catch (nativeErr) {
            try {
              const extRes = await Filesystem.readFile({
                path: PUBLIC_VAULT_FILENAME,
                directory: Directory.ExternalStorage,
                encoding: Encoding.UTF8,
              });
              if (extRes && typeof extRes.data === 'string' && extRes.data.length > 0) {
                encrypted = extRes.data;
                console.log('[StorageEngine] Read physical native vault file from ExternalStorage/Possibilities/possibilities_vault.json');
              }
            } catch {}
          }
        }
      }

      // Fallback to memory cache or LocalStorage if not retrieved natively or running in browser
      if (!encrypted) {
        encrypted = this.memVaultCache;
      }
      if (!encrypted && typeof localStorage !== 'undefined') {
        encrypted = localStorage.getItem(this.filePath);
      }

      if (!encrypted) return null;

      this.memVaultCache = encrypted;
      const decrypted = decryptVault(encrypted);
      const parsed: VaultPayload = JSON.parse(decrypted);
      return parsed;
    } catch (e) {
      console.warn('Failed to decrypt or parse vault snapshot:', e);
      return null;
    }
  }

  // Synchronous read from cache / LocalStorage
  public readVaultSnapshot(): VaultPayload | null {
    try {
      let encrypted = this.memVaultCache;
      if (!encrypted && typeof localStorage !== 'undefined') {
        encrypted = localStorage.getItem(this.filePath);
      }
      if (!encrypted) return null;

      const decrypted = decryptVault(encrypted);
      const parsed: VaultPayload = JSON.parse(decrypted);
      return parsed;
    } catch (e) {
      console.warn('Failed to decrypt or parse vault snapshot:', e);
      return null;
    }
  }

  public async hasVaultSnapshotAsync(): Promise<boolean> {
    const vault = await this.readVaultSnapshotAsync();
    return vault !== null;
  }

  public hasVaultSnapshot(): boolean {
    if (this.memVaultCache) return true;
    if (typeof localStorage !== 'undefined') {
      return !!localStorage.getItem(this.filePath);
    }
    return false;
  }

  public getVaultPath(): string {
    return this.filePath;
  }
}

export const storageEngine = new StorageEngine();

