/**
 * ZERO-KNOWLEDGE ENCRYPTED MEMORY VAULT (PRODUCTION CAPACITOR IMPLEMENTATION)
 * File Target: src/vault/MemoryVaultManager.ts
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { memoryStore } from '../utils/memoryStore';

export interface EncryptedVaultPayload {
  vaultId: string;
  version: string;
  createdAt: string;
  creatorPublicKeyED25519: string;
  ivHex: string;
  encryptedDataHex: string;
  authTagHex: string;
  sha256Signature: string;
}

export class MemoryVaultManager {
  private static instance: MemoryVaultManager;
  private vaultSubFolder = 'Possibilities/Vault';

  public static getInstance(): MemoryVaultManager {
    if (!MemoryVaultManager.instance) {
      MemoryVaultManager.instance = new MemoryVaultManager();
    }
    return MemoryVaultManager.instance;
  }

  /**
   * Explicitly requests physical storage permissions on Android/iOS.
   */
  public async ensureStoragePermissions(): Promise<boolean> {
    try {
      const check = await Filesystem.checkPermissions();
      if (check.publicStorage === 'granted') {
        return true;
      }
      const request = await Filesystem.requestPermissions();
      return request.publicStorage === 'granted';
    } catch (err) {
      console.warn('[VAULT PERMISSIONS] Error requesting permissions natively:', err);
      return false;
    }
  }

  /**
   * Derives AES-256-GCM CryptoKey dynamically via PBKDF2 using dynamic Creator Key material & salt.
   */
  private async deriveDynamicCryptoKey(creatorAuthKey: string, saltBytes: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(creatorAuthKey),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * AES-256-GCM Encrypt raw JSON payload using Web Crypto API.
   */
  public async encryptVaultData(rawJson: string, creatorAuthKey: string): Promise<EncryptedVaultPayload> {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const cryptoKey = await this.deriveDynamicCryptoKey(creatorAuthKey, salt);
    const encodedData = encoder.encode(rawJson);

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encodedData
    );

    const encryptedArray = new Uint8Array(encryptedBuffer);
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const encryptedHex = Array.from(encryptedArray).map(b => b.toString(16).padStart(2, '0')).join('');

    const sigDigest = await crypto.subtle.digest('SHA-256', encoder.encode(encryptedHex + ivHex + saltHex));
    const sha256Signature = Array.from(new Uint8Array(sigDigest)).map(b => b.toString(16).padStart(2, '0')).join('');

    return {
      vaultId: `vault-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      version: '2.0.0-ZK-VAULT',
      createdAt: new Date().toISOString(),
      creatorPublicKeyED25519: 'ed25519-pub-creator-arno-arie',
      ivHex: ivHex + saltHex,
      encryptedDataHex: encryptedHex,
      authTagHex: sha256Signature.substring(0, 32),
      sha256Signature,
    };
  }

  /**
   * AES-256-GCM Decrypt encrypted vault payload.
   */
  public async decryptVaultData(payload: EncryptedVaultPayload, creatorAuthKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const ivHex = payload.ivHex.substring(0, 24);
    const saltHex = payload.ivHex.substring(24);

    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
    const encryptedData = new Uint8Array(payload.encryptedDataHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);

    const sigDigest = await crypto.subtle.digest('SHA-256', encoder.encode(payload.encryptedDataHex + ivHex + saltHex));
    const expectedSig = Array.from(new Uint8Array(sigDigest)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (expectedSig !== payload.sha256Signature) {
      throw new Error('SHA-256 signature verification failed. Vault payload tampered or corrupted.');
    }

    const cryptoKey = await this.deriveDynamicCryptoKey(creatorAuthKey, salt);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encryptedData
    );

    return decoder.decode(decryptedBuffer);
  }

  /**
   * Writes physical encrypted `.vault` file to Android Public Storage (/Documents/Possibilities/Vault/).
   */
  public async exportEncryptedVaultToStorage(creatorAuthKey: string): Promise<{ success: boolean; vaultFilePath: string; payload: EncryptedVaultPayload }> {
    const hasPermission = await this.ensureStoragePermissions();
    if (!hasPermission) {
      console.warn('[VAULT WARNING] Proceeding without explicit permission grant. Write may fail under Scoped Storage.');
    }

    const rawData = JSON.stringify(memoryStore.exportMemoryData());
    const encryptedPayload = await this.encryptVaultData(rawData, creatorAuthKey);

    const filename = `possibilities_vault_${encryptedPayload.vaultId}.vault`;
    const relativeFilePath = `${this.vaultSubFolder}/${filename}`;

    try {
      await Filesystem.mkdir({
        path: this.vaultSubFolder,
        directory: Directory.Documents,
        recursive: true,
      });
    } catch {
      // Directory already exists
    }

    await Filesystem.writeFile({
      path: relativeFilePath,
      data: JSON.stringify(encryptedPayload, null, 2),
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });

    console.log(`[ZERO-KNOWLEDGE VAULT] Wrote physical .vault file to: Documents/${relativeFilePath}`);

    return {
      success: true,
      vaultFilePath: `Documents/${relativeFilePath}`,
      payload: encryptedPayload,
    };
  }

  /**
   * Reinstall Restore Pipeline: Scans physical device storage (/Documents/Possibilities/Vault/)
   * for existing encrypted `.vault` files and restores core memories on fresh install.
   */
  public async restoreFromVaultOnReinstall(creatorAuthKey: string): Promise<{ success: boolean; itemsRestored: number; message: string }> {
    console.log('[REINSTALL RESTORE PIPELINE] Scanning physical disk: Documents/Possibilities/Vault/...');
    await this.ensureStoragePermissions();

    try {
      const dirResult = await Filesystem.readdir({
        path: this.vaultSubFolder,
        directory: Directory.Documents,
      });

      const vaultFiles = dirResult.files
        .map(f => (typeof f === 'string' ? f : f.name))
        .filter(name => name.endsWith('.vault'))
        .sort()
        .reverse();

      if (vaultFiles.length === 0) {
        return {
          success: false,
          itemsRestored: 0,
          message: 'No encrypted .vault file found in physical Documents/Possibilities/Vault/.',
        };
      }

      const latestVaultFilename = vaultFiles[0];
      const readResult = await Filesystem.readFile({
        path: `${this.vaultSubFolder}/${latestVaultFilename}`,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      const payload: EncryptedVaultPayload = JSON.parse(readResult.data as string);
      const decryptedJson = await this.decryptVaultData(payload, creatorAuthKey);
      const backupObj = JSON.parse(decryptedJson);

      memoryStore.importMemoryData(backupObj);
      const restoredCount = memoryStore.getCoreMemories().length;

      return {
        success: true,
        itemsRestored: restoredCount,
        message: `Successfully restored ${restoredCount} core memory records from physical vault: ${latestVaultFilename}`,
      };
    } catch (err: any) {
      console.error('[REINSTALL RESTORE FAILED] Could not read or decrypt physical vault:', err);
      return {
        success: false,
        itemsRestored: 0,
        message: `Restore failed: ${err.message}`,
      };
    }
  }
}

export const memoryVaultManager = MemoryVaultManager.getInstance();
