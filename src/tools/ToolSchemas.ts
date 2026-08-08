/**
 * SECURE TOOL EXECUTION PIPELINE - JSON FUNCTION CALLING SCHEMAS
 * File Target: /src/tools/ToolSchemas.ts
 */

export interface ToolFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export const EXECUTE_SHELL_COMMAND_SCHEMA: ToolFunctionDeclaration = {
  name: 'execute_shell_command',
  description: 'Executes a native bash shell command within the Android/Linux runtime environment.',
  parameters: {
    type: 'OBJECT',
    properties: {
      command: {
        type: 'STRING',
        description: 'The exact command string to execute in the terminal (e.g., "ls -la /sdcard/Documents")',
      },
    },
    required: ['command'],
  },
};

export const READ_FILE_SCHEMA: ToolFunctionDeclaration = {
  name: 'read_file',
  description: 'Reads the contents of a local file from disk.',
  parameters: {
    type: 'OBJECT',
    properties: {
      path: {
        type: 'STRING',
        description: 'Absolute or relative file path to read.',
      },
    },
    required: ['path'],
  },
};

export const WRITE_FILE_SCHEMA: ToolFunctionDeclaration = {
  name: 'write_file',
  description: 'Writes text content to a local file on disk.',
  parameters: {
    type: 'OBJECT',
    properties: {
      path: {
        type: 'STRING',
        description: 'Target file path to write or overwrite.',
      },
      content: {
        type: 'STRING',
        description: 'Text or code content to write to the target file.',
      },
    },
    required: ['path', 'content'],
  },
};

export const SYSTEM_DIAGNOSTICS_SCHEMA: ToolFunctionDeclaration = {
  name: 'system_diagnostics',
  description: 'Retrieves active system resource metrics, memory usage, CRT status, and hardware diagnostic logs.',
  parameters: {
    type: 'OBJECT',
    properties: {},
    required: [],
  },
};

export const EXPORT_VAULT_BACKUP_SCHEMA: ToolFunctionDeclaration = {
  name: 'export_vault_backup',
  description: 'Triggers a zero-knowledge export and file download of Possibilities memory vault to a local .vault file.',
  parameters: {
    type: 'OBJECT',
    properties: {
      reasoning: {
        type: 'STRING',
        description: 'Creator request or automated backup rationale.',
      },
    },
    required: ['reasoning'],
  },
};

export const POSSIBILITIES_SYSTEM_TOOLS: ToolFunctionDeclaration[] = [
  EXECUTE_SHELL_COMMAND_SCHEMA,
  READ_FILE_SCHEMA,
  WRITE_FILE_SCHEMA,
  SYSTEM_DIAGNOSTICS_SCHEMA,
  EXPORT_VAULT_BACKUP_SCHEMA,
];
