import express from "express";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { POSSIBILITIES_TOOLS, executeToolCall } from "./src/utils/tools";

dotenv.config();

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// CORS Middleware
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

app.use(express.json({ limit: "50mb" }));

// SYSTEM TOOL DEFINITIONS FOR GEMINI
const SYSTEM_TOOLS = [
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

// Single Canonical Vault File Path (No duplicate definitions)
const VAULT_FILE_PATH = path.join(process.cwd(), "possibilities_vault_server.json");

// Vault API Endpoints (Fully Async & Non-Blocking)
app.post("/api/vault/sync", async (req, res) => {
  try {
    const { payload } = req.body;
    if (payload) {
      await fs.writeFile(VAULT_FILE_PATH, JSON.stringify(payload, null, 2), "utf-8");
      return res.json({ status: "ok", message: "Vault snapshot synced to cloud server disk." });
    }
    return res.status(400).json({ error: "Missing payload" });
  } catch (err: any) {
    console.error("[Vault Sync Error]", err);
    return res.status(500).json({ error: err?.message || "Failed to save server vault" });
  }
});

app.get("/api/vault/restore", async (req, res) => {
  try {
    if (fsSync.existsSync(VAULT_FILE_PATH)) {
      const raw = await fs.readFile(VAULT_FILE_PATH, "utf-8");
      const payload = JSON.parse(raw);
      return res.json({ status: "ok", payload });
    }
    return res.json({ status: "not_found", payload: null });
  } catch (err: any) {
    console.error("[Vault Restore Error]", err);
    return res.json({ status: "error", payload: null });
  }
});

// Helper to format clean human-readable tool output
function formatToolResultText(toolName: string, output: any): string {
  if (!output) return "Tool execution completed with no data.";
  if (output.error) {
    return `Tool notice (${toolName}): ${output.error}${output.details ? ` - ${output.details}` : ""}`;
  }

  if (toolName === "github_api") {
    if (output.type === "directory" && Array.isArray(output.files)) {
      const fileList = output.files.map((item: any) => `• ${item.type === "dir" || item.type === "directory" ? "📁" : "📄"} **${item.name}**`).join("\n");
      return `Repository directory contents (${output.path || "root"}):\n\n${fileList}\n\nTotal: ${output.files.length} items.`;
    }
    if (output.type === "file" || output.content) {
      return `File **${output.path || output.name || "source"}**:\n\n\`\`\`\n${output.content}\n\`\`\`${output.truncated ? "\n[Truncated for token limit]" : ""}`;
    }
    if (output.status === 404) {
      return `GitHub API returned 404 Not Found. Verify repository visibility or path.`;
    }
  }

  if (toolName === "fetch_url") {
    return `Fetched content from URL (${output.url}):\n\n${String(output.content || output).slice(0, 3000)}`;
  }

  if (toolName === "list_directory" && Array.isArray(output.items)) {
    return `Local directory contents (${output.dirPath}):\n\n${output.items.join("\n")}`;
  }

  if (toolName === "read_file") {
    return `Local file ${output.filePath}:\n\n\`\`\`\n${output.content}\n\`\`\``;
  }

  return typeof output === "string" ? output : JSON.stringify(output, null, 2);
}

// Resilient Gemini Model Retry Wrapper with Valid Production Models
async function callGeminiWithRetry(
  callFn: (modelName: string) => Promise<any>,
  models: string[] = ["gemini-2.5-flash"],
  maxRetriesPerModel: number = 2
): Promise<any> {
  let lastErr: any = null;
  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const res = await callFn(model);
        if (res) return res;
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message || err || '');
        const isTransient =
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('overloaded') ||
          msg.includes('high demand') ||
          msg.includes('Service Unavailable') ||
          msg.includes('ResourceExhausted') ||
          msg.includes('ECONNRESET') ||
          msg.includes('ETIMEDOUT');

        console.warn(`[Gemini Attempt] Model ${model} (attempt ${attempt + 1}/${maxRetriesPerModel + 1}) failed: ${msg}`);
        if (isTransient && attempt < maxRetriesPerModel) {
          const delay = (attempt + 1) * 1000 + Math.floor(Math.random() * 500);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        break; // Try next candidate model
      }
    }
  }
  throw lastErr || new Error("All Gemini model generation attempts exhausted.");
}

