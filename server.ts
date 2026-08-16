import express from "express";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

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
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Capacitor-Platform, X-App-Version, x-gemini-api-key, x-api-key, x-biometric-auth"
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
        description: "Read raw contents of a source code or config file.",
        parameters: {
          type: "OBJECT",
          properties: {
            filePath: { type: "STRING", description: "Relative file path (e.g., 'src/App.tsx')" }
          },
          required: ["filePath"]
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

// Cloud Memory Vault Storage Endpoints
const vaultFilePath = path.join(process.cwd(), "possibilities_vault_server.json");

app.post("/api/vault/sync", (req, res) => {
  try {
    const { payload } = req.body;
    if (payload) {
      fsSync.writeFileSync(vaultFilePath, JSON.stringify(payload, null, 2), "utf-8");
      console.log("[Vault API] Vault snapshot synced to server disk.");
      return res.json({ status: "ok", message: "Vault synced to cloud server disk." });
    }
    res.status(400).json({ error: "Missing payload" });
  } catch (err: any) {
    console.error("[Vault Sync Error]", err);
    res.status(500).json({ error: err?.message || "Failed to save server vault" });
  }
});

app.get("/api/vault/restore", (req, res) => {
  try {
    if (fsSync.existsSync(vaultFilePath)) {
      const raw = fsSync.readFileSync(vaultFilePath, "utf-8");
      const payload = JSON.parse(raw);
      console.log("[Vault API] Server vault snapshot restored for client.");
      return res.json({ status: "ok", payload });
    }
    res.json({ status: "not_found", payload: null });
  } catch (err: any) {
    console.error("[Vault Restore Error]", err);
    res.json({ status: "error", payload: null });
  }
});

// PRIMARY GEMINI AI GATEWAY
app.post("/api/gemini", async (req, res) => {
  try {
    let clientApiKey = req.headers["x-gemini-api-key"] as string || req.headers["x-api-key"] as string;
    if (!clientApiKey && typeof req.body?.customApiKey === "string" && req.body.customApiKey.trim()) {
      clientApiKey = req.body.customApiKey.trim();
    }

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "No Gemini API key provided." });
    }

    const { contents: bodyContents, prompt, systemInstruction, history, attachments, config = {} } = req.body;
    const ai = new GoogleGenAI({ apiKey });

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

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contents,
        config: mergedConfig,
      });
    } catch (firstErr: any) {
      console.warn("Primary model attempt failed, falling back to gemini-1.5-flash:", firstErr?.message);
      response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: contents,
        config: mergedConfig,
      });
    }

    const functionCalls = response.functionCalls || response.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);

    res.json({
      text: response.text || null,
      functionCalls: functionCalls || null,
      candidates: response.candidates,
      usageMetadata: response.usageMetadata,
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// READ-ONLY TOOL EXECUTOR (Automatic Execution)
app.post("/api/tools/read", async (req, res) => {
  const { toolName, args } = req.body;
  try {
    if (toolName === "list_directory") {
      const targetPath = path.resolve(process.cwd(), args?.dirPath || ".");
      const files = await fs.readdir(targetPath, { withFileTypes: true });
      const result = files.map(f => `${f.isDirectory() ? "[DIR]" : "[FILE]"} ${f.name}`);
      return res.json({ success: true, data: result });
    }

    if (toolName === "read_file") {
      const targetPath = path.resolve(process.cwd(), args.filePath);
      const content = await fs.readFile(targetPath, "utf-8");
      return res.json({ success: true, data: content });
    }

    return res.status(400).json({ error: "Invalid read tool or write tool attempted on read endpoint." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// AUTHENTICATED MUTATIVE TOOL EXECUTOR (Requires Approval + Auth Header)
app.post("/api/tools/execute", async (req, res) => {
  const authHeader = req.headers["x-biometric-auth"];
  
  if (authHeader !== "VERIFIED_BY_AUTHORITY") {
    return res.status(401).json({ 
      error: "Execution Denied: Missing or invalid biometric/authority token." 
    });
  }

  const { toolName, args } = req.body;

  try {
    if (toolName === "propose_file_change") {
      const targetPath = path.resolve(process.cwd(), args.filePath);
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, args.content, "utf-8");
      return res.json({ success: true, message: `File ${args.filePath} written successfully.` });
    }

    if (toolName === "propose_terminal_command") {
      const { stdout, stderr } = await execAsync(args.command, { cwd: process.cwd() });
      return res.json({ success: true, stdout, stderr });
    }

    return res.status(400).json({ error: "Unknown execution tool name." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

const VAULT_SERVER_FILE = path.resolve(process.cwd(), "possibilities_vault_server.json");

app.post("/api/vault/sync", async (req, res) => {
  try {
    const { payload } = req.body;
    if (!payload) return res.status(400).json({ error: "Missing payload" });
    await fs.writeFile(VAULT_SERVER_FILE, JSON.stringify(payload, null, 2), "utf-8");
    return res.json({ status: "ok", message: "Vault synced to server disk." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/vault/restore", async (req, res) => {
  try {
    if (!fsSync.existsSync(VAULT_SERVER_FILE)) {
      return res.status(404).json({ error: "No vault backup found on server." });
    }
    const content = await fs.readFile(VAULT_SERVER_FILE, "utf-8");
    const payload = JSON.parse(content);
    return res.json({ status: "ok", payload });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
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
    console.log(`Possibilities Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
