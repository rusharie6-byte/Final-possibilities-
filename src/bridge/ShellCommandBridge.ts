/**
 * POSSIBILITIES SHELL IPC & COMMAND BRIDGE
 * File Target: src/bridge/ShellCommandBridge.ts
 */

import { memoryVaultManager } from '../vault/MemoryVaultManager';

export interface ShellIPCCommand {
  protocol: 'POSSIBILITIES_SHELL_IPC';
  target_module: 'MemoryVaultManager' | 'SystemState' | 'VoiceController';
  action: string;
  payload: Record<string, any>;
}

export interface ExecutionResult {
  executed: boolean;
  action: string;
  success: boolean;
  output: any;
  error?: string;
}

export class ShellCommandBridge {
  private static instance: ShellCommandBridge;
  private defaultAuthKey = 'ARNO_ARIE_MASTER_KEY_2026';

  public static getInstance(): ShellCommandBridge {
    if (!ShellCommandBridge.instance) {
      ShellCommandBridge.instance = new ShellCommandBridge();
    }
    return ShellCommandBridge.instance;
  }

  /**
   * Scans an incoming LLM response string for POSSIBILITIES_SHELL_IPC JSON blocks.
   */
  public parseAndExecuteStream(llmOutputText: string): ExecutionResult[] {
    const results: ExecutionResult[] = [];
    const jsonBlockRegex = /```json\s*(\{[\s\S]*?"protocol"\s*:\s*"POSSIBILITIES_SHELL_IPC"[\s\S]*?\})\s*```/g;

    let match;
    while ((match = jsonBlockRegex.exec(llmOutputText)) !== null) {
      try {
        const rawJson = match[1];
        const command: ShellIPCCommand = JSON.parse(rawJson);
        const result = this.executeCommand(command);
        results.push(result);
      } catch (err: any) {
        console.error('[SHELL IPC PARSE ERROR]', err);
        results.push({
          executed: false,
          action: 'UNKNOWN',
          success: false,
          output: null,
          error: err.message,
        });
      }
    }

    return results;
  }

  /**
   * Executes parsed native IPC calls.
   */
  public executeCommand(command: ShellIPCCommand): ExecutionResult {
    console.log(`[SHELL BRIDGE EXECUTE] Target: ${command.target_module} | Action: ${command.action}`);

    try {
      if (command.target_module === 'MemoryVaultManager') {
        if (command.action === 'exportEncryptedVaultToStorage') {
          const authKey = command.payload?.authKey || this.defaultAuthKey;
          
          // Asynchronous invocation
          memoryVaultManager.exportEncryptedVaultToStorage(authKey).then(res => {
            console.log('[SHELL BRIDGE ASYNC SUCCESS]', res);
          }).catch(err => {
            console.error('[SHELL BRIDGE ASYNC FAILURE]', err);
          });

          return {
            executed: true,
            action: command.action,
            success: true,
            output: 'Export operation dispatched to native storage.',
          };
        }

        if (command.action === 'restoreFromVaultOnReinstall') {
          const authKey = command.payload?.authKey || this.defaultAuthKey;
          
          memoryVaultManager.restoreFromVaultOnReinstall(authKey).then(res => {
            console.log('[SHELL BRIDGE RESTORE RESULT]', res);
          });

          return {
            executed: true,
            action: command.action,
            success: true,
            output: 'Restore operation dispatched.',
          };
        }
      }

      return {
        executed: false,
        action: command.action,
        success: false,
        output: null,
        error: `Unhandled target module: ${command.target_module}`,
      };
    } catch (err: any) {
      return {
        executed: true,
        action: command.action,
        success: false,
        output: null,
        error: err.message,
      };
    }
  }
}

export const shellCommandBridge = ShellCommandBridge.getInstance();