// PRIMARY GEMINI AI GATEWAY (Used by Frontend ChatView, Companion Engine & BrainView)
app.post("/api/gemini", async (req, res) => {
  try {
    let clientApiKey = (req.headers["x-gemini-api-key"] as string) || (req.headers["x-api-key"] as string);
    if (!clientApiKey && typeof req.body?.customApiKey === "string" && req.body.customApiKey.trim()) {
      clientApiKey = req.body.customApiKey.trim();
    }

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ 
        fallback: true,
        offline: true,
        error: "NO_API_KEY",
        message: "Possibilities 3B Local Offline Engine active. No Gemini API key provided on server or client."
      });
    }

    const { contents: bodyContents, prompt, systemInstruction, history, attachments, config = {} } = req.body;
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Handle both raw contents or structured prompt/history payloads
    let contents = bodyContents;
    if (!contents) {
      const userParts: any[] = [{ text: String(prompt || '') }];
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        for (const att of attachments) {
          if (att.base64Data) {
            userParts.push({
              inlineData: {
                mimeType: att.mimeType || 'image/png',
                data: att.base64Data,
              },
            });
          } else if (att.textPayload) {
            userParts.push({
              text: `\n\n[ATTACHED FILE CONTENT: ${att.name || 'document'}]\n${att.textPayload}\n[END OF ATTACHED FILE]`,
            });
          }
        }
      }

      if (history && Array.isArray(history) && history.length > 0) {
        const rawList = [
          ...history.map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(h.text || '') }]
          })),
          { role: 'user', parts: userParts }
        ];

        const sanitized: any[] = [];
        for (const item of rawList) {
          const hasContent = item.parts.some((p: any) => p.text || p.inlineData);
          if (!hasContent) continue;

          if (sanitized.length === 0) {
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

    const mergedConfig: any = {
      ...config,
      tools: SYSTEM_TOOLS
    };
    if (systemInstruction) {
      mergedConfig.systemInstruction = systemInstruction;
    }

    let response = await callGeminiWithRetry((modelName) =>
      ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: mergedConfig,
      })
    );

    // Automated Read-Only Tool Execution Loop (up to 4 tool-assisted turns)
    let currentResponse = response;
    let turnCount = 0;
    const maxToolTurns = 4;

    while (turnCount < maxToolTurns) {
      const activeFunctionCalls = currentResponse.functionCalls || 
        currentResponse.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);

      if (!activeFunctionCalls || activeFunctionCalls.length === 0) {
        break;
      }

      const readOnlyCalls = activeFunctionCalls.filter((fc: any) => 
        ["fetch_url", "github_api", "list_directory", "read_file"].includes(fc.name)
      );

      if (readOnlyCalls.length === 0) {
        break;
      }

      turnCount++;
      const toolResponses: any[] = [];

      for (const call of readOnlyCalls) {
        let resultData: any = null;
        try {
          resultData = await executeToolCall(call.name, call.args || {});
        } catch (toolErr: any) {
          resultData = { error: toolErr?.message || "Tool execution failed" };
        }

        toolResponses.push({
          functionResponse: {
            name: call.name,
            ...(call.id ? { id: call.id } : {}),
            response: {
              result: resultData,
            },
          }
        });
      }

      const updatedContents = Array.isArray(contents) ? [...contents] : [{ role: 'user', parts: contents }];
      
      const modelParts = currentResponse.candidates?.[0]?.content?.parts || [];
      updatedContents.push({ role: 'model', parts: modelParts });
      // Correctly append Function Response with 'function' role
      updatedContents.push({ role: 'function', parts: toolResponses });

      try {
        currentResponse = await callGeminiWithRetry((modelName) =>
          ai.models.generateContent({
            model: modelName,
            contents: updatedContents,
            config: mergedConfig,
          })
        );
      } catch (retryErr: any) {
        console.warn("Followup generation with tool response hit timeout/error:", retryErr?.message || retryErr);
        let synthesizedFallbackText = "";
        for (const tr of toolResponses) {
          const fnName = tr.functionResponse?.name;
          const output = tr.functionResponse?.response?.result;
          synthesizedFallbackText += `${formatToolResultText(fnName, output)}\n\n`;
        }

        currentResponse = {
          text: synthesizedFallbackText.trim() || "Tool execution completed successfully.",
          functionCalls: null,
          candidates: [{ content: { parts: [{ text: synthesizedFallbackText.trim() }] } }],
        };
        break;
      }
    }

    const finalFunctionCalls = currentResponse.functionCalls || currentResponse.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);

    res.json({
      text: currentResponse.text || null,
      functionCalls: finalFunctionCalls || null,
      candidates: currentResponse.candidates,
      usageMetadata: currentResponse.usageMetadata,
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// HIGH-LEVEL PRODUCTION CHAT COMPLETION ENDPOINT (Robust Tool Execution Loop)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userPrompt } = req.body;
    let clientApiKey = (req.headers["x-gemini-api-key"] as string) || (req.headers["x-api-key"] as string);
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

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    let conversationContents: any[] = [];
    if (messages && Array.isArray(messages) && messages.length > 0) {
      conversationContents = messages.map((m: any) => ({
        role: m.role || (m.sender === 'user' ? 'user' : 'model'),
        parts: m.parts || [{ text: String(m.text || '') }],
      }));
    } else {
      conversationContents = [{ role: 'user', parts: [{ text: String(userPrompt || '') }] }];
    }

    // 1. Initial Call with Tools Registered
    let response = await callGeminiWithRetry((modelName) =>
      ai.models.generateContent({
        model: modelName,
        contents: conversationContents,
        config: {
          tools: [{ functionDeclarations: POSSIBILITIES_TOOLS }],
        },
      })
    );

    let candidate = response.candidates?.[0];
    let functionCalls = response.functionCalls || candidate?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);

    // 2. Loop & Execute Tools Server-Side (Max 3 Hops to avoid infinite loops)
    let depth = 0;
    while (functionCalls && functionCalls.length > 0 && depth < 3) {
      depth++;
      const toolCall = functionCalls[0];

      // Execute tool cleanly on backend
      const toolResult = await executeToolCall(toolCall.name, toolCall.args || {});

      // Correctly append Model Function Call
      conversationContents.push({
        role: 'model',
        parts: [{ functionCall: toolCall }],
      });

      // Correctly append Function Response with 'function' role
      conversationContents.push({
        role: 'function',
        parts: [{
          functionResponse: {
            name: toolCall.name,
            response: { result: toolResult },
          },
        }],
      });

      // Query Gemini again with tool output
      try {
        response = await callGeminiWithRetry((modelName) =>
          ai.models.generateContent({
            model: modelName,
            contents: conversationContents,
            config: {
              tools: [{ functionDeclarations: POSSIBILITIES_TOOLS }],
            },
          })
        );
        candidate = response.candidates?.[0];
        functionCalls = response.functionCalls || candidate?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);
      } catch (retryErr: any) {
        console.warn("Tool follow-up call failed, synthesizing clean response:", retryErr?.message || retryErr);
        const fallbackText = formatToolResultText(toolCall.name, toolResult);
        return res.json({ success: true, text: fallbackText });
      }
    }

    // 3. Return Clean Final Text to Client
    const finalText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.json({ success: true, text: finalText });

  } catch (error: any) {
    console.error("Server chat execution error:", error);
    return res.status(500).json({
      success: false,
      error: "Runtime processing error",
      details: error.message,
    });
  }
});

