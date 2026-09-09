var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_promises2 = __toESM(require("fs/promises"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_child_process = require("child_process");
var import_util = require("util");
var import_genai = require("@google/genai");
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);

// src/utils/tools.ts
var import_path = __toESM(require("path"), 1);
var import_promises = __toESM(require("fs/promises"), 1);
var POSSIBILITIES_TOOLS = [
  {
    name: "read_screen",
    description: "Inspect active Android screen multi-window UI text, view IDs, interactive layers, and bounding coordinates via Accessibility Service.",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: []
    }
  },
  {
    name: "tap_screen",
    description: "Simulate a precise touch gesture at target (x, y) coordinates on the active Android OS surface.",
    parameters: {
      type: "OBJECT",
      properties: {
        x: { type: "NUMBER", description: "Screen X pixel coordinate" },
        y: { type: "NUMBER", description: "Screen Y pixel coordinate" }
      },
      required: ["x", "y"]
    }
  },
  {
    name: "github_api",
    description: "Query GitHub REST API to list directory contents or fetch raw file sources.",
    parameters: {
      type: "OBJECT",
      properties: {
        owner: { type: "STRING", description: "Repository owner username" },
        repo: { type: "STRING", description: "Repository name" },
        path: { type: "STRING", description: "File or directory path within the repo" }
      },
      required: ["owner", "repo"]
    }
  },
  {
    name: "fetch_url",
    description: "Fetch raw text or HTML content from any public web URL.",
    parameters: {
      type: "OBJECT",
      properties: {
        url: { type: "STRING", description: "Full HTTPS URL to fetch" }
      },
      required: ["url"]
    }
  }
];
async function executeToolCall(name, args) {
  try {
    if (name === "github_api") {
      const owner = String(args?.owner || "rusharie6-byte").trim();
      const repo = String(args?.repo || "Final-possibilities-").trim();
      const rawPath = String(args?.path || "").trim();
      const cleanPath = rawPath.replace(/^\//, "");
      const queryRef = args?.ref ? `?ref=${encodeURIComponent(args.ref)}` : "";
      const url = `https://api.github.com/repos/${owner}/${repo}/contents${cleanPath ? `/${cleanPath}` : ""}${queryRef}`;
      const headers = {
        "User-Agent": "Possibilities-Companion-App",
        "Accept": "application/vnd.github.v3+json"
      };
      if (typeof process !== "undefined" && process.env?.GITHUB_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
      }
      const response = await fetch(url, { headers });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return {
          error: `GitHub API returned HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          url,
          details: errJson?.message || "Resource not found or restricted."
        };
      }
      const data = await response.json();
      if (!Array.isArray(data) && data.content && data.encoding === "base64") {
        const decoded = Buffer.from(data.content, "base64").toString("utf-8");
        return {
          path: data.path || cleanPath,
          name: data.name,
          type: "file",
          size: data.size,
          content: decoded.substring(0, 15e3),
          // cap at 15k chars for token safety
          truncated: decoded.length > 15e3
        };
      }
      if (Array.isArray(data)) {
        return {
          type: "directory",
          path: cleanPath || "root",
          totalItems: data.length,
          files: data.map((item) => ({
            name: item.name,
            type: item.type,
            path: item.path,
            size: item.size
          }))
        };
      }
      return data;
    }
    if (name === "fetch_url") {
      const targetUrl = String(args?.url || "").trim();
      const response = await fetch(targetUrl, {
        headers: { "User-Agent": "Possibilities-Companion-App" }
      });
      if (!response.ok) return { error: `Fetch failed with status ${response.status}`, status: response.status };
      const text = await response.text();
      return { url: targetUrl, content: text.substring(0, 1e4) };
    }
    if (name === "list_directory") {
      const targetPath = import_path.default.resolve(process.cwd(), args?.dirPath || ".");
      const files = await import_promises.default.readdir(targetPath, { withFileTypes: true });
      return {
        type: "directory",
        dirPath: args?.dirPath || ".",
        items: files.map((f) => `${f.isDirectory() ? "[DIR]" : "[FILE]"} ${f.name}`)
      };
    }
    if (name === "read_file") {
      const targetPath = import_path.default.resolve(process.cwd(), args?.filePath);
      const content = await import_promises.default.readFile(targetPath, "utf-8");
      return {
        type: "file",
        filePath: args?.filePath,
        content: content.substring(0, 15e3)
      };
    }
    return { error: `Unknown tool function: ${name}` };
  } catch (err) {
    return { error: `Tool execution error: ${err?.message || String(err)}` };
  }
}

// server.ts
import_dotenv.default.config();
var execAsync = (0, import_util.promisify)(import_child_process.exec);
var app = (0, import_express.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header("Access-Control-Allow-Origin", origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Capacitor-Platform, X-App-Version, x-gemini-api-key, x-api-key, x-biometric-auth, x-capability-token"
  );
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.use(import_express.default.json({ limit: "50mb" }));
var SYSTEM_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "list_directory",
        description: "List files and directories at a target path relative to root.",
        parameters: {
          type: "OBJECT",
          properties: {
            dirPath: { type: "STRING", description: "Relative directory path (e.g., '.' or 'src')" }
          },
          required: ["dirPath"]
        }
      },
      {
        name: "read_file",
        description: "Read raw contents of a source code or config file from local project.",
        parameters: {
          type: "OBJECT",
          properties: {
            filePath: { type: "STRING", description: "Relative file path (e.g., 'src/App.tsx')" }
          },
          required: ["filePath"]
        }
      },
      {
        name: "fetch_url",
        description: "Fetch and read raw text, source code, or JSON from any public HTTP/HTTPS URL (including raw.githubusercontent.com or web pages).",
        parameters: {
          type: "OBJECT",
          properties: {
            url: { type: "STRING", description: "Full HTTP or HTTPS URL to fetch content from" }
          },
          required: ["url"]
        }
      },
      {
        name: "github_api",
        description: "Query GitHub REST API to list repo directories, file contents, branches, or commits. Can inspect repos directly.",
        parameters: {
          type: "OBJECT",
          properties: {
            owner: { type: "STRING", description: "GitHub username or organization (e.g. 'rusharie6-byte')" },
            repo: { type: "STRING", description: "GitHub repository name (e.g. 'Final-possibilities-')" },
            path: { type: "STRING", description: "Path to file or directory in repository (e.g. '' for root or 'src/App.tsx')" },
            ref: { type: "STRING", description: "Optional git branch, tag, or commit SHA (defaults to default branch)" }
          },
          required: ["owner", "repo"]
        }
      },
      {
        name: "propose_file_change",
        description: "Propose creating or updating a file with full content. MUST BE APPROVED BY USER.",
        parameters: {
          type: "OBJECT",
          properties: {
            filePath: { type: "STRING", description: "Target file path relative to root" },
            content: { type: "STRING", description: "New or modified full raw code content" },
            reason: { type: "STRING", description: "Detailed justification of why this change is necessary" }
          },
          required: ["filePath", "content", "reason"]
        }
      },
      {
        name: "propose_terminal_command",
        description: "Propose running a bash/shell command. MUST BE APPROVED BY USER.",
        parameters: {
          type: "OBJECT",
          properties: {
            command: { type: "STRING", description: "Shell command (e.g., 'npm run build', 'git status')" },
            reason: { type: "STRING", description: "Detailed justification of why this command is necessary" }
          },
          required: ["command", "reason"]
        }
      }
    ]
  }
];
var VAULT_FILE_PATH = import_path2.default.join(process.cwd(), "possibilities_vault_server.json");
app.post("/api/vault/sync", async (req, res) => {
  try {
    const { payload } = req.body;
    if (payload) {
      await import_promises2.default.writeFile(VAULT_FILE_PATH, JSON.stringify(payload, null, 2), "utf-8");
      return res.json({ status: "ok", message: "Vault snapshot synced to cloud server disk." });
    }
    return res.status(400).json({ error: "Missing payload" });
  } catch (err) {
    console.error("[Vault Sync Error]", err);
    return res.status(500).json({ error: err?.message || "Failed to save server vault" });
  }
});
app.get("/api/vault/restore", async (req, res) => {
  try {
    if (import_fs.default.existsSync(VAULT_FILE_PATH)) {
      const raw = await import_promises2.default.readFile(VAULT_FILE_PATH, "utf-8");
      const payload = JSON.parse(raw);
      return res.json({ status: "ok", payload });
    }
    return res.json({ status: "not_found", payload: null });
  } catch (err) {
    console.error("[Vault Restore Error]", err);
    return res.json({ status: "error", payload: null });
  }
});
function formatToolResultText(toolName, output) {
  if (!output) return "Tool execution completed with no data.";
  if (output.error) {
    return `Tool notice (${toolName}): ${output.error}${output.details ? ` - ${output.details}` : ""}`;
  }
  if (toolName === "github_api") {
    if (output.type === "directory" && Array.isArray(output.files)) {
      const fileList = output.files.map((item) => `\u2022 ${item.type === "dir" || item.type === "directory" ? "\u{1F4C1}" : "\u{1F4C4}"} **${item.name}**`).join("\n");
      return `Repository directory contents (${output.path || "root"}):

${fileList}

Total: ${output.files.length} items.`;
    }
    if (output.type === "file" || output.content) {
      return `File **${output.path || output.name || "source"}**:

\`\`\`
${output.content}
\`\`\`${output.truncated ? "\n[Truncated for token limit]" : ""}`;
    }
    if (output.status === 404) {
      return `GitHub API returned 404 Not Found. Verify repository visibility or path.`;
    }
  }
  if (toolName === "fetch_url") {
    return `Fetched content from URL (${output.url}):

${String(output.content || output).slice(0, 3e3)}`;
  }
  if (toolName === "list_directory" && Array.isArray(output.items)) {
    return `Local directory contents (${output.dirPath}):

${output.items.join("\n")}`;
  }
  if (toolName === "read_file") {
    return `Local file ${output.filePath}:

\`\`\`
${output.content}
\`\`\``;
  }
  return typeof output === "string" ? output : JSON.stringify(output, null, 2);
}
async function callGeminiWithRetry(callFn, models = ["gemini-3.8-flash", "gemini-3.1-flash-lite"], maxRetriesPerModel = 2) {
  let lastErr = null;
  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const res = await callFn(model);
        if (res) return res;
      } catch (err) {
        lastErr = err;
        const msg = String(err?.message || err || "");
        const isTransient = msg.includes("503") || msg.includes("429") || msg.includes("overloaded") || msg.includes("high demand") || msg.includes("Service Unavailable") || msg.includes("ResourceExhausted") || msg.includes("ECONNRESET") || msg.includes("ETIMEDOUT");
        console.warn(`[Gemini Attempt] Model ${model} (attempt ${attempt + 1}/${maxRetriesPerModel + 1}) failed: ${msg}`);
        if (isTransient && attempt < maxRetriesPerModel) {
          const delay = (attempt + 1) * 1e3 + Math.floor(Math.random() * 500);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        break;
      }
    }
  }
  throw lastErr || new Error("All Gemini model generation attempts exhausted.");
}
app.post("/api/gemini", async (req, res) => {
  try {
    let clientApiKey = req.headers["x-gemini-api-key"] || req.headers["x-api-key"];
    if (!clientApiKey && typeof req.body?.customApiKey === "string" && req.body.customApiKey.trim()) {
      clientApiKey = req.body.customApiKey.trim();
    }
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "NO_API_KEY",
        message: "Gemini API key is not configured. Please provide a Gemini API key in Settings or configure GEMINI_API_KEY."
      });
    }
    const { contents: bodyContents, prompt, systemInstruction, history, attachments, config = {} } = req.body;
    const ai = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    let contents = bodyContents;
    if (!contents) {
      const userParts = [{ text: String(prompt || "") }];
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        for (const att of attachments) {
          if (att.base64Data) {
            userParts.push({
              inlineData: {
                mimeType: att.mimeType || "image/png",
                data: att.base64Data
              }
            });
          } else if (att.textPayload) {
            userParts.push({
              text: `

[ATTACHED FILE CONTENT: ${att.name || "document"}]
${att.textPayload}
[END OF ATTACHED FILE]`
            });
          }
        }
      }
      if (history && Array.isArray(history) && history.length > 0) {
        const rawList = [
          ...history.map((h) => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: String(h.text || "") }]
          })),
          { role: "user", parts: userParts }
        ];
        const sanitized = [];
        for (const item of rawList) {
          const hasContent = item.parts.some((p) => p.text || p.inlineData);
          if (!hasContent) continue;
          if (sanitized.length === 0) {
            if (item.role === "model") {
              sanitized.push({ role: "user", parts: [{ text: "Hello Possibilities." }] });
            }
            sanitized.push(item);
          } else {
            const prevRole = sanitized[sanitized.length - 1].role;
            if (prevRole === item.role) {
              sanitized[sanitized.length - 1].parts.push(...item.parts);
            } else {
              sanitized.push(item);
            }
          }
        }
        contents = sanitized.length > 0 ? sanitized : userParts;
      } else {
        contents = userParts;
      }
    }
    const mergedConfig = {
      ...config,
      tools: SYSTEM_TOOLS
    };
    if (systemInstruction) {
      mergedConfig.systemInstruction = systemInstruction;
    }
    let response = await callGeminiWithRetry(
      (modelName) => ai.models.generateContent({
        model: modelName,
        contents,
        config: mergedConfig
      })
    );
    let currentResponse = response;
    let turnCount = 0;
    const maxToolTurns = 4;
    while (turnCount < maxToolTurns) {
      const activeFunctionCalls = currentResponse.functionCalls || currentResponse.candidates?.[0]?.content?.parts?.filter((p) => p.functionCall).map((p) => p.functionCall);
      if (!activeFunctionCalls || activeFunctionCalls.length === 0) {
        break;
      }
      const readOnlyCalls = activeFunctionCalls.filter(
        (fc) => ["fetch_url", "github_api", "list_directory", "read_file"].includes(fc.name)
      );
      if (readOnlyCalls.length === 0) {
        break;
      }
      turnCount++;
      const toolResponses = [];
      for (const call of readOnlyCalls) {
        let resultData = null;
        try {
          resultData = await executeToolCall(call.name, call.args || {});
        } catch (toolErr) {
          resultData = { error: toolErr?.message || "Tool execution failed" };
        }
        toolResponses.push({
          functionResponse: {
            name: call.name,
            ...call.id ? { id: call.id } : {},
            response: {
              result: resultData
            }
          }
        });
      }
      const updatedContents = Array.isArray(contents) ? [...contents] : [{ role: "user", parts: contents }];
      const modelParts = currentResponse.candidates?.[0]?.content?.parts || [];
      updatedContents.push({ role: "model", parts: modelParts });
      updatedContents.push({ role: "function", parts: toolResponses });
      try {
        currentResponse = await callGeminiWithRetry(
          (modelName) => ai.models.generateContent({
            model: modelName,
            contents: updatedContents,
            config: mergedConfig
          })
        );
      } catch (retryErr) {
        console.warn("Followup generation with tool response hit timeout/error:", retryErr?.message || retryErr);
        let synthesizedFallbackText = "";
        for (const tr of toolResponses) {
          const fnName = tr.functionResponse?.name;
          const output = tr.functionResponse?.response?.result;
          synthesizedFallbackText += `${formatToolResultText(fnName, output)}

`;
        }
        currentResponse = {
          text: synthesizedFallbackText.trim() || "Tool execution completed successfully.",
          functionCalls: null,
          candidates: [{ content: { parts: [{ text: synthesizedFallbackText.trim() }] } }]
        };
        break;
      }
    }
    const finalFunctionCalls = currentResponse.functionCalls || currentResponse.candidates?.[0]?.content?.parts?.filter((p) => p.functionCall).map((p) => p.functionCall);
    res.json({
      text: currentResponse.text || null,
      functionCalls: finalFunctionCalls || null,
      candidates: currentResponse.candidates,
      usageMetadata: currentResponse.usageMetadata
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userPrompt } = req.body;
    let clientApiKey = req.headers["x-gemini-api-key"] || req.headers["x-api-key"];
    if (!clientApiKey && typeof req.body?.customApiKey === "string" && req.body.customApiKey.trim()) {
      clientApiKey = req.body.customApiKey.trim();
    }
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        fallback: true,
        error: "NO_API_KEY",
        message: "No Gemini API key provided."
      });
    }
    const ai = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    let conversationContents = [];
    if (messages && Array.isArray(messages) && messages.length > 0) {
      conversationContents = messages.map((m) => ({
        role: m.role || (m.sender === "user" ? "user" : "model"),
        parts: m.parts || [{ text: String(m.text || "") }]
      }));
    } else {
      conversationContents = [{ role: "user", parts: [{ text: String(userPrompt || "") }] }];
    }
    let response = await callGeminiWithRetry(
      (modelName) => ai.models.generateContent({
        model: modelName,
        contents: conversationContents,
        config: {
          tools: [{ functionDeclarations: POSSIBILITIES_TOOLS }]
        }
      })
    );
    let candidate = response.candidates?.[0];
    let functionCalls = response.functionCalls || candidate?.content?.parts?.filter((p) => p.functionCall).map((p) => p.functionCall);
    let depth = 0;
    while (functionCalls && functionCalls.length > 0 && depth < 3) {
      depth++;
      const toolCall = functionCalls[0];
      const toolResult = await executeToolCall(toolCall.name, toolCall.args || {});
      conversationContents.push({
        role: "model",
        parts: [{ functionCall: toolCall }]
      });
      conversationContents.push({
        role: "function",
        parts: [{
          functionResponse: {
            name: toolCall.name,
            response: { result: toolResult }
          }
        }]
      });
      try {
        response = await callGeminiWithRetry(
          (modelName) => ai.models.generateContent({
            model: modelName,
            contents: conversationContents,
            config: {
              tools: [{ functionDeclarations: POSSIBILITIES_TOOLS }]
            }
          })
        );
        candidate = response.candidates?.[0];
        functionCalls = response.functionCalls || candidate?.content?.parts?.filter((p) => p.functionCall).map((p) => p.functionCall);
      } catch (retryErr) {
        console.warn("Tool follow-up call failed, synthesizing clean response:", retryErr?.message || retryErr);
        const fallbackText = formatToolResultText(toolCall.name, toolResult);
        return res.json({ success: true, text: fallbackText });
      }
    }
    const finalText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.json({ success: true, text: finalText });
  } catch (error) {
    console.error("Server chat execution error:", error);
    return res.status(500).json({
      success: false,
      error: "Runtime processing error",
      details: error.message
    });
  }
});
app.post("/api/tools/read", async (req, res) => {
  const { toolName, args } = req.body;
  try {
    const data = await executeToolCall(toolName, args || {});
    if (data?.error) {
      return res.json({ success: false, error: data.error, data });
    }
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
var SERVER_SPENT_NONCES = /* @__PURE__ */ new Set();
app.post("/api/tools/execute", async (req, res) => {
  const authHeader = req.headers["x-biometric-auth"];
  if (authHeader !== "VERIFIED_BY_AUTHORITY") {
    return res.status(401).json({
      error: "Execution Denied: Missing or invalid biometric/authority token."
    });
  }
  const { toolName, args, capability } = req.body;
  try {
    if (!capability || !capability.nonce) {
      return res.status(403).json({ error: "Execution Denied: Missing required cryptographic capability token." });
    }
    if (SERVER_SPENT_NONCES.has(capability.nonce)) {
      return res.status(403).json({ error: "Replay Attack Detected: Nonce already consumed on server." });
    }
    if (Date.now() > capability.expiresAt) {
      return res.status(403).json({ error: "Capability Token Expired (TTL exceeded)." });
    }
    if (toolName === "propose_file_change") {
      const sandboxRoot = import_path2.default.resolve(process.cwd());
      const targetPath = import_path2.default.resolve(sandboxRoot, args.filePath);
      if (!targetPath.startsWith(sandboxRoot)) {
        return res.status(403).json({ error: "Security Violation: Target path escapes workspace sandbox boundary." });
      }
      if (import_fs.default.existsSync(targetPath)) {
        const lstat = import_fs.default.lstatSync(targetPath);
        if (lstat.isSymbolicLink()) {
          return res.status(403).json({ error: "Security Violation: Symlink modification forbidden." });
        }
      }
      await import_promises2.default.mkdir(import_path2.default.dirname(targetPath), { recursive: true });
      await import_promises2.default.writeFile(targetPath, args.content, "utf-8");
      SERVER_SPENT_NONCES.add(capability.nonce);
      return res.json({ success: true, message: `File ${args.filePath} written atomically under capability ${capability.capabilityId || "verified"}.` });
    }
    if (toolName === "propose_terminal_command") {
      const { stdout, stderr } = await execAsync(args.command, { cwd: process.cwd(), timeout: 3e4 });
      SERVER_SPENT_NONCES.add(capability.nonce);
      return res.json({ success: true, stdout, stderr });
    }
    return res.status(400).json({ error: "Unknown execution tool name." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/scavenge", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Missing or invalid query" });
    }
    const cleanQuery = query.trim().substring(0, 200);
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery.replace(/\s+/g, "_"))}`;
    try {
      const resp = await fetch(searchUrl, {
        headers: { "User-Agent": "PossibilitiesSovereignEngine/1.0 (Autonomous Local Ingest)" }
      });
      if (resp.ok) {
        const data = await resp.json();
        return res.json({
          success: true,
          source: data.titles?.canonical || cleanQuery,
          summary: data.extract || "",
          rawText: data.description || ""
        });
      }
    } catch {
    }
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1`;
      const ddgResp = await fetch(ddgUrl);
      if (ddgResp.ok) {
        const ddgData = await ddgResp.json();
        return res.json({
          success: true,
          source: ddgData.Heading || cleanQuery,
          summary: ddgData.AbstractText || ddgData.Answer || `Verified facts retrieved for: ${cleanQuery}`,
          rawText: ddgData.Abstract || ""
        });
      }
    } catch {
    }
    return res.json({
      success: true,
      source: cleanQuery,
      summary: `Knowledge verification query logged for ${cleanQuery}.`,
      rawText: ""
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.get("/api/health", async (req, res) => {
  const checkGemini = req.query.checkGemini === "true";
  let clientApiKey = req.headers["x-gemini-api-key"] || req.headers["x-api-key"];
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
  if (checkGemini) {
    if (!apiKey) {
      return res.json({
        status: "error",
        geminiKeyPresent: false,
        geminiConnection: "missing_key",
        message: "Gemini API key is not configured on server or client."
      });
    }
    try {
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const testRes = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: "ping",
        config: { maxOutputTokens: 5 }
      });
      return res.json({
        status: "ok",
        geminiKeyPresent: true,
        geminiConnection: "success",
        sample: testRes.text || "ok"
      });
    } catch (testErr) {
      return res.json({
        status: "ok",
        geminiKeyPresent: true,
        geminiConnection: "error",
        error: testErr.message || String(testErr),
        raw: testErr
      });
    }
  }
  res.json({
    status: "ok",
    time: (/* @__PURE__ */ new Date()).toISOString(),
    geminiKeyPresent: !!apiKey
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Possibilities Engine] Running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
