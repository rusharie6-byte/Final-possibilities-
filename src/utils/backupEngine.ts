// Backup & Survival Engine for Possibilities
// Provides structured JSON export/import, file download triggers, auto-backups, and encrypted memory preservation across reinstalls.

import { memoryStore } from './memoryStore';

export class BackupEngine {
  public generateBackupJson(): string {
    const memoryData = memoryStore.exportMemoryData();
    return JSON.stringify(memoryData, null, 2);
  }

  public downloadBackupFile(): void {
    const jsonStr = this.generateBackupJson();
    const dateTag = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const fileName = `possibilities_memory_backup_${dateTag}.json`;

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public restoreFromJson(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'Invalid JSON file structure.' };
      }

      const imported = memoryStore.importMemoryData(parsed);
      if (imported) {
        return { success: true, message: 'Possibilities memory restored successfully.' };
      } else {
        return { success: false, message: 'Failed to process memory structure.' };
      }
    } catch (err: any) {
      return { success: false, message: `Restore error: ${err?.message || 'Invalid format'}` };
    }
  }

  public triggerAutoBackup(): void {
    try {
      const jsonStr = this.generateBackupJson();
      localStorage.setItem('possibilities_auto_backup_latest', jsonStr);
      localStorage.setItem('possibilities_auto_backup_timestamp', new Date().toISOString());
    } catch (e) {
      console.warn('Auto backup storage write failed:', e);
    }
  }

  public getLatestAutoBackupTimestamp(): string | null {
    return localStorage.getItem('possibilities_auto_backup_timestamp');
  }

  public restoreLatestAutoBackup(): { success: boolean; message: string } {
    const jsonStr = localStorage.getItem('possibilities_auto_backup_latest');
    if (!jsonStr) {
      return { success: false, message: 'No auto-backup file found in local device persistence.' };
    }
    return this.restoreFromJson(jsonStr);
  }
}

export const backupEngine = new BackupEngine();