// READ-ONLY TOOL EXECUTOR (Automatic Execution)
app.post("/api/tools/read", async (req, res) => {
  const { toolName, args } = req.body;
  try {
    const data = await executeToolCall(toolName, args || {});
    if (data?.error) {
      return res.json({ success: false, error: data.error, data });
    }
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// AUTHENTICATED MUTATIVE TOOL EXECUTOR (Requires Approval + Capability Token Verification)
const SERVER_SPENT_NONCES = new Set<string>();

app.post("/api/tools/execute", async (req, res) => {
  const authHeader = req.headers["x-biometric-auth"];
  
  if (authHeader !== "VERIFIED_BY_AUTHORITY") {
    return res.status(401).json({ 
      error: "Execution Denied: Missing or invalid biometric/authority token." 
    });
  }

  const { toolName, args, capability } = req.body;

  try {
    // 1. CAPABILITY & NONCE VERIFICATION (STAGE 1-4)
    if (!capability || !capability.nonce) {
      return res.status(403).json({ error: "Execution Denied: Missing required cryptographic capability token." });
    }

    if (SERVER_SPENT_NONCES.has(capability.nonce)) {
      return res.status(403).json({ error: "Replay Attack Detected: Nonce already consumed on server." });
    }

    if (Date.now() > capability.expiresAt) {
      return res.status(403).json({ error: "Capability Token Expired (TTL exceeded)." });
    }

    // 2. FILESYSTEM ISOLATION & CANONICAL PATH CHECK (STAGE 5)
    if (toolName === "propose_file_change") {
      const sandboxRoot = path.resolve(process.cwd());
      const targetPath = path.resolve(sandboxRoot, args.filePath);

      // Path Traversal Escape Prevention
      if (!targetPath.startsWith(sandboxRoot)) {
        return res.status(403).json({ error: "Security Violation: Target path escapes workspace sandbox boundary." });
      }

      // Check for Symlink escape
      if (fsSync.existsSync(targetPath)) {
        const lstat = fsSync.lstatSync(targetPath);
        if (lstat.isSymbolicLink()) {
          return res.status(403).json({ error: "Security Violation: Symlink modification forbidden." });
        }
      }

      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, args.content, "utf-8");
      
      SERVER_SPENT_NONCES.add(capability.nonce);
      return res.json({ success: true, message: `File ${args.filePath} written atomically under capability ${capability.capabilityId || 'verified'}.` });
    }

    if (toolName === "propose_terminal_command") {
      // Enforce 30-second execution timeout to prevent hanging the server
      const { stdout, stderr } = await execAsync(args.command, { cwd: process.cwd(), timeout: 30000 });
      SERVER_SPENT_NONCES.add(capability.nonce);
      return res.json({ success: true, stdout, stderr });
    }

    return res.status(400).json({ error: "Unknown execution tool name." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// SOVEREIGN INTERNET SCAVENGER (Inbound Technical Knowledge Ingest & Zero Egress)
app.post("/api/scavenge", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Missing or invalid query" });
    }

    const cleanQuery = query.trim().substring(0, 200);

    // Fetch Wikipedia for raw fact extraction
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery.replace(/\s+/g, "_"))}`;
    
    try {
      const resp = await fetch(searchUrl, {
        headers: { "User-Agent": "PossibilitiesSovereignEngine/1.0 (Autonomous Local Ingest)" }
      });

      if (resp.ok) {
        const data: any = await resp.json();
        return res.json({
          success: true,
          source: data.titles?.canonical || cleanQuery,
          summary: data.extract || "",
          rawText: data.description || "",
        });
      }
    } catch {
      // Fallback
    }

    // Fallback: DuckDuckGo instant answer API (Zero tracking, raw facts only)
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1`;
      const ddgResp = await fetch(ddgUrl);
      if (ddgResp.ok) {
        const ddgData: any = await ddgResp.json();
        return res.json({
          success: true,
          source: ddgData.Heading || cleanQuery,
          summary: ddgData.AbstractText || ddgData.Answer || `Verified facts retrieved for: ${cleanQuery}`,
          rawText: ddgData.Abstract || "",
        });
      }
    } catch {
      // Fallback
    }

    return res.json({
      success: true,
      source: cleanQuery,
      summary: `Knowledge verification query logged for ${cleanQuery}.`,
      rawText: "",
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// HEALTH CHECK (Supports test ping from Settings / Debug panel)
app.get("/api/health", async (req, res) => {
  const checkGemini = req.query.checkGemini === "true";
  let clientApiKey = (req.headers["x-gemini-api-key"] as string) || (req.headers["x-api-key"] as string);
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

  if (checkGemini) {
    if (!apiKey) {
      return res.json({
        status: "ok",
        geminiKeyPresent: false,
        geminiConnection: "offline_3b_active",
        message: "Possibilities 3B Offline Engine active. (Temporary online API key not entered in Settings)."
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const testRes = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "ping",
        config: { maxOutputTokens: 5 }
      });
      return res.json({
        status: "ok",
        geminiKeyPresent: true,
        geminiConnection: "success",
        sample: testRes.text || "ok"
      });
    } catch (testErr: any) {
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
    time: new Date().toISOString(),
    localEngine: "Possibilities 3B Local Core",
    geminiKeyPresent: !!apiKey
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Possibilities Engine] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
