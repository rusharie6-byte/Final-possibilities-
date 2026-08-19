// Device Public Storage Vault & Encrypted Persistence Engine
// Uses @capacitor/filesystem for physical disk persistence on Android (Documents/Possibilities/possibilities_vault.json)
// with seamless Web / In-Memory / LocalStorage fallbacks.

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { memoryStore } from './memoryStore';

const PUBLIC_VAULT_FILENAME = 'Possibilities/possibilities_vault.json';
const PUBLIC_VAULT_STORAGE_KEY = 'Documents/Possibilities/possibilities_vault.json';

// Robust Base64 vault encoding/decoding helper
export function encryptVault(plainText: string): string {
  try {
    const encoded = encodeURIComponent(plainText);
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(encoded, 'utf-8').toString('base64');
    }
    return btoa(encoded);
  } catch (e) {
    return btoa(plainText);
  }
}

export function decryptVault(cipherText: string): string {
  try {
    let raw = '';
    if (typeof Buffer !== 'undefined') {
      raw = Buffer.from(cipherText, 'base64').toString('utf-8');
    } else {
      raw = atob(cipherText);
    }
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  } catch (e) {
    return cipherText;
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
  private idb: IDBDatabase | null = null;

  constructor() {
    this.requestPersistentStorage();
    this.initIndexedDB();
  }

  // Request browser persistent storage to prevent eviction on low disk space
  public async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.persist === 'function') {
      try {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
          const granted = await navigator.storage.persist();
          console.log(`[StorageEngine] Browser persistent storage granted: ${granted}`);
          return granted;
        }
        return true;
      } catch (err) {
        console.warn('[StorageEngine] Error requesting persistent storage:', err);
      }
    }
    return false;
  }

  // IndexedDB backup store initialization with robust error handling
  private initIndexedDB(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    if (this.idb) {
      try {
        // Test if existing database instance is open and active
        const testTx = this.idb.transaction('vault_store', 'readonly');
        if (testTx) return Promise.resolve(this.idb);
      } catch (err) {
        // Connection was closed or invalid, reset reference
        this.idb = null;
      }
    }

    return new Promise((resolve) => {
      try {
        const req = indexedDB.open('possibilities_vault_db', 1);
        req.onupgradeneeded = (e: any) => {
          try {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('vault_store')) {
              db.createObjectStore('vault_store');
            }
          } catch {}
        };
        req.onsuccess = (e: any) => {
          this.idb = e.target.result;
          if (this.idb) {
            this.idb.onclose = () => {
              this.idb = null;
            };
            this.idb.onerror = () => {
              this.idb = null;
            };
          }
          resolve(this.idb);
        };
        req.onerror = () => {
          this.idb = null;
          resolve(null);
        };
        req.onblocked = () => {
          this.idb = null;
          resolve(null);
        };
      } catch {
        this.idb = null;
        resolve(null);
      }
    });
  }

  private async saveToIndexedDB(key: string, value: string): Promise<boolean> {
    try {
      const db = await this.initIndexedDB();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('vault_store', 'readwrite');
          tx.onerror = () => resolve(false);
          tx.onabort = () => resolve(false);
          const store = tx.objectStore('vault_store');
          const req = store.put(value, key);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch {
          this.idb = null;
          resolve(false);
        }
      });
    } catch {
      this.idb = null;
      return false;
    }
  }

  private async readFromIndexedDB(key: string): Promise<string | null> {
    try {
      const db = await this.initIndexedDB();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('vault_store', 'readonly');
          tx.onerror = () => resolve(null);
          tx.onabort = () => resolve(null);
          const store = tx.objectStore('vault_store');
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch {
          this.idb = null;
          resolve(null);
        }
      });
    } catch {
      this.idb = null;
      return null;
    }
  }

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

      // Always update Web LocalStorage, IndexedDB & cache fallback
      if (typeof localStorage !== 'undefined' && localStorage) {
        try {
          localStorage.setItem(this.filePath, encrypted);
          localStorage.setItem('possibilities_vault_raw_path', this.filePath);
          localStorage.setItem('possibilities_vault_last_backup', payload.updatedAt);
        } catch {}
      }
      this.saveToIndexedDB(this.filePath, encrypted).catch(() => {});

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

      // Sync snapshot to server backend for persistent cross-reinstall cloud restore
      try {
        const getApiUrl = (path: string) => {
          if (typeof window !== 'undefined' && (window as any).getApiEndpoint) {
            return (window as any).getApiEndpoint(path);
          }
          return path;
        };
        fetch(getApiUrl('/api/vault/sync'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload }),
        }).catch(() => {});
      } catch {}

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

      // Fallback to memory cache, LocalStorage, or IndexedDB if not retrieved natively or running in browser
      if (!encrypted) {
        encrypted = this.memVaultCache;
      }
      if (!encrypted && typeof localStorage !== 'undefined') {
        encrypted = localStorage.getItem(this.filePath);
      }
      if (!encrypted) {
        encrypted = await this.readFromIndexedDB(this.filePath);
      }

      if (!encrypted) {
        // Fallback: Query cloud server restore endpoint if local storage was cleared/uninstalled
        try {
          const getApiUrl = (pathStr: string) => {
            if (typeof window !== 'undefined' && (window as any).getApiEndpoint) {
              return (window as any).getApiEndpoint(pathStr);
            }
            return pathStr;
          };
          const res = await fetch(getApiUrl('/api/vault/restore'));
          if (res.ok) {
            const data = await res.json();
            if (data && data.status === 'ok' && data.payload) {
              console.log('[StorageEngine] Rehydrated vault snapshot from cloud server backend.');
              return data.payload;
            }
          }
        } catch (err) {
          console.warn('[StorageEngine] Server vault restore query note:', err);
        }
        return null;
      }

      this.memVaultCache = encrypted;
      const decrypted = decryptVault(encrypted);
      const parsed: VaultPayload = JSON.parse(decrypted);
      return parsed;
    } catch (e) {
      console.warn('Failed to decrypt or parse vault snapshot:', e);
      return null;
    }
  }

  // Trigger browser file download of encrypted or raw JSON vault file
  public exportVaultFileDownload(customFilename?: string): boolean {
    try {
      let payload = this.readVaultSnapshot();
      if (!payload) {
        // Build fresh snapshot directly from memoryStore if cache is empty
        try {
          payload = memoryStore.exportSnapshot();
          this.saveVaultSnapshot(payload);
        } catch (e) {
          console.warn('[StorageEngine] Could not build live memoryStore snapshot:', e);
        }
      }

      if (!payload) {
        // Fallback minimal valid snapshot payload
        payload = {
          version: '1.0.0',
          updatedAt: new Date().toISOString(),
          filePath: PUBLIC_VAULT_STORAGE_KEY,
          pendingJournal: [],
          memoryData: {
            partnerProfile: memoryStore.getPartnerProfile(),
            livingContext: memoryStore.getLivingContext(),
            coreMemories: memoryStore.getCoreMemories(),
            episodicEvents: memoryStore.getEpisodicEvents(),
            provenanceList: [],
            temporaryRules: [],
            reflectionLogs: [],
          },
        };
      }

      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = customFilename || `possibilities_vault_backup_${dateStr}.vault`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log(`[StorageEngine] Exported physical vault file backup: ${a.download}`);
      return true;
    } catch (err) {
      console.error('[StorageEngine] Export vault download failed:', err);
      return false;
    }
  }

  // Import uploaded vault file (supports raw JSON or base64 encrypted)
  public async importVaultPayloadText(fileText: string): Promise<VaultPayload | null> {
    try {
      let payload: VaultPayload | null = null;
      let cleanText = fileText.trim();

      // Attempt parsing directly as raw JSON
      try {
        payload = JSON.parse(cleanText);
      } catch {
        // Fallback: try decrypting base64 string
        try {
          const decrypted = decryptVault(cleanText);
          payload = JSON.parse(decrypted);
        } catch (decErr) {
          console.error('[StorageEngine] Failed to parse imported file text as JSON or base64:', decErr);
          return null;
        }
      }

      // Handle direct top-level JSON payload formats
      const rawAny = payload as any;
      if (rawAny && !rawAny.memoryData && (rawAny.coreMemories || rawAny.partnerProfile)) {
        payload = {
          version: rawAny.version || '1.0.0',
          updatedAt: rawAny.updatedAt || new Date().toISOString(),
          filePath: PUBLIC_VAULT_STORAGE_KEY,
          pendingJournal: rawAny.pendingJournal || [],
          memoryData: {
            partnerProfile: rawAny.partnerProfile || memoryStore.getPartnerProfile(),
            livingContext: rawAny.livingContext || memoryStore.getLivingContext(),
            coreMemories: rawAny.coreMemories || memoryStore.getCoreMemories(),
            episodicEvents: rawAny.episodicEvents || [],
            provenanceList: rawAny.provenanceList || [],
            temporaryRules: rawAny.temporaryRules || [],
            reflectionLogs: rawAny.reflectionLogs || [],
          },
        };
      }

      if (payload && payload.memoryData) {
        await this.saveVaultSnapshotAsync(payload);
        console.log('[StorageEngine] Successfully imported and restored vault payload.');
        return payload;
      }
      return null;
    } catch (err) {
      console.error('[StorageEngine] Failed to import vault payload:', err);
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

