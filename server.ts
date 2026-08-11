import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Explicit CORS and JSON middleware for Capacitor Native & Web origins
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow any origin dynamically or fallback to '*'
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, DELETE, PATCH"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Capacitor-Platform, X-App-Version"
    );

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });
  app.use(express.json({ limit: '10mb' }));

  // Cloud Memory Vault Storage (Server-side persistence across APK reinstalls & web sessions)
  const vaultFilePath = path.join(process.cwd(), "possibilities_vault_server.json");

  app.post("/api/vault/sync", (req, res) => {
    try {
      const { payload } = req.body;
      if (payload) {
        fs.writeFileSync(vaultFilePath, JSON.stringify(payload, null, 2), "utf-8");
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
      if (fs.existsSync(vaultFilePath)) {
        const raw = fs.readFileSync(vaultFilePath, "utf-8");
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

  // Health check endpoint for API status
  app.get("/api/health", async (req, res) => {
    const clientKey = (req.headers['x-gemini-api-key'] as string) || (req.query?.apiKey as string);
    const apiKey = (clientKey && clientKey.trim() !== '') ? clientKey.trim() : process.env.GEMINI_API_KEY;
    const geminiKeyPresent = Boolean(
      apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== ""
    );

    let geminiConnection: "success" | "fail" | "not_checked" = "not_checked";

    // Only attempt live Gemini call if explicitly requested via query param
    if (req.query.checkGemini === 'true' && geminiKeyPresent) {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKey!,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
        const testResponse = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: "ping",
        });
        if (testResponse && testResponse.text) {
          geminiConnection = "success";
        }
      } catch (err) {
        console.warn("Diagnostics test call to Gemini failed:", err);
        geminiConnection = "fail";
      }
    } else if (geminiKeyPresent) {
      geminiConnection = "success";
    }

    res.json({
      status: "ok",
      alive: true,
      timestamp: Date.now(),
      geminiKeyPresent,
      geminiConnection,
      backendOnline: true,
    });
  });

  // Server-side Gemini API endpoint
  app.post("/api/gemini", async (req, res) => {
    try {
      const clientKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
      const apiKey = (clientKey && clientKey.trim() !== '') ? clientKey.trim() : process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        // Graceful fallback response if API key is not configured yet
        return res.json({
          text: "I am Possibilities, your intelligent living companion. (To enable full generative capacity, ensure GEMINI_API_KEY is set in client settings or host environment variables). How can I assist your objectives today?",
          fallback: true
        });
      }

      const { prompt, systemInstruction, history, attachments } = req.body;
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Prepare user parts including text prompt and any attached media (images, audio, video, files)
      const userParts: any[] = [{ text: String(prompt || '') }];

      const lowerPrompt = String(prompt || '').toLowerCase();
      if (
        lowerPrompt.includes('code') ||
        lowerPrompt.includes('source') ||
        lowerPrompt.includes('inspect') ||
        lowerPrompt.includes('fix') ||
        lowerPrompt.includes('bug') ||
        lowerPrompt.includes('yourself') ||
        lowerPrompt.includes('engine') ||
        lowerPrompt.includes('raw')
      ) {
        try {
          const keyFiles = [
            'src/utils/companionEngine.ts',
            'src/utils/memoryStore.ts',
            'src/utils/storageEngine.ts',
            'src/components/ChatView.tsx',
            'server.ts'
          ];
          let codeContext = "\n\n[POSSIBILITIES RAW SOURCE CODEBASE ACCESS]:\n";
          for (const f of keyFiles) {
            const fullPath = path.join(process.cwd(), f);
            if (fs.existsSync(fullPath)) {
              const src = fs.readFileSync(fullPath, 'utf-8');
              codeContext += `--- FILE: ${f} ---\n${src}\n\n`;
            }
          }
          userParts.push({ text: codeContext });
        } catch (e) {
          console.warn('Could not attach raw codebase context:', e);
        }
      }

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

      let contents: any = userParts;

      if (history && Array.isArray(history) && history.length > 0) {
        const rawList = [
          ...history.map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(h.text || '') }]
          })),
          { role: 'user', parts: userParts }
        ];

        // Sanitize history to ensure strict user/model role alternation for Gemini API
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
        if (sanitized.length > 0) {
          contents = sanitized;
        }
      }

      // Clean tool declarations with Function Declarations
      const toolDeclarations = [
        {
          functionDeclarations: [
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
            },
            {
              name: "export_vault_backup",
              description: "Triggers a zero-knowledge export and file download of Possibilities memory vault to a local .vault file.",
              parameters: {
                type: "OBJECT",
                properties: {
                  reasoning: { type: "STRING", description: "Creator request or automated backup rationale" }
                },
                required: ["reasoning"]
              }
            }
          ]
        }
      ];

      const config: any = {
        tools: toolDeclarations,
      };
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      let response: any;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: contents,
          config,
        });
      } catch (firstErr: any) {
        console.warn("Primary model attempt failed, falling back to gemini-2.0-flash:", firstErr?.message);
        response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: contents,
          config,
        });
      }

      const functionCalls = response.functionCalls || [];

      if ((response && response.text) || functionCalls.length > 0) {
        return res.json({
          text: response.text || "",
          functionCalls,
        });
      }

      throw new Error("No text response received from Gemini model.");
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return res.json({
        text: "Cloud AI connection issue: " + (error?.message || "Service error") + ". Local cognitive engine active.",
        fallback: true,
        error: error?.message || "Internal error"
      });
    }
  });

  // Vite middleware for development vs static serve for production
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
    console.log(`Possibilities Shell active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
