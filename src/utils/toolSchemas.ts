// Possibilities Gemini Tool Schemas & Definitions
// Declares function tools for the reasoning engine (propose_core_memory_update, propose_file_write)

export const POSSIBILITIES_TOOL_SCHEMAS = [
  {
    name: "propose_core_memory_update",
    description: "Proposes an update, addition, or removal to Possibilities Core Memory. Requires user approval.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["add", "update", "delete"] },
        key: { type: "string", description: "The memory key/tag" },
        content: { type: "string", description: "The exact memory text to store" },
        reasoning: { type: "string", description: "Why this core memory change is being proposed" }
      },
      required: ["action", "key", "content", "reasoning"]
    }
  },
  {
    name: "propose_file_write",
    description: "Proposes writing or updating a code/config file in the shell environment. Requires user approval.",
    parameters: {
      type: "object",
      properties: {
        file_path: { type: "string", description: "Relative or absolute path to target file" },
        content: { type: "string", description: "Full file content to write" },
        reasoning: { type: "string", description: "Purpose of this modification" }
      },
      required: ["file_path", "content", "reasoning"]
    }
  }
];

export const GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: "propose_core_memory_update",
    description: "Proposes an update, addition, or removal to Possibilities Core Memory. Requires user approval.",
    parameters: {
      type: "OBJECT",
      properties: {
        action: { type: "STRING", enum: ["add", "update", "delete"] },
        key: { type: "STRING", description: "The memory key/tag" },
        content: { type: "STRING", description: "The exact memory text to store" },
        reasoning: { type: "STRING", description: "Why this core memory change is being proposed" }
      },
      required: ["action", "key", "content", "reasoning"]
    }
  },
  {
    name: "propose_file_write",
    description: "Proposes writing or updating a code/config file in the shell environment. Requires user approval.",
    parameters: {
      type: "OBJECT",
      properties: {
        file_path: { type: "STRING", description: "Relative or absolute path to target file" },
        content: { type: "STRING", description: "Full file content to write" },
        reasoning: { type: "STRING", description: "Purpose of this modification" }
      },
      required: ["file_path", "content", "reasoning"]
    }
  }
];
